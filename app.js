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
    capital:"رأس المال والخزينة", partners:"حركة الشركاء", reports:"التقارير والتقفيل", requests:"طلبات الموظفين", settings:"الإعدادات والروابط"
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
        {key:"partnerPaymentMethod",label:"طريقة إيداع الشراكة",type:"select",options:["نقداً بالخزينة","تحويل بنكي","شيك بنكي","إيداع بنكي مباشر"]},
        {key:"prepCost",label:"مصاريف التجهيز",type:"number"},
        {key:"salePrice",label:"إجمالي سعر البيع",type:"number"},
        {key:"paidAmount",label:"المبلغ المدفوع",type:"number"},
        {key:"status",label:"حالة السيارة",type:"select",options:["قيد البيع","كاش","متبقي","تقسيط","مباع"]},
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
  let currentView = "overview";
  let editingCollection = null;
  let editingId = null;
  let saving = false;
  let reportYear = "ALL";
  let reportMonth = "ALL";
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
    if (!base.closings || typeof base.closings !== "object") base.closings = {annual:{},halves:{},months:{},snapshots:[]};
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
    } else {
      recordId = null;
      state = emptyState();
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
      return true;
    } catch (error) {
      setSync("تعذر الحفظ", "offline");
      if (!silent) toast("لم يتم الحفظ: " + (error.message || "خطأ غير معروف"), "error");
      return false;
    } finally {
      saving = false;
    }
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
    if (car.paidAmount === undefined || car.paidAmount === null || car.paidAmount === "") {
      return car.status === "كاش" ? amount(car.salePrice) : 0;
    }
    return amount(car.paidAmount);
  }
  function carRemaining(car) { return Math.max(0, amount(car.salePrice) - carPaid(car)); }
  function debtRemaining(debt) { return Math.max(0, amount(debt.totalAmount) - amount(debt.paidAmount)); }
  function metrics() {
    const cars = state.cars;
    const sold = cars.filter(c => amount(c.salePrice) > 0);
    const inventory = cars.filter(c => !["كاش","متبقي","تقسيط","مباع"].includes(c.status));
    const purchase = cars.reduce((sum,c) => sum + amount(c.purchasePrice) + amount(c.prepCost), 0);
    const profit = sold.reduce((sum,c) => sum + amount(c.salePrice) - amount(c.purchasePrice) - amount(c.prepCost), 0);
    const carRemainingTotal = cars.reduce((sum,c) => sum + carRemaining(c), 0);
    const receivableDebts = state.debts.filter(d => String(d.nature || "").includes("لنا")).reduce((sum,d)=>sum+debtRemaining(d),0);
    const payableDebts = state.debts.filter(d => String(d.nature || "").includes("علينا")).reduce((sum,d)=>sum+debtRemaining(d),0);
    const expenses = state.expenses.reduce((sum,e)=>sum+amount(e.amount),0);
    const capitalIn = state.capital.reduce((sum,c)=>sum+amount(c.deposited),0);
    const capitalOut = state.capital.reduce((sum,c)=>sum+amount(c.withdrawn),0);
    const profitFromPeople = state.capital.filter(c=>c.profitLossType==="ربح من شخص").reduce((sum,c)=>sum+amount(c.profitLossAmount),0);
    const lossToPeople = state.capital.filter(c=>c.profitLossType==="خسارة لشخص").reduce((sum,c)=>sum+amount(c.profitLossAmount),0);
    const profitLossNet = profitFromPeople - lossToPeople;
    return {
      cars:cars.length, inventory:inventory.length, sold:sold.length, purchase, profit,
      carRemainingTotal, receivableDebts, payableDebts, expenses, capitalIn, capitalOut,
      profitFromPeople, lossToPeople, profitLossNet,
      capitalNet:capitalIn-capitalOut+profitLossNet,
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

  function renderOverview() {
    const m = metrics();
    const recent = state.cars.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,4);
    const topExpenses = state.expenses.slice().sort((a,b)=>amount(b.amount)-amount(a.amount)).slice(0,5);
    return '<div class="kpi-grid">' +
      kpi("إجمالي السيارات",m.cars,"منها " + m.inventory + " قيد البيع","gold") +
      kpi("إجمالي تكلفة الشراء والتجهيز",money(m.purchase),"قيمة مشتريات وتجهيز السيارات","") +
      kpi("أرباح السيارات المباعة",money(m.profit),"سعر البيع ناقص تكلفة السيارة","green") +
      kpi("إجمالي المبالغ المتبقية",money(m.totalReceivables),"مستحقات السيارات والذمم","red") +
      kpi("إجمالي المصروفات",money(m.expenses),"كل المصروفات المسجلة","blue") +
      '</div><div class="two-col"><section class="panel"><h3>آخر السيارات المسجلة</h3>' +
      (recent.length ? listMarkup(recent,carCard,"لا توجد سيارات مسجلة.") : empty("لا توجد سيارات مسجلة.")) +
      '</section><section class="panel"><h3>ملخص مالي</h3><div class="summary-list">' +
      '<div class="summary-line"><span>مبالغ مستحقة للمعرض من السيارات</span><strong class="negative">' + money(m.carRemainingTotal) + '</strong></div>' +
      '<div class="summary-line"><span>ذمم مستحقة للمعرض</span><strong class="negative">' + money(m.receivableDebts) + '</strong></div>' +
      '<div class="summary-line"><span>ذمم مستحقة على المعرض</span><strong>' + money(m.payableDebts) + '</strong></div>' +
      '<div class="summary-line"><span>صافي حركة رأس المال</span><strong class="positive">' + money(m.capitalNet) + '</strong></div>' +
      '<div class="summary-line"><span>أرباح من أشخاص</span><strong class="positive">' + money(m.profitFromPeople) + '</strong></div>' +
      '<div class="summary-line"><span>خسائر لأشخاص</span><strong class="negative">' + money(m.lossToPeople) + '</strong></div>' +
      '<div class="summary-line"><span>صافي حركة رأس المال بعد الأرباح والخسائر</span><strong class="' + (m.capitalNet >= 0 ? 'positive' : 'negative') + '">' + money(m.capitalNet) + '</strong></div>' +
      '<div class="summary-line"><span>أرباح من أشخاص</span><strong class="positive">' + money(m.profitFromPeople) + '</strong></div>' +
      '<div class="summary-line"><span>خسائر لأشخاص</span><strong class="negative">' + money(m.lossToPeople) + '</strong></div>' +
      '<div class="summary-line"><span>صافي حركة رأس المال بعد الأرباح والخسائر</span><strong class="' + (m.capitalNet >= 0 ? 'positive' : 'negative') + '">' + money(m.capitalNet) + '</strong></div>' +
      '<div class="summary-line"><span>عدد طلبات الموظفين المعلقة</span><strong>' + requests.filter(r=>r.status==="pending").length + '</strong></div>' +
      '</div><p class="panel-note section-gap">الأرقام محسوبة مباشرة من السجلات المحفوظة في قاعدة البيانات.</p></section></div>' +
      '<section class="panel section-gap"><h3>أعلى المصروفات المسجلة</h3>' +
      (topExpenses.length ? '<div class="summary-list">' + topExpenses.map(e=>'<div class="summary-line"><span>' + esc(e.description || e.category || "مصروف") + '</span><strong class="negative">' + money(e.amount) + '</strong></div>').join("") + '</div>' : empty("لا توجد مصروفات مسجلة.")) +
      '</section>';
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
    const debts = state.debts.filter(d=>inPeriod(d.dueDate || d.date));
    const capital = state.capital.filter(c=>inPeriod(c.date));
    const sold = cars.filter(c=>amount(c.salePrice)>0);
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
    else if (currentView === "reports") host.innerHTML = renderReports();
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
      : schema.fields;
    $("editorTitle").textContent = (item ? "تعديل " : "إضافة ") + schema.title;
    $("editorFields").innerHTML = fields.map(field=>{
      const val = value[field.key] == null ? "" : value[field.key];
      const cls = field.full ? "full" : "";
      let control = "";
      if (field.type === "select") {
        control = '<select name="' + esc(field.key) + '">' + field.options.map(opt=>'<option value="' + esc(opt) + '"' + (String(val)===String(opt)?" selected":"") + '>' + esc(opt || "—") + '</option>').join("") + '</select>';
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
      rows = state.cars.filter(c=>carRemaining(c)>0).map(c=>({customer:c.customer,vehicle:c.model,total:c.salePrice,paid:carPaid(c),remaining:carRemaining(c)}))
        .concat(state.debts.filter(d=>String(d.nature||"").includes("لنا")&&debtRemaining(d)>0).map(d=>({customer:d.partyName,vehicle:d.description,total:d.totalAmount,paid:d.paidAmount,remaining:debtRemaining(d)})));
    } else { toast("افتح صفحة بيانات أولاً لتصديرها.","error"); return; }
    if (!rows.length) { toast("لا توجد بيانات للتصدير.","error"); return; }
    const keys = Object.keys(rows[0]);
    const csv = "\uFEFF" + [keys.join(","),...rows.map(r=>keys.map(k=>'"'+String(r[k] == null ? "" : r[k]).replace(/"/g,'""')+'"').join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href=url; a.download="IS-Motors-"+filename; a.click(); URL.revokeObjectURL(url);
  }

  function backupJson() {
    const payload = {generatedAt:new Date().toISOString(),user:session.user.email,state:state};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="IS-Motors-backup-"+today()+".json";a.click();URL.revokeObjectURL(url);
    toast("تم إنشاء النسخة الاحتياطية على جهازك.","success");
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
  });
  $("mainContent").addEventListener("click",async(event)=>{
    const btn=event.target.closest("[data-action]");
    if(!btn)return;
    const action=btn.dataset.action;
    if(action==="add")openEditor(btn.dataset.collection);
    else if(action==="add-partner-payout") {
      if (!partnerBalances().some(x=>x.balance>0)) { toast("لا يوجد رصيد متاح للسحب حالياً.", "error"); return; }
      openEditor("partnerPayouts");
    }
    else if(action==="edit")openEditor(btn.dataset.collection,btn.dataset.id);
    else if(action==="delete")await deleteItem(btn.dataset.collection,btn.dataset.id);
    else if(action==="record-request")await recordRequest(btn.dataset.id);
    else if(action==="delete-request")await deleteRequest(btn.dataset.id);
    else if(action==="refresh-requests"){await loadRequests();render();toast("تم تحديث قائمة الطلبات.","success");}
    else if(action==="backup-json")backupJson();
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