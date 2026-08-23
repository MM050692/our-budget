const KEY='our_budget_v4';
const DEFAULT={
  settings:{base:'AED',lastCurrency:'AED',rates:{USD:1,AED:3.6725,MVR:15.42,INR:88}},
  transactions:[],budgets:{Housing:3000,Food:1500,Transport:800,Bills:1000,Shopping:700,Other:500},
  goals:[],debts:[],assets:[],prices:{}
};
const old=JSON.parse(localStorage.getItem('our_budget_v3')||localStorage.getItem('our_budget_v2')||'null');
let state=JSON.parse(localStorage.getItem(KEY)||'null')||old||structuredClone(DEFAULT);
state.settings=Object.assign({},DEFAULT.settings,state.settings||{});
state.settings.rates=Object.assign({},DEFAULT.settings.rates,state.settings.rates||{});
state.settings.lastCurrency=state.settings.lastCurrency||state.settings.base||'AED';
state.transactions=state.transactions||[];state.budgets=state.budgets||structuredClone(DEFAULT.budgets);state.goals=state.goals||[];state.debts=state.debts||[];state.assets=state.assets||[];state.prices=state.prices||{};

let db=null,currentUser=null,householdId=null,realtimeChannel=null,currentPage='home';
const cats=['Housing','Food','Transport','Bills','Shopping','Entertainment','Health','Travel','Debt','Savings','Other'];
const metalChoices=[['XAU','Gold'],['XAG','Silver'],['XPT','Platinum'],['XPD','Palladium']];
const cryptoChoices=[['BTC','Bitcoin'],['ETH','Ethereum'],['LTC','Litecoin'],['XRP','XRP'],['DOT','Polkadot'],['ADA','Cardano']];
const $=id=>document.getElementById(id);

