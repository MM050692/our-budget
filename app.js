const VERSION = 7;
const CURRENCIES = ['AED', 'MVR', 'INR', 'USD'];
const EXPENSE_CATEGORIES = [
  ['Housing', '🏠'], ['Food', '🍲'], ['Transport', '🚕'], ['Bills', '💡'],
  ['Health', '❤️'], ['Debt', '🧾'], ['Savings', '🌱'], ['Shopping', '🛍️'],
  ['Entertainment', '🎬'], ['Travel', '✈️'], ['Other', '•••']
];
const INCOME_CATEGORIES = ['Salary', 'Bonus', 'Side income', 'Gift', 'Refund', 'Other income'];
const METALS = [['XAU', 'Gold'], ['XAG', 'Silver'], ['XPT', 'Platinum'], ['XPD', 'Palladium']];
const CRYPTO = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['LTC', 'Litecoin'], ['XRP', 'XRP'], ['DOT', 'Polkadot'], ['ADA', 'Cardano']];
const DEFAULT = {
  version: VERSION,
  settings: {
    base: 'MVR', lastCurrency: 'MVR', rates: { USD: 1, AED: 3.6725, MVR: 15.42, INR: 88 },
    paydayDay: null, funMode: true, lastExpenseCategory: 'Food', lastExpenseAccountId: ''
  },
  member: { displayName: '', role: '' }, people: [],
  transactions: [],
  budgets: {
    Housing: { amount: 11500, currency: 'MVR' }, Food: { amount: 3000, currency: 'MVR' },
    Bills: { amount: 1500, currency: 'MVR' }, Transport: { amount: 1000, currency: 'MVR' },
    Shopping: { amount: 2000, currency: 'MVR' }, Other: { amount: 2000, currency: 'MVR' }
  },
  goals: [], debts: [], assets: [], accounts: [], recurring: [], contributions: [], snapshots: [], prices: {}
};

let state = structuredClone(DEFAULT);
let db = null;
let currentUser = null;
let householdId = null;
let stateKey = '';
let pendingKey = '';
let realtimeChannel = null;
let realtimeTimer = null;
let priceRefresh = null;
let currentPage = 'today';
let wealthChartMode = 'actual';
let timelineFilter = 'all';
let toastTimer = null;
let pendingQuickAction = new URLSearchParams(location.search).get('quick') || '';

const $ = id => document.getElementById(id);
const clone = value => structuredClone(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const safeParse = value => { try { return JSON.parse(value); } catch (_error) { return null; } };
const localDate = date => {
  const d = date || new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};
const today = () => localDate();
const monthKey = (date = today()) => date.slice(0, 7);
const monthStart = (date = today()) => `${monthKey(date)}-01`;
const cleanCurrency = value => String(value || '').trim();
const currencyOptions = selected => CURRENCIES.map(c => `<option${c === selected ? ' selected' : ''}>${c}</option>`).join('');

function normalizeState(raw) {
  const input = raw || {};
  const next = Object.assign(clone(DEFAULT), input);
  next.version = VERSION;
  next.settings = Object.assign({}, DEFAULT.settings, input.settings || {});
  next.settings.rates = Object.assign({}, DEFAULT.settings.rates, input.settings?.rates || {});
  next.settings.base = CURRENCIES.includes(next.settings.base) ? next.settings.base : 'MVR';
  next.settings.lastCurrency = CURRENCIES.includes(next.settings.lastCurrency) ? next.settings.lastCurrency : next.settings.base;
  next.member = Object.assign({}, DEFAULT.member, input.member || {});
  for (const key of ['people', 'transactions', 'goals', 'debts', 'assets', 'accounts', 'recurring', 'contributions', 'snapshots']) {
    next[key] = Array.isArray(next[key]) ? next[key] : [];
  }
  next.prices = next.prices && typeof next.prices === 'object' ? next.prices : {};
  const sourceBudgets = input.budgets && typeof input.budgets === 'object' ? input.budgets : DEFAULT.budgets;
  next.budgets = Object.fromEntries(Object.entries(sourceBudgets).map(([category, value]) => [
    category,
    typeof value === 'object'
      ? { amount: Number(value.amount) || 0, currency: cleanCurrency(value.currency) || next.settings.base }
      : { amount: Number(value) || 0, currency: next.settings.base }
  ]));
  return next;
}

function cache() {
  if (stateKey) localStorage.setItem(stateKey, JSON.stringify(state));
}

function loadScopedState() {
  stateKey = `our_budget_v7:${householdId}:${currentUser.id}`;
  pendingKey = `our_budget_pending_v7:${householdId}:${currentUser.id}`;
  const legacyStateKeys = [
    `our_budget_v5:${householdId}:${currentUser.id}`,
    `our_budget_v6:${householdId}:${currentUser.id}`,
    'our_budget_v4', 'our_budget_v3', 'our_budget_v2'
  ];
  const legacyPendingKeys = [
    `our_budget_pending_v5:${householdId}:${currentUser.id}`,
    `our_budget_pending_v6:${householdId}:${currentUser.id}`
  ];
  let raw = safeParse(localStorage.getItem(stateKey));
  if (!raw) {
    for (const key of legacyStateKeys) {
      raw = safeParse(localStorage.getItem(key));
      if (raw) break;
    }
  }
  if (!localStorage.getItem(pendingKey)) {
    for (const key of legacyPendingKeys) {
      const queued = safeParse(localStorage.getItem(key));
      if (Array.isArray(queued) && queued.length) {
        localStorage.setItem(pendingKey, JSON.stringify(queued));
        break;
      }
    }
  }
  state = normalizeState(raw);
  cache();
}

function pending() { return safeParse(localStorage.getItem(pendingKey)) || []; }
function savePending(items) {
  if (!pendingKey) return;
  if (items.length) localStorage.setItem(pendingKey, JSON.stringify(items));
  else localStorage.removeItem(pendingKey);
  updateSyncStatus();
}
function enqueue(operation) {
  const items = pending();
  items.push(Object.assign({ queueId: crypto.randomUUID(), createdAt: new Date().toISOString() }, operation));
  savePending(items);
}

function updateSyncStatus(message = '') {
  if (!$('syncStatus')) return;
  const count = pendingKey ? pending().length : 0;
  $('syncStatus').textContent = message || (count
    ? `${count} change${count === 1 ? '' : 's'} waiting to sync`
    : currentUser ? 'Synced between both phones' : 'Offline');
}

function usd(value, currency) {
  const rate = Number(state.settings.rates[cleanCurrency(currency)]) || 1;
  return Number(value || 0) / rate;
}
function fromUSD(value, currency) {
  const rate = Number(state.settings.rates[cleanCurrency(currency)]) || 1;
  return Number(value || 0) * rate;
}
function money(value, currency = state.settings.base) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch (_error) {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
}
function baseMoney(usdValue) { return money(fromUSD(usdValue, state.settings.base), state.settings.base); }
function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', options).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}
function rememberCurrency(currency) {
  if (!CURRENCIES.includes(currency)) return;
  state.settings.lastCurrency = currency;
  cache();
}
function accountName(id) { return state.accounts.find(a => a.id === id)?.name || ''; }
function activeAccounts() { return state.accounts.filter(a => a.active !== false); }
function activeGoals() { return state.goals.filter(g => g.active !== false); }
function activeDebts() { return state.debts.filter(d => d.active !== false || d.remaining > 0); }
function householdPeople() { return [...new Set([...state.people, state.member.displayName].map(name => String(name || '').trim()).filter(Boolean))]; }
function defaultPerson() { return state.member.displayName || 'Shared'; }
function peopleOptions(selected = defaultPerson()) {
  return [...new Set([...householdPeople(), 'Shared', selected].filter(Boolean))]
    .map(name => `<option${name === selected ? ' selected' : ''}>${esc(name)}</option>`).join('');
}

function toast(message) {
  const element = $('toast');
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.remove('hidden');
  toastTimer = setTimeout(() => element.classList.add('hidden'), 2600);
}
function celebrate() {
  if (!state.settings.funMode || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = $('confetti');
  const colors = ['#31846c', '#f1b94b', '#e96d5b', '#557fa3'];
  root.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="left:${5 + Math.random() * 90}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * .25}s;--drift:${-80 + Math.random() * 160}px"></i>`).join('');
  setTimeout(() => { root.innerHTML = ''; }, 1700);
}
function haptic() { if (navigator.vibrate) navigator.vibrate(18); }

function openModal(title, html) {
  $('modalTitle').textContent = title;
  $('modalContent').innerHTML = html;
  $('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('modalContent').querySelector('input:not([type="hidden"]), select, button')?.focus(), 80);
}
function closeModal() {
  $('modal').classList.add('hidden');
  $('modalContent').innerHTML = '';
  document.body.style.overflow = '';
}

async function runOperation(operation) {
  if (operation.action === 'delete') {
    return db.from(operation.table).delete().eq('id', operation.id).eq('household_id', householdId);
  }
  if (operation.action === 'budget') {
    return db.from('budgets').upsert(operation.rows, { onConflict: 'household_id,category' });
  }
  if (operation.action === 'snapshot') {
    return db.from('net_worth_snapshots').upsert(operation.row, { onConflict: 'household_id,snapshot_date' });
  }
  if (operation.action === 'settings') {
    return db.from('household_settings').upsert(operation.row, { onConflict: 'household_id' });
  }
  return db.from(operation.table).upsert(operation.row);
}

async function flushPending() {
  if (!db || !householdId || !navigator.onLine) return false;
  let items = pending();
  if (!items.length) { updateSyncStatus(); return true; }
  updateSyncStatus('Syncing saved changes…');
  while (items.length) {
    const operation = items[0];
    try {
      const { error } = await runOperation(operation);
      if (error) throw error;
      items.shift();
      savePending(items);
    } catch (error) {
      if (error?.code === '23505' && operation.row?.recurring_item_id) {
        items.shift();
        savePending(items);
        toast('This recurring item was already confirmed this month.');
        continue;
      }
      updateSyncStatus(`${items.length} change${items.length === 1 ? '' : 's'} waiting · ${error?.message || 'offline'}`);
      return false;
    }
  }
  updateSyncStatus();
  return true;
}

async function saveOperation(operation, options = {}) {
  enqueue(operation);
  cache();
  render();
  if (options.close !== false) closeModal();
  if (options.message) toast(options.message);
  if (options.celebrate) celebrate();
  haptic();
  if (await flushPending()) await loadRemote();
}

window.addEventListener('online', async () => {
  if (await flushPending()) await loadRemote();
});

function showPage(name) {
  currentPage = name;
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  $(`page-${name}`)?.classList.remove('hidden');
  document.querySelectorAll('.bottomNav button').forEach(button => button.classList.toggle('active', button.dataset.page === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
  if (name === 'money') refreshPrices(false);
}

async function boot() {
  const config = window.SUPABASE_CONFIG || {};
  if (!config.url || !config.anonKey) {
    $('authMessage').textContent = 'Supabase configuration is missing.';
    return;
  }
  db = window.supabase.createClient(config.url, config.anonKey);
  const { data: { session } } = await db.auth.getSession();
  if (session) await signedIn(session.user);
  else showAuth();
  db.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => {
      if (nextSession) signedIn(nextSession.user);
      else showAuth();
    }, 0);
  });
}

function showAuth() {
  if (realtimeChannel && db) db.removeChannel(realtimeChannel);
  currentUser = null;
  householdId = null;
  stateKey = '';
  pendingKey = '';
  state = clone(DEFAULT);
  $('authScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
}

$('authForm').onsubmit = async event => {
  event.preventDefault();
  $('authMessage').textContent = 'Signing in…';
  const { error } = await db.auth.signInWithPassword({ email: $('authEmail').value, password: $('authPassword').value });
  $('authMessage').textContent = error ? error.message : '';
};

async function signedIn(user) {
  if (currentUser?.id === user.id && householdId) return;
  currentUser = user;
  $('authScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  updateSyncStatus('Finding your household…');
  const { data: member, error } = await db.from('household_members')
    .select('household_id,display_name,role').eq('user_id', user.id).limit(1).maybeSingle();
  if (error || !member) {
    updateSyncStatus('Household not found');
    toast('This login is not attached to a household.');
    return;
  }
  householdId = member.household_id;
  loadScopedState();
  state.member = { displayName: member.display_name || 'Friend', role: member.role || 'member' };
  cache();
  await flushPending();
  await loadRemote();
  subscribeRealtime();
  showPage(currentPage);
  await refreshPrices(false);
  await ensureTodaySnapshot();
  handleQuickAction();
}

async function loadRemote() {
  if (!db || !householdId) return;
  const results = await Promise.all([
    db.from('transactions').select('*').eq('household_id', householdId),
    db.from('budgets').select('*').eq('household_id', householdId),
    db.from('goals').select('*').eq('household_id', householdId),
    db.from('debts').select('*').eq('household_id', householdId),
    db.from('assets').select('*').eq('household_id', householdId),
    db.from('accounts').select('*').eq('household_id', householdId),
    db.from('recurring_items').select('*').eq('household_id', householdId),
    db.from('goal_contributions').select('*').eq('household_id', householdId),
    db.from('net_worth_snapshots').select('*').eq('household_id', householdId).order('snapshot_date'),
    db.from('household_settings').select('*').eq('household_id', householdId).maybeSingle(),
    db.from('household_members').select('display_name').eq('household_id', householdId)
  ]);
  if (results.some(result => result.error)) {
    updateSyncStatus('Could not refresh · saved data kept');
    return;
  }
  if (pending().length) { updateSyncStatus(); return; }
  const [transactions, budgets, goals, debts, assets, accounts, recurring, contributions, snapshots, settings, members] = results.map(r => r.data);
  state.people = members.map(member => member.display_name).filter(Boolean);
  state.transactions = transactions.map(row => ({
    id: row.id, type: row.type, amount: +row.amount, currency: cleanCurrency(row.currency), category: row.category,
    paidBy: row.paid_by, accountId: row.account_id || '', account: row.account || '', toAccountId: row.to_account_id || '',
    toAmount: row.to_amount == null ? null : +row.to_amount, debtId: row.debt_id || '',
    debtPrincipal: row.debt_principal == null ? null : +row.debt_principal,
    debtInterest: row.debt_interest == null ? 0 : +row.debt_interest,
    recurringItemId: row.recurring_item_id || '', recurringMonth: row.recurring_month || '',
    date: row.date, note: row.note || '', createdAt: row.created_at || '', updatedAt: row.updated_at || ''
  }));
  state.budgets = Object.fromEntries(budgets.map(row => [row.category, { amount: +row.amount, currency: cleanCurrency(row.currency) }]));
  state.goals = goals.map(row => ({ id: row.id, name: row.name, target: +row.target, saved: +row.saved, currency: cleanCurrency(row.currency), due: row.due_date || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.debts = debts.map(row => ({ id: row.id, name: row.name, original: +row.original_amount, remaining: +row.remaining_amount, currency: cleanCurrency(row.currency), due: row.due_date || '', apr: +(row.annual_interest_rate || 0), minimum: +(row.minimum_payment || 0), paymentDay: row.payment_day || null, active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.assets = assets.map(row => ({ id: row.id, name: row.name, type: row.asset_type, symbol: row.symbol || '', quantity: +row.quantity, currency: cleanCurrency(row.currency), manualValue: row.manual_value == null ? null : +row.manual_value, notes: row.notes || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.accounts = accounts.map(row => ({ id: row.id, name: row.name, type: row.account_type, currency: cleanCurrency(row.currency), openingBalance: +row.opening_balance, openingDate: row.opening_date, notes: row.notes || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.recurring = recurring.map(row => ({ id: row.id, name: row.name, kind: row.kind, amount: +row.amount, currency: cleanCurrency(row.currency), category: row.category, paidBy: row.paid_by, accountId: row.account_id || '', day: row.day_of_month, note: row.note || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.contributions = contributions.map(row => ({ id: row.id, goalId: row.goal_id, accountId: row.account_id || '', amount: +row.amount, currency: cleanCurrency(row.currency), date: row.date, note: row.note || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.snapshots = snapshots.map(row => ({ id: row.id, date: row.snapshot_date, cashUSD: +row.cash_usd, assetsUSD: +row.assets_usd, debtUSD: +row.debt_usd, netWorthUSD: +row.net_worth_usd }));
  if (settings) {
    state.settings.base = cleanCurrency(settings.base_currency) || state.settings.base;
    state.settings.paydayDay = settings.payday_day || null;
    state.settings.funMode = settings.fun_mode !== false;
    state.settings.rates = {
      USD: 1,
      AED: +(settings.usd_to_aed || state.settings.rates.AED),
      MVR: +(settings.usd_to_mvr || state.settings.rates.MVR),
      INR: +(settings.usd_to_inr || state.settings.rates.INR)
    };
  }
  cache();
  render();
  updateSyncStatus();
}

function scheduleRemoteReload() {
  if (pending().length) return;
  clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(() => loadRemote(), 350);
}

function subscribeRealtime() {
  if (realtimeChannel) db.removeChannel(realtimeChannel);
  realtimeChannel = db.channel(`household-v7-${householdId}`);
  for (const table of ['transactions', 'budgets', 'goals', 'debts', 'assets', 'accounts', 'recurring_items', 'goal_contributions', 'net_worth_snapshots', 'household_settings']) {
    realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` }, scheduleRemoteReload);
  }
  realtimeChannel.subscribe(status => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') updateSyncStatus('Realtime reconnecting…');
  });
}

