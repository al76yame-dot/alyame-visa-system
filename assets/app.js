// ===== SECURITY: HTML Escape =====
function esc(s){if(!s)return '';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

const SB='https://wcknrzuedgkcyygeqmqw.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indja25yenVlZGdrY3l5Z2VxbXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzkwNzAsImV4cCI6MjA5MTMxNTA3MH0.3gU4BYDVjYyl9FoafLGVjcWtv8YFcNRCSTmDtn9ep1Q';
const APP='https://al76yame-dot.github.io/alyame-visa-system/';

// FONT SIZE
var fontSize=14;
try{var sf=localStorage.getItem('alyami_font');if(sf)fontSize=parseInt(sf);}catch(e){}
function applyFontSize(){
  document.querySelector('.main').style.fontSize=fontSize+'px';
  var lbl=document.getElementById('font-size-label');
  if(lbl)lbl.textContent=fontSize;
  try{localStorage.setItem('alyami_font',fontSize);}catch(e){}
}
function changeFontSize(d){
  fontSize=Math.min(20,Math.max(11,fontSize+d));
  applyFontSize();
}

// LOGO MANAGEMENT
var defaultLogoSrc=document.querySelector('.auth-logo img').src;
function loadSavedLogo(){
  try{var saved=localStorage.getItem('alyami_logo');if(saved){
    document.querySelectorAll('.sb-head img,.auth-logo img').forEach(function(img){img.src=saved;});
  }}catch(e){}
  var prev=document.getElementById('logo-preview');
  if(prev){var cur=document.querySelector('.sb-head img');if(cur)prev.src=cur.src;}
}
function changeLogo(input){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    var src=e.target.result;
    document.querySelectorAll('.sb-head img,.auth-logo img').forEach(function(img){img.src=src;});
    var prev=document.getElementById('logo-preview');if(prev)prev.src=src;
    try{localStorage.setItem('alyami_logo',src);}catch(ex){}
    alert('تم تغيير الشعار بنجاح ✅');
  };
  reader.readAsDataURL(input.files[0]);
}
function resetLogo(){
  document.querySelectorAll('.sb-head img,.auth-logo img').forEach(function(img){img.src=defaultLogoSrc;});
  var prev=document.getElementById('logo-preview');if(prev)prev.src=defaultLogoSrc;
  try{localStorage.removeItem('alyami_logo');}catch(e){}
  alert('تم استعادة الشعار الافتراضي ✅');
}

// CLIENT: Cancel & Edit requests
function clientCancelReq(reqId){
  if(!confirm('⚠️ هل تريد إلغاء هذا الطلب؟\n\nرقم الطلب: '+reqId+'\n\nلا يمكن التراجع عن هذا الإجراء.'))return;
  var r=reqs.find(function(x){return x.id===reqId;});
  if(!r)return;
  if(r.status!=='pending'){alert('لا يمكن إلغاء طلب تم معالجته');return;}
  // Refund wallet if paid
  if(r.amt&&r.amt>0&&r.paidFromWallet){
    wb=parseFloat((wb+(r.amt||0)).toFixed(2));
    var wc=wcs.find(function(c){return c.phone===cu.phone;});
    if(wc)wc.bal=wb;
    try{localStorage.setItem('alyami_wcs',JSON.stringify(wcs));}catch(e){}
    document.getElementById('w-bal').textContent=formatMoney(wb);
    document.getElementById('bal-n').textContent=formatMoney(wb);
  }
  r.status='cancelled';
  try{localStorage.setItem('alyami_reqs',JSON.stringify(reqs));}catch(e){}
  alert('تم إلغاء الطلب ✅'+(r.paidFromWallet?'\nتم إرجاع المبلغ '+formatMoney(r.amt)+' إلى رصيدك':''));
  renderClientReqsFull();renderClientReqs();renderClientDashboard();
}

function clientEditReq(reqId){
  var r=reqs.find(function(x){return x.id===reqId;});
  if(!r){alert('الطلب غير موجود');return;}
  if(r.status!=='pending'){alert('لا يمكن تعديل طلب تم معالجته');return;}
  // Open edit modal
  var html='<div class="ov open" id="ov-client-edit"><div class="modal" style="max-width:480px"><div class="mh"><span class="mt2">تعديل الطلب '+r.id+'</span><button class="xb" onclick="document.getElementById(\'ov-client-edit\').remove()">×</button></div><div class="mb2"><div class="fgrid">'
    +'<div class="fg full"><label>الاسم (عربي)</label><input type="text" id="ce-ar" value="'+(r.name||'')+'"></div>'
    +'<div class="fg full"><label>Full Name (English)</label><input type="text" id="ce-en" dir="ltr" value="'+(r.name_en||'')+'"></div>'
    +'<div class="fg"><label>رقم الجواز</label><input type="text" id="ce-pp" dir="ltr" value="'+(r.passport||'')+'"></div>'
    +'<div class="fg"><label>تاريخ الميلاد</label><input type="date" id="ce-dob" value="'+(r.dob||'')+'"></div>'
    +'<div class="fg"><label>خط الطيران</label><input type="text" id="ce-airline" value="'+(r.airline||'')+'"></div>'
    +'<div class="fg"><label>من</label><input type="text" id="ce-from" value="'+(r.route_from||'')+'"></div>'
    +'<div class="fg"><label>إلى</label><input type="text" id="ce-to" value="'+(r.route_to||'')+'"></div>'
    +'<div class="fg"><label>تاريخ السفر</label><input type="date" id="ce-travel" value="'+(r.travel_date||'')+'"></div>'
    +'</div></div><div class="mf"><button class="btn bo2" onclick="document.getElementById(\'ov-client-edit\').remove()">إلغاء</button><button class="btn bn2" onclick="saveClientEdit(\''+r.id+'\')">حفظ التعديلات</button></div></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function saveClientEdit(reqId){
  var r=reqs.find(function(x){return x.id===reqId;});if(!r)return;
  r.name=document.getElementById('ce-ar').value.trim()||r.name;
  r.name_en=document.getElementById('ce-en').value.trim();
  r.passport=document.getElementById('ce-pp').value.trim()||r.passport;
  r.dob=document.getElementById('ce-dob').value||r.dob;
  r.airline=document.getElementById('ce-airline').value.trim();
  r.route_from=document.getElementById('ce-from').value.trim();
  r.route_to=document.getElementById('ce-to').value.trim();
  r.travel_date=document.getElementById('ce-travel').value;
  try{localStorage.setItem('alyami_reqs',JSON.stringify(reqs));}catch(e){}
  document.getElementById('ov-client-edit').remove();
  alert('تم تعديل الطلب بنجاح ✅');
  renderClientReqsFull();renderClientReqs();
}

// CURRENCY SYSTEM
var curCurrency='USD'; // USD or LYD
try{var sc=localStorage.getItem('alyami_currency');if(sc)curCurrency=sc;}catch(e){}
var usdToLyd=5.5; // سعر الصرف الافتراضي
var usdToEgp=50; // سعر الصرف الجنيه المصري
try{var savedEgp=localStorage.getItem('alyami_egp');if(savedEgp)usdToEgp=parseFloat(savedEgp);}catch(e){}
// تحميل سعر الصرف المحفوظ فوراً
try{var savedRate=localStorage.getItem('alyami_rate');if(savedRate)usdToLyd=parseFloat(savedRate);}catch(e){}

function getCurrencySymbol(){return curCurrency==='USD'?'$':curCurrency==='LYD'?'د.ل':'ج.م';}
function formatMoney(usdAmount){
  if(curCurrency==='USD')return '$'+Number(usdAmount).toLocaleString();
  if(curCurrency==='LYD')return Number((usdAmount*usdToLyd).toFixed(0)).toLocaleString()+' د.ل';
  return Number((usdAmount*usdToEgp).toFixed(0)).toLocaleString()+' ج.م';
}
function toUSD(amount){
  if(curCurrency==='USD')return amount;
  return amount/usdToLyd;
}
function fromUSD(usdAmount){
  if(curCurrency==='USD')return usdAmount;
  return usdAmount*usdToLyd;
}
function toggleCurrency(){
  if(curCurrency==='USD')curCurrency='LYD';
  else if(curCurrency==='LYD')curCurrency='EGP';
  else curCurrency='USD';
  try{localStorage.setItem('alyami_currency',curCurrency);}catch(e){}
  updateCurrencyBtn();
  refreshAllMoney();
}
function updateCurrencyBtn(){
  var btn=document.getElementById('cur-toggle');
  if(!btn)return;
  if(curCurrency==='USD')btn.textContent='$ دولار';
  else if(curCurrency==='LYD')btn.textContent='د.ل دينار';
  else btn.textContent='ج.م جنيه';
}
function setExchangeRate(rate){
  usdToLyd=parseFloat(rate)||5.5;
  try{localStorage.setItem('alyami_rate',usdToLyd);}catch(e){}
  if(curCurrency!=='USD')refreshAllMoney();
}
function setEgpRate(rate){
  usdToEgp=parseFloat(rate)||50;
  try{localStorage.setItem('alyami_egp',usdToEgp);}catch(e){}
  if(curCurrency==='EGP')refreshAllMoney();
}
function refreshAllMoney(){
  // Update topbar balance
  document.getElementById('bal-n').textContent=formatMoney(wb).replace('$','').replace(' د.ل','');
  // Update wallet page
  document.getElementById('w-bal').textContent=formatMoney(wb).replace('$','').replace(' د.ل','');
  // Re-render tables
  if(cr==='admin')renderReqs();
  else if(cr==='staff')renderStaff();
  renderWCs();
  renderVisas();
}


var tok=null,cu=null,cr='admin',step=1,sv='',sa=0,ta=100,wb=0,evid=null;

// DEFAULT VISA TYPES
var defaultVisas=[
  {id:'hajj',n:'تأشيرة حج',i:'🕋',p:1200,on:true,
   types:['عادية','مجموعة'],
   nationalities:['جميع الجنسيات'],
   duration:'30 يوم',desc:'موسم الحج'},
  {id:'umra',n:'تأشيرة عمرة',i:'🌙',p:800,on:true,
   types:['فردية','عائلية','مجموعة'],
   nationalities:['جميع الجنسيات'],
   duration:'30 يوم',desc:'طوال العام'},
  {id:'egypt',n:'دخول مصر',i:'🇪🇬',p:350,on:true,
   types:['سياحية','عمل','عبور'],
   nationalities:['جميع الجنسيات'],
   duration:'3-7 أيام عمل',desc:'سياحية وعمل'},
  {id:'tourist',n:'تأشيرة سياحية',i:'✈️',p:500,on:true,
   types:['فردية','عائلية','مجموعة'],
   nationalities:['جميع الجنسيات'],
   duration:'7-14 يوم عمل',desc:'لجميع الدول'},
  {id:'work',n:'تأشيرة عمل',i:'💼',p:900,on:true,
   types:['عمل','إقامة'],
   nationalities:['جميع الجنسيات'],
   duration:'14-30 يوم عمل',desc:'تصريح رسمي'},
  {id:'transit',n:'تأشيرة عبور',i:'🔁',p:200,on:true,
   types:['عبور'],
   nationalities:['جميع الجنسيات'],
   duration:'1-3 أيام عمل',desc:'ترانزيت'},
];

// ===== SUPABASE DB FUNCTIONS =====
var SB_HEADERS={'Content-Type':'application/json','apikey':SK,'Authorization':'Bearer '+SK};

async function sbGet(table){
  try{
    var r=await fetch(SB+'/rest/v1/'+table+'?select=*&order=created_at.desc',{headers:SB_HEADERS});
    if(r.ok)return await r.json();
  }catch(e){}
  return null;
}

async function sbInsert(table,data){
  try{
    var r=await fetch(SB+'/rest/v1/'+table,{method:'POST',headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),body:JSON.stringify(data)});
    if(r.ok)return await r.json();
  }catch(e){}
  return null;
}

async function sbUpdate(table,id,data){
  try{
    var r=await fetch(SB+'/rest/v1/'+table+'?id=eq.'+id,{method:'PATCH',headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),body:JSON.stringify(data)});
    if(r.ok)return await r.json();
  }catch(e){}
  return null;
}

async function sbDelete(table,id){
  try{
    var r=await fetch(SB+'/rest/v1/'+table+'?id=eq.'+id,{method:'DELETE',headers:SB_HEADERS});
    return r.ok;
  }catch(e){}
  return false;
}

async function sbUpsert(table,data){
  try{
    var r=await fetch(SB+'/rest/v1/'+table,{method:'POST',headers:Object.assign({},SB_HEADERS,{'Prefer':'resolution=merge-duplicates,return=representation'}),body:JSON.stringify(data)});
    if(r.ok)return await r.json();
  }catch(e){}
  return null;
}

// LOAD ALL DATA FROM SUPABASE
async function loadData(){
  // أولاً — حمّل من localStorage فوراً (سريع)
  lsLoad();

  try{
    // ثانياً — حدّث من Supabase في الخلفية
    // Load visas - مع الحقول الكاملة
    var vRes=await sbGet('visa_types');
    if(vRes&&vRes.length){
      // دمج البيانات: خذ من Supabase السعر والنشاط، واحتفظ بالحقول المحلية
      var localVisas=visas.slice();
      visas=vRes.map(function(v){
        // ابحث عن النسخة المحلية للحفاظ على الحقول الإضافية
        var local=localVisas.find(function(lv){return lv.id===v.id;});
        return {
          id:v.id,
          n:v.name||( local&&local.n)||v.id,
          i:v.icon||( local&&local.i)||'✈️',
          p:v.price||(local&&local.p)||0,
          on:v.active!==undefined?v.active:(local&&local.on!==undefined?local.on:true),
          desc:v.description||(local&&local.desc)||'',
          duration:(local&&local.duration)||v.duration||'',
          types:(local&&local.types)||[],
          nationalities:(local&&local.nationalities)||['جميع الجنسيات']
        };
      });
      // أضف أي تأشيرات محلية غير موجودة في Supabase
      localVisas.forEach(function(lv){
        if(!visas.find(function(v){return v.id===lv.id;})){
          visas.push(lv);
        }
      });
    }
    // Load requests
    var rRes=await sbGet('visa_requests');
    if(rRes&&rRes.length){
      var localReqs=reqs.slice();
      reqs=rRes.map(function(r){
        var local=localReqs.find(function(lr){return lr.id===r.id;});
        return {
          id:r.id,name:r.client_name,phone:r.client_phone,
          passport:r.passport_number,type:r.visa_type,
          amt:r.amount,paid:r.paid,status:r.status,
          date:r.created_at?r.created_at.slice(0,10):'',
          notes:r.notes||'',
          nationality:(local&&local.nationality)||'',
          dob:(local&&local.dob)||'',
          docs:(local&&local.docs)||[],
          docUrls:(local&&local.docUrls)||{},
          approvedDate:(local&&local.approvedDate)||''
        };
      });
    }
    // Load staff
    var uRes=await sbGet('staff_users');
    if(uRes&&uRes.length){
      users=uRes.map(function(u){return {id:u.id,name:u.name,phone:u.phone,role:u.role,on:u.active,notes:u.notes||''};});
    }
    // Load wallet clients
    var wRes=await sbGet('wallet_clients');
    if(wRes&&wRes.length){
      wcs=wRes.map(function(c){return {id:c.id,name:c.name,phone:c.phone,agency:c.agency||'',bal:c.balance||0};});
    }
    // Load providers
    var pRes=await sbGet('providers');
    if(pRes&&pRes.length){
      providers=pRes.map(function(p){return {id:p.id,name:p.name,contact:p.contact||'',phone:p.phone,spec:p.spec||'all',notes:p.notes||''};});
    }
    // Load accounting data
    var tRes=await sbGet('acc_transactions');
    if(tRes&&tRes.length)txs=tRes;
    var ivRes=await sbGet('acc_invoices');
    if(ivRes&&ivRes.length)accInvoices=ivRes;
    var acRes=await sbGet('acc_accounts');
    if(acRes&&acRes.length)accAccounts=acRes;
    // حفظ في localStorage كنسخة احتياطية
    lsSave();
  } catch(e){
    // استخدم localStorage إذا فشل الاتصال
    console.log('Supabase offline, using localStorage');
  }
}

// localStorage fallback
function lsSave(){
  try{
    localStorage.setItem('alyami_reqs',JSON.stringify(reqs));
    localStorage.setItem('alyami_users',JSON.stringify(users));
    localStorage.setItem('alyami_wcs',JSON.stringify(wcs));
    localStorage.setItem('alyami_visas',JSON.stringify(visas)); // يحفظ كل الحقول
    localStorage.setItem('alyami_providers',JSON.stringify(providers));
    localStorage.setItem('alyami_txs',JSON.stringify(txs));
    localStorage.setItem('alyami_invoices',JSON.stringify(accInvoices));
    localStorage.setItem('alyami_accounts',JSON.stringify(accAccounts));
    localStorage.setItem('alyami_visas_ts',Date.now()); // timestamp
  }catch(e){}
}

function lsLoad(){
  try{
    var r=localStorage.getItem('alyami_reqs');if(r&&r!=='[]')reqs=JSON.parse(r);
    var u=localStorage.getItem('alyami_users');if(u&&u!=='[]')users=JSON.parse(u);
    var w=localStorage.getItem('alyami_wcs');if(w)wcs=JSON.parse(w);
    var v=localStorage.getItem('alyami_visas');
    if(v&&v!=='[]'){
      visas=JSON.parse(v);
    } else {
      visas=defaultVisas.slice();
    }
    var p=localStorage.getItem('alyami_providers');if(p)providers=JSON.parse(p);
    var tx=localStorage.getItem('alyami_txs');if(tx)txs=JSON.parse(tx);
    var iv=localStorage.getItem('alyami_invoices');if(iv)accInvoices=JSON.parse(iv);
    var ac=localStorage.getItem('alyami_accounts');if(ac)accAccounts=JSON.parse(ac);
  }catch(e){
    visas=defaultVisas.slice();
  }
}

// SAVE FUNCTIONS - Supabase + localStorage
async function saveReqs(){lsSave();}
async function saveUsers(){lsSave();}
async function saveWCs(){lsSave();}
async function saveVisas(){lsSave();}
async function saveProviders(){lsSave();}

// SUPABASE SPECIFIC SAVES
async function sbSaveReq(req){
  await sbUpsert('visa_requests',{id:req.id,client_name:req.name,client_phone:req.phone,passport_number:req.passport,visa_type:req.type,amount:req.amt,paid:req.paid,status:req.status,notes:req.notes||''});
  lsSave();
}
async function sbUpdateReqStatus(id,status){
  await sbUpdate('visa_requests',id,{status:status});
  lsSave();
}
async function sbSaveUser(user){
  await sbUpsert('staff_users',{id:user.id,name:user.name,phone:user.phone,role:user.role,active:user.on,notes:user.pass||''});
  lsSave();
}
async function sbSaveWC(wc){
  await sbUpsert('wallet_clients',{id:wc.id,name:wc.name,phone:wc.phone,agency:wc.agency||'',balance:wc.bal});
  lsSave();
}
async function sbSaveVisa(v){
  await sbUpsert('visa_types',{
    id:v.id,name:v.n,icon:v.i,price:v.p,active:v.on,
    description:(v.desc||'')+(v.duration?' | مدة: '+v.duration:'')
      +(v.types&&v.types.length?' | أنواع: '+v.types.join('،'):'')
      +(v.nationalities&&v.nationalities[0]!=='جميع الجنسيات'?' | جنسيات: '+v.nationalities.join('،'):'')
  });
  lsSave(); // حفظ محلي فوري يشمل كل الحقول
}
async function sbDeleteVisa(id){
  await sbDelete('visa_types',id);
  lsSave();
}
async function sbSaveProvider(p){
  await sbUpsert('providers',{id:p.id,name:p.name,contact:p.contact,phone:p.phone,spec:p.spec,notes:p.notes,active:true});
  lsSave();
}
async function sbDeleteProvider(id){
  await sbDelete('providers',id);
  lsSave();
}

var reqs=[],users=[{id:1,name:'أحمد اليامي',phone:'admin',role:'admin',on:true}],wcs=[],visas=defaultVisas.slice();
var customCols=[];
var nats=['أفغانية','ألبانية','جزائرية','أردنية','إماراتية','بحرينية','تونسية','تركية','جزائرية','جنوب أفريقية','سعودية','سودانية','سورية','صومالية','عراقية','عمانية','فلسطينية','قطرية','كويتية','لبنانية','ليبية','مصرية','مغربية','موريتانية','يمنية','إيرانية','باكستانية','بنغلاديشية','هندية','إندونيسية','ماليزية','نيجيرية','كينية','غانية','إثيوبية','أمريكية','بريطانية','فرنسية','ألمانية','إيطالية','إسبانية','هولندية','بلجيكية','سويسرية','سويدية','نرويجية','دنماركية','كندية','أسترالية','روسية','صينية','يابانية','كورية جنوبية','تركمانستانية','أوكرانية','برازيلية','أرجنتينية','أخرى'];
var ccs=[
  {f:'🇱🇾',n:'ليبيا',c:'+218'},{f:'🇸🇦',n:'السعودية',c:'+966'},{f:'🇪🇬',n:'مصر',c:'+20'},
  {f:'🇦🇪',n:'الإمارات',c:'+971'},{f:'🇶🇦',n:'قطر',c:'+974'},{f:'🇰🇼',n:'الكويت',c:'+965'},
  {f:'🇧🇭',n:'البحرين',c:'+973'},{f:'🇴🇲',n:'عُمان',c:'+968'},{f:'🇯🇴',n:'الأردن',c:'+962'},
  {f:'🇱🇧',n:'لبنان',c:'+961'},{f:'🇸🇾',n:'سوريا',c:'+963'},{f:'🇮🇶',n:'العراق',c:'+964'},
  {f:'🇾🇪',n:'اليمن',c:'+967'},{f:'🇸🇩',n:'السودان',c:'+249'},{f:'🇹🇳',n:'تونس',c:'+216'},
  {f:'🇩🇿',n:'الجزائر',c:'+213'},{f:'🇲🇦',n:'المغرب',c:'+212'},{f:'🇸🇴',n:'الصومال',c:'+252'},
  {f:'🇵🇸',n:'فلسطين',c:'+970'},{f:'🇹🇷',n:'تركيا',c:'+90'},{f:'🇮🇷',n:'إيران',c:'+98'},
  {f:'🇵🇰',n:'باكستان',c:'+92'},{f:'🇧🇩',n:'بنغلاديش',c:'+880'},{f:'🇮🇳',n:'الهند',c:'+91'},
  {f:'🇮🇩',n:'إندونيسيا',c:'+62'},{f:'🇲🇾',n:'ماليزيا',c:'+60'},{f:'🇬🇧',n:'بريطانيا',c:'+44'},
  {f:'🇺🇸',n:'أمريكا',c:'+1'},{f:'🇩🇪',n:'ألمانيا',c:'+49'},{f:'🇫🇷',n:'فرنسا',c:'+33'},
  {f:'🇮🇹',n:'إيطاليا',c:'+39'},{f:'🇷🇺',n:'روسيا',c:'+7'},{f:'🇨🇳',n:'الصين',c:'+86'},
  {f:'🇯🇵',n:'اليابان',c:'+81'},{f:'🇳🇬',n:'نيجيريا',c:'+234'},{f:'🇰🇪',n:'كينيا',c:'+254'},
  {f:'🇿🇦',n:'جنوب أفريقيا',c:'+27'},{f:'🇦🇺',n:'أستراليا',c:'+61'},{f:'🇨🇦',n:'كندا',c:'+1'},
];
var SL={pending:'قيد المراجعة',review:'مراجعة',approved:'موافق عليه',rejected:'مرفوض',cancelled:'ملغى'};
var VB={hajj:'bp',umra:'ba2',egypt:'bp',tourist:'br2',work:'br2',transit:'br2'};

// INIT
document.addEventListener('DOMContentLoaded',function(){
  initCCs();
});

// CC DROPDOWNS
function initCCs(){
  ['s','sr','c','cr','nu','wc','pv','eu'].forEach(function(id){
    var el=document.getElementById('cc-'+id+'-list');
    if(!el)return;
    ccs.forEach(function(c){
      var d=document.createElement('div');
      d.className='cc-item';
      d.dataset.name=c.n;
      d.dataset.code=c.c;
      d.textContent='';
    var flag=document.createTextNode(c.f+' ');
    var span1=document.createElement('span');span1.style.flex='1';span1.textContent=c.n;
    var span2=document.createElement('span');span2.style.cssText='color:var(--text3);font-family:monospace;font-size:11px';span2.textContent=c.c;
    d.appendChild(flag);d.appendChild(span1);d.appendChild(span2);
      d.addEventListener('click',function(){selectCC(id,c.c,c.f+' '+c.c);});
      el.appendChild(d);
    });
  });
}

function openCC(id){
  document.querySelectorAll('.cc-drop').forEach(function(d){d.classList.add('hidden');});
  var drop=document.getElementById('cc-'+id);
  if(drop)drop.classList.toggle('hidden');
}

function filterCC2(id){
  var q=(document.getElementById('cc-'+id+'-q').value||'').toLowerCase();
  var items=document.querySelectorAll('#cc-'+id+'-list .cc-item');
  items.forEach(function(item){
    var match=item.dataset.name.includes(q)||item.dataset.code.includes(q);
    item.style.display=match?'flex':'none';
  });
}

function selectCC(id,code,label){
  var btn=document.getElementById('cc-'+id+'-btn');
  var hid=document.getElementById(id+'-code')||document.getElementById('cc-'+id+'-hidden');
  // map special cases
  var hidMap={s:'s-code',sr:'sr-code',c:'c-code',cr:'cr-code',nu:'nu-code',wc:'wc-code',pv:'pv-code'};
  var hidEl=document.getElementById(hidMap[id]);
  if(btn)btn.textContent=label;
  if(hidEl)hidEl.value=code;
  var drop=document.getElementById('cc-'+id);
  if(drop)drop.classList.add('hidden');
}

