const VERSION=6;
const LEGACY_KEYS=['our_budget_v4','our_budget_v3','our_budget_v2'];
const DEFAULT={
  version:VERSION,settings:{base:'AED',lastCurrency:'AED',rates:{USD:1,AED:3.6725,MVR:15.42,INR:88}},
  transactions:[],budgets:{Housing:{amount:3000,currency:'AED'},Food:{amount:1500,currency:'AED'},Transport:{amount:800,currency:'AED'},Bills:{amount:1000,currency:'AED'},Shopping:{amount:700,currency:'AED'},Other:{amount:500,currency:'AED'}},
  goals:[],debts:[],assets:[],accounts:[],prices:{}
};
let state=structuredClone(DEFAULT);
let db=null,currentUser=null,householdId=null,realtimeChannel=null,currentPage='home',stateKey='',pendingKey='',priceRefresh=null;
const expenseCats=['Housing','Food','Transport','Bills','Health','Debt','Savings','Shopping','Entertainment','Travel','Other'];
const incomeCats=['Salary','Bonus','Side income','Gift','Refund','Other income'];
const metalChoices=[['XAU','Gold'],['XAG','Silver'],['XPT','Platinum'],['XPD','Palladium']];
const cryptoChoices=[['BTC','Bitcoin'],['ETH','Ethereum'],['LTC','Litecoin'],['XRP','XRP'],['DOT','Polkadot'],['ADA','Cardano']];
const $=id=>document.getElementById(id);