function handleQuickAction() {
  if (!pendingQuickAction) return;
  const action = pendingQuickAction;
  pendingQuickAction = '';
  history.replaceState({}, '', `${location.pathname}${location.hash || ''}`);
  if (action === 'expense') openQuickExpense();
  else if (action === 'income') openTransaction('income', null, { category: 'Salary' });
  else if (action === 'transfer') openTransfer();
}

function accountDeltaNative(account, transaction) {
  if (transaction.type === 'transfer') {
    if (transaction.accountId === account.id) return -Number(transaction.amount || 0);
    if (transaction.toAccountId === account.id) return Number(transaction.toAmount || 0);
    return 0;
  }
  if (transaction.accountId !== account.id) return 0;
  return (transaction.type === 'income' ? 1 : -1) * Number(transaction.amount || 0);
}

function accountBalanceNative(account) {
  return Number(account.openingBalance || 0) + state.transactions
    .filter(transaction => transaction.date >= (account.openingDate || '0000-00-00'))
    .reduce((sum, transaction) => sum + accountDeltaNative(account, transaction), 0);
}
function accountBalanceUSD(account) { return usd(accountBalanceNative(account), account.currency); }
function accountTypeLabel(type) { return type === 'bank' ? 'Bank account' : type === 'cash' ? 'Cash' : 'Mobile wallet'; }

function assetUSD(asset) {
  if (asset.type === 'cash') return usd(asset.quantity, asset.currency);
  if (asset.type === 'manual') return usd(asset.manualValue || 0, asset.currency);
  const price = state.prices[asset.symbol]?.usd;
  if (!price) return 0;
  if (asset.type === 'metal') return (Number(asset.quantity) / 31.1034768) * price;
  if (asset.type === 'crypto') return Number(asset.quantity) * price;
  return 0;
}

function marketLabel(asset) {
  if (asset.type === 'metal') return `${Number(asset.quantity).toLocaleString()} g · ${asset.symbol}`;
  if (asset.type === 'crypto') return `${Number(asset.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${asset.symbol}`;
  if (asset.type === 'cash') return money(asset.quantity, asset.currency);
  return money(asset.manualValue || 0, asset.currency);
}

function monthTransactions() {
  const currentMonth = monthKey();
  return state.transactions.filter(transaction =>
    transaction.date.startsWith(currentMonth) &&
    transaction.type !== 'transfer' &&
    transaction.category !== 'Balance adjustment'
  );
}

function moneyMetrics() {
  const monthTx = monthTransactions();
  const incomeUSD = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const spentUSD = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const accountTotalUSD = activeAccounts().reduce((sum, account) => sum + accountBalanceUSD(account), 0);
  const unassignedCashUSD = state.transactions
    .filter(t => !t.accountId && t.type !== 'transfer')
    .reduce((sum, t) => sum + (t.type === 'income' ? 1 : -1) * usd(t.amount, t.currency), 0);
  const cashUSD = accountTotalUSD + unassignedCashUSD;
  const assetsUSD = state.assets.reduce((sum, asset) => sum + assetUSD(asset), 0);
  const debtUSD = state.debts.reduce((sum, debt) => sum + usd(debt.remaining, debt.currency), 0);
  const goalSavedUSD = activeGoals().reduce((sum, goal) => sum + usd(goal.saved, goal.currency), 0);
  const goalTargetUSD = activeGoals().reduce((sum, goal) => sum + usd(goal.target, goal.currency), 0);
  const budgetUSD = Object.values(state.budgets).reduce((sum, budget) => sum + usd(budget.amount, budget.currency), 0);
  return {
    monthTx, incomeUSD, spentUSD, accountTotalUSD, unassignedCashUSD, cashUSD, assetsUSD, debtUSD,
    goalSavedUSD, goalTargetUSD, budgetUSD, surplusUSD: incomeUSD - spentUSD,
    spendableUSD: cashUSD - goalSavedUSD, netWorthUSD: cashUSD + assetsUSD - debtUSD
  };
}

function allocationBuckets(metrics = moneyMetrics()) {
  const expenseFor = categories => metrics.monthTx
    .filter(t => t.type === 'expense' && categories.includes(t.category))
    .reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const futureContributionsUSD = state.contributions
    .filter(c => c.date.startsWith(monthKey()))
    .reduce((sum, c) => sum + usd(c.amount, c.currency), 0);
  return [
    { key: 'essential', label: 'Essentials', pct: 40, target: metrics.incomeUSD * .4, actual: expenseFor(['Housing', 'Food', 'Transport', 'Bills', 'Health']) },
    { key: 'debt', label: 'Debt freedom', pct: 30, target: metrics.incomeUSD * .3, actual: expenseFor(['Debt']) },
    { key: 'future', label: 'Future', pct: 20, target: metrics.incomeUSD * .2, actual: expenseFor(['Savings']) + futureContributionsUSD },
    { key: 'wants', label: 'Fun & wants', pct: 10, target: metrics.incomeUSD * .1, actual: expenseFor(['Shopping', 'Entertainment', 'Travel', 'Other']) }
  ];
}

function nextPaydayInfo() {
  const day = Number(state.settings.paydayDay);
  if (!(day >= 1 && day <= 31)) return null;
  const now = new Date(`${today()}T12:00:00`);
  const makePayday = (year, month) => {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, last), 12);
  };
  let date = makePayday(now.getFullYear(), now.getMonth());
  if (date < now) date = makePayday(now.getFullYear(), now.getMonth() + 1);
  const days = Math.max(1, Math.round((date - now) / 86400000) + 1);
  return { date: localDate(date), days };
}

function safeSpendPlan(metrics = moneyMetrics(), buckets = allocationBuckets(metrics)) {
  const payday = nextPaydayInfo();
  if (!(metrics.incomeUSD > 0) || !payday) return { ready: false, dailyUSD: 0, weeklyUSD: 0, payday };
  const wants = buckets.find(bucket => bucket.key === 'wants');
  const remainingUSD = Math.max(0, wants.target - wants.actual);
  const dailyUSD = remainingUSD / payday.days;
  return { ready: true, dailyUSD, weeklyUSD: dailyUSD * Math.min(7, payday.days), payday, remainingUSD };
}