document.addEventListener('click',function(e){
  if(!e.target.closest('.ph-wrap'))document.querySelectorAll('.cc-drop').forEach(function(d){d.classList.add('hidden');});
});

// AUTH
function switchTab(t){
  ['admin','staff','client'].forEach(function(x){
    document.getElementById('tab-'+x).classList.toggle('on',x===t);
    document.getElementById('p-'+x).classList.toggle('hidden',x!==t);
  });
}

function showErr(id,msg){var e=document.getElementById(id);if(e){e.textContent=msg;e.style.display='block';}}
function hideErr(id){var e=document.getElementById(id);if(e)e.style.display='none';}
function setBtn(id,txt,dis){var b=document.getElementById(id);if(b){b.textContent=txt;b.disabled=dis;}}

async function doFetch(url,body){
  var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','apikey':SK,'Authorization':'Bearer '+SK},body:JSON.stringify(body)});
  return {r:r,d:await r.json()};
}

async function loginAdmin(){
  var email=document.getElementById('a-email').value.trim();
  var pass=document.getElementById('a-pass').value;
  hideErr('e-admin');
  if(!email||!pass){showErr('e-admin','أدخل البيانات');return;}
  setBtn('btn-a','جاري الدخول...',true);
  try{
    var res=await doFetch(SB+'/auth/v1/token?grant_type=password',{email:email,password:pass});
    if(!res.r.ok){showErr('e-admin',res.d.error_description||'بيانات غير صحيحة');setBtn('btn-a','دخول كمدير',false);return;}
    tok=res.d.access_token;cu={email:email,name:'أحمد اليامي',phone:''};cr='admin';
    setBtn('btn-a','دخول كمدير',false);startApp();
  }catch(e){showErr('e-admin','خطأ: '+e.message);setBtn('btn-a','دخول كمدير',false);}
}

async function loginStaff(){
  var phone=document.getElementById('s-phone').value.trim();
  var code=document.getElementById('s-code').value||'+218';
  var pass=document.getElementById('s-pass').value;
  hideErr('e-staff');
  if(!phone||!pass){showErr('e-staff','أدخل رقم الهاتف وكلمة المرور');return;}
  var fp=code+phone;
  setBtn('btn-s','جاري الدخول...',true);
  try{
    // Refresh users list from Supabase before checking
    try{var uRes=await sbGet('staff_users');if(uRes&&uRes.length){users=uRes.map(function(u){return {id:u.id,name:u.name,phone:u.phone,role:u.role,on:u.active!==false,pass:u.notes||''};});lsSave();}}catch(e){}
    var foundU=users.find(function(u){return u.phone===fp;});
    if(!foundU){showErr('e-staff','الرقم غير مسجل. تواصل مع المدير لإضافتك');setBtn('btn-s','دخول كموظف',false);return;}
    if(foundU.on===false){showErr('e-staff','الحساب معطّل');setBtn('btn-s','دخول كموظف',false);return;}
    if(foundU.pass&&foundU.pass!==pass){showErr('e-staff','كلمة المرور غير صحيحة');setBtn('btn-s','دخول كموظف',false);return;}
    if(!foundU.pass&&pass!=='Staff@1234'){showErr('e-staff','استخدم كلمة المرور: Staff@1234');setBtn('btn-s','دخول كموظف',false);return;}
    tok='local-'+Date.now();
    var detRole=foundU.role==='assistant'?'assistant':foundU.role==='admin'?'admin':'staff';
    cu={phone:fp,name:foundU.name,email:''};cr=detRole;
    setBtn('btn-s','دخول كموظف',false);startApp();
  }catch(e){showErr('e-staff','خطأ: '+e.message);setBtn('btn-s','دخول كموظف',false);}
}

async function regStaff(){
  var name=document.getElementById('sr-name').value.trim();
  var phone=document.getElementById('sr-phone').value.trim();
  var code=document.getElementById('sr-code').value||'+218';
  var pass=document.getElementById('sr-pass').value;
  hideErr('e-staff');
  if(!name||!phone||!pass){showErr('e-staff','أكمل الحقول');return;}
  if(pass.length<8){showErr('e-staff','كلمة المرور 8 أحرف+');return;}
  var fp=code+phone;
  setBtn('btn-sr','جاري الإنشاء...',true);
  try{
    // Refresh from Supabase
    try{var uRes=await sbGet('staff_users');if(uRes&&uRes.length){users=uRes.map(function(u){return {id:u.id,name:u.name,phone:u.phone,role:u.role,on:u.active!==false,pass:u.notes||''};});}}catch(e){}
    var existing=users.find(function(u){return u.phone===fp;});
    if(existing){
      // Already added by admin — set password and login
      existing.pass=pass;existing.name=name;
      try{await sbSaveUser(existing);}catch(e){}
      tok='local-'+Date.now();
      var detRole=existing.role==='assistant'?'assistant':'staff';
      cu={phone:fp,name:name,email:''};cr=detRole;
    } else {
      // Brand new self-registration
      var newUser={id:Date.now(),name:name,phone:fp,role:'staff',on:true,pass:pass};
      users.push(newUser);
      try{await sbSaveUser(newUser);}catch(e){}
      tok='local-'+Date.now();
      cu={phone:fp,name:name,email:''};cr='staff';
    }
    addNotif('staff','👤 تسجيل موظف جديد — '+name,'سجّل موظف جديد برقم '+fp,'👤');
    lsSave();
    setBtn('btn-sr','إنشاء حساب موظف',false);startApp();
  }catch(e){showErr('e-staff','خطأ: '+e.message);setBtn('btn-sr','إنشاء حساب موظف',false);}
}

async function loginClient(){
  var phone=document.getElementById('c-phone').value.trim();
  var code=document.getElementById('c-code').value||'+218';
  var pass=document.getElementById('c-pass').value;
  hideErr('e-client');
  if(!phone||!pass){showErr('e-client','أدخل رقم الهاتف وكلمة المرور');return;}
  var fp=code+phone;
  var email='c'+fp.replace(/\+/g,'').replace(/\s/g,'')+'@alyami.app';
  setBtn('btn-c','جاري الدخول...',true);
  try{
    var res=await doFetch(SB+'/auth/v1/token?grant_type=password',{email:email,password:pass});
    if(!res.r.ok){showErr('e-client',res.d.error_description||'بيانات غير صحيحة');setBtn('btn-c','دخول كعميل',false);return;}
    tok=res.d.access_token;cu={phone:fp,name:res.d.user&&res.d.user.user_metadata&&res.d.user.user_metadata.full_name?res.d.user.user_metadata.full_name:'عميل',email:email};cr='client';
    setBtn('btn-c','دخول كعميل',false);startApp();
  }catch(e){showErr('e-client','خطأ: '+e.message);setBtn('btn-c','دخول كعميل',false);}
}

async function regClient(){
  var name=document.getElementById('cr-name').value.trim();
  var phone=document.getElementById('cr-phone').value.trim();
  var code=document.getElementById('cr-code').value||'+218';
  var pass=document.getElementById('cr-pass').value;
  hideErr('e-client');
  if(!name||!phone||!pass){showErr('e-client','أكمل الحقول');return;}
  if(pass.length<8){showErr('e-client','كلمة المرور 8 أحرف+');return;}
  var fp=code+phone;
  var email='c'+fp.replace(/\+/g,'').replace(/\s/g,'')+'@alyami.app';
  setBtn('btn-cr','جاري الإنشاء...',true);
  try{
    var res=await doFetch(SB+'/auth/v1/signup',{email:email,password:pass,data:{full_name:name,phone:fp}});
    if(!res.r.ok){showErr('e-client',res.d.error_description||'خطأ');setBtn('btn-cr','إنشاء حساب عميل',false);return;}
    if(!res.d.access_token){
      var lr=await doFetch(SB+'/auth/v1/token?grant_type=password',{email:email,password:pass});
      if(!lr.r.ok||!lr.d.access_token){showErr('e-client','تم إنشاء الحساب. سجّل دخولك الآن');setBtn('btn-cr','إنشاء حساب عميل',false);return;}
      tok=lr.d.access_token;
    }else{tok=res.d.access_token;}
    cu={phone:fp,name:name,email:email};cr='client';
    setBtn('btn-cr','إنشاء حساب عميل',false);startApp();
  }catch(e){showErr('e-client','خطأ: '+e.message);setBtn('btn-cr','إنشاء حساب عميل',false);}
}

function showSReg(){document.getElementById('s-reg').classList.toggle('hidden');}
function showCReg(){document.getElementById('c-login').classList.add('hidden');document.getElementById('c-reg').classList.remove('hidden');}
function showCLogin(){document.getElementById('c-reg').classList.add('hidden');document.getElementById('c-login').classList.remove('hidden');}

function logout(){tok=null;cu=null;stopRealtime();document.getElementById('auth').style.display='flex';document.getElementById('app').style.display='none';}

// APP
function startApp(){
  document.getElementById('auth').style.display='none';
  document.getElementById('app').style.display='block';
  var n=cr==='client'?cu.phone:cu.email?cu.email.split('@')[0]:cu.name;
  document.getElementById('uname').textContent=n;
  document.getElementById('uav').textContent=n.charAt(0).toUpperCase();
  applyFontSize();
  // Apply saved exchange rate
  var ri=document.getElementById('rate-input');if(ri)ri.value=usdToLyd;
  var ei=document.getElementById('egp-rate-input');if(ei)ei.value=usdToEgp;
  updateCurrencyBtn();
  var curLabel=document.getElementById('topup-cur-label');if(curLabel)curLabel.textContent=getCurrencySymbol();
  // Show loading
  document.getElementById('tb-title').textContent='جاري التحميل...';
  loadData().then(function(){
    setupNav();loadSavedLogo();
  }).catch(function(){
    lsLoad();
    setupNav();loadSavedLogo();
  });
}

var NAV_ICONS={
  dash:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  layers:'<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  car:'<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  brief:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  wallet:'<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  crm:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
  plane:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  cog:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>',
  home:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  list:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  calc:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
};
function nvI(n){return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(NAV_ICONS[n]||'')+'</svg>';}
function navHtml(sections){
  return sections.map(function(s){
    return '<div class="ns">'+s.t+'</div>'+s.i.map(function(it){
      if(it.pg)return '<div class="ni'+(it.on?' on':'')+'" data-pg="'+it.pg+'" onclick="goP(\''+it.pg+'\',this)">'+nvI(it.ic)+it.lb+'</div>';
      return '<div class="ni" onclick="'+it.go+'">'+nvI(it.ic)+it.lb+'</div>';
    }).join('');
  }).join('');
}
function buildBnav(items){
  var bn=document.getElementById('bnav');
  if(!bn)return;
  if(!items||!items.length){bn.classList.remove('show');bn.innerHTML='';return;}
  bn.innerHTML=items.map(function(it,ix){
    return '<button class="bni'+(ix===0?' on':'')+'" data-pg="'+it.pg+'" onclick="goP(\''+it.pg+'\',this)">'+nvI(it.ic)+'<span>'+it.sb+'</span></button>';
  }).join('');
  bn.classList.add('show');
}
function setupNav(){
  var nav=document.getElementById('snav');
  var rb=document.getElementById('role-badge');
  if(cr==='admin'){
    rb.className='sb-badge ba';rb.textContent='مدير';
    document.getElementById('btn-new').style.display='inline-flex';
    document.getElementById('bal-pill').classList.add('hidden');
    nav.innerHTML=navHtml([
      {t:'الرئيسية',i:[{pg:'dash',ic:'dash',lb:'لوحة التحكم',on:1}]},
      {t:'التأشيرات',i:[{pg:'visas',ic:'layers',lb:'إدارة التأشيرات'},{pg:'prices',ic:'tag',lb:'قائمة الأسعار'}]},
      {t:'المحاسبة',i:[{pg:'acc',ic:'calc',lb:'المحاسبة والصندوق'}]},
      {t:'العمليات',i:[{pg:'transport',ic:'car',lb:'حجوزات النقل'},{pg:'providers',ic:'brief',lb:'المزودون'},{pg:'wallets',ic:'wallet',lb:'الأرصدة والعملاء'}]},
      {t:'الفريق',i:[{pg:'users',ic:'users',lb:'الموظفون'}]},
      {t:'أنظمة أخرى',i:[{go:"location.href='crm.html'",ic:'crm',lb:'نظام CRM'},{go:"window.open('ok-to-board.html','_blank')",ic:'plane',lb:'OK to Board / تأشيرة مصر'}]},
      {t:'النظام',i:[{pg:'settings',ic:'cog',lb:'الإعدادات'}]}
    ]);
    buildBnav([{pg:'dash',ic:'dash',sb:'الرئيسية'},{pg:'acc',ic:'calc',sb:'المحاسبة'},{pg:'wallets',ic:'wallet',sb:'الأرصدة'},{pg:'settings',ic:'cog',sb:'الإعدادات'}]);
    goP('dash');renderReqs();renderUsers();renderVisas();renderAdvancedStats();startRealtime();
  }else if(cr==='assistant'){
    rb.className='sb-badge';rb.style.cssText='background:rgba(90,80,190,0.25);color:#c0b0ff;font-size:10px;padding:2px 9px;border-radius:20px;margin-top:3px;display:inline-block;font-weight:700';rb.textContent='مساعد مدير';
    document.getElementById('btn-new').style.display='inline-flex';
    document.getElementById('bal-pill').classList.add('hidden');
    nav.innerHTML=navHtml([
      {t:'الرئيسية',i:[{pg:'dash',ic:'dash',lb:'لوحة التحكم',on:1}]},
      {t:'التأشيرات',i:[{pg:'visas',ic:'layers',lb:'تعديل الأسعار'}]},
      {t:'المحاسبة',i:[{pg:'acc',ic:'calc',lb:'المحاسبة والصندوق'}]},
      {t:'المدفوعات',i:[{pg:'wallets',ic:'wallet',lb:'شحن الأرصدة'}]},
      {t:'أنظمة أخرى',i:[{go:"window.open('ok-to-board.html','_blank')",ic:'plane',lb:'OK to Board'}]}
    ]);
    buildBnav([{pg:'dash',ic:'dash',sb:'الرئيسية'},{pg:'visas',ic:'layers',sb:'الأسعار'},{pg:'wallets',ic:'wallet',sb:'الأرصدة'}]);
    goP('dash');renderReqs();renderVisas();
  }else if(cr==='staff'){
    rb.className='sb-badge bs2';rb.textContent='موظف';
    document.getElementById('btn-new').style.display='inline-flex';
    document.getElementById('bal-pill').classList.add('hidden');
    nav.innerHTML=navHtml([
      {t:'عملي',i:[{pg:'staff',ic:'list',lb:'طلباتي',on:1},{pg:'dash',ic:'dash',lb:'كل الطلبات'}]},
      {t:'أنظمة أخرى',i:[{go:"window.open('ok-to-board.html','_blank')",ic:'plane',lb:'OK to Board'}]}
    ]);
    buildBnav([{pg:'staff',ic:'list',sb:'طلباتي'},{pg:'dash',ic:'dash',sb:'كل الطلبات'}]);
    goP('staff');renderStaff();renderReqs();
  }else{
    rb.className='sb-badge bc';rb.textContent='عميل';
    document.getElementById('btn-new').style.display='none';
    document.getElementById('bal-pill').classList.remove('hidden');
    document.getElementById('ph-name').textContent='مرحباً '+cu.name+' 👋';
    var myWC=wcs.find(function(c){return c.phone===cu.phone;});
    if(myWC)wb=myWC.bal||0;
    document.getElementById('w-bal').textContent=formatMoney(wb);
    document.getElementById('bal-n').textContent=formatMoney(wb);
    nav.innerHTML=navHtml([
      {t:'بوابتي',i:[{pg:'portal',ic:'home',lb:'الرئيسية',on:1},{pg:'c-requests',ic:'list',lb:'طلباتي'},{pg:'c-transport',ic:'car',lb:'نقل واستقبال'}]},
      {t:'المحفظة',i:[{pg:'wallet',ic:'wallet',lb:'محفظتي'}]}
    ]);
    buildBnav([{pg:'portal',ic:'home',sb:'الرئيسية'},{pg:'c-requests',ic:'list',sb:'طلباتي'},{pg:'c-transport',ic:'car',sb:'النقل'},{pg:'wallet',ic:'wallet',sb:'محفظتي'}]);
    goP('portal');renderClientReqs();renderClientTransport();
  }
}

function goP(id,el){
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
  var pg=document.getElementById('pg-'+id);
  if(pg)pg.classList.add('on');
  document.querySelectorAll('.ni,.bni').forEach(function(n){n.classList.remove('on');});
  document.querySelectorAll('.ni[data-pg="'+id+'"],.bni[data-pg="'+id+'"]').forEach(function(n){n.classList.add('on');});
  if(el&&!el.hasAttribute('data-pg'))el.classList.add('on');
  var titles={dash:'لوحة التحكم — الطلبات',staff:'طلباتي',users:'الموظفون',visas:'إدارة التأشيرات',prices:'قائمة الأسعار',transport:'حجوزات النقل',providers:'المزودون',wallets:'الأرصدة والعملاء',portal:'الرئيسية',wallet:'محفظتي','c-requests':'طلباتي','c-transport':'نقل واستقبال',settings:'الإعدادات',acc:'المحاسبة والصندوق'};
  document.getElementById('tb-title').textContent=titles[id]||'';
  if(id==='providers'){renderProviders();renderProviderReqs();updateProviderSelect();}
  if(id==='wallets'){renderWCs();renderAdminTopupRequests();}
  if(id==='wallet'){renderTopupRequests();}
  if(id==='prices'){renderPrices();initPriceModal();}
  if(id==='transport'){renderTransport();}
  if(id==='portal'){renderClientDashboard();renderClientReqs();}
  if(id==='c-requests'){renderClientReqsFull();}
  if(id==='c-transport'){renderClientTransport();}
  if(id==='settings'){renderSettings();}
  if(id==='acc'){renderAcc();}
}

// ===== FLIGHTS MODULE (CAI ⇄ BEN) =====
var flightTab='round';
var flightRoute={from:{code:'CAI',city:'القاهرة',ar:'القاهرة (CAI)'},to:{code:'BEN',city:'بنغازي',ar:'بنينا - بنغازي (BEN)'}};

var flightCatalog=[
  {airline:'الخطوط الليبية',code:'LN',logo:'🇱🇾',no:'LN112',depT:'08:30',arrT:'10:05',dur:'1س 35د',stops:0,base:185,cls:'اقتصادية',aircraft:'Airbus A320',days:[1,3,5,7]},
  {airline:'الخطوط الليبية',code:'LN',logo:'🇱🇾',no:'LN116',depT:'15:20',arrT:'16:55',dur:'1س 35د',stops:0,base:175,cls:'اقتصادية',aircraft:'Airbus A320',days:[2,4,6]},
  {airline:'برنيق للطيران',code:'DNA',logo:'🛫',no:'DNA204',depT:'09:45',arrT:'11:25',dur:'1س 40د',stops:0,base:195,cls:'اقتصادية',aircraft:'Airbus A319',days:[1,2,4,6,7]},
  {airline:'برنيق للطيران',code:'DNA',logo:'🛫',no:'DNA208',depT:'18:10',arrT:'19:45',dur:'1س 35د',stops:0,base:210,cls:'اقتصادية',aircraft:'Airbus A319',days:[3,5,7]},
  {airline:'الأجنحة الليبية',code:'YL',logo:'✈️',no:'YL301',depT:'11:00',arrT:'12:40',dur:'1س 40د',stops:0,base:205,cls:'اقتصادية',aircraft:'ATR 72',days:[1,2,3,4,5,6,7]},
  {airline:'الأجنحة الليبية',code:'YL',logo:'✈️',no:'YL305',depT:'20:30',arrT:'22:10',dur:'1س 40د',stops:0,base:220,cls:'اقتصادية',aircraft:'ATR 72',days:[1,3,5]},
  {airline:'الأفريقية',code:'8U',logo:'🌍',no:'8U452',depT:'13:15',arrT:'14:55',dur:'1س 40د',stops:0,base:190,cls:'اقتصادية',aircraft:'Airbus A320',days:[2,4,6,7]},
  {airline:'مصر للطيران',code:'MS',logo:'🇪🇬',no:'MS870',depT:'07:00',arrT:'08:40',dur:'1س 40د',stops:0,base:240,cls:'اقتصادية',aircraft:'Boeing 737',days:[1,3,5,7]},
  {airline:'إير كايرو',code:'SM',logo:'✈️',no:'SM540',depT:'16:45',arrT:'18:25',dur:'1س 40د',stops:0,base:165,cls:'اقتصادية',aircraft:'Airbus A320',days:[2,4,6]}
];

function initFlightsPage(){
  var dep=document.getElementById('fl-dep');
  var ret=document.getElementById('fl-ret');
  if(dep&&!dep.value){
    var t=new Date();t.setDate(t.getDate()+3);
    dep.value=t.toISOString().slice(0,10);
  }
  if(ret&&!ret.value){
    var r=new Date();r.setDate(r.getDate()+10);
    ret.value=r.toISOString().slice(0,10);
  }
  switchFlightTab(flightTab);
}

function switchFlightTab(tab){
  flightTab=tab;
  ['round','oneway','return'].forEach(function(t){
    var b=document.getElementById('ft-'+t);
    if(b)b.classList.toggle('on',t===tab);
  });
  var depW=document.getElementById('fl-dep-wrap');
  var retW=document.getElementById('fl-ret-wrap');
  var depLabel=depW?depW.querySelector('label'):null;
  if(tab==='round'){
    depW.style.display='';retW.style.display='';
    if(depLabel)depLabel.textContent='تاريخ الذهاب';
    setRoute('CAI','BEN');
  }else if(tab==='oneway'){
    depW.style.display='';retW.style.display='none';
    if(depLabel)depLabel.textContent='تاريخ الذهاب';
    setRoute('CAI','BEN');
  }else{
    depW.style.display='';retW.style.display='none';
    if(depLabel)depLabel.textContent='تاريخ العودة';
    setRoute('BEN','CAI');
  }
  document.getElementById('fl-results').innerHTML='';
}

function setRoute(fromCode,toCode){
  var CAI={code:'CAI',city:'القاهرة',ar:'القاهرة (CAI)'};
  var BEN={code:'BEN',city:'بنغازي',ar:'بنينا - بنغازي (BEN)'};
  flightRoute.from=fromCode==='CAI'?CAI:BEN;
  flightRoute.to=toCode==='BEN'?BEN:CAI;
  var fi=document.getElementById('fl-from');
  var ti=document.getElementById('fl-to');
  if(fi)fi.value=flightRoute.from.ar;
  if(ti)ti.value=flightRoute.to.ar;
}

function swapFlightRoute(){
  var f=flightRoute.from,t=flightRoute.to;
  setRoute(t.code,f.code);
}

function formatFlightDate(d){
  try{
    var dt=new Date(d);
    var days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    var months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return days[dt.getDay()]+' '+dt.getDate()+' '+months[dt.getMonth()]+' '+dt.getFullYear();
  }catch(e){return d;}
}

function generateFlightsForDate(fromCode,toCode,date,pax,cls){
  if(!date)return [];
  var dt=new Date(date);
  var dow=dt.getDay();dow=dow===0?7:dow;
  var seed=dt.getTime()/86400000;
  return flightCatalog.filter(function(f){return f.days.indexOf(dow)!==-1;}).map(function(f,i){
    var dayVar=((seed+i*7)%9)-4;
    var clsMult=cls==='رجال أعمال'?2.3:1;
    var price=Math.round((f.base+dayVar*5)*clsMult);
    return {
      id:f.no+'-'+date,
      airline:f.airline,logo:f.logo,code:f.code,no:f.no,
      from:fromCode,to:toCode,
      depT:f.depT,arrT:f.arrT,dur:f.dur,stops:f.stops,
      price:price,ppp:price,total:price*parseInt(pax,10),
      aircraft:f.aircraft,cls:cls,date:date
    };
  }).sort(function(a,b){return a.depT.localeCompare(b.depT);});
}

function searchFlights(){
  var dep=document.getElementById('fl-dep').value;
  var ret=document.getElementById('fl-ret').value;
  var pax=document.getElementById('fl-pax').value;
  var cls=document.getElementById('fl-cls').value;
  var out=document.getElementById('fl-results');

  if(flightTab==='round'){
    if(!dep||!ret){out.innerHTML=errBox('يرجى تحديد تاريخ الذهاب والعودة');return;}
    if(new Date(ret)<new Date(dep)){out.innerHTML=errBox('تاريخ العودة يجب أن يكون بعد تاريخ الذهاب');return;}
    var outF=generateFlightsForDate('CAI','BEN',dep,pax,cls);
    var retF=generateFlightsForDate('BEN','CAI',ret,pax,cls);
    out.innerHTML=
      flightSectionHtml('🛫 رحلات الذهاب — '+formatFlightDate(dep),'القاهرة → بنينا بنغازي',outF,pax,'out')+
      flightSectionHtml('🛬 رحلات العودة — '+formatFlightDate(ret),'بنينا بنغازي → القاهرة',retF,pax,'ret');
  }else if(flightTab==='oneway'){
    if(!dep){out.innerHTML=errBox('يرجى تحديد تاريخ الذهاب');return;}
    var f1=generateFlightsForDate('CAI','BEN',dep,pax,cls);
    out.innerHTML=flightSectionHtml('🛫 رحلات الذهاب — '+formatFlightDate(dep),'القاهرة → بنينا بنغازي',f1,pax,'out');
  }else{
    if(!dep){out.innerHTML=errBox('يرجى تحديد تاريخ العودة');return;}
    var f2=generateFlightsForDate('BEN','CAI',dep,pax,cls);
    out.innerHTML=flightSectionHtml('🛬 رحلات العودة — '+formatFlightDate(dep),'بنينا بنغازي → القاهرة',f2,pax,'ret');
  }
}

