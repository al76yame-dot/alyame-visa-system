/* ============================================================
   نظام المحاسبة المتكامل — اليامي للسفر والسياحة
   فواتير · سندات · حسابات وكشوف · صناديق وبنوك · تقارير
   القيم داخلياً بالدولار (USD)، والعرض حسب العملة المختارة.
   ============================================================ */
var txs=[];            // الحركات المالية (سندات قبض/صرف/تحويل)
var accInvoices=[];    // الفواتير
var accAccounts=[];    // الصناديق والبنوك والعملاء والشركات والمزودين
var accTab='dash';
var accInvItems=[];    // بنود الفاتورة أثناء التحرير
var accEditInv=null;

var SVC_TYPES=['تأشيرة','تذكرة طيران','حجز فندق','نقل واستقبال','تأمين سفر','باقة سياحية','خدمة أخرى'];
var ACC_INCOME_CATS=['تأشيرات','تذاكر طيران','حجوزات فنادق','نقل واستقبال','تأمين','باقات سياحية','تحصيل ذمم','إيراد آخر'];
var ACC_EXPENSE_CATS=['مزودون','تذاكر (شراء)','فنادق (شراء)','رواتب','إيجار','اتصالات وإنترنت','عمولات','تسويق','حوالات ورسوم','ضيافة ومكتبية','صيانة','سداد لمورد','مصروف آخر'];
var COGS_CATS={'مزودون':1,'تذاكر (شراء)':1,'فنادق (شراء)':1,'حوالات ورسوم':1,'عمولات':1};

/* ---------- أدوات ---------- */
function accCur(cur,amt){return cur==='LYD'?amt/usdToLyd:cur==='EGP'?amt/usdToEgp:amt;}
function accNum(id){return parseFloat(document.getElementById(id).value)||0;}
function accVal(id){var e=document.getElementById(id);return e?e.value:'';}
function accSet(id,v){var e=document.getElementById(id);if(e)e.value=v;}
function accFindAcc(id){return accAccounts.find(function(a){return a.id===id;});}
function ym(d){return (d||'').slice(0,7);}
function curYM(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');}

/* ---------- الأرصدة ---------- */
function boxBalance(id){
  var b=accFindAcc(id);var bal=b?Number(b.opening)||0:0;
  txs.forEach(function(t){
    if(t.account_id!==id)return;
    bal+=t.type==='income'?(Number(t.amount)||0):-(Number(t.amount)||0);
  });
  return bal;
}
function partyBalance(id){
  var a=accFindAcc(id);if(!a)return 0;
  var bal=Number(a.opening)||0;
  if(a.kind==='supplier'){
    txs.forEach(function(t){
      if(t.party_id!==id)return;
      if(t.kind==='bill')bal+=Number(t.amount)||0;
      else if(t.kind==='settle')bal-=Number(t.amount)||0;
    });
  }else{
    accInvoices.forEach(function(v){if(v.party_id===id)bal+=Number(v.total)||0;});
    txs.forEach(function(t){if(t.party_id===id&&t.type==='income')bal-=Number(t.amount)||0;});
  }
  return bal;
}
function totalCash(){
  var boxes=accAccounts.filter(function(a){return a.kind==='cash'||a.kind==='bank';});
  var sum=boxes.reduce(function(s,a){return s+boxBalance(a.id);},0);
  // حركات بلا صندوق محدد (توافق مع بيانات قديمة)
  txs.forEach(function(t){if(!t.account_id&&t.kind!=='bill')sum+=t.type==='income'?(Number(t.amount)||0):-(Number(t.amount)||0);});
  return sum;
}
function receivablesTotal(){
  return accAccounts.filter(function(a){return a.kind==='customer'||a.kind==='company';})
    .reduce(function(s,a){var b=partyBalance(a.id);return s+(b>0?b:0);},0);
}
function payablesTotal(){
  return accAccounts.filter(function(a){return a.kind==='supplier';})
    .reduce(function(s,a){var b=partyBalance(a.id);return s+(b>0?b:0);},0);
}

/* ---------- قائمة الدخل ---------- */
function plFor(month){
  var rev=0,cogs=0,opex=0;
  accInvoices.forEach(function(v){if(!month||ym(v.inv_date)===month){rev+=(Number(v.subtotal)||0)-(Number(v.discount)||0);cogs+=Number(v.cost_total)||0;}});
  txs.forEach(function(t){
    if(month&&ym(t.tx_date)!==month)return;
    if(t.kind==='transfer'||t.kind==='transfer_in')return;
    if(t.type==='income'){
      if(t.kind==='collect'||t.invoice_id)return; // تحصيل ذمم ليس إيراداً جديداً
      if(t.category==='تحصيل ذمم')return;
      rev+=Number(t.amount)||0;
    }else{
      if(t.kind==='settle')return; // سداد ذمم مورد ليس مصروفاً جديداً
      if(COGS_CATS[t.category])cogs+=Number(t.amount)||0; else opex+=Number(t.amount)||0;
    }
  });
  return {rev:rev,cogs:cogs,gross:rev-cogs,opex:opex,net:rev-cogs-opex};
}

/* ---------- بذرة الصناديق الافتراضية ---------- */
function accSeedBoxes(){
  if(accAccounts.some(function(a){return a.kind==='cash'||a.kind==='bank';}))return;
  var cash={id:'BOX-CASH',name:'الصندوق النقدي',kind:'cash',opening:0,phone:'',note:'',active:true};
  var bank={id:'BOX-BANK',name:'الحساب البنكي',kind:'bank',opening:0,phone:'',note:'',active:true};
  accAccounts.push(cash,bank);
  sbInsert('acc_accounts',cash);sbInsert('acc_accounts',bank);
  lsSave();
}

/* ============================================================
   التنقل بين تبويبات المحاسبة
   ============================================================ */
function renderAcc(){accSeedBoxes();accGo(accTab||'dash');}
function accGo(tab){
  accTab=tab;
  document.querySelectorAll('.acctab').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===tab);});
  document.querySelectorAll('.accsec').forEach(function(s){s.classList.toggle('hidden',s.getAttribute('data-s')!==tab);});
  if(tab==='dash')accDash();
  if(tab==='invoices')accRenderInvoices();
  if(tab==='vouchers')accRenderVouchers();
  if(tab==='accounts')accRenderAccounts();
  if(tab==='boxes')accRenderBoxes();
  if(tab==='reports')accRenderReports();
}

