const VERSION=5;
const LEGACY_KEYS=['our_budget_v4','our_budget_v3','our_budget_v2'];
const DEFAULT={
  version:VERSION,settings:{base:'AED',lastCurrency:'AED',rates:{USD:1,AED:3.6725,MVR:15.42,INR:88}},
  transactions:[],budgets:{Housing:{amount:3000,currency:'AED'},Food:{amount:1500,currency:'AED'},Transport:{amount:800,currency:'AED'},Bills:{amount:1000,currency:'AED'},Shopping:{amount:700,currency:'AED'},Other:{amount:500,currency:'AED'}},
  goals:[],debts:[],assets:[],prices:{}
};
let state=structuredClone(DEFAULT);
let db=null,currentUser=null,householdId=null,realtimeChannel=null,currentPage='home',stateKey='',pendingKey='',priceRefresh=null;
const cats=['Housing','Food','Transport','Bills','Shopping','Entertainment','Health','Travel','Debt','Savings','Other'];
const metalChoices=[['XAU','Gold'],['XAG','Silver'],['XPT','Platinum'],['XPD','Palladium']];
const cryptoChoices=[['BTC','Bitcoin'],['ETH','Ethereum'],['LTC','Litecoin'],['XRP','XRP'],['DOT','Polkadot'],['ADA','Cardano']];
const $=id=>document.getElementById(id);