function errBox(msg){
  return '<div class="card"><div class="cb" style="text-align:center;color:var(--red);padding:20px;font-weight:600">⚠️ '+msg+'</div></div>';
}

function flightSectionHtml(title,subtitle,flights,pax,kind){
  var h='<div class="card">'+
    '<div class="ch"><span class="ct">'+title+'</span><span style="font-size:11px;color:var(--text2)">'+subtitle+' • '+flights.length+' رحلة</span></div>'+
    '<div class="cb" style="padding:12px">';
  if(!flights.length){
    h+='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px">لا توجد رحلات في هذا التاريخ — جرّب تاريخاً آخر</div>';
  }else{
    flights.forEach(function(f){h+=flightCardHtml(f,pax,kind);});
  }
  h+='</div></div>';
  return h;
}

function flightCardHtml(f,pax,kind){
  var arrow=kind==='ret'?'←':'→';
  var color=kind==='ret'?'var(--blue)':'var(--gold-d)';
  return '<div style="border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:10px;display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;transition:all .2s" onmouseover="this.style.borderColor=\'var(--gold)\';this.style.background=\'#fffbf0\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'white\'">'+
    '<div style="text-align:center;min-width:70px"><div style="font-size:26px">'+f.logo+'</div><div style="font-size:10px;color:var(--text2);margin-top:2px">'+esc(f.airline)+'</div><div style="font-size:10px;color:'+color+';font-weight:700">'+esc(f.no)+'</div></div>'+
    '<div style="display:flex;align-items:center;gap:10px">'+
      '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:var(--navy);direction:ltr">'+f.depT+'</div><div style="font-size:11px;color:var(--text2);font-weight:600">'+f.from+'</div></div>'+
      '<div style="flex:1;text-align:center;min-width:110px"><div style="font-size:10px;color:var(--text3)">'+esc(f.dur)+'</div><div style="border-top:1px dashed var(--text3);margin:3px 0;position:relative"><span style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:white;padding:0 4px;font-size:10px;color:'+color+'">'+arrow+'</span></div><div style="font-size:10px;color:var(--green)">'+(f.stops===0?'مباشرة':f.stops+' توقف')+'</div></div>'+
      '<div style="text-align:center"><div style="font-size:18px;font-weight:700;color:var(--navy);direction:ltr">'+f.arrT+'</div><div style="font-size:11px;color:var(--text2);font-weight:600">'+f.to+'</div></div>'+
    '</div>'+
    '<div style="text-align:center;min-width:100px"><div style="font-size:10px;color:var(--text3)">'+esc(f.aircraft)+'</div><div style="font-size:10px;color:var(--text2)">'+esc(f.cls)+'</div><div style="font-size:10px;color:var(--text3)">'+pax+' مسافر</div></div>'+
    '<div style="text-align:center;min-width:120px"><div style="font-size:10px;color:var(--text3)">السعر للشخص</div><div style="font-size:18px;font-weight:700;color:'+color+'">$'+f.ppp+'</div>'+(parseInt(pax,10)>1?'<div style="font-size:10px;color:var(--text2)">الإجمالي: $'+f.total+'</div>':'')+'<button class="btn bg2 bsm" style="margin-top:5px;width:100%" onclick="bookFlight(\''+f.id+'\','+f.total+')">احجز</button></div>'+
    '</div>';
}

function bookFlight(id,total){
  alert('تم اختيار الرحلة: '+id+'\nالمبلغ الإجمالي: $'+total+'\n\nسيتم ربط الحجز بنظام الطلبات لاحقاً.');
}
// ===== END FLIGHTS MODULE =====

// RENDER
function renderReqs(){
  document.getElementById('st-tot').textContent=reqs.length;
  document.getElementById('st-pen').textContent=reqs.filter(function(r){return r.status==='pending';}).length;
  document.getElementById('st-apr').textContent=reqs.filter(function(r){return r.status==='approved';}).length;
  document.getElementById('st-usr').textContent=users.length;
  if(typeof renderAdvancedStats==='function')renderAdvancedStats();
  // Populate type filter
  var tf=document.getElementById('req-type-filter');
  if(tf&&tf.options.length<=1){
    visas.forEach(function(v){var o=document.createElement('option');o.value=v.id;o.textContent=v.i+' '+v.n;tf.appendChild(o);});
  }
  // Apply filters
  var filterType=tf?tf.value:'';
  var sf=document.getElementById('req-status-filter');
  var filterStatus=sf?sf.value:'';
  var filtered=reqs.filter(function(r){
    if(filterType&&r.type!==filterType)return false;
    if(filterStatus&&r.status!==filterStatus)return false;
    return true;
  });
  var tb=document.getElementById('req-tb');
  tb.innerHTML='';
  if(!filtered.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text3)">'+(reqs.length?'لا توجد نتائج للفلتر المحدد':'لا توجد طلبات')+'</td></tr>';return;}
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var rows='';
  filtered.forEach(function(r){
    var v=vmap[r.type]||{};
    var row=document.createElement('tr');
    row.innerHTML='<td style="font-family:monospace;font-weight:700;color:var(--gold-d);font-size:11px">'+r.id+'</td><td style="font-weight:600">'+r.name+'</td><td style="font-size:11px;color:var(--text2)">'+(r.phone||'-')+'</td><td><span class="badge br2">'+(v.i||'')+' '+(v.n||r.type)+'</span></td><td style="font-weight:600">'+formatMoney(r.amt||0)+'</td><td><span class="badge '+(r.paid?'bpd':'bup')+'">'+(r.paid?'مدفوع':'غير مدفوع')+'</span></td><td><span class="badge '+(r.status==='approved'?'ba2':r.status==='rejected'?'bx':'bp')+'">'+(SL[r.status]||r.status)+'</span></td><td></td>';
    var btnV=document.createElement('button');btnV.className='btn bg2 bsm';btnV.textContent='📂';btnV.title='عرض المستندات';btnV.addEventListener('click',function(){viewDocs(r);});
    var btnA=document.createElement('button');btnA.className='btn bo2 bsm';btnA.textContent='✓';btnA.addEventListener('click',function(){approveR(r.id);});
    var btnR=document.createElement('button');btnR.className='btn bd2 bsm';btnR.textContent='✗';btnR.addEventListener('click',function(){rejectR(r.id);});
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    td.appendChild(btnV);td.appendChild(btnA);td.appendChild(btnR);
    tb.appendChild(row);
  });
}

function filterReqs(){renderReqs();}

function viewDocs(r){
  var urls=r.docUrls||{};
  var docs=r.docs||[];
  var hasFiles=docs.length>0;

  var content='<div style="background:var(--navy);border-radius:9px;padding:12px 16px;color:#fff;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:monospace;font-size:16px;font-weight:700;color:var(--gold-l)">'+r.id+'</div><div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:2px">'+r.name+' | '+r.passport+'</div></div><span class="badge '+(r.status==='approved'?'ba2':r.status==='rejected'?'bx':'bp')+'">'+(SL[r.status]||r.status)+'</span></div>';

  if(!hasFiles){
    content+='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px">📂 لم يتم رفع مستندات بعد</div>';
  } else {
    content+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    var docMap=[
      {key:'passport',label:'📄 جواز السفر'},
      {key:'ticket',label:'🎫 التذكرة'},
      {key:'photo',label:'🖼️ الصورة الشخصية'},
      {key:'extra',label:'📋 مستند إضافي'}
    ];
    docMap.forEach(function(d){
      var url=urls[d.key];
      if(url){
        var isImg=url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        content+='<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden">';
        content+='<div style="background:var(--bg);padding:7px 10px;font-size:11px;font-weight:600;color:var(--navy)">'+d.label+'</div>';
        if(isImg){
          content+='<img src="'+url+'" style="width:100%;max-height:160px;object-fit:contain;display:block" onerror="this.style.display=\'none\'">';
        } else {
          content+='<div style="padding:12px;text-align:center"><div style="font-size:28px;margin-bottom:6px">📄</div><div style="font-size:11px;color:var(--text2)">ملف PDF</div></div>';
        }
        content+='<div style="padding:6px;text-align:center;border-top:1px solid var(--border)"><a href="'+url+'" target="_blank" style="font-size:11px;color:var(--blue);font-weight:600;text-decoration:none">⬇️ تحميل / فتح</a></div>';
        content+='</div>';
      }
    });
    content+='</div>';
  }

  // Create modal
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';
  ov.innerHTML='<div style="background:white;border-radius:13px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;margin:auto"><div style="padding:13px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:white;z-index:1"><span style="font-size:14px;font-weight:600;color:var(--navy)">مستندات الطلب</span><button onclick="this.closest(\'div[style*=fixed]\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text2)">×</button></div><div style="padding:18px">'+content+'</div><div style="padding:12px 18px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end"><button class="btn bs3" onclick="approveR(\''+r.id+'\');this.closest(\'div[style*=fixed]\').remove()">✓ موافقة</button><button class="btn bd2" onclick="rejectR(\''+r.id+'\');this.closest(\'div[style*=fixed]\').remove()">✗ رفض</button><button class="btn bo2" onclick="printVisa(reqs.find(function(x){return x.id===\''+r.id+'\';}))">🖨️ وثيقة التأشيرة</button><button class="btn bo2" onclick="this.closest(\'div[style*=fixed]\').remove()">إغلاق</button></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
}

function approveR(id){
  var r=reqs.find(function(x){return x.id===id;});
  if(r){
    r.status='approved';
    r.approvedDate=new Date().toLocaleDateString('ar-SA');
    sbUpdateReqStatus(id,'approved');
    addNotif('approve','✅ موافقة على طلب — '+r.name,'تمت الموافقة على طلب التأشيرة رقم '+id,'✅');
    renderReqs();renderStaff();
    if(confirm('تمت الموافقة على الطلب ✅\n\nهل تريد طباعة وثيقة التأشيرة الآن؟')){
      printVisa(r);
    }
  }
}

function rejectR(id){
  var r=reqs.find(function(x){return x.id===id;});
  if(r){
    r.status='rejected';
    sbUpdateReqStatus(id,'rejected');
    addNotif('reject','❌ رفض طلب — '+r.name,'تم رفض طلب التأشيرة رقم '+id,'❌');
    renderReqs();renderStaff();
  }
}
// duplicate rejectR removed

function renderStaff(){
  document.getElementById('sp-pen').textContent=reqs.filter(function(r){return r.status==='pending';}).length;
  document.getElementById('sp-apr').textContent=reqs.filter(function(r){return r.status==='approved';}).length;
  document.getElementById('sp-tot').textContent=reqs.length;
  var tb=document.getElementById('staff-tb');
  tb.innerHTML='';
  if(!reqs.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">لا توجد طلبات</td></tr>';return;}
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  reqs.forEach(function(r){
    var v=vmap[r.type]||{};
    var row=document.createElement('tr');
    var st=r.status==='approved'?'ba2':r.status==='rejected'?'bx':'bp';
    row.innerHTML='<td style="font-family:monospace;font-weight:700;color:var(--gold-d);font-size:11px">'+r.id+'</td><td style="font-weight:600">'+r.name+'</td><td><span class="badge br2">'+(v.i||'')+' '+(v.n||r.type)+'</span></td><td><span class="badge '+st+'">'+(SL[r.status]||r.status)+'</span></td><td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    if(r.status==='approved'){
      var btnP=document.createElement('button');btnP.className='btn bn2 bsm';btnP.textContent='📄 طباعة';
      btnP.addEventListener('click',function(){printVisa(r);});
      td.appendChild(btnP);
    } else if(r.status!=='rejected'){
      var btnA=document.createElement('button');btnA.className='btn bs3 bsm';btnA.textContent='✓ موافقة';
      btnA.addEventListener('click',function(){approveR(r.id);});
      var btnR=document.createElement('button');btnR.className='btn bd2 bsm';btnR.textContent='✗ رفض';
      btnR.addEventListener('click',function(){rejectR(r.id);});
      td.appendChild(btnA);td.appendChild(btnR);
    }
    tb.appendChild(row);
  });
}