/* ---------- 1. لوحة المحاسبة ---------- */
function accDash(){
  var m=curYM();
  var pl=plFor(m);
  document.getElementById('ad-cash').textContent=formatMoney(totalCash());
  document.getElementById('ad-recv').textContent=formatMoney(receivablesTotal());
  document.getElementById('ad-pay').textContent=formatMoney(payablesTotal());
  document.getElementById('ad-rev').textContent=formatMoney(pl.rev);
  document.getElementById('ad-cogs').textContent=formatMoney(pl.cogs);
  document.getElementById('ad-gross').textContent=formatMoney(pl.gross);
  var netEl=document.getElementById('ad-net');netEl.textContent=formatMoney(pl.net);
  netEl.style.color=pl.net>=0?'var(--green)':'var(--red)';
  // صناديق
  var boxes=accAccounts.filter(function(a){return a.kind==='cash'||a.kind==='bank';});
  document.getElementById('ad-boxes').innerHTML=boxes.map(function(a){
    return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:12.5px"><span>'+(a.kind==='bank'?'🏛️ ':'💵 ')+esc(a.name)+'</span><b>'+formatMoney(boxBalance(a.id))+'</b></div>';
  }).join('')||'<div style="color:var(--text3);text-align:center;padding:14px;font-size:12px">لا صناديق</div>';
  // أعلى الشركات المدينة
  var debtors=accAccounts.filter(function(a){return (a.kind==='customer'||a.kind==='company')&&partyBalance(a.id)>0.5;})
    .map(function(a){return {n:a.name,b:partyBalance(a.id)};}).sort(function(x,y){return y.b-x.b;}).slice(0,6);
  document.getElementById('ad-debtors').innerHTML=debtors.map(function(d){
    return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:12.5px"><span>'+esc(d.n)+'</span><b style="color:var(--red)">'+formatMoney(d.b)+'</b></div>';
  }).join('')||'<div style="color:var(--text3);text-align:center;padding:14px;font-size:12px">لا ذمم مستحقة 🎉</div>';
  // آخر الحركات
  var recent=txs.slice().sort(function(a,b){return (b.tx_date||'').localeCompare(a.tx_date||'')||(b.id||'').localeCompare(a.id||'');}).slice(0,7);
  document.getElementById('ad-recent').innerHTML=recent.map(function(t){
    var isIn=t.type==='income';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px"><span>'+(isIn?'🟢 ':'🔴 ')+esc(t.category||'')+(t.party_name?' — '+esc(t.party_name):'')+'</span><b style="color:var(--'+(isIn?'green':'red')+')">'+(isIn?'+':'−')+formatMoney(Number(t.amount)||0)+'</b></div>';
  }).join('')||'<div style="color:var(--text3);text-align:center;padding:14px;font-size:12px">لا حركات</div>';
}

