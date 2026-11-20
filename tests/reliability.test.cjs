const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
function functionSource(name) {
  const match = source.match(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  assert.ok(match, `Missing production function ${name}`);
  const start = match.index;
  const end = source.indexOf('\n}', start) + 2;
  return source.slice(start, end);
}
const functions = ['missingBackupRecords', 'restoreGoalStartingValue', 'restoreDebtStartingValue', 'addRestoreBatches', 'runOperation', 'flushPending', 'flushPendingOnce', 'fetchAllHouseholdRows', 'statementTransactionsFor', 'statementReportTotals', 'canonicalJson', 'sha256Hex', 'compressBackupBytes', 'decompressBackupBytes', 'streamBytesWithLimit', 'backupEncryptionKey', 'verifyReadableBackup', 'refreshPrices', 'confirmBackupRestore', 'accountRestoreRow', 'goalRestoreRow', 'debtRestoreRow', 'refreshConnection', 'currencyRatesFromQuote', 'durableCacheSet', 'signedIn'];
function app() {
  const context = vm.createContext({
    assert, console, crypto: webcrypto, TextEncoder, TextDecoder, Blob, Response,
    CompressionStream, DecompressionStream, Date, setTimeout, clearTimeout,
    navigator: { onLine: true }, durableWriteChains: new Map(), window: { CompressionStream, DecompressionStream },
    db: {}, householdId: 'synthetic-household', currentUser: { id: 'synthetic-user' },
    pendingKey: 'queue', pendingFlush: null, connectionRefresh: null, priceRefresh: null,
    restoreInProgress: false, cachedMembershipUsed: false, remoteSettingsPresent: true, state: { assets: [], prices: {}, settings: {} },
    $: () => null, updateSyncStatus: () => {}, toast: () => {}, render: () => {}, cache: () => {},
    cleanCurrency: value => value, usd: (value, currency) => value / ({ USD: 1, MVR: 15.42, INR: 88, AED: 3.6725 }[currency] || 1),
    reportRange: () => ({ from: '2026-09-01', to: '2026-09-30' }),
  });
  vm.runInContext(functions.map(functionSource).join('\n'), context);
  return context;
}
function run(context, code) { return vm.runInContext(code, context); }
function empty() { return Object.fromEntries(['accounts','goals','debts','recurring','transactions','contributions','assets','snapshots','checkups','sinkingFunds','weeklyReviews'].map(key => [key, []])); }

test('restore preserves existing IDs and unique dates, including duplicate backup records', () => {
  const c = app(); c.backup = empty(); c.current = empty();
  c.current.transactions = [{id:'same',amount:20,updatedAt:'2026-10-01'}];
  c.backup.transactions = [{id:'same',amount:10},{id:'new',amount:5},{id:'new',amount:6}];
  c.current.snapshots = [{id:'current',date:'2026-09-01'}];
  c.backup.snapshots = [{id:'other',date:'2026-09-01'}];
  const result = run(c, 'missingBackupRecords(backup,current)');
  assert.equal(result.skipped,3); assert.equal(result.data.transactions.length,1);
  assert.equal(result.data.transactions[0].amount,5); assert.equal(result.data.snapshots.length,0);
  assert.equal(c.current.transactions[0].amount,20);
});
test('restore seeds balances so INSERT triggers apply linked payments and savings once', () => {
  const c=app();
  assert.equal(run(c,"restoreGoalStartingValue({id:'g',saved:300},[{goalId:'g',amount:100},{goalId:'g',amount:50}])"),150);
  assert.equal(run(c,"restoreDebtStartingValue({id:'d',original:1000,remaining:650},[{debtId:'d',debtPrincipal:200},{debtId:'d',debtPrincipal:50}])"),900);
  assert.throws(()=>run(c,"restoreGoalStartingValue({id:'g',saved:10},[{goalId:'g',amount:20}])"),/not match/);
  assert.throws(()=>run(c,"restoreDebtStartingValue({id:'d',original:100,remaining:90},[{debtId:'d',debtPrincipal:20}])"),/not match/);
});
test('restore batches never overwrite concurrent rows and remain bounded', async () => {
  const c=app(); let request;
  c.db={from: table=>({upsert: (rows,options)=>{request={table,rows,options};return {error:null}}})};
  c.rows=Array.from({length:1201},(_,id)=>({id:String(id)}));
  const operations=run(c,'const operations=[];addRestoreBatches(operations,"transactions",rows);operations');
  assert.deepEqual(Array.from(operations,op=>op.rows.length),[500,500,201]);
  c.operation=operations[0];await run(c,'runOperation(operation)');
  assert.equal(request.options.ignoreDuplicates,true);assert.equal(request.options.onConflict,'id');
});
test('offline queue keeps a new entry added during a save and prevents simultaneous flushes', async () => {
  const c=app();let queue=[{queueId:'a',row:{id:'a'}}];let release;
  const blocked=new Promise(resolve=>release=resolve);const sent=[];
  c.pending=()=>queue;c.savePending=items=>{queue=Array.from(items)};
  c.db={from:()=>({upsert:async row=>{sent.push(row.id);if(row.id==='a')await blocked;return {error:null}}})};
  const first=run(c,'flushPending()');const second=run(c,'flushPending()');
  queue.push({queueId:'b',row:{id:'b'}});release();
  assert.equal(await first,true);assert.equal(await second,true);
  assert.deepEqual(sent,['a','b']);assert.equal(queue.length,0);
  c.navigator.onLine=false;queue=[{queueId:'c'}];assert.equal(await run(c,'flushPending()'),false);assert.equal(queue.length,1);
});
test('failed sync retains every pending financial record',async()=>{
  const c=app();let queue=[{queueId:'a',row:{id:'a'}},{queueId:'b',row:{id:'b'}}];
  c.pending=()=>queue;c.savePending=items=>{queue=Array.from(items)};
  c.db={from:()=>({upsert:async()=>({error:{message:'simulated outage'}})})};
  assert.equal(await run(c,'flushPending()'),false);assert.equal(queue.length,2);
});
test('keyset pagination fetches 73,000 synthetic records without a 1,000-row cutoff',async()=>{
  const c=app();const rows=Array.from({length:73000},(_,i)=>({id:String(i).padStart(8,'0')}));let calls=0;
  c.db={from:()=>{let cursor='';return {select(){return this},eq(){return this},order(){return this},gt(_column,value){cursor=value;return this},limit(){return this},then(resolve){calls++;return Promise.resolve({data:rows.filter(row=>row.id>cursor).slice(0,500),error:null}).then(resolve)}}}};
  const result=await run(c,'fetchAllHouseholdRows("transactions")');
  assert.equal(result.data.length,73000);assert.equal(calls,147);assert.equal(result.data.at(-1).id,'00072999');
});
test('statement totals exclude transfers, balance corrections, and other periods',()=>{
  const c=app();c.state.transactions=[
    {type:'income',category:'Salary',date:'2026-09-01',amount:100,currency:'USD'},
    {type:'expense',category:'Food',date:'2026-09-02',amount:154.2,currency:'MVR'},
    {type:'transfer',category:'Transfer',date:'2026-09-03',amount:50,currency:'USD'},
    {type:'income',category:'Balance adjustment',date:'2026-09-03',amount:999,currency:'USD'},
    {type:'expense',category:'Food',date:'2026-08-01',amount:500,currency:'USD'}];
  const totals=run(c,'statementReportTotals()');assert.equal(totals.incomeUSD,100);assert.equal(totals.spentUSD,10);assert.equal(totals.differenceUSD,90);
});
test('backup checksum rejects tampering and encrypted compressed backup round-trips',async()=>{
  const c=app();c.payload={format:'our-dhan-portable-backup',data:{transactions:[{id:'synthetic',amount:42}]}};
  run(c,'payload.integrity={algorithm:"SHA-256",value:""}');
  // Use the actual production canonical serializer and encryption primitives.
  c.hash=await run(c,'sha256Hex(canonicalJson({format:payload.format,data:payload.data}))');
  run(c,'payload.integrity.value=hash');assert.match(await run(c,'verifyReadableBackup(payload)'),/verified/);
  run(c,'payload.data.transactions[0].amount=43');await assert.rejects(run(c,'verifyReadableBackup(payload)'),/damaged/);
  c.plain=new TextEncoder().encode(JSON.stringify(c.payload));c.salt=webcrypto.getRandomValues(new Uint8Array(16));c.iv=webcrypto.getRandomValues(new Uint8Array(12));
  c.key=await run(c,'backupEncryptionKey("synthetic-passphrase",salt,310000,["encrypt","decrypt"])');
  c.compressed=await run(c,'compressBackupBytes(plain)');
  c.encrypted=await webcrypto.subtle.encrypt({name:'AES-GCM',iv:c.iv},c.key,c.compressed.bytes);
  c.decrypted=new Uint8Array(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:c.iv},c.key,c.encrypted));
  const recovered=await run(c,'decompressBackupBytes(decrypted,compressed.compression)');assert.equal(new TextDecoder().decode(recovered),new TextDecoder().decode(c.plain));
});
test('partial price outage preserves saved values and identifies the failed symbol',async()=>{
  const c=app();let status;
  c.state.prices={XAG:{usd:30,updated:new Date().toISOString()}};
  c.setPriceRefreshUi=message=>status=message;
  c.fetch=async url=>({ok:!url.includes('XAG'),json:async()=>({price:100,updatedAt:new Date().toISOString()})});
  await run(c,'refreshPrices(true)');assert.equal(c.state.prices.XAG.usd,30);assert.match(status,/XAG/);assert.match(status,/Saved or unavailable/);
});
test('resume/reconnect refresh flushes pending changes before fetching shared data',async()=>{
  const c=app();const order=[];c.flushPending=async()=>{order.push('flush');return true};c.loadRemote=async()=>{order.push('load');return true};
  assert.equal(await run(c,'refreshConnection()'),true);assert.deepEqual(order,['flush','load']);
});
test('interrupted restore retries without overwriting newer records or applying debt twice',async()=>{
  const c=app();c.state={...empty(),budgets:{},settings:{}};
  c.state.transactions=[{id:'existing',amount:75,date:'2026-10-01'}];
  c.pendingRestoreData={...empty(),budgets:{},settings:{}};
  c.pendingRestoreData.transactions=[{id:'existing',amount:5,date:'2026-09-01'},...Array.from({length:501},(_,i)=>({id:`payment-${i}`,type:'expense',amount:1,currency:'USD',category:'Debt',date:'2026-09-01',debtId:'debt',debtPrincipal:1}))];
  c.pendingRestoreData.debts=[{id:'debt',name:'Synthetic debt',original:600,remaining:99,currency:'USD'}];
  c.pending=()=>[];c.loadRemote=async()=>true;c.exportBackup=async()=>{};c.closeModal=()=>{};c.celebrate=()=>{};c.ensureTodaySnapshot=async()=>{};
  c.transactionRow=item=>({...item,debt_id:item.debtId,debt_principal:item.debtPrincipal});
  let interrupt=true;let batches=0;
  c.db={from:table=>({upsert:async(rows,options)=>{
    assert.equal(options.ignoreDuplicates,true);
    if(table==='debts') for(const row of rows){if(!c.state.debts.some(d=>d.id===row.id))c.state.debts.push({id:row.id,original:row.original_amount,remaining:row.remaining_amount,currency:'USD'});}
    if(table==='transactions'){
      batches++;
      if(interrupt&&batches===2){interrupt=false;return {error:{message:'simulated interruption'}};}
      for(const row of rows){if(c.state.transactions.some(t=>t.id===row.id))continue;
        const debt=c.state.debts.find(d=>d.id===row.debt_id);if(debt)debt.remaining-=row.debt_principal;
        c.state.transactions.push({...row,debtId:row.debt_id,debtPrincipal:row.debt_principal});}
    }
    return {error:null};
  }})};
  await run(c,'confirmBackupRestore()');assert.equal(c.state.debts[0].remaining,100);assert.equal(c.state.transactions.length,501);assert.ok(c.pendingRestoreData);
  await run(c,'confirmBackupRestore()');assert.equal(c.state.debts[0].remaining,99);assert.equal(c.state.transactions.length,502);assert.equal(c.state.transactions[0].amount,75);assert.equal(c.pendingRestoreData,null);
});
test('currency lookup rejects incomplete or invalid quotes without accepting partial rates',()=>{
  const c=app();c.quote={result:'success',base_code:'USD',rates:{AED:3.67,MVR:15.42,INR:88}};
  assert.equal(run(c,'currencyRatesFromQuote(quote)').MVR,15.42);
  c.quote.rates.INR=0;assert.throws(()=>run(c,'currencyRatesFromQuote(quote)'),/incomplete/);
  c.quote.base_code='EUR';assert.throws(()=>run(c,'currencyRatesFromQuote(quote)'),/unavailable/);
});
test('durable queue writes are serialized so slow old saves cannot replace newer ones',async()=>{
  const c=app();const writes=[];let release;const blocked=new Promise(resolve=>release=resolve);
  c.durableCacheSetOnce=async(_key,value)=>{if(value==='old')await blocked;writes.push(value)};
  const older=run(c,'durableCacheSet("queue","old")');const newer=run(c,'durableCacheSet("queue","new")');
  release();await Promise.all([older,newer]);assert.deepEqual(writes,['old','new']);assert.equal(c.durableWriteChains.size,0);
});
test('cached offline membership opens saved data but requires verified membership before upload',async()=>{
  const c=app();c.currentUser=null;c.householdId=null;c.navigator.onLine=false;c.currentPage='today';
  c.safeParse=JSON.parse;c.storageGet=()=>JSON.stringify({user_id:'synthetic-user',household_id:'synthetic-household',display_name:'Dhani',role:'owner'});
  c.$=()=>({classList:{add(){},remove(){}}});c.loadScopedState=async()=>{};c.showPage=()=>{};c.subscribeRealtime=()=>{};c.refreshPrices=async()=>{};c.ensureTodaySnapshot=async()=>{};c.handleQuickAction=()=>{};
  await run(c,'signedIn({id:"synthetic-user"})');assert.equal(c.householdId,'synthetic-household');assert.equal(c.cachedMembershipUsed,true);
  let uploads=0;c.flushPending=async()=>{uploads++;return true};c.loadRemote=async()=>true;c.navigator.onLine=true;
  c.db={from:()=>({select(){return this},eq(){return this},limit(){return this},maybeSingle:async()=>({data:null,error:{message:'outage'}})})};
  assert.equal(await run(c,'refreshConnection()'),false);assert.equal(uploads,0);
  c.db.from=()=>({select(){return this},eq(){return this},limit(){return this},maybeSingle:async()=>({data:{household_id:'synthetic-household',display_name:'Dhani',role:'owner'},error:null})});
  assert.equal(await run(c,'refreshConnection()'),true);assert.equal(uploads,1);assert.equal(c.cachedMembershipUsed,false);
});
