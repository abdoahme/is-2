/* IS Motors Accounting & Administration Portal
   Uses the public Supabase publishable key only. Row-level security remains the authority.
*/
(function () {
  "use strict";
  const CONFIG = {
    url: "https://xnogogvdxforrpdijuuu.supabase.co",
    publishableKey: "sb_publishable_Hgm9b9fTqPS9RWm7QGdeJA_dx4FBZ0m"
  };
  const db = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  const num = (value) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const raw = String(value == null ? "" : value).trim();
    if (!raw) return 0;
    const normalized = raw
      .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
      .replace(/\u066B/g, ".")
      .replace(/[\u066C,\s\u00A0]/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (value) => num(value).toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " ج.م";
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dateText = (value) => value ? esc(value) : "—";
  const makeId = () => "row_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const emptyState = () => ({
    cars: [], expenses: [], debts: [], capital: [], partnerMovements: [],
    closings: {annual:{}, halves:{}, months:{}, snapshots:[]},
    documents: [], actualCash: null, periodFilter: {type:"ALL", year:new Date().getFullYear(), month:new Date().getMonth()+1},
    appSettings: {name:"IS Motors"}
  });
  const titles = {
    overview:"الرئيسية", cars:"السيارات", expenses:"المصروفات",
    receivables:"المبالغ المتبقية", debts:"الذمم والأقساط",
    capital:"رأس المال والخزينة", partners:"حركة الشركاء",
    cashbook:"دفتر الحركة والخزينة", inventory:"مخزون السيارات والأرباح",
    customers:"حسابات العملاء", reminders:"التنبيهات والاستحقاقات",
    audit:"سجل المراجعة", backups:"النسخ الاحتياطي", management:"اقتراحات الإدارة",
    reports:"التقارير والتقفيل", monthlyClosing:"التقفيل الشهري",
    yearlyClosing:"التقفيل السنوي", requests:"طلبات الموظفين", settings:"الإعدادات والروابط"
  };

  const schemas = {
    cars: {
      title:"السيارة",
      fields:[
        {key:"model",label:"بيان السيارة / الموديل",required:true},
        {key:"date",label:"تاريخ الحركة",type:"date"},
        {key:"chassis",label:"رقم الشاسيه"},
        {key:"purchasePrice",label:"سعر الشراء",type:"number"},
        {key:"partnerName",label:"اسم الشريك المساهم (اختياري)"},
        {key:"partnerContribution",label:"مبلغ مساهمة الشريك",type:"number"},
        {key:"partnerSharePercent",label:"نسبة ربح الشريك المتفق عليها % (اختياري)",type:"number"},
        {key:"partnerPaymentMethod",label:"طريقة إيداع الشراكة",type:"select",options:["نقداً بالخزينة","تحويل بنكي","شيك بنكي","إيداع بنكي مباشر"]},
        {key:"prepCost",label:"مصاريف التجهيز",type:"number"},
        {key:"salePrice",label:"إجمالي سعر البيع",type:"number"},
        {key:"status",label:"حالة السيارة",type:"select",options:["قيد البيع","كاش","متبقي","تقسيط","مباع"]},
        {key:"nextDueDate",label:"موعد القسط القادم (اختياري)",type:"date"},
        {key:"customer",label:"اسم العميل"},
        {key:"phone",label:"رقم الهاتف",type:"tel"},
        {key:"notes",label:"ملاحظات",type:"textarea",full:true}
      ]
    },
    expenses: {
      title:"المصروف",
      fields:[
        {key:"date",label:"التاريخ",type:"date"},
        {key:"category",label:"بند المصروف",type:"select",options:["إيجار","رواتب وأجور","كهرباء ومرافق","مستلزمات","صيانة","تسويق وإعلانات","انتقالات","رسوم حكومية","أخرى"]},
        {key:"description",label:"البيان",required:true},
        {key:"amount",label:"المبلغ",type:"number",required:true},
        {key:"paymentMethod",label:"طريقة الدفع",type:"select",options:["نقداً","تحويل بنكي","شيك","بطاقة","أخرى"]},
        {key:"recipient",label:"المستلم / المورد"},
        {key:"notes",label:"ملاحظات",type:"textarea",full:true}
      ]
    },
    debts: {
      title:"الذمة / القسط",
      fields:[
        {key:"partyName",label:"اسم العميل / الجهة",required:true},
        {key:"nature",label:"طبيعة المبلغ",type:"select",options:["لنا (مستحق للمعرض)","علينا (مستحق على المعرض)"]},
        {key:"description",label:"البيان"},
        {key:"totalAmount",label:"إجمالي المبلغ",type:"number",required:true},
        {key:"paidAmount",label:"المبلغ المسدد",type:"number"},
        {key:"dueDate",label:"تاريخ الاستحقاق",type:"date"},
        {key:"status",label:"الحالة",type:"select",options:["منتظم","متأخر","قيد المتابعة","تم السداد"]},
        {key:"phone",label:"رقم الهاتف",type:"tel"},
        {key:"notes",label:"ملاحظات",type:"textarea",full:true}
      ]
    },
    capital: {
      title:"حركة رأس المال",
      fields:[
        {key:"date",label:"التاريخ",type:"date"},
        {key:"partner",label:"الشريك / المودع",required:true},
        {key:"movementType",label:"نوع الحركة",type:"select",options:["إيداع رأس مال","زيادة رأس مال","مسحوبات أرباح شركاء","مسحوبات شخصية شركاء","تمويل إضافي / جاري شريك","استرداد مسحوبات"]},
        {key:"deposited",label:"المودع (داخل)",type:"number"},
        {key:"withdrawn",label:"المسحوب (خارج)",type:"number"},
        {key:"method",label:"طريقة المعاملة",type:"select",options:["نقداً بالخزينة","تحويل بنكي","شيك بنكي","إيداع بنكي مباشر","رصيد افتتاحي"]},
        {key:"receiptNo",label:"رقم الإيصال"},
        {key:"profitLossType",label:"نوع الربح / الخسارة",type:"select",options:["","ربح من شخص","خسارة لشخص"]},
        {key:"profitLossAmount",label:"قيمة الربح / الخسارة",type:"number"},
        {key:"description",label:"البيان",type:"textarea",full:true}
      ]
    },
    financialTransactions: {
      title:"حركة مالية جديدة",
      fields:[
        {key:"date",label:"تاريخ الحركة",type:"date",required:true},
        {key:"category",label:"نوع الحركة",type:"select",options:["تحصيل من عميل","سداد ثمن شراء سيارة","سداد تجهيز سيارة","حركة واردة أخرى","حركة منصرفة أخرى"],required:true},
        {key:"payment_method",label:"طريقة الدفع",type:"select",options:["نقداً","تحويل بنكي","شيك","بطاقة","أخرى"],required:true},
        {key:"amount",label:"المبلغ",type:"number",required:true},
        {key:"car_id",label:"السيارة المرتبطة (عند الحاجة)",type:"select",options:[]},
        {key:"person_name",label:"اسم العميل / المورد"},
        {key:"reference",label:"رقم الإيصال / المرجع"},
        {key:"description",label:"البيان والملاحظات",type:"textarea",full:true}
      ]
    },
    partnerPayouts: {
      title:"سحب من رصيد شريك",
      fields:[
        {key:"date",label:"تاريخ السحب",type:"date"},
        {key:"partner",label:"الشريك",type:"select",options:[],required:true},
        {key:"amount",label:"مبلغ السحب",type:"number",required:true},
        {key:"method",label:"طريقة الصرف",type:"select",options:["نقداً من الخزينة","تحويل بنكي","شيك بنكي","أخرى"]},
        {key:"description",label:"بيان السحب",type:"textarea",full:true}
      ]
    }
  };
  let session = null;
  let role = null;
  let state = emptyState();
  let recordId = null;
  let requests = [];
  let financialTransactions = [];
  let cashReconciliations = [];
  let auditEntries = [];
  let backupEntries = [];
  let financialLedgerLoaded = false;
  let persistedState = null;
  let selectedCustomer = "";
  let currentView = "overview";
  let editingCollection = null;
  let editingId = null;
  let saving = false;
  let reportYear = "ALL";
  let reportMonth = "ALL";
  const currentLocal = new Date();
  let closeYear = String(currentLocal.getMonth() === 0 ? currentLocal.getFullYear()-1 : currentLocal.getFullYear());
  let closeMonth = currentLocal.getMonth() === 0 ? 12 : currentLocal.getMonth();
  let closeAnnualYear = String(currentLocal.getFullYear()-1);
  let toastTimer = null;

  function toast(message, type) {
    const box = $("toast");
    box.textContent = message;
    box.className = "toast show " + (type || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.className = "toast"; }, 3600);
  }
  function setSync(text, mode) {
    const el = $("syncBadge");
    if (!el) return;
    el.textContent = "● " + text;
    el.className = "sync-badge " + (mode || "");
  }
  function showLogin() {
    $("bootScreen").hidden = true;
    $("loginScreen").hidden = false;
    $("appShell").hidden = true;
    $("employeeShell").hidden = true;
  }
  function showLoading(message) {
    $("bootScreen").hidden = false;
    $("bootScreen").querySelector(".muted").textContent = message || "جاري الاتصال...";
    $("loginScreen").hidden = true;
    $("appShell").hidden = true;
    $("employeeShell").hidden = true;
  }
  function normaliseState(payload) {
    const base = emptyState();
    const source = payload && typeof payload === "object" ? payload : {};
    const incoming = source.state && typeof source.state === "object" ? Object.assign({}, source.state, source) : source;
    Object.keys(base).forEach((key) => {
      if (incoming[key] !== undefined && incoming[key] !== null) base[key] = incoming[key];
    });
    ["cars","expenses","debts","capital","partnerMovements","documents"].forEach((key) => {
      if (!Array.isArray(base[key])) base[key] = [];
    });
    if (!base.closings || typeof base.closings !== "object") base.closings = {};
    base.closings = Object.assign({annual:{},halves:{},months:{},snapshots:[],audit:[]},base.closings);
    if (!base.closings.months || typeof base.closings.months !== "object") base.closings.months = {};
    if (!base.closings.annual || typeof base.closings.annual !== "object") base.closings.annual = {};
    if (!Array.isArray(base.closings.snapshots)) base.closings.snapshots = [];
    if (!Array.isArray(base.closings.audit)) base.closings.audit = [];
    if (!base.appSettings || typeof base.appSettings !== "object") base.appSettings = {name:"IS Motors"};
    return base;
  }

  async function boot(authSession) {
    if (!authSession || !authSession.user) return showLogin();
    if (saving || (session && session.user && session.user.id === authSession.user.id && role)) return;
    showLoading("جارٍ التحقق من صلاحية الحساب...");
    session = authSession;
    try {
      const roleResult = await db.rpc("get_my_is_motors_role");
      if (roleResult.error) throw roleResult.error;
      role = roleResult.data;
      if (role === "admin") {
        await loadAdminState();
        await loadFinancialOperations();
        await loadRequests();
        $("bootScreen").hidden = true;
        $("employeeShell").hidden = true;
        $("appShell").hidden = false;
        $("roleBadge").textContent = "مدير النظام";
        $("userLine").textContent = session.user.email || "";
        currentView = "overview";
        render();
      } else if (role === "user") {
        $("bootScreen").hidden = true;
        $("appShell").hidden = true;
        $("employeeShell").hidden = false;
        $("requestDate").value = today();
      } else {
        throw new Error("هذا الحساب غير مضاف إلى صلاحيات النظام. تواصل مع مدير المعرض.");
      }
    } catch (error) {
      role = null;
      showLogin();
      $("loginError").textContent = error.message || "تعذر التحقق من صلاحية الحساب.";
      toast(error.message || "تعذر فتح النظام", "error");
    }
  }

  async function loadAdminState() {
    setSync("تحميل البيانات", "busy");
    const result = await db.from("app_records")
      .select("id,payload,updated_at")
      .eq("user_id", session.user.id)
      .eq("record_type", "settings")
      .eq("record_key", "main")
      .maybeSingle();
    if (result.error) throw result.error;
    if (result.data) {
      recordId = result.data.id;
      state = normaliseState(result.data.payload);
      persistedState = clone(state);
    } else {
      recordId = null;
      state = emptyState();
      persistedState = clone(state);
      const created = await saveState(true);
      if (!created) throw new Error("تعذر إنشاء سجل الحساب في قاعدة البيانات. لم يتم فتح بيانات غير محفوظة.");
    }
    setSync("متصل", "");
  }

  async function saveState(silent) {
    if (role !== "admin" || !session || !session.user) throw new Error("لا توجد صلاحية للحفظ.");
    if (saving) return false;
    saving = true;
    setSync("حفظ التعديلات", "busy");
    try {
      const payload = clone(state);
      if (recordId) {
        const result = await db.from("app_records")
          .update({payload:payload, updated_at:new Date().toISOString()})
          .eq("id", recordId)
          .select("id")
          .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data || !result.data.id) throw new Error("لم تؤكد قاعدة البيانات حفظ التعديلات؛ لم يتم اعتماد العملية.");
      } else {
        const result = await db.from("app_records")
          .insert({user_id:session.user.id,record_type:"settings",record_key:"main",payload:payload})
          .select("id").single();
        if (result.error) throw result.error;
        recordId = result.data.id;
      }
      setSync("تم الحفظ", "");
      if (!silent) toast("تم حفظ التعديلات في قاعدة البيانات.", "success");
      if(persistedState) await writeStateAudit(persistedState,payload);
      persistedState=clone(payload);
      if(financialLedgerLoaded){
        try{await syncCashbookWithAppState(payload);}
        catch(ledgerError){console.warn("cashbook sync pending",ledgerError.message);toast("تم حفظ بيانات النظام، لكن تعذر تحديث دفتر الحركة تلقائيًا. راجع حالة الاتصال.", "error");}
      }
      return true;
    } catch (error) {
      setSync("تعذر الحفظ", "offline");
      if (!silent) toast("لم يتم الحفظ: " + (error.message || "خطأ غير معروف"), "error");
      return false;
    } finally {
      saving = false;
    }
  }

  function dbPaymentMethod(value) {
    const method=String(value||"").trim();
    if (["نقداً","نقداً بالخزينة","نقداً من الخزينة"].includes(method)) return "cash";
    if (["تحويل بنكي","إيداع بنكي مباشر"].includes(method)) return "bank_transfer";
    if (["شيك","شيك بنكي"].includes(method)) return "check";
    if (method==="بطاقة") return "card";
    if (["cash","bank_transfer","check","card","other"].includes(method)) return method;
    return "other";
  }

  function sameSourceMovement(existing,desired) {
    return existing.transaction_date===desired.transaction_date &&
      existing.direction===desired.direction &&
      existing.category===desired.category &&
      existing.payment_method===desired.payment_method &&
      Math.abs(amount(existing.amount)-amount(desired.amount))<0.0001;
  }

  async function insertFinancialTransaction(payload) {
    const row=Object.assign({
      user_id:session.user.id,created_by:session.user.id,source_key:"manual:"+makeId()
    },payload);
    const result=await db.from("financial_transactions").insert(row).select("*").single();
    if(result.error) throw result.error;
    financialTransactions.unshift(result.data);
    return result.data;
  }

  async function reverseFinancialTransaction(original,reason) {
    if (!original || original.category==="reversal") return null;
    if (financialTransactions.some(t=>String(t.reversal_of||"")===String(original.id))) return null;
    return insertFinancialTransaction({
      transaction_date:today(),direction:original.direction==="inflow"?"outflow":"inflow",
      category:"reversal",payment_method:original.payment_method||"other",amount:amount(original.amount),
      car_id:original.car_id||null,person_name:original.person_name||"",
      description:"عكس حركة "+(original.description||original.category)+" — "+String(reason||"تسوية محاسبية"),
      reference:original.reference||null,source_type:original.source_type||"manual",
      source_id:original.source_id||original.id,reversal_of:original.id,is_legacy:false
    });
  }

  function desiredAppCashMovements(sourceState) {
    const output=[];
    (sourceState.expenses||[]).forEach(item=>{
      if (!item || !item.id || amount(item.amount)<=0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.date||""))) return;
      output.push({
        user_id:session.user.id,transaction_date:item.date,direction:"outflow",category:"expense",
        payment_method:dbPaymentMethod(item.paymentMethod),amount:amount(item.amount),
        person_name:item.recipient||"",description:item.description||item.category||"مصروف",
        reference:item.receiptNo||"",source_type:"expense",source_id:String(item.id),is_legacy:false
      });
    });
    (sourceState.cars||[]).filter(car=>String(car.status||"")==="كاش" && amount(car.salePrice)>0 && car.id).forEach(car=>{
      const reversed=new Set(financialTransactions.filter(tx=>tx.reversal_of).map(tx=>String(tx.reversal_of)));
      const previousAuto=financialTransactions.find(tx=>String(tx.car_id||"")===String(car.id)&&tx.source_type==="car_cash"&&tx.category==="car_collection");
      if(previousAuto && !reversed.has(String(previousAuto.id))){
        output.push({
          user_id:session.user.id,transaction_date:previousAuto.transaction_date,direction:previousAuto.direction,
          category:previousAuto.category,payment_method:previousAuto.payment_method,amount:amount(previousAuto.amount),
          car_id:String(car.id),person_name:car.customer||"",description:previousAuto.description,
          source_type:"car_cash",source_id:String(car.id),is_legacy:false
        });
        return;
      }
      const hasAnyCollectionHistory=financialTransactions.some(tx=>String(tx.car_id||"")===String(car.id) && (tx.category==="car_collection" || (tx.category==="reversal" && ["car","car_collection","car_cash"].includes(tx.source_type))));
      const paid=financialTransactions.filter(tx=>String(tx.car_id||"")===String(car.id) &&
        (tx.category==="car_collection" || (tx.category==="reversal" && ["car","car_collection","car_cash"].includes(tx.source_type)))
      ).reduce((sum,tx)=>sum+(tx.direction==="inflow"?amount(tx.amount):-amount(tx.amount)),0);
      const remaining=Math.max(0,amount(car.salePrice)-paid);
      if(!previousAuto && !hasAnyCollectionHistory && remaining>0.005 && /^\d{4}-\d{2}-\d{2}$/.test(String(car.date||""))){
        output.push({
          user_id:session.user.id,transaction_date:car.date,direction:"inflow",category:"car_collection",
          payment_method:"cash",amount:remaining,car_id:String(car.id),person_name:car.customer||"",
          description:"تحصيل نقدي كامل حسب حالة السيارة كاش",source_type:"car_cash",
          source_id:String(car.id),is_legacy:false
        });
      }
    });
    (sourceState.capital||[]).forEach(item=>{
      if (!item || !item.id || !/^\d{4}-\d{2}-\d{2}$/.test(String(item.date||""))) return;
      if (amount(item.deposited)>0) output.push({
        user_id:session.user.id,transaction_date:item.date,direction:"inflow",category:"capital_deposit",
        payment_method:dbPaymentMethod(item.method),amount:amount(item.deposited),
        person_name:item.partner||"",description:item.description||item.movementType||"إيداع رأس مال",
        reference:item.receiptNo||"",source_type:"capital",source_id:String(item.id),is_legacy:false
      });
      if (amount(item.withdrawn)>0) output.push({
        user_id:session.user.id,transaction_date:item.date,direction:"outflow",category:"capital_withdrawal",
        payment_method:dbPaymentMethod(item.method),amount:amount(item.withdrawn),
        person_name:item.partner||"",description:item.description||item.movementType||"سحب من رأس المال",
        reference:item.receiptNo||"",source_type:"capital",source_id:String(item.id),is_legacy:false
      });
    });
    return output;
  }

  async function syncCashbookWithAppState(sourceState) {
    if(!financialLedgerLoaded || !session || role!=="admin") return;
    const desired=desiredAppCashMovements(sourceState);
    const reversed=new Set(financialTransactions.filter(t=>t.reversal_of).map(t=>String(t.reversal_of)));
    const active=financialTransactions.filter(t=>
      ["expense","capital","car_cash"].includes(t.source_type) && t.category!=="reversal" && !reversed.has(String(t.id))
    );
    const desiredGroups=new Map();
    desired.forEach(item=>{
      const key=item.source_type+":"+item.source_id;
      if(!desiredGroups.has(key)) desiredGroups.set(key,[]);
      desiredGroups.get(key).push(item);
    });
    for(const current of active){
      const key=current.source_type+":"+current.source_id;
      const candidates=desiredGroups.get(key)||[];
      const matchedIndex=candidates.findIndex(item=>sameSourceMovement(current,item));
      if(matchedIndex>=0) candidates.splice(matchedIndex,1);
      else if(current.is_legacy && !desiredGroups.has(key)) continue;
      else await reverseFinancialTransaction(current,"تعديل أو حذف السجل المرتبط في النظام");
    }
    for(const group of desiredGroups.values()){
      for(const item of group){
        await insertFinancialTransaction(Object.assign({},item,{source_key:"state:"+item.source_type+":"+item.source_id+":"+makeId()}));
      }
    }
  }

  async function writeAuditEvent(event) {
    try{
      const result=await db.from("audit_logs").insert(Object.assign({
        user_id:session.user.id,created_by:session.user.id
      },event)).select("id,created_at,event_type,entity_type,entity_id,description").single();
      if(result.error) throw result.error;
      auditEntries.unshift(result.data);
      auditEntries=auditEntries.slice(0,150);
      return true;
    }catch(error){
      console.warn("audit log write failed",error.message);
      return false;
    }
  }

  async function writeStateAudit(beforeState,afterState) {
    if(!beforeState || !afterState) return;
    const collections=["cars","expenses","debts","capital","partnerMovements"];
    const rows=[];
    collections.forEach(collection=>{
      const before=new Map((beforeState[collection]||[]).map(item=>[String(item.id),item]));
      const after=new Map((afterState[collection]||[]).map(item=>[String(item.id),item]));
      before.forEach((oldItem,id)=>{
        if(!after.has(id)) rows.push({user_id:session.user.id,created_by:session.user.id,event_type:"delete",entity_type:collection,entity_id:id,description:"حذف سجل "+collection,before_data:oldItem});
        else if(JSON.stringify(oldItem)!==JSON.stringify(after.get(id))) rows.push({user_id:session.user.id,created_by:session.user.id,event_type:"update",entity_type:collection,entity_id:id,description:"تعديل سجل "+collection,before_data:oldItem,after_data:after.get(id)});
      });
      after.forEach((newItem,id)=>{
        if(!before.has(id)) rows.push({user_id:session.user.id,created_by:session.user.id,event_type:"create",entity_type:collection,entity_id:id,description:"إضافة سجل "+collection,after_data:newItem});
      });
    });
    if(!rows.length) return;
    try{
      const result=await db.from("audit_logs").insert(rows).select("id,created_at,event_type,entity_type,entity_id,description");
      if(result.error) throw result.error;
      auditEntries=(result.data||[]).concat(auditEntries).slice(0,150);
    }catch(error){console.warn("state audit failed",error.message);}
  }

  async function loadFinancialOperations() {
    const owner=session.user.id;
    setSync("تحميل الدفاتر المالية","busy");
    const results=await Promise.all([
      db.from("financial_transactions").select("*").eq("user_id",owner).order("transaction_date",{ascending:false}).order("created_at",{ascending:false}).limit(3000),
      db.from("cash_reconciliations").select("*").eq("user_id",owner).order("reconciliation_date",{ascending:false}).limit(180),
      db.from("audit_logs").select("id,created_at,event_type,entity_type,entity_id,description,before_data,after_data").eq("user_id",owner).order("created_at",{ascending:false}).limit(150),
      db.from("app_backups").select("id,created_at,backup_type,label").eq("user_id",owner).order("created_at",{ascending:false}).limit(60)
    ]);
    for(const result of results) if(result.error) throw result.error;
    financialTransactions=results[0].data||[];
    cashReconciliations=results[1].data||[];
    auditEntries=results[2].data||[];
    backupEntries=results[3].data||[];
    financialLedgerLoaded=true;
    try { await syncCashbookWithAppState(state); }
    catch(syncError) {
      console.warn("cashbook initial synchronization pending",syncError.message);
      toast("تم تحميل البيانات، لكن بعض الحركات القديمة تحتاج مزامنة. راجع دفتر الحركة.", "error");
    }
    setSync("تم تحميل الدفاتر","");

    try{
      const localDate=today();
      const daily=backupEntries.find(item=>item.backup_type==="daily" && new Date(item.created_at).toISOString().slice(0,10)===new Date().toISOString().slice(0,10));
      if(!daily){
        const payload={state:clone(state),financialTransactions:clone(financialTransactions),cashReconciliations:clone(cashReconciliations)};
        const backup=await db.from("app_backups").insert({
          user_id:owner,created_by:owner,backup_type:"daily",
          label:"نسخة تلقائية يومية "+localDate,payload
        }).select("id,created_at,backup_type,label").single();
        if(backup.error) throw backup.error;
        backupEntries.unshift(backup.data);
        await writeAuditEvent({event_type:"backup",entity_type:"app_backups",entity_id:backup.data.id,description:"إنشاء نسخة احتياطية تلقائية يومية"});
      }
    }catch(error){console.warn("daily backup failed",error.message);}
  }

  function cashTotalsForDate(dateValue) {
    const rows=financialTransactions.filter(item=>item.transaction_date===dateValue);
    const totals={cashIn:0,cashOut:0,bankIn:0,bankOut:0,otherIn:0,otherOut:0};
    rows.forEach(item=>{
      const key=item.payment_method==="cash"?"cash":(item.payment_method==="bank_transfer"?"bank":"other");
      const target=key+(item.direction==="inflow"?"In":"Out");
      totals[target]+=amount(item.amount);
    });
    return totals;
  }

  function currentCarPaymentRows(carId) {
    const reversed=new Set(financialTransactions.filter(tx=>tx.reversal_of).map(tx=>String(tx.reversal_of)));
    return financialTransactions.filter(tx=>
      String(tx.car_id||"")===String(carId) &&
      (tx.category==="car_collection" || (tx.category==="reversal" && (tx.source_type==="car" || tx.source_type==="car_collection"))) &&
      !reversed.has(String(tx.id))
    ).sort((a,b)=>String(a.transaction_date||"").localeCompare(String(b.transaction_date||"")));
  }

  function carAcquisitionPaid(carId) {
    const reversed=new Set(financialTransactions.filter(tx=>tx.reversal_of).map(tx=>String(tx.reversal_of)));
    return financialTransactions.filter(tx=>
      String(tx.car_id||"")===String(carId) &&
      ["car_purchase","car_prep"].includes(tx.category) &&
      !reversed.has(String(tx.id))
    ).reduce((sum,tx)=>sum+(tx.direction==="outflow"?amount(tx.amount):-amount(tx.amount)),0);
  }

  function customerGroups() {
    const map=new Map();
    const getGroup=name=>{
      const key=String(name||"").trim();
      if(!key)return null;
      if(!map.has(key))map.set(key,{name:key,cars:[],debts:[],sales:0,paid:0,remaining:0,debtReceivable:0,debtPayable:0});
      return map.get(key);
    };
    (state.cars||[]).filter(car=>car.customer).forEach(car=>{
      const group=getGroup(car.customer);
      group.cars.push(car);
      if(isSoldCar(car)){
        group.sales+=amount(car.salePrice);
        group.paid+=carPaid(car);
        group.remaining+=carRemaining(car);
      }
    });
    (state.debts||[]).forEach(debt=>{
      const group=getGroup(debt.partyName);
      if(!group)return;
      group.debts.push(debt);
      if(String(debt.nature||"").includes("لنا"))group.debtReceivable+=debtRemaining(debt);
      if(String(debt.nature||"").includes("علينا"))group.debtPayable+=debtRemaining(debt);
    });
    return Array.from(map.values()).sort((a,b)=>(b.remaining+b.debtReceivable)-(a.remaining+a.debtReceivable));
  }

  function carProfitDetails(car) {
    const cost=amount(car.purchasePrice)+amount(car.prepCost);
    const profit=amount(car.salePrice)-cost;
    const explicit=Number(car.partnerSharePercent);
    const inferred=cost>0&&amount(car.partnerContribution)>0?Math.min(100,amount(car.partnerContribution)/cost*100):0;
    const sharePercent=Number.isFinite(explicit)&&explicit>0?Math.min(100,explicit):inferred;
    const partnerProfit=amount(car.partnerContribution)>0?profit*sharePercent/100:0;
    return {cost,profit,sharePercent,partnerProfit,showroomProfit:profit-partnerProfit,showPartner:amount(car.partnerContribution)>0,inferred:!(Number.isFinite(explicit)&&explicit>0)};
  }

  async function loadRequests() {
    const result = await db.from("expense_submissions").select("*").order("created_at", {ascending:false});
    if (result.error) {
      requests = [];
      console.warn("expense submissions unavailable", result.error.message);
    } else {
      requests = result.data || [];
    }
  }

  function amount(value) { return num(value); }
  function carPaid(car) {
    if (financialLedgerLoaded && car && car.id) {
      return Math.max(0,financialTransactions.filter(tx=>
        String(tx.car_id||"")===String(car.id) &&
        (tx.category==="car_collection" || (tx.category==="reversal" && ["car","car_collection","car_cash"].includes(tx.source_type)))
      ).reduce((sum,tx)=>sum+(tx.direction==="inflow"?amount(tx.amount):-amount(tx.amount)),0));
    }
    if (car.paidAmount === undefined || car.paidAmount === null || car.paidAmount === "") {
      return car.status === "كاش" ? amount(car.salePrice) : 0;
    }
    return amount(car.paidAmount);
  }
  function carRemaining(car) { return isSoldCar(car) ? Math.max(0, amount(car.salePrice) - carPaid(car)) : 0; }
  function debtRemaining(debt) { return Math.max(0, amount(debt.totalAmount) - amount(debt.paidAmount)); }
  function isSoldCar(car) {
    const soldStatuses = ["كاش","متبقي","تقسيط","مباع"];
    return soldStatuses.includes(String(car && car.status || "").trim()) ||
      (!String(car && car.status || "").trim() && amount(car && car.salePrice) > 0);
  }

  function metrics() {
    const cars = state.cars || [];
    const sold = cars.filter(isSoldCar);
    const inventory = cars.filter(c => !isSoldCar(c));
    const sales = sold.reduce((sum,c) => sum + amount(c.salePrice), 0);
    const soldCost = sold.reduce((sum,c) => sum + amount(c.purchasePrice) + amount(c.prepCost), 0);
    const purchase = cars.reduce((sum,c) => sum + amount(c.purchasePrice) + amount(c.prepCost), 0);
    const profit = sales - soldCost;
    const carRemainingTotal = cars.reduce((sum,c) => sum + carRemaining(c), 0);
    const receivableDebts = (state.debts || []).filter(d => String(d.nature || "").includes("لنا")).reduce((sum,d)=>sum+debtRemaining(d),0);
    const payableDebts = (state.debts || []).filter(d => String(d.nature || "").includes("علينا")).reduce((sum,d)=>sum+debtRemaining(d),0);
    const expenses = (state.expenses || []).reduce((sum,e)=>sum+amount(e.amount),0);
    const capitalIn = (state.capital || []).reduce((sum,c)=>sum+amount(c.deposited),0);
    const capitalOut = (state.capital || []).reduce((sum,c)=>sum+amount(c.withdrawn),0);
    const profitFromPeople = (state.capital || []).filter(c=>c.profitLossType==="ربح من شخص").reduce((sum,c)=>sum+amount(c.profitLossAmount),0);
    const lossToPeople = (state.capital || []).filter(c=>c.profitLossType==="خسارة لشخص").reduce((sum,c)=>sum+amount(c.profitLossAmount),0);
    const profitLossNet = profitFromPeople - lossToPeople;
    const capitalNet = capitalIn-capitalOut+profitLossNet;
    const netProfit = profit-expenses+profitLossNet;
    return {
      cars:cars.length, inventory:inventory.length, sold:sold.length,
      sales, soldCost, purchase, profit, grossProfit:profit, netProfit,
      carRemainingTotal, receivableDebts, payableDebts, expenses, capitalIn, capitalOut,
      profitFromPeople, lossToPeople, profitLossNet, capitalNet,
      totalReceivables:carRemainingTotal+receivableDebts
    };
  }

  function worsenedPartnerBalance(previousState) {
    const nextState = state;
    const after = partnerBalances();
    state = previousState;
    const before = partnerBalances();
    state = nextState;
    const beforeByName = new Map(before.map(item => [item.partner, item.balance]));
    return after.find(item => item.balance < -0.0001 &&
      item.balance < (beforeByName.has(item.partner) ? beforeByName.get(item.partner) : 0) - 0.0001) || null;
  }

  function isLinkedCapitalEntry(entry) {
    if (!entry) return false;
    if (entry.linkedMovementId || entry.sourceCarId) return true;
    const id = String(entry.id || "");
    return Boolean(id && (state.partnerMovements || []).some(m => String(m.sourceCapitalId || "") === id));
  }

  function partnerBalances() {
    const balances = new Map();
    const movements = Array.isArray(state.partnerMovements) ? state.partnerMovements : [];
    const get = (name) => {
      const key = String(name || "").trim();
      if (!key) return null;
      if (!balances.has(key)) balances.set(key, {partner:key, contributed:0, withdrawn:0});
      return balances.get(key);
    };
    movements.forEach((movement) => {
      if (movement.type !== "contribution" && movement.type !== "payout") return;
      const item = get(movement.partner);
      if (!item) return;
      if (movement.type === "contribution") item.contributed += amount(movement.amount);
      if (movement.type === "payout") item.withdrawn += amount(movement.amount);
    });
    const movementCapitalIds = new Set(movements.map(movement => movement.sourceCapitalId == null ? "" : String(movement.sourceCapitalId)).filter(Boolean));
    (state.capital || []).forEach((entry) => {
      if (!entry.partner) return;
      const linkedMovementExists = entry.linkedMovementId && movements.some(movement => String(movement.id) === String(entry.linkedMovementId));
      const linkedByCapitalId = entry.id && movementCapitalIds.has(String(entry.id));
      const linkedByCar = entry.sourceCarId && movements.some(movement =>
        movement.type === "contribution" && String(movement.sourceCarId || "") === String(entry.sourceCarId) &&
        String(movement.partner || "").trim() === String(entry.partner || "").trim()
      );
      if (linkedMovementExists || linkedByCapitalId || linkedByCar) return;
      const item = get(entry.partner);
      if (!item) return;
      item.contributed += Math.max(0, amount(entry.deposited));
      item.withdrawn += Math.max(0, amount(entry.withdrawn));
    });
    return Array.from(balances.values()).map(item => Object.assign({},item,{balance:item.contributed-item.withdrawn})).sort((a,b)=>a.partner.localeCompare(b.partner,"ar"));
  }


  function renderPartnerBalances() {
    const active = partnerBalances();
    const canWithdraw = active.some((item) => item.balance > 0);
    const action = '<button class="btn btn-primary btn-small" data-action="add-partner-payout"' +
      (canWithdraw ? '' : ' disabled') + '>+ سحب من رصيد شريك</button>';
    return '<section class="panel section-gap"><div class="partner-balance-head"><div><h3>أرصدة الشركاء المتاحة</h3><p class="panel-note">الرصيد = مساهمات الشريك في السيارات ورأس المال ناقص دفعات السحب السابقة.</p></div><div class="page-actions">' + action + '</div></div>' +
      (active.length ? '<div class="summary-list">' + active.map((item) =>
        '<div class="summary-line"><span>' + esc(item.partner) + ' · مساهمات ' + money(item.contributed) + ' · مسحوبات ' + money(item.withdrawn) + '</span><strong class="' +
        (item.balance > 0 ? 'positive' : (item.balance < 0 ? 'negative' : '')) + '">' + money(item.balance) + '</strong></div>'
      ).join('') + '</div>' : empty("لم تُسجّل مساهمات شركاء بعد. أضف اسم الشريك ومبلغ مساهمته عند تسجيل شراء السيارة.")) +
      '</section>';
  }

  function badge(text, cls) { return '<span class="badge ' + (cls || "") + '">' + esc(text) + '</span>'; }
  function heading(title, subtitle, action) {
    return '<div class="page-heading"><div><h2>' + esc(title) + '</h2><p>' + esc(subtitle || "") + '</p></div><div class="page-actions">' + (action || "") + '</div></div>';
  }
  function kpi(label,value,hint,cls) {
    return '<div class="kpi ' + (cls || "") + '"><div class="label">' + esc(label) + '</div><div class="value">' + esc(value) + '</div><div class="hint">' + esc(hint || "") + '</div></div>';
  }
  function empty(label) { return '<div class="empty-state">' + esc(label) + '</div>'; }
  function carCard(c) {
    const remaining = carRemaining(c);
    const cost = amount(c.purchasePrice) + amount(c.prepCost);
    const shareInfo = amount(c.partnerContribution) > 0
      ? '<div class="data-cell"><span>الشريك المساهم</span><strong>' + esc(c.partnerName || "—") + '</strong></div><div class="data-cell"><span>مبلغ الشراكة</span><strong class="positive">' + money(c.partnerContribution) + '</strong></div>'
      : '';
    return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(c.model || "سيارة بدون اسم") + '</div><div class="data-card-sub">' + dateText(c.date) + ' · ' + esc(c.customer || "بدون عميل") + '</div></div>' + badge(c.status || "قيد البيع", c.status==="كاش"||c.status==="مباع"?"ok":(remaining>0?"warn":"gold")) + '</div><div class="data-card-grid"><div class="data-cell"><span>تكلفة الشراء والتجهيز</span><strong>' + money(cost) + '</strong></div><div class="data-cell"><span>سعر البيع</span><strong>' + money(c.salePrice) + '</strong></div><div class="data-cell"><span>المدفوع</span><strong class="positive">' + money(carPaid(c)) + '</strong></div><div class="data-cell"><span>المتبقي</span><strong class="' + (remaining>0?"negative":"positive") + '">' + money(remaining) + '</strong></div>' + shareInfo + '</div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="cars" data-id="' + esc(c.id) + '">تعديل</button><button class="btn btn-danger btn-small" data-action="delete" data-collection="cars" data-id="' + esc(c.id) + '">حذف</button></div></article>';
  }
  function expenseCard(e) {
    return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(e.description || e.category || "مصروف") + '</div><div class="data-card-sub">' + esc(e.category || "عام") + ' · ' + dateText(e.date) + '</div></div>' + badge(e.paymentMethod || "غير محدد","gold") + '</div><div class="data-card-grid"><div class="data-cell"><span>المبلغ</span><strong class="negative">' + money(e.amount) + '</strong></div><div class="data-cell"><span>المستلم / المورد</span><strong>' + esc(e.recipient || "—") + '</strong></div><div class="data-cell"><span>طريقة الدفع</span><strong>' + esc(e.paymentMethod || "—") + '</strong></div><div class="data-cell"><span>ملاحظات</span><strong>' + esc(e.notes || "—") + '</strong></div></div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="expenses" data-id="' + esc(e.id) + '">تعديل</button><button class="btn btn-danger btn-small" data-action="delete" data-collection="expenses" data-id="' + esc(e.id) + '">حذف</button></div></article>';
  }
  function debtCard(d) {
    const rem = debtRemaining(d);
    return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(d.partyName || "جهة غير محددة") + '</div><div class="data-card-sub">' + esc(d.description || "") + ' · استحقاق ' + dateText(d.dueDate) + '</div></div>' + badge(d.status || "قيد المتابعة", d.status==="متأخر"?"warn":(rem===0?"ok":"gold")) + '</div><div class="data-card-grid"><div class="data-cell"><span>الإجمالي</span><strong>' + money(d.totalAmount) + '</strong></div><div class="data-cell"><span>المسدد</span><strong class="positive">' + money(d.paidAmount) + '</strong></div><div class="data-cell"><span>المتبقي</span><strong class="' + (rem>0?"negative":"positive") + '">' + money(rem) + '</strong></div><div class="data-cell"><span>الطبيعة</span><strong>' + esc(d.nature || "—") + '</strong></div></div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="debts" data-id="' + esc(d.id) + '">تعديل</button><button class="btn btn-danger btn-small" data-action="delete" data-collection="debts" data-id="' + esc(d.id) + '">حذف</button></div></article>';
  }
  function capitalCard(c) {
    const profitLoss = amount(c.profitLossAmount);
    const profitLossNet = c.profitLossType === "ربح من شخص" ? profitLoss : (c.profitLossType === "خسارة لشخص" ? -profitLoss : 0);
    const net = amount(c.deposited)-amount(c.withdrawn)+profitLossNet;
    const linked = isLinkedCapitalEntry(c);
    const profitLossInfo = c.profitLossType && profitLoss > 0
      ? '<div class="data-cell"><span>' + esc(c.profitLossType) + '</span><strong class="' + (profitLossNet >= 0 ? 'positive' : 'negative') + '">' + money(profitLoss) + '</strong></div>'
      : '';
    const actions = linked
      ? '<div class="card-actions"><span class="panel-note">قيد مرتبط بحركة سيارة أو شريك؛ يتم تعديله من السجل الأصلي للحفاظ على تطابق الدفاتر.</span></div>'
      : '<div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="capital" data-id="' + esc(c.id) + '">تعديل</button><button class="btn btn-danger btn-small" data-action="delete" data-collection="capital" data-id="' + esc(c.id) + '">حذف</button></div>';
    return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(c.partner || "شريك غير محدد") + '</div><div class="data-card-sub">' + esc(c.movementType || "حركة مالية") + ' · ' + dateText(c.date) + '</div></div>' + badge(c.method || "غير محدد","gold") + '</div><div class="data-card-grid"><div class="data-cell"><span>داخل</span><strong class="positive">' + money(c.deposited) + '</strong></div><div class="data-cell"><span>خارج</span><strong class="negative">' + money(c.withdrawn) + '</strong></div>' + profitLossInfo + '<div class="data-cell"><span>صافي الحركة</span><strong class="' + (net >= 0 ? 'positive' : 'negative') + '">' + money(net) + '</strong></div><div class="data-cell"><span>رقم الإيصال</span><strong>' + esc(c.receiptNo || "—") + '</strong></div></div>' + actions + '</article>';
  }


  function listMarkup(items, renderer, noText) {
    return items.length ? '<div class="data-list">' + items.map(renderer).join("") + '</div>' : empty(noText || "لا توجد بيانات مسجلة حتى الآن.");
  }

  function formulaDetail(title, formula, explanation) {
    return '<details class="formula-detail"><summary>كيف حُسب ' + esc(title) + '؟</summary><div><strong>' + esc(formula) + '</strong><p>' + esc(explanation) + '</p></div></details>';
  }

  function recordDate(record) {
    if (!record) return "";
    return String(record.date || record.expense_date || record.dueDate || "").slice(0,10);
  }

  function monthKey(dateValue) {
    const date = String(dateValue || "");
    return /^\d{4}-\d{2}/.test(date) ? date.slice(0,7) : "";
  }

  function isPeriodLocked(dateValue) {
    const date = recordDate({date:dateValue});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const year = date.slice(0,4);
    const month = date.slice(0,7);
    return Boolean(
      (state.closings && state.closings.annual && state.closings.annual[year]) ||
      (state.closings && state.closings.months && state.closings.months[month])
    );
  }

  function periodRecords(startDate,endDate) {
    const inside = (record) => {
      const date = recordDate(record);
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= startDate && date <= endDate;
    };
    return {
      cars:(state.cars || []).filter(inside),
      expenses:(state.expenses || []).filter(inside),
      debts:(state.debts || []).filter(inside),
      capital:(state.capital || []).filter(inside),
      partnerMovements:(state.partnerMovements || []).filter(inside)
    };
  }

  function undatedFinancialRecords() {
    const groups = [
      ["سيارات",state.cars || []],
      ["مصروفات",state.expenses || []],
      ["ذمم",state.debts || []],
      ["رأس المال",state.capital || []],
      ["حركة الشركاء",state.partnerMovements || []]
    ];
    return groups.reduce((all,group)=>all.concat(group[1].filter(item=>!/^\d{4}-\d{2}-\d{2}$/.test(recordDate(item))).map(item=>group[0])),[]);
  }

  function pendingRequestsForPeriod(startDate,endDate) {
    return (requests || []).filter(request =>
      request.status === "pending" &&
      String(request.expense_date || "") >= startDate &&
      String(request.expense_date || "") <= endDate
    );
  }

  function buildPeriodSnapshot(startDate,endDate,label) {
    const rows = periodRecords(startDate,endDate);
    const sold = rows.cars.filter(isSoldCar);
    const inventory = rows.cars.filter(car=>!isSoldCar(car));
    const sales = sold.reduce((sum,car)=>sum+amount(car.salePrice),0);
    const soldCost = sold.reduce((sum,car)=>sum+amount(car.purchasePrice)+amount(car.prepCost),0);
    const allPurchaseCost = rows.cars.reduce((sum,car)=>sum+amount(car.purchasePrice)+amount(car.prepCost),0);
    const operatingExpenses = rows.expenses.reduce((sum,expense)=>sum+amount(expense.amount),0);
    const profitFromPeople = rows.capital.filter(entry=>entry.profitLossType==="ربح من شخص").reduce((sum,entry)=>sum+amount(entry.profitLossAmount),0);
    const lossToPeople = rows.capital.filter(entry=>entry.profitLossType==="خسارة لشخص").reduce((sum,entry)=>sum+amount(entry.profitLossAmount),0);
    const grossProfit = sales-soldCost;
    const netResult = grossProfit-operatingExpenses+profitFromPeople-lossToPeople;
    const carReceivables = rows.cars.reduce((sum,car)=>sum+carRemaining(car),0);
    const receivableDebts = rows.debts.filter(debt=>String(debt.nature||"").includes("لنا")).reduce((sum,debt)=>sum+debtRemaining(debt),0);
    const payableDebts = rows.debts.filter(debt=>String(debt.nature||"").includes("علينا")).reduce((sum,debt)=>sum+debtRemaining(debt),0);
    const capitalIn = rows.capital.reduce((sum,entry)=>sum+amount(entry.deposited),0);
    const capitalOut = rows.capital.reduce((sum,entry)=>sum+amount(entry.withdrawn),0);
    const carPaidToDate = rows.cars.reduce((sum,car)=>sum+carPaid(car),0);
    const periodTransactions=(financialTransactions||[]).filter(tx=>tx.transaction_date>=startDate&&tx.transaction_date<=endDate);
    const flowSum=(list,direction)=>list.filter(tx=>tx.direction===direction).reduce((sum,tx)=>sum+amount(tx.amount),0);
    const cashIn=flowSum(periodTransactions.filter(tx=>tx.payment_method==="cash"),"inflow");
    const cashOut=flowSum(periodTransactions.filter(tx=>tx.payment_method==="cash"),"outflow");
    const bankIn=flowSum(periodTransactions.filter(tx=>tx.payment_method==="bank_transfer"),"inflow");
    const bankOut=flowSum(periodTransactions.filter(tx=>tx.payment_method==="bank_transfer"),"outflow");
    const allIn=flowSum(periodTransactions,"inflow");
    const allOut=flowSum(periodTransactions,"outflow");
    const collectionMovements=periodTransactions.filter(tx=>
      tx.category==="car_collection" || (tx.category==="reversal"&&["car","car_collection","car_cash"].includes(tx.source_type))
    );
    const purchaseMovements=periodTransactions.filter(tx=>
      tx.category==="car_purchase" || (tx.category==="reversal"&&tx.source_type==="car_purchase")
    );
    const prepMovements=periodTransactions.filter(tx=>
      tx.category==="car_prep" || (tx.category==="reversal"&&tx.source_type==="car_prep")
    );
    const netOf=(list)=>list.reduce((sum,tx)=>sum+(tx.direction==="inflow"?amount(tx.amount):-amount(tx.amount)),0);
    const netPayments=(list)=>list.reduce((sum,tx)=>sum+(tx.direction==="outflow"?amount(tx.amount):-amount(tx.amount)),0);
    const cashDates=Array.from(new Set(periodTransactions.filter(tx=>tx.payment_method==="cash").map(tx=>tx.transaction_date)));
    const reconciledDates=new Set((cashReconciliations||[]).filter(item=>item.reconciliation_date>=startDate&&item.reconciliation_date<=endDate).map(item=>item.reconciliation_date));
    const unreconciledCashDates=cashDates.filter(date=>!reconciledDates.has(date)).sort();
    const reconciliations=(cashReconciliations||[]).filter(item=>item.reconciliation_date>=startDate&&item.reconciliation_date<=endDate);
    const cashDifferenceTotal=reconciliations.reduce((sum,item)=>sum+amount(item.cash_difference),0);
    return {
      label,startDate,endDate,
      calculatedAt:new Date().toISOString(),
      counts:{
        cars:rows.cars.length,soldCars:sold.length,inventoryCars:inventory.length,
        expenses:rows.expenses.length,debts:rows.debts.length,capitalEntries:rows.capital.length,
        partnerMovements:rows.partnerMovements.length,transactions:periodTransactions.length,
        legacyMovements:periodTransactions.filter(tx=>tx.is_legacy).length,
        cashReconciliations:reconciliations.length,unreconciledCashDays:unreconciledCashDates.length
      },
      sales,soldCost,allPurchaseCost,inventoryCost:allPurchaseCost-soldCost,
      grossProfit,operatingExpenses,profitFromPeople,lossToPeople,netResult,
      carReceivables,receivableDebts,payableDebts,totalReceivables:carReceivables+receivableDebts,
      carPaidToDate,capitalIn,capitalOut,capitalNet:capitalIn-capitalOut+profitFromPeople-lossToPeople,
      cashIn,cashOut,cashNet:cashIn-cashOut,bankIn,bankOut,bankNet:bankIn-bankOut,
      totalIn:allIn,totalOut:allOut,totalCashNet:allIn-allOut,
      carCollectionsInPeriod:netOf(collectionMovements),
      carPurchasePaymentsInPeriod:netPayments(purchaseMovements),
      carPrepPaymentsInPeriod:netPayments(prepMovements),
      cashDifferenceTotal,unreconciledCashDates,
      partnerBalances:(partnerBalances()||[]).map(item=>({
        partner:item.partner,contributed:item.contributed,withdrawn:item.withdrawn,balance:item.balance
      })),
      sourceIds:{
        cars:rows.cars.map(item=>String(item.id)),
        expenses:rows.expenses.map(item=>String(item.id)),
        debts:rows.debts.map(item=>String(item.id)),
        capital:rows.capital.map(item=>String(item.id)),
        partnerMovements:rows.partnerMovements.map(item=>String(item.id)),
        financialTransactions:periodTransactions.map(item=>String(item.id))
      }
    };
  }

  function monthDateRange(key) {
    const parts = String(key || "").split("-");
    const year = Number(parts[0]), month = Number(parts[1]);
    if (!year || month<1 || month>12) return null;
    const lastDay = new Date(year,month,0).getDate();
    return {start:year+"-"+String(month).padStart(2,"0")+"-01",end:year+"-"+String(month).padStart(2,"0")+"-"+String(lastDay).padStart(2,"0")};
  }

  function monthLabel(key) {
    const parts = String(key || "").split("-");
    const names = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return (names[Number(parts[1])-1] || "شهر") + " " + (parts[0] || "");
  }

  function activityMonthsForYear(year) {
    const keys = new Set();
    const groups = [state.cars || [],state.expenses || [],state.debts || [],state.capital || [],state.partnerMovements || []];
    groups.forEach(group=>group.forEach(item=>{
      const key = monthKey(recordDate(item));
      if (key && key.slice(0,4)===String(year)) keys.add(key);
    }));
    return Array.from(keys).sort();
  }

  function closingReadiness(startDate,endDate) {
    const missingDates = undatedFinancialRecords().length;
    const pending = pendingRequestsForPeriod(startDate,endDate);
    const blockers = [];
    if (missingDates) blockers.push("يوجد "+missingDates+" سجل مالي بلا تاريخ؛ حدّد تاريخه قبل التقفيل حتى لا يُستبعد من الفترة.");
    if (pending.length) blockers.push("يوجد "+pending.length+" طلب مصروف موظف معلق داخل الفترة؛ اعتمده أو ارفضه قبل التقفيل.");
    return {blockers,missingDates,pending};
  }

  function auditClosing(action,period,key,reason,snapshot) {
    state.closings = Object.assign({annual:{},months:{},halves:{},snapshots:[],audit:[]},state.closings || {});
    if (!Array.isArray(state.closings.audit)) state.closings.audit = [];
    state.closings.audit.unshift({
      id:makeId(),action,period,key,reason:reason || "",
      user:session && session.user ? (session.user.email || session.user.id) : "admin",
      at:new Date().toISOString(),
      snapshot:snapshot || null
    });
    state.closings.audit = state.closings.audit.slice(0,200);
  }

  function renderClosingAuditLog(period,key) {
    const rows=(state.closings.audit || []).filter(entry=>entry.period===period && (!key || entry.key===key)).slice(0,8);
    if(!rows.length) return "";
    return '<section class="panel section-gap"><h3>سجل مراجعة التقفيل</h3><p class="panel-note">آخر عمليات الإغلاق وإعادة الفتح مع اسم المسؤول والسبب.</p><div class="summary-list">'+rows.map(entry=>{
      const label=entry.action==="close"?"تقفيل":(entry.action==="reopen"?"إعادة فتح":"تعديل");
      return '<div class="summary-line"><span>'+label+' · '+esc(entry.user||"غير محدد")+'<small class="sub-line">'+esc(entry.reason||"بدون سبب — عملية تقفيل")+'</small></span><strong>'+esc(entry.at||"")+'</strong></div>';
    }).join("")+'</div></section>';
  }

  function renderClosingSnapshot(snapshot) {
    if (!snapshot) return '<div class="empty-state">هذا تقفيل قديم لا يحتوي على لقطة رقمية ثابتة؛ لا يمكن عرض سجلاته الحالية على أنها أرقام تاريخية معتمدة.</div>';
    const lines = [
      ["إيرادات بيع السيارات",snapshot.sales,"positive","مجموع أسعار السيارات التي سُجلت بحالة بيع داخل الفترة."],
      ["تكلفة السيارات المباعة",snapshot.soldCost,"","الشراء والتجهيز للسيارات المباعة في الفترة."],
      ["المخزون غير المباع",snapshot.inventoryCost,"","قيمة الشراء والتجهيز للسيارات التي لم تُسجل كمباعة."],
      ["مجمل ربح أو خسارة السيارات",snapshot.grossProfit,snapshot.grossProfit>=0?"positive":"negative","الإيرادات ناقص تكلفة السيارات المباعة."],
      ["مصروفات التشغيل",snapshot.operatingExpenses,"negative","مجموع المصروفات المسجلة في الفترة."],
      ["أرباح من أشخاص",snapshot.profitFromPeople,"positive","الأرباح الإضافية المسجلة في حركة رأس المال."],
      ["خسائر لأشخاص",snapshot.lossToPeople,"negative","الخسائر الإضافية المسجلة في حركة رأس المال."],
      ["تحصيلات العملاء المؤرخة في الفترة",snapshot.carCollectionsInPeriod,"positive","مجموع قيود التحصيل الفعلية المؤرخة داخل الفترة، بعد تسويات العكس."],
      ["مدفوعات شراء السيارات في الفترة",snapshot.carPurchasePaymentsInPeriod,"negative","المدفوعات المسجلة في دفتر الحركة لشراء السيارات."],
      ["مدفوعات تجهيز السيارات في الفترة",snapshot.carPrepPaymentsInPeriod,"negative","المدفوعات المسجلة في دفتر الحركة لتجهيز السيارات."],
      ["صافي الحركة النقدية في الفترة",snapshot.cashNet,snapshot.cashNet>=0?"positive":"negative","الوارد النقدي ناقص المنصرف النقدي خلال الفترة."],
      ["صافي الحركة البنكية في الفترة",snapshot.bankNet,snapshot.bankNet>=0?"positive":"negative","التحويلات البنكية الواردة ناقص التحويلات البنكية المنصرفة."],
      ["إجمالي صافي حركة الدفتر",snapshot.totalCashNet,snapshot.totalCashNet>=0?"positive":"negative","كل الوارد ناقص كل المنصرف من دفتر الحركة."],
      ["صافي نتيجة الفترة",snapshot.netResult,snapshot.netResult>=0?"positive":"negative","مجمل الربح ناقص المصروفات، مضافًا إليه الأرباح ومطروحًا منه الخسائر."]
    ];
    const partnerHtml = snapshot.partnerBalances && snapshot.partnerBalances.length
      ? '<section class="partner-snapshot"><h4>أرصدة الشركاء وقت التقفيل</h4><div class="summary-list">'+snapshot.partnerBalances.map(item=>'<div class="summary-line"><span>'+esc(item.partner)+' · مساهمات '+money(item.contributed)+' · مسحوبات '+money(item.withdrawn)+'</span><strong class="'+(item.balance>=0?"positive":"negative")+'">'+money(item.balance)+'</strong></div>').join("")+'</div></section>'
      : '<p class="panel-note section-gap">لا توجد أرصدة شركاء مسجلة في اللقطة.</p>';
    return '<div class="closing-lines">'+lines.map(line=>
      '<div class="closing-result-line"><div><strong>'+esc(line[0])+'</strong><small>'+esc(line[3])+'</small></div><b class="'+line[2]+'">'+money(line[1])+'</b></div>'
    ).join("")+'</div>'+
    '<div class="closing-secondary-grid">'+
      '<div><span>المتبقي على سيارات الفترة وقت التقفيل</span><b>'+money(snapshot.carReceivables)+'</b></div>'+
      '<div><span>الذمم المستحقة لنا</span><b>'+money(snapshot.receivableDebts)+'</b></div>'+
      '<div><span>الذمم المستحقة علينا</span><b>'+money(snapshot.payableDebts)+'</b></div>'+
      '<div><span>المبالغ المسددة على سيارات الفترة حتى وقت التقفيل (تراكمي)</span><b>'+money(snapshot.carPaidToDate)+'</b></div>'+
      '<div><span>إيداعات رأس المال في الفترة</span><b class="positive">'+money(snapshot.capitalIn)+'</b></div>'+
      '<div><span>مسحوبات رأس المال في الفترة</span><b class="negative">'+money(snapshot.capitalOut)+'</b></div>'+
      '<div><span>صافي حركة رأس المال بعد الأرباح والخسائر</span><b class="'+(snapshot.capitalNet>=0?"positive":"negative")+'">'+money(snapshot.capitalNet)+'</b></div>'+
      '<div><span>عدد السيارات / المباعة / المخزون</span><b>'+snapshot.counts.cars+' / '+snapshot.counts.soldCars+' / '+snapshot.counts.inventoryCars+'</b></div>'+
      '<div><span>عدد قيود المصروفات والذمم ورأس المال</span><b>'+snapshot.counts.expenses+' / '+snapshot.counts.debts+' / '+snapshot.counts.capitalEntries+'</b></div>'+
      '<div><span>عدد حركات الدفتر المالي</span><b>'+snapshot.counts.transactions+'</b></div>'+
      '<div><span>أيام لها حركات نقدية دون مطابقة</span><b class="'+(snapshot.counts.unreconciledCashDays?"negative":"positive")+'">'+snapshot.counts.unreconciledCashDays+'</b></div>'+
      '<div><span>إجمالي فروق جرد الخزينة المسجلة</span><b class="'+(Math.abs(snapshot.cashDifferenceTotal)<0.005?"positive":"negative")+'">'+money(snapshot.cashDifferenceTotal)+'</b></div>'+
    '</div>'+partnerHtml+
    (snapshot.counts.legacyMovements?'<div class="closing-alert section-gap">تتضمن هذه الفترة '+snapshot.counts.legacyMovements+' حركة مرحّلة من النظام السابق؛ لم تتوفر تواريخ كل دفعة أو طرق الدفع الأصلية، لذلك لا يمكن إعادة بناء تفاصيلها اليومية.</div>':"")+
    (snapshot.unreconciledCashDates&&snapshot.unreconciledCashDates.length?'<div class="closing-alert section-gap">توجد أيام حركة نقدية دون مطابقة خزينة: '+snapshot.unreconciledCashDates.map(esc).join("، ")+'</div>':"")+
    '<p class="panel-note section-gap">المبالغ المسددة على السيارات وقت التقفيل رصيد تراكمي. أما التحصيلات والمدفوعات الجديدة فتظهر منفصلة بحسب تاريخ كل حركة من دفتر الحركة.</p>';
  }

  async function closeMonthlyPeriod() {
    if (saving) return;
    const key = closeYear+"-"+String(closeMonth).padStart(2,"0");
    const bounds = monthDateRange(key);
    if (!bounds) return;
    if (key >= today().slice(0,7)) {
      toast("لا يمكن تقفيل الشهر الحالي أو شهر مستقبلي قبل انتهاء الفترة.", "error");
      return;
    }
    if (state.closings.annual[key.slice(0,4)]) {
      toast("السنة مقفلة بالفعل؛ أعد فتح السنة أولاً قبل إجراء أي تغيير على شهرها.", "error");
      return;
    }
    if (state.closings.months[key]) {
      toast("هذا الشهر مقفل بالفعل.", "error");
      return;
    }
    const readiness = closingReadiness(bounds.start,bounds.end);
    if (readiness.blockers.length) {
      toast(readiness.blockers.join(" "), "error");
      return;
    }
    const snapshot = buildPeriodSnapshot(bounds.start,bounds.end,monthLabel(key));
    if (!confirm("سيتم حفظ لقطة نهائية لشهر "+monthLabel(key)+" ومنع إضافة أو تعديل أو حذف قيود هذا الشهر. هل تريد إتمام التقفيل؟")) return;
    const previous = clone(state);
    state.closings.months[key] = {
      locked:true,period:"month",key,closedAt:new Date().toISOString(),
      closedBy:session.user.email || session.user.id,snapshot
    };
    auditClosing("close","month",key,"",snapshot);
    const saved = await saveState(true);
    if (!saved) { state=previous;render();toast("تعذر حفظ التقفيل في قاعدة البيانات.","error");return; }
    await writeAuditEvent({event_type:"close",entity_type:"month_closing",entity_id:key,description:"تقفيل "+monthLabel(key),after_data:snapshot});
    render();
    toast("تم تقفيل "+monthLabel(key)+" وحفظ اللقطة المالية.", "success");
  }

  async function reopenMonthlyPeriod() {
    if (saving) return;
    const key = closeYear+"-"+String(closeMonth).padStart(2,"0");
    const closure = state.closings.months[key];
    if (!closure) return;
    if (state.closings.annual[key.slice(0,4)]) {
      toast("أعد فتح التقفيل السنوي أولاً.", "error");
      return;
    }
    const reason = prompt("اكتب سبب إعادة فتح "+monthLabel(key)+":");
    if (reason === null) return;
    if (String(reason).trim().length < 4) {
      toast("يجب كتابة سبب واضح لإعادة الفتح (4 أحرف على الأقل).", "error");
      return;
    }
    if (!confirm("سيتم إعادة فتح الشهر والسماح بتعديل سجلاته. هل أنت متأكد؟")) return;
    const previous = clone(state);
    auditClosing("reopen","month",key,String(reason).trim(),closure.snapshot || null);
    delete state.closings.months[key];
    const saved = await saveState(true);
    if (!saved) { state=previous;render();toast("تعذر حفظ إعادة الفتح.","error");return; }
    await writeAuditEvent({event_type:"reopen",entity_type:"month_closing",entity_id:key,description:"إعادة فتح "+monthLabel(key)+": "+String(reason).trim(),before_data:closure});
    render();
    toast("تمت إعادة فتح الشهر وتسجيل السبب في سجل المراجعة.", "success");
  }

  async function closeAnnualPeriod() {
    if (saving) return;
    const year = String(closeAnnualYear);
    if (Number(year) >= new Date().getFullYear()) {
      toast("لا يمكن تقفيل السنة الحالية قبل انتهائها.", "error");
      return;
    }
    if (state.closings.annual[year]) {
      toast("هذه السنة مقفلة بالفعل.", "error");
      return;
    }
    const months = activityMonthsForYear(year);
    const unclosed = months.filter(key=>!state.closings.months[key]);
    if (unclosed.length) {
      toast("يجب تقفيل الأشهر ذات الحركات أولاً: "+unclosed.map(monthLabel).join("، "), "error");
      return;
    }
    const start = year+"-01-01", end = year+"-12-31";
    const readiness = closingReadiness(start,end);
    if (readiness.blockers.length) {
      toast(readiness.blockers.join(" "), "error");
      return;
    }
    const snapshot = buildPeriodSnapshot(start,end,"السنة "+year);
    snapshot.monthsIncluded = months.slice();
    if (!confirm("سيتم حفظ التقفيل السنوي لعام "+year+" وقفل كل سجلات السنة. هل تريد الاستمرار؟")) return;
    const previous = clone(state);
    state.closings.annual[year] = {
      locked:true,period:"year",key:year,closedAt:new Date().toISOString(),
      closedBy:session.user.email || session.user.id,snapshot,monthsIncluded:months
    };
    auditClosing("close","year",year,"",snapshot);
    const saved = await saveState(true);
    if (!saved) { state=previous;render();toast("تعذر حفظ التقفيل السنوي.","error");return; }
    await writeAuditEvent({event_type:"close",entity_type:"year_closing",entity_id:year,description:"تقفيل السنة "+year,after_data:snapshot});
    render();
    toast("تم تقفيل سنة "+year+" وحفظ اللقطة المالية.", "success");
  }

  async function reopenAnnualPeriod() {
    if (saving) return;
    const year = String(closeAnnualYear);
    const closure = state.closings.annual[year];
    if (!closure) return;
    const reason = prompt("اكتب سبب إعادة فتح سنة "+year+":");
    if (reason === null) return;
    if (String(reason).trim().length < 4) {
      toast("يجب كتابة سبب واضح لإعادة الفتح (4 أحرف على الأقل).", "error");
      return;
    }
    if (!confirm("سيتم إعادة فتح السنة. الأشهر المقفلة ستظل مقفلة حتى تعيد فتح كل شهر على حدة. هل أنت متأكد؟")) return;
    const previous = clone(state);
    auditClosing("reopen","year",year,String(reason).trim(),closure.snapshot || null);
    delete state.closings.annual[year];
    const saved = await saveState(true);
    if (!saved) { state=previous;render();toast("تعذر حفظ إعادة فتح السنة.","error");return; }
    await writeAuditEvent({event_type:"reopen",entity_type:"year_closing",entity_id:year,description:"إعادة فتح السنة "+year+": "+String(reason).trim(),before_data:closure});
    render();
    toast("تمت إعادة فتح السنة. افتح الأشهر المطلوبة منفردة عند الحاجة.", "success");
  }

  function renderMonthlyClosing() {
    const key = closeYear+"-"+String(closeMonth).padStart(2,"0");
    const bounds = monthDateRange(key);
    const closure = state.closings.months[key];
    const locked = Boolean(closure);
    const hasSavedSnapshot = Boolean(locked && closure && closure.snapshot);
    const snapshot = hasSavedSnapshot ? closure.snapshot : buildPeriodSnapshot(bounds.start,bounds.end,monthLabel(key));
    const readiness = closingReadiness(bounds.start,bounds.end);
    const canClose = !locked && key < today().slice(0,7) && !state.closings.annual[closeYear] && readiness.blockers.length===0;
    const years = new Set([String(new Date().getFullYear())]);
    (state.cars||[]).concat(state.expenses||[],state.debts||[],state.capital||[]).forEach(item=>{
      const date=recordDate(item);if(/^\d{4}/.test(date))years.add(date.slice(0,4));
    });
    const yearOptions=Array.from(years).sort((a,b)=>b.localeCompare(a)).map(year=>'<option value="'+year+'"'+(year===closeYear?" selected":"")+'>'+year+'</option>').join("");
    const monthNames=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const monthOptions=monthNames.map((name,index)=>'<option value="'+(index+1)+'"'+(index+1===closeMonth?" selected":"")+'>'+name+'</option>').join("");
    const blockers=readiness.blockers.length ? '<div class="closing-alert"><strong>ملاحظات تمنع التقفيل</strong><ul>'+readiness.blockers.map(item=>'<li>'+esc(item)+'</li>').join("")+'</ul></div>' :
      '<div class="closing-ok">لا توجد طلبات موظفين معلقة أو سجلات مالية بلا تاريخ ضمن فحص الجاهزية.</div>';
    const action=locked
      ? (state.closings.annual[closeYear] ? '<span class="panel-note">السنة مقفلة؛ يجب إعادة فتح السنة أولاً.</span>' : '<button class="btn btn-outline" data-action="reopen-month">إعادة فتح الشهر بسبب موثّق</button>')
      : '<button class="btn btn-primary" data-action="close-month"'+(canClose?"":" disabled")+'>مراجعة وتقفيل الشهر</button>';
    return heading("التقفيل الشهري","مراجعة نتائج الشهر وحفظ لقطة مالية ثابتة قبل منع تعديل سجلاته.",'<button class="btn btn-outline btn-small" data-action="print">طباعة الكشف</button>')+
      '<section class="panel closing-period-picker"><div><strong>اختر الفترة</strong><p class="panel-note">يُقفل الشهر بعد انتهائه فقط، ويمكن مراجعة أي شهر سابق.</p></div><div class="closing-selects"><label>الشهر<select id="closeMonthSelect" class="search-input">'+monthOptions+'</select></label><label>السنة<select id="closeYearSelect" class="search-input">'+yearOptions+'</select></label></div></section>'+
      '<div class="closing-status-panel"><div><span class="eyebrow">حالة الفترة</span><h3>'+esc(monthLabel(key))+'</h3><p>'+(locked?"تم التقفيل في "+esc(closure.closedAt||"سابقاً"):"الفترة مفتوحة للمراجعة")+'</p></div>'+badge(locked?"مقفل":(key>=today().slice(0,7)?"لم ينته الشهر":"مفتوح"),locked?"ok":"warn")+'</div>'+
      '<div class="kpi-grid">'+
      kpi("إيرادات البيع",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.sales),snapshot.counts.soldCars+" سيارة مباعة","blue")+
      kpi("مجمل الربح",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.grossProfit),"بعد تكلفة السيارات المباعة",snapshot.grossProfit>=0?"green":"red")+
      kpi("مصروفات التشغيل",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.operatingExpenses),"مصروفات الفترة","red")+
      kpi("صافي النتيجة",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.netResult),"بعد الأرباح والخسائر الإضافية",snapshot.netResult>=0?"green":"red")+
      kpi("المتبقي المستحق",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.totalReceivables),"سيارات وذمم الفترة","gold")+
      '</div>'+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>كشف المراجعة المالية</h3><p class="panel-note">راجع كل المبالغ قبل اعتماد الإغلاق.</p></div>'+badge(locked?(hasSavedSnapshot?"لقطة ثابتة":"تقفيل قديم بلا لقطة"):"معاينة قبل التقفيل",locked?"ok":"gold")+'</div>'+renderClosingSnapshot(locked&&!hasSavedSnapshot?null:snapshot)+'</section>'+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>قائمة التحقق قبل الإقفال</h3><p class="panel-note">تُفحص الطلبات والسجلات التي لا تحمل تاريخًا.</p></div>'+action+'</div>'+blockers+'</section>'+
      (locked?'<section class="panel section-gap"><h3>بيانات التقفيل</h3><div class="summary-list"><div class="summary-line"><span>نفّذ التقفيل</span><strong>'+esc(closure.closedBy||"غير مسجل")+'</strong></div><div class="summary-line"><span>وقت التقفيل</span><strong>'+esc(closure.closedAt||"غير متاح")+'</strong></div></div></section>':'')+
      renderClosingAuditLog("month",key);
  }

  function renderYearlyClosing() {
    const year=String(closeAnnualYear);
    const closure=state.closings.annual[year];
    const locked=Boolean(closure);
    const start=year+"-01-01",end=year+"-12-31";
    const months=activityMonthsForYear(year);
    const unclosed=months.filter(key=>!state.closings.months[key]);
    const readiness=closingReadiness(start,end);
    const hasSavedSnapshot=Boolean(locked && closure && closure.snapshot);
    const snapshot=hasSavedSnapshot?closure.snapshot:buildPeriodSnapshot(start,end,"السنة "+year);
    const notEnded=Number(year)>=new Date().getFullYear();
    const blockers=readiness.blockers.slice();
    if(unclosed.length) blockers.unshift("الأشهر التي تحتوي على حركات ولم تُقفل: "+unclosed.map(monthLabel).join("، "));
    if(notEnded) blockers.unshift("يجب انتهاء السنة أولاً قبل اعتماد التقفيل السنوي.");
    const canClose=!locked&&!notEnded&&!unclosed.length&&!readiness.blockers.length;
    const years=new Set([String(new Date().getFullYear()-1),String(new Date().getFullYear())]);
    (state.cars||[]).concat(state.expenses||[],state.debts||[],state.capital||[]).forEach(item=>{
      const date=recordDate(item);if(/^\d{4}/.test(date))years.add(date.slice(0,4));
    });
    const yearOptions=Array.from(years).sort((a,b)=>b.localeCompare(a)).map(y=>'<option value="'+y+'"'+(y===year?" selected":"")+'>'+y+'</option>').join("");
    const monthlyRows=months.length?months.map(key=>'<div class="summary-line"><span>'+esc(monthLabel(key))+'</span>'+badge(state.closings.months[key]?"مقفل":"مفتوح",state.closings.months[key]?"ok":"warn")+'</div>').join(""):empty("لا توجد حركات مالية مؤرخة في هذه السنة.");
    const action=locked
      ? '<button class="btn btn-outline" data-action="reopen-year">إعادة فتح السنة بسبب موثّق</button>'
      : '<button class="btn btn-primary" data-action="close-year"'+(canClose?"":" disabled")+'>اعتماد التقفيل السنوي</button>';
    const previous=state.closings.annual[String(Number(year)-1)];
    const previousText=previous&&previous.snapshot?'<section class="panel section-gap"><h3>مقارنة مع السنة السابقة</h3><div class="summary-list"><div class="summary-line"><span>صافي نتيجة '+(Number(year)-1)+'</span><strong>'+money(previous.snapshot.netResult)+'</strong></div><div class="summary-line"><span>صافي نتيجة '+year+'</span><strong class="'+(snapshot.netResult>=0?"positive":"negative")+'">'+money(snapshot.netResult)+'</strong></div><div class="summary-line"><span>التغير بين السنتين</span><strong class="'+(snapshot.netResult-previous.snapshot.netResult>=0?"positive":"negative")+'">'+money(snapshot.netResult-previous.snapshot.netResult)+'</strong></div></div></section>':"";
    return heading("التقفيل السنوي","تجميع نتائج السنة من الأشهر المقفلة، ومراجعة صافي الربح والذمم ورأس المال.",'<button class="btn btn-outline btn-small" data-action="print">طباعة التقرير السنوي</button>')+
      '<section class="panel closing-period-picker"><div><strong>السنة المالية</strong><p class="panel-note">يشترط تقفيل كل شهر به حركة مالية قبل اعتماد السنة.</p></div><label>السنة<select id="closeAnnualYearSelect" class="search-input">'+yearOptions+'</select></label></section>'+
      '<div class="closing-status-panel"><div><span class="eyebrow">حالة السنة</span><h3>'+esc(year)+'</h3><p>'+(locked?"تم التقفيل في "+esc(closure.closedAt||"سابقاً"):"السنة مفتوحة للمراجعة")+'</p></div>'+badge(locked?"مقفل":(notEnded?"لم تنته السنة":"جاهز للمراجعة"),locked?"ok":"warn")+'</div>'+
      '<div class="kpi-grid">'+
      kpi("إيرادات السنة",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.sales),snapshot.counts.soldCars+" سيارة مباعة","blue")+
      kpi("مجمل ربح السيارات",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.grossProfit),"المبيعات ناقص التكلفة",snapshot.grossProfit>=0?"green":"red")+
      kpi("مصروفات السنة",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.operatingExpenses),"كل مصروفات التشغيل","red")+
      kpi("صافي نتيجة السنة",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.netResult),"النتيجة بعد الربح والخسارة الإضافية",snapshot.netResult>=0?"green":"red")+
      kpi("إجمالي المستحقات",locked&&!hasSavedSnapshot?"غير متاح":money(snapshot.totalReceivables),"مبالغ باقية وذمم","gold")+
      '</div>'+
      '<div class="two-col section-gap"><section class="panel"><h3>حالة الأشهر ذات الحركة</h3><div class="summary-list">'+monthlyRows+'</div></section><section class="panel"><h3>شروط اعتماد السنة</h3>'+ (blockers.length?'<div class="closing-alert"><ul>'+blockers.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div>':'<div class="closing-ok">كل الأشهر ذات الحركات مقفلة، ولا توجد طلبات معلقة أو سجلات بلا تاريخ.</div>')+'<div class="section-gap">'+action+'</div></section></div>'+
      '<section class="panel section-gap"><h3>القائمة السنوية التفصيلية</h3>'+renderClosingSnapshot(locked&&!hasSavedSnapshot?null:snapshot)+'</section>'+
      previousText+
      (locked?'<section class="panel section-gap"><h3>بيانات التقفيل السنوي</h3><div class="summary-list"><div class="summary-line"><span>نفّذ التقفيل</span><strong>'+esc(closure.closedBy||"غير مسجل")+'</strong></div><div class="summary-line"><span>وقت التقفيل</span><strong>'+esc(closure.closedAt||"غير متاح")+'</strong></div></div></section>':'')+
      renderClosingAuditLog("year",year);
  }

  function transactionCategoryLabel(category) {
    const labels={car_collection:"تحصيل سيارة",car_purchase:"سداد شراء سيارة",car_prep:"سداد تجهيز سيارة",expense:"مصروف تشغيل",capital_deposit:"إيداع رأس مال",capital_withdrawal:"سحب رأس مال",manual:"حركة أخرى",reversal:"قيد عكسي"};
    return labels[category]||category||"حركة مالية";
  }
  function paymentMethodLabel(method) {
    const labels={cash:"نقداً",bank_transfer:"تحويل بنكي",check:"شيك",card:"بطاقة",other:"غير محدد"};
    return labels[method]||method||"غير محدد";
  }
  function renderCashbook() {
    const month=today().slice(0,7);
    const rows=financialTransactions.slice().sort((a,b)=>String(b.transaction_date||"").localeCompare(String(a.transaction_date||"")));
    const monthRows=rows.filter(t=>String(t.transaction_date||"").startsWith(month));
    const sum=(list,direction)=>list.filter(t=>t.direction===direction).reduce((n,t)=>n+amount(t.amount),0);
    const inflow=sum(monthRows,"inflow"),outflow=sum(monthRows,"outflow");
    const daily=cashTotalsForDate(today());
    const reconciliation=cashReconciliations.find(r=>r.reconciliation_date===today());
    const previous=cashReconciliations.filter(r=>r.reconciliation_date<today()).sort((a,b)=>b.reconciliation_date.localeCompare(a.reconciliation_date))[0];
    const cashSincePrevious=previous?financialTransactions.filter(tx=>
      tx.transaction_date>previous.reconciliation_date && tx.transaction_date<today() && tx.payment_method==="cash"
    ).reduce((sum,tx)=>sum+(tx.direction==="inflow"?amount(tx.amount):-amount(tx.amount)),0):0;
    const opening=reconciliation?amount(reconciliation.opening_cash):(previous?amount(previous.counted_cash)+cashSincePrevious:0);
    const expected=reconciliation?amount(reconciliation.expected_cash):opening+daily.cashIn-daily.cashOut;
    const cards=rows.slice(0,100).map(t=>{
      const car=state.cars.find(c=>String(c.id)===String(t.car_id||""));
      const sign=t.direction==="inflow"?"+":"−";
      return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(transactionCategoryLabel(t.category))+'</div><div class="data-card-sub">'+dateText(t.transaction_date)+' · '+esc(t.person_name||"بدون اسم")+'</div></div>'+badge(t.direction==="inflow"?"وارد":"منصرف",t.direction==="inflow"?"ok":"warn")+'</div><div class="data-card-grid"><div class="data-cell"><span>القيمة</span><strong class="'+(t.direction==="inflow"?"positive":"negative")+'">'+sign+money(t.amount)+'</strong></div><div class="data-cell"><span>طريقة الدفع</span><strong>'+esc(paymentMethodLabel(t.payment_method))+'</strong></div><div class="data-cell"><span>السيارة</span><strong>'+esc(car?car.model:(t.car_id||"—"))+'</strong></div><div class="data-cell"><span>المرجع</span><strong>'+esc(t.reference||"—")+'</strong></div></div>'+(t.is_legacy?'<p class="panel-note">رصيد مرحّل من السجلات السابقة؛ تاريخ الدفعة الأصلي غير متاح.</p>':"")+'<div class="card-actions">'+(!t.reversal_of&&!financialTransactions.some(row=>String(row.reversal_of||"")===String(t.id))?'<button class="btn btn-danger btn-small" data-action="reverse-financial-transaction" data-id="'+esc(t.id)+'">عكس الحركة بسبب موثّق</button>':(t.reversal_of?badge("قيد عكسي","warn"):""))+'</div></article>';
    }).join("");
    return heading("دفتر الحركة والخزينة","دفتر موحد للمقبوضات والمدفوعات مع الاحتفاظ بالأثر التاريخي.",'<button class="btn btn-primary btn-small" data-action="add-financial-transaction">+ تسجيل حركة</button>')+
      '<div class="kpi-grid">'+kpi("الوارد خلال الشهر",money(inflow),"من أول الشهر","green")+kpi("المنصرف خلال الشهر",money(outflow),"من أول الشهر","red")+kpi("صافي الحركة",money(inflow-outflow),"الوارد ناقص المنصرف",inflow>=outflow?"blue":"red")+kpi("عدد الحركات",monthRows.length,"حركة خلال الشهر","gold")+'</div>'+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>المطابقة اليومية للخزينة</h3><p class="panel-note">الرصيد المتوقع = الافتتاحي + وارد النقدية − منصرف النقدية.</p></div>'+badge(reconciliation?"تمت المطابقة":"بانتظار المطابقة",reconciliation?"ok":"warn")+'</div>'+
      '<div class="dashboard-info-strip"><span>وارد نقدي: <b class="positive">'+money(daily.cashIn)+'</b></span><span>منصرف نقدي: <b class="negative">'+money(daily.cashOut)+'</b></span><span>وارد بنكي: <b>'+money(daily.bankIn)+'</b></span><span>منصرف بنكي: <b>'+money(daily.bankOut)+'</b></span></div>'+
      '<div class="form-grid three section-gap"><label>النقدية الافتتاحية<input id="reconOpeningCash" type="number" min="0" step="0.01" value="'+opening+'" dir="ltr"></label><label>النقدية الفعلية بعد الجرد<input id="reconCountedCash" type="number" min="0" step="0.01" value="'+(reconciliation?amount(reconciliation.counted_cash):"")+'" placeholder="المبلغ الموجود فعلياً" dir="ltr"></label><label>الرصيد المتوقع<input readonly value="'+expected.toFixed(2)+' ج.م"></label><label class="full">ملاحظات<input id="reconNotes" value="'+esc(reconciliation?reconciliation.notes||"":"")+'" placeholder="تفاصيل فرق الخزينة أو الجرد"></label></div>'+
      (reconciliation?'<div class="summary-line section-gap"><span>فرق المطابقة</span><strong class="'+(Math.abs(amount(reconciliation.cash_difference))<0.005?"positive":"negative")+'">'+money(reconciliation.cash_difference)+'</strong></div>':"")+
      '<div class="page-actions section-gap"><button class="btn btn-primary btn-small" data-action="save-reconciliation">حفظ مطابقة اليوم</button></div></section>'+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>الحركات الأخيرة</h3><p class="panel-note">أحدث 100 حركة محفوظة في الدفتر المالي.</p></div>'+badge(financialTransactions.length+" حركة","gold")+'</div>'+(cards?'<div class="data-list">'+cards+'</div>':empty("لا توجد حركات مالية بعد."))+'</section>';
  }
  async function saveCashReconciliation() {
    if(saving)return;
    const date=today();
    if(isPeriodLocked(date)){toast("الفترة الحالية مقفلة ولا يمكن تسجيل مطابقة فيها.","error");return;}
    const opening=num($("reconOpeningCash").value);
    if($("reconCountedCash").value.trim()===""){toast("أدخل النقدية الفعلية بعد الجرد.","error");return;}
    const counted=num($("reconCountedCash").value);
    if(opening<0||counted<0){toast("القيم النقدية لا يمكن أن تكون سالبة.","error");return;}
    const totals=cashTotalsForDate(date);
    const expected=opening+totals.cashIn-totals.cashOut;
    const beforeReconciliation=cashReconciliations.find(r=>r.reconciliation_date===date)||null;
    const payload={user_id:session.user.id,reconciliation_date:date,opening_cash:opening,cash_in:totals.cashIn,cash_out:totals.cashOut,expected_cash:expected,counted_cash:counted,bank_in:totals.bankIn,bank_out:totals.bankOut,notes:$("reconNotes").value.trim(),updated_by:session.user.id};
    const result=await db.from("cash_reconciliations").upsert(payload,{onConflict:"user_id,reconciliation_date"}).select("*").single();
    if(result.error){toast("تعذر حفظ المطابقة: "+result.error.message,"error");return;}
    const index=cashReconciliations.findIndex(r=>r.reconciliation_date===date);
    if(index>=0)cashReconciliations[index]=result.data;else cashReconciliations.unshift(result.data);
    await writeAuditEvent({event_type:"update",entity_type:"cash_reconciliations",entity_id:result.data.id,description:"مطابقة الخزينة ليوم "+date,before_data:beforeReconciliation,after_data:result.data});
    render();
    const difference=counted-expected;
    toast(Math.abs(difference)<0.005?"تمت مطابقة الخزينة دون فرق.":"تم حفظ المطابقة ويوجد فرق "+money(difference)+".",Math.abs(difference)<0.005?"success":"error");
  }

  function renderInventory() {
    const stock=state.cars.filter(car=>!isSoldCar(car));
    const sold=state.cars.filter(isSoldCar);
    const totalStock=stock.reduce((sum,car)=>sum+amount(car.purchasePrice)+amount(car.prepCost),0);
    const profits=sold.map(car=>({car,details:carProfitDetails(car)}));
    const totalGross=profits.reduce((sum,row)=>sum+row.details.profit,0);
    const stockCards=stock.slice().sort((a,b)=>String(a.date||"").localeCompare(String(b.date||""))).map(car=>{
      const cost=amount(car.purchasePrice)+amount(car.prepCost);
      const days=car.date?Math.max(0,Math.floor((new Date(today()+"T00:00:00")-new Date(car.date+"T00:00:00"))/86400000)):null;
      const paidToSupplier=carAcquisitionPaid(car.id);
      return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(car.model||"سيارة")+'</div><div class="data-card-sub">'+esc(car.chassis||"بدون شاسيه")+' · '+dateText(car.date)+'</div></div>'+badge(car.status||"قيد البيع","gold")+'</div><div class="data-card-grid"><div class="data-cell"><span>تكلفة الشراء والتجهيز</span><strong>'+money(cost)+'</strong></div><div class="data-cell"><span>المسدد للمورد</span><strong>'+money(paidToSupplier)+'</strong></div><div class="data-cell"><span>مدة بقاء السيارة</span><strong>'+(days===null?"غير محدد":days+" يوم")+'</strong></div><div class="data-cell"><span>الشريك</span><strong>'+esc(car.partnerName||"—")+'</strong></div><div class="data-cell"><span>مساهمة الشريك</span><strong>'+money(car.partnerContribution)+'</strong></div></div></article>';
    }).join("");
    const profitCards=profits.map(row=>{
      const car=row.car,d=row.details;
      return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(car.model||"سيارة")+'</div><div class="data-card-sub">'+esc(car.customer||"عميل غير محدد")+' · '+dateText(car.date)+'</div></div>'+badge(d.profit>=0?"ربح":"خسارة",d.profit>=0?"ok":"warn")+'</div><div class="data-card-grid"><div class="data-cell"><span>سعر البيع</span><strong>'+money(car.salePrice)+'</strong></div><div class="data-cell"><span>تكلفة الشراء والتجهيز</span><strong>'+money(d.cost)+'</strong></div><div class="data-cell"><span>مجمل ربح السيارة</span><strong class="'+(d.profit>=0?"positive":"negative")+'">'+money(d.profit)+'</strong></div><div class="data-cell"><span>التحصيل / سعر البيع</span><strong>'+money(carPaid(car))+' / '+money(car.salePrice)+'</strong></div></div>'+(d.showPartner?'<div class="summary-line"><span>حصة '+esc(car.partnerName||"الشريك")+' '+(d.inferred?"التقديرية حسب التمويل":"حسب النسبة المتفق عليها")+' ('+d.sharePercent.toFixed(2)+'%)</span><strong>'+money(d.partnerProfit)+'</strong></div><div class="summary-line"><span>حصة المعرض من مجمل الربح</span><strong>'+money(d.showroomProfit)+'</strong></div>':"")+'</article>';
    }).join("");
    return heading("مخزون السيارات وربحية كل سيارة","حالة السيارات المتاحة ومدة بقائها وربحية السيارات المباعة وتوزيع حصة الشريك.",'<button class="btn btn-outline btn-small" data-action="print">طباعة</button>')+
      '<div class="kpi-grid">'+kpi("سيارات في المخزون",stock.length,"لم تسجل كمباعة","gold")+kpi("تكلفة المخزون",money(totalStock),"شراء وتجهيز","blue")+kpi("سيارات مباعة",sold.length,"بحالة بيع مسجلة","green")+kpi("مجمل ربح السيارات",money(totalGross),"قبل المصروفات التشغيلية",totalGross>=0?"green":"red")+'</div>'+
      '<section class="panel section-gap"><h3>السيارات المتاحة / قيد البيع</h3>'+(stockCards?'<div class="data-list">'+stockCards+'</div>':empty("لا توجد سيارات في المخزون."))+'</section>'+
      '<section class="panel section-gap"><h3>ربحية السيارات المباعة وتوزيع حصة الشريك</h3><p class="panel-note">إذا لم تدخل نسبة الشريك المتفق عليها، يعرض النظام تقديرًا تناسبيًا حسب مساهمة الشريك إلى تكلفة السيارة؛ لا يُعد ذلك بديلًا عن اتفاق الشراكة.</p>'+(profitCards?'<div class="data-list">'+profitCards+'</div>':empty("لا توجد سيارات مباعة."))+'</section>';
  }

  function renderCustomers() {
    if(selectedCustomer){
      const customer=customerGroups().find(item=>item.name===selectedCustomer);
      if(!customer){selectedCustomer="";return renderCustomers();}
      const cars=customer.cars;
      const carIds=new Set(cars.map(car=>String(car.id)));
      const transactions=financialTransactions.filter(tx=>carIds.has(String(tx.car_id||""))).sort((a,b)=>String(a.transaction_date).localeCompare(String(b.transaction_date)));
      const debts=(state.debts||[]).filter(item=>String(item.partyName||"").trim()===selectedCustomer);
      const carCards=cars.map(car=>{
        const payments=currentCarPaymentRows(car.id);
        return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(car.model||"سيارة")+'</div><div class="data-card-sub">'+dateText(car.date)+' · '+esc(car.status||"")+'</div></div>'+badge(carRemaining(car)>0?"متبقي":"مسدد",carRemaining(car)>0?"warn":"ok")+'</div><div class="data-card-grid"><div class="data-cell"><span>سعر البيع</span><strong>'+money(car.salePrice)+'</strong></div><div class="data-cell"><span>المحصّل</span><strong class="positive">'+money(carPaid(car))+'</strong></div><div class="data-cell"><span>المتبقي</span><strong class="negative">'+money(carRemaining(car))+'</strong></div><div class="data-cell"><span>عدد الحركات</span><strong>'+payments.length+'</strong></div></div>'+(payments.length?'<div class="summary-list">'+payments.map(payment=>'<div class="summary-line"><span>'+dateText(payment.transaction_date)+' · '+esc(paymentMethodLabel(payment.payment_method))+' · '+esc(payment.reference||"تحصيل")+'</span><strong class="positive">'+money(payment.direction==="inflow"?payment.amount:-payment.amount)+'</strong></div>').join("")+'</div>':"")+'</article>';
      }).join("");
      const debtCards=debts.map(item=>'<div class="summary-line"><span>'+esc(item.description||item.nature||"ذمة")+' · استحقاق '+dateText(item.dueDate)+'</span><strong>'+money(debtRemaining(item))+'</strong></div>').join("");
      const legacyNote=transactions.some(tx=>tx.is_legacy)?'<p class="panel-note section-gap">بعض الدفعات رُحّلت من إجمالي مسدد سابق؛ لا تتوفر تواريخ أو طرق الدفع التفصيلية لها.</p>':"";
      return heading("كشف حساب العميل: "+selectedCustomer,"مبيعات العميل والتحصيلات والذمم المرتبطة به.",'<button class="btn btn-outline btn-small" data-action="customer-back">عودة للعملاء</button><button class="btn btn-outline btn-small" data-action="print">طباعة الكشف</button>')+
        '<div class="kpi-grid">'+kpi("إجمالي المبيعات",money(customer.sales),"قيمة السيارات المباعة","blue")+kpi("إجمالي التحصيل",money(customer.paid),"من دفتر التحصيلات","green")+kpi("المتبقي",money(customer.remaining),"رصيد السيارات","red")+kpi("الذمم المستحقة لنا",money(debts.filter(item=>String(item.nature||"").includes("لنا")).reduce((sum,item)=>sum+debtRemaining(item),0)),"مستحق من العميل","gold")+'</div>'+
        '<section class="panel section-gap"><h3>السيارات والدفعات</h3>'+(carCards?'<div class="data-list">'+carCards+'</div>':empty("لا توجد سيارات مرتبطة بهذا العميل."))+'</section>'+
        (debtCards?'<section class="panel section-gap"><h3>الذمم والأقساط</h3><div class="summary-list">'+debtCards+'</div></section>':"")+legacyNote;
    }
    const groups=customerGroups();
    const cards=groups.map(item=>'<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(item.name)+'</div><div class="data-card-sub">'+item.cars.length+' سيارة مرتبطة بالعميل</div></div>'+badge(item.remaining>0?"عليه رصيد":"مسدد",item.remaining>0?"warn":"ok")+'</div><div class="data-card-grid"><div class="data-cell"><span>المبيعات</span><strong>'+money(item.sales)+'</strong></div><div class="data-cell"><span>المحصّل</span><strong class="positive">'+money(item.paid)+'</strong></div><div class="data-cell"><span>المتبقي</span><strong class="negative">'+money(item.remaining)+'</strong></div><div class="data-cell"><span>عدد السيارات</span><strong>'+item.cars.length+'</strong></div><div class="data-cell"><span>ذمم إضافية مستحقة</span><strong>'+money(item.debtReceivable)+'</strong></div></div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="customer-statement" data-customer="'+esc(item.name)+'">فتح كشف الحساب</button></div></article>').join("");
    return heading("حسابات العملاء","كشف مجمّع لكل عميل من مبيعات السيارات ودفعات التحصيل والذمم.",'<button class="btn btn-outline btn-small" data-action="print">طباعة</button>')+
      '<div class="kpi-grid">'+kpi("عدد العملاء",groups.length,"لديهم سيارات مسجلة","blue")+kpi("إجمالي المبيعات",money(groups.reduce((sum,item)=>sum+item.sales,0)),"قيمة المبيعات","green")+kpi("إجمالي التحصيل",money(groups.reduce((sum,item)=>sum+item.paid,0)),"دفعات مسجلة","gold")+kpi("إجمالي المتبقي",money(groups.reduce((sum,item)=>sum+item.remaining+item.debtReceivable,0)),"سيارات وذمم مستحقة","red")+'</div>'+
      (cards?'<div class="data-list">'+cards+'</div>':empty("لا توجد أسماء عملاء مرتبطة بالسيارات."));
  }

  function renderReminders() {
    const now=today();
    const debtDue=(state.debts||[]).filter(item=>debtRemaining(item)>0&&item.dueDate).map(item=>{
      const days=Math.round((new Date(item.dueDate+"T00:00:00")-new Date(now+"T00:00:00"))/86400000);
      return Object.assign({days,kind:"debt"},item);
    });
    const carDue=(state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&car.nextDueDate).map(car=>{
      const days=Math.round((new Date(car.nextDueDate+"T00:00:00")-new Date(now+"T00:00:00"))/86400000);
      return {id:car.id,kind:"car",partyName:car.customer||"عميل غير محدد",description:car.model||"سيارة",dueDate:car.nextDueDate,totalAmount:car.salePrice,paidAmount:carPaid(car),remaining:carRemaining(car),phone:car.phone,days};
    });
    const due=debtDue.concat(carDue).sort((a,b)=>a.days-b.days);
    const overdue=due.filter(item=>item.days<0);
    const soon=due.filter(item=>item.days>=0&&item.days<=7);
    const later=due.filter(item=>item.days>7);
    const renderList=list=>list.length?'<div class="data-list">'+list.map(item=>{
      const remaining=item.kind==="car"?carRemaining(item):debtRemaining(item);
      const collection=item.kind==="car"?"cars":"debts";
      return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(item.partyName||"جهة غير محددة")+'</div><div class="data-card-sub">'+esc(item.description||"ذمة / قسط")+' · '+dateText(item.dueDate)+' · '+(item.kind==="car"?"قسط سيارة":"ذمة")+'</div></div>'+badge(item.days<0?"متأخر "+Math.abs(item.days)+" يوم":(item.days===0?"مستحق اليوم":"خلال "+item.days+" يوم"),item.days<0?"warn":"gold")+'</div><div class="data-card-grid"><div class="data-cell"><span>الإجمالي</span><strong>'+money(item.totalAmount)+'</strong></div><div class="data-cell"><span>المسدد</span><strong class="positive">'+money(item.kind==="car"?carPaid(item):item.paidAmount)+'</strong></div><div class="data-cell"><span>المتبقي</span><strong class="negative">'+money(remaining)+'</strong></div><div class="data-cell"><span>الهاتف</span><strong>'+esc(item.phone||"—")+'</strong></div></div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="'+collection+'" data-id="'+esc(item.id)+'">فتح السجل</button></div></article>';
    }).join("")+'</div>':empty("لا توجد استحقاقات في هذه المجموعة.");
    const withoutDue=(state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&!car.nextDueDate);
    return heading("التنبيهات والاستحقاقات","الأقساط المتأخرة والقريبة، والأرصدة التي لا تحتوي على تاريخ استحقاق.",'<button class="btn btn-outline btn-small" data-action="print">طباعة</button>')+
      '<div class="kpi-grid">'+kpi("أقساط متأخرة",overdue.length,"تجاوزت موعدها","red")+kpi("مستحقة خلال 7 أيام",soon.length,"تحتاج متابعة","gold")+kpi("مواعيد لاحقة",later.length,"بعد أكثر من أسبوع","blue")+kpi("أرصدة بلا موعد",withoutDue.length,"تحتاج جدولة","")+'</div>'+
      '<section class="panel section-gap"><h3>متأخرة عن موعدها</h3>'+renderList(overdue)+'</section>'+
      '<section class="panel section-gap"><h3>مستحقة خلال أسبوع</h3>'+renderList(soon)+'</section>'+
      '<section class="panel section-gap"><h3>مواعيد قادمة</h3>'+renderList(later)+'</section>'+
      '<section class="panel section-gap"><h3>سيارات لها رصيد بلا تاريخ استحقاق</h3>'+(withoutDue.length?'<div class="summary-list">'+withoutDue.map(car=>'<div class="summary-line"><span>'+esc(car.customer||"عميل غير محدد")+' · '+esc(car.model||"سيارة")+'</span><strong class="negative">'+money(carRemaining(car))+'</strong></div>').join("")+'</div>':empty("لا توجد أرصدة سيارات دون استحقاق."))+'</section>';
  }

  function renderAudit() {
    const rows=auditEntries.slice(0,120);
    const labels={create:"إضافة",update:"تعديل",delete:"حذف",close:"تقفيل",reopen:"إعادة فتح",restore:"استعادة",backup:"نسخ احتياطي",reversal:"عكس حركة",system:"نظام"};
    const cards=rows.map(item=>
      '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(labels[item.event_type]||item.event_type)+' · '+esc(item.entity_type)+'</div><div class="data-card-sub">'+esc(item.entity_id||"")+' · '+esc(item.created_at||"")+'</div></div>'+badge(labels[item.event_type]||item.event_type,item.event_type==="delete"?"warn":"gold")+'</div><div class="data-card-sub">'+esc(item.description||"")+'</div>'+
      ((item.before_data||item.after_data)?'<details class="formula-detail"><summary>عرض تفاصيل التغيير قبل وبعد</summary><div><strong>قبل</strong><pre>'+esc(JSON.stringify(item.before_data||null,null,2))+'</pre><strong>بعد</strong><pre>'+esc(JSON.stringify(item.after_data||null,null,2))+'</pre></div></details>':"")+'</article>'
    ).join("");
    return heading("سجل المراجعة والتعديلات","أثر زمني للإضافات والتعديلات والحذف والتقفيل والتسويات.",'<button class="btn btn-outline btn-small" data-action="refresh-audit">تحديث السجل</button><button class="btn btn-outline btn-small" data-action="print">طباعة</button>')+
      (cards?'<div class="data-list">'+cards+'</div>':empty("لا توجد أحداث مراجعة مسجلة بعد."));
  }

  async function createCloudBackup(type) {
    const payload={state:clone(state),financialTransactions:clone(financialTransactions),cashReconciliations:clone(cashReconciliations)};
    const label=type==="daily"?"نسخة تلقائية يومية "+today():(type==="before_restore"?"نسخة قبل الاستعادة "+new Date().toLocaleString("ar-EG"):"نسخة يدوية "+new Date().toLocaleString("ar-EG"));
    const result=await db.from("app_backups").insert({
      user_id:session.user.id,created_by:session.user.id,backup_type:type,label,payload
    }).select("id,created_at,backup_type,label").single();
    if(result.error)throw result.error;
    backupEntries.unshift(result.data);
    await writeAuditEvent({event_type:"backup",entity_type:"app_backups",entity_id:result.data.id,description:label});
    return result.data;
  }

  function renderBackups() {
    const rows=backupEntries.slice(0,60);
    const labels={daily:"تلقائية",manual:"يدوية",migration_baseline:"قبل التطوير",before_restore:"قبل الاستعادة"};
    const cards=rows.map(item=>
      '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">'+esc(item.label||"نسخة احتياطية")+'</div><div class="data-card-sub">'+esc(item.created_at||"")+'</div></div>'+badge(labels[item.backup_type]||item.backup_type,"gold")+'</div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="restore-backup" data-id="'+esc(item.id)+'">استعادة النسخة</button></div></article>'
    ).join("");
    return heading("النسخ الاحتياطي والاستعادة","نسخ يومية تلقائية ونسخ يدوية محفوظة في قاعدة البيانات، مع نسخة قابلة للتنزيل.",'<button class="btn btn-primary btn-small" data-action="create-backup">إنشاء نسخة الآن</button><button class="btn btn-outline btn-small" data-action="backup-json">تنزيل JSON</button>')+
      '<div class="kpi-grid">'+kpi("النسخ المحفوظة",backupEntries.length,"في التخزين السحابي","blue")+kpi("النسخ اليومية",backupEntries.filter(x=>x.backup_type==="daily").length,"تُنشأ عند أول دخول يومي","green")+kpi("النسخ اليدوية",backupEntries.filter(x=>x.backup_type==="manual").length,"بقرار المدير","gold")+'</div>'+
      (cards?'<div class="data-list">'+cards+'</div>':empty("لا توجد نسخ احتياطية بعد."))+
      '<p class="panel-note section-gap">الاستعادة تحفظ سجل الحركات المالي ولا تحذف قيودًا تاريخية؛ عند اختلاف بيانات المصروفات أو رأس المال تُسجل تسويات عكسية للحفاظ على الأثر المحاسبي.</p>';
  }

  async function restoreCloudBackup(id) {
    const result=await db.from("app_backups").select("*").eq("id",id).eq("user_id",session.user.id).single();
    if(result.error){toast("تعذر تحميل النسخة: "+result.error.message,"error");return;}
    const snapshot=result.data.payload||{};
    const target=snapshot.state&&typeof snapshot.state==="object"?snapshot.state:snapshot;
    if(!target||typeof target!=="object"||!Array.isArray(target.cars)||!Array.isArray(target.expenses)){
      toast("صيغة النسخة غير صالحة أو لا تحتوي على بيانات التطبيق الأساسية.","error");return;
    }
    if(!confirm("سيتم استبدال بيانات التطبيق بهذه النسخة. سيظل دفتر الحركات المالي محفوظاً، وستُسجل التسويات اللازمة بدل حذف الحركات. هل تريد المتابعة؟"))return;
    const before=clone(state);
    try{
      await createCloudBackup("before_restore");
      state=normaliseState(target);
      const saved=await saveState(true);
      if(!saved)throw new Error("تعذر حفظ بيانات النسخة المستعادة.");
      if(Array.isArray(snapshot.cashReconciliations)){
        for(const reconciliation of snapshot.cashReconciliations){
          const restored=Object.assign({},reconciliation,{user_id:session.user.id,updated_by:session.user.id});
          delete restored.id;
          const upserted=await db.from("cash_reconciliations").upsert(restored,{onConflict:"user_id,reconciliation_date"}).select("*").single();
          if(upserted.error)throw upserted.error;
          const idx=cashReconciliations.findIndex(item=>item.reconciliation_date===upserted.data.reconciliation_date);
          if(idx>=0)cashReconciliations[idx]=upserted.data;else cashReconciliations.push(upserted.data);
        }
      }
      await syncCashbookWithAppState(state);
      await writeAuditEvent({event_type:"restore",entity_type:"app_backups",entity_id:id,description:"استعادة بيانات التطبيق ومطابقات الخزينة من نسخة محفوظة؛ دفتر الحركات المالي ظل append-only"});
      render();toast("تمت استعادة بيانات التطبيق مع الاحتفاظ بسجل الحركات المالية.","success");
    }catch(error){
      state=before;
      toast("تعذرت الاستعادة: "+(error.message||"خطأ غير معروف"),"error");
      render();
    }
  }

  async function createManualBackup() {
    try{
      const result=await createCloudBackup("manual");
      render();
      toast("تم حفظ النسخة الاحتياطية: "+result.label,"success");
    }catch(error){toast("تعذر إنشاء النسخة: "+error.message,"error");}
  }


  function managementRecommendations() {
    const current=today();
    const recommendations=[];
    const overdueDebts=(state.debts||[]).filter(item=>debtRemaining(item)>0&&item.dueDate&&item.dueDate<current);
    const overdueCars=(state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&car.nextDueDate&&car.nextDueDate<current);
    const dueSoonDebts=(state.debts||[]).filter(item=>debtRemaining(item)>0&&item.dueDate&&item.dueDate>=current&&item.dueDate<=new Date(Date.now()+7*86400000).toISOString().slice(0,10));
    const dueSoonCars=(state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&car.nextDueDate&&car.nextDueDate>=current&&car.nextDueDate<=new Date(Date.now()+7*86400000).toISOString().slice(0,10));
    const withoutDue=(state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&!car.nextDueDate);
    const agedStock=(state.cars||[]).filter(car=>!isSoldCar(car)&&car.date&&Math.floor((new Date(current+"T00:00:00")-new Date(car.date+"T00:00:00"))/86400000)>=60);
    const pending=requests.filter(item=>item.status==="pending");
    const unreconciledDates=Array.from(new Set((financialTransactions||[]).filter(tx=>tx.payment_method==="cash"&&tx.transaction_date<current).map(tx=>tx.transaction_date)))
      .filter(date=>!(cashReconciliations||[]).some(item=>item.reconciliation_date===date));
    const partnerAgreementMissing=(state.cars||[]).filter(car=>amount(car.partnerContribution)>0&&!(Number(car.partnerSharePercent)>0));
    const cashDifferences=(cashReconciliations||[]).filter(item=>Math.abs(amount(item.cash_difference))>=0.01);
    if(overdueDebts.length+overdueCars.length) recommendations.push({level:"urgent",title:"متابعة الأقساط المتأخرة",detail:"يوجد "+(overdueDebts.length+overdueCars.length)+" استحقاق متأخر يحتاج التواصل مع العميل وتحديث التحصيل.",view:"reminders",action:"فتح الاستحقاقات"});
    if(unreconciledDates.length) recommendations.push({level:"urgent",title:"استكمال مطابقة الخزينة",detail:"هناك "+unreconciledDates.length+" يوم سابق به حركة نقدية دون مطابقة. راجع النقدية الفعلية وسجّل المطابقة.",view:"cashbook",action:"فتح دفتر الخزينة"});
    if(dueSoonDebts.length+dueSoonCars.length) recommendations.push({level:"warning",title:"استحقاقات خلال 7 أيام",detail:"يوجد "+(dueSoonDebts.length+dueSoonCars.length)+" قسط أو ذمة يقترب موعدها؛ تواصل مع العملاء قبل موعد الاستحقاق.",view:"reminders",action:"مراجعة الأقساط"});
    if(withoutDue.length) recommendations.push({level:"warning",title:"جدولة المبالغ المتبقية",detail:"يوجد "+withoutDue.length+" سيارة مباعة عليها رصيد دون تاريخ قسط قادم. أضف موعداً واضحاً للمتابعة.",view:"reminders",action:"مراجعة الأرصدة"});
    if(pending.length) recommendations.push({level:"warning",title:"طلبات الموظفين المعلقة",detail:"يوجد "+pending.length+" طلب مصروف لم تتم مراجعته واعتماده أو رفضه.",view:"requests",action:"مراجعة الطلبات"});
    if(agedStock.length) recommendations.push({level:"warning",title:"تنشيط السيارات بطيئة الحركة",detail:"يوجد "+agedStock.length+" سيارة في المخزون تجاوز بقاؤها 60 يوماً؛ راجع التسعير والتسويق وتكلفة الاحتفاظ.",view:"inventory",action:"مراجعة المخزون"});
    if(partnerAgreementMissing.length) recommendations.push({level:"info",title:"تأكيد نسب أرباح الشركاء",detail:"يوجد "+partnerAgreementMissing.length+" سيارة بها مساهمة شريك دون إدخال نسبة ربح متفق عليها؛ النسبة الحالية المعروضة تقديرية حسب التمويل.",view:"inventory",action:"مراجعة حصص الشركاء"});
    if(cashDifferences.length) recommendations.push({level:"warning",title:"مراجعة فروق جرد الخزينة",detail:"تم تسجيل فروق في "+cashDifferences.length+" مطابقة خزينة. راجع أسباب الفروق وسجّل التسويات الموثقة.",view:"cashbook",action:"مراجعة المطابقات"});
    if(!recommendations.length) recommendations.push({level:"good",title:"لا توجد تنبيهات إدارية حالية",detail:"المؤشرات الحالية لا تُظهر استحقاقات متأخرة أو طلبات معلقة أو فروقاً مسجلة. استمر في المطابقة اليومية ومراجعة المخزون.",view:"cashbook",action:"مراجعة الخزينة"});
    return recommendations;
  }

  function renderManagementSuggestions(compact) {
    const items=managementRecommendations();
    const shown=compact?items.slice(0,4):items;
    const cards=shown.map(item=>
      '<article class="recommendation-card '+esc(item.level)+'"><div class="recommendation-copy"><div class="recommendation-title">'+esc(item.title)+'</div><p>'+esc(item.detail)+'</p></div><div class="recommendation-actions">'+badge(item.level==="urgent"?"أولوية عاجلة":(item.level==="warning"?"يحتاج متابعة":(item.level==="good"?"مستقر":"اقتراح إداري")),item.level==="urgent"||item.level==="warning"?"warn":"gold")+'<button class="btn btn-outline btn-small" data-action="go-view" data-view="'+esc(item.view)+'">'+esc(item.action)+'</button></div></article>'
    ).join("");
    return '<section class="panel section-gap management-recommendations"><div class="section-title-row"><div><h3>اقتراحات الإدارة</h3><p class="panel-note">توصيات تلقائية مبنية على البيانات المسجلة، وليست قرارات تنفذ دون مراجعتك.</p></div>'+badge(items.length+" توصية","gold")+'</div><div class="recommendation-list">'+cards+'</div>'+(compact&&items.length>4?'<div class="page-actions section-gap"><button class="btn btn-outline btn-small" data-action="go-view" data-view="management">عرض كل الاقتراحات</button></div>':"")+'</section>';
  }

  function adminHealthSnapshot() {
    const current=today();
    const cashDates=Array.from(new Set((financialTransactions||[]).filter(tx=>tx.payment_method==="cash"&&tx.transaction_date<current).map(tx=>tx.transaction_date)))
      .filter(date=>!(cashReconciliations||[]).some(item=>item.reconciliation_date===date));
    const differences=(cashReconciliations||[]).filter(item=>Math.abs(amount(item.cash_difference))>=0.01);
    const pending=requests.filter(item=>item.status==="pending");
    const stale=pending.filter(item=>item.created_at&&Math.floor((Date.now()-new Date(item.created_at).getTime())/86400000)>=2);
    const missingExpenseDetails=(state.expenses||[]).filter(item=>!item.date||!item.category).length;
    const score=Math.max(0,Math.min(100,100-cashDates.length*8-differences.length*15-pending.length*4-missingExpenseDetails*2));
    return {score,status:score>=90?"ممتاز":(score>=75?"جيد":(score>=55?"يحتاج متابعة":"يتطلب تدخلًا")),cashDates:cashDates.length,differences:differences.length,pending:pending.length,stale:stale.length,missingExpenseDetails};
  }

  function renderAdminHealthPanel() {
    const h=adminHealthSnapshot(), expensesByCategory=new Map();
    (state.expenses||[]).forEach(item=>{const key=String(item.category||"غير مصنف");expensesByCategory.set(key,(expensesByCategory.get(key)||0)+amount(item.amount));});
    const categories=Array.from(expensesByCategory.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max=categories.reduce((m,item)=>Math.max(m,item[1]),0)||1;
    const checks=[["مطابقات الخزينة غير المكتملة",h.cashDates,"يوم نقدي سابق دون مطابقة"],["فروق المطابقة المسجلة",h.differences,"مطابقة بها فرق يحتاج مراجعة"],["طلبات الموظفين المعلقة",h.pending,"طلب بانتظار قرار الإدارة"],["طلبات متأخرة عن يومين",h.stale,"طلب يحتاج حسمًا أو متابعة"],["مصروفات ناقصة التاريخ أو التصنيف",h.missingExpenseDetails,"سجل يحتاج استكمال البيانات"]];
    return '<section class="panel section-gap admin-health-panel"><div class="section-title-row"><div><h3>مؤشر صحة الإدارة والرقابة المالية</h3><p class="panel-note">مؤشر إرشادي من المطابقات والطلبات واكتمال بيانات المصروفات، وليس تقييمًا محاسبيًا معتمدًا.</p></div>'+badge(h.status,h.score>=90?"ok":(h.score>=70?"gold":"warn"))+'</div><div class="health-score-row"><div class="health-score"><strong>'+h.score+'</strong><span>/ 100</span></div><div class="health-score-copy"><strong>'+esc(h.status)+'</strong><p>إغلاق الملاحظات الرقابية يرفع المؤشر. لا يغيّر هذا المؤشر أي سجل أو رصيد.</p></div></div><div class="health-check-list">'+checks.map(item=>'<div class="health-check"><span>'+esc(item[0])+'<small>'+esc(item[2])+'</small></span>'+badge(String(item[1]),item[1]?"warn":"ok")+'</div>').join("")+'</div></section>'+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>تحليل مصروفات التشغيل حسب البند</h3><p class="panel-note">توزيع المصروفات المسجلة؛ الأرقام للمتابعة ولا تُنشئ قيودًا مالية.</p></div>'+badge(money((state.expenses||[]).reduce((sum,item)=>sum+amount(item.amount),0)),"gold")+'</div>'+(categories.length?'<div class="expense-category-bars">'+categories.map(item=>'<div class="expense-category-row"><div class="expense-category-label"><span>'+esc(item[0])+'</span><strong>'+money(item[1])+'</strong></div><div class="expense-category-track"><i style="width:'+Math.max(2,Math.round(item[1]/max*100))+'%"></i></div></div>').join("")+'</div>':empty("لا توجد مصروفات لتحليلها."))+'</section>';
  }

  function renderManagementPage() {
    const items=managementRecommendations();
    const urgent=items.filter(item=>item.level==="urgent").length;
    const follow=items.filter(item=>item.level==="warning").length;
    const health=adminHealthSnapshot();
    return heading("لوحة الإدارة","مركز متابعة إداري يجمع الرقابة المالية ومؤشرات الأداء وسجل المراجعة.",'<button class="btn btn-outline btn-small" data-action="print">طباعة لوحة الإدارة</button>')+
      '<div class="kpi-grid">'+kpi("صحة الإدارة",health.score+"/100",health.status,health.score>=90?"green":(health.score>=70?"gold":"red"))+kpi("توصيات عاجلة",urgent,"تحتاج مراجعة فورية",urgent?"red":"green")+kpi("بنود للمتابعة",follow,"تحتاج إجراء إداري",follow?"gold":"green")+kpi("أحداث سجل المراجعة",auditEntries.length,"آخر الأحداث المحمّلة","blue")+'</div>'+
      renderAdminHealthPanel()+
      renderManagementSuggestions(false)+
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>آخر أحداث المراجعة</h3><p class="panel-note">تظل التفاصيل الكاملة محفوظة في سجل المراجعة.</p></div><button class="btn btn-outline btn-small" data-action="go-view" data-view="audit">فتح سجل المراجعة</button></div>'+
      (auditEntries.length?'<div class="summary-list">'+auditEntries.slice(0,5).map(item=>'<div class="summary-line"><span>'+esc(item.description||item.entity_type||"حدث إداري")+'<small class="sub-line">'+esc(item.entity_type||"")+'</small></span><strong>'+esc(item.created_at||"")+'</strong></div>').join("")+'</div>':empty("لا توجد أحداث مراجعة مسجلة بعد."))+'</section>';
  }

  function renderOverview() {
    const m = metrics();
    const recent = (state.cars || []).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,4);
    const topExpenses = (state.expenses || []).slice().sort((a,b)=>amount(b.amount)-amount(a.amount)).slice(0,5);
    const waitingRequests = requests.filter(r=>r.status==="pending").length;
    const dashboardDetails =
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>الشرح التفصيلي للمركز المالي</h3><p class="panel-note">كل نتيجة موضحة بمعادلتها ومصدرها حتى تعرف من أين جاء الرقم.</p></div>' +
      badge("محسوب من السجلات الحالية","ok") + '</div>' +
      '<div class="finance-breakdown">' +
      '<div class="finance-line"><div><strong>إيرادات بيع السيارات</strong><small>إجمالي سعر بيع السيارات ذات حالة بيع مسجلة</small></div><b class="positive">' + money(m.sales) + '</b>' + formulaDetail("إيرادات البيع","مجموع أسعار بيع السيارات المباعة","يتم احتساب السيارة عندما تكون حالتها كاش أو متبقي أو تقسيط أو مباع. لا تدخل السيارات التي ما زالت قيد البيع.") + '</div>' +
      '<div class="finance-line"><div><strong>تكلفة السيارات المباعة</strong><small>شراء السيارة مضافًا إليه التجهيز</small></div><b>' + money(m.soldCost) + '</b>' + formulaDetail("تكلفة السيارات المباعة","سعر الشراء + مصاريف التجهيز للسيارات المباعة","تُحسب التكلفة على السيارات التي دخلت في المبيعات، بينما السيارات غير المباعة تظهر كقيمة مخزون منفصلة.") + '</div>' +
      '<div class="finance-line"><div><strong>مجمل ربح أو خسارة السيارات</strong><small>قبل خصم مصروفات التشغيل</small></div><b class="' + (m.grossProfit>=0?"positive":"negative") + '">' + money(m.grossProfit) + '</b>' + formulaDetail("مجمل الربح","إيرادات البيع − تكلفة السيارات المباعة","الرقم لا يخصم الإيجار والرواتب وبقية مصروفات التشغيل بعد.") + '</div>' +
      '<div class="finance-line"><div><strong>مصروفات التشغيل</strong><small>كل المصروفات المسجلة</small></div><b class="negative">' + money(m.expenses) + '</b>' + formulaDetail("مصروفات التشغيل","مجموع مبالغ المصروفات المسجلة","يشمل البنود المسجلة في صفحة المصروفات فقط.") + '</div>' +
      '<div class="finance-line"><div><strong>أرباح من أشخاص</strong><small>كما سُجلت في حركات رأس المال</small></div><b class="positive">' + money(m.profitFromPeople) + '</b></div>' +
      '<div class="finance-line"><div><strong>خسائر لأشخاص</strong><small>كما سُجلت في حركات رأس المال</small></div><b class="negative">' + money(m.lossToPeople) + '</b></div>' +
      '<div class="finance-line finance-total"><div><strong>صافي نتيجة النشاط</strong><small>بعد مصروفات التشغيل والأرباح والخسائر الإضافية</small></div><b class="' + (m.netProfit>=0?"positive":"negative") + '">' + money(m.netProfit) + '</b>' + formulaDetail("صافي نتيجة النشاط","مجمل ربح السيارات − المصروفات + أرباح الأشخاص − خسائر الأشخاص","هذه نتيجة تشغيلية مبسطة وفق الحقول الموجودة حاليًا، وليست قائمة تدفقات نقدية أو ميزانية عمومية.") + '</div>' +
      '</div></section>';
    const liquidity =
      '<section class="panel section-gap"><div class="section-title-row"><div><h3>الذمم ورأس المال</h3><p class="panel-note">أرصدة قائمة بحسب البيانات المسجلة حاليًا.</p></div></div><div class="summary-list">' +
      '<div class="summary-line"><span>مبالغ متبقية على العملاء في السيارات</span><strong class="negative">' + money(m.carRemainingTotal) + '</strong></div>' +
      '<div class="summary-line"><span>ذمم مستحقة للمعرض</span><strong class="negative">' + money(m.receivableDebts) + '</strong></div>' +
      '<div class="summary-line"><span>ذمم مستحقة على المعرض</span><strong>' + money(m.payableDebts) + '</strong></div>' +
      '<div class="summary-line"><span>إجمالي الإيداعات في رأس المال</span><strong class="positive">' + money(m.capitalIn) + '</strong></div>' +
      '<div class="summary-line"><span>إجمالي المسحوبات من رأس المال</span><strong class="negative">' + money(m.capitalOut) + '</strong></div>' +
      '<div class="summary-line"><span>صافي حركة رأس المال مع الربح والخسارة</span><strong class="' + (m.capitalNet>=0?"positive":"negative") + '">' + money(m.capitalNet) + '</strong></div>' +
      '<div class="summary-line"><span>طلبات الموظفين المعلقة</span><strong>' + waitingRequests + '</strong></div>' +
      '</div><p class="panel-note section-gap">رصيد رأس المال ليس مرادفًا لصافي الربح، والمبالغ المتبقية ليست إيرادًا جديدًا؛ كل بند له معنى محاسبي مستقل.</p></section>';
    return heading("لوحة المتابعة المالية","نظرة واضحة على نشاط المعرض، مع شرح تفصيلي لكل نتيجة.",'<button class="btn btn-outline btn-small" data-action="print">طباعة الملخص</button>') +
      '<div class="kpi-grid">' +
      kpi("إيرادات المبيعات",money(m.sales),m.sold + " سيارة بحالة بيع مسجلة","blue") +
      kpi("مجمل ربح السيارات",money(m.grossProfit),"المبيعات ناقص تكلفة السيارات المباعة",m.grossProfit>=0?"green":"red") +
      kpi("صافي نتيجة النشاط",money(m.netProfit),"بعد مصروفات التشغيل والربح والخسارة",m.netProfit>=0?"green":"red") +
      kpi("مصروفات التشغيل",money(m.expenses),"مجموع بنود المصروفات","red") +
      kpi("المبالغ المتبقية",money(m.totalReceivables),"سيارات وذمم مستحقة للمعرض","gold") +
      '</div>' +
      '<div class="dashboard-info-strip"><span>عدد السيارات: <b>' + m.cars + '</b></span><span>سيارات قيد البيع: <b>' + m.inventory + '</b></span><span>السيارات المباعة: <b>' + m.sold + '</b></span><span>تكلفة إجمالي السيارات المسجلة: <b>' + money(m.purchase) + '</b></span></div>' +
      dashboardDetails +
      renderManagementSuggestions(true) +
      '<div class="two-col section-gap"><section class="panel"><h3>أحدث السيارات المسجلة</h3>' +
      (recent.length ? listMarkup(recent,carCard,"لا توجد سيارات مسجلة.") : empty("لا توجد سيارات مسجلة.")) +
      '</section><section class="panel"><h3>أعلى المصروفات المسجلة</h3>' +
      (topExpenses.length ? '<div class="summary-list">' + topExpenses.map(e=>'<div class="summary-line"><span>' + esc(e.description || e.category || "مصروف") + '<small class="sub-line">' + esc(e.category || "عام") + '</small></span><strong class="negative">' + money(e.amount) + '</strong></div>').join("") + '</div>' : empty("لا توجد مصروفات مسجلة.")) +
      '</section></div>' + liquidity;
  }

  function renderCollection(collection, title, subtitle, renderer) {
    const q = ($("globalSearch").value || "").trim().toLowerCase();
    let items = (state[collection] || []).slice().sort((a,b)=>String(b.date||b.dueDate||"").localeCompare(String(a.date||a.dueDate||"")));
    if (q) items = items.filter(item => Object.values(item).some(v => String(v == null ? "" : v).toLowerCase().includes(q)));
    const add = '<button class="btn btn-primary btn-small" data-action="add" data-collection="' + collection + '">+ إضافة</button>';
    return heading(title,subtitle,add) + listMarkup(items,renderer,"لا توجد سجلات مطابقة. استخدم زر إضافة لإنشاء سجل جديد.");
  }

  function renderReceivables() {
    const cars = state.cars.filter(c=>carRemaining(c)>0).map(c=>({kind:"car",item:c,remaining:carRemaining(c),name:c.customer || "بدون اسم عميل",description:c.model || "سيارة"}));
    const debts = state.debts.filter(d=>String(d.nature||"").includes("لنا") && debtRemaining(d)>0).map(d=>({kind:"debt",item:d,remaining:debtRemaining(d),name:d.partyName || "بدون اسم",description:d.description || "ذمة مالية"}));
    const all = cars.concat(debts).sort((a,b)=>b.remaining-a.remaining);
    const q = ($("globalSearch").value || "").trim().toLowerCase();
    const rows = q ? all.filter(x=>(x.name+" "+x.description).toLowerCase().includes(q)) : all;
    const total = rows.reduce((s,x)=>s+x.remaining,0);
    return heading("المبالغ المتبقية","كل مبلغ لم يتم تحصيله بالكامل، مع اسم العميل أو السيارة.",'<button class="btn btn-outline btn-small" data-action="print">طباعة</button>') +
      '<div class="kpi-grid">' + kpi("إجمالي المتبقي",money(total),"للسجلات الظاهرة","red") + kpi("متبقي السيارات",money(rows.filter(x=>x.kind==="car").reduce((s,x)=>s+x.remaining,0)),"أقساط ومبالغ بيع السيارات","") + kpi("الذمم المستحقة لنا",money(rows.filter(x=>x.kind==="debt").reduce((s,x)=>s+x.remaining,0)),"من العملاء والجهات","") + '</div>' +
      (rows.length ? '<div class="data-list">' + rows.map(x=>'<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(x.name) + '</div><div class="data-card-sub">' + esc(x.description) + (x.item.phone ? " · " + esc(x.item.phone) : "") + '</div></div>' + badge(x.kind==="car"?"مستحق سيارة":"ذمة مستحقة","warn") + '</div><div class="data-card-grid"><div class="data-cell"><span>إجمالي المبلغ</span><strong>' + money(x.kind==="car"?x.item.salePrice:x.item.totalAmount) + '</strong></div><div class="data-cell"><span>المدفوع</span><strong class="positive">' + money(x.kind==="car"?carPaid(x.item):x.item.paidAmount) + '</strong></div><div class="data-cell"><span>المتبقي</span><strong class="negative">' + money(x.remaining) + '</strong></div><div class="data-cell"><span>تاريخ الحركة</span><strong>' + dateText(x.item.date || x.item.dueDate) + '</strong></div></div><div class="card-actions"><button class="btn btn-outline btn-small" data-action="edit" data-collection="' + (x.kind==="car"?"cars":"debts") + '" data-id="' + esc(x.item.id) + '">تعديل / تسجيل دفعة</button></div></article>').join("") + '</div>' : empty("لا توجد مبالغ متبقية حالياً."));
  }

  function renderRequests() {
    const q = ($("globalSearch").value || "").trim().toLowerCase();
    let rows = requests.slice();
    if (q) rows = rows.filter(r=>(String(r.description||"")+" "+String(r.status||"")).toLowerCase().includes(q));
    const pending = rows.filter(r=>r.status==="pending").length;
    return heading("طلبات الموظفين","طلبات مصروفات المستلزمات المرسلة من حسابات الموظفين.",'<button class="btn btn-outline btn-small" data-action="refresh-requests">تحديث القائمة</button>') +
      '<div class="kpi-grid">' + kpi("طلبات معلقة",pending,"تحتاج مراجعة","red") + kpi("إجمالي الطلبات",requests.length,"كل الطلبات الواردة","") + '</div>' +
      (rows.length ? '<div class="data-list">' + rows.map(r=>'<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(r.description) + '</div><div class="data-card-sub">' + dateText(r.expense_date) + ' · ' + "طلب من حساب موظف" + '</div></div>' + badge(r.status==="recorded"?"تم التسجيل":"بانتظار الاعتماد",r.status==="recorded"?"ok":"warn") + '</div><div class="data-card-grid"><div class="data-cell"><span>المبلغ</span><strong>' + money(r.amount) + '</strong></div><div class="data-cell"><span>نوع المصروف</span><strong>مستلزمات</strong></div><div class="data-cell"><span>تاريخ الإرسال</span><strong>' + dateText(String(r.created_at||"").slice(0,10)) + '</strong></div><div class="data-cell"><span>الحالة</span><strong>' + esc(r.status) + '</strong></div></div><div class="card-actions">' + (r.status==="pending" ? '<button class="btn btn-primary btn-small" data-action="record-request" data-id="' + esc(r.id) + '">اعتماد وإضافة للمصروفات</button><button class="btn btn-danger btn-small" data-action="delete-request" data-id="' + esc(r.id) + '">رفض وحذف</button>' : badge("تمت إضافته إلى المصروفات","ok")) + '</div></article>').join("") + '</div>' : empty("لا توجد طلبات مصروفات."));
  }

  function renderSettings() {
    return heading("الإعدادات والروابط","معلومات النظام والروابط التي تحتاجها للإدارة والتعديل.") +
      '<div class="two-col"><section class="panel"><h3>حالة الاتصال</h3><div class="summary-list">' +
      '<div class="summary-line"><span>المستخدم الحالي</span><strong>' + esc(session.user.email || "") + '</strong></div>' +
      '<div class="summary-line"><span>الصلاحية</span><strong class="positive">مدير النظام</strong></div>' +
      '<div class="summary-line"><span>قاعدة البيانات</span><strong class="positive">Supabase متصل</strong></div>' +
      '<div class="summary-line"><span>سجل البيانات</span><strong>' + (recordId ? "موجود ومحفوظ" : "سيتم إنشاؤه عند الحفظ") + '</strong></div>' +
      '</div><p class="panel-note section-gap">صلاحيات القراءة والكتابة تتحكم بها سياسات قاعدة البيانات نفسها، وليس شكل الواجهة.</p></section>' +
      '<section class="panel"><h3>نسخة احتياطية للبيانات</h3><p class="panel-note">يمكنك تنزيل نسخة JSON من بيانات الحساب الحالي للاحتفاظ بها. هذا لا يحذف أو يغيّر البيانات على قاعدة البيانات.</p><button class="btn btn-outline" data-action="backup-json">تنزيل نسخة احتياطية</button></section></div>' +
      '<section class="panel section-gap"><h3>روابط الإدارة والتطوير</h3><div class="link-grid">' +
      '<a class="link-card" href="https://is-motors.vercel.app" target="_blank" rel="noopener"><strong>الموقع الرئيسي</strong><span>https://is-motors.vercel.app</span></a>' +
      '<a class="link-card" href="https://is-motors-admin.vercel.app" target="_blank" rel="noopener"><strong>بوابة الإدارة</strong><span>https://is-motors-admin.vercel.app</span></a>' +
      '<a class="link-card" href="https://github.com/abdoahme/is-2" target="_blank" rel="noopener"><strong>الكود البرمجي على GitHub</strong><span>github.com/abdoahme/is-2</span></a>' +
      '<a class="link-card" href="https://vercel.com/dashboard" target="_blank" rel="noopener"><strong>النشر والاستضافة على Vercel</strong><span>vercel.com/dashboard</span></a>' +
      '<a class="link-card" href="https://supabase.com/dashboard/project/xnogogvdxforrpdijuuu" target="_blank" rel="noopener"><strong>قاعدة البيانات والصلاحيات</strong><span>supabase.com/dashboard/project/xnogogvdxforrpdijuuu</span></a>' +
      '</div></section>';
  }

  function renderPartners() {
    const source = Array.isArray(state.partnerMovements) ? state.partnerMovements.slice() : [];
    const linkedCapitalIds = new Set(source.map(m=>m.sourceCapitalId == null ? "" : String(m.sourceCapitalId)).filter(Boolean));
    (state.capital || []).forEach(entry=>{
      if (!entry.partner || entry.linkedMovementId || (entry.id && linkedCapitalIds.has(String(entry.id)))) return;
      const linkedByCar = entry.sourceCarId && source.some(m=>m.type==="contribution" && String(m.sourceCarId||"")===String(entry.sourceCarId) && String(m.partner||"").trim()===String(entry.partner||"").trim());
      if (linkedByCar) return;
      const base = {partner:entry.partner,date:entry.date,note:entry.description || entry.movementType || "حركة رأس مال",sourceCarId:entry.sourceCarId,sourceCapitalId:entry.id};
      if (amount(entry.deposited)>0) source.push(Object.assign({},base,{id:"capital-in-"+entry.id,type:"contribution",amount:amount(entry.deposited)}));
      if (amount(entry.withdrawn)>0) source.push(Object.assign({},base,{id:"capital-out-"+entry.id,type:"payout",amount:amount(entry.withdrawn)}));
    });
    const q = ($("globalSearch").value || "").trim().toLowerCase();
    const filtered = source.filter(m => {
      const car = state.cars.find(c => String(c.id) === String(m.sourceCarId));
      const haystack = [m.partner,m.note,m.type,car && car.model,m.date].join(" ").toLowerCase();
      return !q || haystack.includes(q);
    }).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
    const sums = {contribution:0,payout:0,profit:0,loss:0};
    source.forEach(m => { if (sums[m.type] !== undefined) sums[m.type] += amount(m.amount); });
    const labels = {contribution:"مساهمة / إيداع",payout:"دفعات سحب الشركاء",profit:"أرباح",loss:"خسائر"};
    const cards = filtered.length ? '<div class="data-list">' + filtered.map(m=>{
      const car = state.cars.find(c => String(c.id) === String(m.sourceCarId));
      const label = labels[m.type] || m.type || "حركة شريك";
      const color = m.type==="contribution" || m.type==="profit" ? "ok" : "warn";
      return '<article class="data-card"><div class="data-card-head"><div><div class="data-card-title">' + esc(m.partner || "شريك غير محدد") + '</div><div class="data-card-sub">' + esc(m.note || label) + '</div></div>' + badge(label,color) + '</div><div class="data-card-grid"><div class="data-cell"><span>قيمة الحركة</span><strong class="' + (m.type==="payout"?"negative":"positive") + '">' + money(m.amount) + '</strong></div><div class="data-cell"><span>التاريخ</span><strong>' + dateText(m.date) + '</strong></div><div class="data-cell"><span>السيارة المرتبطة</span><strong>' + esc(car ? car.model : "—") + '</strong></div><div class="data-cell"><span>نوع المصدر</span><strong>' + esc(m.sourceCarId ? "شراكة سيارة" : (m.type==="payout"?"سحب من رأس المال":"رأس مال")) + '</strong></div></div></article>';
    }).join("") + '</div>' : empty("لا توجد حركات شركاء مسجلة.");
    return heading("حركة الشركاء","متابعة مساهمات كل شريك وأرصدته ودفعات السحب المسجلة.",'<button class="btn btn-primary btn-small" data-action="add-partner-payout"' + (partnerBalances().some(x=>x.balance>0)?"":' disabled') + '>+ تسجيل دفعة سحب</button>') +
      '<div class="kpi-grid">' +
      kpi("إجمالي المساهمات",money(sums.contribution),"إيداعات ومساهمات","green") +
      kpi("دفعات سحب الشركاء",money(sums.payout),"مبالغ صُرفت للشركاء","red") +
      kpi("الأرباح المسجلة",money(sums.profit),"أرباح مرتبطة بالحركات","gold") +
      kpi("الخسائر المسجلة",money(sums.loss),"خسائر مرتبطة بالحركات","") +
      '</div>' + renderPartnerBalances() +
      '<section class="panel section-gap"><h3>دفعات سحب الشركاء وسجل الحركات</h3><p class="panel-note">كل دفعة سحب تُسجَّل هنا وتُخصم في الوقت نفسه من رصيد الشريك ورأس المال.</p>' + cards + '</section>';
  }
  function renderReports() {
    const allYears = Array.from(new Set(
      [].concat(state.cars.map(x=>String(x.date||"").slice(0,4)),
        state.expenses.map(x=>String(x.date||"").slice(0,4)),
        state.capital.map(x=>String(x.date||"").slice(0,4)),
        state.debts.map(x=>String(x.dueDate||x.date||"").slice(0,4)))
        .filter(x=>/^\d{4}$/.test(x))
    )).sort((a,b)=>b.localeCompare(a));
    const currentYear = String(new Date().getFullYear());
    if (!allYears.includes(currentYear)) allYears.unshift(currentYear);
    const months = ["كل الشهور","يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const yearsHtml = '<option value="ALL"' + (reportYear==="ALL"?" selected":"") + '>كل السنوات</option>' +
      allYears.map(y=>'<option value="' + esc(y) + '"' + (reportYear===y?" selected":"") + '>' + esc(y) + '</option>').join("");
    const monthsHtml = months.map((m,i)=>'<option value="' + (i===0?"ALL":i) + '"' + (String(reportMonth)===(i===0?"ALL":String(i))?" selected":"") + '>' + m + '</option>').join("");
    const inPeriod = (value) => {
      const date = String(value || "");
      if (reportYear !== "ALL" && !date.startsWith(reportYear)) return false;
      if (reportMonth !== "ALL" && !date.startsWith(reportYear + "-" + String(reportMonth).padStart(2,"0"))) return false;
      return true;
    };
    const cars = state.cars.filter(c=>inPeriod(c.date));
    const expenses = state.expenses.filter(e=>inPeriod(e.date));
    const debts = state.debts.filter(d=>inPeriod(d.date || d.dueDate));
    const capital = state.capital.filter(c=>inPeriod(c.date));
    const sold = cars.filter(isSoldCar);
    const revenue = sold.reduce((s,c)=>s+amount(c.salePrice),0);
    const cost = sold.reduce((s,c)=>s+amount(c.purchasePrice)+amount(c.prepCost),0);
    const gross = revenue-cost;
    const expenseTotal = expenses.reduce((s,e)=>s+amount(e.amount),0);
    const carRemainingTotal = cars.reduce((s,c)=>s+carRemaining(c),0);
    const debtRemainingTotal = debts.filter(d=>String(d.nature||"").includes("لنا")).reduce((s,d)=>s+debtRemaining(d),0);
    const capitalIn = capital.reduce((s,c)=>s+amount(c.deposited),0);
    const capitalOut = capital.reduce((s,c)=>s+amount(c.withdrawn),0);
    const profitFromPeople = capital.filter(c=>c.profitLossType==="ربح من شخص").reduce((s,c)=>s+amount(c.profitLossAmount),0);
    const lossToPeople = capital.filter(c=>c.profitLossType==="خسارة لشخص").reduce((s,c)=>s+amount(c.profitLossAmount),0);
    const net = gross-expenseTotal+profitFromPeople-lossToPeople;
    let closingText = "اعرض شهراً محدداً لمعرفة حالة التقفيل.";
    let closingClass = "gold";
    if (reportYear!=="ALL" && reportMonth!=="ALL") {
      const key = reportYear + "-" + String(reportMonth).padStart(2,"0");
      const closed = Boolean(state.closings && state.closings.months && state.closings.months[key]);
      closingText = closed ? "الشهر مقفل حسب السجل المحفوظ" : "الشهر مفتوح حسب السجل المحفوظ";
      closingClass = closed ? "ok" : "warn";
    } else if (reportYear!=="ALL" && reportMonth==="ALL") {
      const closed = Boolean(state.closings && state.closings.annual && state.closings.annual[reportYear]);
      closingText = closed ? "السنة مقفلة حسب السجل المحفوظ" : "السنة غير مقفلة حسب السجل المحفوظ";
      closingClass = closed ? "ok" : "warn";
    }
    return heading("التقارير والتقفيل","تقرير مشتريات ومبيعات ومصروفات ونتيجة الفترة من السجلات الحالية.",
      '<select id="reportYear" class="search-input" style="width:auto">' + yearsHtml + '</select><select id="reportMonth" class="search-input" style="width:auto"' + (reportYear==="ALL"?" disabled":"") + '>' + monthsHtml + '</select>') +
      '<div class="kpi-grid">' +
      kpi("إيرادات بيع السيارات",money(revenue),"السيارات المسجلة كمباعة بالفترة","green") +
      kpi("تكلفة السيارات المباعة",money(cost),"شراء وتجهيز السيارات المباعة","") +
      kpi("مجمل ربح / خسارة السيارات",money(gross),"قبل المصروفات التشغيلية",gross>=0?"gold":"red") +
      kpi("مصروفات الفترة",money(expenseTotal),"مصروفات التشغيل","red") +
      kpi("صافي نتيجة الفترة",money(net),"مجمل نتيجة السيارات ناقص المصروفات",net>=0?"green":"red") +
      '</div><div class="two-col"><section class="panel"><h3>ملخص حركة الفترة</h3><div class="summary-list">' +
      '<div class="summary-line"><span>عدد السيارات المسجلة</span><strong>' + cars.length + '</strong></div>' +
      '<div class="summary-line"><span>عدد السيارات المباعة</span><strong>' + sold.length + '</strong></div>' +
      '<div class="summary-line"><span>إجمالي المبالغ المتبقية للسيارات</span><strong class="negative">' + money(carRemainingTotal) + '</strong></div>' +
      '<div class="summary-line"><span>الذمم المستحقة للمعرض</span><strong class="negative">' + money(debtRemainingTotal) + '</strong></div>' +
      '<div class="summary-line"><span>إيداعات رأس المال</span><strong class="positive">' + money(capitalIn) + '</strong></div>' +
      '<div class="summary-line"><span>مسحوبات رأس المال</span><strong class="negative">' + money(capitalOut) + '</strong></div>' +
      '</div></section><section class="panel"><h3>حالة التقفيل المالي</h3>' + badge(closingText,closingClass) +
      '<p class="panel-note section-gap">الحالة معروضة كما هي محفوظة في قاعدة البيانات. لا يتم إقفال فترة أو تعديل لقطة مالية تلقائياً من هذه الصفحة.</p>' +
      '<div class="summary-list"><div class="summary-line"><span>تقفيل شهري محفوظ</span><strong>' + Object.values((state.closings&&state.closings.months)||{}).filter(Boolean).length + '</strong></div>' +
      '<div class="summary-line"><span>تقفيل نصف سنوي محفوظ</span><strong>' + Object.values((state.closings&&state.closings.halves)||{}).filter(Boolean).length + '</strong></div>' +
      '<div class="summary-line"><span>تقفيل سنوي محفوظ</span><strong>' + Object.values((state.closings&&state.closings.annual)||{}).filter(Boolean).length + '</strong></div></div></section></div>';
  }

  function render() {
    if (role !== "admin") return;
    const host = $("mainContent");
    if (currentView === "overview") host.innerHTML = renderOverview();
    else if (currentView === "cars") host.innerHTML = renderCollection("cars","السيارات","إدارة بيانات الشراء والبيع والتحصيل والمبالغ المتبقية.",carCard);
    else if (currentView === "expenses") host.innerHTML = renderCollection("expenses","مصروفات التشغيل","تسجيل ومراجعة كل المصروفات الفعلية للمعرض.",expenseCard);
    else if (currentView === "debts") host.innerHTML = renderCollection("debts","الذمم والأقساط","المبالغ المستحقة للمعرض أو المستحقة عليه.",debtCard);
    else if (currentView === "capital") host.innerHTML = renderCollection("capital","رأس المال وحركة الخزينة","الإيداعات والمسحوبات وحركة الشركاء.",capitalCard) +
      '<section class="panel section-gap"><h3>ملخص رأس المال</h3><div class="summary-list"><div class="summary-line"><span>إجمالي الإيداعات</span><strong class="positive">' + money(metrics().capitalIn) + '</strong></div><div class="summary-line"><span>إجمالي المسحوبات</span><strong class="negative">' + money(metrics().capitalOut) + '</strong></div><div class="summary-line"><span>أرباح من أشخاص</span><strong class="positive">' + money(metrics().profitFromPeople) + '</strong></div><div class="summary-line"><span>خسائر لأشخاص</span><strong class="negative">' + money(metrics().lossToPeople) + '</strong></div><div class="summary-line"><span>صافي الحركة بعد الأرباح والخسائر</span><strong class="' + (metrics().capitalNet >= 0 ? 'positive' : 'negative') + '">' + money(metrics().capitalNet) + '</strong></div></div></section>' + renderPartnerBalances();
    else if (currentView === "partners") host.innerHTML = renderPartners();
    else if (currentView === "cashbook") host.innerHTML = renderCashbook();
    else if (currentView === "inventory") host.innerHTML = renderInventory();
    else if (currentView === "customers") host.innerHTML = renderCustomers();
    else if (currentView === "reminders") host.innerHTML = renderReminders();
    else if (currentView === "audit") host.innerHTML = renderAudit();
    else if (currentView === "backups") host.innerHTML = renderBackups();
    else if (currentView === "management") host.innerHTML = renderManagementPage();
    else if (currentView === "reports") host.innerHTML = renderReports();
    else if (currentView === "monthlyClosing") host.innerHTML = renderMonthlyClosing();
    else if (currentView === "yearlyClosing") host.innerHTML = renderYearlyClosing();
    else if (currentView === "receivables") host.innerHTML = renderReceivables();
    else if (currentView === "requests") host.innerHTML = renderRequests();
    else if (currentView === "settings") host.innerHTML = renderSettings();
    $("pageTitle").textContent = titles[currentView] || "الرئيسية";
    document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===currentView));
  }

  function openEditor(collection,id) {
    const schema = schemas[collection];
    if (!schema) return;
    editingCollection = collection;
    editingId = id || null;
    const item = id ? (state[collection] || []).find(x=>String(x.id)===String(id)) : null;
    if (collection==="capital" && item && isLinkedCapitalEntry(item)) {
      toast("هذا القيد مرتبط بسيارة أو حركة شريك. عدّله من سجل السيارة أو اتركه كما هو للحفاظ على تطابق الدفاتر.", "error");
      return;
    }
    const defaults = {id:makeId(),date:today(),dueDate:today(),status:collection==="cars"?"قيد البيع":(collection==="debts"?"قيد المتابعة":""),paidAmount:0,purchasePrice:0,prepCost:0,salePrice:0,amount:0,totalAmount:0,deposited:0,withdrawn:0,profitLossAmount:0,partnerContribution:0};
    const value = item || defaults;
    const fields = collection === "partnerPayouts"
      ? schema.fields.map(field => field.key === "partner"
        ? Object.assign({},field,{options:partnerBalances().filter(x=>x.balance>0).map(x=>x.partner)})
        : field)
      : collection === "financialTransactions"
        ? schema.fields.map(field=>field.key==="car_id"
          ? Object.assign({},field,{options:[{value:"",label:"— اختر السيارة —"}].concat(state.cars.map(car=>({value:String(car.id)+"|"+String(car.model||"سيارة"),label:String(car.model||"سيارة")+" · "+String(car.chassis||"")})))})
          : field)
        : schema.fields;
    $("editorTitle").textContent = (item ? "تعديل " : "إضافة ") + schema.title;
    $("editorFields").innerHTML = fields.map(field=>{
      const val = value[field.key] == null ? "" : value[field.key];
      const cls = field.full ? "full" : "";
      let control = "";
      if (field.type === "select") {
        control = '<select name="' + esc(field.key) + '">' + field.options.map(opt=>{
          const optionValue=typeof opt==="string"?opt:opt.value;
          const optionLabel=typeof opt==="string"?(opt||"—"):opt.label;
          return '<option value="' + esc(optionValue) + '"' + (String(val)===String(optionValue)?" selected":"") + '>' + esc(optionLabel) + '</option>';
        }).join("") + '</select>';
      } else if (field.type === "textarea") {
        control = '<textarea name="' + esc(field.key) + '" maxlength="1000">' + esc(val) + '</textarea>';
      } else {
        control = '<input name="' + esc(field.key) + '" type="' + (field.type || "text") + '"' + (field.type==="number"?' min="0" step="0.01" dir="ltr"':'') + (field.type==="date"?'':'') + ' value="' + esc(val) + '"' + (field.required?' required':'') + '>';
      }
      return '<label class="' + cls + '">' + esc(field.label) + control + '</label>';
    }).join("");
    $("editorDialog").showModal();
  }

  function syncCarPartnerContribution(car, previousCar) {
    const contribution = amount(car.partnerContribution);
    state.partnerMovements = Array.isArray(state.partnerMovements) ? state.partnerMovements : [];
    state.capital = Array.isArray(state.capital) ? state.capital : [];
    const previousMovement = previousCar && state.partnerMovements.find(m =>
      String(m.id) === String(previousCar.partnerMovementId || "") ||
      (m.type === "contribution" && String(m.sourceCarId || "") === String(car.id))
    );
    const previousCapital = previousCar && state.capital.find(c =>
      String(c.id) === String(previousCar.partnerCapitalId || "") ||
      String(c.id) === String(previousMovement && previousMovement.sourceCapitalId || "") ||
      (String(c.sourceCarId || "") === String(car.id) && c.movementType === "مساهمة شريك في شراء سيارة")
    );
    if (contribution <= 0) {
      if (previousMovement) state.partnerMovements = state.partnerMovements.filter(m=>String(m.id)!==String(previousMovement.id));
      if (previousCapital) state.capital = state.capital.filter(c=>String(c.id)!==String(previousCapital.id));
      car.partnerMovementId = null;
      car.partnerCapitalId = null;
      return;
    }
    const partner = String(car.partnerName || "").trim();
    if (!partner) throw new Error("اكتب اسم الشريك قبل تسجيل مبلغ الشراكة.");
    const movementId = previousMovement ? previousMovement.id : (previousCar && previousCar.partnerMovementId ? previousCar.partnerMovementId : makeId());
    const capitalId = previousCapital ? previousCapital.id : (previousCar && previousCar.partnerCapitalId ? previousCar.partnerCapitalId : makeId());
    const movement = {
      id:movementId, partner, type:"contribution", amount:contribution, date:car.date || today(),
      note:"مساهمة في شراء السيارة " + String(car.model || ""),
      sourceCarId:car.id, sourceCapitalId:capitalId
    };
    const capitalEntry = {
      id:capitalId, date:car.date || today(), partner,
      movementType:"مساهمة شريك في شراء سيارة",
      deposited:contribution, withdrawn:0,
      method:car.partnerPaymentMethod || "نقداً بالخزينة",
      description:"مساهمة " + partner + " في شراء السيارة " + String(car.model || ""),
      sourceCarId:car.id, linkedMovementId:movementId
    };
    const movementIndex = state.partnerMovements.findIndex(x=>String(x.id)===String(movementId));
    if (movementIndex >= 0) state.partnerMovements[movementIndex] = movement;
    else state.partnerMovements.unshift(movement);
    const capitalIndex = state.capital.findIndex(x=>String(x.id)===String(capitalId));
    if (capitalIndex >= 0) state.capital[capitalIndex] = capitalEntry;
    else state.capital.unshift(capitalEntry);
    car.partnerMovementId = movementId;
    car.partnerCapitalId = capitalId;
  }


  async function submitEditor(event) {
    event.preventDefault();
    if (saving) { toast("هناك عملية حفظ جارية؛ انتظر تأكيدها قبل تسجيل حركة جديدة.", "error"); return; }
    if (!editingCollection) return;
    const collection = editingCollection;
    const schema = schemas[collection];
    if (collection==="capital" && editingId) {
      const linkedEntry = state.capital.find(entry=>String(entry.id)===String(editingId));
      if (linkedEntry && isLinkedCapitalEntry(linkedEntry)) {
        toast("لا يمكن تعديل قيد مرتبط منفردًا. عدّل العملية من سجل السيارة أو الشريك.", "error");
        return;
      }
    }
    const previous = clone(state);
    const previousCar = collection==="cars" && editingId
      ? clone(state.cars.find(x=>String(x.id)===String(editingId)) || null)
      : null;
    const form = new FormData($("editorForm"));
    const data = {};
    schema.fields.forEach(field=>{
      const raw = form.get(field.key);
      data[field.key] = field.type==="number" ? num(raw) : String(raw || "").trim();
    });
    const originalRecord = editingId ? (state[collection] || []).find(item=>String(item.id)===String(editingId)) : null;
    const originalDate = recordDate(originalRecord);
    const proposedDate = recordDate(data);
    if (isPeriodLocked(originalDate) || isPeriodLocked(proposedDate)) {
      toast("هذه الفترة مقفلة. لا يمكن إضافة أو تعديل سجلات فيها قبل إعادة فتح التقفيل بسبب موثّق.", "error");
      return;
    }
    if (collection==="financialTransactions") {
      const categories={
        "تحصيل من عميل":{direction:"inflow",category:"car_collection",source_type:"car_collection",requiresCar:true},
        "سداد ثمن شراء سيارة":{direction:"outflow",category:"car_purchase",source_type:"car_purchase",requiresCar:true},
        "سداد تجهيز سيارة":{direction:"outflow",category:"car_prep",source_type:"car_prep",requiresCar:true},
        "حركة واردة أخرى":{direction:"inflow",category:"manual",source_type:"manual",requiresCar:false},
        "حركة منصرفة أخرى":{direction:"outflow",category:"manual",source_type:"manual",requiresCar:false}
      };
      const definition=categories[data.category];
      const amountValue=amount(data.amount);
      const carId=String(data.car_id||"").split("|")[0];
      const car=state.cars.find(item=>String(item.id)===carId);
      if(!definition || amountValue<=0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.date||""))){
        toast("راجع نوع الحركة والتاريخ والمبلغ؛ يجب أن يكون المبلغ أكبر من صفر.", "error");
        return;
      }
      if(definition.requiresCar && !car){
        toast("اختر السيارة المرتبطة بهذه الحركة.", "error");
        return;
      }
      if(data.category==="تحصيل من عميل" && car && (amount(car.salePrice)<=0 || carPaid(car)+amountValue>amount(car.salePrice)+0.0001)){
        toast("التحصيل يتجاوز المتبقي من سعر بيع السيارة أو أن السيارة لم يُحدد لها سعر بيع.", "error");
        return;
      }
      if(data.category==="سداد ثمن شراء سيارة" && car){
        const reversed=new Set(financialTransactions.filter(tx=>tx.reversal_of).map(tx=>String(tx.reversal_of)));
        const already=financialTransactions.filter(tx=>String(tx.car_id||"")===String(car.id)&&tx.category==="car_purchase"&&!reversed.has(String(tx.id))).reduce((sum,tx)=>sum+amount(tx.amount),0);
        if(already+amountValue>amount(car.purchasePrice)+0.0001){toast("مبلغ السداد يتجاوز تكلفة شراء السيارة المسجلة.", "error");return;}
      }
      if(data.category==="سداد تجهيز سيارة" && car){
        const reversed=new Set(financialTransactions.filter(tx=>tx.reversal_of).map(tx=>String(tx.reversal_of)));
        const already=financialTransactions.filter(tx=>String(tx.car_id||"")===String(car.id)&&tx.category==="car_prep"&&!reversed.has(String(tx.id))).reduce((sum,tx)=>sum+amount(tx.amount),0);
        if(already+amountValue>amount(car.prepCost)+0.0001){toast("مبلغ سداد التجهيز يتجاوز تكلفة التجهيز المسجلة.", "error");return;}
      }
      try{
        const result=await insertFinancialTransaction({
          transaction_date:data.date,direction:definition.direction,category:definition.category,
          payment_method:dbPaymentMethod(data.payment_method),amount:amountValue,
          car_id:car?String(car.id):null,
          person_name:data.person_name || (car?car.customer||"": ""),
          description:data.description || data.category,
          reference:data.reference || null,
          source_type:definition.source_type,source_id:car?String(car.id):null,is_legacy:false
        });
        $("editorDialog").close();
        editingCollection=null;editingId=null;
        render();
        toast("تم تسجيل الحركة المالية في الدفتر.", "success");
      }catch(error){
        toast("تعذر تسجيل الحركة: "+(error.message||"خطأ غير معروف"),"error");
      }
      return;
    }
    const negativeField = schema.fields.find(field=>field.type==="number" && data[field.key] < 0);
    if (negativeField) {
      toast("لا يمكن إدخال مبلغ سالب في حقل " + negativeField.label + ".", "error");
      return;
    }
    if (collection==="expenses" && amount(data.amount)<=0) {
      toast("يجب أن يكون مبلغ المصروف أكبر من صفر.", "error");
      return;
    }
    if (collection==="cars" && data.paidAmount > data.salePrice + 0.0001) {
      toast("المبلغ المدفوع لا يمكن أن يتجاوز إجمالي سعر البيع.", "error");
      return;
    }
    if (collection==="cars" && amount(data.partnerSharePercent)>100) {
      toast("نسبة ربح الشريك لا يمكن أن تتجاوز 100%.", "error");
      return;
    }
    if (collection==="cars" && amount(data.partnerContribution)>0 && !data.partnerName) {
      toast("اكتب اسم الشريك المساهم حتى يتم تسجيل حصته في رأس المال.", "error");
      return;
    }
    if (collection==="debts" && (data.totalAmount<=0 || data.paidAmount > data.totalAmount + 0.0001)) {
      toast("يجب أن يكون إجمالي الذمة أكبر من صفر، ولا يمكن أن يتجاوز المسدد إجماليها.", "error");
      return;
    }
    if (collection==="capital") {
      if (amount(data.deposited)>0 && amount(data.withdrawn)>0) {
        toast("سجّل الإيداع والسحب في حركتين منفصلتين حتى تكون حركة الخزينة واضحة.", "error");
        return;
      }
      if ((data.profitLossType && amount(data.profitLossAmount)<=0) || (!data.profitLossType && amount(data.profitLossAmount)>0)) {
        toast("اختر نوع الربح أو الخسارة وأدخل مبلغًا أكبر من صفر، أو اترك الحقلين فارغين.", "error");
        return;
      }
    }
    if (collection==="partnerPayouts") {
      const available = partnerBalances().find(x=>x.partner===data.partner);
      if (!available || amount(data.amount)<=0) {
        toast("اختر شريكاً لديه رصيد متاح وأدخل مبلغاً صحيحاً.", "error");
        return;
      }
      if (amount(data.amount) > available.balance + 0.0001) {
        toast("مبلغ السحب أكبر من رصيد الشريك المتاح (" + money(available.balance) + ").", "error");
        return;
      }
      const movementId = makeId();
      const capitalId = makeId();
      const note = data.description || "دفعة سحب من رصيد الشريك";
      state.partnerMovements.unshift({
        id:movementId, partner:data.partner, type:"payout", amount:amount(data.amount),
        date:data.date || today(), note, sourceCapitalId:capitalId, method:data.method || ""
      });
      state.capital.unshift({
        id:capitalId, date:data.date || today(), partner:data.partner,
        movementType:"سحب شريك من رأس المال", deposited:0, withdrawn:amount(data.amount),
        method:data.method || "نقداً من الخزينة", description:note, linkedMovementId:movementId
      });
    } else {
      if (editingId) {
        const idx = state[collection].findIndex(x=>String(x.id)===String(editingId));
        if (idx>=0) state[collection][idx] = Object.assign({},state[collection][idx],data);
      } else {
        data.id = makeId();
        state[collection].unshift(data);
      }
      if (collection==="cars") {
        const savedCar = state.cars.find(x=>String(x.id)===String(editingId || data.id));
        try {
          if (savedCar) syncCarPartnerContribution(savedCar, previousCar);
        } catch (error) {
          state = previous;
          toast(error.message || "تعذر ربط مساهمة الشريك.", "error");
          render();
          return;
        }
      }
    }
    const damagedPartner = worsenedPartnerBalance(previous);
    if (damagedPartner) {
      state = previous;
      toast("لا يمكن حفظ الحركة؛ رصيد الشريك " + damagedPartner.partner + " سيصبح سالبًا بسبب السحب السابق.", "error");
      render();
      return;
    }
    $("editorDialog").close();
    render();
    const ok = await saveState(false);
    if (!ok) { state = previous; render(); }
    else { editingCollection=null; editingId=null; render(); }
  }
  async function deleteItem(collection,id) {
    if (saving) { toast("هناك عملية حفظ جارية؛ انتظر حتى تنتهي.", "error"); return; }
    const item = (state[collection] || []).find(x=>String(x.id)===String(id));
    if (!item) return;
    if (isPeriodLocked(recordDate(item))) {
      toast("لا يمكن حذف سجل داخل فترة مقفلة. أعد فتح الفترة بسبب موثّق أولاً.", "error");
      return;
    }
    if (collection==="capital" && isLinkedCapitalEntry(item)) {
      toast("هذا القيد مرتبط بمساهمة سيارة أو سحب شريك؛ لا تحذفه منفردًا حتى لا تختلف الدفاتر.", "error");
      return;
    }
    if (!confirm("هل تريد حذف هذا السجل؟ لا يمكن التراجع بعد الحفظ.")) return;
    const previous = clone(state);
    if (collection==="cars") {
      const linkedMovements = (state.partnerMovements || []).filter(m =>
        m.type==="contribution" &&
        (String(m.id)===String(item.partnerMovementId || "") || String(m.sourceCarId || "")===String(item.id))
      );
      const linkedMovementIds = new Set(linkedMovements.map(m=>String(m.id)));
      const linkedCapitalIds = new Set([
        item.partnerCapitalId == null ? "" : String(item.partnerCapitalId),
        ...linkedMovements.map(m=>m.sourceCapitalId == null ? "" : String(m.sourceCapitalId))
      ].filter(Boolean));
      state.partnerMovements = (state.partnerMovements || []).filter(m=>!linkedMovementIds.has(String(m.id)));
      state.capital = (state.capital || []).filter(c=>
        !linkedCapitalIds.has(String(c.id)) &&
        !(String(c.sourceCarId || "")===String(item.id) && c.movementType==="مساهمة شريك في شراء سيارة")
      );
    }
    state[collection] = (state[collection] || []).filter(x=>String(x.id)!==String(id));
    if (collection==="cars" || collection==="capital") {
      const damagedPartner = worsenedPartnerBalance(previous);
      if (damagedPartner) {
        state = previous;
        render();
        toast("لا يمكن حذف الحركة؛ رصيد الشريك " + damagedPartner.partner + " سيصبح سالبًا بسبب السحب المسجل.", "error");
        return;
      }
    }
    render();
    const ok = await saveState(false);
    if (!ok) state = previous;
    render();
  }


  async function recordRequest(id) {
    const request = requests.find(r=>String(r.id)===String(id));
    if (!request || request.status!=="pending") return;
    if (isPeriodLocked(request.expense_date)) {
      toast("تاريخ هذا الطلب يقع داخل فترة مقفلة؛ أعد فتحها قبل اعتماد الطلب.", "error");
      return;
    }
    const previous = clone(state);
    if (!state.expenses.some(e=>String(e.requestId||"")===String(request.id))) {
      state.expenses.unshift({
        id:"request_" + request.id,
        requestId:request.id,
        date:request.expense_date,
        category:"مستلزمات",
        description:request.description,
        amount:num(request.amount),
        paymentMethod:"نقداً",
        recipient:"",
        notes:"مصروف تم اعتماده من طلب موظف",
        submittedBy:request.submitted_by
      });
    }
    const saved = await saveState(false);
    if (!saved) { state=previous; render(); return; }
    const result = await db.from("expense_submissions").update({status:"recorded"}).eq("id",request.id);
    if (result.error) {
      toast("تمت إضافة المصروف، لكن تعذر تحديث حالة الطلب. حدّث القائمة قبل إعادة المحاولة.", "error");
    } else {
      toast("تم اعتماد الطلب وإضافته للمصروفات.", "success");
    }
    await loadRequests();
    render();
  }

  async function deleteRequest(id) {
    if (!confirm("هل تريد رفض الطلب وحذفه نهائياً؟")) return;
    const result = await db.from("expense_submissions").delete().eq("id",id);
    if (result.error) { toast("تعذر حذف الطلب: " + result.error.message,"error"); return; }
    await loadRequests();
    render();
    toast("تم حذف الطلب.","success");
  }

  async function submitEmployeeExpense(event) {
    event.preventDefault();
    const description = $("requestDescription").value.trim();
    const amountValue = num($("requestAmount").value);
    const expenseDate = $("requestDate").value || today();
    const feedback = $("requestFeedback");
    feedback.textContent = "";
    if (description.length<3 || description.length>500 || amountValue<=0) {
      feedback.textContent = "يرجى إدخال بيان صحيح ومبلغ أكبر من صفر.";
      return;
    }
    const button = $("expenseRequestForm").querySelector("button[type=submit]");
    button.disabled = true;
    try {
      const result = await db.from("expense_submissions").insert({
        submitted_by:session.user.id, expense_type:"supplies",
        description:description, amount:amountValue, expense_date:expenseDate
      });
      if (result.error) throw result.error;
      $("expenseRequestForm").reset();
      $("requestDate").value = today();
      feedback.textContent = "تم إرسال الطلب بنجاح إلى الإدارة.";
      toast("وصل طلب المصروف إلى الإدارة.","success");
    } catch (error) {
      feedback.textContent = "تعذر إرسال الطلب: " + (error.message || "تحقق من الاتصال.");
      feedback.style.color = "var(--red)";
    } finally {
      button.disabled = false;
    }
  }

  function exportCsv() {
    let rows = [], filename = currentView + ".csv";
    if (currentView==="cars") rows = state.cars.map(c=>({date:c.date,model:c.model,customer:c.customer,phone:c.phone,purchasePrice:c.purchasePrice,partnerName:c.partnerName,partnerContribution:c.partnerContribution,prepCost:c.prepCost,salePrice:c.salePrice,paidAmount:carPaid(c),remaining:carRemaining(c),status:c.status,notes:c.notes}));
    else if (currentView==="expenses") rows = state.expenses.map(e=>({date:e.date,category:e.category,description:e.description,amount:e.amount,paymentMethod:e.paymentMethod,recipient:e.recipient,notes:e.notes}));
    else if (currentView==="debts") rows = state.debts.map(d=>({partyName:d.partyName,nature:d.nature,description:d.description,totalAmount:d.totalAmount,paidAmount:d.paidAmount,remaining:debtRemaining(d),dueDate:d.dueDate,status:d.status,phone:d.phone}));
    else if (currentView==="capital") rows = state.capital.map(c=>({date:c.date,partner:c.partner,movementType:c.movementType,deposited:c.deposited,withdrawn:c.withdrawn,method:c.method,receiptNo:c.receiptNo,description:c.description}));
    else if (currentView==="requests") rows = requests.map(r=>({date:r.expense_date,description:r.description,amount:r.amount,status:r.status,created_at:r.created_at}));
    else if (currentView==="receivables") {
      rows = state.cars.filter(c=>isSoldCar(c)&&carRemaining(c)>0).map(c=>({customer:c.customer,vehicle:c.model,total:c.salePrice,paid:carPaid(c),remaining:carRemaining(c)}))
        .concat(state.debts.filter(d=>String(d.nature||"").includes("لنا")&&debtRemaining(d)>0).map(d=>({customer:d.partyName,vehicle:d.description,total:d.totalAmount,paid:d.paidAmount,remaining:debtRemaining(d)})));
    }
    else if(currentView==="cashbook") rows=financialTransactions.map(tx=>({
      date:tx.transaction_date,direction:tx.direction==="inflow"?"وارد":"منصرف",
      category:transactionCategoryLabel(tx.category),paymentMethod:paymentMethodLabel(tx.payment_method),
      amount:tx.amount,vehicle:state.cars.find(car=>String(car.id)===String(tx.car_id||""))?.model||"",
      customer:tx.person_name||"",reference:tx.reference||"",legacy:tx.is_legacy?"ترحيل قديم":"جديد"
    }));
    else if(currentView==="inventory") rows=state.cars.map(car=>({
      date:car.date,vehicle:car.model,status:car.status,purchase:car.purchasePrice,prep:car.prepCost,
      supplierPaid:carAcquisitionPaid(car.id),sale:car.salePrice,paid:carPaid(car),remaining:carRemaining(car),
      profit:carProfitDetails(car).profit,partner:car.partnerName,partnerShare:carProfitDetails(car).partnerProfit
    }));
    else if(currentView==="customers") rows=customerGroups().map(customer=>({
      customer:customer.name,cars:customer.cars.length,sales:customer.sales,paid:customer.paid,
      remaining:customer.remaining,debtsReceivable:customer.debtReceivable,debtsPayable:customer.debtPayable
    }));
    else if(currentView==="reminders") rows=(state.debts||[]).filter(item=>debtRemaining(item)>0&&item.dueDate).map(item=>({
      party:item.partyName,description:item.description,dueDate:item.dueDate,remaining:debtRemaining(item),phone:item.phone
    })).concat((state.cars||[]).filter(car=>isSoldCar(car)&&carRemaining(car)>0&&car.nextDueDate).map(car=>({
      party:car.customer,description:car.model,dueDate:car.nextDueDate,remaining:carRemaining(car),phone:car.phone
    })));
    else if(currentView==="audit") rows=auditEntries.map(item=>({
      date:item.created_at,event:item.event_type,entity:item.entity_type,id:item.entity_id,description:item.description
    }));
    else if(currentView==="monthlyClosing") {
      const key=closeYear+"-"+String(closeMonth).padStart(2,"0"),bounds=monthDateRange(key),closure=state.closings.months[key];
      if (closure && !closure.snapshot) { toast("هذا التقفيل القديم لا يحتوي على لقطة محفوظة يمكن تصديرها كمرجع تاريخي.","error"); return; }
      const snap=closure?closure.snapshot:buildPeriodSnapshot(bounds.start,bounds.end,monthLabel(key));
      rows=[["إيرادات البيع",snap.sales],["تكلفة السيارات المباعة",snap.soldCost],["مجمل الربح",snap.grossProfit],["مصروفات التشغيل",snap.operatingExpenses],["أرباح من أشخاص",snap.profitFromPeople],["خسائر لأشخاص",snap.lossToPeople],["صافي النتيجة",snap.netResult],["المتبقي المستحق",snap.totalReceivables]].map(x=>({البند:x[0],المبلغ:x[1]}));
      filename="تقفيل-"+key+".csv";
    }
    else if (currentView==="yearlyClosing") {
      const year=String(closeAnnualYear),closure=state.closings.annual[year];
      if (closure && !closure.snapshot) { toast("هذا التقفيل السنوي القديم لا يحتوي على لقطة محفوظة يمكن تصديرها كمرجع تاريخي.","error"); return; }
      const snap=closure?closure.snapshot:buildPeriodSnapshot(year+"-01-01",year+"-12-31","السنة "+year);
      rows=[["إيرادات السنة",snap.sales],["تكلفة السيارات المباعة",snap.soldCost],["مجمل الربح",snap.grossProfit],["مصروفات التشغيل",snap.operatingExpenses],["أرباح من أشخاص",snap.profitFromPeople],["خسائر لأشخاص",snap.lossToPeople],["صافي النتيجة السنوية",snap.netResult],["المتبقي المستحق",snap.totalReceivables]].map(x=>({البند:x[0],المبلغ:x[1]}));
      filename="تقفيل-سنوي-"+year+".csv";
    } else if (currentView==="management") {
      const h=adminHealthSnapshot();
      rows=[{metric:"مؤشر صحة الإدارة",value:h.score,unit:"من 100"},{metric:"مطابقات خزينة غير مكتملة",value:h.cashDates},{metric:"فروق مطابقة مسجلة",value:h.differences},{metric:"طلبات موظفين معلقة",value:h.pending},{metric:"طلبات متأخرة أكثر من يومين",value:h.stale},{metric:"مصروفات ناقصة التاريخ أو التصنيف",value:h.missingExpenseDetails}];
      filename="مؤشرات-الإدارة.csv";
    } else { toast("افتح صفحة بيانات أولاً لتصديرها.","error"); return; }
    if (!rows.length) { toast("لا توجد بيانات للتصدير.","error"); return; }
    const keys = Object.keys(rows[0]);
    const csv = "\uFEFF" + [keys.join(","),...rows.map(r=>keys.map(k=>'"'+String(r[k] == null ? "" : r[k]).replace(/"/g,'""')+'"').join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download="IS-Motors-"+filename; a.click(); URL.revokeObjectURL(url);
  }

  async function backupJson() {
    const payload = {
      generatedAt:new Date().toISOString(),user:session.user.email,
      state:state,financialTransactions:financialTransactions,cashReconciliations:cashReconciliations
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="IS-Motors-full-backup-"+today()+".json";a.click();URL.revokeObjectURL(url);
    try{
      const cloud=await createCloudBackup("manual");
      toast("تم تنزيل النسخة وحفظ نسخة سحابية: "+cloud.label,"success");
      render();
    }catch(error){toast("تم التنزيل محلياً، لكن تعذر حفظ النسخة السحابية: "+error.message,"error");}
  }

  async function logout() {
    const result = await db.auth.signOut();
    if (result.error) toast("تعذر تسجيل الخروج: "+result.error.message,"error");
    session=null;role=null;recordId=null;state=emptyState();requests=[];showLogin();
  }

  $("loginForm").addEventListener("submit", async (event)=>{
    event.preventDefault();
    const button=$("loginForm").querySelector('button[type="submit"]');
    const errorBox=$("loginError");errorBox.textContent="";
    const email=$("loginEmail").value.trim();const password=$("loginPassword").value;
    button.disabled=true;button.textContent="جارٍ تسجيل الدخول...";
    try {
      const result=await db.auth.signInWithPassword({email:email,password:password});
      if(result.error) throw result.error;
      await boot(result.data.session);
    } catch(error) {
      errorBox.textContent=error.message||"تعذر تسجيل الدخول. راجع البريد وكلمة المرور.";
    } finally {
      button.disabled=false;button.textContent="تسجيل الدخول";
    }
  });

  $("logoutBtn").addEventListener("click",logout);
  $("employeeLogoutBtn").addEventListener("click",logout);
  $("editorForm").addEventListener("submit",submitEditor);
  $("closeEditorBtn").addEventListener("click",()=>$("editorDialog").close());
  $("cancelEditorBtn").addEventListener("click",()=>$("editorDialog").close());
  $("exportBtn").addEventListener("click",exportCsv);
  $("globalSearch").addEventListener("input",render);
  $("mainNav").addEventListener("click",(event)=>{
    const btn=event.target.closest("[data-view]");
    if(!btn)return;
    currentView=btn.dataset.view;
    $("globalSearch").value="";
    render();
  });
  $("mainContent").addEventListener("change",(event)=>{
    if(event.target.id==="reportYear") { reportYear=event.target.value; if(reportYear==="ALL") reportMonth="ALL"; render(); }
    if(event.target.id==="reportMonth" && reportYear!=="ALL") { reportMonth=event.target.value; render(); }
    if(event.target.id==="closeMonthSelect") { closeMonth=Number(event.target.value); render(); }
    if(event.target.id==="closeYearSelect") { closeYear=String(event.target.value); render(); }
    if(event.target.id==="closeAnnualYearSelect") { closeAnnualYear=String(event.target.value); render(); }
  });
  $("mainContent").addEventListener("click",async(event)=>{
    const btn=event.target.closest("[data-action]");
    if(!btn)return;
    const action=btn.dataset.action;
    if(action==="add")openEditor(btn.dataset.collection);
    else if(action==="add-financial-transaction")openEditor("financialTransactions");
    else if(action==="reverse-financial-transaction"){
      const tx=financialTransactions.find(item=>String(item.id)===String(btn.dataset.id));
      if(!tx){toast("الحركة غير موجودة.","error");return;}
      if(financialTransactions.some(item=>String(item.reversal_of||"")===String(tx.id))){toast("هذه الحركة سبق عكسها.","error");return;}
      const reason=prompt("اكتب سبب عكس الحركة المالية:");
      if(reason===null)return;
      if(String(reason).trim().length<4){toast("اكتب سببًا واضحًا (4 أحرف على الأقل).","error");return;}
      if(!confirm("سيتم إنشاء قيد عكسي ولن يتم حذف الحركة الأصلية. هل تريد المتابعة؟"))return;
      try{
        await reverseFinancialTransaction(tx,String(reason).trim());
        await writeAuditEvent({event_type:"reversal",entity_type:"financial_transactions",entity_id:tx.id,description:"عكس حركة مالية: "+String(reason).trim(),before_data:tx});
        render();toast("تم تسجيل القيد العكسي مع الاحتفاظ بالحركة الأصلية.","success");
      }catch(error){toast("تعذر عكس الحركة: "+error.message,"error");}
    }
    else if(action==="add-partner-payout") {
      if (!partnerBalances().some(x=>x.balance>0)) { toast("لا يوجد رصيد متاح للسحب حالياً.", "error"); return; }
      openEditor("partnerPayouts");
    }
    else if(action==="edit")openEditor(btn.dataset.collection,btn.dataset.id);
    else if(action==="delete")await deleteItem(btn.dataset.collection,btn.dataset.id);
    else if(action==="record-request")await recordRequest(btn.dataset.id);
    else if(action==="delete-request")await deleteRequest(btn.dataset.id);
    else if(action==="refresh-requests"){await loadRequests();render();toast("تم تحديث قائمة الطلبات.","success");}
    else if(action==="backup-json")await backupJson();
    else if(action==="create-backup")await createManualBackup();
    else if(action==="restore-backup")await restoreCloudBackup(btn.dataset.id);
    else if(action==="customer-statement"){selectedCustomer=btn.dataset.customer||"";currentView="customers";render();}
    else if(action==="customer-back"){selectedCustomer="";render();}
    else if(action==="save-reconciliation")await saveCashReconciliation();
    else if(action==="go-view"){
      if(role!=="admin")return;
      currentView=btn.dataset.view||"overview";
      $("globalSearch").value="";
      render();
    }
    else if(action==="refresh-audit"){
      const audit=await db.from("audit_logs").select("id,created_at,event_type,entity_type,entity_id,description,before_data,after_data").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(150);
      if(audit.error)toast("تعذر تحديث سجل المراجعة: "+audit.error.message,"error");
      else{auditEntries=audit.data||[];render();toast("تم تحديث سجل المراجعة.","success");}
    }
    else if(action==="close-month")await closeMonthlyPeriod();
    else if(action==="reopen-month")await reopenMonthlyPeriod();
    else if(action==="close-year")await closeAnnualPeriod();
    else if(action==="reopen-year")await reopenAnnualPeriod();
    else if(action==="print")window.print();
  });
  $("expenseRequestForm").addEventListener("submit",submitEmployeeExpense);

  db.auth.onAuthStateChange((event,authSession)=>{
    if(event==="SIGNED_OUT" || !authSession){session=null;role=null;showLogin();return;}
    if(event==="SIGNED_IN" || event==="TOKEN_REFRESHED")setTimeout(()=>boot(authSession),0);
  });
  window.addEventListener("online",()=>{if(role==="admin")setSync("متصل","");});
  window.addEventListener("offline",()=>setSync("لا يوجد اتصال","offline"));

  (async function start(){
    try{
      if(!window.supabase || !window.supabase.createClient) throw new Error("تعذر تحميل مكتبة الاتصال. أعد تحميل الصفحة.");
      const result=await db.auth.getSession();
      if(result.error) throw result.error;
      if(result.data.session) await boot(result.data.session);
      else showLogin();
    }catch(error){showLogin();$("loginError").textContent=error.message||"تعذر بدء النظام.";}
  })();
})();