function renderUsers(){
  var tb=document.getElementById('user-tb');
  tb.innerHTML='';
  if(!users.length){tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">لا يوجد موظفون</td></tr>';return;}
  users.forEach(function(u){
    var row=document.createElement('tr');
    row.innerHTML='<td><div style="font-weight:600">'+u.name+'</div>'+(u.notes?'<div style="font-size:10px;color:var(--text3)">'+u.notes+'</div>':'')+'</td>'
      +'<td style="font-size:11px;color:var(--text2)" dir="ltr">'+u.phone+'</td>'
      +'<td><span class="badge '+(u.role==='admin'?'ba2':'br2')+'">'+(u.role==='admin'?'مدير':'موظف')+'</span></td>'
      +'<td><span class="badge '+(u.on?'ba2':'bx')+'">'+(u.on?'نشط':'موقوف')+'</span></td>'
      +'<td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    var btnE=document.createElement('button');btnE.className='btn bg2 bsm';btnE.textContent='تعديل';
    btnE.addEventListener('click',function(){openEditUser(u.id);});
    var btnT=document.createElement('button');btnT.className='btn '+(u.on?'bd2':'bs3')+' bsm';btnT.textContent=u.on?'إيقاف':'تفعيل';
    btnT.addEventListener('click',function(){toggleU(u.id);});
    var btnD=document.createElement('button');btnD.className='btn bo2 bsm';btnD.textContent='حذف';
    btnD.addEventListener('click',function(){deleteUser(u.id);});
    td.appendChild(btnE);td.appendChild(btnT);td.appendChild(btnD);
    tb.appendChild(row);
  });
}

function toggleU(id){var u=users.find(function(x){return x.id===id;});if(u){u.on=!u.on;sbSaveUser(u);saveUsers();renderUsers();}}

function deleteUser(id){
  var u=users.find(function(x){return x.id===id;});
  if(!u)return;
  if(!confirm('هل تريد حذف الموظف "'+u.name+'" نهائياً؟'))return;
  users=users.filter(function(x){return x.id!==id;});
  // Delete from Supabase staff_users table
  try{fetch(SB+'/rest/v1/staff_users?id=eq.'+u.id,{method:'DELETE',headers:SB_HEADERS});}catch(e){}
  saveUsers();renderUsers();
  var stU=document.getElementById('st-usr');if(stU)stU.textContent=users.length;
  addNotif('staff','🗑️ حذف موظف — '+u.name,'تم حذف الموظف من النظام','🗑️');
}

async function deleteAllUsers(){
  if(!users.length){alert('لا يوجد موظفون');return;}
  if(!confirm('⚠️ هل أنت متأكد من حذف جميع الموظفين ('+users.length+')؟\n\nسيتم حذفهم محلياً ومن قاعدة البيانات.\nلا يمكن التراجع!'))return;
  if(!confirm('تأكيد أخير: حذف '+users.length+' موظف؟'))return;
  // Delete each from Supabase
  for(var i=0;i<users.length;i++){
    var u=users[i];
    try{await fetch(SB+'/rest/v1/staff_users?id=eq.'+u.id,{method:'DELETE',headers:SB_HEADERS});}catch(e){}
  }
  users=[];
  saveUsers();renderUsers();
  var stU=document.getElementById('st-usr');if(stU)stU.textContent='0';
  addNotif('staff','🗑️ حذف جميع الموظفين','تم حذف جميع الموظفين من النظام','🗑️');
  alert('✅ تم حذف جميع الموظفين. يمكنك الآن إضافتهم من جديد.');
}

var editUserId=null;
function openEditUser(id){
  var u=users.find(function(x){return x.id===id;});
  if(!u)return;
  editUserId=id;
  document.getElementById('eu-name').value=u.name;
  document.getElementById('eu-phone').value=u.phone;
  document.getElementById('eu-role').value=u.role;
  document.getElementById('eu-notes').value=u.notes||'';
  document.getElementById('ov-edit-user').classList.add('open');
}

function saveEditUser(){
  var u=users.find(function(x){return x.id===editUserId;});
  if(!u)return;
  var name=document.getElementById('eu-name').value.trim();
  var phone=document.getElementById('eu-phone').value.trim();
  var role=document.getElementById('eu-role').value;
  var notes=document.getElementById('eu-notes').value.trim();
  if(!name){alert('أدخل الاسم');return;}
  u.name=name;u.phone=phone;u.role=role;u.notes=notes;
  sbSaveUser(u);saveUsers();
  closeOv('ov-edit-user');renderUsers();
  addNotif('staff','✏️ تعديل موظف — '+name,'تم تحديث بيانات الموظف','✏️');
}

function renderVisas(){
  var tb=document.getElementById('visa-tb');
  tb.innerHTML='';
  visas.forEach(function(v){
    var row=document.createElement('tr');
    var typesStr=(v.types&&v.types.length)?v.types.join(' / '):'-';
    var natsStr=(v.nationalities&&v.nationalities.length)?
      (v.nationalities[0]==='جميع الجنسيات'?'<span class="badge ba2">الكل</span>':v.nationalities.slice(0,2).join('، ')+(v.nationalities.length>2?'...':'')):
      '<span class="badge ba2">الكل</span>';
    var durStr=v.duration||'-';
    row.innerHTML='<td style="font-size:11px">'+natsStr+'</td>'
      +'<td style="font-weight:600"><span style="font-size:18px;margin-left:4px">'+v.i+'</span>'+v.n+'<div style="font-size:10px;color:var(--text2)">'+( v.desc||'')+'</div></td>'
      +'<td style="font-size:11px;color:var(--text2)">'+typesStr+'</td>'
      +'<td><span style="background:var(--gold-l);color:var(--gold-d);border-radius:6px;padding:2px 9px;font-weight:700;font-size:12px">'+formatMoney(v.p)+'</span></td>'
      +'<td style="font-size:11px;color:var(--blue)">⏱ '+durStr+'</td>'
      +'<td><span class="badge '+(v.on?'ba2':'bx')+'">'+(v.on?'مفعّلة':'معطّلة')+'</span></td>'
      +'<td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    var btnE=document.createElement('button');btnE.className='btn bg2 bsm';btnE.textContent='تعديل';btnE.addEventListener('click',function(){editVisa(v.id);});
    var btnT=document.createElement('button');btnT.className='btn '+(v.on?'bd2':'bs3')+' bsm';btnT.textContent=v.on?'تعطيل':'تفعيل';btnT.addEventListener('click',function(){toggleV(v.id);});
    var btnD=document.createElement('button');btnD.className='btn bo2 bsm';btnD.textContent='حذف';btnD.addEventListener('click',function(){delV(v.id);});
    td.appendChild(btnE);td.appendChild(btnT);td.appendChild(btnD);tb.appendChild(row);
  });
  renderVisaGrid();
}

function toggleV(id){var v=visas.find(function(x){return x.id===id;});if(v){v.on=!v.on;sbSaveVisa(v);renderVisas();}}
function delV(id){if(confirm('حذف هذا النوع؟')){visas=visas.filter(function(x){return x.id!==id;});sbDeleteVisa(id);renderVisas();}}
// ===== EXPORT / IMPORT =====
function downloadJSON(data,filename){
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
}
function readJSONFile(input,onLoad){
  var f=input.files&&input.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(e){
    try{var data=JSON.parse(e.target.result);onLoad(data);}
    catch(err){alert('ملف JSON غير صالح: '+err.message);}
    input.value='';
  };
  rd.readAsText(f);
}

function exportPrices(){
  var ts=new Date().toISOString().slice(0,10);
  downloadJSON({version:1,exportedAt:new Date().toISOString(),prices:priceList,customCols:customCols},'alyami-prices-'+ts+'.json');
}
function importPrices(input){
  readJSONFile(input,function(data){
    var prices=data.prices||(Array.isArray(data)?data:null);
    if(!prices||!Array.isArray(prices)){alert('الملف لا يحتوي على قائمة أسعار');return;}
    var mode=confirm('استبدال القائمة الحالية ('+priceList.length+' سعر) بـ '+prices.length+' سعر؟\n\nاضغط موافق = استبدال\nإلغاء = دمج (إضافة على الموجود)')?'replace':'merge';
    if(mode==='replace'){priceList=prices.slice();}
    else{prices.forEach(function(p){if(!p.id)p.id=Date.now()+Math.random();priceList.push(p);});}
    if(data.customCols&&Array.isArray(data.customCols)){
      data.customCols.forEach(function(c){if(!customCols.find(function(x){return x.id===c.id;}))customCols.push(c);});
      saveCustomCols();
    }
    try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
    renderPrices();
    alert('✅ تم الاستيراد: '+prices.length+' سعر');
  });
}

function exportVisas(){
  var ts=new Date().toISOString().slice(0,10);
  downloadJSON({version:1,exportedAt:new Date().toISOString(),visas:visas},'alyami-visas-'+ts+'.json');
}
function importVisas(input){
  readJSONFile(input,function(data){
    var imported=data.visas||(Array.isArray(data)?data:null);
    if(!imported||!Array.isArray(imported)){alert('الملف لا يحتوي على قائمة تأشيرات');return;}
    var mode=confirm('استبدال التأشيرات الحالية ('+visas.length+') بـ '+imported.length+'؟\n\nموافق = استبدال\nإلغاء = دمج')?'replace':'merge';
    if(mode==='replace'){
      visas=imported.slice();
      imported.forEach(function(v){try{sbSaveVisa(v);}catch(e){}});
    } else {
      imported.forEach(function(v){
        var ex=visas.find(function(x){return x.id===v.id;});
        if(ex){Object.assign(ex,v);}else{visas.push(v);}
        try{sbSaveVisa(v);}catch(e){}
      });
    }
    lsSave();renderVisas();
    alert('✅ تم الاستيراد: '+imported.length+' تأشيرة');
  });
}

function restoreDefaultVisas(){
  if(!confirm('استعادة قائمة التأشيرات الافتراضية؟ سيتم دمجها مع قائمتك الحالية.'))return;
  defaultVisas.forEach(function(d){
    if(!visas.find(function(v){return v.id===d.id;})){
      visas.push(JSON.parse(JSON.stringify(d)));
      sbSaveVisa(d);
    }
  });
  lsSave();renderVisas();
  alert('✅ تم استعادة التأشيرات الافتراضية ('+defaultVisas.length+' نوع)');
}

function renderVisaGrid(){
  var g=document.getElementById('visa-grid');
  if(!g)return;
  g.innerHTML='';
  visas.filter(function(v){return v.on;}).forEach(function(v){
    var card=document.createElement('div');
    card.className='vc2';
    var typesHtml=(v.types&&v.types.length)?
      '<div style="font-size:10px;color:var(--text2);margin-top:3px">'+v.types.slice(0,3).join(' · ')+'</div>':'';
    var durHtml=v.duration?
      '<div style="font-size:10px;color:var(--blue);margin-top:2px">⏱ '+v.duration+'</div>':'';
    var natHtml=(v.nationalities&&v.nationalities[0]!=='جميع الجنسيات')?
      '<div style="font-size:10px;color:var(--amber);margin-top:2px">🌍 '+v.nationalities.slice(0,2).join('، ')+'</div>':'';
    card.innerHTML='<div class="vi">'+v.i+'</div><div class="vn">'+v.n+'</div><div class="vp">'+formatMoney(v.p)+'</div>'+typesHtml+durHtml+natHtml;
    card.addEventListener('click',function(){selV(v.id,v.p,card);});
    g.appendChild(card);
  });
}

function renderClientReqs(){
  var el=document.getElementById('c-reqs');
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  if(!mine.length){el.innerHTML='<div style="text-align:center;padding:22px;color:var(--text3);font-size:12px">لا توجد طلبات<br><br><button class="btn bg2 bsm" onclick="openReq()">+ اطلب الآن</button></div>';return;}
  el.innerHTML=mine.map(function(r,idx){
    var prog={pending:30,review:60,approved:100,rejected:10};
    var visaBtn=r.status==='approved'?'<button class="btn bsm" style="font-size:9px;background:var(--green);color:#fff;margin-top:4px" onclick="clientPrintVisa('+idx+')">📄 استخراج التأشيرة</button>':'';
    return '<div class="rcard"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><div><div style="font-weight:700;font-size:12px">'+r.type+'</div><div style="font-size:10px;color:var(--text3);font-family:monospace">'+r.id+'</div></div><span class="badge '+(r.status==='approved'?'ba2':r.status==='rejected'?'bx':'bp')+'">'+( SL[r.status]||r.status)+'</span></div><div class="pb"><div class="pf" style="width:'+(prog[r.status]||30)+'%"></div></div>'+visaBtn+'</div>';
  }).join('');
}

function renderWCs(){
  var tb=document.getElementById('wc-tb');
  tb.innerHTML='';
  var cnt=document.getElementById('wc-count');
  if(cnt)cnt.textContent=wcs.length+' عميل';
  if(!wcs.length){tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text3)"><div style="font-size:32px;margin-bottom:8px">👤</div><div style="font-size:13px;font-weight:600">لا يوجد عملاء بعد</div><div style="font-size:11px;margin-top:4px">اضغط زر الإضافة في الأعلى</div></td></tr>';return;}
  wcs.forEach(function(c){
    var row=document.createElement('tr');
    row.innerHTML='<td style="font-weight:600">'+c.name+'</td><td style="font-size:11px">'+c.phone+'</td><td><span style="background:var(--gold-l);color:var(--gold-d);border-radius:6px;padding:2px 9px;font-size:12px;font-weight:700">'+formatMoney(c.bal)+'</span></td><td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    var btnE=document.createElement('button');btnE.className='btn bg2 bsm';btnE.textContent='شحن/تعديل';
    btnE.addEventListener('click',function(){editWC(c.id);});
    var btnR=document.createElement('button');btnR.className='btn bd2 bsm';btnR.textContent='تصفير';
    btnR.addEventListener('click',function(){resetWC(c.id);});
    td.appendChild(btnE);td.appendChild(btnR);tb.appendChild(row);
  });
}

// ADD USER
function openAddUser(){document.getElementById('nu-name').value='';document.getElementById('nu-phone').value='';document.getElementById('nu-pass').value='Staff@1234';document.getElementById('ov-user').classList.add('open');}
async function addUser(){
  var name=document.getElementById('nu-name').value.trim();
  var phone=document.getElementById('nu-phone').value.trim();
  var code=document.getElementById('nu-code').value||'+218';
  var pass=document.getElementById('nu-pass').value||'Staff@1234';
  var role=document.getElementById('nu-role').value;
  if(!name||!phone){alert('أدخل الاسم والهاتف');return;}
  if(pass.length<8)pass='Staff@1234';
  var fp=code+phone;
  // 1) Add to local + Supabase staff_users table
  var newUser={id:Date.now(),name:name,phone:fp,role:role,on:true,pass:pass};
  users.push(newUser);
  closeOv('ov-user');
  try{sbSaveUser(newUser);}catch(e){}
  renderUsers();
  addNotif('staff','👤 موظف جديد — '+name,'تم إضافة موظف جديد | '+fp+'| الدور: '+(role==='admin'?'مدير':role==='assistant'?'مساعد':'موظف'),'👤');
  var stUsr=document.getElementById('st-usr');if(stUsr)stUsr.textContent=users.length;
  // 2) Try to create Supabase auth account silently (optional — falls back to self-register)
  var email='s'+fp.replace(/\+/g,'').replace(/\s/g,'')+'@alyami.app';
  try{await doFetch(SB+'/auth/v1/signup',{email:email,password:pass,data:{full_name:name,phone:fp,role:role}});}catch(e){}
  // 3) Send WhatsApp with clear instructions
  var roleAr=role==='admin'?'مدير':role==='assistant'?'مساعد مدير':'موظف';
  var msg='مرحباً '+name+' 👋\n\nتم إضافتك كـ'+roleAr+' في اليامي للسفر والسياحة\n\n📱 بيانات دخولك:\nرقم الهاتف: '+fp+'\nكلمة المرور: '+pass+'\n\n🔗 رابط التطبيق:\n'+APP+'\n\n🔐 طريقة الدخول:\n1. افتح الرابط\n2. اختر "موظف"\n3. إذا لم تنجح الكلمة، اضغط "إنشاء حساب موظف" واستخدم نفس الرقم والكلمة\n4. سجّل دخولك';
  var url='https://wa.me/'+fp.replace(/\+/g,'').replace(/\s/g,'')+'?text='+encodeURIComponent(msg);
  showWA(fp,msg,url);
}

// ADD WALLET CLIENT
function openAddWC(){
  document.getElementById('wc-name').value='';
  document.getElementById('wc-phone').value='';
  document.getElementById('wc-agency').value='';
  document.getElementById('wc-pass').value='Client@1234';
  document.getElementById('wc-bal').value='0';
  // Reset CC button
  var btn=document.getElementById('cc-wc-btn');
  if(btn)btn.textContent='🇱🇾 +218';
  var hid=document.getElementById('wc-code');
  if(hid)hid.value='+218';
  document.getElementById('ov-wc').classList.add('open');
}

var editingWC=null;
var wcOpType='add';

function editWC(id){
  editingWC=wcs.find(function(c){return c.id===id;});
  if(!editingWC)return;
  document.getElementById('ewc-name').textContent=editingWC.name;
  document.getElementById('ewc-phone').textContent=editingWC.phone;
  document.getElementById('ewc-cur').textContent=formatMoney(editingWC.bal);
  document.getElementById('ewc-amt').value='';
  document.getElementById('ewc-note').value='';
  wcOpType='add';
  updateWCOp('add');
  updateWCPreview();
  document.getElementById('ov-ewc').classList.add('open');
}

function updateWCOp(op){
  wcOpType=op;
  var btns={add:document.getElementById('op-add'),ded:document.getElementById('op-ded'),set:document.getElementById('op-set')};
  Object.keys(btns).forEach(function(k){
    if(btns[k])btns[k].className='btn bsm '+(k===op?(op==='add'?'bs3':op==='ded'?'bd2':'bn2'):'bo2');
  });
  var lbl=document.getElementById('ewc-lbl');
  if(lbl)lbl.textContent=op==='add'?'مبلغ الإضافة ($)':op==='ded'?'مبلغ الخصم ($)':'الرصيد الجديد ($)';
  updateWCPreview();
}

function updateWCPreview(){
  if(!editingWC)return;
  var amt=parseFloat(document.getElementById('ewc-amt').value)||0;
  var nb=editingWC.bal;
  if(wcOpType==='add')nb+=amt;
  else if(wcOpType==='ded')nb=Math.max(0,nb-amt);
  else nb=amt;
  var pr=document.getElementById('ewc-preview');
  if(pr){
    pr.textContent='الرصيد الجديد: '+formatMoney(nb);
    pr.style.background=nb>editingWC.bal?'var(--green-l)':nb<editingWC.bal?'var(--red-l)':'var(--bg)';
    pr.style.color=nb>editingWC.bal?'var(--green)':nb<editingWC.bal?'var(--red)':'var(--text2)';
  }
}

function confirmEditWC(){
  if(!editingWC)return;
  var amt=parseFloat(document.getElementById('ewc-amt').value)||0;
  if(wcOpType==='add')editingWC.bal+=amt;
  else if(wcOpType==='ded')editingWC.bal=Math.max(0,editingWC.bal-amt);
  else editingWC.bal=amt;
  closeOv('ov-ewc');
  sbSaveWC(editingWC);renderWCs();
}

function resetWC(id){
  var c=wcs.find(function(x){return x.id===id;});
  if(c&&confirm('تصفير رصيد '+c.name+'؟')){c.bal=0;sbSaveWC(c);renderWCs();}
}
function addWC(){
  var name=document.getElementById('wc-name').value.trim();
  var phone=document.getElementById('wc-phone').value.trim();
  var code=document.getElementById('wc-code').value||'+218';
  var pass=document.getElementById('wc-pass').value;
  var agency=document.getElementById('wc-agency').value.trim();
  var bal=parseFloat(document.getElementById('wc-bal').value)||0;
  if(!name||!phone){alert('أدخل الاسم والهاتف');return;}
  var fp=code+phone;
  var newWC={id:Date.now(),name:name,phone:fp,agency:agency,bal:bal};
  wcs.push(newWC);
  closeOv('ov-wc');sbSaveWC(newWC);renderWCs();
  addNotif('client','🧑 عميل جديد — '+name,(agency?'الوكالة: '+agency+' | ':'')+fp+(bal>0?' | رصيد ابتدائي: '+formatMoney(bal):''),'🧑');
  var msg='مرحباً '+name+' 👋\n\nتم تسجيلك في اليامي للسفر والسياحة'+(agency?'\nاسم الوكالة: '+agency:'')+'\n\n📱 بيانات دخولك:\nرقم الهاتف: '+fp+'\nكلمة المرور: '+pass+'\n\n🔗 رابط التطبيق:\n'+APP+'\n\nاختر "عميل" عند الدخول.';
  var url='https://wa.me/'+fp.replace(/\+/g,'').replace(/\s/g,'')+'?text='+encodeURIComponent(msg);
  showWA(fp,msg,url);
}

// WHATSAPP
function showWA(phone,msg,url){
  var ov=document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:18px';
  var safe=msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  ov.innerHTML='<div style="background:white;border-radius:13px;max-width:400px;width:100%;overflow:hidden"><div style="background:#25D366;padding:13px 16px;color:white;display:flex;align-items:center;gap:10px"><span style="font-size:20px">📱</span><div><div style="font-weight:700;font-size:13px">إرسال عبر واتساب</div><div style="font-size:11px;opacity:.8">'+phone+'</div></div></div><div style="padding:14px"><div style="background:#dcf8c6;border-radius:8px;padding:10px;font-size:11px;line-height:1.8;white-space:pre-wrap;direction:rtl;max-height:180px;overflow-y:auto;margin-bottom:12px">'+safe+'</div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="wa-skip" style="padding:7px 14px;border:1px solid #ddd;border-radius:7px;background:white;cursor:pointer;font-family:Cairo,sans-serif;font-size:12px">تخطي</button><button id="wa-send" style="padding:7px 14px;border:none;border-radius:7px;background:#25D366;color:white;cursor:pointer;font-family:Cairo,sans-serif;font-size:12px;font-weight:700">إرسال ✓</button></div></div></div>';
  document.body.appendChild(ov);
  ov.querySelector('#wa-skip').addEventListener('click',function(){ov.remove();});
  ov.querySelector('#wa-send').addEventListener('click',function(){ov.remove();window.open(url,'_blank');});
}

// VISA EDIT
function toggleNatInput(val){
  var wrap=document.getElementById('v-nat-specific-wrap');
  if(wrap)wrap.classList.toggle('hidden',val!=='specific');
}

function openAddVisa(){
  evid=null;
  document.getElementById('visa-modal-t').textContent='إضافة تأشيرة جديدة';
  document.getElementById('v-icon').value='✈️';
  document.getElementById('v-name').value='';
  document.getElementById('v-desc').value='';
  document.getElementById('v-price').value='';
  document.getElementById('v-duration').value='';
  document.getElementById('v-types').value='فردية، عائلية';
  document.getElementById('v-nat-type').value='all';
  document.getElementById('v-nat-specific').value='';
  toggleNatInput('all');
  document.getElementById('ov-visa').classList.add('open');
}

function editVisa(id){
  var v=visas.find(function(x){return x.id===id;});if(!v)return;
  evid=id;
  document.getElementById('visa-modal-t').textContent='تعديل: '+v.n;
  document.getElementById('v-icon').value=v.i;
  document.getElementById('v-name').value=v.n;
  document.getElementById('v-desc').value=v.desc||'';
  document.getElementById('v-price').value=v.p;
  document.getElementById('v-duration').value=v.duration||'';
  document.getElementById('v-types').value=(v.types||[]).join('، ');
  var isAll=!v.nationalities||v.nationalities[0]==='جميع الجنسيات';
  document.getElementById('v-nat-type').value=isAll?'all':'specific';
  document.getElementById('v-nat-specific').value=isAll?'':(v.nationalities||[]).join('، ');
  toggleNatInput(isAll?'all':'specific');
  document.getElementById('ov-visa').classList.add('open');
}

function saveVisa(){
  var icon=document.getElementById('v-icon').value||'✈️';
  var name=document.getElementById('v-name').value.trim();
  var desc=document.getElementById('v-desc').value.trim();
  var price=parseFloat(document.getElementById('v-price').value)||0;
  var duration=document.getElementById('v-duration').value.trim();
  var typesRaw=document.getElementById('v-types').value.trim();
  var types=typesRaw?typesRaw.split(/[,،]/).map(function(t){return t.trim();}).filter(Boolean):[];
  var natType=document.getElementById('v-nat-type').value;
  var nationalities=natType==='all'?['جميع الجنسيات']:
    document.getElementById('v-nat-specific').value.split(/[,،]/).map(function(n){return n.trim();}).filter(Boolean);
  if(!name){alert('أدخل اسم التأشيرة');return;}
  if(evid){
    var v=visas.find(function(x){return x.id===evid;});
    if(v){v.i=icon;v.n=name;v.p=price;v.desc=desc;v.duration=duration;v.types=types;v.nationalities=nationalities;sbSaveVisa(v);}
  } else {
    var nv={id:'v'+Date.now(),i:icon,n:name,p:price,on:true,desc:desc,duration:duration,types:types,nationalities:nationalities};
    visas.push(nv);sbSaveVisa(nv);
  }
  closeOv('ov-visa');renderVisas();
}

// REQUEST
function openReq(){
  step=1;sv='';sa=0;
  uploadedFiles={up1:null,up2:null,up3:null,up4:null};
  uploadedUrls={up1:null,up2:null,up3:null,up4:null};
  // Reset upload zones
  var zones=[
    {id:'up1-zone',icon:'🛂',label:'اضغط لرفع صورة الجواز',sub:'سيتم قراءة البيانات تلقائياً',subColor:'var(--blue)',key:'up1',accept:'image/*,.pdf',title:'📄 جواز السفر'},
    {id:'up2-zone',icon:'🎫',label:'اضغط لرفع صورة التذكرة',sub:'سيتم قراءة بيانات الرحلة تلقائياً',subColor:'var(--blue)',key:'up2',accept:'image/*,.pdf',title:'🎫 التذكرة'},
    {id:'up3-zone',icon:'🖼️',label:'اضغط لرفع الصورة',sub:'JPG خلفية بيضاء',subColor:'',key:'up3',accept:'image/*',title:'🖼️ الصورة الشخصية'},
    {id:'up4-zone',icon:'📋',label:'اضغط للرفع',sub:'اختياري',subColor:'',key:'up4',accept:'image/*,.pdf',title:'📋 مستند إضافي'}
  ];
  zones.forEach(function(z){
    var el=document.getElementById(z.id);
    if(el){
      el.style.border='';el.style.padding='';
      el.innerHTML='<div style="font-size:22px;margin-bottom:4px">'+z.icon+'</div><div style="font-size:12px;font-weight:500">'+z.label+'</div><div style="font-size:10px;color:'+(z.subColor||'var(--text3)')+'">'+z.sub+'</div><input type="file" id="'+z.key+'" accept="'+z.accept+'" style="display:none" onchange="handleUpload(this,\''+z.id+'\',\''+z.title+'\')">';
    }
  });
  renderVisaGrid();
  // Reset form fields
  ['f-ar','f-en','f-pp','f-dob','f-exp','f-nat','f-airline','f-from','f-to','f-travel'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  showStep(1);
  document.getElementById('ov-req').classList.add('open');
}
function selPay(el){
  el.closest('.pm-g').querySelectorAll('.pm2').forEach(function(m){m.classList.remove('on');});
  el.classList.add('on');
  var isWallet=el.querySelector('.pn').textContent==='رصيد';
  var cardFields=document.getElementById('card-fields-pay');
  if(cardFields)cardFields.style.display=isWallet?'none':'block';
}

function selPM(el){
  el.closest('.pm-g').querySelectorAll('.pm2').forEach(function(m){m.classList.remove('on');});
  el.classList.add('on');
}

function showStep(n){
  [1,2,3].forEach(function(i){
    var el=document.getElementById('rs'+i);if(el)el.classList.toggle('hidden',i!==n);
    var c=document.getElementById('rc'+i);if(c){c.className='scc'+(i<n?' done':i===n?' act':'');}
  });
  document.getElementById('prev-b').style.display=n>1?'inline-flex':'none';
  document.getElementById('next-b').textContent=n===3?'تأكيد الدفع':'التالي';

  // When showing step 3 - update payment info
  if(n===3){
    var showEl=document.getElementById('pay-show');
    if(showEl)showEl.textContent=formatMoney(sa);

    // Show wallet balance info
    var walletInfo=document.getElementById('wallet-pay-info');
    var balShow=document.getElementById('pay-balance-show');
    var balStatus=document.getElementById('pay-balance-status');
    var clientPhone=cu.phone||'';
    var wc=wcs.find(function(c){return c.phone===clientPhone;});
    var availBal=wc?wc.bal:(cr==='client'?wb:0);

    if(walletInfo&&availBal>0){
      walletInfo.style.display='block';
      if(balShow)balShow.textContent=formatMoney(availBal);
      if(balStatus){
        if(availBal>=sa){
          balStatus.textContent='كافٍ للدفع ✅';
          balStatus.style.color='var(--green)';
          var wpm=document.getElementById('wallet-pm');
          if(wpm)wpm.style.border='2px solid var(--green)';
        } else {
          balStatus.textContent='غير كافٍ ❌ (ينقص '+formatMoney(sa-availBal)+')';
          balStatus.style.color='var(--red)';
        }
      }
    }
  }
}
function nextS(){
  if(step===1&&!sv){alert('اختر نوع التأشيرة أولاً');return;}
  if(step===2){
    if(!document.getElementById('f-ar').value.trim()&&!document.getElementById('f-en').value.trim()){alert('أدخل اسم العميل');return;}
    if(!document.getElementById('f-pp').value.trim()){alert('أدخل رقم الجواز');return;}
    if(!document.getElementById('f-dob').value){alert('أدخل تاريخ الميلاد');return;}
    if(!uploadedFiles.up1){alert('يرجى رفع صورة جواز السفر');return;}
    if(!uploadedFiles.up2){alert('يرجى رفع صورة التذكرة');return;}
  }
  if(step===3){submitReq();return;}
  step++;showStep(step);
}
function prevS(){if(step>1){step--;showStep(step);}}
function selV(id,price,el){sv=id;sa=price;document.querySelectorAll('.vc2').forEach(function(c){c.classList.remove('on');});el.classList.add('on');var ps=document.getElementById('pay-show');if(ps)ps.textContent=formatMoney(price);}
// REAL FILE UPLOAD HANDLER
var uploadedFiles={up1:null,up2:null,up3:null,up4:null};
var uploadedUrls={up1:null,up2:null,up3:null,up4:null};

async function handleUpload(input,zoneId,label){
  var file=input.files&&input.files[0];
  if(!file)return;

  var zone=document.getElementById(zoneId);
  if(!zone)return;
  var key=input.id;
  uploadedFiles[key]=file;

  // Show uploading state
  zone.innerHTML='<div style="text-align:center;padding:10px"><div style="font-size:20px;margin-bottom:5px">⏳</div><div style="font-size:12px;color:var(--text2)">جاري الرفع...</div></div>';
  zone.style.border='';zone.style.padding='';

  try{
    // Upload to Supabase Storage
    var reqId=document.getElementById('f-pp').value||'req_'+Date.now();
    var ext=file.name.split('.').pop();
    var path=reqId+'/'+key+'_'+Date.now()+'.'+ext;

    var formData=new FormData();
    formData.append('',file,file.name);

    var res=await fetch(SB+'/storage/v1/object/documents/'+path,{
      method:'POST',
      headers:{'apikey':SK,'Authorization':'Bearer '+SK},
      body:file
    });

    if(res.ok){
      var publicUrl=SB+'/storage/v1/object/public/documents/'+path;
      uploadedUrls[key]=publicUrl;

      // Show preview
      if(file.type.startsWith('image/')){
        var reader=new FileReader();
        reader.onload=function(e){
          zone.innerHTML='<div style="position:relative"><img src="'+e.target.result+'" style="width:100%;max-height:120px;object-fit:contain;border-radius:6px"><div style="background:var(--green);color:white;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;margin-top:4px;text-align:center">✅ '+label+' — تم الرفع</div><div style="font-size:10px;color:var(--text2);margin-top:2px;text-align:center">'+file.name+' ('+Math.round(file.size/1024)+'KB)</div></div><input type="file" id="'+key+'" accept="image/*,.pdf" style="display:none" onchange="handleUpload(this,\''+zoneId+'\',\''+label+'\')">';
          zone.style.border='none';zone.style.padding='4px';
        };
        reader.readAsDataURL(file);
      } else {
        // PDF
        zone.innerHTML='<div class="up-ok"><span style="font-size:20px">✅</span><div><div style="font-size:12px;font-weight:600">'+label+'</div><div style="font-size:10px;color:var(--text2)">'+file.name+' ('+Math.round(file.size/1024)+'KB) — تم الرفع</div></div></div><input type="file" id="'+key+'" accept="image/*,.pdf" style="display:none" onchange="handleUpload(this,\''+zoneId+'\',\''+label+'\')">';
        zone.style.border='none';zone.style.padding='4px';
      }
      // OCR: Auto-read passport or ticket
      if(file.type.startsWith('image/')){triggerOCR(key,file,zoneId);}
    } else {
      // Upload failed - save locally only
      uploadedUrls[key]=null;
      showUploadLocal(zone,file,key,zoneId,label);
      // OCR even on local
      if(file.type.startsWith('image/')){triggerOCR(key,file,zoneId);}
    }
  } catch(e){
    // Offline - save locally
    uploadedUrls[key]=null;
    showUploadLocal(zone,file,key,zoneId,label);
    // OCR even offline
    if(file.type.startsWith('image/')){triggerOCR(key,file,zoneId);}
  }
}


function showUploadLocal(zone,file,key,zoneId,label){
  if(file.type.startsWith('image/')){
    var reader=new FileReader();
    reader.onload=function(e){
      zone.innerHTML='<div style="position:relative"><img src="'+e.target.result+'" style="width:100%;max-height:120px;object-fit:contain;border-radius:6px"><div style="background:var(--amber);color:white;border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;margin-top:4px;text-align:center">📎 '+label+' — محلي</div></div><input type="file" id="'+key+'" accept="image/*,.pdf" style="display:none" onchange="handleUpload(this,\''+zoneId+'\',\''+label+'\')">';
      zone.style.border='none';zone.style.padding='4px';
    };
    reader.readAsDataURL(file);
  } else {
    zone.innerHTML='<div class="up-ok" style="background:var(--amber-l)"><span>📎</span><div><div style="font-size:12px;font-weight:600">'+label+'</div><div style="font-size:10px;color:var(--text2)">'+file.name+' — محفوظ محلياً</div></div></div><input type="file" id="'+key+'" accept="image/*,.pdf" style="display:none" onchange="handleUpload(this,\''+zoneId+'\',\''+label+'\')">';
    zone.style.border='none';zone.style.padding='4px';
  }
}

// ===== OCR: قراءة بيانات الجواز تلقائياً =====
function ymdFromMRZ(yymmdd,isExpiry){
  if(!/^\d{6}$/.test(yymmdd))return '';
  var yy=parseInt(yymmdd.slice(0,2),10);
  var mm=yymmdd.slice(2,4);
  var dd=yymmdd.slice(4,6);
  // Expiry: assume 20xx. DOB: if yy>current year's last 2 digits, assume 19xx
  var nowYY=new Date().getFullYear()%100;
  var year=isExpiry?(2000+yy):(yy>nowYY?1900+yy:2000+yy);
  if(parseInt(mm)<1||parseInt(mm)>12||parseInt(dd)<1||parseInt(dd)>31)return '';
  return year+'-'+mm+'-'+dd;
}

function parseMRZ(text){
  var result={name:'',surname:'',passport:'',nationality:'',dob:'',expiry:''};
  // Clean text: MRZ uses < as filler
  var lines=text.split(/\r?\n/).map(function(l){return l.replace(/\s+/g,'').toUpperCase();}).filter(function(l){return l.length>=30&&/[A-Z0-9<]{30,}/.test(l);});
  // TD3 passport: 2 lines of 44 chars
  for(var i=0;i<lines.length-1;i++){
    var l1=lines[i],l2=lines[i+1];
    if(l1.length>=40&&l2.length>=40&&l1.charAt(0)==='P'){
      // Line 1: P<COUNTRYSURNAME<<GIVENNAMES<<<
      var m1=l1.match(/^P[A-Z<]([A-Z]{3})([A-Z<]+)$/);
      if(m1){
        result.nationality=m1[1].replace(/</g,'');
        var names=m1[2].split('<<');
        result.surname=(names[0]||'').replace(/</g,' ').trim();
        result.name=(names[1]||'').replace(/</g,' ').trim();
      }
      // Line 2: PASSPORT(9) CHECK(1) NAT(3) DOB(6) CHECK(1) SEX(1) EXP(6) ...
      result.passport=l2.slice(0,9).replace(/</g,'');
      if(!result.nationality)result.nationality=l2.slice(10,13).replace(/</g,'');
      result.dob=ymdFromMRZ(l2.slice(13,19),false);
      result.expiry=ymdFromMRZ(l2.slice(21,27),true);
      return result;
    }
  }
  return null;
}

// Map 3-letter country codes to Arabic
var NAT_MAP={LBY:'ليبيا',EGY:'مصر',SAU:'السعودية',ARE:'الإمارات',TUN:'تونس',DZA:'الجزائر',MAR:'المغرب',SYR:'سوريا',JOR:'الأردن',PSE:'فلسطين',IRQ:'العراق',YEM:'اليمن',SDN:'السودان',SOM:'الصومال',KWT:'الكويت',QAT:'قطر',BHR:'البحرين',OMN:'عُمان',LBN:'لبنان',TUR:'تركيا',USA:'الولايات المتحدة',GBR:'بريطانيا',FRA:'فرنسا',DEU:'ألمانيا'};

// خرائط المطارات وشركات الطيران لقراءة التذاكر
var IATA_MAP={TIP:'طرابلس',MJI:'مصراتة',BEN:'بنغازي',SEB:'سبها',LAQ:'البيضاء',TOB:'طبرق',GHT:'غات',HUQ:'هون',AKF:'الكفرة',
  CAI:'القاهرة',HRG:'الغردقة',SSH:'شرم الشيخ',ALY:'الإسكندرية',HBE:'برج العرب',LXR:'الأقصر',ASW:'أسوان',
  IST:'اسطنبول',SAW:'اسطنبول صبيحة',TUN:'تونس',DJE:'جربة',
  JED:'جدة',RUH:'الرياض',MED:'المدينة',DMM:'الدمام',
  DXB:'دبي',AUH:'أبوظبي',SHJ:'الشارقة',DOH:'الدوحة',KWI:'الكويت',BAH:'البحرين',MCT:'مسقط',
  AMM:'عمّان',BEY:'بيروت',KRT:'الخرطوم',DAM:'دمشق',BGW:'بغداد',
  IST2:'اسطنبول',LHR:'لندن',CDG:'باريس',FRA:'فرانكفورت',FCO:'روما',MXP:'ميلانو'};
var AIRLINE_MAP=[
  [/AFRIQIYAH|AFRIQYAH|8U/,'الأفريقية'],[/LIBYAN\s*WINGS|WINGS|YL/,'الأجنحة الليبية'],[/LIBYAN|LIBYA|LN\b/,'الخطوط الليبية'],
  [/BURAQ|UZ\b/,'البراق'],[/BERNIQ|DNA/,'برنيق'],[/GHADAMES/,'غدامس'],[/MEDSKY|MED\s*SKY/,'ميدسكي'],[/NOVA/,'نوفا'],
  [/EGYPT\s*AIR|EGYPTAIR|MS\b/,'مصر للطيران'],[/AIR\s*CAIRO|SM\b/,'إير كايرو'],[/NILE/,'طيران النيل'],
  [/TURKISH|TK\b/,'الخطوط التركية'],[/TUNIS|TU\b/,'التونسية'],[/SAUDIA|SAUDI|SV\b/,'الخطوط السعودية'],
  [/QATAR|QR\b/,'القطرية'],[/EMIRATES|EK\b/,'طيران الإمارات'],[/ETIHAD|EY\b/,'الاتحاد'],[/FLYDUBAI|FZ\b/,'فلاي دبي'],
  [/ROYAL\s*JORDANIAN|JORDANIAN|RJ\b/,'الملكية الأردنية'],[/MIDDLE\s*EAST|MEA/,'طيران الشرق الأوسط']
];
var MONTHS={JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12'};
function parseTicketDate(text){
  var t=text.toUpperCase();
  // 12 JAN 2026 / 12JAN26 / 12-JAN-2026
  var m=t.match(/\b(\d{1,2})[\s\-\/]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\s\-\/]?(\d{2,4})\b/);
  if(m){var y=m[3].length===2?('20'+m[3]):m[3];return y+'-'+MONTHS[m[2]]+'-'+String(m[1]).padStart(2,'0');}
  // 2026-01-12
  m=t.match(/\b(20\d{2})[\-\/](\d{1,2})[\-\/](\d{1,2})\b/);
  if(m)return m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0');
  // 12/01/2026 or 12-01-2026 (day first)
  m=t.match(/\b(\d{1,2})[\-\/](\d{1,2})[\-\/](20\d{2}|\d{2})\b/);
  if(m){var yy=m[3].length===2?('20'+m[3]):m[3];var mo=parseInt(m[2],10);if(mo>=1&&mo<=12)return yy+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');}
  return '';
}
function parseTicket(text){
  var res={airline:'',flight:'',from:'',to:'',date:'',pnr:'',pax:''};
  var up=text.toUpperCase();
  // شركة الطيران
  for(var i=0;i<AIRLINE_MAP.length;i++){if(AIRLINE_MAP[i][0].test(up)){res.airline=AIRLINE_MAP[i][1];break;}}
  // رقم الرحلة: حرفان + 2-4 أرقام
  var fm=up.match(/\b([A-Z]{2}|8U|\dU)\s?(\d{2,4})\b/);
  if(fm)res.flight=(fm[1]+fm[2]).replace(/\s/g,'');
  // أكواد المطارات (3 حروف معروفة)، أول اثنين = من/إلى
  var codes=[];var re=/\b([A-Z]{3})\b/g,mm;
  while((mm=re.exec(up))){if(IATA_MAP[mm[1]])codes.push(mm[1]);}
  if(codes.length>=1)res.from=IATA_MAP[codes[0]]||'';
  if(codes.length>=2)res.to=IATA_MAP[codes[1]]||'';
  // نمط route مثل TIP-CAI أو TIP/CAI
  var rt=up.match(/\b([A-Z]{3})\s?[\-\/>→]\s?([A-Z]{3})\b/);
  if(rt&&IATA_MAP[rt[1]]&&IATA_MAP[rt[2]]){res.from=IATA_MAP[rt[1]];res.to=IATA_MAP[rt[2]];}
  // التاريخ
  res.date=parseTicketDate(up);
  // PNR / رقم الحجز: كلمة 6 خانات حروف وأرقام قرب كلمة مفتاحية
  var pn=up.match(/(?:PNR|BOOKING\s*REF|REF|RECORD\s*LOCATOR|BOOKING)[^A-Z0-9]{0,6}([A-Z0-9]{6})\b/);
  if(pn)res.pnr=pn[1];
  // اسم المسافر بصيغة SURNAME/GIVEN — نفضّل ما يلي كلمة NAME/PASSENGER ونتجنب أكواد المطارات
  var cand=[];var nmre=/\b([A-Z]{2,})\/([A-Z]{2,}(?:[ \t]+[A-Z]+)?)\b/g,nmm;
  while((nmm=nmre.exec(up))){
    if(IATA_MAP[nmm[1]]&&IATA_MAP[nmm[2]])continue; // TIP/CAI ليست اسماً
    var afterKw=/(NAME|PASSENGER|PAX|MR|MRS|MISS)/.test(up.slice(Math.max(0,nmm.index-14),nmm.index))||/(MR|MRS|MISS|MSTR)\b/.test(nmm[2]);
    cand.push({v:(nmm[2]+' '+nmm[1]),kw:afterKw});
  }
  var pick=cand.find(function(c){return c.kw;})||cand[0];
  if(pick)res.pax=pick.v.replace(/\b(MR|MRS|MS|MSTR|MISS|DR)\b/g,'').replace(/\s+/g,' ').trim();
  return res;
}
function setIfEmpty(id,val){var e=document.getElementById(id);if(e&&val&&!e.value)e.value=val;}

async function triggerOCR(key,file,zoneId){
  if(key!=='up1'&&key!=='up2')return;
  if(typeof Tesseract==='undefined'){console.warn('Tesseract not loaded');return;}
  var isPass=key==='up1';
  var zone=document.getElementById(zoneId);
  var overlay=document.createElement('div');
  overlay.id='ocr-status-'+key;
  overlay.style.cssText='margin-top:4px;padding:6px 8px;background:var(--blue);color:#fff;border-radius:6px;font-size:11px;text-align:center;font-weight:600';
  overlay.innerHTML='🔍 '+(isPass?'جاري قراءة بيانات الجواز':'جاري قراءة التذكرة')+'... <span id="ocr-prog-'+key+'">0%</span>';
  if(zone)zone.appendChild(overlay);
  try{
    var result=await Tesseract.recognize(file,isPass?'eng':'eng',{
      logger:function(m){
        if(m.status==='recognizing text'){
          var p=Math.round(m.progress*100);
          var el=document.getElementById('ocr-prog-'+key);if(el)el.textContent=p+'%';
        }
      }
    });
    var text=result.data.text||'';
    if(isPass){
      var parsed=parseMRZ(text);
      if(parsed&&parsed.passport){
        if(parsed.passport)document.getElementById('f-pp').value=parsed.passport;
        if(parsed.dob)document.getElementById('f-dob').value=parsed.dob;
        var expEl=document.getElementById('f-exp');if(expEl&&parsed.expiry)expEl.value=parsed.expiry;
        var fullEn=((parsed.name||'')+' '+(parsed.surname||'')).trim();
        if(fullEn)document.getElementById('f-en').value=fullEn;
        var natEl=document.getElementById('f-nat');
        if(natEl&&parsed.nationality){natEl.value=NAT_MAP[parsed.nationality]||parsed.nationality;}
        overlay.style.background='var(--green)';
        overlay.innerHTML='✅ تم قراءة بيانات الجواز تلقائياً';
        setTimeout(function(){if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);},3500);
      } else {
        overlay.style.background='var(--amber)';
        overlay.innerHTML='⚠️ تعذّر قراءة الجواز — أدخل البيانات يدوياً';
        setTimeout(function(){if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);},4000);
      }
    } else {
      var tk=parseTicket(text);
      var got=[];
      if(tk.airline){setIfEmpty('f-airline',tk.airline);got.push('الطيران');}
      if(tk.from){setIfEmpty('f-from',tk.from);got.push('من');}
      if(tk.to){setIfEmpty('f-to',tk.to);got.push('إلى');}
      if(tk.date){setIfEmpty('f-travel',tk.date);got.push('التاريخ');}
      if(tk.pax){setIfEmpty('f-en',tk.pax);}
      var fl=document.getElementById('f-flight');if(fl&&tk.flight)fl.value=tk.flight;
      var pnr=document.getElementById('f-pnr');if(pnr&&tk.pnr)pnr.value=tk.pnr;
      var extra=[];if(tk.flight)extra.push('رحلة '+tk.flight);if(tk.pnr)extra.push('حجز '+tk.pnr);
      if(got.length||extra.length){
        overlay.style.background='var(--green)';
        overlay.innerHTML='✅ تم قراءة التذكرة'+(extra.length?' — '+extra.join(' · '):'');
        setTimeout(function(){if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);},4500);
      } else {
        overlay.style.background='var(--amber)';
        overlay.innerHTML='⚠️ تعذّر قراءة التذكرة — أكمل البيانات يدوياً';
        setTimeout(function(){if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);},4000);
      }
    }
  }catch(err){
    console.error('OCR error',err);
    if(overlay){overlay.style.background='var(--amber)';overlay.innerHTML='⚠️ فشل القراءة — أدخل البيانات يدوياً';setTimeout(function(){if(overlay.parentNode)overlay.parentNode.removeChild(overlay);},4000);}
  }
}
function submitReq(){
  var id='VIS-'+new Date().getFullYear()+'-'+Math.floor(Math.random()*9000+1000);
  var docs=[];
  var docUrls={};
  if(uploadedFiles.up1){docs.push('📄 '+uploadedFiles.up1.name);if(uploadedUrls.up1)docUrls.passport=uploadedUrls.up1;}
  if(uploadedFiles.up2){docs.push('🎫 '+uploadedFiles.up2.name);if(uploadedUrls.up2)docUrls.ticket=uploadedUrls.up2;}
  if(uploadedFiles.up3){docs.push('🖼️ '+uploadedFiles.up3.name);if(uploadedUrls.up3)docUrls.photo=uploadedUrls.up3;}
  if(uploadedFiles.up4){docs.push('📋 '+uploadedFiles.up4.name);if(uploadedUrls.up4)docUrls.extra=uploadedUrls.up4;}

  // Check if paying from wallet balance
  var payMethod=document.querySelector('#rs3 .pm2.on .pn');
  var payFromWallet=payMethod&&payMethod.textContent==='رصيد';
  var paid=false;

  if(payFromWallet){
    // Find client wallet
    var clientPhone=cu.phone||'';
    var wc=wcs.find(function(c){return c.phone===clientPhone||c.phone===cu.phone;});
    if(wc){
      if(wc.bal<sa){
        alert('رصيد العميل غير كافٍ!\n\nالرصيد الحالي: '+formatMoney(wc.bal)+'\nالمبلغ المطلوب: '+formatMoney(sa));
        return;
      }
      if(!confirm('⚠️ تأكيد الخصم من الرصيد\n\nسيتم خصم: '+formatMoney(sa)+'\nالرصيد الحالي: '+formatMoney(wc.bal)+'\nالرصيد بعد الخصم: '+formatMoney(wc.bal-sa)+'\n\nهل تريد المتابعة؟'))return;
      wc.bal=parseFloat((wc.bal-sa).toFixed(2));
      sbSaveWC(wc);
      renderWCs();
      paid=true;
    } else {
      // Check own wallet (client logged in)
      if(cr==='client'){
        if(wb<sa){
          alert('رصيدك غير كافٍ!\n\nرصيدك الحالي: '+formatMoney(wb)+'\nالمبلغ المطلوب: '+formatMoney(sa));
          return;
        }
        if(!confirm('⚠️ تأكيد الخصم من رصيدك\n\nسيتم خصم: '+formatMoney(sa)+'\nرصيدك الحالي: '+formatMoney(wb)+'\nرصيدك بعد الخصم: '+formatMoney(wb-sa)+'\n\nهل تريد المتابعة؟'))return;
        wb=parseFloat((wb-sa).toFixed(2));
        document.getElementById('w-bal').textContent=formatMoney(wb);
        document.getElementById('bal-n').textContent=formatMoney(wb);
        paid=true;
      }
    }
  }

  var newReq={
    id:id,
    name:document.getElementById('f-ar').value||cu.name||'عميل',
    name_en:document.getElementById('f-en').value||'',
    phone:cu.phone||'',
    type:sv,amt:sa,paid:paid,
    status:paid?'review':'pending',
    cid:cu.phone||'',
    passport:document.getElementById('f-pp').value||'',
    dob:document.getElementById('f-dob').value||'',
    passportExpiry:(document.getElementById('f-exp')||{}).value||'',
    nationality:(document.getElementById('f-nat')||{}).value||'',
    airline:document.getElementById('f-airline').value||'',
    route_from:document.getElementById('f-from').value||'',
    route_to:document.getElementById('f-to').value||'',
    travel_date:document.getElementById('f-travel').value||'',
    flight:(document.getElementById('f-flight')||{}).value||'',
    pnr:(document.getElementById('f-pnr')||{}).value||'',
    notes:[((document.getElementById('f-flight')||{}).value?'رحلة '+document.getElementById('f-flight').value:''),((document.getElementById('f-pnr')||{}).value?'حجز '+document.getElementById('f-pnr').value:'')].filter(Boolean).join(' · '),
    date:new Date().toLocaleDateString('ar-SA'),
    docs:docs,
    docUrls:docUrls,
    payMethod:payFromWallet?'رصيد المحفظة':'بطاقة/تحويل'
  };

  reqs.unshift(newReq);
  sbSaveReq(newReq);
  // Send notification
  addNotif('req',
    '📋 طلب جديد — '+newReq.name,
    'تم تقديم طلب '+( v&&v.n||newReq.type)+' | جواز: '+( newReq.passport||'-')+(paid?' | ✅ مدفوع من الرصيد':''),
    '📋'
  );
  closeOv('ov-req');

  // Show success with deduction info
  var sucMsg=paid?
    '✅ تم الخصم من الرصيد\nالمبلغ المخصوم: '+formatMoney(sa):
    'سيتم التواصل معك قريباً';
  document.getElementById('suc-id').textContent=id;
  var sucMsgEl=document.getElementById('suc-msg');
  if(sucMsgEl)sucMsgEl.textContent=paid?'✅ تم خصم '+formatMoney(sa)+' من رصيدك':'سيتم التواصل معك قريباً للدفع';
  document.getElementById('ov-suc').classList.add('open');
  step=1;renderReqs();renderClientReqs();renderStaff();
}