function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function safeParse(value){try{return JSON.parse(value)}catch(_e){return null}}
function normalizeState(raw){
  const next=Object.assign(structuredClone(DEFAULT),raw||{});next.version=VERSION;
  next.settings=Object.assign({},DEFAULT.settings,raw?.settings||{});next.settings.rates=Object.assign({},DEFAULT.settings.rates,raw?.settings?.rates||{});
  next.settings.lastCurrency=next.settings.lastCurrency||next.settings.base||'AED';
  next.transactions=Array.isArray(next.transactions)?next.transactions:[];next.goals=Array.isArray(next.goals)?next.goals:[];next.debts=Array.isArray(next.debts)?next.debts:[];next.assets=Array.isArray(next.assets)?next.assets:[];next.accounts=Array.isArray(next.accounts)?next.accounts:[];next.prices=next.prices||{};
  const base=next.settings.base||'AED';const source=next.budgets&&typeof next.budgets==='object'?next.budgets:DEFAULT.budgets;
  next.budgets=Object.fromEntries(Object.entries(source).map(([category,value])=>[category,typeof value==='object'?{amount:Number(value.amount)||0,currency:value.currency||base}:{amount:Number(value)||0,currency:base}]));
  return next;
}
function cache(){if(stateKey)localStorage.setItem(stateKey,JSON.stringify(state))}
function loadScopedState(){
  stateKey=`our_budget_v5:${householdId}:${currentUser.id}`;pendingKey=`our_budget_pending_v5:${householdId}:${currentUser.id}`;
  let raw=safeParse(localStorage.getItem(stateKey));
  if(!raw){for(const key of LEGACY_KEYS){raw=safeParse(localStorage.getItem(key));if(raw)break}}
  state=normalizeState(raw);cache();
}
function pending(){return safeParse(localStorage.getItem(pendingKey))||[]}
function savePending(items){if(items.length)localStorage.setItem(pendingKey,JSON.stringify(items));else localStorage.removeItem(pendingKey);updateSyncStatus()}
function enqueue(op){const items=pending();items.push(Object.assign({queueId:crypto.randomUUID(),createdAt:new Date().toISOString()},op));savePending(items)}
function updateSyncStatus(message=''){
  if(!$('syncStatus'))return;const count=pendingKey?pending().length:0;
  $('syncStatus').textContent=message||(count?`${count} change${count===1?'':'s'} waiting to sync`:currentUser?'Synced':'Offline');
}
function usd(v,c){return Number(v)/(state.settings.rates[c]||1)}
function fromUSD(v,c){return Number(v)*(state.settings.rates[c]||1)}
function money(v,c=state.settings.base){return new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(v)||0)}
function month(){return new Date().toISOString().slice(0,7)}
function openModal(title,html){$('title').textContent=title;$('content').innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function rememberCurrency(c){if(['AED','MVR','INR','USD'].includes(c)){state.settings.lastCurrency=c;cache()}}
async function runOperation(op){
  if(op.action==='delete')return db.from(op.table).delete().eq('id',op.id).eq('household_id',householdId);
  if(op.action==='budget')return db.from('budgets').upsert(op.rows,{onConflict:'household_id,category'});
  return db.from(op.table).upsert(op.row);
}
async function flushPending(){
  if(!db||!householdId||!navigator.onLine)return false;
  let items=pending();if(!items.length){updateSyncStatus();return true}
  updateSyncStatus('Syncing saved changes…');
  while(items.length){
    try{const {error}=await runOperation(items[0]);if(error)throw error;items.shift();savePending(items)}
    catch(error){updateSyncStatus(`${items.length} change${items.length===1?'':'s'} waiting · ${error.message||'offline'}`);return false}
  }
  updateSyncStatus();return true;
}
async function saveOperation(op){enqueue(op);cache();render();closeModal();if(await flushPending())await loadRemote()}
window.addEventListener('online',async()=>{if(await flushPending())await loadRemote()});

function showPage(name){
  currentPage=name;
  document.querySelectorAll('.page').forEach(el=>el.classList.add('hidden'));
  const p=$('page-'+name);if(p)p.classList.remove('hidden');
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  render();
  if(name==='wealth')refreshPrices(false);
}

async function boot(){
  const cfg=window.SUPABASE_CONFIG||{};
  if(!cfg.url||!cfg.anonKey){$('authMessage').textContent='Supabase configuration is missing.';return}
  db=window.supabase.createClient(cfg.url,cfg.anonKey);
  const {data:{session}}=await db.auth.getSession();
  if(session)await signedIn(session.user);else showAuth();
  db.auth.onAuthStateChange(async(_event,session)=>{if(session)await signedIn(session.user);else showAuth()});
}
function showAuth(){if(realtimeChannel&&db)db.removeChannel(realtimeChannel);currentUser=null;householdId=null;stateKey='';pendingKey='';state=structuredClone(DEFAULT);$('authScreen').classList.remove('hidden');$('app').classList.add('hidden')}

$('authForm').onsubmit=async e=>{
  e.preventDefault();$('authMessage').textContent='Signing in…';
  const {error}=await db.auth.signInWithPassword({email:$('authEmail').value,password:$('authPassword').value});
  $('authMessage').textContent=error?error.message:'';
};

async function signedIn(user){
  currentUser=user;$('authScreen').classList.add('hidden');$('app').classList.remove('hidden');$('syncStatus').textContent='Finding household…';
  const {data:member,error}=await db.from('household_members').select('household_id,display_name,role').eq('user_id',user.id).limit(1).maybeSingle();
  if(error||!member){$('syncStatus').textContent='Household not found';alert('Login works, but this account is not attached to the household.');return}
  householdId=member.household_id;loadScopedState();updateSyncStatus('Signed in · '+member.display_name);
  await flushPending();await loadRemote();subscribeRealtime();showPage(currentPage);await refreshPrices(false);
}

async function loadRemote(){
  if(!db||!householdId)return;
  const [t,b,g,d,a,accounts]=await Promise.all([
    db.from('transactions').select('*').eq('household_id',householdId),
    db.from('budgets').select('*').eq('household_id',householdId),
    db.from('goals').select('*').eq('household_id',householdId),
    db.from('debts').select('*').eq('household_id',householdId),
    db.from('assets').select('*').eq('household_id',householdId),
    db.from('accounts').select('*').eq('household_id',householdId)
  ]);
  const failed=[t,b,g,d,a,accounts].filter(x=>x.error);if(failed.length){updateSyncStatus('Could not refresh · saved data kept');return}
  if(pending().length){updateSyncStatus();return}
  state.transactions=t.data.map(x=>({id:x.id,type:x.type,amount:+x.amount,currency:x.currency.trim(),category:x.category,paidBy:x.paid_by,accountId:x.account_id||'',account:x.account||'',date:x.date,note:x.note||'',createdAt:x.created_at||''}));
  state.budgets=Object.fromEntries(b.data.map(x=>[x.category,{amount:+x.amount,currency:(x.currency||state.settings.base).trim()}]));
  state.goals=g.data.map(x=>({id:x.id,name:x.name,target:+x.target,saved:+x.saved,currency:x.currency.trim(),due:x.due_date||'',createdAt:x.created_at||''}));
  state.debts=d.data.map(x=>({id:x.id,name:x.name,original:+x.original_amount,remaining:+x.remaining_amount,currency:x.currency.trim(),due:x.due_date||'',createdAt:x.created_at||''}));
  state.assets=a.data.map(x=>({id:x.id,name:x.name,type:x.asset_type,symbol:x.symbol||'',quantity:+x.quantity,currency:x.currency.trim(),manualValue:x.manual_value==null?null:+x.manual_value,notes:x.notes||'',createdAt:x.created_at||''}));
  state.accounts=accounts.data.map(x=>({id:x.id,name:x.name,type:x.account_type,currency:x.currency.trim(),openingBalance:+x.opening_balance,openingDate:x.opening_date,notes:x.notes||'',createdAt:x.created_at||''}));
  cache();render();updateSyncStatus();
}

function subscribeRealtime(){
  if(realtimeChannel)db.removeChannel(realtimeChannel);
  realtimeChannel=db.channel('household-'+householdId)
    .on('postgres_changes',{event:'*',schema:'public',table:'transactions',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .on('postgres_changes',{event:'*',schema:'public',table:'budgets',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .on('postgres_changes',{event:'*',schema:'public',table:'goals',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .on('postgres_changes',{event:'*',schema:'public',table:'debts',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .on('postgres_changes',{event:'*',schema:'public',table:'assets',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .on('postgres_changes',{event:'*',schema:'public',table:'accounts',filter:'household_id=eq.'+householdId},()=>{if(!pending().length)loadRemote()})
    .subscribe(status=>{if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')updateSyncStatus('Realtime reconnecting…')});
}
async function refreshPrices(force){
  if(priceRefresh)return priceRefresh;
  priceRefresh=(async()=>{
  const defaults=['XAU','XAG','BTC','ETH'];
  const owned=state.assets.filter(a=>a.type==='metal'||a.type==='crypto').map(a=>a.symbol).filter(Boolean);
  const symbols=[...new Set([...defaults,...owned])];
  if($('priceStatus'))$('priceStatus').textContent='Refreshing free market prices…';
  let ok=0;
  await Promise.allSettled(symbols.map(async symbol=>{
    const cached=state.prices[symbol];
    if(!force&&cached&&Date.now()-new Date(cached.updated).getTime()<15*60*1000){ok++;return}
    try{
      const r=await fetch('https://api.gold-api.com/price/'+encodeURIComponent(symbol),{cache:'no-store'});
      if(!r.ok)return;
      const j=await r.json();const p=Number(j.price);
      if(Number.isFinite(p)&&p>0){state.prices[symbol]={usd:p,updated:j.updatedAt||new Date().toISOString(),source:'Gold API'};ok++}
    }catch(_e){}
  }));
  cache();render();
  if($('priceStatus')){
    const newest=Object.values(state.prices).map(p=>new Date(p.updated).getTime()).filter(Number.isFinite).sort((a,b)=>b-a)[0];
    const age=newest?Date.now()-newest:Infinity;const stale=age>60*60*1000;
    $('priceStatus').textContent=newest?`${stale?'Last saved prices':'Prices updated'} ${new Date(newest).toLocaleString()}`:(ok?'Prices refreshed':'Live prices unavailable; market assets are excluded from totals.');
  }
  })();try{return await priceRefresh}finally{priceRefresh=null}
}

function openTx(type,id=null,presetCategory=''){
  const existing=id?state.transactions.find(x=>x.id===id):null;if(existing)type=existing.type;
  const categories=type==='income'?incomeCats:expenseCats;
  const categoryOptions=[...new Set([existing?.category,presetCategory,...categories].filter(Boolean))];
  const accountOptions=state.accounts.map(a=>`<option value="${a.id}">${esc(a.name)} · ${a.currency}</option>`).join('');
  openModal(existing?'Edit transaction':type==='income'?'Add income':'Add expense',`<form class="form" id="txForm">
    <label>Amount<input id="txAmount" type="number" step="0.01" min="0.01" required value="${existing?.amount??''}"></label>
    <label>Currency<select id="txCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>${type==='income'?'Income type':'Category'}<select id="txCategory">${categoryOptions.map(x=>`<option>${esc(x)}</option>`).join('')}</select></label>
    <label>${type==='income'?'Received by':'Paid by'}<select id="txBy"><option>Dhani</option><option>Sakhi</option><option>Shared</option></select></label>
    <label>Account<select id="txAccountId"><option value="">Not linked to an account</option>${accountOptions}</select></label>
    ${state.accounts.length?'':'<div class="friendlyNote">Tip: add your bank or cash account on the Money page, then salary and spending will update its balance automatically.</div>'}
    <label>Date<input id="txDate" type="date" value="${existing?.date||new Date().toISOString().slice(0,10)}" required></label>
    <label>Note<input id="txNote" placeholder="Optional" value="${esc(existing?.note||'')}"></label>
    <button class="primary" type="submit">Save</button>
  </form>`);
  $('txCurrency').value=existing?.currency||state.settings.lastCurrency;
  $('txCategory').value=existing?.category||presetCategory||categories[0];
  $('txBy').value=existing?.paidBy||'Dhani';
  $('txAccountId').value=existing?.accountId||'';
  $('txAccountId').onchange=()=>{const a=state.accounts.find(x=>x.id===$('txAccountId').value);if(a)$('txCurrency').value=a.currency};
  $('txForm').onsubmit=async e=>{
    e.preventDefault();rememberCurrency($('txCurrency').value);
    const linked=state.accounts.find(x=>x.id===$('txAccountId').value);
    const tx={id:existing?.id||crypto.randomUUID(),type,amount:+$('txAmount').value,currency:$('txCurrency').value,category:$('txCategory').value,paidBy:$('txBy').value,accountId:linked?.id||'',account:linked?.name||(existing?.accountId?'':existing?.account||''),date:$('txDate').value,note:$('txNote').value,createdAt:existing?.createdAt||new Date().toISOString()};
    const i=state.transactions.findIndex(x=>x.id===tx.id);if(i>=0)state.transactions[i]=tx;else state.transactions.push(tx);
    await saveOperation({action:'upsert',table:'transactions',row:{id:tx.id,household_id:householdId,user_id:currentUser.id,type:tx.type,amount:tx.amount,currency:tx.currency,category:tx.category,paid_by:tx.paidBy,account_id:tx.accountId||null,account:tx.account||null,date:tx.date,note:tx.note||null,updated_at:new Date().toISOString()}});
  };
}
async function deleteTransaction(id){if(!confirm('Delete this transaction?'))return;state.transactions=state.transactions.filter(x=>x.id!==id);enqueue({action:'delete',table:'transactions',id});cache();render();if(await flushPending())await loadRemote()}

function accountBalanceUSD(account){
  return usd(account.openingBalance,account.currency)+state.transactions.filter(t=>t.accountId===account.id&&t.date>=(account.openingDate||'0000-00-00')).reduce((sum,t)=>sum+(t.type==='income'?1:-1)*usd(t.amount,t.currency),0);
}
function accountTypeLabel(type){return type==='bank'?'Bank account':type==='cash'?'Cash':'Mobile wallet'}
function openAccountForm(id=null){
  const a=id?state.accounts.find(x=>x.id===id):null;
  openModal(a?'Edit account':'Add bank, cash or wallet',`<form class="form" id="accountForm">
    <div class="friendlyNote">Enter the balance from just before the first salary or expense you plan to record. After that, linked entries update it automatically.</div>
    <label>Name<input id="accountName" required maxlength="80" value="${esc(a?.name||'')}" placeholder="Main bank account"></label>
    <label>Type<select id="accountType"><option value="bank">Bank account</option><option value="cash">Cash</option><option value="wallet">Mobile wallet</option></select></label>
    <label>Currency<select id="accountCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>Starting balance<input id="accountOpening" type="number" step="0.01" required value="${a?.openingBalance??0}"></label>
    <label>Start tracking from<input id="accountDate" type="date" required value="${a?.openingDate||new Date().toISOString().slice(0,10)}"></label>
    <label>Notes<input id="accountNotes" maxlength="200" value="${esc(a?.notes||'')}" placeholder="Optional"></label>
    <button class="primary" type="submit">${a?'Update account':'Add account'}</button>
  </form>`);
  $('accountType').value=a?.type||'bank';$('accountCurrency').value=a?.currency||state.settings.lastCurrency;
  $('accountForm').onsubmit=async e=>{
    e.preventDefault();
    const name=$('accountName').value.trim();
    if(state.accounts.some(x=>x.id!==a?.id&&x.name.toLowerCase()===name.toLowerCase())){alert('An account with that name already exists.');return}
    const item={id:a?.id||crypto.randomUUID(),name,type:$('accountType').value,currency:$('accountCurrency').value,openingBalance:+$('accountOpening').value,openingDate:$('accountDate').value,notes:$('accountNotes').value.trim(),createdAt:a?.createdAt||new Date().toISOString()};
    rememberCurrency(item.currency);
    const i=state.accounts.findIndex(x=>x.id===item.id);if(i>=0)state.accounts[i]=item;else state.accounts.push(item);
    await saveOperation({action:'upsert',table:'accounts',row:{id:item.id,household_id:householdId,name:item.name,account_type:item.type,currency:item.currency,opening_balance:item.openingBalance,opening_date:item.openingDate,notes:item.notes||null,updated_at:new Date().toISOString()}});
  };
}
function reconcileAccount(id){
  const a=state.accounts.find(x=>x.id===id);if(!a)return;
  const current=fromUSD(accountBalanceUSD(a),a.currency);
  openModal('Correct account balance',`<form class="form" id="reconcileForm">
    <div class="friendlyNote">The app currently shows <b>${money(current,a.currency)}</b>. Enter the real balance from your bank or wallet. A small adjustment will be recorded so your history stays clear.</div>
    <label>Actual balance<input id="actualBalance" type="number" step="0.01" required value="${current.toFixed(2)}"></label>
    <button class="primary" type="submit">Update balance</button>
  </form>`);
  $('reconcileForm').onsubmit=async e=>{
    e.preventDefault();const actual=+$('actualBalance').value;const difference=actual-current;
    if(Math.abs(difference)<0.005){closeModal();return}
    const tx={id:crypto.randomUUID(),type:difference>0?'income':'expense',amount:Math.abs(difference),currency:a.currency,category:'Balance adjustment',paidBy:'Shared',accountId:a.id,account:a.name,date:new Date().toISOString().slice(0,10),note:'Manual account balance correction',createdAt:new Date().toISOString()};
    state.transactions.push(tx);
    await saveOperation({action:'upsert',table:'transactions',row:{id:tx.id,household_id:householdId,user_id:currentUser.id,type:tx.type,amount:tx.amount,currency:tx.currency,category:tx.category,paid_by:tx.paidBy,account_id:tx.accountId,account:tx.account,date:tx.date,note:tx.note,updated_at:new Date().toISOString()}});
  };
}
async function deleteAccount(id){
  if(!confirm('Remove this account? Its salary and expense history will stay in the Timeline.'))return;
  state.accounts=state.accounts.filter(x=>x.id!==id);
  state.transactions=state.transactions.map(t=>t.accountId===id?{...t,accountId:''}:t);
  enqueue({action:'delete',table:'accounts',id});cache();render();if(await flushPending())await loadRemote();
}

function openBudget(){
  const categories=[...new Set([...Object.keys(DEFAULT.budgets),...Object.keys(state.budgets)])];
  openModal('Monthly budget',`<form class="form" id="budgetForm">${categories.map(c=>{const v=state.budgets[c]||{amount:0,currency:state.settings.base};return `<label>${esc(c)}<div class="buttonRow"><input id="budget_${esc(c)}" type="number" step="0.01" min="0" value="${v.amount}" required><select id="budgetCurrency_${esc(c)}"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></div></label>`}).join('')}<button class="primary" type="submit">Save budget</button></form>`);
  categories.forEach(c=>$('budgetCurrency_'+c).value=state.budgets[c]?.currency||state.settings.base);
  $('budgetForm').onsubmit=async e=>{
    e.preventDefault();categories.forEach(c=>state.budgets[c]={amount:+$('budget_'+c).value||0,currency:$('budgetCurrency_'+c).value});
    const rows=Object.entries(state.budgets).map(([category,value])=>({household_id:householdId,category,amount:value.amount,currency:value.currency}));
    await saveOperation({action:'budget',rows});
  };
}

function openGoalForm(id=null){
  const g=id?state.goals.find(x=>x.id===id):null;
  openModal(g?'Edit goal':'Add savings goal',`<form class="form" id="goalForm">
    <label>Name<input id="goalName" required value="${esc(g?.name||'')}"></label>
    <label>Target amount<input id="goalTarget" type="number" step="0.01" min="0" required value="${g?.target??''}"></label>
    <label>Saved so far<input id="goalSavedInput" type="number" step="0.01" min="0" value="${g?.saved??0}"></label>
    <label>Currency<select id="goalCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>Due date<input id="goalDue" type="date" value="${g?.due||''}"></label>
    <button class="primary" type="submit">${g?'Update goal':'Add goal'}</button>
  </form>`);
  $('goalCurrency').value=g?.currency||state.settings.lastCurrency;
  $('goalForm').onsubmit=async e=>{
    e.preventDefault();rememberCurrency($('goalCurrency').value);
    const item={id:g?.id||crypto.randomUUID(),name:$('goalName').value.trim(),target:+$('goalTarget').value,saved:+$('goalSavedInput').value,currency:$('goalCurrency').value,due:$('goalDue').value};
    const i=state.goals.findIndex(x=>x.id===item.id);if(i>=0)state.goals[i]=item;else state.goals.push(item);
    await saveOperation({action:'upsert',table:'goals',row:{id:item.id,household_id:householdId,name:item.name,target:item.target,saved:item.saved,currency:item.currency,due_date:item.due||null}});
  };
}
async function deleteGoal(id){if(!confirm('Delete this goal?'))return;state.goals=state.goals.filter(x=>x.id!==id);enqueue({action:'delete',table:'goals',id});cache();render();if(await flushPending())await loadRemote()}

function openDebtForm(id=null){
  const d=id?state.debts.find(x=>x.id===id):null;
  openModal(d?'Edit debt':'Add debt',`<form class="form" id="debtForm">
    <label>Name<input id="debtName" required value="${esc(d?.name||'')}"></label>
    <label>Original amount<input id="debtOriginal" type="number" step="0.01" min="0" required value="${d?.original??''}"></label>
    <label>Remaining amount<input id="debtRemaining" type="number" step="0.01" min="0" required value="${d?.remaining??''}"></label>
    <label>Currency<select id="debtCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>Due date<input id="debtDue" type="date" value="${d?.due||''}"></label>
    <button class="primary" type="submit">${d?'Update debt':'Add debt'}</button>
  </form>`);
  $('debtCurrency').value=d?.currency||state.settings.lastCurrency;
  $('debtForm').onsubmit=async e=>{
    e.preventDefault();rememberCurrency($('debtCurrency').value);
    const item={id:d?.id||crypto.randomUUID(),name:$('debtName').value.trim(),original:+$('debtOriginal').value,remaining:+$('debtRemaining').value,currency:$('debtCurrency').value,due:$('debtDue').value};
    const i=state.debts.findIndex(x=>x.id===item.id);if(i>=0)state.debts[i]=item;else state.debts.push(item);
    await saveOperation({action:'upsert',table:'debts',row:{id:item.id,household_id:householdId,name:item.name,original_amount:item.original,remaining_amount:item.remaining,currency:item.currency,due_date:item.due||null}});
  };
}
async function deleteDebt(id){if(!confirm('Delete this debt?'))return;state.debts=state.debts.filter(x=>x.id!==id);enqueue({action:'delete',table:'debts',id});cache();render();if(await flushPending())await loadRemote()}
function openAssetForm(id=null){
  const a=id?state.assets.find(x=>x.id===id):null;
  openModal(a?'Edit asset':'Add asset',`<form class="form" id="assetForm">
    <div class="friendlyNote">Add investments, gold or property here. Put bank, cash and wallet balances in Accounts so your net worth is not counted twice.</div>
    <label>Asset name<input id="assetName" required value="${esc(a?.name||'')}" placeholder="Gold jewellery / Investment / Property"></label>
    <label>Type<select id="assetType">${a?.type==='cash'?'<option value="cash">Legacy cash balance</option>':''}<option value="manual">Other asset / investment</option><option value="metal">Precious metal</option><option value="crypto">Crypto</option></select></label>
    <div id="assetSymbolWrap" class="hidden"><label>Asset<select id="assetSymbol"></select></label></div>
    <label id="assetQuantityLabel">Amount / quantity<input id="assetQuantity" type="number" step="0.00000001" min="0" value="${a?.quantity??''}"></label>
    <label id="assetCurrencyWrap">Currency<select id="assetCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label id="assetManualWrap" class="hidden">Current total value<input id="assetManualValue" type="number" step="0.01" min="0" value="${a?.manualValue??''}"></label>
    <label>Notes<input id="assetNotes" value="${esc(a?.notes||'')}" placeholder="Optional"></label>
    <button class="primary" type="submit">${a?'Update asset':'Save asset'}</button>
  </form>`);
  $('assetType').value=a?.type||'manual';$('assetCurrency').value=a?.currency||state.settings.lastCurrency;
  $('assetType').onchange=()=>configureAssetForm();configureAssetForm(a?.symbol||'');
  $('assetForm').onsubmit=async e=>{
    e.preventDefault();const type=$('assetType').value;const currency=$('assetCurrency').value;rememberCurrency(currency);
    const item={id:a?.id||crypto.randomUUID(),name:$('assetName').value.trim(),type,symbol:(type==='metal'||type==='crypto')?$('assetSymbol').value:'',quantity:+$('assetQuantity').value,currency,manualValue:type==='manual'?+$('assetManualValue').value:null,notes:$('assetNotes').value.trim()};
    if(type!=='manual'&&!(item.quantity>0)){alert('Enter an amount or quantity greater than zero.');return}
    const i=state.assets.findIndex(x=>x.id===item.id);if(i>=0)state.assets[i]=item;else state.assets.push(item);
    await saveOperation({action:'upsert',table:'assets',row:{id:item.id,household_id:householdId,user_id:currentUser.id,name:item.name,asset_type:item.type,symbol:item.symbol||null,quantity:item.quantity||0,currency:item.currency,manual_value:item.manualValue,notes:item.notes||null,updated_at:new Date().toISOString()}});await refreshPrices(true);
  };
}
function configureAssetForm(selected=''){
  const type=$('assetType').value;const wrap=$('assetSymbolWrap');const curr=$('assetCurrencyWrap');const manual=$('assetManualWrap');const qLabel=$('assetQuantityLabel');const sym=$('assetSymbol');
  const market=type==='metal'||type==='crypto';wrap.classList.toggle('hidden',!market);curr.classList.toggle('hidden',market);manual.classList.toggle('hidden',type!=='manual');
  if(type==='metal'){
    sym.innerHTML=metalChoices.map(([s,n])=>`<option value="${s}">${n} (${s})</option>`).join('');qLabel.childNodes[0].nodeValue='Weight in grams';
  }else if(type==='crypto'){
    sym.innerHTML=cryptoChoices.map(([s,n])=>`<option value="${s}">${n} (${s})</option>`).join('');qLabel.childNodes[0].nodeValue='Coin quantity';
  }else if(type==='cash'){qLabel.childNodes[0].nodeValue='Balance';}
  else{qLabel.childNodes[0].nodeValue='Quantity (optional reference)';}
  if(selected&&market)sym.value=selected;
}
async function deleteAsset(id){if(!confirm('Delete this asset?'))return;state.assets=state.assets.filter(x=>x.id!==id);enqueue({action:'delete',table:'assets',id});cache();render();if(await flushPending())await loadRemote()}

function assetUSD(a){
  if(a.type==='cash')return usd(a.quantity,a.currency);
  if(a.type==='manual')return usd(a.manualValue||0,a.currency);
  const price=state.prices[a.symbol]?.usd;if(!price)return 0;
  if(a.type==='metal')return (a.quantity/31.1034768)*price;
  if(a.type==='crypto')return a.quantity*price;
  return 0;
}
function marketLabel(a){
  if(a.type==='metal')return `${Number(a.quantity).toLocaleString()} g · ${a.symbol}`;
  if(a.type==='crypto')return `${Number(a.quantity).toLocaleString(undefined,{maximumFractionDigits:8})} ${a.symbol}`;
  if(a.type==='cash')return money(a.quantity,a.currency);
  return money(a.manualValue||0,a.currency);
}

function saveSettings(){
  const rates={USD:1,AED:+$('rateAED').value,MVR:+$('rateMVR').value,INR:+$('rateINR').value};
  if(!rates.AED||!rates.MVR||!rates.INR){alert('Exchange rates must be greater than zero.');return}
  state.settings.base=$('baseCurrency').value;state.settings.rates=rates;cache();render();
  $('syncStatus').textContent='Settings saved on this device';setTimeout(()=>{if(currentUser)$('syncStatus').textContent='Synced'},1500);
}
async function signOut(){if(db)await db.auth.signOut();showAuth()}

function txHtml(t,actions=false){
  const account=t.account?' · '+esc(t.account):'';
  return `<div class="tx"><div class="left"><div class="dot">${t.type==='income'?'↑':'↓'}</div><div class="txMain"><div class="name">${esc(t.category)}</div><div class="meta">${esc(t.paidBy)} · ${esc(t.date)}${account}${t.note?' · '+esc(t.note):''}</div>${actions?`<div class="txActions"><button class="linkBtn" onclick="openTx('${t.type}','${t.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${t.id}')">Delete</button></div>`:''}</div></div><b class="${t.type==='income'?'inc':'exp'}">${t.type==='income'?'+':'−'} ${money(t.amount,t.currency)}</b></div>`;
}

function trajectorySvg(currentUSD,monthlyGrowthUSD){
  if(!(monthlyGrowthUSD>0))return '<div class="emptyChart"><b>Add your salary to see the next 12 months</b><span>The chart will use 30% for debt and 20% for savings and goals.</span></div>';
  const values=Array.from({length:13},(_,i)=>currentUSD+monthlyGrowthUSD*i);
  const low=Math.min(0,...values),high=Math.max(0,...values),range=Math.max(1,high-low);
  const points=values.map((v,i)=>`${44+i*(552/12)},${174-((v-low)/range)*132}`).join(' ');
  const zeroY=174-((0-low)/range)*132;
  const end=values[12];
  return `<div class="trajectoryLabels"><div><span>Now</span><b>${money(fromUSD(currentUSD,state.settings.base))}</b></div><div><span>In 12 months</span><b>${money(fromUSD(end,state.settings.base))}</b></div></div>
    <svg class="trajectorySvg" viewBox="0 0 640 205" role="img" aria-label="Projected net worth for the next 12 months">
      <defs><linearGradient id="trajectoryFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f46e5" stop-opacity=".28"/><stop offset="1" stop-color="#4f46e5" stop-opacity=".02"/></linearGradient></defs>
      <line x1="44" y1="${zeroY}" x2="596" y2="${zeroY}" class="zeroLine"/>
      <polygon points="44,174 ${points} 596,174" fill="url(#trajectoryFill)"/>
      <polyline points="${points}" class="trajectoryLine"/>
      <circle cx="44" cy="${points.split(' ')[0].split(',')[1]}" r="5" class="trajectoryPoint"/>
      <circle cx="596" cy="${points.split(' ')[12].split(',')[1]}" r="6" class="trajectoryPoint"/>
      <text x="44" y="197">NOW</text><text x="596" y="197" text-anchor="end">12 MONTHS</text>
    </svg>
    <div class="chartFoot">Plan: ${money(fromUSD(monthlyGrowthUSD,state.settings.base))} each month toward debt reduction and your future. This estimate excludes interest and market changes.</div>`;
}

function timelineEvents(){
  const events=[];
  state.transactions.forEach(t=>events.push({date:t.date,kind:t.type,title:t.category,detail:`${t.type==='income'?'+':'−'} ${money(t.amount,t.currency)}${t.account?' · '+t.account:''}`}));
  state.accounts.forEach(a=>events.push({date:a.openingDate,kind:'account',title:`${a.name} tracking started`,detail:`Opening balance ${money(a.openingBalance,a.currency)}`}));
  state.assets.forEach(a=>{if(a.createdAt)events.push({date:a.createdAt.slice(0,10),kind:'asset',title:`${a.name} added`,detail:`Asset · ${money(fromUSD(assetUSD(a),state.settings.base))}`})});
  state.debts.forEach(d=>{
    if(d.createdAt)events.push({date:d.createdAt.slice(0,10),kind:'debt',title:`${d.name} added`,detail:`Debt · ${money(d.remaining,d.currency)} remaining`});
    if(d.due)events.push({date:d.due,kind:'debt',title:`${d.name} due`,detail:`${money(d.remaining,d.currency)} remaining`});
  });
  state.goals.forEach(g=>{
    if(g.createdAt)events.push({date:g.createdAt.slice(0,10),kind:'goal',title:`${g.name} goal added`,detail:`${money(g.saved,g.currency)} saved`});
    if(g.due)events.push({date:g.due,kind:'goal',title:`${g.name} target date`,detail:`Goal ${money(g.target,g.currency)}`});
  });
  const budgetUSD=Object.values(state.budgets).reduce((sum,b)=>sum+usd(b.amount,b.currency),0);
  if(budgetUSD>0)events.push({date:month()+'-01',kind:'budget',title:'Monthly budget plan',detail:money(fromUSD(budgetUSD,state.settings.base))});
  return events.filter(e=>e.date).sort((a,b)=>b.date.localeCompare(a.date));
}
function timelineHtml(){
  const events=timelineEvents();
  if(!events.length)return '<div class="card hint">Your timeline will appear as you add salary, spending, accounts, debts, goals and assets.</div>';
  return events.slice(0,100).map(e=>{
    const date=new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric'}).format(new Date(e.date+'T00:00:00'));
    return `<div class="timelineItem"><div class="timelineDot ${e.kind}"></div><div class="timelineBody"><div class="timelineDate">${esc(date)}</div><div class="timelineTitle">${esc(e.title)}</div><div class="meta">${esc(e.detail)}</div></div></div>`;
  }).join('');
}

function buildMoneySuggestions({incomeUSD,spentUSD,balanceUSD,assetTotalUSD,debtUSD,goalSavedUSD,goalTargetUSD,budgetUSD}){
  const suggestions=[];const currentMonth=month();
  const spentIn=cats=>state.transactions.filter(t=>t.type==='expense'&&t.date.startsWith(currentMonth)&&cats.includes(t.category)).reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const essentialsUSD=spentIn(['Housing','Food','Transport','Bills','Health']);
  const wantsUSD=spentIn(['Shopping','Entertainment','Travel','Other']);
  if(!state.accounts.length)suggestions.push(['Add your real balance','Add your main bank account with today’s balance. Then choose it for salary and expenses so Money stays current.']);
  if(!state.transactions.some(t=>t.type==='income'&&t.date.startsWith(currentMonth)))suggestions.push(['Add this month’s salary','Once income is entered, the app will turn 40–30–20–10 into clear monthly amounts and show your one-year direction.']);
  if(incomeUSD>0){
    const essentialTarget=incomeUSD*.4,wantsTarget=incomeUSD*.1;
    if(essentialsUSD>essentialTarget)suggestions.push(['Bring essentials toward 40%',`Essentials are ${money(fromUSD(essentialsUSD,state.settings.base))} this month, above the ${money(fromUSD(essentialTarget,state.settings.base))} guide. Start with the largest bill you can safely reduce.`]);
    if(wantsUSD>wantsTarget)suggestions.push(['Protect the 10% fun limit',`Wants are above the ${money(fromUSD(wantsTarget,state.settings.base))} monthly guide. Pause non-essential spending until next month.`]);
  }
  if(debtUSD>0&&incomeUSD>0){
    const payment=incomeUSD*.3,months=Math.max(1,Math.ceil(debtUSD/Math.max(payment,.01)));
    suggestions.push(['Use 30% to clear debt',`Aim for ${money(fromUSD(payment,state.settings.base))} a month. The tracked balance could clear in roughly ${months} month${months===1?'':'s'}, before interest or new borrowing.`]);
  }else if(debtUSD>0)suggestions.push(['Debt gets the next 30%','After salary is added, reserve 30% for debt and keep paying the highest-interest balance first.']);
  const goalGap=Math.max(0,goalTargetUSD-goalSavedUSD);
  if(incomeUSD>0&&goalGap>0){
    const future=incomeUSD*.2,months=Math.max(1,Math.ceil(goalGap/Math.max(future,.01)));
    suggestions.push(['Grow the future with 20%',`Move ${money(fromUSD(future,state.settings.base))} monthly to savings and goals. At that pace, the tracked goal gap is about ${months} month${months===1?'':'s'}.`]);
  }else if(incomeUSD>0&&goalTargetUSD<=0)suggestions.push(['Give the 20% a purpose','Add one simple savings goal, such as an emergency fund, so your future money has a clear destination.']);
  if(!suggestions.length)suggestions.push(['Keep the plan simple','Use 40% for essentials, 30% for debt, 20% for your future and 10% for wants. Update account balances whenever reality differs.']);
  return suggestions.slice(0,4);
}

function render(){
  const tx=state.transactions.filter(t=>t.date.startsWith(month()));
  const incomeUSD=tx.filter(t=>t.type==='income').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const spentUSD=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const accountTotalUSD=state.accounts.reduce((sum,a)=>sum+accountBalanceUSD(a),0);
  const unassignedTransactions=state.transactions.filter(t=>!t.accountId);
  const unassignedCashUSD=unassignedTransactions.reduce((s,t)=>s+(t.type==='income'?1:t.type==='expense'?-1:0)*usd(t.amount,t.currency),0);
  const trackedCashUSD=accountTotalUSD+unassignedCashUSD;
  $('balance').textContent=money(fromUSD(trackedCashUSD,state.settings.base));
  $('income').textContent=money(fromUSD(incomeUSD,state.settings.base));
  $('spent').textContent=money(fromUSD(spentUSD,state.settings.base));
  $('saved').textContent=money(fromUSD(incomeUSD-spentUSD,state.settings.base));

  const budgetUSD=Object.values(state.budgets).reduce((sum,b)=>sum+usd(b.amount,b.currency),0);const budgetTotal=fromUSD(budgetUSD,state.settings.base);const used=fromUSD(spentUSD,state.settings.base);const rem=budgetTotal-used;
  $('budget').textContent=money(budgetTotal);$('remaining').textContent=money(rem);$('budgetMsg').textContent=rem<0?'Over budget':'Remaining';$('bar').style.width=Math.min(100,used/Math.max(1,budgetTotal)*100)+'%';
  $('budgetPageTotal').textContent=money(budgetTotal);$('budgetPageRemaining').textContent=money(rem);$('budgetPageStatus').textContent=rem<0?'Over budget':'Remaining';
  $('budgetList').innerHTML=Object.keys(state.budgets).length?Object.entries(state.budgets).map(([category,b])=>{const spent=state.transactions.filter(t=>t.type==='expense'&&t.category===category&&t.date.startsWith(month())).reduce((s,t)=>s+usd(t.amount,t.currency),0);const limit=usd(b.amount,b.currency);const ratio=Math.min(1,spent/Math.max(limit,0.01));return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(category)}</h3><div class="meta">${money(fromUSD(spent,state.settings.base))} spent of ${money(fromUSD(limit,state.settings.base))}</div></div><span class="pill">${Math.round(ratio*100)}%</span></div><div class="miniBar"><i style="width:${ratio*100}%"></i></div></div>`}).join(''):'<div class="card hint">No budget set. Select Edit budget to start.</div>';

  const sorted=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  $('txList').innerHTML=sorted.length?sorted.slice(0,8).map(t=>txHtml(t,false)).join(''):'<div class="hint">No transactions yet.</div>';
  $('allTx').innerHTML=sorted.length?sorted.map(t=>txHtml(t,true)).join(''):'<div class="hint">No transactions yet.</div>';

  const debtUSD=state.debts.reduce((s,d)=>s+usd(d.remaining,d.currency),0);$('totalDebt').textContent=money(fromUSD(debtUSD,state.settings.base));
  $('debtList').innerHTML=state.debts.length?state.debts.map(d=>{const paid=Math.max(0,Math.min(1,1-d.remaining/Math.max(d.original,1)));return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(d.name)}</h3><div class="meta">${money(d.remaining,d.currency)} remaining of ${money(d.original,d.currency)}${d.due?' · Due '+esc(d.due):''}</div></div><span class="pill">${Math.round(paid*100)}% paid</span></div><div class="miniBar"><i style="width:${paid*100}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openDebtForm('${d.id}')">Edit</button><button class="dangerLink" onclick="deleteDebt('${d.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No debts added.</div>';

  const goalUSD=state.goals.reduce((s,g)=>s+usd(g.saved,g.currency),0);$('goalSaved').textContent=money(fromUSD(goalUSD,state.settings.base));
  $('goalList').innerHTML=state.goals.length?state.goals.map(g=>{const p=Math.max(0,Math.min(1,g.saved/Math.max(g.target,1)));return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(g.name)}</h3><div class="meta">${money(g.saved,g.currency)} of ${money(g.target,g.currency)}${g.due?' · Target '+esc(g.due):''}</div></div><span class="pill">${Math.round(p*100)}%</span></div><div class="miniBar"><i style="width:${p*100}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openGoalForm('${g.id}')">Edit</button><button class="dangerLink" onclick="deleteGoal('${g.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No goals added.</div>';

  $('accountTotal').textContent=money(fromUSD(accountTotalUSD,state.settings.base));
  const accountCards=state.accounts.map(a=>{
    const currentUSD=accountBalanceUSD(a);const nativeBalance=fromUSD(currentUSD,a.currency);const baseLine=a.currency===state.settings.base?'':` · ${money(fromUSD(currentUSD,state.settings.base))} total`;
    return `<div class="accountCard"><div class="cardTop"><div><div class="accountBadge">${esc(accountTypeLabel(a.type))}</div><h3>${esc(a.name)}</h3><div class="meta">Tracking since ${esc(a.openingDate)}${a.notes?' · '+esc(a.notes):''}</div></div><div class="value">${money(nativeBalance,a.currency)}<div class="meta">${esc(baseLine.replace(/^ · /,''))}</div></div></div><div class="cardActions"><button class="linkBtn" onclick="reconcileAccount('${a.id}')">Correct balance</button><button class="linkBtn" onclick="openAccountForm('${a.id}')">Edit</button><button class="dangerLink" onclick="deleteAccount('${a.id}')">Delete</button></div></div>`;
  });
  if(unassignedTransactions.length)accountCards.push(`<div class="accountCard unassigned"><div class="cardTop"><div><div class="accountBadge">Not linked</div><h3>Older entries</h3><div class="meta">${unassignedTransactions.length} transaction${unassignedTransactions.length===1?'':'s'} without an account. They still count in Money available.</div></div><div class="value">${money(fromUSD(unassignedCashUSD,state.settings.base))}</div></div></div>`);
  $('accountList').innerHTML=accountCards.length?accountCards.join(''):'<div class="card friendlyEmpty"><b>Start with your main bank account</b><span>Add its current balance, then choose it whenever you add salary or spending.</span><button class="secondary compact" onclick="openAccountForm()">＋ Add account</button></div>';

  const spendFor=categories=>tx.filter(t=>t.type==='expense'&&categories.includes(t.category)).reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const buckets=[
    {key:'essential',label:'Essentials',pct:40,target:incomeUSD*.4,actual:spendFor(['Housing','Food','Transport','Bills','Health'])},
    {key:'debt',label:'Debt payoff',pct:30,target:incomeUSD*.3,actual:spendFor(['Debt'])},
    {key:'future',label:'Goals & savings',pct:20,target:incomeUSD*.2,actual:spendFor(['Savings'])},
    {key:'wants',label:'Wants',pct:10,target:incomeUSD*.1,actual:spendFor(['Shopping','Entertainment','Travel','Other'])}
  ];
  $('allocationIncome').textContent=incomeUSD>0?`${money(fromUSD(incomeUSD,state.settings.base))} income`:'Add salary';
  $('allocationSummary').innerHTML=buckets.map(b=>`<div class="allocationItem ${b.key}"><div class="allocationHeading"><span class="allocationColor"></span><b>${b.pct}% ${esc(b.label)}</b></div><div class="allocationTarget">${money(fromUSD(b.target,state.settings.base))}</div><div class="meta">Used ${money(fromUSD(b.actual,state.settings.base))} this month</div></div>`).join('');

  const assetTotalUSD=state.assets.reduce((s,a)=>s+assetUSD(a),0);$('assetTotal').textContent=money(fromUSD(assetTotalUSD,state.settings.base));
  const goalTargetUSD=state.goals.reduce((s,g)=>s+usd(g.target,g.currency),0);const goalProgressRatio=goalTargetUSD>0?Math.min(1,goalUSD/goalTargetUSD):0;
  const netWorthUSD=trackedCashUSD+assetTotalUSD-debtUSD;const surplusUSD=incomeUSD-spentUSD;const savingRate=incomeUSD>0?surplusUSD/incomeUSD:0;
  $('netWorth').textContent=money(fromUSD(netWorthUSD,state.settings.base));$('netWorthCash').textContent=money(fromUSD(trackedCashUSD,state.settings.base));$('netWorthAssets').textContent=money(fromUSD(assetTotalUSD,state.settings.base));$('netWorthDebt').textContent=money(fromUSD(debtUSD,state.settings.base));$('monthlySurplus').textContent=money(fromUSD(surplusUSD,state.settings.base));
  $('goalProgress').style.width=(goalProgressRatio*100)+'%';$('goalProgressText').textContent=Math.round(goalProgressRatio*100)+'%';$('savingsRate').textContent=(incomeUSD>0?Math.round(savingRate*100):0)+'% left';
  $('wealthMessage').textContent=netWorthUSD<0?'You are not stuck—every debt payment raises this number.':debtUSD>0?'Your money and assets are growing while you work toward becoming debt-free.':netWorthUSD>0?'You are building real financial momentum together. Keep going.':'Add your bank balance and salary to see your starting point.';
  $('trajectoryChart').innerHTML=trajectorySvg(netWorthUSD,incomeUSD*.5);
  const advice=buildMoneySuggestions({incomeUSD,spentUSD,balanceUSD:trackedCashUSD,assetTotalUSD,debtUSD,goalSavedUSD:goalUSD,goalTargetUSD,budgetUSD});
  $('wealthSuggestions').innerHTML=advice.map(([title,body],i)=>`<div class="adviceCard"><span class="adviceNumber">${i+1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join('');
  $('marketStrip').innerHTML=['XAU','XAG','BTC','ETH'].map(sym=>{const p=state.prices[sym];const unit=sym==='XAU'||sym==='XAG'?' / oz':'';return `<div class="quote"><span>${sym}</span><b>${p?money(p.usd,'USD')+unit:'—'}</b></div>`}).join('');
  $('assetList').innerHTML=state.assets.length?state.assets.map(a=>{const valueUSD=assetUSD(a);const p=state.prices[a.symbol];const missing=(a.type==='metal'||a.type==='crypto')&&!p;const legacy=a.type==='cash'?'<div class="meta legacyNote">Move this balance to Accounts when convenient to keep tracking simple.</div>':'';return `<div class="assetCard"><div class="cardTop"><div><h3>${esc(a.name)}</h3><div class="meta">${esc(marketLabel(a))}${a.notes?' · '+esc(a.notes):''}</div>${legacy}${p?`<div class="meta">Live ${a.symbol}: ${money(p.usd,'USD')}${a.type==='metal'?' / oz':''}</div>`:''}${missing?'<div class="meta">Live price unavailable; value will refresh later.</div>':''}</div><div class="value">${money(fromUSD(valueUSD,state.settings.base))}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAssetForm('${a.id}')">Edit</button><button class="dangerLink" onclick="deleteAsset('${a.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No other assets added yet.</div>';

  $('timelineList').innerHTML=timelineHtml();
  $('baseCurrency').value=state.settings.base;$('rateAED').value=state.settings.rates.AED;$('rateMVR').value=state.settings.rates.MVR;$('rateINR').value=state.settings.rates.INR;
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();showPage('home');boot();