/* ---------- 2. الفواتير ---------- */
function accInvBalance(v){return (Number(v.total)||0)-(Number(v.paid)||0);}
function accInvStatus(v){var b=accInvBalance(v);if(b<=0.01)return {t:'مدفوعة',c:'ba2'};if((Number(v.paid)||0)>0)return {t:'مدفوعة جزئياً',c:'bp'};return {t:'غير مدفوعة',c:'bx'};}
function accRenderInvoices(){
  var q=(accVal('inv-q')||'').toLowerCase();
  var st=accVal('inv-status');
  var rows=accInvoices.filter(function(v){
    if(st==='unpaid'&&accInvBalance(v)<=0.01)return false;
    if(st==='paid'&&accInvBalance(v)>0.01)return false;
    if(q&&!((v.no||'')+' '+(v.party_name||'')+' '+(v.note||'')).toLowerCase().includes(q))return false;
    return true;
  }).sort(function(a,b){return (b.inv_date||'').localeCompare(a.inv_date||'')||(b.id||'').localeCompare(a.id||'');});
  var tot=rows.reduce(function(s,v){return s+(Number(v.total)||0);},0);
  var prof=rows.reduce(function(s,v){return s+(Number(v.profit)||0);},0);
  document.getElementById('inv-sum').innerHTML='عدد: <b>'+rows.length+'</b> · إجمالي: <b>'+formatMoney(tot)+'</b> · الأرباح: <b style="color:var(--green)">'+formatMoney(prof)+'</b>';
  document.getElementById('inv-tb').innerHTML=rows.map(function(v){
    var s=accInvStatus(v);
    return '<tr><td dir="ltr" style="font-weight:700">'+esc(v.no)+'</td><td>'+esc(v.inv_date)+'</td><td>'+esc(v.party_name||'—')+'</td>'
      +'<td>'+formatMoney(Number(v.total)||0)+'</td>'
      +'<td style="color:var(--green)">'+formatMoney(Number(v.profit)||0)+'</td>'
      +'<td><span class="badge '+s.c+'">'+s.t+'</span></td>'
      +'<td style="white-space:nowrap">'
      +(accInvBalance(v)>0.01?'<button class="btn bs3 bsm" onclick="accPayInv(\''+v.id+'\')">تحصيل</button> ':'')
      +'<button class="btn bo2 bsm" onclick="accPrintInvoice(\''+v.id+'\')">طباعة</button> '
      +'<button class="btn bo2 bsm" onclick="openInvoice(\''+v.id+'\')">تعديل</button> '
      +'<button class="btn bd2 bsm" onclick="accDelInvoice(\''+v.id+'\')">حذف</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">لا توجد فواتير</td></tr>';
}
function openInvoice(id){
  accEditInv=id||null;
  var v=id?accInvoices.find(function(x){return x.id===id;}):null;
  accInvItems=v?JSON.parse(JSON.stringify(v.items||[])):[];
  document.getElementById('invm-title').textContent=v?('تعديل فاتورة '+v.no):'فاتورة جديدة';
  accSet('invm-date',v?v.inv_date:new Date().toISOString().slice(0,10));
  accSet('invm-due',v&&v.due_date?v.due_date:'');
  accSet('invm-disc',v?v.discount:0);
  accSet('invm-tax',v?v.tax:0);
  accSet('invm-note',v?v.note:'');
  // قائمة الأطراف (عملاء/شركات)
  var parties=accAccounts.filter(function(a){return a.kind==='customer'||a.kind==='company';});
  var sel=document.getElementById('invm-party');
  sel.innerHTML='<option value="">— اختر العميل / الشركة —</option>'+parties.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+(a.kind==='company'?' (شركة)':'')+'</option>';}).join('')+'<option value="__new">＋ إضافة عميل/شركة جديد</option>';
  if(v)sel.value=v.party_id||'';
  accRenderInvItems();
  document.getElementById('ov-invoice').classList.add('open');
}
function invPartyChange(){
  if(document.getElementById('invm-party').value==='__new'){openAccount('customer',true);}
}
function accAddItem(){accInvItems.push({svc:'تأشيرة',desc:'',qty:1,cost:0,sell:0});accRenderInvItems();}
function accRmItem(i){accInvItems.splice(i,1);accRenderInvItems();}
function accItemChange(i,field,val){
  if(field==='desc'||field==='svc')accInvItems[i][field]=val;
  else accInvItems[i][field]=parseFloat(val)||0;
  accInvTotals();
}
function accRenderInvItems(){
  var h=accInvItems.map(function(it,i){
    var lineProfit=((Number(it.sell)||0)-(Number(it.cost)||0))*(Number(it.qty)||0);
    return '<tr>'
      +'<td><select onchange="accItemChange('+i+',\'svc\',this.value)" style="width:100%;padding:5px;border:1px solid var(--border);border-radius:6px;font-family:Cairo,sans-serif;font-size:12px">'+SVC_TYPES.map(function(s){return '<option'+(s===it.svc?' selected':'')+'>'+s+'</option>';}).join('')+'</select></td>'
      +'<td><input value="'+esc(it.desc)+'" oninput="accItemChange('+i+',\'desc\',this.value)" placeholder="تفاصيل" style="width:100%;padding:5px;border:1px solid var(--border);border-radius:6px;font-family:Cairo,sans-serif;font-size:12px"></td>'
      +'<td><input type="number" value="'+it.qty+'" min="1" oninput="accItemChange('+i+',\'qty\',this.value)" style="width:52px;padding:5px;border:1px solid var(--border);border-radius:6px;font-size:12px" dir="ltr"></td>'
      +'<td><input type="number" value="'+it.cost+'" min="0" step="0.01" oninput="accItemChange('+i+',\'cost\',this.value)" style="width:72px;padding:5px;border:1px solid var(--border);border-radius:6px;font-size:12px" dir="ltr"></td>'
      +'<td><input type="number" value="'+it.sell+'" min="0" step="0.01" oninput="accItemChange('+i+',\'sell\',this.value)" style="width:72px;padding:5px;border:1px solid var(--border);border-radius:6px;font-size:12px" dir="ltr"></td>'
      +'<td style="color:var(--green);font-weight:700;font-size:12px">'+formatMoney(lineProfit)+'</td>'
      +'<td><button class="btn bd2 bsm" onclick="accRmItem('+i+')">×</button></td></tr>';
  }).join('');
  document.getElementById('invm-items').innerHTML=h||'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:12px;font-size:12px">أضف بنداً</td></tr>';
  accInvTotals();
}
function accInvTotals(){
  var sub=accInvItems.reduce(function(s,it){return s+(Number(it.sell)||0)*(Number(it.qty)||0);},0);
  var cost=accInvItems.reduce(function(s,it){return s+(Number(it.cost)||0)*(Number(it.qty)||0);},0);
  var disc=accNum('invm-disc'),tax=accNum('invm-tax');
  var total=sub-disc+tax;
  var profit=sub-disc-cost;
  document.getElementById('invm-sub').textContent=formatMoney(sub);
  document.getElementById('invm-cost').textContent=formatMoney(cost);
  document.getElementById('invm-total').textContent=formatMoney(total);
  document.getElementById('invm-profit').textContent=formatMoney(profit);
}
function accSaveInvoice(){
  var pid=accVal('invm-party');
  if(pid==='__new'||!pid){alert('اختر العميل أو الشركة');return;}
  if(!accInvItems.length){alert('أضف بنداً واحداً على الأقل');return;}
  var pa=accFindAcc(pid);
  var sub=accInvItems.reduce(function(s,it){return s+(Number(it.sell)||0)*(Number(it.qty)||0);},0);
  var cost=accInvItems.reduce(function(s,it){return s+(Number(it.cost)||0)*(Number(it.qty)||0);},0);
  var disc=accNum('invm-disc'),tax=accNum('invm-tax');
  var existing=accEditInv?accInvoices.find(function(x){return x.id===accEditInv;}):null;
  var v={
    id:existing?existing.id:'INV'+Date.now(),
    no:existing?existing.no:('AY-'+new Date().getFullYear()+'-'+String(accInvoices.length+1).padStart(4,'0')),
    inv_date:accVal('invm-date')||new Date().toISOString().slice(0,10),
    due_date:accVal('invm-due')||null,
    party_id:pid,party_name:pa?pa.name:'',
    items:accInvItems,
    subtotal:Math.round(sub*100)/100,discount:disc,tax:tax,
    total:Math.round((sub-disc+tax)*100)/100,
    cost_total:Math.round(cost*100)/100,
    profit:Math.round((sub-disc-cost)*100)/100,
    paid:existing?existing.paid:0,
    status:existing?existing.status:'unpaid',
    note:accVal('invm-note'),
    created_by:cu?(cu.name||cu.email||''):''
  };
  if(existing){Object.assign(existing,v);}else{accInvoices.unshift(v);}
  sbUpsert('acc_invoices',v);
  lsSave();
  closeOv('ov-invoice');
  accRenderInvoices();
  if(typeof addNotif==='function')addNotif('acc','فاتورة '+v.no,(v.party_name||'')+' — '+formatMoney(v.total),'🧾');
}
function accDelInvoice(id){
  if(!confirm('حذف الفاتورة نهائياً؟'))return;
  accInvoices=accInvoices.filter(function(v){return v.id!==id;});
  sbDelete('acc_invoices',id);lsSave();accRenderInvoices();
}
function accPayInv(id){
  var v=accInvoices.find(function(x){return x.id===id;});if(!v)return;
  openVoucher('income');
  accSet('vc-amt',Math.round(accInvBalance(v)*100)/100);
  accSet('vc-cat','تحصيل ذمم');
  document.getElementById('vc-party').value=v.party_id;
  document.getElementById('vc-collect').checked=true;
  document.getElementById('ov-voucher').setAttribute('data-inv',id);
  vcPartyChange();
}
function accConvertReqs(){
  var paid=reqs.filter(function(r){return r.paid&&!accInvoices.some(function(v){return v.reqId===r.id;});});
  if(!paid.length){alert('لا توجد طلبات مدفوعة جديدة لتحويلها');return;}
  if(!confirm('تحويل '+paid.length+' طلب مدفوع إلى فواتير؟ (يمكنك تعديل التكلفة لكل فاتورة لاحقاً)'))return;
  paid.forEach(function(r){
    var pid=accEnsureParty(r.name,r.phone,'customer');
    var sell=Number(r.amt)||0;
    var v={id:'INV'+r.id,reqId:r.id,no:'AY-V-'+r.id,inv_date:r.date||new Date().toISOString().slice(0,10),due_date:null,
      party_id:pid,party_name:r.name,
      items:[{svc:'تأشيرة',desc:r.type||'تأشيرة',qty:1,cost:0,sell:sell}],
      subtotal:sell,discount:0,tax:0,total:sell,cost_total:0,profit:sell,paid:sell,status:'paid',
      note:'محوّلة من طلب تأشيرة #'+r.id,created_by:'نظام'};
    accInvoices.unshift(v);sbUpsert('acc_invoices',v);
  });
  lsSave();accRenderInvoices();
  alert('تم إنشاء '+paid.length+' فاتورة ✅ — راجع التكاليف لحساب الأرباح بدقة');
}
function accEnsureParty(name,phone,kind){
  var f=accAccounts.find(function(a){return a.name===name&&(a.kind==='customer'||a.kind==='company');});
  if(f)return f.id;
  var id='AC'+Date.now()+Math.floor(Math.random()*1000);
  var a={id:id,name:name,kind:kind||'customer',opening:0,phone:phone||'',note:'',active:true};
  accAccounts.push(a);sbInsert('acc_accounts',a);lsSave();
  return id;
}