// WALLET
function selTA(amt,el){ta=amt;document.querySelectorAll('.ta-b').forEach(function(b){b.classList.remove('on');});el.classList.add('on');document.getElementById('ta-pr').textContent=amt;document.getElementById('ta-btn').textContent=amt;}
function selPM(el){el.closest('.pm-g').querySelectorAll('.pm2').forEach(function(m){m.classList.remove('on');});el.classList.add('on');}
function doTopup(){wb+=ta;document.getElementById('w-bal').textContent=formatMoney(wb);document.getElementById('bal-n').textContent=formatMoney(wb);document.getElementById('new-bal').textContent=formatMoney(wb);document.getElementById('ov-tsuc').classList.add('open');}

// MODALS
// ===== PROVIDERS =====
var providers=[];
var selReqs=[];

// Load all saved data on startup
loadData();

function openAddProvider(){
  document.getElementById('pv-name').value='';
  document.getElementById('pv-contact').value='';
  document.getElementById('pv-phone').value='';
  document.getElementById('pv-notes').value='';
  document.getElementById('ov-provider').classList.add('open');
}

function addProvider(){
  var name=document.getElementById('pv-name').value.trim();
  var contact=document.getElementById('pv-contact').value.trim();
  var phone=document.getElementById('pv-phone').value.trim();
  var code=document.getElementById('pv-code').value||'+218';
  var spec=document.getElementById('pv-spec').value;
  var notes=document.getElementById('pv-notes').value.trim();
  if(!name){alert('أدخل اسم المزود');return;}
  var fp=phone?code+phone:'';
  var np={id:Date.now(),name:name,contact:contact,phone:fp,spec:spec,notes:notes,active:true};
  providers.push(np);
  closeOv('ov-provider');
  sbSaveProvider(np);renderProviders();
  updateProviderSelect();
}

var specNames={all:'جميع الأنواع',hajj:'حج وعمرة',egypt:'دخول مصر',tourist:'سياحية',work:'عمل'};

function renderProviders(){
  var tb=document.getElementById('prov-tb');
  if(!tb)return;
  tb.innerHTML='';
  if(!providers.length){
    tb.innerHTML='<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3)">لا يوجد مزودون — أضف مزوداً أولاً</td></tr>';
    return;
  }
  providers.forEach(function(p){
    var row=document.createElement('tr');
    var cnt=reqs.length;
    row.innerHTML='<td style="font-weight:600">'+p.name+'<br><span style="font-size:11px;color:var(--text2)">'+p.contact+'</span></td><td style="font-size:11px" dir="ltr">'+p.phone+'</td><td><span class="badge br2">'+(specNames[p.spec]||p.spec)+'</span></td><td style="font-weight:600;color:var(--navy)">'+cnt+'</td><td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    var btnS=document.createElement('button');btnS.className='btn bg2 bsm';btnS.textContent='إرسال';
    btnS.addEventListener('click',function(){sendProviderQuick(p);});
    var btnD=document.createElement('button');btnD.className='btn bd2 bsm';btnD.textContent='حذف';
    btnD.addEventListener('click',function(){providers=providers.filter(function(x){return x.id!==p.id;});sbDeleteProvider(p.id);renderProviders();updateProviderSelect();});
    td.appendChild(btnS);td.appendChild(btnD);tb.appendChild(row);
  });
}

function updateProviderSelect(){
  var sel=document.getElementById('sel-provider');
  if(!sel)return;
  sel.innerHTML='<option value="">اختر المزود</option>';
  providers.forEach(function(p){
    var o=document.createElement('option');o.value=p.id;o.textContent=p.name;sel.appendChild(o);
  });
}

function renderProviderReqs(){
  var tb=document.getElementById('prov-reqs-tb');
  if(!tb)return;
  tb.innerHTML='';
  selReqs=[];
  document.getElementById('sel-count').textContent='0 طلب محدد';
  if(!reqs.length){tb.innerHTML='<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3)">لا توجد طلبات</td></tr>';return;}
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  reqs.forEach(function(r){
    var v=vmap[r.type]||{};
    var row=document.createElement('tr');
    var cb=document.createElement('input');cb.type='checkbox';cb.style.cssText='width:14px;height:14px;cursor:pointer';
    cb.addEventListener('change',function(){
      if(this.checked){if(selReqs.indexOf(r.id)<0)selReqs.push(r.id);}
      else{selReqs=selReqs.filter(function(x){return x!==r.id;});}
      document.getElementById('sel-count').textContent=selReqs.length+' طلب محدد';
    });
    var td0=document.createElement('td');td0.appendChild(cb);row.appendChild(td0);
    var docIcons=(r.docUrls&&r.docUrls.passport?'🛂':'')+(r.docUrls&&r.docUrls.ticket?' 🎫':'');
    row.innerHTML+='<td style="font-family:monospace;font-size:11px;color:var(--gold-d)">'+r.id+'</td><td style="font-weight:600">'+r.name+(r.name_en?'<br><span style="font-size:10px;color:var(--text2)">'+r.name_en+'</span>':'')+'</td><td style="font-size:11px" dir="ltr">'+(r.passport||'-')+'</td><td><span class="badge br2">'+(v.i||'')+' '+(v.n||r.type)+'</span></td><td style="font-size:14px">'+(docIcons||'<span style="font-size:10px;color:var(--text3)">—</span>')+'</td><td><span class="badge '+(r.status==='approved'?'ba2':'bp')+'">'+( SL[r.status]||r.status)+'</span></td>';
    tb.appendChild(row);
  });
}

function selAllReqs(checked){
  selReqs=[];
  var cbs=document.querySelectorAll('#prov-reqs-tb input[type=checkbox]');
  cbs.forEach(function(cb){
    cb.checked=checked;
    if(checked)selReqs.push(cb.closest('tr').querySelector('td:nth-child(2)').textContent.trim());
  });
  document.getElementById('sel-count').textContent=selReqs.length+' طلب محدد';
}

function getSelectedReqs(){
  if(!selReqs.length){alert('اختر طلباً واحداً على الأقل');return null;}
  return reqs.filter(function(r){return selReqs.indexOf(r.id)>=0;});
}

function getSelectedProvider(){
  var sel=document.getElementById('sel-provider');
  if(!sel||!sel.value){alert('اختر المزود أولاً');return null;}
  return providers.find(function(p){return p.id==sel.value;});
}