function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function cache(){localStorage.setItem(KEY,JSON.stringify(state))}
function usd(v,c){return Number(v)/(state.settings.rates[c]||1)}
function fromUSD(v,c){return Number(v)*(state.settings.rates[c]||1)}
function money(v,c=state.settings.base){return new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(v)||0)}
function month(){return new Date().toISOString().slice(0,7)}
function openModal(title,html){$('title').textContent=title;$('content').innerHTML=html;$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function rememberCurrency(c){if(['AED','MVR','INR','USD'].includes(c)){state.settings.lastCurrency=c;cache()}}

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
function showAuth(){currentUser=null;householdId=null;$('authScreen').classList.remove('hidden');$('app').classList.add('hidden')}

$('authForm').onsubmit=async e=>{
  e.preventDefault();$('authMessage').textContent='Signing in…';
  const {error}=await db.auth.signInWithPassword({email:$('authEmail').value,password:$('authPassword').value});
  $('authMessage').textContent=error?error.message:'';
};

async function signedIn(user){
  currentUser=user;$('authScreen').classList.add('hidden');$('app').classList.remove('hidden');$('syncStatus').textContent='Finding household…';
  const {data:member,error}=await db.from('household_members').select('household_id,display_name,role').eq('user_id',user.id).limit(1).maybeSingle();
  if(error||!member){$('syncStatus').textContent='Household not found';alert('Login works, but this account is not attached to the household.');return}
  householdId=member.household_id;$('syncStatus').textContent='Synced · '+member.display_name;
  await loadRemote();subscribeRealtime();showPage(currentPage);await refreshPrices(false);
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
  if(!t.error)state.transactions=t.data.map(x=>({id:x.id,type:x.type,amount:+x.amount,currency:x.currency,category:x.category,paidBy:x.paid_by,account:x.account||'',date:x.date,note:x.note||''}));
  if(!b.error&&b.data.length)state.budgets=Object.fromEntries(b.data.map(x=>[x.category,+x.amount]));
  if(!g.error)state.goals=g.data.map(x=>({id:x.id,name:x.name,target:+x.target,saved:+x.saved,currency:x.currency,due:x.due_date||''}));
  if(!d.error)state.debts=d.data.map(x=>({id:x.id,name:x.name,original:+x.original_amount,remaining:+x.remaining_amount,currency:x.currency,due:x.due_date||''}));
  if(!a.error)state.assets=a.data.map(x=>({id:x.id,name:x.name,type:x.asset_type,symbol:x.symbol||'',quantity:+x.quantity,currency:x.currency,manualValue:x.manual_value==null?null:+x.manual_value,notes:x.notes||''}));
  cache();render();
}

function subscribeRealtime(){
  if(realtimeChannel)db.removeChannel(realtimeChannel);
  realtimeChannel=db.channel('household-'+householdId)
    .on('postgres_changes',{event:'*',schema:'public',table:'transactions',filter:'household_id=eq.'+householdId},loadRemote)
    .on('postgres_changes',{event:'*',schema:'public',table:'budgets',filter:'household_id=eq.'+householdId},loadRemote)
    .on('postgres_changes',{event:'*',schema:'public',table:'goals',filter:'household_id=eq.'+householdId},loadRemote)
    .on('postgres_changes',{event:'*',schema:'public',table:'debts',filter:'household_id=eq.'+householdId},loadRemote)
    .on('postgres_changes',{event:'*',schema:'public',table:'assets',filter:'household_id=eq.'+householdId},loadRemote)
    .subscribe();
}
async function refreshPrices(force){
  const defaults=['XAU','XAG','BTC','ETH'];
  const owned=state.assets.filter(a=>a.type==='metal'||a.type==='crypto').map(a=>a.symbol).filter(Boolean);
  const symbols=[...new Set([...defaults,...owned])];
  if($('priceStatus'))$('priceStatus').textContent='Refreshing free market prices…';
  let ok=0;
  for(const symbol of symbols){
    const cached=state.prices[symbol];
    if(!force&&cached&&Date.now()-new Date(cached.updated).getTime()<5*60*1000){ok++;continue}
    try{
      const r=await fetch('https://api.gold-api.com/price/'+encodeURIComponent(symbol),{cache:'no-store'});
      if(!r.ok)continue;
      const j=await r.json();const p=Number(j.price);
      if(Number.isFinite(p)&&p>0){state.prices[symbol]={usd:p,updated:j.updatedAt||new Date().toISOString(),source:'Gold API'};ok++}
    }catch(_e){}
  }
  cache();render();
  if($('priceStatus')){
    const newest=Object.values(state.prices).map(p=>new Date(p.updated).getTime()).filter(Number.isFinite).sort((a,b)=>b-a)[0];
    $('priceStatus').textContent=newest?'Prices updated '+new Date(newest).toLocaleString():(ok?'Prices refreshed':'Live prices unavailable; using any last saved prices.');
  }
}

function openTx(type){
  openModal(type==='income'?'Add income':'Add expense',`<form class="form" id="txForm">
    <label>Amount<input id="txAmount" type="number" step="0.01" min="0" required></label>
    <label>Currency<select id="txCurrency"><option>AED</option><option>MVR</option><option>INR</option><option>USD</option></select></label>
    <label>Category<select id="txCategory">${cats.map(x=>`<option>${x}</option>`).join('')}</select></label>
    <label>Paid by<select id="txBy"><option>Dhani</option><option>Sakhi</option><option>Shared</option></select></label>
    <label>Account<input id="txAccount" placeholder="Cash / Bank / Card"></label>
    <label>Date<input id="txDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></label>
    <label>Note<input id="txNote" placeholder="Optional"></label>
    <button class="primary" type="submit">Save</button>
  </form>`);
  $('txCurrency').value=state.settings.lastCurrency;
  $('txForm').onsubmit=async e=>{
    e.preventDefault();rememberCurrency($('txCurrency').value);
    const tx={id:crypto.randomUUID(),type,amount:+$('txAmount').value,currency:$('txCurrency').value,category:$('txCategory').value,paidBy:$('txBy').value,account:$('txAccount').value,date:$('txDate').value,note:$('txNote').value};
    state.transactions.push(tx);cache();render();closeModal();
    const {error}=await db.from('transactions').insert({id:tx.id,household_id:householdId,user_id:currentUser.id,type:tx.type,amount:tx.amount,currency:tx.currency,category:tx.category,paid_by:tx.paidBy,account:tx.account||null,date:tx.date,note:tx.note||null,updated_at:new Date().toISOString()});
    if(error)alert('Saved on this phone, but sync failed: '+error.message);
  };
}

function openBudget(){
  openModal('Monthly budget',`<form class="form" id="budgetForm">${Object.entries(state.budgets).map(([c,v])=>`<label>${esc(c)}<input id="budget_${esc(c)}" type="number" step="0.01" min="0" value="${v}"></label>`).join('')}<button class="primary" type="submit">Save budget</button></form>`);
  $('budgetForm').onsubmit=async e=>{
    e.preventDefault();Object.keys(state.budgets).forEach(c=>state.budgets[c]=+$('budget_'+c).value||0);cache();render();closeModal();
    const rows=Object.entries(state.budgets).map(([category,amount])=>({household_id:householdId,category,amount,currency:state.settings.base}));
    const {error}=await db.from('budgets').upsert(rows,{onConflict:'household_id,category'});if(error)alert('Budget sync failed: '+error.message);
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
    const i=state.goals.findIndex(x=>x.id===item.id);if(i>=0)state.goals[i]=item;else state.goals.push(item);cache();render();closeModal();
    const {error}=await db.from('goals').upsert({id:item.id,household_id:householdId,name:item.name,target:item.target,saved:item.saved,currency:item.currency,due_date:item.due||null});if(error)alert('Goal sync failed: '+error.message);
  };
}
async function deleteGoal(id){if(!confirm('Delete this goal?'))return;state.goals=state.goals.filter(x=>x.id!==id);cache();render();const {error}=await db.from('goals').delete().eq('id',id);if(error)alert(error.message)}

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
    const i=state.debts.findIndex(x=>x.id===item.id);if(i>=0)state.debts[i]=item;else state.debts.push(item);cache();render();closeModal();
    const {error}=await db.from('debts').upsert({id:item.id,household_id:householdId,name:item.name,original_amount:item.original,remaining_amount:item.remaining,currency:item.currency,due_date:item.due||null});if(error)alert('Debt sync failed: '+error.message);
  };
}
async function deleteDebt(id){if(!confirm('Delete this debt?'))return;state.debts=state.debts.filter(x=>x.id!==id);cache();render();const {error}=await db.from('debts').delete().eq('id',id);if(error)alert(error.message)}
function openAssetForm(id=null){
  const a=id?state.assets.find(x=>x.id===id):null;
  openModal(a?'Edit asset':'Add asset',`<form class="form" id="assetForm">
    <label>Asset name<input id="assetName" required value="${esc(a?.name||'')}" placeholder="Gold jewellery / Bitcoin / Savings account"></label>
    <label>Type<select id="assetType"><option value="cash">Cash / Bank balance</option><option value="manual">Other asset / investment</option><option value="metal">Precious metal</option><option value="crypto">Crypto</option></select></label>
    <div id="assetSymbolWrap" class="hidden"><label>Asset<select id="assetSymbol"></select></label></div>
    <label id="assetQuantityLabel">Amount / quantity<input id="assetQuantity" type="number" step="0.00000001" min="0" required value="${a?.quantity??''}"></label>
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
    const i=state.assets.findIndex(x=>x.id===item.id);if(i>=0)state.assets[i]=item;else state.assets.push(item);cache();render();closeModal();
    const {error}=await db.from('assets').upsert({id:item.id,household_id:householdId,user_id:currentUser.id,name:item.name,asset_type:item.type,symbol:item.symbol||null,quantity:item.quantity,currency:item.currency,manual_value:item.manualValue,notes:item.notes||null,updated_at:new Date().toISOString()});
    if(error)alert('Asset sync failed. Run assets_migration.sql in Supabase first. '+error.message);else await refreshPrices(true);
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
async function deleteAsset(id){if(!confirm('Delete this asset?'))return;state.assets=state.assets.filter(x=>x.id!==id);cache();render();const {error}=await db.from('assets').delete().eq('id',id);if(error)alert(error.message)}

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

function txHtml(t){return `<div class="tx"><div class="left"><div class="dot">${t.type==='income'?'↑':'↓'}</div><div><div class="name">${esc(t.category)}</div><div class="meta">${esc(t.paidBy)} · ${esc(t.date)}${t.note?' · '+esc(t.note):''}</div></div></div><b class="${t.type==='income'?'inc':'exp'}">${t.type==='income'?'+':'−'} ${money(t.amount,t.currency)}</b></div>`}

function render(){
  const tx=state.transactions.filter(t=>t.date.startsWith(month()));
  const incomeUSD=tx.filter(t=>t.type==='income').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const spentUSD=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+usd(t.amount,t.currency),0);
  const balanceUSD=state.transactions.reduce((s,t)=>s+(t.type==='income'?1:t.type==='expense'?-1:0)*usd(t.amount,t.currency),0);
  $('balance').textContent=money(fromUSD(balanceUSD,state.settings.base));
  $('income').textContent=money(fromUSD(incomeUSD,state.settings.base));
  $('spent').textContent=money(fromUSD(spentUSD,state.settings.base));
  $('saved').textContent=money(fromUSD(incomeUSD-spentUSD,state.settings.base));

  const budgetTotal=Object.values(state.budgets).reduce((a,b)=>a+Number(b),0);const used=fromUSD(spentUSD,state.settings.base);const rem=budgetTotal-used;
  $('budget').textContent=money(budgetTotal);$('remaining').textContent=money(rem);$('budgetMsg').textContent=rem<0?'Over budget':'Remaining';$('bar').style.width=Math.min(100,used/Math.max(1,budgetTotal)*100)+'%';

  const sorted=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  $('txList').innerHTML=sorted.length?sorted.slice(0,8).map(txHtml).join(''):'<div class="hint">No transactions yet.</div>';
  $('allTx').innerHTML=sorted.length?sorted.map(txHtml).join(''):'<div class="hint">No transactions yet.</div>';

  const debtUSD=state.debts.reduce((s,d)=>s+usd(d.remaining,d.currency),0);$('totalDebt').textContent=money(fromUSD(debtUSD,state.settings.base));
  $('debtList').innerHTML=state.debts.length?state.debts.map(d=>{const paid=Math.max(0,Math.min(1,1-d.remaining/Math.max(d.original,1)));return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(d.name)}</h3><div class="meta">${money(d.remaining,d.currency)} remaining of ${money(d.original,d.currency)}${d.due?' · Due '+esc(d.due):''}</div></div><span class="pill">${Math.round(paid*100)}% paid</span></div><div class="miniBar"><i style="width:${paid*100}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openDebtForm('${d.id}')">Edit</button><button class="dangerLink" onclick="deleteDebt('${d.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No debts added.</div>';

  const goalUSD=state.goals.reduce((s,g)=>s+usd(g.saved,g.currency),0);$('goalSaved').textContent=money(fromUSD(goalUSD,state.settings.base));
  $('goalList').innerHTML=state.goals.length?state.goals.map(g=>{const p=Math.max(0,Math.min(1,g.saved/Math.max(g.target,1)));return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(g.name)}</h3><div class="meta">${money(g.saved,g.currency)} of ${money(g.target,g.currency)}${g.due?' · Target '+esc(g.due):''}</div></div><span class="pill">${Math.round(p*100)}%</span></div><div class="miniBar"><i style="width:${p*100}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openGoalForm('${g.id}')">Edit</button><button class="dangerLink" onclick="deleteGoal('${g.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No goals added.</div>';

  const assetTotalUSD=state.assets.reduce((s,a)=>s+assetUSD(a),0);$('assetTotal').textContent=money(fromUSD(assetTotalUSD,state.settings.base));
  $('marketStrip').innerHTML=['XAU','XAG','BTC','ETH'].map(sym=>{const p=state.prices[sym];const unit=sym==='XAU'||sym==='XAG'?' / oz':'';return `<div class="quote"><span>${sym}</span><b>${p?money(p.usd,'USD')+unit:'—'}</b></div>`}).join('');
  $('assetList').innerHTML=state.assets.length?state.assets.map(a=>{const valueUSD=assetUSD(a);const p=state.prices[a.symbol];const missing=(a.type==='metal'||a.type==='crypto')&&!p;return `<div class="assetCard"><div class="cardTop"><div><h3>${esc(a.name)}</h3><div class="meta">${esc(marketLabel(a))}${a.notes?' · '+esc(a.notes):''}</div>${p?`<div class="meta">Live ${a.symbol}: ${money(p.usd,'USD')}${a.type==='metal'?' / oz':''}</div>`:''}${missing?'<div class="meta">Live price unavailable; value will refresh later.</div>':''}</div><div class="value">${money(fromUSD(valueUSD,state.settings.base))}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAssetForm('${a.id}')">Edit</button><button class="dangerLink" onclick="deleteAsset('${a.id}')">Delete</button></div></div>`}).join(''):'<div class="card hint">No other assets added yet.</div>';

  $('baseCurrency').value=state.settings.base;$('rateAED').value=state.settings.rates.AED;$('rateMVR').value=state.settings.rates.MVR;$('rateINR').value=state.settings.rates.INR;
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();showPage('home');boot();