/* ---------- 3. السندات ---------- */
function accRenderVouchers(){
  var m=accVal('vc-month')||curYM();accSet('vc-month',m);
  var ty=accVal('vc-filter');
  var q=(accVal('vc-q')||'').toLowerCase();
  var rows=txs.filter(function(t){
    if(ym(t.tx_date)!==m)return false;
    if(ty&&t.type!==ty)return false;
    if(t.kind==='transfer'||t.kind==='transfer_in')return false;
    if(q&&!((t.party_name||'')+' '+(t.category||'')+' '+(t.note||'')).toLowerCase().includes(q))return false;
    return true;
  }).sort(function(a,b){return (b.tx_date||'').localeCompare(a.tx_date||'')||(b.id||'').localeCompare(a.id||'');});
  var inc=rows.filter(function(t){return t.type==='income';}).reduce(function(s,t){return s+(Number(t.amount)||0);},0);
  var exp=rows.filter(function(t){return t.type==='expense';}).reduce(function(s,t){return s+(Number(t.amount)||0);},0);
  document.getElementById('vc-sum').innerHTML='قبض: <b style="color:var(--green)">'+formatMoney(inc)+'</b> · صرف: <b style="color:var(--red)">'+formatMoney(exp)+'</b> · الصافي: <b>'+formatMoney(inc-exp)+'</b>';
  document.getElementById('vc-tb').innerHTML=rows.map(function(t){
    var isIn=t.type==='income';var box=accFindAcc(t.account_id);
    return '<tr><td>'+esc(t.tx_date)+'</td><td><span class="badge '+(isIn?'ba2':'bx')+'">'+(isIn?'قبض':'صرف')+'</span></td>'
      +'<td>'+esc(t.category||'')+'</td><td>'+esc(t.party_name||'—')+'</td>'
      +'<td style="color:var(--'+(isIn?'green':'red')+');font-weight:700">'+(isIn?'+':'−')+formatMoney(Number(t.amount)||0)+'</td>'
      +'<td>'+esc(box?box.name:(t.method||'—'))+'</td>'
      +'<td style="white-space:nowrap"><button class="btn bo2 bsm" onclick="accPrintVoucher(\''+t.id+'\')">طباعة</button> <button class="btn bd2 bsm" onclick="accDelTx(\''+t.id+'\')">حذف</button></td></tr>';
  }).join('')||'<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:24px">لا توجد سندات</td></tr>';
}
function accBoxOptions(sel){
  var boxes=accAccounts.filter(function(a){return a.kind==='cash'||a.kind==='bank';});
  return boxes.map(function(a){return '<option value="'+a.id+'"'+(a.id===sel?' selected':'')+'>'+esc(a.name)+'</option>';}).join('');
}
function openVoucher(type){
  document.getElementById('ov-voucher').removeAttribute('data-inv');
  accSet('vc-type',type);
  document.getElementById('vcm-title').textContent=type==='income'?'سند قبض':'سند صرف';
  document.getElementById('vc-cat').innerHTML=(type==='income'?ACC_INCOME_CATS:ACC_EXPENSE_CATS).map(function(c){return '<option>'+c+'</option>';}).join('');
  accSet('vc-date',new Date().toISOString().slice(0,10));
  accSet('vc-amt','');accSet('vc-note','');accSet('vc-cur','USD');
  document.getElementById('vc-box').innerHTML=accBoxOptions('BOX-CASH');
  var parties=accAccounts.filter(function(a){return type==='income'?(a.kind==='customer'||a.kind==='company'):a.kind==='supplier'||a.kind==='customer'||a.kind==='company';});
  document.getElementById('vc-party').innerHTML='<option value="">— بدون طرف —</option>'+parties.map(function(a){return '<option value="'+a.id+'">'+esc(a.name)+'</option>';}).join('');
  document.getElementById('vc-collect').checked=false;
  document.getElementById('vc-settle-wrap').style.display=type==='expense'?'flex':'none';
  document.getElementById('vc-collect-wrap').style.display=type==='income'?'flex':'none';
  if(document.getElementById('vc-settle'))document.getElementById('vc-settle').checked=false;
  vcPartyChange();
  document.getElementById('ov-voucher').classList.add('open');
}
function vcPartyChange(){
  var pid=document.getElementById('vc-party').value;
  var wrap=document.getElementById('vc-bal-hint');
  if(pid){var b=partyBalance(pid);wrap.textContent='رصيد الطرف الحالي: '+formatMoney(b);wrap.style.display='block';}
  else wrap.style.display='none';
}
function accSaveVoucher(){
  var amt=accNum('vc-amt');if(amt<=0){alert('أدخل مبلغاً صحيحاً');return;}
  var cur=accVal('vc-cur');var usd=Math.round(accCur(cur,amt)*100)/100;
  var type=accVal('vc-type');
  var pid=document.getElementById('vc-party').value;var pa=pid?accFindAcc(pid):null;
  var boxId=document.getElementById('vc-box').value;
  var kind='';
  if(type==='income'&&document.getElementById('vc-collect').checked)kind='collect';
  if(type==='expense'&&document.getElementById('vc-settle')&&document.getElementById('vc-settle').checked)kind='settle';
  var invId=document.getElementById('ov-voucher').getAttribute('data-inv')||'';
  var t={id:'TX'+Date.now(),tx_date:accVal('vc-date')||new Date().toISOString().slice(0,10),
    type:type,doc:type==='income'?'receipt':'payment',
    category:accVal('vc-cat'),party_id:pid,party_name:pa?pa.name:'',
    invoice_id:invId,account_id:boxId,kind:kind,
    amount:usd,currency:cur,orig_amount:amt,
    method:accVal('vc-method'),note:accVal('vc-note'),
    created_by:cu?(cu.name||cu.email||''):''};
  txs.unshift(t);sbInsert('acc_transactions',t);
  // تحديث الفاتورة المرتبطة
  if(invId){var v=accInvoices.find(function(x){return x.id===invId;});if(v){v.paid=Math.round(((Number(v.paid)||0)+usd)*100)/100;v.status=accInvBalance(v)<=0.01?'paid':'partial';sbUpsert('acc_invoices',v);}}
  lsSave();closeOv('ov-voucher');
  accGo(accTab);
  if(typeof addNotif==='function')addNotif('acc',type==='income'?'سند قبض':'سند صرف',formatMoney(usd)+(pa?' — '+pa.name:''),'🧾');
}
function accDelTx(id){
  if(!confirm('حذف السند نهائياً؟'))return;
  var t=txs.find(function(x){return x.id===id;});
  if(t&&t.invoice_id){var v=accInvoices.find(function(x){return x.id===t.invoice_id;});if(v){v.paid=Math.max(0,(Number(v.paid)||0)-(Number(t.amount)||0));v.status=accInvBalance(v)<=0.01?(v.paid>0?'paid':'unpaid'):'partial';sbUpsert('acc_invoices',v);}}
  txs=txs.filter(function(x){return x.id!==id;});
  sbDelete('acc_transactions',id);lsSave();accGo(accTab);
}
function accTransfer(){
  var boxes=accAccounts.filter(function(a){return a.kind==='cash'||a.kind==='bank';});
  if(boxes.length<2){alert('أضف صندوقين على الأقل للتحويل');return;}
  document.getElementById('tr-from').innerHTML=accBoxOptions(boxes[0].id);
  document.getElementById('tr-to').innerHTML=accBoxOptions(boxes[1].id);
  accSet('tr-amt','');accSet('tr-date',new Date().toISOString().slice(0,10));
  document.getElementById('ov-transfer').classList.add('open');
}
function accSaveTransfer(){
  var from=document.getElementById('tr-from').value,to=document.getElementById('tr-to').value;
  if(from===to){alert('اختر صندوقين مختلفين');return;}
  var amt=accNum('tr-amt');if(amt<=0){alert('أدخل مبلغاً');return;}
  var d=accVal('tr-date')||new Date().toISOString().slice(0,10);var st=Date.now();
  var out={id:'TX'+st,tx_date:d,type:'expense',doc:'transfer',category:'تحويل داخلي',account_id:from,kind:'transfer',amount:amt,currency:'USD',orig_amount:amt,method:'تحويل',note:'تحويل صادر',party_id:'',party_name:'',invoice_id:'',created_by:cu?(cu.name||''):''};
  var inn={id:'TX'+(st+1),tx_date:d,type:'income',doc:'transfer',category:'تحويل داخلي',account_id:to,kind:'transfer_in',amount:amt,currency:'USD',orig_amount:amt,method:'تحويل',note:'تحويل وارد',party_id:'',party_name:'',invoice_id:'',created_by:cu?(cu.name||''):''};
  txs.unshift(out,inn);sbInsert('acc_transactions',out);sbInsert('acc_transactions',inn);
  lsSave();closeOv('ov-transfer');accGo(accTab);
}