function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function safeParse(value){try{return JSON.parse(value)}catch(_e){return null}}
function normalizeState(raw){
  const next=Object.assign(structuredClone(DEFAULT),raw||{});next.version=VERSION;
  next.settings=Object.assign({},DEFAULT.settings,raw?.settings||{});next.settings.rates=Object.assign({},DEFAULT.settings.rates,raw?.settings?.rates||{});
  next.settings.lastCurrency=next.settings.lastCurrency||next.settings.base||'AED';
  next.transactions=Array.isArray(next.transactions)?next.transactions:[];next.goals=Array.isArray(next.goals)?next.goals:[];next.debts=Array.isArray(next.debts)?next.debts:[];next.assets=Array.isArray(next.assets)?next.assets:[];next.prices=next.prices||{};
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
  if(name==='assets')refreshPrices(false);
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
  const [t,b,g,d,a]=await Promise.all([
    db.from('transactions').select('*').eq('household_id',householdId),
    db.from('budgets').select('*').eq('household_id',householdId),
    db.from('goals').select('*').eq('household_id',householdId),
    db.from('debts').select('*').eq('household_id',householdId),
    db.from('assets').select('*').eq('household_id',householdId)
  ]);
  const failed=[t,b,g,d,a].filter(x=>x.error);if(failed.length){updateSyncStatus('Could not refresh · saved data kept');return}
  if(pending().length){updateSyncStatus();return}
  state.transactions=t.data.map(x=>({id:x.id,type:x.type,amount:+x.amount,currency:x.currency.trim(),category:x.category,paidBy:x.paid_by,account:x.account||'',date:x.date,note:x.note||''}));
  state.budgets=Object.fromEntries(b.data.map(x=>[x.category,{amount:+x.amount,currency:(x.currency||state.settings.base).trim()}]));
  state.goals=g.data.map(x=>({id:x.id,name:x.name,target:+x.target,saved:+x.saved,currency:x.currency.trim(),due:x.due_date||''}));
  state.debts=d.data.map(x=>({id:x.id,name:x.name,original:+x.original_amount,remaining:+x.remaining_amount,currency:x.currency.trim(),due:x.due_date||''}));
  state.assets=a.data.map(x=>({id:x.id,name:x.name,type:x.asset_type,symbol:x.symbol||'',quantity:+x.quantity,currency:x.currency.trim(),manualValue:x.manual_value==null?null:+x.manual_value,notes:x.notes||''}));
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

function openTx(type,id=null){
  const existing=id?state.transactions.find(x=>x.id===id):null;if(existing)type=existing.type;
  openModal(existing?'Edit transaction':type==='income'?'Add income':'Add expense',`<form class="form" id="txForm">
    <label>Amount<input id="txAmount" type="number" step="0.01" min="0.01" required value="${existing?.amount??''}"></label>
    <label>Currency<select id="txCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>Category<select id="txCategory">${cats.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Paid by<select id="txBy"><option>Dhani</option><option>Sakhi</option><option>Shared</option></select></label>
    <label>Account<input id="txAccount" placeholder="Cash / Bank / Card" value="${esc(existing?.account||'')}"></label>
    <label>Date<input id="txDate" type="date" value="${existing?.date||new Date().toISOString().slice(0,10)}" required></label>
    <label>Note<input id="txNote" placeholder="Optional" value="${esc(existing?.note||'')}"></label>
    <button class="primary" type="submit">Save</button>
  </form>`);
  $('txCurrency').value=existing?.currency||state.settings.lastCurrency;$('txCategory').value=existing?.category||cats[0];$('txBy').value=existing?.paidBy||'Dhani';
  $('txForm').onsubmit=async e=>{
    e.preventDefault();rememberCurrency($('txCurrency').value);
    const tx={id:existing?.id||crypto.randomUUID(),type,amount:+$('txAmount').value,currency:$('txCurrency').value,category:$('txCategory').value,paidBy:$('txBy').value,account:$('txAccount').value,date:$('txDate').value,note:$('txNote').value};
    const i=state.transactions.findIndex(x=>x.id===tx.id);if(i>=0)state.transactions[i]=tx;else state.transactions.push(tx);
    await saveOperation({action:'upsert',table:'transactions',row:{id:tx.id,household_id:householdId,user_id:currentUser.id,type:tx.type,amount:tx.amount,currency:tx.currency,category:tx.category,paid_by:tx.paidBy,account:tx.account||null,date:tx.date,note:tx.note||null,updated_at:new Date().toISOString()}});
  };
}
async function deleteTransaction(id){if(!confirm('Delete this transaction?'))return;state.transactions=state.transactions.filter(x=>x.id!==id);enqueue({action:'delete',table:'transactions',id});cache();render();if(await flushPending())await loadRemote()}

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
    <label>Asset name<input id="assetName" required value="${esc(a?.name||'')}" placeholder="Gold jewellery / Bitcoin / Savings account"></label>
    <label>Type<select id="assetType"><option value="cash">Cash / Bank balance</option><option value="manual">Other asset / investment</option><option value="metal">Precious metal</option><option value="crypto">Crypto</option></select></label>
    <div id="assetSymbolWrap" class="hidden"><label>Asset<select id="assetSymbol"></select></label></div>
    <label id="assetQuantityLabel">Amount / quantity<input id="assetQuantity" type="number" step="0.00000001" min="0" value="${a?.quantity??''}"></label>
    <label id="assetCurrencyWrap">Currency<select id="assetCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label id="assetManualWrap" class="hidden">Current total value<input id="assetManualValue" type="number" step="0.01" min="0" value="${a?.manualValue??''}"></label>
    <label>Notes<input id="assetNotes" value="${esc(a?.notes||'')}" placeholder="Optional"></label>
    <button class="primary" type="submit">${a?'Update asset':'Save asset'}</button>
  </form>`);
  $('assetType').value=a?.type||'cash';$('assetCurrency').value=a?.currency||state.settings.lastCurrency;
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

function txHtml(t,actions=false){return `<div class="tx"><div class="left"><div class="dot">${t.type==='income'?'↑':'↓'}</div><div class="txMain"><div class="name">${esc(t.category)}</div><div class="meta">${esc(t.paidBy)} · ${esc(t.date)}${t.note?' · '+esc(t.note):''}</div>${actions?`<div class="txActions"><button class="linkBtn" onclick="openTx('${t.type}','${t.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${t.id}')">Delete</button></div>`:''}</div></div><b class="${t.type==='income'?'inc':'exp'}">${t.type==='income'?'+':'−'} ${money(t.amount,t.currency)}</b></div>`}

function buildMoneySuggestions({incomeUSD,spentUSD,balanceUSD,assetTotalUSD,debtUSD,goalSavedUSD,goalTargetUSD,budgetUSD}){
  const surplus=incomeUSD-spentUSD;const suggestions=[];
  if(!state.transactions.length)suggestions.push(['Start with visibility','Add your income and every expense for one full month. Accurate tracking is the first step to making your money work for you.']);
  if(incomeUSD>0){
    const rate=surplus/incomeUSD;
    if(rate<0)suggestions.push(['Stop the monthly leak',`Spending is above income by ${money(fromUSD(Math.abs(surplus),state.settings.base))}. Reduce flexible categories until the month turns positive.`]);
    else if(rate<0.1)suggestions.push(['Raise your savings rate',`You are keeping about ${Math.round(rate*100)}% of income. First aim for 10%, then increase it gradually toward 20%.`]);
    else if(rate>=0.2)suggestions.push(['Protect your strong surplus',`You are keeping about ${Math.round(rate*100)}% of income. Automate this amount toward debt, goals and long-term assets after payday.`]);
  }
  const categorySpend=Object.entries(state.budgets).map(([category,b])=>{const spent=state.transactions.filter(t=>t.type==='expense'&&t.category===category&&t.date.startsWith(month())).reduce((s,t)=>s+usd(t.amount,t.currency),0);return {category,over:spent-usd(b.amount,b.currency)}}).sort((a,b)=>b.over-a.over)[0];
  if(categorySpend?.over>0)suggestions.push(['Fix the biggest budget overrun',`${categorySpend.category} is over budget by ${money(fromUSD(categorySpend.over,state.settings.base))} this month. Set one specific limit for the rest of the month.`]);
  if(debtUSD>0){
    if(surplus>0){const debtShare=surplus*(goalTargetUSD>goalSavedUSD?0.7:0.9);const months=Math.max(1,Math.ceil(debtUSD/debtShare));suggestions.push(['Attack debt consistently',`Direct ${money(fromUSD(debtShare,state.settings.base))} of the current monthly surplus to debt. At that pace, the tracked balance could clear in roughly ${months} month${months===1?'':'s'}, before interest and new borrowing.`])}
    else suggestions.push(['Create debt-payment room','Before investing more, create a reliable monthly surplus and direct it to the highest-interest debt while paying minimums on the rest.']);
  }
  const goalGap=Math.max(0,goalTargetUSD-goalSavedUSD);
  if(goalGap>0&&surplus>0){const goalShare=surplus*(debtUSD>0?0.3:0.8);const months=Math.max(1,Math.ceil(goalGap/goalShare));suggestions.push(['Fund goals automatically',`Move ${money(fromUSD(goalShare,state.settings.base))} monthly toward goals. At the current gap, that is roughly ${months} month${months===1?'':'s'} if targets and income stay unchanged.`])}
  if(debtUSD<=0&&surplus>0&&assetTotalUSD<=0)suggestions.push(['Build your safety base','Start with an emergency fund in an accessible savings account. After that buffer is stable, consider diversified long-term investing appropriate to your risk level.']);
  if(assetTotalUSD>0)suggestions.push(['Keep assets working','Review cash, metals and crypto quarterly. Avoid letting one volatile asset become too large, and keep emergency money separate from investments.']);
  if(!suggestions.length)suggestions.push(['Keep compounding the basics','Track spending, avoid new high-interest debt and increase automatic saving whenever income rises.']);
  return suggestions.slice(0,4);
}

function render(){
  const tx=state.transactions.filter(t=>t.date.startsWith(month()));
  const incomeUSD=tx.filter(t=>t.type==='income').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const spentUSD=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const balanceUSD=state.transactions.reduce((s,t)=>s+(t.type==='income'?1:t.type==='expense'?-1:0)*usd(t.amount,t.currency),0);
  $('balance').textContent=money(fromUSD(balanceUSD,state.settings.base));
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

  const assetTotalUSD=state.assets.reduce((s,a)=>s+assetUSD(a),0);$('assetTotal').textContent=money(fromUSD(assetTotalUSD,state.settings.base));
  const goalTargetUSD=state.goals.reduce((s,g)=>s+usd(g.target,g.currency),0);const goalProgressRatio=goalTargetUSD>0?Math.min(1,goalUSD/goalTargetUSD):0;
  const netWorthUSD=balanceUSD+assetTotalUSD-debtUSD;const surplusUSD=incomeUSD-spentUSD;const savingRate=incomeUSD>0?surplusUSD/incomeUSD:0;
  $('netWorth').textContent=money(fromUSD(netWorthUSD,state.settings.base));$('netWorthCash').textContent=money(fromUSD(balanceUSD,state.settings.base));$('netWorthAssets').textContent=money(fromUSD(assetTotalUSD,state.settings.base));$('netWorthDebt').textContent=money(fromUSD(debtUSD,state.settings.base));$('monthlySurplus').textContent=money(fromUSD(surplusUSD,state.settings.base));
  $('goalProgress').style.width=(goalProgressRatio*100)+'%';$('goalProgressText').textContent=Math.round(goalProgressRatio*100)+'%';$('savingsRate').textContent=(incomeUSD>0?Math.round(savingRate*100):0)+'% saved';
  $('wealthMessage').textContent=netWorthUSD<0?'You are not stuck—every debt payment raises this number.':debtUSD>0?'Your assets are growing while you work toward becoming debt-free.':netWorthUSD>0?'You are building real financial momentum. Keep compounding it.':'Start tracking, create a surplus and build from zero together.';
  const advice=buildMoneySuggestions({incomeUSD,spentUSD,balanceUSD,assetTotalUSD,debtUSD,goalSavedUSD:goalUSD,goalTargetUSD,budgetUSD});
  $('wealthSuggestions').innerHTML=advice.map(([title,body],i)=>`<div class="adviceCard"><span class="adviceNumber">${i+1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join('');
  $('marketStrip').innerHTML=['XAU','XAG','BTC','ETH'].map(sym=>{const p=state.prices[sym];const unit=sym==='XAU'||sym==='XAG'?' / oz':'';return `<div class="quote"><span>${sym}</span><b>${p?money(p.usd,'USD')+unit:'—'}</b></div>`}).join('');
  $('assetList').innerHTML=state.assets.length?state.assets.map(a=>{const valueUSD=assetUSD(a);const p=state.prices[a.symbol];const missing=(a.type==='metal'||a.type==='crypto')&&!p;return `<div class="assetCard"><div class="cardTop"><div><h3>${esc(a.name)}</h3><div class="meta">${esc(marketLabel(a))}${a.notes?' · '+esc(a.notes):''}</div>${p?`<div class="meta">Live ${a.symbol}: ${money(p.usd,'USD')}${a.type==='metal'?' / oz':''}</div>`:''}${missing?'<div class="meta">Live price unavailable; value will refresh later.</div>':''}</div><div class="value">${money(fromUSD(valueUSD,state.settings.base))}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAssetForm('${a.id}')">Edit</button><button class="dangerLink" onclick="deleteAsset('${a.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No other assets added yet.</div>';

  $('baseCurrency').value=state.settings.base;$('rateAED').value=state.settings.rates.AED;$('rateMVR').value=state.settings.rates.MVR;$('rateINR').value=state.settings.rates.INR;
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();showPage('home');boot();