async function refreshPrices(force = false) {
  if (priceRefresh) return priceRefresh;
  priceRefresh = (async () => {
    const defaults = ['XAU', 'XAG', 'BTC', 'ETH'];
    const owned = state.assets.filter(a => ['metal', 'crypto'].includes(a.type)).map(a => a.symbol).filter(Boolean);
    const symbols = [...new Set([...defaults, ...owned])];
    if ($('priceStatus')) $('priceStatus').textContent = 'Refreshing free market prices…';
    await Promise.allSettled(symbols.map(async symbol => {
      const cached = state.prices[symbol];
      if (!force && cached && Date.now() - new Date(cached.updated).getTime() < 15 * 60 * 1000) return;
      try {
        const response = await fetch(`https://api.gold-api.com/price/${encodeURIComponent(symbol)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const price = Number(payload.price);
        if (Number.isFinite(price) && price > 0) {
          state.prices[symbol] = { usd: price, updated: payload.updatedAt || new Date().toISOString(), source: 'Gold API' };
        }
      } catch (_error) { /* Cached values remain available offline. */ }
    }));
    cache();
    render();
    const newest = Object.values(state.prices).map(p => new Date(p.updated).getTime()).filter(Number.isFinite).sort((a, b) => b - a)[0];
    if ($('priceStatus')) {
      const stale = newest && Date.now() - newest > 60 * 60 * 1000;
      $('priceStatus').textContent = newest
        ? `${stale ? 'Last saved prices' : 'Prices updated'} ${new Date(newest).toLocaleString()}`
        : 'Live prices unavailable; market assets are excluded for now.';
    }
  })();
  try { return await priceRefresh; }
  finally { priceRefresh = null; }
}

async function ensureTodaySnapshot() {
  if (!db || !householdId || pending().length) return;
  const missingMarketPrice = state.assets.some(a => ['metal', 'crypto'].includes(a.type) && !state.prices[a.symbol]?.usd);
  if (missingMarketPrice) return;
  const metrics = moneyMetrics();
  const existing = state.snapshots.find(snapshot => snapshot.date === today());
  if (existing && Math.abs(existing.netWorthUSD - metrics.netWorthUSD) < .005 &&
      Math.abs(existing.cashUSD - metrics.cashUSD) < .005 && Math.abs(existing.debtUSD - metrics.debtUSD) < .005) return;
  const row = {
    household_id: householdId, snapshot_date: today(), cash_usd: metrics.cashUSD,
    assets_usd: metrics.assetsUSD, debt_usd: metrics.debtUSD, net_worth_usd: metrics.netWorthUSD
  };
  const { error } = await runOperation({ action: 'snapshot', row });
  if (!error) {
    const local = { id: existing?.id || crypto.randomUUID(), date: today(), cashUSD: metrics.cashUSD, assetsUSD: metrics.assetsUSD, debtUSD: metrics.debtUSD, netWorthUSD: metrics.netWorthUSD };
    const index = state.snapshots.findIndex(snapshot => snapshot.date === today());
    if (index >= 0) state.snapshots[index] = local;
    else state.snapshots.push(local);
    cache();
    render();
  }
}

function txIcon(transaction) {
  if (transaction.type === 'transfer') return '⇄';
  if (transaction.debtId) return '🧾';
  return EXPENSE_CATEGORIES.find(([category]) => category === transaction.category)?.[1] || (transaction.type === 'income' ? '↑' : '•');
}

function transactionHtml(transaction, actions = false) {
  const source = accountName(transaction.accountId) || transaction.account;
  const destination = accountName(transaction.toAccountId);
  const accountLine = transaction.type === 'transfer'
    ? `${source || 'Account'} → ${destination || 'Account'}`
    : source ? source : 'Not linked to an account';
  const amount = transaction.type === 'transfer'
    ? `${money(transaction.amount, transaction.currency)} → ${money(transaction.toAmount, state.accounts.find(a => a.id === transaction.toAccountId)?.currency || transaction.currency)}`
    : `${transaction.type === 'income' ? '+' : '−'} ${money(transaction.amount, transaction.currency)}`;
  return `<div class="tx ${transaction.type}">
    <div class="txLeft"><div class="txIcon">${txIcon(transaction)}</div><div class="txMain">
      <div class="txName">${esc(transaction.category)}</div>
      <div class="meta">${esc(transaction.date)} · ${esc(accountLine)}${transaction.note ? ` · ${esc(transaction.note)}` : ''}</div>
      ${actions ? `<div class="cardActions"><button class="linkBtn" onclick="editTransaction('${transaction.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${transaction.id}')">Delete</button></div>` : ''}
    </div></div><div class="txAmount ${transaction.type}">${amount}</div>
  </div>`;
}

function actualChartHtml(metrics) {
  const pointsData = [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (!pointsData.length) return '<div class="emptyChart"><b>Your honest starting point begins today</b><span>The app will save one net-worth point per day automatically.</span></div>';
  const values = pointsData.map(point => point.netWorthUSD);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(1, high - low);
  const count = Math.max(1, pointsData.length - 1);
  const coords = pointsData.map((point, index) => ({ x: 42 + index * (556 / count), y: 164 - ((point.netWorthUSD - low) / range) * 118 }));
  if (coords.length === 1) coords[0].x = 320;
  const points = coords.map(point => `${point.x},${point.y}`).join(' ');
  const areaPoints = coords.length === 1 ? `42,164 320,${coords[0].y} 598,164` : `42,164 ${points} 598,164`;
  const zeroY = 164 - ((0 - low) / range) * 118;
  return `<div class="chartLabels"><div><span>First point · ${formatDate(pointsData[0].date, { day: 'numeric', month: 'short' })}</span><b>${baseMoney(pointsData[0].netWorthUSD)}</b></div><div><span>Today</span><b>${baseMoney(metrics.netWorthUSD)}</b></div></div>
    <svg class="wealthSvg" viewBox="0 0 640 195" role="img" aria-label="Actual household net worth history">
      <defs><linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31846c" stop-opacity=".28"/><stop offset="1" stop-color="#31846c" stop-opacity=".02"/></linearGradient></defs>
      <line x1="42" y1="${zeroY}" x2="598" y2="${zeroY}" class="chartZero"/>
      <polygon points="${areaPoints}" class="chartArea"/>
      ${coords.length > 1 ? `<polyline points="${points}" class="chartLine"/>` : ''}
      ${coords.map(point => `<circle cx="${point.x}" cy="${point.y}" r="5" class="chartPoint"/>`).join('')}
      <text x="42" y="188">${esc(pointsData[0].date.slice(5))}</text><text x="598" y="188" text-anchor="end">${esc(pointsData.at(-1).date.slice(5))}</text>
    </svg><div class="chartFoot">Actual values use your entered account balances, assets, market prices and debt.</div>`;
}

function projectionChartHtml(metrics) {
  if (!(metrics.incomeUSD > 0)) return '<div class="emptyChart"><b>Add salary to see a one-year direction</b><span>The projection uses 30% for debt and 20% for savings and goals.</span></div>';
  const monthlyGrowthUSD = metrics.incomeUSD * .5;
  const values = Array.from({ length: 13 }, (_, index) => metrics.netWorthUSD + monthlyGrowthUSD * index);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(1, high - low);
  const coords = values.map((value, index) => ({ x: 42 + index * (556 / 12), y: 164 - ((value - low) / range) * 118 }));
  const points = coords.map(point => `${point.x},${point.y}`).join(' ');
  const zeroY = 164 - ((0 - low) / range) * 118;
  return `<div class="chartLabels"><div><span>Now</span><b>${baseMoney(metrics.netWorthUSD)}</b></div><div><span>In 12 months</span><b>${baseMoney(values.at(-1))}</b></div></div>
    <svg class="wealthSvg" viewBox="0 0 640 195" role="img" aria-label="Projected household net worth for twelve months">
      <defs><linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31846c" stop-opacity=".28"/><stop offset="1" stop-color="#31846c" stop-opacity=".02"/></linearGradient></defs>
      <line x1="42" y1="${zeroY}" x2="598" y2="${zeroY}" class="chartZero"/>
      <polygon points="42,164 ${points} 598,164" class="chartArea"/><polyline points="${points}" class="chartLine"/>
      <circle cx="${coords[0].x}" cy="${coords[0].y}" r="5" class="chartPoint"/><circle cx="${coords.at(-1).x}" cy="${coords.at(-1).y}" r="6" class="chartPoint"/>
      <text x="42" y="188">NOW</text><text x="598" y="188" text-anchor="end">12 MONTHS</text>
    </svg><div class="chartFoot">Direction only: assumes 30% of monthly income reduces debt and 20% grows savings. Interest and market changes are not predicted.</div>`;
}

function setWealthChart(mode) {
  wealthChartMode = mode;
  render();
}

function buildSuggestions(metrics, buckets) {
  const suggestions = [];
  const essentialsBudgetUSD = Object.entries(state.budgets)
    .filter(([category]) => ['Housing', 'Food', 'Transport', 'Bills', 'Health'].includes(category))
    .reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  if (!activeAccounts().length) {
    suggestions.push(['Add your real bank balance', 'Start with the amount currently in the bank. Salary and spending will then update it automatically.']);
  }
  if (!(metrics.incomeUSD > 0)) {
    suggestions.push(['Add this month’s salary', 'That unlocks your safe daily spending amount and exact 40–30–20–10 targets.']);
  }
  if (metrics.debtUSD > 0) {
    if (metrics.incomeUSD > 0) {
      const monthly = metrics.incomeUSD * .3;
      suggestions.push(['Give debt its 30%', `Aim for ${baseMoney(monthly)} this month and put extra toward the highest-interest balance first.`]);
    } else {
      suggestions.push(['Debt gets the next 30%', 'Once salary is entered, the Plan page will turn 30% into a simple payment amount.']);
    }
  }
  if (metrics.goalSavedUSD > metrics.cashUSD) {
    suggestions.push(['Check reserved savings', `Goals currently reserve ${baseMoney(metrics.goalSavedUSD - metrics.cashUSD)} more than tracked cash. Update an account balance or reduce the goal amount.`]);
  }
  const emergencyTargetUSD = essentialsBudgetUSD * 3;
  const emergencyGoal = activeGoals().find(goal => /emergency/i.test(goal.name));
  const emergencySavedUSD = emergencyGoal ? usd(emergencyGoal.saved, emergencyGoal.currency) : 0;
  if (emergencyTargetUSD > 0 && emergencySavedUSD < emergencyTargetUSD) {
    suggestions.push(['Build a 3-month safety cushion', `Based on essential limits, the first target is ${baseMoney(emergencyTargetUSD)}. Keep it in an accessible account.`]);
  }
  const wants = buckets.find(bucket => bucket.key === 'wants');
  if (metrics.incomeUSD > 0 && wants.actual > wants.target) {
    suggestions.push(['Pause fun spending briefly', `Wants are ${baseMoney(wants.actual - wants.target)} over the 10% guide this month.`]);
  }
  if (activeGoals().length) {
    const goal = activeGoals().find(item => item.saved < item.target);
    if (goal?.due) {
      const months = Math.max(1, Math.ceil((new Date(`${goal.due}T12:00:00`) - new Date(`${today()}T12:00:00`)) / (86400000 * 30.44)));
      const monthly = Math.max(0, goal.target - goal.saved) / months;
      suggestions.push([`Keep ${goal.name} moving`, `${money(monthly, goal.currency)} a month reaches the current target date, if the date and balance stay unchanged.`]);
    }
  }
  if (!suggestions.length) suggestions.push(['Keep the rhythm', 'Record spending, confirm recurring items and check your Money page together once a week.']);
  return suggestions.slice(0, 4);
}

function payoffEstimate(debt, incomeUSD) {
  if (!(incomeUSD > 0) || !(debt.remaining > 0)) return null;
  const monthly = Math.max(Number(debt.minimum || 0), fromUSD(incomeUSD * .3, debt.currency));
  let balance = Number(debt.remaining);
  const rate = Number(debt.apr || 0) / 1200;
  if (monthly <= balance * rate) return { months: Infinity, monthly };
  let months = 0;
  while (balance > .005 && months < 600) {
    balance = Math.max(0, balance + balance * rate - monthly);
    months += 1;
  }
  return { months, monthly };
}

function timelineEvents() {
  const events = [];
  state.transactions.forEach(transaction => {
    const destination = accountName(transaction.toAccountId);
    events.push({
      date: transaction.date,
      group: 'money',
      kind: transaction.type,
      title: transaction.type === 'transfer' ? `Transfer to ${destination || 'account'}` : transaction.category,
      detail: transaction.type === 'transfer'
        ? `${money(transaction.amount, transaction.currency)} sent · ${money(transaction.toAmount, state.accounts.find(a => a.id === transaction.toAccountId)?.currency || transaction.currency)} received`
        : `${transaction.type === 'income' ? '+' : '−'} ${money(transaction.amount, transaction.currency)} · ${transaction.paidBy}`,
      id: transaction.id,
      action: 'transaction'
    });
    if (transaction.debtId && transaction.debtPrincipal) {
      const debt = state.debts.find(item => item.id === transaction.debtId);
      events.push({ date: transaction.date, group: 'wins', kind: 'win', title: `${debt?.name || 'Debt'} reduced`, detail: `${money(transaction.debtPrincipal, debt?.currency || transaction.currency)} principal cleared` });
    }
  });
  state.accounts.forEach(account => events.push({ date: account.openingDate, group: 'money', kind: 'account', title: `${account.name} tracking started`, detail: `Opening balance ${money(account.openingBalance, account.currency)}` }));
  state.assets.forEach(asset => asset.createdAt && events.push({ date: asset.createdAt.slice(0, 10), group: 'money', kind: 'asset', title: `${asset.name} added`, detail: `Asset · ${baseMoney(assetUSD(asset))}` }));
  state.debts.forEach(debt => {
    if (debt.createdAt) events.push({ date: debt.createdAt.slice(0, 10), group: 'plans', kind: 'debt', title: `${debt.name} added`, detail: `${money(debt.remaining, debt.currency)} remaining` });
    if (debt.due && debt.active !== false) events.push({ date: debt.due, group: 'plans', kind: 'debt', title: `${debt.name} target date`, detail: `${money(debt.remaining, debt.currency)} remaining` });
  });
  state.goals.forEach(goal => {
    if (goal.createdAt) events.push({ date: goal.createdAt.slice(0, 10), group: 'plans', kind: 'goal', title: `${goal.name} goal added`, detail: `${money(goal.saved, goal.currency)} saved` });
    if (goal.due && goal.active !== false) events.push({ date: goal.due, group: 'plans', kind: 'goal', title: `${goal.name} target date`, detail: `Goal ${money(goal.target, goal.currency)}` });
  });
  state.contributions.forEach(contribution => {
    const goal = state.goals.find(item => item.id === contribution.goalId);
    events.push({ date: contribution.date, group: 'wins', kind: 'win', title: `${goal?.name || 'Goal'} grew`, detail: `+ ${money(contribution.amount, contribution.currency)} reserved` });
  });
  state.recurring.filter(item => item.active !== false).forEach(item => events.push({ date: `${monthKey()}-${String(Math.min(item.day, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())).padStart(2, '0')}`, group: 'plans', kind: 'recurring', title: item.name, detail: `Monthly ${item.kind} · ${money(item.amount, item.currency)}` }));
  const budgetUSD = Object.values(state.budgets).reduce((sum, budget) => sum + usd(budget.amount, budget.currency), 0);
  if (budgetUSD > 0) events.push({ date: monthStart(), group: 'plans', kind: 'budget', title: 'Monthly category plan', detail: baseMoney(budgetUSD) });
  state.snapshots.forEach(snapshot => events.push({ date: snapshot.date, group: 'wins', kind: 'snapshot', title: 'Net worth check-in', detail: baseMoney(snapshot.netWorthUSD) }));
  const now = today();
  return events.filter(event => event.date && (timelineFilter === 'all' || event.group === timelineFilter)).sort((a, b) => {
    const aFuture = a.date > now;
    const bFuture = b.date > now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return aFuture ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
}

function timelineHtml() {
  const events = timelineEvents();
  if (!events.length) return '<div class="card hint">Nothing in this view yet. Your actions and plans will appear automatically.</div>';
  return events.slice(0, 150).map(event => `<div class="timelineItem">
    <div class="timelineDot ${event.kind}"></div><div class="timelineBody">
      <div class="timelineDate">${esc(formatDate(event.date))}${event.date > today() ? ' · upcoming' : ''}</div>
      <div class="timelineTitle">${esc(event.title)}</div><div class="meta">${esc(event.detail)}</div>
      ${event.action === 'transaction' ? `<div class="cardActions"><button class="linkBtn" onclick="editTransaction('${event.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${event.id}')">Delete</button></div>` : ''}
    </div></div>`).join('');
}

function setTimelineFilter(filter) {
  timelineFilter = filter;
  render();
}

function render() {
  if (!$('app')) return;
  const metrics = moneyMetrics();
  const buckets = allocationBuckets(metrics);
  const safe = safeSpendPlan(metrics, buckets);
  const name = state.member.displayName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('greeting').textContent = `Our Budget · ${name}`;
  $('todayDate').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  $('todayHello').textContent = `${greeting}, ${name}`;
  $('trackingBadge').textContent = pending().length ? 'Saving offline' : 'Together ✓';
  $('trackingBadge').className = `statusBadge${pending().length ? ' warn' : ''}`;

  $('safeToday').textContent = safe.ready ? baseMoney(safe.dailyUSD) : 'Not ready yet';
  $('safeWeek').textContent = safe.ready ? baseMoney(safe.weeklyUSD) : '—';
  $('nextPayday').textContent = safe.payday ? formatDate(safe.payday.date, { day: 'numeric', month: 'short' }) : 'Not set';
  $('safeMessage').textContent = safe.ready
    ? `${baseMoney(safe.remainingUSD)} of this month’s 10% fun allowance remains. This daily guide lasts until payday.`
    : metrics.incomeUSD > 0 ? 'Set the salary day in Settings to calculate a safe daily fun amount.' : 'Add salary and set the salary day to calculate this safely.';
  $('todayCash').textContent = baseMoney(metrics.cashUSD);
  $('todayReserved').textContent = baseMoney(metrics.goalSavedUSD);
  $('todaySurplus').textContent = baseMoney(metrics.surplusUSD);
  $('todayAllocation').innerHTML = buckets.map(bucket => `<div class="bucket ${bucket.key}"><span>${bucket.pct}% ${esc(bucket.label)}</span><b>${baseMoney(bucket.target)}</b><small>${baseMoney(bucket.actual)} used</small></div>`).join('');

  const currentRecurringMonth = monthStart();
  const dueItems = state.recurring.filter(item => item.active !== false).sort((a, b) => a.day - b.day);
  const currentMonthLastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  $('dueList').innerHTML = dueItems.length ? dueItems.map(item => {
    const done = state.transactions.some(t => t.recurringItemId === item.id && t.recurringMonth === currentRecurringMonth);
    const dueDate = `${monthKey()}-${String(Math.min(item.day, currentMonthLastDay)).padStart(2, '0')}`;
    return `<div class="dueItem${done ? ' done' : ''}"><div class="dueIcon">${done ? '✓' : item.kind === 'income' ? '↑' : '○'}</div><div class="dueBody"><b>${esc(item.name)}</b><span>${money(item.amount, item.currency)} · due ${formatDate(dueDate, { day: 'numeric', month: 'short' })}</span></div><button ${done ? 'disabled' : `onclick="confirmRecurring('${item.id}')"`}>${done ? 'Done' : 'Confirm'}</button></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No monthly checklist yet</b><span>Add salary, rent or bills once, then confirm them each month.</span><button class="secondary compact" onclick="openRecurringForm()">＋ Add regular item</button></div>';

  const sortedTransactions = [...state.transactions].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  $('recentList').innerHTML = sortedTransactions.length ? sortedTransactions.slice(0, 6).map(t => transactionHtml(t)).join('') : '<div class="hint" style="padding:16px 0">No activity yet. Add salary or a spend to begin.</div>';

  $('netWorth').textContent = baseMoney(metrics.netWorthUSD);
  $('moneyCash').textContent = baseMoney(metrics.cashUSD);
  $('moneyAssets').textContent = baseMoney(metrics.assetsUSD);
  $('moneyDebt').textContent = baseMoney(metrics.debtUSD);
  $('moneySpendable').textContent = baseMoney(metrics.spendableUSD);
  $('netWorthMood').textContent = metrics.netWorthUSD < 0 ? '🧗' : metrics.debtUSD > 0 ? '🌱' : '🌳';
  $('wealthMessage').textContent = metrics.netWorthUSD < 0
    ? 'Every principal payment lifts this number. You are moving, not stuck.'
    : metrics.debtUSD > 0 ? 'Your assets are growing while you work toward debt freedom.'
      : metrics.netWorthUSD > 0 ? 'You are building real momentum together.' : 'Add your real balances to see your starting point.';
  $('actualChartButton').classList.toggle('active', wealthChartMode === 'actual');
  $('projectionChartButton').classList.toggle('active', wealthChartMode === 'projection');
  $('wealthChart').innerHTML = wealthChartMode === 'actual' ? actualChartHtml(metrics) : projectionChartHtml(metrics);

  const accountCards = activeAccounts().map(account => {
    const native = accountBalanceNative(account);
    const converted = account.currency === state.settings.base ? '' : baseMoney(usd(native, account.currency));
    return `<div class="accountCard"><div class="cardTop"><div><span class="accountBadge">${esc(accountTypeLabel(account.type))}</span><h3>${esc(account.name)}</h3><div class="meta">Since ${esc(account.openingDate)}${account.notes ? ` · ${esc(account.notes)}` : ''}</div></div><div class="value">${money(native, account.currency)}${converted ? `<div class="meta">${converted}</div>` : ''}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAccountStatement('${account.id}')">Statement</button><button class="linkBtn" onclick="reconcileAccount('${account.id}')">Correct balance</button><button class="linkBtn" onclick="openAccountForm('${account.id}')">Edit</button><button class="dangerLink" onclick="archiveAccount('${account.id}')">Archive</button></div></div>`;
  });
  if (Math.abs(metrics.unassignedCashUSD) > .005 || state.transactions.some(t => !t.accountId && t.type !== 'transfer')) {
    const count = state.transactions.filter(t => !t.accountId && t.type !== 'transfer').length;
    accountCards.push(`<div class="accountCard unassigned"><div class="cardTop"><div><span class="accountBadge">Not linked</span><h3>Older entries</h3><div class="meta">${count} record${count === 1 ? '' : 's'} without an account. They still count in Money available.</div></div><div class="value">${baseMoney(metrics.unassignedCashUSD)}</div></div></div>`);
  }
  $('accountList').innerHTML = accountCards.length ? accountCards.join('') : '<div class="card friendlyEmpty"><b>Start with the bank</b><span>Add today’s real balance, then choose this account for salary and spending.</span><button class="secondary compact" onclick="openAccountForm()">＋ Add account</button></div>';

  $('assetTotal').textContent = baseMoney(metrics.assetsUSD);
  $('marketStrip').innerHTML = ['XAU', 'XAG', 'BTC', 'ETH'].map(symbol => {
    const price = state.prices[symbol];
    return `<div class="quote"><span>${symbol}${['XAU', 'XAG'].includes(symbol) ? ' / oz' : ''}</span><b>${price ? money(price.usd, 'USD') : '—'}</b></div>`;
  }).join('');
  $('assetList').innerHTML = state.assets.length ? state.assets.map(asset => {
    const value = assetUSD(asset);
    const missing = ['metal', 'crypto'].includes(asset.type) && !state.prices[asset.symbol];
    return `<div class="assetCard"><div class="cardTop"><div><h3>${esc(asset.name)}</h3><div class="meta">${esc(marketLabel(asset))}${asset.notes ? ` · ${esc(asset.notes)}` : ''}</div>${asset.type === 'cash' ? '<div class="meta legacyNote">Legacy cash asset: move this to Accounts when convenient.</div>' : ''}${missing ? '<div class="meta">Waiting for a live price; excluded from total for now.</div>' : ''}</div><div class="value">${baseMoney(value)}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAssetForm('${asset.id}')">Edit</button><button class="dangerLink" onclick="deleteAsset('${asset.id}')">Delete</button></div></div>`;
  }).join('') : '<div class="card hint">No other assets yet. Bank balances belong in Accounts above.</div>';
  const suggestions = buildSuggestions(metrics, buckets);
  $('moneySuggestions').innerHTML = suggestions.map(([title, body], index) => `<div class="adviceCard"><span class="adviceNumber">${index + 1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join('');

  $('planIncome').textContent = metrics.incomeUSD > 0 ? `${baseMoney(metrics.incomeUSD)} income` : 'Add salary';
  $('planIncome').className = `statusBadge${metrics.incomeUSD > 0 ? '' : ' warn'}`;
  $('planAllocation').innerHTML = buckets.map(bucket => `<div class="allocationItem ${bucket.key}"><div class="allocationHeading"><span class="allocationColor"></span><b>${bucket.pct}% ${esc(bucket.label)}</b></div><div class="allocationTarget">${baseMoney(bucket.target)}</div><div class="allocationActual">Used ${baseMoney(bucket.actual)}</div></div>`).join('');

  const essentialsBudgetUSD = Object.entries(state.budgets).filter(([category]) => ['Housing', 'Food', 'Transport', 'Bills', 'Health'].includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  const emergencyThreeUSD = essentialsBudgetUSD * 3;
  const emergencySixUSD = essentialsBudgetUSD * 6;
  const emergencyGoal = activeGoals().find(goal => /emergency/i.test(goal.name));
  const emergencySavedUSD = emergencyGoal ? usd(emergencyGoal.saved, emergencyGoal.currency) : 0;
  $('emergencyFundCard').innerHTML = `<div class="emergencyTop"><div class="emergencyIcon">☂️</div><div><h3>Emergency fund</h3><p>Based on essential category limits of ${baseMoney(essentialsBudgetUSD)} a month. Start with 3 months, then grow toward 6.</p></div></div><div class="emergencyNumbers"><div><span>First target · 3 months</span><b>${baseMoney(emergencyThreeUSD)}</b></div><div><span>Strong target · 6 months</span><b>${baseMoney(emergencySixUSD)}</b></div></div><div class="progress" style="margin-top:11px"><i style="width:${Math.min(100, emergencySavedUSD / Math.max(.01, emergencyThreeUSD) * 100)}%"></i></div><div class="cardActions" style="margin-top:10px">${emergencyGoal ? `<button class="linkBtn" onclick="openGoalContribution('${emergencyGoal.id}')">＋ Add saving</button>` : `<button class="linkBtn" onclick="createEmergencyGoal()">Create this goal</button>`}</div>`;

  const debts = activeDebts().filter(debt => debt.active !== false || debt.remaining > 0);
  $('debtList').innerHTML = debts.length ? debts.map(debt => {
    const progress = Math.max(0, Math.min(100, (1 - debt.remaining / Math.max(debt.original, .01)) * 100));
    const estimate = payoffEstimate(debt, metrics.incomeUSD);
    const estimateText = !estimate ? 'Add salary for a payoff estimate' : estimate.months === Infinity ? 'Payment must exceed monthly interest' : `About ${estimate.months} month${estimate.months === 1 ? '' : 's'} if this gets the full 30%`;
    return `<div class="debtCard"><div class="cardTop"><div><h3>${esc(debt.name)}</h3><div class="meta">${money(debt.remaining, debt.currency)} left of ${money(debt.original, debt.currency)}${debt.apr ? ` · ${debt.apr}% APR` : ''}</div><div class="meta">${esc(estimateText)}</div></div><span class="pill${debt.remaining <= 0 ? '' : ' warn'}">${Math.round(progress)}% paid</span></div><div class="miniBar"><i style="width:${progress}%"></i></div><div class="cardActions">${debt.remaining > 0 ? `<button class="linkBtn" onclick="openDebtPayment('${debt.id}')">Make payment</button>` : ''}<button class="linkBtn" onclick="openDebtForm('${debt.id}')">Edit</button>${debt.remaining <= 0 ? `<button class="dangerLink" onclick="archiveDebt('${debt.id}')">Archive</button>` : ''}</div></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No active debts</b><span>Add a balance to make a clear payoff plan.</span><button class="secondary compact" onclick="openDebtForm()">＋ Add debt</button></div>';

  const goals = activeGoals();
  $('goalList').innerHTML = goals.length ? goals.map(goal => {
    const progress = Math.max(0, Math.min(100, goal.saved / Math.max(goal.target, .01) * 100));
    const latest = state.contributions.filter(c => c.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(goal.name)}</h3><div class="meta">${money(goal.saved, goal.currency)} of ${money(goal.target, goal.currency)}${goal.due ? ` · target ${formatDate(goal.due)}` : ''}</div>${latest ? `<div class="meta">Last added ${money(latest.amount, latest.currency)} on ${formatDate(latest.date)}</div>` : ''}</div><span class="pill">${Math.round(progress)}%</span></div><div class="miniBar"><i style="width:${progress}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openGoalContribution('${goal.id}')">＋ Add saving</button><button class="linkBtn" onclick="openGoalHistory('${goal.id}')">History</button><button class="linkBtn" onclick="openGoalForm('${goal.id}')">Edit</button><button class="dangerLink" onclick="archiveGoal('${goal.id}')">Archive</button></div></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No active goals</b><span>Add one clear target and celebrate every contribution.</span><button class="secondary compact" onclick="openGoalForm()">＋ Add goal</button></div>';

  $('budgetList').innerHTML = Object.keys(state.budgets).length ? Object.entries(state.budgets).map(([category, budget]) => {
    const spent = metrics.monthTx.filter(t => t.type === 'expense' && t.category === category).reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
    const limit = usd(budget.amount, budget.currency);
    const ratio = Math.min(100, spent / Math.max(.01, limit) * 100);
    return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(category)}</h3><div class="meta">${baseMoney(spent)} spent of ${baseMoney(limit)}</div></div><span class="pill${spent > limit ? ' danger' : ''}">${Math.round(ratio)}%</span></div><div class="miniBar"><i style="width:${ratio}%"></i></div></div>`;
  }).join('') : '<div class="card hint">No category budget yet.</div>';

  const recurringItems = state.recurring.filter(item => item.active !== false).sort((a, b) => a.day - b.day);
  $('recurringList').innerHTML = recurringItems.length ? recurringItems.map(item => `<div class="recurringCard"><div class="cardTop"><div><h3>${esc(item.name)}</h3><div class="meta">${item.kind === 'income' ? 'Income' : 'Expense'} · ${money(item.amount, item.currency)} · day ${item.day}${item.accountId ? ` · ${esc(accountName(item.accountId))}` : ''}</div></div><span class="pill">Monthly</span></div><div class="cardActions"><button class="linkBtn" onclick="openRecurringForm('${item.id}')">Edit</button><button class="dangerLink" onclick="archiveRecurring('${item.id}')">Archive</button></div></div>`).join('') : '<div class="card hint">No regular items yet.</div>';

  document.querySelectorAll('#timelineFilters button').forEach(button => button.classList.toggle('active', button.dataset.filter === timelineFilter));
  $('timelineList').innerHTML = timelineHtml();

  $('baseCurrency').value = state.settings.base;
  $('paydayDay').value = state.settings.paydayDay || '';
  $('rateAED').value = state.settings.rates.AED;
  $('rateMVR').value = state.settings.rates.MVR;
  $('rateINR').value = state.settings.rates.INR;
}

function accountSelectOptions(selected = '', includeEmpty = true) {
  return `${includeEmpty ? '<option value="">Not linked to an account</option>' : ''}${activeAccounts().map(account => `<option value="${account.id}"${account.id === selected ? ' selected' : ''}>${esc(account.name)} · ${account.currency}</option>`).join('')}`;
}

function transactionRow(transaction) {
  return {
    id: transaction.id,
    household_id: householdId,
    user_id: currentUser.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    category: transaction.category,
    paid_by: transaction.paidBy,
    account_id: transaction.accountId || null,
    account: transaction.account || null,
    to_account_id: transaction.toAccountId || null,
    to_amount: transaction.toAmount == null ? null : transaction.toAmount,
    debt_id: transaction.debtId || null,
    debt_principal: transaction.debtPrincipal == null ? null : transaction.debtPrincipal,
    debt_interest: transaction.debtId ? Number(transaction.debtInterest || 0) : null,
    recurring_item_id: transaction.recurringItemId || null,
    recurring_month: transaction.recurringItemId ? transaction.recurringMonth || monthStart(transaction.date) : null,
    date: transaction.date,
    note: transaction.note || null,
    updated_at: new Date().toISOString()
  };
}

function openQuickExpense() {
  const accounts = activeAccounts();
  const rememberedAccount = accounts.some(a => a.id === state.settings.lastExpenseAccountId) ? state.settings.lastExpenseAccountId : accounts[0]?.id || '';
  const rememberedCategory = EXPENSE_CATEGORIES.some(([category]) => category === state.settings.lastExpenseCategory) ? state.settings.lastExpenseCategory : 'Food';
  openModal('Add spend', `<form id="quickExpenseForm" class="form quickExpenseForm">
    <label class="amountField">Amount<span id="quickAmountPrefix" class="amountPrefix">${esc(accounts.find(a => a.id === rememberedAccount)?.currency || state.settings.lastCurrency)}</span><input id="quickAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" required></label>
    <div><div class="chipLabel">What was it for?</div><div id="quickCategoryChips" class="chips">${EXPENSE_CATEGORIES.map(([category, icon]) => `<button type="button" data-value="${esc(category)}" class="${category === rememberedCategory ? 'active' : ''}">${icon} ${esc(category)}</button>`).join('')}</div></div>
    <div><div class="chipLabel">Paid from</div><div id="quickAccountChips" class="chips accounts">${accounts.length ? accounts.map(account => `<button type="button" data-value="${account.id}" class="${account.id === rememberedAccount ? 'active' : ''}">${esc(account.name)} · ${account.currency}</button>`).join('') : '<button type="button" data-value="" class="active">Not linked</button>'}</div></div>
    <div class="fieldRow"><label>Who paid?<select id="quickPaidBy">${peopleOptions()}</select></label><label>Date<input id="quickDate" type="date" value="${today()}" required></label></div>
    <label>Note (optional)<input id="quickNote" maxlength="160" placeholder="Coffee, groceries…"></label>
    ${accounts.length ? '' : '<div class="friendlyNote">You can still save this. Add the bank account later to make its running balance automatic.</div>'}
    <button class="primary saveSpend" type="submit">Save spend</button>
  </form>`);
  let category = rememberedCategory;
  let accountId = rememberedAccount;
  $('quickPaidBy').value = defaultPerson();
  $('quickCategoryChips').querySelectorAll('button').forEach(button => button.onclick = () => {
    category = button.dataset.value;
    $('quickCategoryChips').querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  });
  $('quickAccountChips').querySelectorAll('button').forEach(button => button.onclick = () => {
    accountId = button.dataset.value;
    $('quickAccountChips').querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
    $('quickAmountPrefix').textContent = accounts.find(a => a.id === accountId)?.currency || state.settings.lastCurrency;
  });
  $('quickExpenseForm').onsubmit = async event => {
    event.preventDefault();
    const account = accounts.find(a => a.id === accountId);
    const date = $('quickDate').value;
    if (account && date < account.openingDate) { toast(`Choose ${account.openingDate} or later for this account.`); return; }
    const transaction = {
      id: crypto.randomUUID(), type: 'expense', amount: +$('quickAmount').value,
      currency: account?.currency || state.settings.lastCurrency, category, paidBy: $('quickPaidBy').value,
      accountId: account?.id || '', account: account?.name || '', toAccountId: '', toAmount: null,
      debtId: '', debtPrincipal: null, debtInterest: 0, recurringItemId: '', recurringMonth: '',
      date, note: $('quickNote').value.trim(), createdAt: new Date().toISOString()
    };
    state.settings.lastExpenseCategory = category;
    state.settings.lastExpenseAccountId = transaction.accountId;
    rememberCurrency(transaction.currency);
    state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: 'Spend recorded ✓' });
    ensureTodaySnapshot();
  };
}

function openTransaction(type, id = null, options = {}) {
  const existing = id ? state.transactions.find(t => t.id === id) : null;
  if (existing?.type === 'transfer') { openTransfer(id); return; }
  if (existing?.debtId) { openDebtPayment(existing.debtId, id); return; }
  if (existing) type = existing.type;
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.map(([category]) => category);
  const selectedCategory = existing?.category || options.category || categories[0];
  const selectedAccount = existing?.accountId || options.accountId || '';
  openModal(existing ? `Edit ${type}` : type === 'income' ? 'Add income' : 'Add expense', `<form class="form" id="transactionForm">
    <label>Amount<input id="transactionAmount" type="number" step="0.01" min="0.01" required value="${existing?.amount ?? options.amount ?? ''}"></label>
    <div class="fieldRow"><label>Currency<select id="transactionCurrency">${currencyOptions(existing?.currency || options.currency || state.settings.lastCurrency)}</select></label><label>${type === 'income' ? 'Income type' : 'Category'}<select id="transactionCategory">${[...new Set([selectedCategory, ...categories])].map(category => `<option>${esc(category)}</option>`).join('')}</select></label></div>
    <label>Account<select id="transactionAccount">${accountSelectOptions(selectedAccount)}</select></label>
    <div class="fieldRow"><label>${type === 'income' ? 'Received by' : 'Paid by'}<select id="transactionPaidBy">${peopleOptions(existing?.paidBy || options.paidBy || defaultPerson())}</select></label><label>Date<input id="transactionDate" type="date" required value="${existing?.date || options.date || today()}"></label></div>
    <label>Note<input id="transactionNote" maxlength="200" value="${esc(existing?.note || options.note || '')}" placeholder="Optional"></label>
    ${activeAccounts().length ? '' : '<div class="friendlyNote">Add a bank or cash account on Money to make its balance update automatically.</div>'}
    <button class="primary" type="submit">Save ${type}</button>
  </form>`);
  $('transactionCategory').value = selectedCategory;
  $('transactionPaidBy').value = existing?.paidBy || options.paidBy || defaultPerson();
  $('transactionAccount').value = selectedAccount;
  const syncCurrency = () => {
    const account = state.accounts.find(a => a.id === $('transactionAccount').value);
    $('transactionCurrency').disabled = !!account;
    if (account) $('transactionCurrency').value = account.currency;
  };
  $('transactionAccount').onchange = syncCurrency;
  syncCurrency();
  $('transactionForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('transactionAccount').value);
    const date = $('transactionDate').value;
    if (account && date < account.openingDate) { toast(`Choose ${account.openingDate} or later for ${account.name}.`); return; }
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type, amount: +$('transactionAmount').value,
      currency: account?.currency || $('transactionCurrency').value, category: $('transactionCategory').value,
      paidBy: $('transactionPaidBy').value, accountId: account?.id || '', account: account?.name || '',
      toAccountId: '', toAmount: null, debtId: '', debtPrincipal: null, debtInterest: 0,
      recurringItemId: existing?.recurringItemId || options.recurringItemId || '',
      recurringMonth: existing?.recurringMonth || options.recurringMonth || '',
      date, note: $('transactionNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    rememberCurrency(transaction.currency);
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: type === 'income' ? 'Income added ✓' : 'Expense saved ✓', celebrate: type === 'income' });
    ensureTodaySnapshot();
  };
}

function openTransfer(id = null) {
  const existing = id ? state.transactions.find(t => t.id === id && t.type === 'transfer') : null;
  const accounts = activeAccounts();
  if (accounts.length < 2) {
    openModal('Transfer between accounts', `<div class="form"><div class="friendlyNote">Add at least two active accounts first. A transfer moves money without changing income, spending or net worth.</div><button class="primary" onclick="closeModal();openAccountForm()">Add another account</button></div>`);
    return;
  }
  const sourceId = existing?.accountId || accounts[0].id;
  const destinationId = existing?.toAccountId || accounts.find(a => a.id !== sourceId)?.id;
  openModal(existing ? 'Edit transfer' : 'Transfer money', `<form class="form" id="transferForm">
    <div class="friendlyNote">One linked transfer updates both account balances and never counts as income or spending.</div>
    <label>From account<select id="transferFrom">${accountSelectOptions(sourceId, false)}</select></label>
    <label>To account<select id="transferTo">${accountSelectOptions(destinationId, false)}</select></label>
    <div class="fieldRow"><label>Amount sent <span id="transferFromCurrency"></span><input id="transferAmount" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? ''}"></label><label>Amount received <span id="transferToCurrency"></span><input id="transferReceived" type="number" min="0.01" step="0.01" required value="${existing?.toAmount ?? ''}"></label></div>
    <label>Date<input id="transferDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="transferNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save transfer</button>
  </form>`);
  const updateTransferCurrencies = changed => {
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    $('transferFromCurrency').textContent = source?.currency || '';
    $('transferToCurrency').textContent = destination?.currency || '';
    if (source && destination && source.currency === destination.currency && (changed || !$('transferReceived').value)) {
      $('transferReceived').value = $('transferAmount').value;
      $('transferReceived').disabled = true;
    } else $('transferReceived').disabled = false;
  };
  $('transferFrom').value = sourceId;
  $('transferTo').value = destinationId;
  $('transferFrom').onchange = () => updateTransferCurrencies(true);
  $('transferTo').onchange = () => updateTransferCurrencies(true);
  $('transferAmount').oninput = () => {
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    if (source?.currency === destination?.currency) $('transferReceived').value = $('transferAmount').value;
  };
  updateTransferCurrencies(false);
  $('transferForm').onsubmit = async event => {
    event.preventDefault();
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    if (!source || !destination || source.id === destination.id) { toast('Choose two different accounts.'); return; }
    const date = $('transferDate').value;
    if (date < source.openingDate || date < destination.openingDate) { toast('Choose a date after both accounts started tracking.'); return; }
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type: 'transfer', amount: +$('transferAmount').value,
      currency: source.currency, category: 'Transfer', paidBy: 'Shared', accountId: source.id, account: source.name,
      toAccountId: destination.id, toAmount: +$('transferReceived').value, debtId: '', debtPrincipal: null,
      debtInterest: 0, recurringItemId: '', recurringMonth: '', date,
      note: $('transferNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: 'Transfer saved ✓' });
    ensureTodaySnapshot();
  };
}

function editTransaction(id) {
  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction) return;
  if (transaction.type === 'transfer') openTransfer(id);
  else if (transaction.debtId) openDebtPayment(transaction.debtId, id);
  else openTransaction(transaction.type, id);
}

async function deleteTransaction(id) {
  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction || !confirm(`Delete this ${transaction.type === 'transfer' ? 'transfer' : 'record'}?`)) return;
  if (transaction.debtId && transaction.debtPrincipal) {
    const debt = state.debts.find(item => item.id === transaction.debtId);
    if (debt) debt.remaining = Math.min(debt.original, debt.remaining + transaction.debtPrincipal);
  }
  state.transactions = state.transactions.filter(t => t.id !== id);
  await saveOperation({ action: 'delete', table: 'transactions', id }, { close: false, message: 'Record deleted' });
  ensureTodaySnapshot();
}

function openAccountForm(id = null) {
  const account = id ? state.accounts.find(item => item.id === id) : null;
  openModal(account ? 'Edit account' : 'Add bank, cash or wallet', `<form class="form" id="accountForm">
    <div class="friendlyNote">Starting balance means the real balance just before tracking begins. Linked salary, spending and transfers update it after that.</div>
    <label>Name<input id="accountName" required maxlength="80" value="${esc(account?.name || '')}" placeholder="Main bank account"></label>
    <div class="fieldRow"><label>Type<select id="accountType"><option value="bank">Bank account</option><option value="cash">Cash</option><option value="wallet">Mobile wallet</option></select></label><label>Currency<select id="accountCurrency">${currencyOptions(account?.currency || state.settings.lastCurrency)}</select></label></div>
    <div class="fieldRow"><label>Starting balance<input id="accountOpening" type="number" step="0.01" required value="${account?.openingBalance ?? 0}"></label><label>Track from<input id="accountDate" type="date" required value="${account?.openingDate || today()}"></label></div>
    <label>Notes<input id="accountNotes" maxlength="200" value="${esc(account?.notes || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">${account ? 'Update account' : 'Add account'}</button>
  </form>`);
  $('accountType').value = account?.type || 'bank';
  $('accountForm').onsubmit = async event => {
    event.preventDefault();
    const name = $('accountName').value.trim();
    if (state.accounts.some(item => item.id !== account?.id && item.name.toLowerCase() === name.toLowerCase())) {
      toast('An account with that name already exists.');
      return;
    }
    const openingDate = $('accountDate').value;
    const earlierLinked = account && state.transactions.some(transaction =>
      (transaction.accountId === account.id || transaction.toAccountId === account.id) && transaction.date < openingDate
    );
    if (earlierLinked) { toast('The tracking date cannot move after an existing linked record.'); return; }
    const item = {
      id: account?.id || crypto.randomUUID(), name, type: $('accountType').value,
      currency: $('accountCurrency').value, openingBalance: +$('accountOpening').value,
      openingDate, notes: $('accountNotes').value.trim(), active: true,
      createdAt: account?.createdAt || new Date().toISOString()
    };
    rememberCurrency(item.currency);
    const index = state.accounts.findIndex(a => a.id === item.id);
    if (index >= 0) state.accounts[index] = item;
    else state.accounts.push(item);
    await saveOperation({ action: 'upsert', table: 'accounts', row: { id: item.id, household_id: householdId, name: item.name, account_type: item.type, currency: item.currency, opening_balance: item.openingBalance, opening_date: item.openingDate, notes: item.notes || null, active: true, updated_at: new Date().toISOString() } }, { message: 'Account saved ✓' });
    ensureTodaySnapshot();
  };
}

function openAccountStatement(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  const records = state.transactions
    .filter(transaction => transaction.date >= account.openingDate && (transaction.accountId === id || transaction.toAccountId === id))
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  let running = account.openingBalance;
  const rows = [{ date: account.openingDate, title: 'Opening balance', delta: null, balance: running }];
  records.forEach(transaction => {
    const delta = accountDeltaNative(account, transaction);
    running += delta;
    rows.push({ date: transaction.date, title: transaction.type === 'transfer' ? (delta < 0 ? `Transfer to ${accountName(transaction.toAccountId)}` : `Transfer from ${accountName(transaction.accountId)}`) : transaction.category, delta, balance: running });
  });
  openModal(`${account.name} statement`, `<div class="friendlyNote">This running balance starts from ${formatDate(account.openingDate)} and updates from every linked entry.</div><div class="statement">${rows.map(row => `<div class="statementRow"><time>${esc(row.date)}</time><div><b>${esc(row.title)}</b>${row.delta == null ? '' : `<div class="meta">${row.delta >= 0 ? '+' : '−'} ${money(Math.abs(row.delta), account.currency)}</div>`}</div><div class="statementValue"><strong>${money(row.balance, account.currency)}</strong><span>balance</span></div></div>`).join('')}</div><button class="secondary wide" onclick="closeModal();reconcileAccount('${account.id}')">Correct to today’s balance</button>`);
}

function reconcileAccount(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  const current = accountBalanceNative(account);
  openModal('Correct account balance', `<form class="form" id="reconcileForm">
    <div class="friendlyNote">The app shows <b>${money(current, account.currency)}</b>. Enter the real bank or wallet balance; the difference will be kept as a clear adjustment in history.</div>
    <label>Actual balance<input id="actualBalance" type="number" step="0.01" required value="${current.toFixed(2)}"></label>
    <button class="primary" type="submit">Update balance</button>
  </form>`);
  $('reconcileForm').onsubmit = async event => {
    event.preventDefault();
    const actual = +$('actualBalance').value;
    const difference = actual - current;
    if (Math.abs(difference) < .005) { closeModal(); toast('Balance already matches ✓'); return; }
    const transaction = {
      id: crypto.randomUUID(), type: difference > 0 ? 'income' : 'expense', amount: Math.abs(difference),
      currency: account.currency, category: 'Balance adjustment', paidBy: 'Shared', accountId: account.id,
      account: account.name, toAccountId: '', toAmount: null, debtId: '', debtPrincipal: null, debtInterest: 0,
      recurringItemId: '', recurringMonth: '', date: today(), note: 'Manual account balance correction', createdAt: new Date().toISOString()
    };
    state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: 'Balance corrected ✓' });
    ensureTodaySnapshot();
  };
}

async function archiveAccount(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  if (Math.abs(accountBalanceNative(account)) >= .005) {
    toast('Transfer or correct this account to zero before archiving.');
    return;
  }
  if (!confirm(`Archive ${account.name}? Its history will stay available in Timeline.`)) return;
  account.active = false;
  await saveOperation({ action: 'upsert', table: 'accounts', row: { id: account.id, household_id: householdId, name: account.name, account_type: account.type, currency: account.currency, opening_balance: account.openingBalance, opening_date: account.openingDate, notes: account.notes || null, active: false, updated_at: new Date().toISOString() } }, { close: false, message: 'Account archived' });
  ensureTodaySnapshot();
}

function openAssetForm(id = null) {
  const asset = id ? state.assets.find(item => item.id === id) : null;
  openModal(asset ? 'Edit asset' : 'Add other asset', `<form class="form" id="assetForm">
    <div class="friendlyNote">Use this for gold, investments, crypto or property. Bank and cash balances belong in Accounts so they are never counted twice.</div>
    <label>Name<input id="assetName" required maxlength="100" value="${esc(asset?.name || '')}" placeholder="Gold jewellery / Investment / Property"></label>
    <label>Type<select id="assetType">${asset?.type === 'cash' ? '<option value="cash">Legacy cash balance</option>' : ''}<option value="manual">Other asset / investment</option><option value="metal">Precious metal</option><option value="crypto">Crypto</option></select></label>
    <div id="assetSymbolWrap" class="hidden"><label>Asset<select id="assetSymbol"></select></label></div>
    <label id="assetQuantityLabel">Amount / quantity<input id="assetQuantity" type="number" step="0.00000001" min="0" value="${asset?.quantity ?? ''}"></label>
    <label id="assetCurrencyWrap">Currency<select id="assetCurrency">${currencyOptions(asset?.currency || state.settings.lastCurrency)}</select></label>
    <label id="assetManualWrap" class="hidden">Current total value<input id="assetManualValue" type="number" step="0.01" min="0" value="${asset?.manualValue ?? ''}"></label>
    <label>Notes<input id="assetNotes" maxlength="200" value="${esc(asset?.notes || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save asset</button>
  </form>`);
  $('assetType').value = asset?.type || 'manual';
  $('assetType').onchange = () => configureAssetForm();
  configureAssetForm(asset?.symbol || '');
  $('assetForm').onsubmit = async event => {
    event.preventDefault();
    const type = $('assetType').value;
    const item = {
      id: asset?.id || crypto.randomUUID(), name: $('assetName').value.trim(), type,
      symbol: ['metal', 'crypto'].includes(type) ? $('assetSymbol').value : '',
      quantity: +$('assetQuantity').value || 0, currency: ['metal', 'crypto'].includes(type) ? 'USD' : $('assetCurrency').value,
      manualValue: type === 'manual' ? +$('assetManualValue').value : null,
      notes: $('assetNotes').value.trim(), createdAt: asset?.createdAt || new Date().toISOString()
    };
    if (type !== 'manual' && !(item.quantity > 0)) { toast('Enter an amount or quantity greater than zero.'); return; }
    if (type === 'manual' && !(item.manualValue >= 0)) { toast('Enter the current value.'); return; }
    const index = state.assets.findIndex(a => a.id === item.id);
    if (index >= 0) state.assets[index] = item;
    else state.assets.push(item);
    await saveOperation({ action: 'upsert', table: 'assets', row: { id: item.id, household_id: householdId, user_id: currentUser.id, name: item.name, asset_type: item.type, symbol: item.symbol || null, quantity: item.quantity, currency: item.currency, manual_value: item.manualValue, notes: item.notes || null, updated_at: new Date().toISOString() } }, { message: 'Asset saved ✓' });
    await refreshPrices(true);
    ensureTodaySnapshot();
  };
}

function configureAssetForm(selected = '') {
  const type = $('assetType').value;
  const market = ['metal', 'crypto'].includes(type);
  $('assetSymbolWrap').classList.toggle('hidden', !market);
  $('assetCurrencyWrap').classList.toggle('hidden', market);
  $('assetManualWrap').classList.toggle('hidden', type !== 'manual');
  const quantityLabel = $('assetQuantityLabel');
  if (type === 'metal') {
    $('assetSymbol').innerHTML = METALS.map(([symbol, name]) => `<option value="${symbol}">${name} (${symbol})</option>`).join('');
    quantityLabel.childNodes[0].nodeValue = 'Weight in grams';
  } else if (type === 'crypto') {
    $('assetSymbol').innerHTML = CRYPTO.map(([symbol, name]) => `<option value="${symbol}">${name} (${symbol})</option>`).join('');
    quantityLabel.childNodes[0].nodeValue = 'Coin quantity';
  } else if (type === 'cash') quantityLabel.childNodes[0].nodeValue = 'Balance';
  else quantityLabel.childNodes[0].nodeValue = 'Quantity (optional reference)';
  if (selected && market) $('assetSymbol').value = selected;
}

async function deleteAsset(id) {
  const asset = state.assets.find(item => item.id === id);
  if (!asset || !confirm(`Delete ${asset.name}?`)) return;
  state.assets = state.assets.filter(item => item.id !== id);
  await saveOperation({ action: 'delete', table: 'assets', id }, { close: false, message: 'Asset deleted' });
  ensureTodaySnapshot();
}

function openDebtForm(id = null) {
  const debt = id ? state.debts.find(item => item.id === id) : null;
  openModal(debt ? 'Edit debt' : 'Add debt', `<form class="form" id="debtForm">
    <label>Name<input id="debtName" required maxlength="100" value="${esc(debt?.name || '')}" placeholder="Credit card / Loan"></label>
    <div class="fieldRow"><label>Original amount<input id="debtOriginal" type="number" min="0" step="0.01" required value="${debt?.original ?? ''}"></label><label>Remaining now<input id="debtRemaining" type="number" min="0" step="0.01" required value="${debt?.remaining ?? ''}"></label></div>
    <label>Currency<select id="debtCurrency">${currencyOptions(debt?.currency || state.settings.lastCurrency)}</select></label>
    <div class="fieldRow"><label>Annual interest %<input id="debtApr" type="number" min="0" max="100" step="0.001" value="${debt?.apr ?? 0}"></label><label>Minimum monthly payment<input id="debtMinimum" type="number" min="0" step="0.01" value="${debt?.minimum ?? 0}"></label></div>
    <div class="fieldRow"><label>Usual payment day<input id="debtPaymentDay" type="number" min="1" max="31" value="${debt?.paymentDay || ''}" placeholder="Optional"></label><label>Target payoff date<input id="debtDue" type="date" value="${debt?.due || ''}"></label></div>
    <div class="warningNote">Use “Make payment” after this is saved. A linked payment reduces the remaining balance automatically and keeps the history accurate.</div>
    <button class="primary" type="submit">Save debt</button>
  </form>`);
  $('debtForm').onsubmit = async event => {
    event.preventDefault();
    const original = +$('debtOriginal').value;
    const remaining = +$('debtRemaining').value;
    if (remaining > original) { toast('Remaining balance cannot exceed the original amount.'); return; }
    const item = {
      id: debt?.id || crypto.randomUUID(), name: $('debtName').value.trim(), original, remaining,
      currency: $('debtCurrency').value, due: $('debtDue').value, apr: +$('debtApr').value || 0,
      minimum: +$('debtMinimum').value || 0, paymentDay: +$('debtPaymentDay').value || null,
      active: true, createdAt: debt?.createdAt || new Date().toISOString()
    };
    rememberCurrency(item.currency);
    const index = state.debts.findIndex(d => d.id === item.id);
    if (index >= 0) state.debts[index] = item;
    else state.debts.push(item);
    await saveOperation({ action: 'upsert', table: 'debts', row: { id: item.id, household_id: householdId, name: item.name, original_amount: item.original, remaining_amount: item.remaining, currency: item.currency, due_date: item.due || null, annual_interest_rate: item.apr, minimum_payment: item.minimum, payment_day: item.paymentDay, active: true } }, { message: 'Debt plan saved ✓' });
    ensureTodaySnapshot();
  };
}

function openDebtPayment(debtId, transactionId = null) {
  const existing = transactionId ? state.transactions.find(t => t.id === transactionId) : null;
  const debt = state.debts.find(item => item.id === (existing?.debtId || debtId));
  const accounts = activeAccounts();
  if (!debt) return;
  if (!accounts.length) {
    openModal('Make debt payment', `<div class="form"><div class="friendlyNote">Add the bank or cash account the payment leaves from first. That keeps both your debt and account balance correct.</div><button class="primary" onclick="closeModal();openAccountForm()">Add account</button></div>`);
    return;
  }
  const selectedAccount = existing?.accountId || accounts.find(a => a.currency === debt.currency)?.id || accounts[0].id;
  const maxPrincipal = debt.remaining + Number(existing?.debtPrincipal || 0);
  openModal(existing ? 'Edit debt payment' : `Pay ${debt.name}`, `<form class="form" id="debtPaymentForm">
    <div class="friendlyNote">Principal reduces the debt. Interest is recorded but does not reduce it. The total leaving the selected account updates its balance.</div>
    <label>Pay from<select id="debtPaymentAccount">${accountSelectOptions(selectedAccount, false)}</select></label>
    <label>Total leaving account <span id="debtAccountCurrency"></span><input id="debtPaymentTotal" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? ''}"></label>
    <div class="fieldRow"><label>Principal <span>${debt.currency}</span><input id="debtPaymentPrincipal" type="number" min="0.01" max="${maxPrincipal}" step="0.01" required value="${existing?.debtPrincipal ?? ''}"></label><label>Interest / fees <span>${debt.currency}</span><input id="debtPaymentInterest" type="number" min="0" step="0.01" value="${existing?.debtInterest ?? 0}"></label></div>
    <div id="debtPaymentHint" class="friendlyNote"></div>
    <label>Date<input id="debtPaymentDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="debtPaymentNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save payment</button>
  </form>`);
  $('debtPaymentAccount').value = selectedAccount;
  const syncDebtPayment = source => {
    const account = state.accounts.find(a => a.id === $('debtPaymentAccount').value);
    $('debtAccountCurrency').textContent = account?.currency || '';
    const sameCurrency = account?.currency === debt.currency;
    $('debtPaymentHint').textContent = sameCurrency
      ? 'Same currency: principal + interest must equal the total leaving the account.'
      : `Cross-currency payment: enter the exact ${account?.currency || ''} debited and the exact ${debt.currency} principal shown by the lender.`;
    if (sameCurrency && source === 'total') {
      $('debtPaymentPrincipal').value = Math.max(0, +$('debtPaymentTotal').value - (+$('debtPaymentInterest').value || 0)).toFixed(2);
    }
  };
  $('debtPaymentAccount').onchange = () => syncDebtPayment('account');
  $('debtPaymentTotal').oninput = () => syncDebtPayment('total');
  $('debtPaymentInterest').oninput = () => syncDebtPayment('total');
  syncDebtPayment('account');
  $('debtPaymentForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('debtPaymentAccount').value);
    const total = +$('debtPaymentTotal').value;
    const principal = +$('debtPaymentPrincipal').value;
    const interest = +$('debtPaymentInterest').value || 0;
    if (!account) return;
    if (principal > maxPrincipal + .005) { toast(`Principal cannot exceed ${money(maxPrincipal, debt.currency)}.`); return; }
    if (account.currency === debt.currency && Math.abs(total - principal - interest) > .01) {
      toast('For the same currency, total must equal principal plus interest.');
      return;
    }
    const date = $('debtPaymentDate').value;
    if (date < account.openingDate) { toast(`Choose ${account.openingDate} or later for this account.`); return; }
    if (existing?.debtId && existing.debtPrincipal) {
      const oldDebt = state.debts.find(item => item.id === existing.debtId);
      if (oldDebt) oldDebt.remaining = Math.min(oldDebt.original, oldDebt.remaining + existing.debtPrincipal);
    }
    debt.remaining = Math.max(0, debt.remaining - principal);
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type: 'expense', amount: total, currency: account.currency,
      category: 'Debt', paidBy: defaultPerson(),
      accountId: account.id, account: account.name, toAccountId: '', toAmount: null, debtId: debt.id,
      debtPrincipal: principal, debtInterest: interest, recurringItemId: '', recurringMonth: '', date,
      note: $('debtPaymentNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: `${money(principal, debt.currency)} knocked off debt ✓`, celebrate: true });
    ensureTodaySnapshot();
  };
}

async function archiveDebt(id) {
  const debt = state.debts.find(item => item.id === id);
  if (!debt) return;
  if (debt.remaining > .005) { toast('Only a cleared debt can be archived.'); return; }
  if (!confirm(`Archive ${debt.name}? Its payment history will remain.`)) return;
  debt.active = false;
  await saveOperation({ action: 'upsert', table: 'debts', row: { id: debt.id, household_id: householdId, name: debt.name, original_amount: debt.original, remaining_amount: debt.remaining, currency: debt.currency, due_date: debt.due || null, annual_interest_rate: debt.apr, minimum_payment: debt.minimum, payment_day: debt.paymentDay, active: false } }, { close: false, message: 'Debt archived · well done!' });
}

function openGoalForm(id = null, preset = {}) {
  const goal = id ? state.goals.find(item => item.id === id) : null;
  openModal(goal ? 'Edit goal' : 'Add savings goal', `<form class="form" id="goalForm">
    <label>Name<input id="goalName" required maxlength="100" value="${esc(goal?.name || preset.name || '')}" placeholder="Emergency fund / Vacation"></label>
    <div class="fieldRow"><label>Target amount<input id="goalTarget" type="number" min="0.01" step="0.01" required value="${goal?.target ?? preset.target ?? ''}"></label><label>Currency<select id="goalCurrency">${currencyOptions(goal?.currency || preset.currency || state.settings.lastCurrency)}</select></label></div>
    ${goal ? `<div class="friendlyNote">Already reserved: <b>${money(goal.saved, goal.currency)}</b>. Use “Add saving” on the goal card so every change has a date and history.</div>` : `<label>Already saved (optional)<input id="goalStarting" type="number" min="0" step="0.01" value="${preset.saved || 0}"></label>`}
    <label>Target date<input id="goalDue" type="date" value="${goal?.due || preset.due || ''}"></label>
    <button class="primary" type="submit">Save goal</button>
  </form>`);
  $('goalForm').onsubmit = async event => {
    event.preventDefault();
    const item = {
      id: goal?.id || crypto.randomUUID(), name: $('goalName').value.trim(), target: +$('goalTarget').value,
      saved: goal ? goal.saved : +$('goalStarting').value || 0, currency: $('goalCurrency').value,
      due: $('goalDue').value, active: true, createdAt: goal?.createdAt || new Date().toISOString()
    };
    if (item.saved > item.target && !confirm('Saved is above the target. Keep it anyway?')) return;
    rememberCurrency(item.currency);
    const index = state.goals.findIndex(g => g.id === item.id);
    if (index >= 0) state.goals[index] = item;
    else state.goals.push(item);
    await saveOperation({ action: 'upsert', table: 'goals', row: { id: item.id, household_id: householdId, name: item.name, target: item.target, saved: item.saved, currency: item.currency, due_date: item.due || null, active: true } }, { message: 'Goal saved ✓', celebrate: !goal });
  };
}

function createEmergencyGoal() {
  const essentialsUSD = Object.entries(state.budgets).filter(([category]) => ['Housing', 'Food', 'Transport', 'Bills', 'Health'].includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  openGoalForm(null, { name: 'Emergency Fund', target: Math.round(fromUSD(essentialsUSD * 3, state.settings.base) * 100) / 100, currency: state.settings.base });
}

function openGoalContribution(goalId, contributionId = null) {
  const goal = state.goals.find(item => item.id === goalId);
  const existing = contributionId ? state.contributions.find(item => item.id === contributionId) : null;
  if (!goal) return;
  openModal(existing ? 'Edit goal saving' : `Add to ${goal.name}`, `<form class="form" id="goalContributionForm">
    <div class="friendlyNote">This reserves money already held in an account. It does not create extra cash or double-count net worth.</div>
    <label>Amount ${goal.currency}<input id="goalContributionAmount" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? ''}"></label>
    <label>Where is it held? <select id="goalContributionAccount"><option value="">Not assigned to one account</option>${activeAccounts().map(account => `<option value="${account.id}">${esc(account.name)} · ${account.currency}</option>`).join('')}</select></label>
    <label>Date<input id="goalContributionDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="goalContributionNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save contribution</button>
  </form>`);
  $('goalContributionAccount').value = existing?.accountId || '';
  $('goalContributionForm').onsubmit = async event => {
    event.preventDefault();
    const amount = +$('goalContributionAmount').value;
    if (existing) goal.saved = Math.max(0, goal.saved - existing.amount);
    goal.saved += amount;
    const item = {
      id: existing?.id || crypto.randomUUID(), goalId: goal.id,
      accountId: $('goalContributionAccount').value, amount, currency: goal.currency,
      date: $('goalContributionDate').value, note: $('goalContributionNote').value.trim(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.contributions.findIndex(c => c.id === item.id);
    if (index >= 0) state.contributions[index] = item;
    else state.contributions.push(item);
    await saveOperation({ action: 'upsert', table: 'goal_contributions', row: { id: item.id, household_id: householdId, goal_id: item.goalId, account_id: item.accountId || null, user_id: currentUser.id, amount: item.amount, currency: item.currency, date: item.date, note: item.note || null } }, { message: `${money(amount, goal.currency)} closer to ${goal.name} ✓`, celebrate: true });
  };
}

function openGoalHistory(goalId) {
  const goal = state.goals.find(item => item.id === goalId);
  if (!goal) return;
  const contributions = state.contributions.filter(item => item.goalId === goalId).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  openModal(`${goal.name} history`, `<div class="friendlyNote">Current reserved total: <b>${money(goal.saved, goal.currency)}</b>. Starting savings are included in the total even if they predate this history.</div>${contributions.length ? `<div class="statement">${contributions.map(item => `<div class="statementRow"><time>${esc(item.date)}</time><div><b>${esc(item.note || 'Goal saving')}</b><div class="meta">${esc(accountName(item.accountId) || 'No account assigned')}</div><div class="cardActions"><button class="linkBtn" onclick="openGoalContribution('${goal.id}','${item.id}')">Edit</button><button class="dangerLink" onclick="deleteGoalContribution('${item.id}')">Delete</button></div></div><div class="statementValue"><strong>+ ${money(item.amount, item.currency)}</strong><span>reserved</span></div></div>`).join('')}</div>` : '<div class="card hint" style="margin-top:12px">No dated contributions yet.</div>'}<button class="primary wide" style="margin-top:12px" onclick="openGoalContribution('${goal.id}')">＋ Add saving</button>`);
}

async function deleteGoalContribution(id) {
  const contribution = state.contributions.find(item => item.id === id);
  if (!contribution || !confirm('Delete this goal contribution?')) return;
  const goal = state.goals.find(item => item.id === contribution.goalId);
  if (goal) goal.saved = Math.max(0, goal.saved - contribution.amount);
  state.contributions = state.contributions.filter(item => item.id !== id);
  await saveOperation({ action: 'delete', table: 'goal_contributions', id }, { close: false, message: 'Contribution deleted' });
}

async function archiveGoal(id) {
  const goal = state.goals.find(item => item.id === id);
  if (!goal || !confirm(`Archive ${goal.name}? Reserved money will return to spendable cash, while its history remains.`)) return;
  goal.active = false;
  await saveOperation({ action: 'upsert', table: 'goals', row: { id: goal.id, household_id: householdId, name: goal.name, target: goal.target, saved: goal.saved, currency: goal.currency, due_date: goal.due || null, active: false } }, { close: false, message: 'Goal archived' });
}

function openRecurringForm(id = null) {
  const item = id ? state.recurring.find(entry => entry.id === id) : null;
  const kind = item?.kind || 'expense';
  openModal(item ? 'Edit regular item' : 'Add regular item', `<form class="form" id="recurringForm">
    <div class="friendlyNote">Set this up once. Each month, tap Confirm on Today to create the real dated entry.</div>
    <label>Name<input id="recurringName" required maxlength="80" value="${esc(item?.name || '')}" placeholder="Salary / Rent / Internet"></label>
    <div class="fieldRow"><label>Type<select id="recurringKind"><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Day each month<input id="recurringDay" type="number" min="1" max="31" required value="${item?.day || 1}"></label></div>
    <div class="fieldRow"><label>Amount<input id="recurringAmount" type="number" min="0.01" step="0.01" required value="${item?.amount ?? ''}"></label><label>Currency<select id="recurringCurrency">${currencyOptions(item?.currency || state.settings.lastCurrency)}</select></label></div>
    <label>Category<select id="recurringCategory"></select></label>
    <label>Account<select id="recurringAccount">${accountSelectOptions(item?.accountId || '')}</select></label>
    <label>Paid / received by<select id="recurringPaidBy">${peopleOptions(item?.paidBy || 'Shared')}</select></label>
    <label>Note<input id="recurringNote" maxlength="200" value="${esc(item?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save monthly item</button>
  </form>`);
  $('recurringKind').value = kind;
  $('recurringPaidBy').value = item?.paidBy || 'Shared';
  $('recurringAccount').value = item?.accountId || '';
  const configureRecurring = () => {
    const currentKind = $('recurringKind').value;
    const categories = currentKind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.map(([category]) => category);
    const selected = item?.category && (item.kind === currentKind) ? item.category : currentKind === 'income' ? 'Salary' : 'Bills';
    $('recurringCategory').innerHTML = categories.map(category => `<option>${esc(category)}</option>`).join('');
    $('recurringCategory').value = selected;
  };
  const syncRecurringCurrency = () => {
    const account = state.accounts.find(a => a.id === $('recurringAccount').value);
    $('recurringCurrency').disabled = !!account;
    if (account) $('recurringCurrency').value = account.currency;
  };
  $('recurringKind').onchange = configureRecurring;
  $('recurringAccount').onchange = syncRecurringCurrency;
  configureRecurring();
  syncRecurringCurrency();
  $('recurringForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('recurringAccount').value);
    const recurringItem = {
      id: item?.id || crypto.randomUUID(), name: $('recurringName').value.trim(), kind: $('recurringKind').value,
      amount: +$('recurringAmount').value, currency: account?.currency || $('recurringCurrency').value,
      category: $('recurringCategory').value, paidBy: $('recurringPaidBy').value, accountId: account?.id || '',
      day: +$('recurringDay').value, note: $('recurringNote').value.trim(), active: true,
      createdAt: item?.createdAt || new Date().toISOString()
    };
    const index = state.recurring.findIndex(entry => entry.id === recurringItem.id);
    if (index >= 0) state.recurring[index] = recurringItem;
    else state.recurring.push(recurringItem);
    await saveOperation({ action: 'upsert', table: 'recurring_items', row: { id: recurringItem.id, household_id: householdId, created_by: currentUser.id, name: recurringItem.name, kind: recurringItem.kind, amount: recurringItem.amount, currency: recurringItem.currency, category: recurringItem.category, paid_by: recurringItem.paidBy, account_id: recurringItem.accountId || null, day_of_month: recurringItem.day, note: recurringItem.note || null, active: true } }, { message: 'Monthly checklist updated ✓' });
  };
}

function confirmRecurring(id) {
  const item = state.recurring.find(entry => entry.id === id);
  if (!item) return;
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const date = `${monthKey()}-${String(Math.min(item.day, lastDay)).padStart(2, '0')}`;
  openTransaction(item.kind, null, { amount: item.amount, currency: item.currency, category: item.category, paidBy: item.paidBy, accountId: item.accountId, date, note: item.note, recurringItemId: item.id, recurringMonth: monthStart() });
}

async function archiveRecurring(id) {
  const item = state.recurring.find(entry => entry.id === id);
  if (!item || !confirm(`Archive ${item.name}? Past confirmations remain.`)) return;
  item.active = false;
  await saveOperation({ action: 'upsert', table: 'recurring_items', row: { id: item.id, household_id: householdId, created_by: currentUser.id, name: item.name, kind: item.kind, amount: item.amount, currency: item.currency, category: item.category, paid_by: item.paidBy, account_id: item.accountId || null, day_of_month: item.day, note: item.note || null, active: false } }, { close: false, message: 'Regular item archived' });
}

function openBudget() {
  const defaultCategories = ['Housing', 'Food', 'Transport', 'Bills', 'Health', 'Shopping', 'Entertainment', 'Travel', 'Other'];
  const categories = [...new Set([...defaultCategories, ...Object.keys(state.budgets)])];
  openModal('Monthly category budget', `<form class="form" id="budgetForm"><div class="friendlyNote">These limits guide the 40% essentials and 10% wants buckets. Debt and goal targets come directly from income.</div>${categories.map((category, index) => {
    const budget = state.budgets[category] || { amount: 0, currency: state.settings.base };
    return `<div class="fieldRow"><label>${esc(category)}<input id="budgetAmount${index}" type="number" min="0" step="0.01" value="${budget.amount}" required></label><label>Currency<select id="budgetCurrency${index}">${currencyOptions(budget.currency)}</select></label></div>`;
  }).join('')}<button class="primary" type="submit">Save category budget</button></form>`);
  $('budgetForm').onsubmit = async event => {
    event.preventDefault();
    categories.forEach((category, index) => { state.budgets[category] = { amount: +$(`budgetAmount${index}`).value || 0, currency: $(`budgetCurrency${index}`).value }; });
    const rows = Object.entries(state.budgets).map(([category, budget]) => ({ household_id: householdId, category, amount: budget.amount, currency: budget.currency }));
    await saveOperation({ action: 'budget', rows }, { message: 'Budget updated ✓' });
  };
}

async function saveSettings() {
  const rates = { USD: 1, AED: +$('rateAED').value, MVR: +$('rateMVR').value, INR: +$('rateINR').value };
  const paydayDay = +$('paydayDay').value || null;
  if (!rates.AED || !rates.MVR || !rates.INR) { toast('Every exchange rate must be greater than zero.'); return; }
  if (paydayDay && (paydayDay < 1 || paydayDay > 31)) { toast('Salary day must be from 1 to 31.'); return; }
  state.settings.base = $('baseCurrency').value;
  state.settings.paydayDay = paydayDay;
  state.settings.rates = rates;
  await saveOperation({ action: 'settings', row: { household_id: householdId, base_currency: state.settings.base, payday_day: paydayDay, fun_mode: state.settings.funMode, usd_to_aed: rates.AED, usd_to_mvr: rates.MVR, usd_to_inr: rates.INR } }, { close: false, message: 'Settings synced ✓' });
  ensureTodaySnapshot();
}

const quickExpenseUrl = () => `${location.origin}${location.pathname}?quick=expense`;

function shortcutPanel(platform) {
  if (platform === 'android') {
    return `<div class="steps">
      <div class="step"><span>1</span><div><b>Install Our Budget</b><p>Open this site in Chrome, use the browser menu and choose Install app or Add to Home screen.</p></div></div>
      <div class="step"><span>2</span><div><b>Long-press its app icon</b><p>Choose “Add spend” for a direct expense form. You can drag that shortcut onto the home screen.</p></div></div>
      <div class="step"><span>3</span><div><b>Pixel option: Quick Tap</b><p>Settings → System → Gestures → Quick Tap → Open app → Our Budget. The direct home-screen shortcut is still the fastest route to Add Spend.</p></div></div>
    </div>`;
  }
  return `<div class="steps">
    <div class="step"><span>1</span><div><b>Create an Apple Shortcut</b><p>In Shortcuts, create “Log Spend,” add the Open URLs action, and paste the quick link below.</p></div></div>
    <div class="step"><span>2</span><div><b>Choose Back Tap</b><p>Settings → Accessibility → Touch → Back Tap → Double Tap → Log Spend.</p></div></div>
    <div class="step"><span>3</span><div><b>Stay signed in</b><p>A double tap will open the private Add Spend form. The first visit may ask you to sign in.</p></div></div>
  </div>`;
}

function openShortcutHelp(platform = /Android/i.test(navigator.userAgent) ? 'android' : 'iphone') {
  openModal('Fast expense shortcut', `<div class="shortcutTabs"><button id="shortcutIphone" class="${platform === 'iphone' ? 'active' : ''}" onclick="switchShortcutTab('iphone')">iPhone Back Tap</button><button id="shortcutAndroid" class="${platform === 'android' ? 'active' : ''}" onclick="switchShortcutTab('android')">Android</button></div><div id="shortcutPanel">${shortcutPanel(platform)}</div><div class="form" style="margin-top:15px"><label>Direct Add Spend link<input id="quickExpenseLink" readonly value="${esc(quickExpenseUrl())}"></label><div class="buttonRow"><button class="secondary compact" onclick="copyQuickLink()">Copy link</button><button class="primary compact" onclick="shareQuickLink()">Share</button></div><div class="friendlyNote">This uses only the website and your phone’s built-in shortcut features. It stays free and does not use ChatGPT.</div></div>`);
}

function switchShortcutTab(platform) {
  $('shortcutPanel').innerHTML = shortcutPanel(platform);
  $('shortcutIphone').classList.toggle('active', platform === 'iphone');
  $('shortcutAndroid').classList.toggle('active', platform === 'android');
}

async function copyQuickLink() {
  try { await navigator.clipboard.writeText(quickExpenseUrl()); toast('Quick link copied ✓'); }
  catch (_error) { $('quickExpenseLink')?.select(); document.execCommand('copy'); toast('Quick link copied ✓'); }
}

async function shareQuickLink() {
  if (navigator.share) {
    try { await navigator.share({ title: 'Our Budget · Add Spend', text: 'Quick expense entry for Our Budget', url: quickExpenseUrl() }); }
    catch (_error) { /* User cancelled. */ }
  } else copyQuickLink();
}

function downloadFile(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup() {
  const backup = { exportedAt: new Date().toISOString(), appVersion: VERSION, household: 'Our household', data: state };
  downloadFile(`our-budget-backup-${today()}.json`, JSON.stringify(backup, null, 2), 'application/json');
  toast('Complete backup downloaded ✓');
}

function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function exportTransactionsCsv() {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Paid by', 'From account', 'To account', 'Amount received', 'Debt principal', 'Note'];
  const lines = [headers, ...[...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).map(t => [t.date, t.type, t.category, t.amount, t.currency, t.paidBy, accountName(t.accountId) || t.account, accountName(t.toAccountId), t.toAmount ?? '', t.debtPrincipal ?? '', t.note])];
  downloadFile(`our-budget-transactions-${today()}.csv`, lines.map(row => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
  toast('Transaction CSV downloaded ✓');
}

async function signOut() {
  if (db) await db.auth.signOut();
  showAuth();
}

$('modal').addEventListener('click', event => { if (event.target === $('modal')) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('modal').classList.contains('hidden')) closeModal(); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
showPage('today');
boot();