/* ---------- 4. الحسابات والكشوف ---------- */
function accRenderAccounts(){
  var kf=accVal('ac-kind');
  var q=(accVal('ac-q')||'').toLowerCase();
  var list=accAccounts.filter(function(a){
    if(a.kind==='cash'||a.kind==='bank')return false;
    if(kf&&a.kind!==kf)return false;
    if(q&&!(a.name||'').toLowerCase().includes(q))return false;
    return true;
  });
  var kindLbl={customer:'عميل',company:'شركة',supplier:'مورد'};
  document.getElementById('ac-tb').innerHTML=list.map(function(a){
    var b=partyBalance(a.id);
    var lbl=a.kind==='supplier'?(b>0?'مستحق لهم':'رصيد لنا'):(b>0?'مستحق علينا منهم':'رصيد لهم');
    return '<tr><td style="font-weight:700">'+esc(a.name)+'</td><td><span class="badge br2">'+kindLbl[a.kind]+'</span></td>'
      +'<td dir="ltr">'+esc(a.phone||'—')+'</td>'
      +'<td style="font-weight:700;color:var(--'+(b>0?(a.kind==='supplier'?'red':'red'):'green')+')">'+formatMoney(Math.abs(b))+'</td>'
      +'<td style="font-size:10px;color:var(--text3)">'+lbl+'</td>'
      +'<td style="white-space:nowrap"><button class="btn bn2 bsm" onclick="accStatement(\''+a.id+'\')">كشف حساب</button> <button class="btn bo2 bsm" onclick="openAccount(null,false,\''+a.id+'\')">تعديل</button></td></tr>';
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px">لا توجد حسابات — أضف عميلاً أو مورداً</td></tr>';
}
function openAccount(kind,fromInvoice,editId){
  var a=editId?accFindAcc(editId):null;
  document.getElementById('acm-title').textContent=a?'تعديل حساب':'حساب جديد';
  document.getElementById('acm-edit').value=a?a.id:'';
  document.getElementById('acm-from-inv').value=fromInvoice?'1':'';
  accSet('acm-name',a?a.name:'');
  accSet('acm-phone',a?a.phone:'');
  accSet('acm-open',a?a.opening:0);
  accSet('acm-note',a?a.note:'');
  document.getElementById('acm-kind').value=a?a.kind:(kind||'customer');
  document.getElementById('ov-account').classList.add('open');
}
function accSaveAccount(){
  var name=accVal('acm-name').trim();if(!name){alert('أدخل الاسم');return;}
  var editId=document.getElementById('acm-edit').value;
  var fromInv=document.getElementById('acm-from-inv').value;
  var existing=editId?accFindAcc(editId):null;
  var a=existing||{id:'AC'+Date.now()};
  a.name=name;a.kind=document.getElementById('acm-kind').value;
  a.phone=accVal('acm-phone');a.opening=accNum('acm-open');a.note=accVal('acm-note');
  if(a.active===undefined)a.active=true;
  if(!existing)accAccounts.push(a);
  sbUpsert('acc_accounts',a);lsSave();
  closeOv('ov-account');
  if(fromInv){ // رجوع لنافذة الفاتورة واختيار الطرف الجديد
    var sel=document.getElementById('invm-party');
    var parties=accAccounts.filter(function(x){return x.kind==='customer'||x.kind==='company';});
    sel.innerHTML='<option value="">— اختر العميل / الشركة —</option>'+parties.map(function(x){return '<option value="'+x.id+'">'+esc(x.name)+(x.kind==='company'?' (شركة)':'')+'</option>';}).join('')+'<option value="__new">＋ إضافة عميل/شركة جديد</option>';
    sel.value=a.id;
  }else{accRenderAccounts();}
}
function accStatement(id){
  var a=accFindAcc(id);if(!a)return;
  var entries=[];
  var open=Number(a.opening)||0;
  if(a.kind==='supplier'){
    txs.forEach(function(t){if(t.party_id!==id)return;
      if(t.kind==='bill')entries.push({d:t.tx_date,desc:'التزام: '+(t.category||''),deb:0,cred:Number(t.amount)||0,note:t.note});
      else if(t.kind==='settle')entries.push({d:t.tx_date,desc:'سداد',deb:Number(t.amount)||0,cred:0,note:t.note});
    });
  }else{
    accInvoices.forEach(function(v){if(v.party_id!==id)return;entries.push({d:v.inv_date,desc:'فاتورة '+v.no,deb:Number(v.total)||0,cred:0,note:v.note});});
    txs.forEach(function(t){if(t.party_id!==id||t.type!=='income')return;entries.push({d:t.tx_date,desc:'تحصيل ('+(t.category||'')+')',deb:0,cred:Number(t.amount)||0,note:t.note});});
  }
  entries.sort(function(x,y){return (x.d||'').localeCompare(y.d||'');});
  var run=open;
  var isSupp=a.kind==='supplier';
  var rowsH='';
  entries.forEach(function(e){
    // للعميل: مدين=فاتورة يزيد الرصيد المستحق، دائن=تحصيل ينقص
    run+= isSupp ? (e.cred-e.deb) : (e.deb-e.cred);
    rowsH+='<tr><td>'+esc(e.d||'')+'</td><td>'+esc(e.desc)+'</td>'
      +'<td>'+(e.deb?formatMoney(e.deb):'—')+'</td>'
      +'<td>'+(e.cred?formatMoney(e.cred):'—')+'</td>'
      +'<td style="font-weight:700">'+formatMoney(run)+'</td></tr>';
  });
  var finalBal=partyBalance(id);
  document.getElementById('stm-title').textContent='كشف حساب — '+a.name;
  document.getElementById('stm-meta').innerHTML='النوع: '+({customer:'عميل',company:'شركة',supplier:'مورد'}[a.kind])+' · الهاتف: <span dir="ltr">'+esc(a.phone||'—')+'</span> · الرصيد النهائي: <b style="color:var(--'+(finalBal>0?'red':'green')+')">'+formatMoney(Math.abs(finalBal))+' '+(finalBal>0?(isSupp?'(مستحق لهم)':'(علينا منهم)'):'(رصيد لهم/دائن)')+'</b>';
  document.getElementById('stm-open').textContent=formatMoney(open);
  document.getElementById('stm-tb').innerHTML=rowsH||'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:16px">لا حركات</td></tr>';
  document.getElementById('ov-statement').setAttribute('data-id',id);
  document.getElementById('ov-statement').classList.add('open');
}
function accPrintStatement(){
  var id=document.getElementById('ov-statement').getAttribute('data-id');
  var a=accFindAcc(id);if(!a)return;
  var w=window.open('','_blank','width=800,height=900');
  var tbl=document.getElementById('stm-tb').innerHTML;
  var meta=document.getElementById('stm-meta').innerHTML;
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب '+esc(a.name)+'</title>'
    +'<style>body{font-family:Cairo,Arial,sans-serif;padding:34px;color:#171B26}h1{color:#0A1733;font-size:20px;border-bottom:3px solid #C9A227;padding-bottom:12px}h2{font-size:16px;margin:16px 0 6px}p{font-size:12px;color:#555}table{width:100%;border-collapse:collapse;font-size:12px;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#F6F5F1}@media print{body{padding:16px}}</style></head><body>'
    +'<h1>اليامي للسفر والسياحة — كشف حساب</h1><h2>'+esc(a.name)+'</h2><p>'+meta+'</p>'
    +'<table><thead><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>'+tbl+'</tbody></table>'
    +'<p style="margin-top:30px">تاريخ الطباعة: '+new Date().toLocaleDateString('en-GB')+'</p>'
    +'<script>window.onload=function(){window.print()}<\/script></body></html>');
  w.document.close();
}

/* ---------- 5. الصناديق والبنوك ---------- */
function accRenderBoxes(){
  var boxes=accAccounts.filter(function(a){return a.kind==='cash'||a.kind==='bank';});
  document.getElementById('bx-tb').innerHTML=boxes.map(function(a){
    return '<tr><td style="font-weight:700">'+(a.kind==='bank'?'🏛️ ':'💵 ')+esc(a.name)+'</td>'
      +'<td>'+(a.kind==='bank'?'بنك':'نقدي')+'</td>'
      +'<td>'+formatMoney(Number(a.opening)||0)+'</td>'
      +'<td style="font-weight:800;color:var(--navy)">'+formatMoney(boxBalance(a.id))+'</td>'
      +'<td style="white-space:nowrap"><button class="btn bo2 bsm" onclick="openBox(\''+a.id+'\')">تعديل</button> <button class="btn bd2 bsm" onclick="accDelBox(\''+a.id+'\')">حذف</button></td></tr>';
  }).join('')||'<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">لا صناديق</td></tr>';
  document.getElementById('bx-total').textContent=formatMoney(totalCash());
}
function openBox(id){
  var a=id?accFindAcc(id):null;
  document.getElementById('bxm-title').textContent=a?'تعديل صندوق':'صندوق / بنك جديد';
  document.getElementById('bxm-edit').value=a?a.id:'';
  accSet('bxm-name',a?a.name:'');
  document.getElementById('bxm-kind').value=a?a.kind:'cash';
  accSet('bxm-open',a?a.opening:0);
  document.getElementById('ov-box').classList.add('open');
}
function accSaveBox(){
  var name=accVal('bxm-name').trim();if(!name){alert('أدخل الاسم');return;}
  var editId=document.getElementById('bxm-edit').value;
  var a=editId?accFindAcc(editId):{id:'BOX'+Date.now()};
  a.name=name;a.kind=document.getElementById('bxm-kind').value;a.opening=accNum('bxm-open');
  if(a.active===undefined)a.active=true;a.phone=a.phone||'';a.note=a.note||'';
  if(!editId)accAccounts.push(a);
  sbUpsert('acc_accounts',a);lsSave();closeOv('ov-box');accRenderBoxes();
}
function accDelBox(id){
  if(!confirm('حذف الصندوق؟ (الحركات المرتبطة تبقى بدون صندوق)'))return;
  accAccounts=accAccounts.filter(function(a){return a.id!==id;});
  sbDelete('acc_accounts',id);lsSave();accRenderBoxes();
}

/* ---------- 6. التقارير ---------- */
function accRenderReports(){
  var m=accVal('rp-month')||curYM();accSet('rp-month',m);
  var pl=plFor(m);
  document.getElementById('rp-pl').innerHTML=
     rpRow('المبيعات (الإيرادات)',pl.rev,'var(--green)')
    +rpRow('− تكلفة الخدمات المباعة',pl.cogs,'var(--red)')
    +rpRow('= مجمل الربح',pl.gross,'var(--navy)',true)
    +rpRow('− المصروفات التشغيلية',pl.opex,'var(--red)')
    +rpRow('= صافي الربح',pl.net,pl.net>=0?'var(--green)':'var(--red)',true);
  // ربحية الخدمات
  var svc={};
  accInvoices.forEach(function(v){if(ym(v.inv_date)!==m)return;(v.items||[]).forEach(function(it){
    var k=it.svc||'أخرى';if(!svc[k])svc[k]={sell:0,cost:0,cnt:0};
    var q=Number(it.qty)||0;svc[k].sell+=(Number(it.sell)||0)*q;svc[k].cost+=(Number(it.cost)||0)*q;svc[k].cnt+=q;
  });});
  var svcRows=Object.keys(svc).map(function(k){var s=svc[k];var p=s.sell-s.cost;
    return '<tr><td>'+esc(k)+'</td><td>'+s.cnt+'</td><td>'+formatMoney(s.sell)+'</td><td>'+formatMoney(s.cost)+'</td><td style="color:var(--green);font-weight:700">'+formatMoney(p)+'</td><td>'+(s.sell?Math.round(p/s.sell*100):0)+'%</td></tr>';
  }).join('');
  document.getElementById('rp-svc').innerHTML=svcRows||'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:14px">لا فواتير في الشهر</td></tr>';
  // المصروفات حسب البند
  var exp={};
  txs.forEach(function(t){if(ym(t.tx_date)!==m||t.type!=='expense'||t.kind==='transfer'||t.kind==='settle')return;exp[t.category||'أخرى']=(exp[t.category||'أخرى']||0)+(Number(t.amount)||0);});
  var expRows=Object.keys(exp).sort(function(a,b){return exp[b]-exp[a];}).map(function(k){
    return '<tr><td>'+esc(k)+'</td><td style="color:var(--red);font-weight:700">'+formatMoney(exp[k])+'</td></tr>';
  }).join('');
  document.getElementById('rp-exp').innerHTML=expRows||'<tr><td colspan="2" style="text-align:center;color:var(--text3);padding:14px">لا مصروفات</td></tr>';
  // أعمار الديون
  accRenderAging();
}
function rpRow(lbl,val,color,bold){
  return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13.5px'+(bold?';font-weight:800':'')+'"><span>'+lbl+'</span><b style="color:'+(color||'var(--text)')+'">'+formatMoney(val)+'</b></div>';
}
function accRenderAging(){
  var today=new Date();
  var buckets={b0:0,b30:0,b60:0,b90:0};
  var rowsMap={};
  accInvoices.forEach(function(v){
    var bal=accInvBalance(v);if(bal<=0.01)return;
    var ref=new Date(v.due_date||v.inv_date);
    var days=Math.floor((today-ref)/86400000);
    var bk=days<=30?'b0':days<=60?'b30':days<=90?'b60':'b90';
    buckets[bk]+=bal;
    var key=v.party_name||'—';
    if(!rowsMap[key])rowsMap[key]={b0:0,b30:0,b60:0,b90:0,tot:0};
    rowsMap[key][bk]+=bal;rowsMap[key].tot+=bal;
  });
  document.getElementById('rp-aging-sum').innerHTML=
    '<div class="sc2"><div><div class="sn" style="font-size:16px">'+formatMoney(buckets.b0)+'</div><div class="sl">0-30 يوم</div></div></div>'
   +'<div class="sc2"><div><div class="sn" style="font-size:16px;color:var(--amber)">'+formatMoney(buckets.b30)+'</div><div class="sl">31-60 يوم</div></div></div>'
   +'<div class="sc2"><div><div class="sn" style="font-size:16px;color:var(--amber)">'+formatMoney(buckets.b60)+'</div><div class="sl">61-90 يوم</div></div></div>'
   +'<div class="sc2"><div><div class="sn" style="font-size:16px;color:var(--red)">'+formatMoney(buckets.b90)+'</div><div class="sl">+90 يوم (متعثرة)</div></div></div>';
  var keys=Object.keys(rowsMap).sort(function(a,b){return rowsMap[b].tot-rowsMap[a].tot;});
  document.getElementById('rp-aging-tb').innerHTML=keys.map(function(k){var r=rowsMap[k];
    return '<tr><td style="font-weight:700">'+esc(k)+'</td><td>'+formatMoney(r.b0)+'</td><td>'+formatMoney(r.b30)+'</td><td>'+formatMoney(r.b60)+'</td><td style="color:var(--red)">'+formatMoney(r.b90)+'</td><td style="font-weight:700">'+formatMoney(r.tot)+'</td></tr>';
  }).join('')||'<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:14px">لا ذمم مستحقة 🎉</td></tr>';
}
function accExportReport(){
  var m=accVal('rp-month')||curYM();var pl=plFor(m);
  var L=['تقرير محاسبي — '+m,'','قائمة الدخل,USD','المبيعات,'+pl.rev,'تكلفة الخدمات,'+pl.cogs,'مجمل الربح,'+pl.gross,'المصروفات التشغيلية,'+pl.opex,'صافي الربح,'+pl.net,''];
  L.push('السيولة والذمم,USD','رصيد الصناديق,'+totalCash(),'ذمم مدينة (لنا),'+receivablesTotal(),'ذمم دائنة (علينا),'+payablesTotal());
  var blob=new Blob(['﻿'+L.join('\n')],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='alyami-report-'+m+'.csv';a.click();URL.revokeObjectURL(url);
}

/* ---------- طباعة سند ---------- */
function accPrintVoucher(id){
  var t=txs.find(function(x){return x.id===id;});if(!t)return;
  var isIn=t.type==='income';var box=accFindAcc(t.account_id);
  var w=window.open('','_blank','width=700,height=800');
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>'+(isIn?'سند قبض':'سند صرف')+' '+t.id+'</title>'
    +'<style>body{font-family:Cairo,Arial,sans-serif;padding:40px;color:#171B26}.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #C9A227;padding-bottom:16px;margin-bottom:22px}.hd h1{font-size:20px;color:#0A1733;margin:0}.doc-t{text-align:center;background:'+(isIn?'#E3F5EE':'#FBEAEA')+';color:'+(isIn?'#178A66':'#B23434')+';font-size:22px;font-weight:800;padding:12px;border-radius:10px;margin-bottom:22px}table{width:100%;border-collapse:collapse;font-size:14px}td{padding:12px;border:1px solid #ddd}td:first-child{background:#F6F5F1;font-weight:700;width:150px}.amt{font-size:20px;font-weight:800;color:'+(isIn?'#178A66':'#B23434')+'}.sig{display:flex;justify-content:space-between;margin-top:56px;font-size:13px}.sig div{text-align:center;width:200px;border-top:1.5px solid #333;padding-top:8px}@media print{body{padding:20px}}</style></head><body>'
    +'<div class="hd"><div><h1>اليامي للسفر والسياحة</h1><p style="font-size:12px;color:#666;margin:4px 0 0">نظام التأشيرات والمحاسبة</p></div><div style="text-align:left;font-size:12px;color:#666">رقم: <b dir="ltr">'+t.id+'</b><br>'+t.tx_date+'</div></div>'
    +'<div class="doc-t">'+(isIn?'سند قبض':'سند صرف')+'</div><table>'
    +'<tr><td>'+(isIn?'استلمنا من':'صرفنا إلى')+'</td><td>'+esc(t.party_name||'—')+'</td></tr>'
    +'<tr><td>المبلغ</td><td class="amt">'+formatMoney(Number(t.amount)||0)+(t.currency&&t.currency!=='USD'?' <span style="font-size:12px;color:#888">('+t.orig_amount+' '+(t.currency==='LYD'?'د.ل':'ج.م')+')</span>':'')+'</td></tr>'
    +'<tr><td>البند</td><td>'+esc(t.category||'')+'</td></tr>'
    +'<tr><td>الصندوق/الدفع</td><td>'+esc(box?box.name:(t.method||''))+'</td></tr>'
    +'<tr><td>البيان</td><td>'+esc(t.note||'—')+'</td></tr>'
    +'<tr><td>حرره</td><td>'+esc(t.created_by||'—')+'</td></tr></table>'
    +'<div class="sig"><div>توقيع المستلم</div><div>توقيع المحاسب</div></div>'
    +'<script>window.onload=function(){window.print()}<\/script></body></html>');
  w.document.close();
}
/* ---------- طباعة فاتورة ---------- */
function accPrintInvoice(id){
  var v=accInvoices.find(function(x){return x.id===id;});if(!v)return;
  var rows=(v.items||[]).map(function(it,i){var q=Number(it.qty)||0;
    return '<tr><td>'+(i+1)+'</td><td>'+esc(it.svc)+(it.desc?' — '+esc(it.desc):'')+'</td><td>'+q+'</td><td>'+formatMoney(Number(it.sell)||0)+'</td><td>'+formatMoney((Number(it.sell)||0)*q)+'</td></tr>';
  }).join('');
  var w=window.open('','_blank','width=800,height=950');
  w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة '+esc(v.no)+'</title>'
    +'<style>body{font-family:Cairo,Arial,sans-serif;padding:38px;color:#171B26}.hd{display:flex;justify-content:space-between;border-bottom:3px solid #C9A227;padding-bottom:16px;margin-bottom:20px}.hd h1{font-size:22px;color:#0A1733;margin:0}.hd p{font-size:12px;color:#666;margin:3px 0 0}.inv-meta{text-align:left;font-size:13px}.badge{display:inline-block;background:#0A1733;color:#F3E5BE;padding:6px 14px;border-radius:8px;font-weight:700;font-size:16px}table{width:100%;border-collapse:collapse;font-size:13px;margin:16px 0}th,td{border:1px solid #ddd;padding:10px;text-align:right}th{background:#0A1733;color:#fff}.tot{margin-right:auto;width:280px;font-size:13px}.tot div{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee}.tot .g{font-size:17px;font-weight:800;color:#0A1733;border-bottom:none}.pay{text-align:center;margin-top:8px;font-size:12px;color:#666}@media print{body{padding:18px}}</style></head><body>'
    +'<div class="hd"><div><h1>اليامي للسفر والسياحة</h1><p>تأشيرات · تذاكر · حجوزات · خدمات سفر</p><p>الهاتف: +218 · info@alyametravel.com</p></div>'
    +'<div class="inv-meta"><div class="badge">فاتورة</div><p>رقم: <b dir="ltr">'+esc(v.no)+'</b></p><p>التاريخ: '+esc(v.inv_date)+'</p>'+(v.due_date?'<p>الاستحقاق: '+esc(v.due_date)+'</p>':'')+'</div></div>'
    +'<p style="font-size:13px"><b>العميل:</b> '+esc(v.party_name||'—')+'</p>'
    +'<table><thead><tr><th>#</th><th>الخدمة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div class="tot"><div><span>الإجمالي الفرعي</span><span>'+formatMoney(Number(v.subtotal)||0)+'</span></div>'
    +(v.discount?'<div><span>الخصم</span><span>−'+formatMoney(v.discount)+'</span></div>':'')
    +(v.tax?'<div><span>الضريبة</span><span>'+formatMoney(v.tax)+'</span></div>':'')
    +'<div class="g"><span>الإجمالي</span><span>'+formatMoney(Number(v.total)||0)+'</span></div>'
    +(v.paid?'<div><span>المدفوع</span><span>'+formatMoney(v.paid)+'</span></div><div><span>المتبقي</span><span>'+formatMoney(accInvBalance(v))+'</span></div>':'')+'</div>'
    +(v.note?'<p style="font-size:12px;color:#666;margin-top:16px"><b>ملاحظات:</b> '+esc(v.note)+'</p>':'')
    +'<p class="pay">شكراً لتعاملكم مع اليامي للسفر والسياحة</p>'
    +'<script>window.onload=function(){window.print()}<\/script></body></html>');
  w.document.close();
}