// PRINT
function printSelected(){
  var selected=getSelectedReqs();
  if(!selected)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var prov=getSelectedProvider();
  var rows=selected.map(function(r,i){
    var v=vmap[r.type]||{};
    return '<tr><td>'+(i+1)+'</td><td>'+r.id+'</td><td>'+r.name+'</td><td>'+(r.passport||'-')+'</td><td>'+(v.n||r.type)+'</td><td>'+(r.phone||'-')+'</td><td>'+(SL[r.status]||r.status)+'</td></tr>';
  }).join('');
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>قائمة الطلبات</title><style>body{font-family:Arial,sans-serif;padding:20px;direction:rtl}h2{color:#0D1B3E;margin-bottom:4px}p{color:#666;font-size:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0D1B3E;color:white;padding:8px;text-align:right}td{padding:7px 8px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f8f7f3}.footer{margin-top:20px;font-size:11px;color:#999;text-align:center}@media print{button{display:none}}</style></head><body>');
  win.document.write('<h2>اليامي للسفر والسياحة</h2>');
  win.document.write('<p>قائمة الطلبات'+(prov?' — المزود: '+prov.name:'')+' | التاريخ: '+new Date().toLocaleDateString('ar-SA')+'</p>');
  win.document.write('<table><thead><tr><th>#</th><th>رقم الطلب</th><th>العميل</th><th>الجواز</th><th>النوع</th><th>الهاتف</th><th>الحالة</th></tr></thead><tbody>'+rows+'</tbody></table>');
  win.document.write('<div class="footer">إجمالي الطلبات: '+selected.length+' | اليامي للسفر والسياحة</div>');
  win.document.write('<br><button onclick="window.print()" style="padding:8px 20px;background:#0D1B3E;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨️ طباعة</button>');
  win.document.write('</body></html>');
  win.document.close();
}

// PRINT SINGLE - Basic request
function printSingle(id){
  var r=reqs.find(function(x){return x.id===id;});
  if(r)printVisa(r);
}

// PRINT VISA CERTIFICATE - OK TO BOARD VERIFICATION (bilingual, A4)
function printVisa(r){
  if(!r)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var v=vmap[r.type]||{};

  // Get embedded logo from page
  var logoEl=document.querySelector('.sb-head img')||document.querySelector('.auth-logo img');
  var logoSrc=logoEl?logoEl.src:'';

  // Generate unique verification number EGV-YYYYMMNNNN
  if(!r.docNo){
    var d=new Date();
    var ym=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0');
    var rand=Math.floor(10000+Math.random()*90000);
    r.docNo='EGV-'+ym+rand;
    try{localStorage.setItem('alyami_reqs',JSON.stringify(reqs));}catch(e){}
    if(typeof sbSaveReq==='function'){try{sbSaveReq(r);}catch(e){}}
  }
  // QR contains: Name + DOB + Doc Number for verification
  var qrPayload='الاسم: '+(r.name||r.name_en||'-')+'\nName: '+(r.name_en||r.name||'-')+'\nتاريخ الميلاد / DOB: '+(r.dob||'-')+'\nرقم التحقق / Ref: '+r.docNo;
  var qrUrl='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='+encodeURIComponent(qrPayload);

  // Date formatting helpers
  function fmtEn(dt){try{return new Date(dt).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return '-';}}
  var nowD=new Date();
  var nowFull=nowD.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+' '+nowD.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  var issueDate=r.approvedDate?fmtEn(r.approvedDate):fmtEn(nowD);
  var validUntil='';
  try{var ad=r.approvedDate?new Date(r.approvedDate):new Date();ad.setDate(ad.getDate()+90);validUntil=fmtEn(ad);}catch(e){validUntil='-';}
  var dobFmt=r.dob?fmtEn(r.dob):'-';
  var travelFmt=r.travel_date?fmtEn(r.travel_date):'-';

  // Nationality
  var natAr=r.nationality||'ليبيا';
  var natEn=natAr==='ليبيا'?'Libya':natAr==='مصر'?'Egypt':natAr;

  // Color theme
  var navy='#0D1B3E';
  var lightBlue='#D4E8F7';
  var redNote='#C62828';
  var greenStamp='#2E7D32';

  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html>\
<html lang="en">\
<head>\
<meta charset="UTF-8">\
<title>OK TO BOARD VERIFICATION - '+r.docNo+'</title>\
<style>\
  @page{size:A4;margin:0}\
  *{box-sizing:border-box;margin:0;padding:0}\
  body{font-family:"Helvetica Neue","Segoe UI",Arial,sans-serif;background:#f3f4f6;color:#1A1A1A;font-size:13px;line-height:1.5}\
  .page{width:210mm;min-height:297mm;margin:14px auto;background:white;padding:0;position:relative;box-shadow:0 6px 30px rgba(0,0,0,0.08);overflow:hidden}\
  /* Decorative gold/navy header band */\
  .hdr-band{height:7px;background:linear-gradient(90deg,'+navy+' 0%,#C49A3C 50%,'+navy+' 100%)}\
  .inner{padding:22px 28px 28px;position:relative}\
  .topdate{position:absolute;top:20px;right:28px;font-size:10.5px;font-weight:600;color:#555;letter-spacing:0.3px}\
  .h-title{text-align:center;margin:6px 0 4px;font-size:24px;font-weight:800;color:'+navy+';letter-spacing:2.5px}\
  .h-sub{text-align:center;font-size:15px;color:#555;font-weight:600;margin-bottom:8px;direction:rtl;letter-spacing:1px}\
  .h-line{border-top:1.5px solid #C49A3C;width:70%;margin:10px auto 0}\
  .h-deco{text-align:center;color:#C49A3C;font-size:10px;letter-spacing:8px;margin-top:6px}\
  .sec-title{text-align:center;font-size:14px;font-weight:700;color:'+navy+';margin:18px 0 3px;letter-spacing:1.2px}\
  .sec-line{border-top:1.2px solid #C49A3C;width:45%;margin:0 auto 14px}\
  .sec-label{font-size:13px;font-weight:700;color:'+navy+';margin:18px 0 6px;border-right:3px solid #C49A3C;padding:2px 10px 2px 0;background:linear-gradient(90deg,'+lightBlue+' 0%,transparent 100%);letter-spacing:0.5px}\
  /* Three-column verification layout */\
  .v-grid{display:grid;grid-template-columns:1fr 210px 1fr;gap:10px;margin-bottom:16px;align-items:stretch}\
  .v-cell{border:1px solid #c5d3e8;border-radius:6px;overflow:hidden;background:white;box-shadow:0 1px 3px rgba(13,27,62,0.04)}\
  .v-cell .h{background:'+lightBlue+';padding:8px 12px;font-size:10.5px;font-weight:700;color:'+navy+';border-bottom:1px solid #c5d3e8;letter-spacing:0.3px}\
  .v-cell .b{padding:11px;font-size:13px;font-weight:700;text-align:center;min-height:44px;display:flex;align-items:center;justify-content:center;color:#1A1A1A}\
  .v-qr{display:flex;align-items:center;justify-content:center;border:1px solid #c5d3e8;border-radius:6px;padding:8px;background:white;flex-direction:column}\
  .v-qr img{width:175px;height:175px;display:block}\
  .v-qr .qcap{font-size:8.5px;color:#888;margin-top:5px;font-style:italic;letter-spacing:0.3px}\
  /* Generic data table */\
  .dtbl{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:14px;border:1px solid #c5d3e8;border-radius:6px;overflow:hidden;box-shadow:0 1px 3px rgba(13,27,62,0.04)}\
  .dtbl th{background:'+lightBlue+';color:'+navy+';font-size:11.5px;font-weight:700;padding:9px 10px;text-align:center;letter-spacing:0.3px;border-bottom:1px solid #c5d3e8}\
  .dtbl th+th,.dtbl th+th{border-right:1px solid #c5d3e8}\
  .dtbl td{padding:11px 10px;font-size:13px;font-weight:600;text-align:center;vertical-align:middle;color:#1A1A1A;border-top:1px solid #e5eaf2}\
  .dtbl td+td{border-right:1px solid #e5eaf2}\
  .dtbl tr:first-child td{border-top:none}\
  /* Important notes */\
  .notes-box{border:1.5px solid #d4a5a5;border-right:5px solid '+redNote+';border-radius:6px;padding:14px 16px;margin-top:18px;color:#3a3a3a;font-size:11.5px;background:linear-gradient(90deg,#fdf3f3 0%,white 70%)}\
  .notes-box .nt{font-weight:700;font-size:13px;margin-bottom:10px;color:'+redNote+';border-bottom:1px solid #e8c5c5;padding-bottom:6px;letter-spacing:0.5px}\
  .nrow{margin-bottom:9px}\
  .n-en{display:block;line-height:1.5}\
  .n-ar{display:block;text-align:right;direction:rtl;margin-top:2px;line-height:1.7;color:#444}\
  /* Footer strip */\
  .footer-strip{margin-top:22px;border-top:2px solid '+navy+';padding:12px 4px 4px;display:flex;justify-content:space-between;align-items:center}\
  .fs-left{display:flex;align-items:center;gap:12px}\
  .fs-logo{width:54px;height:54px;object-fit:contain}\
  .fs-name .fs-ar{font-size:14px;font-weight:700;color:'+navy+'}\
  .fs-name .fs-en{font-size:10.5px;color:#888;font-weight:600;letter-spacing:0.5px;margin-top:1px}\
  .fs-right{text-align:left}\
  .fs-ref{font-size:11px;font-weight:700;color:'+navy+';font-family:Consolas,monospace;letter-spacing:0.5px}\
  .fs-issued{font-size:10px;color:#777;margin-top:3px}\
  /* Watermark */\
  .wm{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);opacity:0.05;pointer-events:none;z-index:0;text-align:center}\
  .wm-en{font-size:72px;font-weight:900;color:'+navy+';letter-spacing:8px;line-height:1}\
  .wm-ar{font-size:46px;font-weight:700;color:'+navy+';margin-top:10px;line-height:1}\
  .wm-logo{position:absolute;top:48%;left:50%;transform:translate(-50%,-50%);opacity:0.04;pointer-events:none;z-index:0}\
  .wm-logo img{width:360px;height:auto}\
  .content{position:relative;z-index:1}\
  /* Editable hover */\
  [contenteditable="true"]:hover{background:#fffbe6;outline:1px dashed #C49A3C}\
  [contenteditable="true"]:focus{background:#fff8d1;outline:2px solid #C49A3C}\
  @media print{\
    .no-print{display:none!important}\
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact}\
    .page{min-height:auto;border-color:'+navy+'}\
    [contenteditable="true"]:hover,[contenteditable="true"]:focus{background:transparent!important;outline:none!important}\
  }\
</style>\
</head>\
<body>\
<div class="page">\
  <div class="hdr-band"></div>\
  '+(logoSrc?'<div class="wm-logo"><img src="'+logoSrc+'" onerror="this.parentNode.style.display=\'none\'"></div>':'')+'\
  <div class="wm"><div class="wm-en">EGYPT VISA</div><div class="wm-ar">إيجيبت فيزا</div></div>\
  \
  <div class="inner">\
  <div class="content">\
    <div class="topdate">'+nowFull+'</div>\
    <h1 class="h-title">OK TO BOARD VERIFICATION</h1>\
    <div class="h-sub" dir="rtl">تأكيد صحة السفر</div>\
    <div class="h-line"></div>\
    <div class="h-deco">◆ ◆ ◆</div>\
    \
    <div class="sec-title">VERIFICATION DETAILS | <span dir="rtl">تفاصيل التحقق</span></div>\
    <div class="sec-line"></div>\
    \
    <div class="v-grid">\
      <div>\
        <div class="v-cell" style="margin-bottom:8px">\
          <div class="h">Verification Number | <span dir="rtl">رقم التحقق</span></div>\
          <div class="b" contenteditable="true" style="font-family:monospace;letter-spacing:1px;color:'+navy+'">'+r.docNo+'</div>\
        </div>\
        <div class="v-cell">\
          <div class="h">Verification Type | <span dir="rtl">نوع التحقق</span></div>\
          <div class="b" contenteditable="true">Pre-Travel Clearance</div>\
        </div>\
      </div>\
      <div class="v-qr"><img src="'+qrUrl+'" alt="QR" onerror="this.style.display=\'none\'"><div class="qcap">Scan for verification</div></div>\
      <div>\
        <div class="v-cell" style="margin-bottom:8px">\
          <div class="h">Date of Issue | <span dir="rtl">تاريخ الإصدار</span></div>\
          <div class="b" contenteditable="true">'+issueDate+'</div>\
        </div>\
        <div class="v-cell">\
          <div class="h">Valid Until | <span dir="rtl">صالح حتى</span></div>\
          <div class="b" contenteditable="true">'+validUntil+'</div>\
        </div>\
      </div>\
    </div>\
    \
    <div class="sec-label">PASSENGER INFORMATION | <span dir="rtl">معلومات المسافر</span></div>\
    <table class="dtbl">\
      <tr>\
        <th>Passenger Name | <span dir="rtl">اسم المسافر</span></th>\
        <th>Passport Number | <span dir="rtl">رقم جواز السفر</span></th>\
      </tr>\
      <tr>\
        <td contenteditable="true">'+(r.name||r.name_en||'-')+'</td>\
        <td contenteditable="true" style="font-family:monospace;letter-spacing:1px">'+(r.passport||'-')+'</td>\
      </tr>\
      <tr>\
        <th>Nationality | <span dir="rtl">الجنسية</span></th>\
        <th>Birth Date | <span dir="rtl">تاريخ الميلاد</span></th>\
      </tr>\
      <tr>\
        <td contenteditable="true">'+natEn+' | <span dir="rtl">'+natAr+'</span></td>\
        <td contenteditable="true">'+dobFmt+'</td>\
      </tr>\
    </table>\
    \
    <div class="sec-label">FLIGHT DETAILS | <span dir="rtl">معلومات الرحلة</span></div>\
    <table class="dtbl">\
      <tr>\
        <th>Airline | <span dir="rtl">شركة الطيران</span></th>\
        <th>Flight No. | <span dir="rtl">رقم الرحلة</span></th>\
        <th>Arrival Date | <span dir="rtl">تاريخ الوصول</span></th>\
      </tr>\
      <tr>\
        <td contenteditable="true">'+(r.airline||'EgyptAir')+'</td>\
        <td contenteditable="true" style="font-family:monospace">'+(r.flightNo||'-')+'</td>\
        <td contenteditable="true">'+travelFmt+'</td>\
      </tr>\
    </table>\
    \
    <div class="notes-box" contenteditable="true">\
      <div class="nt">IMPORTANT NOTES | <span dir="rtl">إشعارات هامة</span></div>\
      <div class="nrow">\
        <span class="n-en">- This document confirms that the passenger has been pre-cleared for travel to Egypt as of the date of issue.</span>\
        <span class="n-ar">هذا المستند يؤكد أن المسافر تمت الموافقة المسبقة على سفره إلى مصر اعتباراً من تاريخ الإصدار</span>\
      </div>\
      <div class="nrow">\
        <span class="n-en">- Passenger must present valid passport with minimum 6 months validity at the time of travel.</span>\
        <span class="n-ar">يجب على المسافر تقديم جواز سفر ساري مع صلاحية لا تقل عن 6 أشهر في وقت السفر</span>\
      </div>\
      <div class="nrow">\
        <span class="n-en">- This verification is subject to change based on instructions from the security authorities.</span>\
        <span class="n-ar">هذا التحقق يخضع للتغيير بناءً على تعليمات الجهات الأمنية</span>\
      </div>\
      <div class="nrow">\
        <span class="n-en">- The final decision regarding boarding and entry rests with the boarding officer and the security authorities at port of entry.</span>\
        <span class="n-ar">القرار النهائي للصعود والدخول يقع على عاتق ضابط الجوازات و الجهات الأمنية في منفذ الدخول</span>\
      </div>\
    </div>\
    \
    <div class="footer-strip">\
      <div class="fs-left">\
        '+(logoSrc?'<img src="'+logoSrc+'" class="fs-logo" onerror="this.style.display=\'none\'">':'')+'\
        <div class="fs-name">\
          <div class="fs-ar">اليامي للسفر والسياحة</div>\
          <div class="fs-en">ALYAME TRAVEL &amp; TOURISM</div>\
        </div>\
      </div>\
      <div class="fs-right">\
        <div class="fs-ref">REF: '+r.docNo+'</div>\
        <div class="fs-issued">Issued: '+issueDate+' &nbsp;•&nbsp; Valid until: '+validUntil+'</div>\
      </div>\
    </div>\
  </div>\
  </div>\
</div>\
\
<div class="no-print" style="text-align:center;padding:16px;background:#f0f0f0;margin-top:10px">\
  <div style="margin-bottom:10px;font-size:13px;color:#555">💡 Click any field to edit before printing | انقر على أي حقل لتعديله قبل الطباعة</div>\
  <button onclick="window.print()" style="padding:10px 28px;background:'+navy+';color:white;border:none;border-radius:8px;cursor:pointer;font-family:Arial,sans-serif;font-size:14px;font-weight:700;margin-left:10px">🖨️ Print / طباعة</button>\
  <button onclick="window.close()" style="padding:10px 20px;background:#6B6B6B;color:white;border:none;border-radius:8px;cursor:pointer;font-family:Arial,sans-serif;font-size:14px">Close / إغلاق</button>\
</div>\
\
</body></html>');
  win.document.close();
}

// EXCEL
function exportExcel(){
  var selected=getSelectedReqs();
  if(!selected)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var header='رقم الطلب\tاسم العميل\tالهاتف\trقم الجواز\tنوع التأشيرة\tالمبلغ\tالحالة\tالدفع\n';
  var rows=selected.map(function(r){
    var v=vmap[r.type]||{};
    return [r.id,r.name,r.phone||'',r.passport||'',v.n||r.type,formatMoney(r.amt),SL[r.status]||r.status,r.paid?'مدفوع':'غير مدفوع'].join('\t');
  }).join('\n');
  var content='\uFEFF'+header+rows;
  var blob=new Blob([content],{type:'text/tab-separated-values;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='alyami-requests-'+new Date().toISOString().slice(0,10)+'.xls';
  a.click();URL.revokeObjectURL(url);
}

// PDF (print to PDF)
function exportPDF(){
  printSelected();
}

// WHATSAPP TO PROVIDER
function sendToProviderWA(){
  var selected=getSelectedReqs();
  if(!selected)return;
  var prov=getSelectedProvider();
  if(!prov)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var lines=selected.map(function(r,i){
    var v=vmap[r.type]||{};
    var info=(i+1)+'. '+r.name+(r.name_en?' / '+r.name_en:'')+'\n   جواز: '+(r.passport||'-')+' | '+(v.n||r.type)+' | '+formatMoney(r.amt);
    if(r.airline)info+='\n   ✈️ '+r.airline+(r.route_from&&r.route_to?' ('+r.route_from+' → '+r.route_to+')':'');
    if(r.travel_date)info+='\n   📅 تاريخ السفر: '+r.travel_date;
    if(r.dob)info+='\n   🎂 الميلاد: '+r.dob;
    return info;
  }).join('\n\n');
  var msg='مرحباً '+prov.name+' 👋\n\nمن *اليامي للسفر والسياحة*\n\nيرجى معالجة الطلبات التالية:\n━━━━━━━━━━━━━━━━━━━━\n\n'+lines+'\n\n━━━━━━━━━━━━━━━━━━━━\nالإجمالي: *'+selected.length+' طلب*\nالتاريخ: '+new Date().toLocaleDateString('ar-SA');
  var phone=prov.phone.replace(/\+/g,'').replace(/\s/g,'');
  var url='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
  showWA(prov.phone,msg,url);
}

function sendDocsToProviderWA(){
  var selected=getSelectedReqs();
  if(!selected)return;
  var prov=getSelectedProvider();
  if(!prov)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});

  // Build message with document links
  var lines=selected.map(function(r,i){
    var v=vmap[r.type]||{};
    var info=(i+1)+'. *'+r.name+'*'+(r.name_en?' / '+r.name_en:'');
    info+='\n   🛂 جواز: '+(r.passport||'-')+' | '+(v.n||r.type);
    if(r.airline)info+='\n   ✈️ '+r.airline;
    if(r.route_from&&r.route_to)info+='\n   🛫 '+r.route_from+' → '+r.route_to;
    if(r.travel_date)info+='\n   📅 '+r.travel_date;
    if(r.dob)info+='\n   🎂 '+r.dob;
    // Add document links
    var docs=[];
    if(r.docUrls&&r.docUrls.passport)docs.push('🛂 صورة الجواز:\n   '+r.docUrls.passport);
    if(r.docUrls&&r.docUrls.ticket)docs.push('🎫 صورة التذكرة:\n   '+r.docUrls.ticket);
    if(r.docUrls&&r.docUrls.photo)docs.push('🖼️ الصورة الشخصية:\n   '+r.docUrls.photo);
    if(docs.length)info+='\n   📎 *المستندات:*\n   '+docs.join('\n   ');
    else info+='\n   ⚠️ لا توجد مستندات مرفوعة';
    return info;
  }).join('\n\n');

  var msg='مرحباً '+prov.name+' 👋\n\nمن *اليامي للسفر والسياحة*\n\n📋 *الطلبات والمستندات المرفقة:*\n━━━━━━━━━━━━━━━━━━━━\n\n'+lines+'\n\n━━━━━━━━━━━━━━━━━━━━\n📊 الإجمالي: *'+selected.length+' طلب*\n📅 التاريخ: '+new Date().toLocaleDateString('ar-SA')+'\n\n💡 يرجى تحميل المستندات من الروابط أعلاه';
  var phone=prov.phone.replace(/\+/g,'').replace(/\s/g,'');
  var url='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
  showWA(prov.phone,msg,url);
}

function sendProviderQuick(prov){
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var msg='مرحباً '+prov.name+' 👋\n\nمن اليامي للسفر والسياحة\n\nإجمالي الطلبات الحالية: '+reqs.length+' طلب\n\nالتاريخ: '+new Date().toLocaleDateString('ar-SA');
  var phone=prov.phone.replace(/\+/g,'').replace(/\s/g,'');
  var url='https://wa.me/'+phone+'?text='+encodeURIComponent(msg);
  showWA(prov.phone,msg,url);
}

// ===== TOPUP REQUESTS =====
var topupReqs=[];

function requestTopup(){
  var amt=parseFloat(document.getElementById('topup-req-amt').value)||0;
  var method=document.getElementById('topup-method').value;
  var ref=document.getElementById('topup-ref').value.trim();
  if(!amt||amt<1){alert('أدخل المبلغ المراد شحنه');return;}

  var tr={
    id:'TR-'+Date.now(),
    clientName:cu.name||'عميل',
    clientPhone:cu.phone||'',
    amount:amt,
    method:{bank:'تحويل بنكي',cash:'نقداً',other:'أخرى'}[method]||method,
    ref:ref||'-',
    date:new Date().toLocaleDateString('ar-SA'),
    status:'pending'
  };
  topupReqs.push(tr);
  try{localStorage.setItem('alyami_topup_reqs',JSON.stringify(topupReqs));}catch(e){}
  addNotif('topup','💳 طلب شحن رصيد — '+cu.name,formatMoney(amt)+' | '+tr.method+(ref?' | '+ref:''),'💳');

  // Clear form
  document.getElementById('topup-req-amt').value='';
  document.getElementById('topup-ref').value='';

  renderTopupRequests();
  renderAdminTopupRequests();
  alert('✅ تم إرسال طلب الشحن!\n\nسيتم مراجعته وتفعيل رصيدك قريباً.');
}

function renderTopupRequests(){
  var el=document.getElementById('topup-requests');
  if(!el)return;
  var mine=topupReqs.filter(function(t){return t.clientPhone===cu.phone;});
  if(!mine.length){el.innerHTML='<div style="font-size:11px;color:var(--text3)">لا توجد طلبات معلقة</div>';return;}
  el.innerHTML=mine.map(function(t){
    return '<div style="background:var(--bg);border-radius:7px;padding:8px 10px;margin-bottom:6px;font-size:11px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-weight:600">'+formatMoney(t.amount)+'</span><span class="badge '+(t.status==='approved'?'ba2':'bp')+'">'+(t.status==='approved'?'تم الشحن ✅':'معلق ⏳')+'</span></div><div style="color:var(--text2)">'+t.method+' — '+t.date+'</div></div>';
  }).join('');
}

function renderAdminTopupRequests(){
  var tb=document.getElementById('topup-tb');
  if(!tb)return;
  var pending=topupReqs.filter(function(t){return t.status==='pending';});
  var cnt=document.getElementById('topup-count');
  if(cnt)cnt.textContent=pending.length;
  if(!topupReqs.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text3)">لا توجد طلبات شحن</td></tr>';return;}
  tb.innerHTML='';
  topupReqs.forEach(function(t){
    var row=document.createElement('tr');
    row.innerHTML='<td style="font-weight:600">'+t.clientName+'</td><td style="font-size:11px" dir="ltr">'+t.clientPhone+'</td><td style="font-weight:700;color:var(--gold-d)">'+formatMoney(t.amount)+'</td><td>'+t.method+'</td><td style="font-size:11px">'+t.ref+'</td><td style="font-size:11px">'+t.date+'</td><td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';
    if(t.status==='pending'){
      var btnA=document.createElement('button');btnA.className='btn bs3 bsm';btnA.textContent='✓ قبول';
      btnA.addEventListener('click',function(){approveTopup(t.id);});
      var btnR=document.createElement('button');btnR.className='btn bd2 bsm';btnR.textContent='✗ رفض';
      btnR.addEventListener('click',function(){rejectTopup(t.id);});
      td.appendChild(btnA);td.appendChild(btnR);
    } else {
      td.innerHTML='<span class="badge '+(t.status==='approved'?'ba2':'bx')+'">'+(t.status==='approved'?'تم الشحن':'مرفوض')+'</span>';
    }
    tb.appendChild(row);
  });
}

function approveTopup(id){
  var t=topupReqs.find(function(x){return x.id===id;});
  if(!t)return;
  // Find client wallet and add balance
  var wc=wcs.find(function(c){return c.phone===t.clientPhone;});
  if(wc){
    wc.bal=parseFloat((wc.bal+t.amount).toFixed(2));
    sbSaveWC(wc);
    renderWCs();
  }
  t.status='approved';
  try{localStorage.setItem('alyami_topup_reqs',JSON.stringify(topupReqs));}catch(e){}
  renderAdminTopupRequests();
  addNotif('topup','💰 شحن رصيد — '+t.clientName,'تم قبول طلب شحن '+formatMoney(t.amount)+' | '+t.clientPhone,'💰');
  // Send WhatsApp notification
  if(t.clientPhone){
    var msg='مرحباً '+t.clientName+' 👋\n\n✅ تم قبول طلب شحن رصيدك\n\nالمبلغ المشحون: '+formatMoney(t.amount)+'\n\nيمكنك الآن استخدام رصيدك لتقديم طلبات التأشيرة.\n\n🔗 '+APP;
    var phone=t.clientPhone.replace(/\+/g,'').replace(/\s/g,'');
    showWA(t.clientPhone,msg,'https://wa.me/'+phone+'?text='+encodeURIComponent(msg));
  }
}

function rejectTopup(id){
  var t=topupReqs.find(function(x){return x.id===id;});
  if(!t)return;
  if(!confirm('رفض طلب شحن '+t.clientName+'؟'))return;
  t.status='rejected';
  try{localStorage.setItem('alyami_topup_reqs',JSON.stringify(topupReqs));}catch(e){}
  renderAdminTopupRequests();
}

// Load topup requests from localStorage
try{var savedTR=localStorage.getItem('alyami_topup_reqs');if(savedTR)topupReqs=JSON.parse(savedTR);}catch(e){}

// ===== NOTIFICATION SYSTEM =====
var notifications=[];
var notifUnread=0;

function loadNotifs(){
  try{
    var n=localStorage.getItem('alyami_notifs');
    if(n)notifications=JSON.parse(n);
    notifUnread=notifications.filter(function(n){return !n.read;}).length;
  }catch(e){notifications=[];}
}

function saveNotifs(){
  try{
    // Keep last 50 only
    if(notifications.length>50)notifications=notifications.slice(0,50);
    localStorage.setItem('alyami_notifs',JSON.stringify(notifications));
  }catch(e){}
}

function addNotif(type,title,msg,icon){
  var n={
    id:Date.now(),
    type:type,
    title:title,
    msg:msg,
    icon:icon||'🔔',
    time:new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}),
    date:new Date().toLocaleDateString('ar-SA'),
    read:false
  };
  notifications.unshift(n);
  notifUnread++;
  saveNotifs();
  renderNotifBadge();
  renderNotifList();
  showNotifToast(n);
}

function renderNotifBadge(){
  var badge=document.getElementById('notif-badge');
  if(!badge)return;
  if(notifUnread>0){
    badge.style.display='flex';
    badge.textContent=notifUnread>9?'9+':notifUnread;
  } else {
    badge.style.display='none';
  }
}

function renderNotifList(){
  var el=document.getElementById('notif-list');
  if(!el)return;
  if(!notifications.length){
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3);font-size:12px">لا توجد إشعارات</div>';
    return;
  }
  el.innerHTML=notifications.map(function(n){
    var colors={req:'#185FA5',staff:'#534AB7',client:'#1D9E75',topup:'#C49A3C',approve:'#1D9E75',reject:'#A32D2D'};
    var color=colors[n.type]||'#185FA5';
    return '<div onclick="markRead('+n.id+')" style="padding:11px 14px;border-bottom:1px solid var(--border);cursor:pointer;background:'+(n.read?'white':'#F0F7FF')+';transition:background .15s" onmouseover="this.style.background=\'#f8f8f8\'" onmouseout="this.style.background=\''+(n.read?'white':'#F0F7FF')+'\'">'
      +'<div style="display:flex;align-items:flex-start;gap:10px">'
      +'<div style="width:34px;height:34px;border-radius:50%;background:'+color+'20;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">'+n.icon+'</div>'
      +'<div style="flex:1">'
      +'<div style="font-size:12px;font-weight:'+(n.read?'500':'700')+';color:var(--navy);margin-bottom:2px">'+n.title+'</div>'
      +'<div style="font-size:11px;color:var(--text2);line-height:1.5">'+n.msg+'</div>'
      +'<div style="font-size:10px;color:var(--text3);margin-top:4px">'+n.time+' — '+n.date+'</div>'
      +'</div>'
      +(n.read?'':'<div style="width:7px;height:7px;border-radius:50%;background:'+color+';margin-top:4px;flex-shrink:0"></div>')
      +'</div>'
      +'</div>';
  }).join('');
}

function markRead(id){
  var n=notifications.find(function(x){return x.id===id;});
  if(n&&!n.read){n.read=true;notifUnread=Math.max(0,notifUnread-1);saveNotifs();renderNotifBadge();renderNotifList();}
}

function markAllRead(){
  notifications.forEach(function(n){n.read=true;});
  notifUnread=0;saveNotifs();renderNotifBadge();renderNotifList();
}

function toggleNotifPanel(){
  var panel=document.getElementById('notif-panel');
  if(!panel)return;
  var isOpen=panel.style.display==='flex';
  panel.style.display=isOpen?'none':'flex';
  if(!isOpen)renderNotifList();
}

// TOAST NOTIFICATION
function showNotifToast(n){
  var toast=document.createElement('div');
  toast.style.cssText='position:fixed;bottom:20px;left:20px;background:white;border-radius:10px;padding:12px 16px;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:9999;display:flex;align-items:center;gap:10px;max-width:320px;border-right:4px solid var(--navy);animation:slideIn .3s ease';
  toast.innerHTML='<span style="font-size:20px">'+n.icon+'</span><div><div style="font-size:12px;font-weight:700;color:var(--navy)">'+n.title+'</div><div style="font-size:11px;color:var(--text2);margin-top:2px">'+n.msg+'</div></div><button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;margin-right:auto">×</button>';
  document.body.appendChild(toast);
  setTimeout(function(){if(toast.parentElement)toast.remove();},5000);
}

// Close panel when clicking outside
document.addEventListener('click',function(e){
  var panel=document.getElementById('notif-panel');
  var btn=document.getElementById('notif-btn');
  if(panel&&btn&&!panel.contains(e.target)&&!btn.contains(e.target)){
    panel.style.display='none';
  }
});

// Load notifications on startup
loadNotifs();

// ===== PRICE LIST =====
var priceList=[];
var editPriceId=null;

function initPriceModal(){
  // Fill nationality datalist (for suggestions; manual entry allowed)
  var dl=document.getElementById('pr-nat-list');
  if(dl&&!dl.children.length){
    var def=document.createElement('option');def.value='جميع الجنسيات';dl.appendChild(def);
    nats.forEach(function(n){var o=document.createElement('option');o.value=n;dl.appendChild(o);});
  }
  // Fill visa datalist (suggestions; manual entry allowed)
  var vdl=document.getElementById('pr-visa-list');
  if(vdl&&!vdl.children.length){
    visas.forEach(function(v){var o=document.createElement('option');o.value=v.n;vdl.appendChild(o);});
  }
}

function renderCustomFieldsInModal(p){
  var box=document.getElementById('pr-custom-fields');
  if(!box)return;
  if(!customCols.length){box.innerHTML='';return;}
  var html='<div class="fgrid">';
  customCols.forEach(function(c){
    var val=(p&&p.custom&&p.custom[c.id])?p.custom[c.id]:'';
    var type=c.type==='number'?'number':'text';
    html+='<div class="fg full"><label>'+c.name+' <span style="color:var(--text3);font-size:10px">(عمود مخصص)</span></label><input type="'+type+'" data-col-id="'+c.id+'" class="pr-custom-input" value="'+val+'" placeholder="..."></div>';
  });
  html+='</div>';
  box.innerHTML=html;
}

function addPriceRow(){
  editPriceId=null;
  document.getElementById('price-modal-t').textContent='إضافة سعر جديد';
  document.getElementById('pr-nat').value='جميع الجنسيات';
  document.getElementById('pr-entity').value='';
  document.getElementById('pr-visa').value='';
  document.getElementById('pr-port').value='';
  document.getElementById('pr-duration').value='';
  document.getElementById('pr-price').value='';
  document.getElementById('pr-price-lyd').value='';
  document.getElementById('pr-price-egp').value='';
  document.getElementById('pr-validity').value='';
  document.getElementById('pr-airline').value='';
  document.getElementById('pr-notes').value='';
  renderCustomFieldsInModal(null);
  initPriceModal();
  document.getElementById('ov-price').classList.add('open');
}

function editPriceRow(id){
  var p=priceList.find(function(x){return x.id===id;});if(!p)return;
  editPriceId=id;
  document.getElementById('price-modal-t').textContent='تعديل السعر';
  initPriceModal();
  document.getElementById('pr-nat').value=p.nat||'جميع الجنسيات';
  document.getElementById('pr-entity').value=p.entity||'';
  document.getElementById('pr-visa').value=p.visaName||'';
  document.getElementById('pr-port').value=p.port||'';
  document.getElementById('pr-duration').value=p.duration||'';
  document.getElementById('pr-price').value=p.price||'';
  document.getElementById('pr-price-lyd').value=p.priceLyd||'';
  document.getElementById('pr-price-egp').value=p.priceEgp||'';
  document.getElementById('pr-validity').value=p.validity||'';
  document.getElementById('pr-airline').value=p.airline||'';
  document.getElementById('pr-notes').value=p.notes||'';
  renderCustomFieldsInModal(p);
  document.getElementById('ov-price').classList.add('open');
}

function savePriceRow(){
  var nat=document.getElementById('pr-nat').value.trim()||'جميع الجنسيات';
  var entity=document.getElementById('pr-entity').value.trim();
  var vname=document.getElementById('pr-visa').value.trim();
  var port=document.getElementById('pr-port').value.trim();
  var airline=document.getElementById('pr-airline').value.trim();
  var duration=document.getElementById('pr-duration').value.trim();
  var price=parseFloat(document.getElementById('pr-price').value)||0;
  var priceLyd=parseFloat(document.getElementById('pr-price-lyd').value)||0;
  var priceEgp=parseFloat(document.getElementById('pr-price-egp').value)||0;
  var validity=document.getElementById('pr-validity').value.trim();
  var notes=document.getElementById('pr-notes').value.trim();
  var customVals={};
  document.querySelectorAll('.pr-custom-input').forEach(function(inp){
    var cid=inp.getAttribute('data-col-id');
    if(cid&&inp.value.trim())customVals[cid]=inp.value.trim();
  });
  if(!vname){alert('اكتب نوع التأشيرة');return;}
  // match visaId if name matches an existing visa
  var matched=visas.find(function(v){return v.n===vname;});
  var visaId=matched?matched.id:vname;
  if(editPriceId){
    var p=priceList.find(function(x){return x.id===editPriceId;});
    if(p){p.nat=nat;p.entity=entity;p.visaId=visaId;p.visaName=vname;p.port=port;p.airline=airline;p.duration=duration;p.price=price;p.priceLyd=priceLyd;p.priceEgp=priceEgp;p.validity=validity;p.notes=notes;p.custom=customVals;}
  } else {
    priceList.push({id:Date.now(),nat:nat,entity:entity,visaId:visaId,visaName:vname,port:port,airline:airline,duration:duration,price:price,priceLyd:priceLyd,priceEgp:priceEgp,validity:validity,notes:notes,custom:customVals});
  }
  try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
  closeOv('ov-price');renderPrices();
}

function deletePriceRow(id){
  if(!confirm('حذف هذا السعر؟'))return;
  priceList=priceList.filter(function(x){return x.id!==id;});
  try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
  renderPrices();
}

function movePriceRow(id,dir){
  var i=priceList.findIndex(function(x){return x.id===id;});
  if(i<0)return;
  var j=i+dir;
  if(j<0||j>=priceList.length)return;
  var tmp=priceList[i];priceList[i]=priceList[j];priceList[j]=tmp;
  try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
  renderPrices();
}

var _dragPriceId=null;
function priceDragStart(e,id){_dragPriceId=id;e.dataTransfer.effectAllowed='move';e.currentTarget.style.opacity='0.4';}
function priceDragEnd(e){e.currentTarget.style.opacity='';_dragPriceId=null;document.querySelectorAll('#prices-tb tr').forEach(function(r){r.style.borderTop='';});}
function priceDragOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';e.currentTarget.style.borderTop='3px solid var(--gold-d)';}
function priceDragLeave(e){e.currentTarget.style.borderTop='';}
function priceDrop(e,targetId){
  e.preventDefault();e.currentTarget.style.borderTop='';
  if(!_dragPriceId||_dragPriceId===targetId)return;
  var from=priceList.findIndex(function(x){return x.id===_dragPriceId;});
  var to=priceList.findIndex(function(x){return x.id===targetId;});
  if(from<0||to<0)return;
  var item=priceList.splice(from,1)[0];
  priceList.splice(to,0,item);
  try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
  renderPrices();
}

function renderPrices(){
  var tb=document.getElementById('prices-tb');
  if(!tb)return;
  if(typeof customCols==='undefined'||!customCols)customCols=[];
  renderPricesHead();
  tb.innerHTML='';
  var colspan=9+customCols.length;
  if(!priceList.length){tb.innerHTML='<tr><td colspan="'+colspan+'" style="text-align:center;padding:20px;color:var(--text3);font-size:14px">لا توجد أسعار — أضف أسعار التأشيرات</td></tr>';return;}
  priceList.forEach(function(p,idx){
    var row=document.createElement('tr');
    row.setAttribute('draggable','true');
    row.style.cursor='move';
    row.addEventListener('dragstart',function(e){priceDragStart(e,p.id);});
    row.addEventListener('dragend',priceDragEnd);
    row.addEventListener('dragover',priceDragOver);
    row.addEventListener('dragleave',priceDragLeave);
    row.addEventListener('drop',function(e){priceDrop(e,p.id);});
    var lydHtml=p.priceLyd?'<div style="font-size:13px;color:var(--text2);font-weight:600">'+p.priceLyd+' د.ل</div>':'';
    var egpHtml=p.priceEgp?'<div style="font-size:13px;color:var(--text2);font-weight:600">'+p.priceEgp+' ج.م</div>':'';
    var validityHtml=p.validity?'<div style="font-size:11px;color:var(--green);margin-top:2px">صلاحية: '+p.validity+'</div>':'';
    var customCellsHtml='';
    customCols.forEach(function(c){
      var val=(p.custom&&p.custom[c.id])?p.custom[c.id]:'-';
      customCellsHtml+='<td style="font-size:14px">'+val+'</td>';
    });
    row.innerHTML='<td style="font-size:18px;font-weight:700;color:var(--navy)">'+p.nat+'</td>'
      +'<td style="font-size:14px">'+(p.entity||'-')+'</td>'
      +'<td style="font-weight:700;font-size:15px">'+p.visaName+validityHtml+'</td>'
      +'<td style="font-size:14px">'+(p.port||'-')+'</td>'
      +'<td style="color:var(--blue);font-size:14px">⏱ '+(p.duration||'-')+'</td>'
      +'<td><div style="font-weight:700;color:var(--gold-d);font-size:17px">$'+p.price+'</div>'+lydHtml+egpHtml+'</td>'
      +'<td style="font-size:14px">'+(p.airline||'-')+'</td>'
      +customCellsHtml
      +'<td style="font-size:13px;color:var(--text2)">'+(p.notes||'-')+'</td>'
      +'<td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='3px';td.style.flexWrap='wrap';
    var btnUp=document.createElement('button');btnUp.className='btn bo2 bsm';btnUp.textContent='↑';btnUp.title='نقل لأعلى';btnUp.disabled=(idx===0);btnUp.addEventListener('click',function(){movePriceRow(p.id,-1);});
    var btnDn=document.createElement('button');btnDn.className='btn bo2 bsm';btnDn.textContent='↓';btnDn.title='نقل لأسفل';btnDn.disabled=(idx===priceList.length-1);btnDn.addEventListener('click',function(){movePriceRow(p.id,1);});
    var btnE=document.createElement('button');btnE.className='btn bg2 bsm';btnE.textContent='تعديل';btnE.addEventListener('click',function(){editPriceRow(p.id);});
    var btnD=document.createElement('button');btnD.className='btn bd2 bsm';btnD.textContent='حذف';btnD.addEventListener('click',function(){deletePriceRow(p.id);});
    td.appendChild(btnUp);td.appendChild(btnDn);td.appendChild(btnE);td.appendChild(btnD);tb.appendChild(row);
  });
}

function printPriceList(){
  var logoEl=document.querySelector('.sb-head img');
  var logoSrc=logoEl?logoEl.src:'';
  var rows=priceList.map(function(p,i){
    var lydCell=p.priceLyd?'<div style="font-size:12px;color:#555">'+p.priceLyd+' د.ل</div>':'';
    var egpCell=p.priceEgp?'<div style="font-size:12px;color:#555">'+p.priceEgp+' ج.م</div>':'';
    var validCell=p.validity?'<div style="font-size:11px;color:#2e7d32">صلاحية: '+p.validity+'</div>':'';
    var customCellsP='';
    customCols.forEach(function(c){var v=(p.custom&&p.custom[c.id])?p.custom[c.id]:'-';customCellsP+='<td>'+v+'</td>';});
    return '<tr><td>'+(i+1)+'</td><td>'+p.nat+'</td><td>'+(p.entity||'-')+'</td><td style="font-weight:700">'+p.visaName+validCell+'</td><td>'+(p.port||'-')+'</td><td style="color:#185FA5;font-weight:600">'+(p.duration||'-')+'</td><td style="font-weight:700;color:#8B6914;font-size:15px">$'+p.price+lydCell+egpCell+'</td><td>'+(p.airline||'-')+'</td>'+customCellsP+'<td style="color:#666;font-size:12px">'+(p.notes||'-')+'</td></tr>';
  }).join('');
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>قائمة أسعار التأشيرات</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;direction:rtl;font-size:12px}.header{background:linear-gradient(135deg,#0D1B3E,#1A2F5A);color:white;padding:16px 20px;display:flex;align-items:center;gap:14px;border-radius:8px 8px 0 0;margin-bottom:0}.logo{width:60px;height:60px;object-fit:contain;background:white;border-radius:8px;padding:3px}.h-title h1{font-size:20px;color:#F5E8C0;margin-bottom:3px}.h-title p{font-size:11px;color:rgba(255,255,255,.6)}.gold-bar{background:#C49A3C;height:4px;margin-bottom:16px}.section-title{font-size:14px;font-weight:700;color:#0D1B3E;border-bottom:2px solid #C49A3C;padding-bottom:5px;margin-bottom:12px}table{width:100%;border-collapse:collapse;font-size:14px}th{background:#0D1B3E;color:white;padding:10px 8px;text-align:right;font-size:13px}td{padding:9px 8px;border-bottom:1px solid #E5E0D5;vertical-align:middle;font-size:14px}tr:nth-child(even) td{background:#F8F7F3}.footer{margin-top:16px;text-align:center;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px}@media print{.no-print{display:none}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>');
  win.document.write('<div class="header"><img src="'+logoSrc+'" class="logo" onerror="this.style.display=\'none\'"><div class="h-title"><h1>اليامي للسفر والسياحة</h1><p>قائمة أسعار التأشيرات — ALYAME TRAVEL</p></div></div>');
  win.document.write('<div class="gold-bar"></div>');
  win.document.write('<div class="section-title">💲 قائمة الأسعار الرسمية — '+new Date().toLocaleDateString('ar-SA')+'</div>');
  var customHeaders=customCols.map(function(c){return '<th>'+c.name+'</th>';}).join('');
  win.document.write('<table><thead><tr><th>#</th><th>الجنسية</th><th>الجهة المنفذة</th><th>نوع التأشيرة</th><th>منفذ الدخول</th><th>مدة الإنجاز</th><th>السعر</th><th>الخطوط</th>'+customHeaders+'<th>ملاحظات</th></tr></thead><tbody>'+rows+'</tbody></table>');
  win.document.write('<div class="footer">اليامي للسفر والسياحة | الأسعار قابلة للتغيير | '+new Date().toLocaleDateString('ar-SA')+'</div>');
  win.document.write('<br class="no-print"><div class="no-print" style="text-align:center;padding:12px"><button onclick="window.print()" style="padding:9px 24px;background:#0D1B3E;color:white;border:none;border-radius:7px;cursor:pointer;font-size:13px">🖨️ طباعة / حفظ PDF</button></div>');
  win.document.write('</body></html>');
  win.document.close();
}

// Load saved prices
try{var sp=localStorage.getItem('alyami_prices');if(sp)priceList=JSON.parse(sp);}catch(e){}

// ===== CUSTOM COLUMNS (initialized earlier, re-load here) =====
try{var sc=localStorage.getItem('alyami_price_cols');if(sc)customCols=JSON.parse(sc)||[];}catch(e){customCols=[];}
function saveCustomCols(){try{localStorage.setItem('alyami_price_cols',JSON.stringify(customCols));}catch(e){}}

function addPriceColumn(){
  var name=prompt('اسم العمود الجديد (مثال: رسوم الإصدار، خدمات إضافية...):');
  if(!name||!name.trim())return;
  name=name.trim();
  var type=prompt('نوع البيانات:\n1 - نص (اكتب: text)\n2 - رقم (اكتب: number)','text');
  if(!type)return;
  type=(type.trim().toLowerCase()==='number'||type.trim()==='2')?'number':'text';
  var colId='c'+Date.now();
  customCols.push({id:colId,name:name,type:type});
  saveCustomCols();
  renderPrices();
  alert('تمت إضافة العمود "'+name+'" بنجاح. يمكنك الآن تعبئته من زر "تعديل" لكل صف.');
}

function manageColumns(){
  if(!customCols.length){alert('لا توجد أعمدة مخصصة. اضغط "➕ إضافة عمود" أولاً.');return;}
  var list=customCols.map(function(c,i){return (i+1)+'. '+c.name+' ('+c.type+')';}).join('\n');
  var idx=prompt('الأعمدة المخصصة:\n\n'+list+'\n\nاكتب رقم العمود لحذفه، أو اتركه فارغاً للإلغاء:');
  if(!idx)return;
  var i=parseInt(idx)-1;
  if(i<0||i>=customCols.length){alert('رقم غير صحيح');return;}
  if(!confirm('حذف العمود "'+customCols[i].name+'"؟ سيتم حذف بياناته من جميع الصفوف.'))return;
  var colId=customCols[i].id;
  customCols.splice(i,1);
  priceList.forEach(function(p){if(p.custom)delete p.custom[colId];});
  saveCustomCols();
  try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(e){}
  renderPrices();
}

function renderPricesHead(){
  var th=document.getElementById('prices-thead');
  if(!th)return;
  var cc=(typeof customCols!=='undefined'&&customCols)?customCols:[];
  var html='<tr><th>الجنسية</th><th>الجهة المنفذة</th><th>نوع التأشيرة</th><th>منفذ الدخول</th><th>مدة الإنجاز</th><th>السعر</th><th>الخطوط</th>';
  cc.forEach(function(c){html+='<th>'+c.name+'</th>';});
  html+='<th>ملاحظات</th><th>إجراء</th></tr>';
  th.innerHTML=html;
}

// ===== TRANSPORT =====
var transports=[];
var editTransportId=null;

function openAddTransport(){
  editTransportId=null;
  document.getElementById('transport-modal-t').textContent='إضافة رحلة نقل';
  ['tr-client','tr-from','tr-to','tr-notes'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('tr-pax').value='1';
  document.getElementById('tr-price').value='';
  document.getElementById('tr-date').value=new Date().toISOString().slice(0,10);
  document.getElementById('tr-time').value='';
  document.getElementById('ov-transport').classList.add('open');
}

function editTransport(id){
  var t=transports.find(function(x){return x.id===id;});if(!t)return;
  editTransportId=id;
  document.getElementById('transport-modal-t').textContent='تعديل رحلة النقل';
  document.getElementById('tr-client').value=t.client||'';
  document.getElementById('tr-from').value=t.from||'';
  document.getElementById('tr-to').value=t.to||'';
  document.getElementById('tr-car').value=t.car||'سيارة خاصة';
  document.getElementById('tr-pax').value=t.pax||1;
  document.getElementById('tr-date').value=t.date||'';
  document.getElementById('tr-time').value=t.time||'';
  document.getElementById('tr-price').value=t.price||'';
  document.getElementById('tr-notes').value=t.notes||'';
  document.getElementById('ov-transport').classList.add('open');
}

function saveTransport(){
  var client=document.getElementById('tr-client').value.trim();
  var from=document.getElementById('tr-from').value.trim();
  var to=document.getElementById('tr-to').value.trim();
  var car=document.getElementById('tr-car').value;
  var pax=parseInt(document.getElementById('tr-pax').value)||1;
  var date=document.getElementById('tr-date').value;
  var time=document.getElementById('tr-time').value;
  var price=parseFloat(document.getElementById('tr-price').value)||0;
  var notes=document.getElementById('tr-notes').value.trim();
  if(!client||!from||!to){alert('أدخل اسم العميل ونقطة الانطلاق والوجهة');return;}
  if(editTransportId){
    var t=transports.find(function(x){return x.id===editTransportId;});
    if(t){t.client=client;t.from=from;t.to=to;t.car=car;t.pax=pax;t.date=date;t.time=time;t.price=price;t.notes=notes;}
  } else {
    transports.push({id:Date.now(),client:client,from:from,to:to,car:car,pax:pax,date:date,time:time,price:price,notes:notes,status:'pending'});
  }
  try{localStorage.setItem('alyami_transports',JSON.stringify(transports));}catch(e){}
  closeOv('ov-transport');renderTransport();
}

function deleteTransport(id){
  if(!confirm('حذف هذه الرحلة؟'))return;
  transports=transports.filter(function(x){return x.id!==id;});
  try{localStorage.setItem('alyami_transports',JSON.stringify(transports));}catch(e){}
  renderTransport();
}

function setTransportStatus(id,status){
  var t=transports.find(function(x){return x.id===id;});
  if(t){t.status=status;try{localStorage.setItem('alyami_transports',JSON.stringify(transports));}catch(e){}renderTransport();}
}

function renderTransport(){
  var tb=document.getElementById('transport-tb');if(!tb)return;
  tb.innerHTML='';
  document.getElementById('tr-total').textContent=transports.length;
  document.getElementById('tr-done').textContent=transports.filter(function(t){return t.status==='done';}).length;
  document.getElementById('tr-pend').textContent=transports.filter(function(t){return t.status==='pending';}).length;
  if(!transports.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text3)">لا توجد رحلات — أضف رحلة نقل</td></tr>';return;}
  transports.forEach(function(t){
    var row=document.createElement('tr');
    var stColor=t.status==='done'?'ba2':t.status==='cancelled'?'bx':'bp';
    var stLabel=t.status==='done'?'مكتملة':t.status==='cancelled'?'ملغاة':'قيد التنفيذ';
    row.innerHTML='<td style="font-weight:600">'+t.client+'</td>'
      +'<td style="font-size:12px">📍 '+t.from+'</td>'
      +'<td style="font-size:12px">🏁 '+t.to+'</td>'
      +'<td style="font-size:12px">🚗 '+t.car+'<div style="font-size:10px;color:var(--text2)">'+t.pax+' راكب</div></td>'
      +'<td style="font-weight:700;color:var(--gold-d)">'+formatMoney(t.price)+'</td>'
      +'<td style="font-size:11px">'+(t.date||'-')+(t.time?' '+t.time:'')+'</td>'
      +'<td><span class="badge '+stColor+'">'+stLabel+'</span></td>'
      +'<td></td>';
    var td=row.lastElementChild;td.style.display='flex';td.style.gap='4px';td.style.flexWrap='wrap';
    var btnE=document.createElement('button');btnE.className='btn bg2 bsm';btnE.textContent='تعديل';btnE.addEventListener('click',function(){editTransport(t.id);});
    var btnD=document.createElement('button');btnD.className='btn bs3 bsm';btnD.textContent='✓ مكتملة';btnD.addEventListener('click',function(){setTransportStatus(t.id,'done');});
    var btnX=document.createElement('button');btnX.className='btn bd2 bsm';btnX.textContent='حذف';btnX.addEventListener('click',function(){deleteTransport(t.id);});
    td.appendChild(btnE);td.appendChild(btnD);td.appendChild(btnX);tb.appendChild(row);
  });
}

// Load saved transports
try{var st=localStorage.getItem('alyami_transports');if(st)transports=JSON.parse(st);}catch(e){}

function closeOv(id){var el=document.getElementById(id);if(el)el.classList.remove('open');}
document.addEventListener('click',function(e){if(e.target.classList.contains('ov'))e.target.classList.remove('open');});

// ===== ADVANCED STATS & CHARTS =====
function renderAdvancedStats(){
  // Extra stat cards
  var rej=reqs.filter(function(r){return r.status==='rejected';}).length;
  var totalRev=reqs.filter(function(r){return r.paid;}).reduce(function(s,r){return s+(r.amt||0);},0);
  var paidCount=reqs.filter(function(r){return r.paid;}).length;
  var el;
  el=document.getElementById('st-rej');if(el)el.textContent=rej;
  el=document.getElementById('st-rev');if(el)el.textContent=formatMoney(totalRev);
  el=document.getElementById('st-paid');if(el)el.textContent=paidCount;
  el=document.getElementById('st-prov');if(el)el.textContent=providers.length;

  renderVisaChart();
  renderStatusChart();
  renderRevenueSummary();
  renderRecentActivity();
}

function renderVisaChart(){
  var el=document.getElementById('chart-visa-types');if(!el)return;
  var vmap={};visas.forEach(function(v){vmap[v.id]={n:v.n,i:v.i,count:0};});
  reqs.forEach(function(r){if(vmap[r.type])vmap[r.type].count++;});
  var items=Object.values(vmap).filter(function(v){return v.count>0;}).sort(function(a,b){return b.count-a.count;});
  var max=items.length?items[0].count:1;
  if(!items.length){el.innerHTML='<div style="text-align:center;width:100%;color:var(--text3);font-size:12px">لا توجد بيانات بعد</div>';return;}
  el.innerHTML=items.map(function(v){
    var h=Math.max(20,Math.round((v.count/max)*130));
    var colors=['var(--navy)','var(--gold-d)','var(--blue)','var(--green)','var(--purple)','var(--amber)','var(--red)'];
    var c=colors[items.indexOf(v)%colors.length];
    return '<div style="flex:1;text-align:center;min-width:40px"><div style="background:'+c+';height:'+h+'px;border-radius:6px 6px 0 0;margin:0 2px;transition:height .3s;display:flex;align-items:flex-start;justify-content:center;padding-top:4px"><span style="color:white;font-size:11px;font-weight:700">'+v.count+'</span></div><div style="font-size:10px;color:var(--text2);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.i)+' '+esc(v.n)+'</div></div>';
  }).join('');
}

function renderStatusChart(){
  var el=document.getElementById('chart-status');if(!el)return;
  var total=reqs.length||1;
  var counts={pending:0,approved:0,rejected:0,review:0};
  reqs.forEach(function(r){if(counts[r.status]!==undefined)counts[r.status]++;});
  var data=[
    {label:'قيد المراجعة',count:counts.pending+counts.review,color:'var(--amber)'},
    {label:'موافق عليها',count:counts.approved,color:'var(--green)'},
    {label:'مرفوضة',count:counts.rejected,color:'var(--red)'}
  ];
  if(!reqs.length){el.innerHTML='<div style="color:var(--text3);font-size:12px">لا توجد بيانات</div>';return;}
  el.innerHTML='<div style="position:relative;width:130px;height:130px">'
    +'<svg viewBox="0 0 36 36" style="width:130px;height:130px;transform:rotate(-90deg)">'
    +buildDonut(data,total)
    +'</svg>'
    +'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:22px;font-weight:700;color:var(--navy)">'+reqs.length+'</div><div style="font-size:10px;color:var(--text2)">طلب</div></div>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px">'
    +data.map(function(d){return '<div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;border-radius:3px;background:'+d.color+'"></div><span style="font-size:12px;color:var(--text)">'+d.label+'</span><span style="font-size:12px;font-weight:700;color:var(--navy);margin-right:auto">'+d.count+'</span></div>';}).join('')
    +'</div>';
}

function buildDonut(data,total){
  var offset=0;var svg='';
  data.forEach(function(d){
    var pct=(d.count/total)*100;
    var dash=pct;var gap=100-pct;
    svg+='<circle cx="18" cy="18" r="15.9" fill="none" stroke="'+d.color+'" stroke-width="3.2" stroke-dasharray="'+dash+' '+gap+'" stroke-dashoffset="-'+offset+'" />';
    offset+=pct;
  });
  return svg;
}

function renderRevenueSummary(){
  var el=document.getElementById('revenue-summary');if(!el)return;
  var totalRev=reqs.filter(function(r){return r.paid;}).reduce(function(s,r){return s+(r.amt||0);},0);
  var unpaid=reqs.filter(function(r){return !r.paid;}).reduce(function(s,r){return s+(r.amt||0);},0);
  var walletTotal=wcs.reduce(function(s,c){return s+c.bal;},0);
  el.innerHTML=''
    +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>إجمالي المحصّل</span><span style="font-weight:700;color:var(--green)">'+formatMoney(totalRev)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>مبالغ غير محصّلة</span><span style="font-weight:700;color:var(--red)">'+formatMoney(unpaid)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>رصيد العملاء الإجمالي</span><span style="font-weight:700;color:var(--blue)">'+formatMoney(walletTotal)+'</span></div>'
    +'<div style="display:flex;justify-content:space-between;padding:6px 0"><span>عدد العملاء</span><span style="font-weight:700;color:var(--navy)">'+wcs.length+'</span></div>';
}

function renderRecentActivity(){
  var el=document.getElementById('recent-activity');if(!el)return;
  var recent=notifications.slice(0,8);
  if(!recent.length){el.innerHTML='<div style="text-align:center;color:var(--text3);padding:16px">لا توجد نشاطات بعد</div>';return;}
  el.innerHTML=recent.map(function(n){
    return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)"><span style="font-size:16px">'+esc(n.icon)+'</span><div style="flex:1"><div style="font-size:11px;font-weight:600">'+esc(n.title)+'</div><div style="font-size:10px;color:var(--text3)">'+esc(n.time)+' — '+esc(n.date)+'</div></div></div>';
  }).join('');
}

// ===== ADVANCED PERMISSIONS SYSTEM =====
var PERMS={
  admin:{pages:['dash','users','visas','prices','transport','providers','wallets','crm'],actions:['approve','reject','delete','edit','add','export','settings','print']},
  assistant:{pages:['dash','visas','wallets'],actions:['approve','reject','edit','add','print']},
  staff:{pages:['staff','dash'],actions:['approve','reject','print']},
  client:{pages:['portal','wallet','c-requests','c-transport'],actions:['request','transport']}
};

function hasPermission(action){
  var role=cr||'client';
  var perms=PERMS[role];
  if(!perms)return false;
  return perms.actions.indexOf(action)>=0;
}

function canAccessPage(page){
  var role=cr||'client';
  var perms=PERMS[role];
  if(!perms)return false;
  return perms.pages.indexOf(page)>=0;
}

// ===== REALTIME NOTIFICATIONS via Supabase =====
var realtimeChannel=null;

function startRealtime(){
  if(!tok||realtimeChannel)return;
  try{
    // Poll Supabase every 30 seconds for changes (lightweight realtime)
    realtimeChannel=setInterval(function(){
      sbGet('visa_requests').then(function(newReqs){
        if(!newReqs)return;
        var oldLen=reqs.length;
        if(newReqs.length>oldLen){
          var diff=newReqs.length-oldLen;
          addNotif('req','📋 طلبات جديدة','وصل '+diff+' طلب جديد','📋');
        }
        // Check for status changes
        newReqs.forEach(function(nr){
          var old=reqs.find(function(r){return r.id===nr.id;});
          if(old&&old.status!==nr.status){
            if(nr.status==='approved')addNotif('approve','✅ تمت الموافقة على طلب '+nr.id,'تغيرت حالة الطلب','✅');
            else if(nr.status==='rejected')addNotif('reject','❌ رُفض طلب '+nr.id,'تغيرت حالة الطلب','❌');
          }
        });
      }).catch(function(){});
    },30000);
  }catch(e){}
}

function stopRealtime(){
  if(realtimeChannel){clearInterval(realtimeChannel);realtimeChannel=null;}
}

// AUTO REFRESH DATA EVERY 60 SECONDS
setInterval(function(){
  if(tok && cr !== 'client'){
    loadData().then(function(){
      if(cr==='admin'||cr==='assistant'){renderReqs();}
      else if(cr==='staff'){renderStaff();renderReqs();}
    }).catch(function(){});
  }
}, 60000);

// ===== PERFORMANCE: Debounce search =====
var searchTimer=null;
document.addEventListener('input',function(e){
  if(e.target.classList.contains('sr')){
    clearTimeout(searchTimer);
    searchTimer=setTimeout(function(){
      var q=e.target.value.toLowerCase();
      var rows=e.target.closest('.card').querySelectorAll('tbody tr');
      rows.forEach(function(r){
        var text=r.textContent.toLowerCase();
        r.style.display=text.includes(q)?'':'none';
      });
    },300);
  }
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  if(e.key==='Escape'){
    document.querySelectorAll('.ov.open').forEach(function(o){o.classList.remove('open');});
  }
  if(e.ctrlKey&&e.key==='n'&&cr==='admin'){e.preventDefault();openReq();}
});

// ===== SESSION TIMEOUT (30 min) =====
var sessionTimer=null;
function resetSessionTimer(){
  clearTimeout(sessionTimer);
  sessionTimer=setTimeout(function(){
    if(tok){
      addNotif('system','⏰ انتهت الجلسة','تم تسجيل الخروج تلقائياً بسبب عدم النشاط','⏰');
      logout();
      alert('تم تسجيل الخروج تلقائياً بسبب عدم النشاط لمدة 30 دقيقة');
    }
  },30*60*1000);
}
['click','keypress','scroll','mousemove'].forEach(function(ev){
  document.addEventListener(ev,resetSessionTimer,{passive:true});
});
resetSessionTimer();

// ===== CLIENT DASHBOARD & TRANSPORT =====

function renderClientDashboard(){
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  var cdReqs=document.getElementById('cd-reqs');if(cdReqs)cdReqs.textContent=mine.length;
  var cdBal=document.getElementById('cd-bal');if(cdBal)cdBal.textContent=formatMoney(wb);
  var myTrips=transports.filter(function(t){return t.clientPhone===cu.phone;});
  var cdTrips=document.getElementById('cd-trips');if(cdTrips)cdTrips.textContent=myTrips.length;

  // Render docs list from requests
  var docsEl=document.getElementById('c-docs-list');
  if(docsEl){
    var allDocs=[];
    mine.forEach(function(r){
      if(r.docUrls){
        if(r.docUrls.passport)allDocs.push({type:'🛂 جواز سفر',url:r.docUrls.passport,reqId:r.id});
        if(r.docUrls.ticket)allDocs.push({type:'🎫 تذكرة',url:r.docUrls.ticket,reqId:r.id});
        if(r.docUrls.photo)allDocs.push({type:'🖼️ صورة شخصية',url:r.docUrls.photo,reqId:r.id});
        if(r.docUrls.extra)allDocs.push({type:'📋 مستند إضافي',url:r.docUrls.extra,reqId:r.id});
      }
    });
    if(allDocs.length){
      docsEl.innerHTML=allDocs.map(function(d){
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px"><span>'+d.type+' <span style="color:var(--text3);font-size:10px">('+d.reqId+')</span></span><button class="btn bsm bo2" onclick="printDoc(\''+d.url+'\')">🖨️ طباعة</button></div>';
      }).join('');
    } else {
      docsEl.innerHTML='<div style="text-align:center;padding:16px;color:var(--text3);font-size:11px">لا توجد مستندات</div>';
    }
  }
}

function printDoc(url){
  var w=window.open('','_blank');
  w.document.write('<html dir="rtl"><head><title>طباعة المستند</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:95vh}@media print{body{margin:0}}</style></head><body><img src="'+url+'" onload="window.print();"></body></html>');
  w.document.close();
}

function renderClientReqsFull(){
  var el=document.getElementById('c-reqs-full');
  if(!el)return;
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  if(!mine.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:12px">لا توجد طلبات<br><br><button class="btn bg2 bsm" onclick="openReq()">+ اطلب الآن</button></div>';return;}
  el.innerHTML=mine.map(function(r,idx){
    var st=SL[r.status]||r.status;
    var badge=r.status==='approved'?'ba2':r.status==='rejected'?'bx':'bp';
    var btns=[];
    if(r.docUrls){
      if(r.docUrls.passport)btns.push('<button class="btn bsm bo2" style="font-size:10px" onclick="printDoc(\''+r.docUrls.passport+'\')">🛂 الجواز</button>');
      if(r.docUrls.ticket)btns.push('<button class="btn bsm bo2" style="font-size:10px" onclick="printDoc(\''+r.docUrls.ticket+'\')">🎫 التذكرة</button>');
    }
    if(r.status==='approved'){
      btns.push('<button class="btn bsm bg2" style="font-size:10px;background:var(--green);color:#fff" onclick="clientPrintVisa('+idx+')">📄 استخراج التأشيرة</button>');
    }
    if(r.status==='pending'){
      btns.push('<button class="btn bsm bo2" style="font-size:10px" onclick="clientEditReq(\''+r.id+'\')">✏️ تعديل</button>');
      btns.push('<button class="btn bsm bd2" style="font-size:10px" onclick="clientCancelReq(\''+r.id+'\')">❌ إلغاء</button>');
    }
    if(r.status==='cancelled'){badge='bx';st='ملغى';}
    var docs=btns.length?'<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">'+btns.join('')+'</div>':'';
    return '<div class="card" style="padding:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:start"><div><div style="font-weight:700;font-size:13px">'+r.type+'</div><div style="font-size:10px;color:var(--text3);font-family:monospace;margin-top:2px">'+r.id+' | '+r.date+'</div>'+(r.name_en?'<div style="font-size:11px;margin-top:3px">'+r.name+' / '+r.name_en+'</div>':'')+(r.passport?'<div style="font-size:11px;color:var(--text2)">جواز: '+r.passport+'</div>':'')+(r.route_from&&r.route_to?'<div style="font-size:11px;color:var(--text2)">✈️ '+r.route_from+' → '+r.route_to+(r.travel_date?' | '+r.travel_date:'')+'</div>':'')+docs+'</div><span class="badge '+badge+'">'+st+'</span></div></div>';
  }).join('');
}

function clientPrintVisa(idx){
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  if(!mine[idx])return;
  printVisa(mine[idx]);
}

// Client Export PDF
function clientExportPDF(){
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  if(!mine.length){alert('لا توجد طلبات للطباعة');return;}
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var rows=mine.map(function(r,i){
    var v=vmap[r.type]||{};
    return '<tr>'
      +'<td>'+(i+1)+'</td>'
      +'<td style="font-weight:600">'+r.name+'</td>'
      +'<td>'+(r.name_en||'-')+'</td>'
      +'<td dir="ltr">'+(r.passport||'-')+'</td>'
      +'<td>'+(r.dob||'-')+'</td>'
      +'<td>'+(v.n||r.type)+'</td>'
      +'<td>'+(r.airline||'-')+'</td>'
      +'<td>'+((r.route_from&&r.route_to)?r.route_from+' → '+r.route_to:'-')+'</td>'
      +'<td>'+(r.travel_date||'-')+'</td>'
      +'<td>'+formatMoney(r.amt)+'</td>'
      +'<td>'+(SL[r.status]||r.status)+'</td>'
      +'</tr>';
  }).join('');
  var totalAmt=mine.reduce(function(s,r){return s+r.amt;},0);
  var html='<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>كشف طلبات — '+cu.name+'</title>'
    +'<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:30px;color:#1a1a2e}'
    +'.header{text-align:center;margin-bottom:24px;border-bottom:3px solid #C49A3C;padding-bottom:16px}'
    +'.header h1{font-size:20px;color:#0D1B3E}.header h2{font-size:14px;color:#C49A3C;margin-top:4px}'
    +'.info{display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;color:#555}'
    +'table{width:100%;border-collapse:collapse;font-size:11px}th{background:#0D1B3E;color:#fff;padding:8px 6px;text-align:right}'
    +'td{padding:7px 6px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f9f9f9}'
    +'.footer{margin-top:20px;text-align:center;font-size:10px;color:#999;border-top:2px solid #C49A3C;padding-top:12px}'
    +'.total{text-align:left;margin-top:12px;font-size:13px;font-weight:700;color:#0D1B3E}'
    +'@media print{body{padding:15px}}</style></head><body>'
    +'<div class="header"><h1>اليامي للسفر والسياحة</h1><h2>كشف الأسماء والطلبات</h2></div>'
    +'<div class="info"><span>العميل: <strong>'+cu.name+'</strong></span><span>الهاتف: '+(cu.phone||'-')+'</span><span>التاريخ: '+new Date().toLocaleDateString('ar-SA')+'</span><span>عدد الطلبات: '+mine.length+'</span></div>'
    +'<table><thead><tr><th>#</th><th>الاسم (عربي)</th><th>الاسم (إنجليزي)</th><th>رقم الجواز</th><th>تاريخ الميلاد</th><th>نوع التأشيرة</th><th>خط الطيران</th><th>الرحلة</th><th>تاريخ السفر</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>'
    +rows
    +'</tbody></table>'
    +'<div class="total">الإجمالي: '+formatMoney(totalAmt)+'</div>'
    +'<div class="footer">اليامي للسفر والسياحة — نظام إصدار التأشيرات<br>تم الإنشاء: '+new Date().toLocaleString('ar-SA')+'</div>'
    +'</body></html>';
  var w=window.open('','_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(function(){w.print();},500);
}

// Client Export Excel
function clientExportExcel(){
  var mine=reqs.filter(function(r){return r.cid===cu.phone;});
  if(!mine.length){alert('لا توجد طلبات للتصدير');return;}
  var vmap={};visas.forEach(function(v){vmap[v.id]=v;});
  var header='#\tالاسم (عربي)\tالاسم (إنجليزي)\tرقم الجواز\tتاريخ الميلاد\tنوع التأشيرة\tخط الطيران\tمن\tإلى\tتاريخ السفر\tالمبلغ\tالحالة\n';
  var rows=mine.map(function(r,i){
    var v=vmap[r.type]||{};
    return [(i+1),r.name,r.name_en||'',r.passport||'',r.dob||'',v.n||r.type,r.airline||'',r.route_from||'',r.route_to||'',r.travel_date||'',formatMoney(r.amt),SL[r.status]||r.status].join('\t');
  }).join('\n');
  var content='\uFEFF'+header+rows;
  var blob=new Blob([content],{type:'text/tab-separated-values;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='طلبات-'+cu.name+'-'+new Date().toISOString().slice(0,10)+'.xls';
  a.click();URL.revokeObjectURL(url);
}

// Client Transport
function selCTType(btn,type){
  document.querySelectorAll('.ct-type-btn').forEach(function(b){b.className='btn bo2 ct-type-btn';});
  btn.className='btn bg2 ct-type-btn on';
  document.getElementById('ct-type').value=type;
}

function openClientTransport(){
  ['ct-from','ct-to','ct-date','ct-time','ct-notes'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('ct-pax').value='1';
  document.getElementById('ct-price').value='50';
  document.getElementById('ct-type').value='استقبال';
  document.querySelectorAll('.ct-type-btn').forEach(function(b,i){b.className='btn '+(i===0?'bg2':'bo2')+' ct-type-btn'+(i===0?' on':'');});
  var balInfo=document.getElementById('ct-bal-info');
  var balShow=document.getElementById('ct-bal-show');
  if(balInfo&&cr==='client'){balInfo.style.display='block';if(balShow)balShow.textContent=formatMoney(wb);}
  document.getElementById('ov-c-transport').classList.add('open');
}

function submitClientTransport(){
  var from=document.getElementById('ct-from').value.trim();
  var to=document.getElementById('ct-to').value.trim();
  var date=document.getElementById('ct-date').value;
  var price=parseFloat(document.getElementById('ct-price').value)||0;
  if(!from||!to){alert('أدخل نقطة الانطلاق والوجهة');return;}
  if(!date){alert('اختر التاريخ');return;}

  // Deduct from wallet if client
  if(cr==='client'&&price>0){
    if(wb<price){
      alert('رصيدك غير كافٍ!\n\nرصيدك الحالي: '+formatMoney(wb)+'\nسعر الخدمة: '+formatMoney(price));
      return;
    }
    if(!confirm('⚠️ تأكيد خصم سعر النقل\n\nسعر الخدمة: '+formatMoney(price)+'\nرصيدك الحالي: '+formatMoney(wb)+'\nرصيدك بعد الخصم: '+formatMoney(wb-price)+'\n\nهل تريد المتابعة؟'))return;
    wb=parseFloat((wb-price).toFixed(2));
    document.getElementById('w-bal').textContent=formatMoney(wb);
    document.getElementById('bal-n').textContent=formatMoney(wb);
    // Update in wcs too
    var myWC=wcs.find(function(c){return c.phone===cu.phone;});
    if(myWC){myWC.bal=wb;sbSaveWC(myWC);}
  }

  var trip={
    id:Date.now(),
    client:cu.name||'عميل',
    clientPhone:cu.phone||'',
    type:document.getElementById('ct-type').value,
    from:from,to:to,
    car:document.getElementById('ct-car').value,
    pax:parseInt(document.getElementById('ct-pax').value)||1,
    date:date,
    time:document.getElementById('ct-time').value||'',
    notes:document.getElementById('ct-notes').value||'',
    price:price,
    paid:cr==='client'&&price>0,
    status:'pending'
  };

  transports.push(trip);
  try{localStorage.setItem('alyami_transports',JSON.stringify(transports));}catch(e){}
  addNotif('transport','🚗 طلب نقل جديد — '+cu.name,trip.type+': '+trip.from+' → '+trip.to+' | '+trip.date+(price>0?' | '+formatMoney(price):''),'🚗');
  closeOv('ov-c-transport');
  renderClientTransport();renderTransport();renderClientDashboard();
  alert('✅ تم إرسال طلب النقل!'+(price>0?'\n💰 تم خصم '+formatMoney(price)+' من رصيدك':'\nسيتم التواصل معك لتأكيد الحجز.'));
}

function renderClientTransport(){
  var el=document.getElementById('c-transport-list');
  if(!el)return;
  var mine=transports.filter(function(t){return t.clientPhone===cu.phone;});
  if(!mine.length){el.innerHTML='<div style="text-align:center;padding:30px;color:var(--text3);font-size:12px">لا توجد طلبات نقل<br><br><button class="btn bg2 bsm" onclick="openClientTransport()">+ اطلب الآن</button></div>';return;}
  el.innerHTML=mine.map(function(t){
    var stColor=t.status==='done'?'var(--green)':t.status==='cancelled'?'var(--red)':'var(--amber)';
    var stText=t.status==='done'?'مكتملة':t.status==='cancelled'?'ملغاة':'قيد التنفيذ';
    var typeIcon=t.type==='مغادرة'?'🛫':'🛬';
    return '<div class="card" style="padding:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:start"><div><div style="font-weight:700;font-size:13px">'+typeIcon+' '+t.type+'</div><div style="font-size:12px;margin-top:4px">📍 '+t.from+' → 🏁 '+t.to+'</div><div style="font-size:11px;color:var(--text2);margin-top:3px">📅 '+t.date+(t.time?' | ⏰ '+t.time:'')+(t.pax?' | 👥 '+t.pax+' ركاب':'')+'</div>'+(t.car?'<div style="font-size:11px;color:var(--text2)">🚗 '+t.car+'</div>':'')+(t.notes?'<div style="font-size:10px;color:var(--text3);margin-top:2px">'+t.notes+'</div>':'')+'</div><span style="font-size:11px;font-weight:600;color:'+stColor+'">'+stText+'</span></div></div>';
  }).join('');
}

// ===== SETTINGS =====
function renderSettings(){
  var ri=document.getElementById('rate-input');if(ri)ri.value=usdToLyd;
  var ei=document.getElementById('egp-rate-input');if(ei)ei.value=usdToEgp;
  var fl=document.getElementById('font-size-label');if(fl)fl.textContent=fontSize;
  // Logo preview
  var prev=document.getElementById('logo-preview');
  if(prev){var cur=document.querySelector('.sb-head img');if(cur)prev.src=cur.src;}
  // Currency buttons highlight
  ['usd','lyd','egp'].forEach(function(c){
    var btn=document.getElementById('cur-'+c);
    if(btn)btn.className='btn bsm '+(curCurrency===c.toUpperCase()?'bg2':'bo2');
  });
  // Stats
  var el;
  el=document.getElementById('set-reqs');if(el)el.textContent=reqs.length;
  el=document.getElementById('set-users');if(el)el.textContent=users.length;
  el=document.getElementById('set-wcs');if(el)el.textContent=wcs.length;
  el=document.getElementById('set-visas');if(el)el.textContent=visas.length;
  el=document.getElementById('set-provs');if(el)el.textContent=providers.length;
  el=document.getElementById('set-trans');if(el)el.textContent=transports.length;
  el=document.getElementById('set-last-sync');if(el)el.textContent=new Date().toLocaleString('ar-SA');
}

function setCurPref(cur){
  curCurrency=cur;
  try{localStorage.setItem('alyami_currency',curCurrency);}catch(e){}
  updateCurrencyBtn();refreshAllMoney();renderSettings();
}

function exportAllData(){
  var data={
    version:'alyami-v2026',
    exported:new Date().toISOString(),
    reqs:reqs,users:users,wcs:wcs,visas:visas,providers:providers,txs:txs,accInvoices:accInvoices,accAccounts:accAccounts,
    transports:transports,priceList:priceList,topupReqs:topupReqs,
    notifications:notifications,
    settings:{currency:curCurrency,usdToLyd:usdToLyd,usdToEgp:usdToEgp,fontSize:fontSize}
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='alyami-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();URL.revokeObjectURL(url);
}

function importAllData(input){
  var file=input.files&&input.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!data.version||!data.version.startsWith('alyami')){alert('ملف غير صالح');return;}
      if(!confirm('⚠️ هل تريد استيراد البيانات؟\nسيتم استبدال كل البيانات الحالية!\n\nالطلبات: '+(data.reqs?data.reqs.length:0)+'\nالموظفون: '+(data.users?data.users.length:0)+'\nالعملاء: '+(data.wcs?data.wcs.length:0)))return;
      if(data.reqs)reqs=data.reqs;
      if(data.users)users=data.users;
      if(data.wcs)wcs=data.wcs;
      if(data.visas)visas=data.visas;
      if(data.providers)providers=data.providers;
      if(data.txs)txs=data.txs;
      if(data.accInvoices)accInvoices=data.accInvoices;
      if(data.accAccounts)accAccounts=data.accAccounts;
      if(data.transports)transports=data.transports;
      if(data.priceList)priceList=data.priceList;
      if(data.topupReqs)topupReqs=data.topupReqs;
      if(data.settings){
        if(data.settings.currency)curCurrency=data.settings.currency;
        if(data.settings.usdToLyd)usdToLyd=data.settings.usdToLyd;
        if(data.settings.usdToEgp)usdToEgp=data.settings.usdToEgp;
        if(data.settings.fontSize)fontSize=data.settings.fontSize;
      }
      lsSave();
      try{localStorage.setItem('alyami_transports',JSON.stringify(transports));}catch(ex){}
      try{localStorage.setItem('alyami_prices',JSON.stringify(priceList));}catch(ex){}
      try{localStorage.setItem('alyami_topup_reqs',JSON.stringify(topupReqs));}catch(ex){}
      alert('✅ تم استيراد البيانات بنجاح!\nسيتم إعادة تحميل الصفحة.');
      location.reload();
    }catch(err){alert('خطأ في قراءة الملف: '+err.message);}
  };
  reader.readAsText(file);
}

// ===== MOBILE MENU =====
function toggleMobMenu(){
  var sb=document.querySelector('.sidebar');
  var ov=document.getElementById('mob-overlay');
  var btn=document.getElementById('mob-btn');
  if(!sb)return;
  var isOpen=sb.classList.contains('mob-open');
  sb.classList.toggle('mob-open',!isOpen);
  ov.classList.toggle('show',!isOpen);
  btn.classList.toggle('open',!isOpen);
}
// Close mobile menu when navigating
var origGoP=goP;
goP=function(id,el){
  origGoP(id,el);
  var sb=document.querySelector('.sidebar');
  if(sb&&sb.classList.contains('mob-open'))toggleMobMenu();
};
