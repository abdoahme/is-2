# ملف المشروع الشامل — IS Motors
## إعداد الملف: إسلام الفايد

**تاريخ إعداد النسخة:** 26 نوفمبر 2026  
**اسم النظام:** IS Motors — نظام إدارة معرض السيارات والحسابات  
**اللغة والاتجاه:** العربية، من اليمين إلى اليسار (RTL)  
**النطاق المرتبط بالموقع:** https://is-motors.vercel.app/

---

## 1. ملخص المشروع

تطبيق ويب لإدارة عمليات معرض السيارات والقيود المالية والتشغيلية. يضم واجهة دخول وصلاحيات مستخدمين، ولوحة إدارة لحسابات السيارات والمصروفات والذمم ورأس المال والشركاء والتقارير وطلبات الموظفين. التطبيق حاليًا مبني كتطبيق ويب ثابت (HTML/CSS/JavaScript) ويستخدم Supabase للمصادقة وتخزين البيانات، وVercel للاستضافة.

## 2. مستودع المصدر وإصدار الكود

- مستودع GitHub: https://github.com/abdoahme/is-2
- الفرع الذي يحتوي على هذه النسخة: `redesign/islam-al-fayed-interface`
- الفرع الافتراضي للمستودع: `main`
- نقطة بداية نسخة إعادة التصميم: `33b34c784456a6034a0d6db3d6819ddadfb1adca`
- التغيير المرئي الأول في CSS: `674616cdb937b08d7863d06f32117f9b6f3c26d5`
- ملفات التطبيق الأساسية:
  - `index.html` — هيكل الصفحات وتسجيل الدخول والتنقل والنوافذ.
  - `styles.css` — تصميم الواجهة والاستجابة للشاشات.
  - `app.js` — المصادقة، الصلاحيات، المعالجة المالية، الحفظ، التقارير والتصدير.
  - `README.md` — نظرة تشغيلية مختصرة.
- هذا الملف يحتوي في آخره على نسخة كاملة من ملفات HTML وCSS وJavaScript المتصلة بهذه النسخة، وليس مجرد مقتطفات.

## 3. الاستضافة والنشر — Vercel

| الحقل | القيمة |
|---|---|
| اسم المشروع | `is-motors` |
| Project ID | `prj_K7UFKyRH9mwAeWUj93mScwHz3a8z` |
| Team ID | `team_NTL4UG0h5TsX1yl1HVcNq2JA` |
| النطاق | https://is-motors.vercel.app/ |
| Deployment ID المرتبط بالنطاق في آخر تحقق | `dpl_9e5uD5pkCYGVYoVyS5S9R8H3NkZe` |
| رابط النشر المرتبط | https://is-motors-rcnzc30vu-aa01028111-9066.vercel.app/ |
| حالة ذلك النشر عند آخر تحقق | `READY` |
| فرع المصدر لذلك النشر | `redesign/islam-al-fayed-interface` |
| Commit النشر السابق | `33b34c784456a6034a0d6db3d6819ddadfb1adca` |
| المنطقة | `iad1` |

**ملاحظة نشر مهمة:** بعد إعادة تصميم الواجهة، تم التحقق من أن النطاق `is-motors.vercel.app` مرتبط بالنشر `dpl_9e5uD5pkCYGVYoVyS5S9R8H3NkZe` وحالته `READY`، وأن مصدره هو فرع إعادة التصميم المذكور أعلاه. خاصية `target` في سجل Vercel ما زالت `null`؛ لذلك الوصف الدقيق هو أن النطاق تم إسناده إلى نشر جاهز، وليس الادعاء بأن سجل النشر يحمل `Target = Production`.

## 4. قاعدة البيانات — Supabase

| الحقل | القيمة |
|---|---|
| اسم المشروع | `IS Motors` |
| Project Reference | `xnogogvdxforrpdijuuu` |
| رابط API | https://xnogogvdxforrpdijuuu.supabase.co |
| المنطقة | `eu-central-1` |
| الحالة عند الفحص | `ACTIVE_HEALTHY` |
| إصدار PostgreSQL | `17.12` |

### الجداول التي تم فحصها

#### `public.app_records`

جدول سجلات التطبيق الرئيسي، ويستخدم تخزين JSONB للحالة المالية والإدارية لكل مستخدم.

| العمود | النوع | الاستخدام |
|---|---|---|
| `id` | uuid | المفتاح الأساسي |
| `user_id` | uuid | صاحب السجل، مرتبط بـ `auth.users.id` |
| `record_type` | text | نوع السجل، وتتحقق قاعدة البيانات من القيم المسموح بها |
| `record_key` | text | مفتاح السجل داخل النوع |
| `payload` | jsonb | بيانات التطبيق |
| `created_at` | timestamptz | وقت الإنشاء |
| `updated_at` | timestamptz | وقت آخر تحديث |

القيم المسموح بها لـ `record_type` في القيد الحالي: `cars`, `expenses`, `debts`, `capital`, `partners`, `opening_balances`, `settings`, `legacy_archive`.  
المفتاح الأساسي: `id`. ويوجد ارتباط خارجي من `user_id` إلى `auth.users.id`.  
**RLS مفعّل**، وتعليق الجدول يوضح أن كل مستخدم مصادق يصل إلى سجلاته فقط وفق سياسات الصفوف.

#### `public.expense_submissions`

جدول طلبات مصروفات المستلزمات التي يرسلها الموظفون للإدارة.

| العمود | النوع | القاعدة |
|---|---|---|
| `id` | uuid | المفتاح الأساسي |
| `submitted_by` | uuid | مرتبط بـ `auth.users.id` |
| `expense_type` | text | القيمة المسموح بها حاليًا `supplies` |
| `description` | text | من 3 إلى 500 حرف بعد إزالة الفراغات |
| `amount` | numeric | يجب أن يكون أكبر من صفر |
| `expense_date` | date | الافتراضي تاريخ اليوم |
| `created_at` | timestamptz | الافتراضي `now()` |
| `status` | text | `pending` أو `recorded` |

**RLS مفعّل** أيضًا على هذا الجدول. وفي وقت فحص المخطط كان عداد الصفوف المعروض 0 في جدول الطلبات، بينما كان عداد جدول `app_records` يعرض 3 صفوف. هذه أعداد لحظة الفحص وليست تصديرًا للبيانات.

### دالة الصلاحيات

يستدعي التطبيق RPC باسم `get_my_is_motors_role()` للتحقق من دور المستخدم. يتعامل الكود مع دورين:
- `admin`: لوحة الإدارة والمحاسبة وفق صلاحيات قاعدة البيانات.
- `user`: بوابة محدودة لإرسال طلب مصروف مستلزمات فقط.

لم يتم تضمين تعريف الدالة أو نص سياسات RLS في هذا الملف؛ يلزم تصديرها من لوحة Supabase أو مراجعة SQL الفعلي قبل إجراء أي تغيير أمني.

## 5. نموذج البيانات داخل `payload`

تحتوي حالة التطبيق في JavaScript على مجموعات رئيسية، وتُحفظ ضمن سجل الإعدادات الرئيسي في `app_records.payload`:

- `cars`: بيانات السيارات، الشراء والتجهيز والبيع والتحصيل والمساهمات.
- `expenses`: المصروفات التشغيلية.
- `debts`: الذمم والأقساط والمبالغ المستحقة للمعرض أو عليه.
- `capital`: إيداعات رأس المال والمسحوبات والربح والخسارة.
- `partnerMovements`: مساهمات الشركاء وسحوباتهم وروابط القيود.
- `closings`: حالات التقفيل الشهري ونصف السنوي والسنوي واللقطات المحفوظة.
- `documents`: بيانات المستندات التي يديرها التطبيق.
- `actualCash`: قيمة النقدية الفعلية عند استخدامها.
- `periodFilter`: إعدادات تحديد الفترة.
- `appSettings`: إعدادات التطبيق واسمه.

## 6. وظائف النظام الحالية

1. تسجيل الدخول وإدارة جلسة Supabase.
2. فحص دور المستخدم قبل عرض لوحة الإدارة.
3. إدارة السيارات ومبالغ الشراء والتجهيز والبيع والمدفوع والمتبقي.
4. ربط مساهمة الشريك المسجلة على السيارة بحركة الشريك وحركة رأس المال.
5. إدارة مصروفات التشغيل وبنودها والمستلم وطريقة الدفع.
6. إدارة الذمم والأقساط وقيم الإجمالي والمسدد والمتبقي وتاريخ الاستحقاق.
7. إدارة حركة الخزينة ورأس المال، مع حقول الأرباح والخسائر.
8. تجميع أرصدة الشركاء وإظهار المساهمات والسحوبات والمتاح.
9. تسجيل سحب الشريك في دفتر الشريك ورأس المال معًا.
10. التحقق من الأرقام والقيم لمنع المبالغ السالبة أو السحب الأكبر من الرصيد.
11. تقارير الفترة والتقفيل السنوي/النصف سنوي/الشهري حسب السجلات المحفوظة.
12. تصدير بيانات الصفحة الحالية بصيغة CSV وإنشاء نسخة احتياطية JSON محلية.
13. بوابة موظف لإرسال طلبات مصروفات المستلزمات، ثم اعتماد الطلب وإضافته للمصروفات من حساب الإدارة.
14. رسائل تأكيد الحذف قبل تنفيذ العملية.

## 7. الإصلاحات المحاسبية الموجودة في نسخة الأساس

- تحليل الأرقام العربية والهندية والفواصل العشرية وفواصل الآلاف.
- منع احتساب حركة الشريك والقيْد الرأسمالي المرتبط بها مرتين.
- تحديث مساهمة الشريك المرتبطة بالسيارة في القيدين معًا عند تعديلها.
- حذف القيود المرتبطة مع السيارة عند حذفها وفق قواعد تمنع إفساد رصيد الشريك.
- منع تعديل أو حذف القيد الرأسمالي المرتبط منفردًا بما قد يفصل الدفاتر.
- تسجيل سحب الشريك كحركة خصم من الرصيد والخزينة.
- منع السحب الزائد والتحقق من رصيد الشريك.
- التحقق من صحة المصروفات والذمم والإيداعات والسحوبات والأرباح والخسائر.
- عدم اعتبار الحفظ ناجحًا قبل التحقق من نتيجة الكتابة.

## 8. تصميم الواجهة في نسخة إعادة التصميم

التعديلات مخصصة للعرض والتنقل ولا تغيّر طريقة قراءة البيانات أو حفظها:
- واجهة فاتحة متناسقة بخلفيات فاتحة وبطاقات بيضاء.
- إعادة تنظيم لوحة الإدارة في تخطيط ذي قائمة جانبية على الكمبيوتر.
- تقسيم روابط التنقل إلى مجموعات: نظرة عامة، إدارة المعرض، الحسابات والشركاء، التقارير والنظام.
- تتحول القائمة الجانبية إلى شريط أفقي قابل للتمرير على الأجهزة اللوحية والهواتف.
- إبراز القسم الحالي بألوان وحالة اختيار واضحة مع رموز صغيرة.
- مساحة محتوى مستقلة ومنظمة مع شريط ترحيب وبحث وتصدير.
- عرض بطاقات السجلات في عمودين على الشاشات الواسعة وعمود واحد على الهاتف.
- تحسين بطاقات المؤشرات المالية والأقسام والجداول وحقول النماذج والنوافذ المنبثقة.
- احترام تفضيل تقليل الحركة ودعم اتجاه RTL العربي.

## 9. تشغيل المشروع وتطويره

المشروع الحالي ثابت ولا يحتاج أمر build أو تثبيت حزم محلية في نسخته الأساسية:
1. استنساخ المستودع من GitHub.
2. فتح الفرع `redesign/islam-al-fayed-interface` للحصول على تعديلات الواجهة مع إصلاحات المحاسبة الموجودة في نقطة البداية.
3. نشر مجلد الجذر في Vercel.
4. التأكد من تحميل ملف `styles.css` وملف `app.js` ومكتبة `@supabase/supabase-js`.
5. استخدام إعدادات Supabase الحالية وسياسات RLS ودالة الصلاحيات نفسها.

## 10. الذكاء الاصطناعي والمفاتيح السرية

ملفات المصدر التي تم فحصها لا تحتوي على واجهة محادثة AI عاملة أو مسار خادم مفعّل لخدمة Gemini. ملف README الحالي يذكر أن تفعيل Gemini يتطلب وسيطًا خلفيًا آمنًا ومفتاحًا محفوظًا كسر Vercel، لا تخزينه في المتصفح أو ملفات JavaScript العامة.  
**لم يتم نسخ أي مفتاح AI أو كلمة مرور أو Service Role Key أو جلسة دخول إلى هذا الملف.** لا تضع أي مفتاح سري داخل `app.js` أو `index.html` أو GitHub.

## 11. حدود هذا الملف

- هذا الملف يوثق بنية المشروع والملفات المصدرية والاتصالات الفنية، وليس نسخة احتياطية من سجلات العملاء أو حسابات الشركاء.
- لم يتم تغيير مخطط Supabase أو تعديل سجلاته أثناء إعداد هذا الملف.
- يجب أخذ نسخة احتياطية من قاعدة البيانات قبل أي تعديل لاحق على بنية الجداول أو البيانات.
- عدد الصفوف المعروض في قسم قاعدة البيانات هو لقطة وقت الفحص فقط.
- لا يحتوي التوثيق على كلمات مرور أو مفاتيح سرية.

---

# 12. الكود المصدري الكامل

> المحتوى التالي هو النسخة المحدثة للملفات الثلاثة كما كانت في فرع `redesign/islam-al-fayed-interface` عند تحديث هذا المستند.

## 12.1 `index.html`

```html
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f4f6fa">
  <meta name="description" content="نظام IS Motors لإدارة حسابات المعرض والسيارات والمصروفات والذمم.">
  <title>IS Motors | نظام الإدارة والحسابات</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css">
  <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2"></script>
  <script defer src="./app.js"></script>
</head>
<body>
  <div id="bootScreen" class="boot-screen">
    <div class="brand-mark">IS</div>
    <div class="boot-title">IS MOTORS</div>
    <div class="muted">جاري الاتصال بالنظام وقاعدة البيانات...</div>
  </div>

  <main id="loginScreen" class="auth-screen" hidden>
    <section class="auth-card">
      <div class="brand-mark large">IS</div>
      <p class="eyebrow">IS MOTORS MANAGEMENT</p>
      <h1>نظام الإدارة والحسابات</h1>
      <p class="muted auth-intro">سجّل الدخول للوصول إلى لوحة المعرض حسب صلاحية حسابك.</p>
      <form id="loginForm" class="form-stack">
        <label>البريد الإلكتروني
          <input id="loginEmail" type="email" autocomplete="username" required placeholder="name@example.com" dir="ltr">
        </label>
        <label>كلمة المرور
          <input id="loginPassword" type="password" autocomplete="current-password" required placeholder="••••••••">
        </label>
        <button class="btn btn-primary btn-wide" type="submit">تسجيل الدخول</button>
        <p id="loginError" class="form-error" role="alert"></p>
      </form>
      <div class="auth-foot">اتصال مشفّر بقاعدة البيانات السحابية</div>
    </section>
  </main>

  <main id="appShell" class="app-shell" hidden>
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark small">IS</div>
        <div><strong>IS MOTORS</strong><span>نظام الإدارة والحسابات</span></div>
      </div>
      <div class="top-actions">
        <span id="syncBadge" class="sync-badge">● متصل</span>
        <span id="roleBadge" class="role-badge"></span>
        <button id="logoutBtn" class="btn btn-ghost btn-small" type="button">خروج</button>
      </div>
    </header>

    <div class="admin-layout">
      <aside class="sidebar" aria-label="قائمة إدارة الموقع">
        <div class="sidebar-heading">
          <p class="eyebrow">WORKSPACE</p>
          <strong>القائمة الرئيسية</strong>
          <span>اختر القسم الذي تريد إدارته</span>
        </div>
        <nav id="mainNav" class="main-nav" aria-label="التنقل الرئيسي">
          <div class="nav-group">
            <span class="nav-group-title">نظرة عامة</span>
            <button class="nav-btn active" data-view="overview"><span class="nav-symbol" aria-hidden="true">⌂</span><span>الرئيسية</span></button>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">إدارة المعرض</span>
            <button class="nav-btn" data-view="cars"><span class="nav-symbol" aria-hidden="true">▣</span><span>السيارات</span></button>
            <button class="nav-btn" data-view="expenses"><span class="nav-symbol" aria-hidden="true">↗</span><span>المصروفات</span></button>
            <button class="nav-btn" data-view="receivables"><span class="nav-symbol" aria-hidden="true">◷</span><span>المبالغ المتبقية</span></button>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">الحسابات والشركاء</span>
            <button class="nav-btn" data-view="debts"><span class="nav-symbol" aria-hidden="true">≋</span><span>الذمم والأقساط</span></button>
            <button class="nav-btn" data-view="capital"><span class="nav-symbol" aria-hidden="true">＋</span><span>رأس المال والخزينة</span></button>
            <button class="nav-btn" data-view="partners"><span class="nav-symbol" aria-hidden="true">⇄</span><span>حركة الشركاء</span></button>
          </div>
          <div class="nav-group">
            <span class="nav-group-title">التقارير والنظام</span>
            <button class="nav-btn" data-view="reports"><span class="nav-symbol" aria-hidden="true">▤</span><span>التقارير والتقفيل</span></button>
            <button class="nav-btn" data-view="requests"><span class="nav-symbol" aria-hidden="true">◎</span><span>طلبات الموظفين</span></button>
            <button class="nav-btn" data-view="settings"><span class="nav-symbol" aria-hidden="true">⚙</span><span>الإعدادات والروابط</span></button>
          </div>
        </nav>
        <div class="sidebar-foot">
          <span class="sidebar-foot-mark">IS</span>
          <div><strong>IS Motors</strong><small>إدارة المعرض والحسابات</small></div>
        </div>
      </aside>

      <div class="workspace-main">
        <section class="welcome-strip">
          <div class="welcome-copy">
            <p class="eyebrow">لوحة التحكم</p>
            <h1 id="pageTitle">الرئيسية</h1>
            <p id="userLine" class="muted"></p>
          </div>
          <div class="welcome-actions">
            <label class="search-wrap">
              <span class="search-symbol" aria-hidden="true">⌕</span>
              <input id="globalSearch" class="search-input" type="search" placeholder="ابحث في الصفحة الحالية..." aria-label="ابحث في الصفحة الحالية">
            </label>
            <button id="exportBtn" class="btn btn-outline btn-small" type="button"><span aria-hidden="true">⇩</span> تصدير CSV</button>
          </div>
        </section>

        <section id="mainContent" class="main-content" aria-live="polite"></section>
        <footer class="app-footer">
          <span>IS Motors — نظام الإدارة المالية</span>
          <span>© 2026 Abdulrahman Ahmed Abdo</span>
        </footer>
      </div>
    </div>

  <main id="employeeShell" class="app-shell employee-shell" hidden>
    <header class="topbar">
      <div class="brand-lockup"><div class="brand-mark small">IS</div><div><strong>IS MOTORS</strong><span>بوابة الموظف</span></div></div>
      <div class="top-actions"><span class="role-badge user-badge">موظف</span><button id="employeeLogoutBtn" class="btn btn-ghost btn-small" type="button">خروج</button></div>
    </header>
    <section class="employee-card">
      <p class="eyebrow">EMPLOYEE PORTAL</p>
      <h1>تسجيل مصروف مستلزمات</h1>
      <p class="muted">هذا الحساب مخصص لإرسال طلبات المصروفات العادية فقط. لا يتيح مشاهدة بيانات أو حسابات المعرض.</p>
      <form id="expenseRequestForm" class="form-stack">
        <label>بيان المصروف
          <input id="requestDescription" type="text" minlength="3" maxlength="500" required placeholder="مثال: أدوات تنظيف أو مستلزمات مكتبية">
        </label>
        <div class="form-grid two">
          <label>المبلغ بالجنيه
            <input id="requestAmount" type="number" min="0.01" step="0.01" required placeholder="0.00" dir="ltr">
          </label>
          <label>التاريخ
            <input id="requestDate" type="date" required>
          </label>
        </div>
        <button class="btn btn-primary btn-wide" type="submit">إرسال الطلب للإدارة</button>
        <p id="requestFeedback" class="form-feedback" role="status"></p>
      </form>
    </section>
    <footer class="app-footer"><span>IS Motors</span><span>طلبات الموظفين — صلاحية محدودة</span></footer>
  </main>

  <dialog id="editorDialog" class="editor-dialog">
    <form id="editorForm" method="dialog">
      <div class="dialog-head"><div><p class="eyebrow">تعديل البيانات</p><h2 id="editorTitle">إضافة سجل</h2></div><button id="closeEditorBtn" class="icon-btn" type="button" aria-label="إغلاق">×</button></div>
      <div id="editorFields" class="form-grid"></div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" id="cancelEditorBtn" type="button">إلغاء</button>
        <button class="btn btn-primary" type="submit">حفظ البيانات</button>
      </div>
    </form>
  </dialog>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
</body>
</html>
```

## 12.2 `styles.css`

```css
:root{color-scheme:dark;--bg:#080d18;--panel:#111a2b;--panel2:#172338;--line:#27364f;--text:#edf2fa;--muted:#9ba9bf;--gold:#d6ad63;--gold2:#f0d398;--red:#ff727c;--green:#54d6a1;--blue:#6cb8ff;--shadow:0 22px 70px rgba(0,0,0,.35)}
*{box-sizing:border-box}html{min-height:100%;background:var(--bg)}body{margin:0;min-height:100vh;background:radial-gradient(ellipse at 80% -10%,rgba(214,173,99,.12),transparent 34%),var(--bg);color:var(--text);font-family:"Cairo",system-ui,sans-serif}button,input,select,textarea{font:inherit}button{cursor:pointer}a{color:var(--gold2);text-decoration:none}a:hover{text-decoration:underline}[hidden]{display:none!important}.muted{color:var(--muted)}.eyebrow{font-size:11px;letter-spacing:1.8px;color:var(--gold);font-weight:900;margin:0 0 7px}.brand-mark{width:54px;height:54px;display:grid;place-items:center;border:1px solid rgba(240,211,152,.65);border-radius:16px;background:linear-gradient(145deg,#243653,#0d1728);color:var(--gold2);font-size:23px;font-weight:900;letter-spacing:-2px;box-shadow:inset 0 0 22px rgba(214,173,99,.1),0 10px 30px rgba(0,0,0,.24)}.brand-mark.large{width:74px;height:74px;font-size:31px;border-radius:21px;margin:0 auto 16px}.brand-mark.small{width:42px;height:42px;border-radius:13px;font-size:19px}.boot-screen{min-height:100vh;display:grid;place-content:center;justify-items:center;gap:12px;text-align:center}.boot-title{font-weight:900;letter-spacing:3px}.auth-screen{min-height:100vh;display:grid;place-items:center;padding:22px}.auth-card,.employee-card{width:min(100%,490px);padding:34px;border:1px solid var(--line);border-radius:25px;background:linear-gradient(160deg,rgba(26,40,62,.96),rgba(13,21,36,.98));box-shadow:var(--shadow)}.auth-card{text-align:center}.auth-card h1,.employee-card h1{font-size:25px;margin:0 0 8px}.auth-intro{margin:0 0 25px;font-size:13px}.form-stack{display:grid;gap:16px;text-align:right}.form-stack label,.form-grid label{display:grid;gap:7px;color:#cbd6e6;font-size:13px;font-weight:800}.form-stack input,.form-grid input,.form-grid select,.form-grid textarea,.search-input{width:100%;min-width:0;background:#0b1423;color:var(--text);border:1px solid #30415c;border-radius:12px;padding:12px 13px;outline:none}.form-stack input:focus,.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.search-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(214,173,99,.12)}.auth-foot{border-top:1px solid var(--line);margin-top:24px;padding-top:15px;font-size:11px;color:var(--muted)}.form-error{min-height:20px;color:var(--red);font-size:12px;margin:0}.form-feedback{min-height:20px;color:var(--green);font-size:13px;margin:0}.btn{border:1px solid transparent;border-radius:12px;padding:10px 16px;font-weight:900;font-size:13px;transition:.18s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px}.btn:hover{transform:translateY(-1px);filter:brightness(1.08)}.btn:disabled{opacity:.55;cursor:not-allowed;transform:none}.btn-primary{background:linear-gradient(135deg,#e0bd7c,#b98c45);color:#182235;box-shadow:0 8px 20px rgba(185,140,69,.16)}.btn-outline{border-color:#52617a;color:var(--text);background:transparent}.btn-ghost{border-color:var(--line);color:#d7e0ed;background:#111c2e}.btn-danger{border-color:rgba(255,114,124,.3);background:rgba(255,114,124,.1);color:#ff9ba2}.btn-small{padding:7px 11px;font-size:11px;border-radius:10px}.btn-wide{width:100%;padding:13px}.app-shell{width:min(1500px,100%);margin:0 auto;padding:0 26px 22px}.topbar{min-height:77px;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid var(--line)}.brand-lockup{display:flex;align-items:center;gap:12px}.brand-lockup strong{display:block;letter-spacing:1.2px;font-size:14px}.brand-lockup span{display:block;color:var(--muted);font-size:11px}.top-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sync-badge,.role-badge{font-size:11px;font-weight:900;padding:6px 10px;border-radius:999px;background:rgba(84,214,161,.1);color:var(--green);border:1px solid rgba(84,214,161,.22)}.sync-badge.busy{background:rgba(214,173,99,.12);color:var(--gold2);border-color:rgba(214,173,99,.25)}.sync-badge.offline{background:rgba(255,114,124,.1);color:var(--red);border-color:rgba(255,114,124,.25)}.role-badge{background:rgba(214,173,99,.1);color:var(--gold2);border-color:rgba(214,173,99,.2)}.user-badge{background:rgba(108,184,255,.1);color:var(--blue);border-color:rgba(108,184,255,.2)}.welcome-strip{display:flex;justify-content:space-between;align-items:end;gap:18px;padding:27px 0 20px}.welcome-strip h1{font-size:25px;margin:0}.welcome-strip .muted{margin:3px 0 0;font-size:12px}.welcome-actions{display:flex;gap:9px;align-items:center}.search-input{width:min(330px,32vw);padding:9px 12px;font-size:12px}.main-nav{display:flex;gap:7px;overflow:auto;padding:8px;margin-bottom:20px;background:rgba(18,29,47,.85);border:1px solid var(--line);border-radius:15px;scrollbar-width:thin}.nav-btn{white-space:nowrap;border:1px solid transparent;border-radius:10px;padding:8px 13px;background:transparent;color:#aebbd0;font-size:12px;font-weight:800}.nav-btn.active{background:linear-gradient(135deg,rgba(214,173,99,.19),rgba(214,173,99,.06));border-color:rgba(214,173,99,.35);color:var(--gold2)}.main-content{min-height:420px}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 16px}.page-heading h2{margin:0;font-size:19px}.page-heading p{margin:3px 0 0;color:var(--muted);font-size:11px}.page-actions{display:flex;gap:8px;flex-wrap:wrap}.kpi-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px}.kpi{padding:17px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,#17243a,#101929);min-width:0}.kpi .label{font-size:11px;color:var(--muted);font-weight:800}.kpi .value{font-size:21px;font-weight:900;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kpi .hint{font-size:10px;color:var(--muted);margin-top:5px}.kpi.gold .value{color:var(--gold2)}.kpi.red .value{color:#ff9097}.kpi.green .value{color:var(--green)}.kpi.blue .value{color:var(--blue)}.two-col{display:grid;grid-template-columns:1.25fr 1fr;gap:14px}.panel{border:1px solid var(--line);border-radius:17px;background:rgba(17,26,43,.92);padding:17px;min-width:0}.panel h3{font-size:14px;margin:0 0 13px}.panel-note{font-size:11px;color:var(--muted);margin:-7px 0 13px}.data-list{display:grid;gap:10px}.data-card{border:1px solid #2b3b54;border-radius:14px;padding:13px;background:rgba(9,16,29,.58);display:grid;gap:10px}.data-card-head{display:flex;justify-content:space-between;align-items:start;gap:10px}.data-card-title{font-weight:900;font-size:14px;overflow-wrap:anywhere}.data-card-sub{font-size:11px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}.data-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.data-cell{min-width:0}.data-cell span{display:block;font-size:10px;color:var(--muted)}.data-cell strong{display:block;font-size:12px;margin-top:2px;overflow-wrap:anywhere}.card-actions{display:flex;gap:7px;flex-wrap:wrap;border-top:1px solid rgba(39,54,79,.7);padding-top:9px}.badge{display:inline-flex;align-items:center;border-radius:99px;padding:4px 8px;font-size:10px;font-weight:900;white-space:nowrap;background:rgba(108,184,255,.1);color:var(--blue)}.badge.warn{background:rgba(255,114,124,.12);color:#ff929a}.badge.ok{background:rgba(84,214,161,.11);color:var(--green)}.badge.gold{background:rgba(214,173,99,.12);color:var(--gold2)}.empty-state{padding:38px 12px;text-align:center;border:1px dashed #34445e;border-radius:14px;color:var(--muted);font-size:13px}.summary-list{display:grid;gap:11px}.summary-line{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(39,54,79,.7);padding-bottom:9px;font-size:12px}.summary-line:last-child{border:0;padding:0}.summary-line strong{font-variant-numeric:tabular-nums}.positive{color:var(--green)!important}.negative{color:#ff929a!important}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:13px}.data-table{border-collapse:collapse;width:100%;min-width:780px;font-size:12px}.data-table th,.data-table td{padding:11px 12px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}.data-table th{color:var(--gold2);background:#17243a;font-weight:900}.data-table td{color:#dce4ef}.data-table tr:last-child td{border:0}.table-actions{display:flex;gap:6px}.app-footer{display:flex;justify-content:space-between;gap:10px;color:#6f7e95;font-size:10px;border-top:1px solid var(--line);padding:17px 0;margin-top:28px}.employee-shell{max-width:760px}.employee-card{width:100%;margin:70px auto 0}.employee-card>p:not(.eyebrow){font-size:12px;line-height:1.8;margin-bottom:23px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.form-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.form-grid .full{grid-column:1/-1}.form-grid textarea{min-height:85px;resize:vertical}.editor-dialog{width:min(720px,calc(100% - 24px));max-height:90vh;overflow:auto;border:1px solid #41516a;border-radius:21px;background:#111b2c;color:var(--text);padding:22px;box-shadow:var(--shadow)}.editor-dialog::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(4px)}.dialog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.dialog-head h2{margin:0;font-size:19px}.icon-btn{border:1px solid var(--line);background:#1b2940;color:var(--text);border-radius:10px;width:36px;height:36px;font-size:23px}.dialog-actions{display:flex;justify-content:end;gap:9px;margin-top:20px;padding-top:15px;border-top:1px solid var(--line)}.toast{position:fixed;bottom:22px;left:22px;z-index:100;max-width:min(440px,calc(100% - 44px));padding:12px 16px;border:1px solid #445773;border-radius:12px;background:#1b2a42;color:var(--text);font-size:12px;font-weight:800;box-shadow:var(--shadow);opacity:0;transform:translateY(15px);pointer-events:none;transition:.22s}.toast.show{opacity:1;transform:translateY(0)}.toast.error{border-color:rgba(255,114,124,.45);color:#ffadb2}.toast.success{border-color:rgba(84,214,161,.4);color:#9af0c9}.link-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.link-card{border:1px solid var(--line);border-radius:13px;padding:14px;background:#101a2b}.link-card strong{display:block;font-size:12px}.link-card span{display:block;color:var(--muted);font-size:10px;margin-top:4px;direction:ltr;text-align:left;overflow-wrap:anywhere}.section-gap{margin-top:15px}
@media(max-width:1050px){.kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.data-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:720px){.app-shell{padding:0 13px 18px}.topbar{min-height:65px}.brand-lockup span{font-size:9px}.top-actions{gap:6px}.sync-badge,.role-badge{font-size:9px;padding:5px 7px}.welcome-strip{align-items:stretch;flex-direction:column;padding:20px 0 14px}.welcome-strip h1{font-size:22px}.welcome-actions{width:100%}.search-input{width:100%;flex:1;min-width:0}.main-nav{margin-bottom:13px;padding:6px}.nav-btn{font-size:10px;padding:8px 10px}.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.kpi{padding:13px}.kpi .value{font-size:17px}.two-col{grid-template-columns:1fr}.page-heading{align-items:start;flex-direction:column}.data-card{padding:11px}.data-card-title{font-size:12px}.data-card-grid{gap:7px}.data-cell strong{font-size:11px}.form-grid,.form-grid.two{grid-template-columns:1fr}.form-grid .full{grid-column:auto}.auth-card,.employee-card{padding:25px 19px}.employee-card{margin-top:35px}.link-grid{grid-template-columns:1fr}.app-footer{flex-direction:column}.editor-dialog{padding:17px}.dialog-actions .btn{flex:1}}
@media print{body{background:#fff;color:#111}.topbar,.main-nav,.welcome-actions,.page-actions,.card-actions,.app-footer,.btn{display:none!important}.app-shell{width:100%;padding:0}.panel,.kpi,.data-card{background:#fff;border:1px solid #ddd;color:#111}.muted,.data-cell span{color:#555}.data-table th{background:#eee;color:#111}.data-table td{color:#111}.kpi .value{color:#111!important}}

/* IS Motors - clean light appearance */
:root{color-scheme:light;--bg:#f4f6fa;--panel:#fff;--panel2:#f8fafc;--line:#e2e7ef;--text:#202b3b;--muted:#718096;--gold:#96651f;--gold2:#875a19;--red:#c94755;--green:#16845a;--blue:#2878b8;--shadow:0 18px 55px rgba(24,39,64,.10)}
html{background:var(--bg)}
body{background:radial-gradient(ellipse at 80% -10%,rgba(214,173,99,.13),transparent 34%),var(--bg);color:var(--text)}
.brand-mark{background:linear-gradient(145deg,#fff,#edf1f7);color:#875a19;box-shadow:inset 0 0 18px rgba(214,173,99,.12),0 8px 22px rgba(25,40,65,.08)}
.auth-card,.employee-card{background:linear-gradient(160deg,#fff,#f8fafd);border-color:var(--line)}
.form-stack label,.form-grid label{color:#425168}
.form-stack input,.form-grid input,.form-grid select,.form-grid textarea,.search-input{background:#fff;color:var(--text);border-color:#d7deea}
.form-stack input:focus,.form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus,.search-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(150,101,31,.12)}
.btn-outline{border-color:#cbd4e1;color:var(--text);background:#fff}
.btn-ghost{border-color:#e0e6ee;color:#46556c;background:#f4f6fa}
.topbar{border-bottom-color:var(--line)}
.main-nav{background:#fff;border-color:var(--line);box-shadow:0 5px 18px rgba(26,41,66,.04)}
.nav-btn{color:#5e6d82}
.nav-btn.active{background:linear-gradient(135deg,rgba(214,173,99,.20),rgba(214,173,99,.07));border-color:rgba(150,101,31,.28);color:#805515}
.kpi{background:linear-gradient(145deg,#fff,#f8fafd);border-color:var(--line);box-shadow:0 6px 20px rgba(25,40,65,.035)}
.panel{background:#fff;border-color:var(--line);box-shadow:0 6px 22px rgba(25,40,65,.035)}
.data-card{background:#fff;border-color:#e1e7ef;box-shadow:0 4px 15px rgba(25,40,65,.025)}
.data-card-grid .data-cell span,.muted,.page-heading p,.panel-note{color:var(--muted)}
.data-card-title{color:#202b3b}
.data-table th{background:#f0f3f8;color:#805515}
.data-table td{color:#344258}
.data-table th,.data-table td{border-bottom-color:#e5eaf1}
.summary-line{border-bottom-color:#e9edf3}
.empty-state{border-color:#d8e0ea;color:#77849a}
.editor-dialog{background:#fff;color:var(--text);border-color:#d9e0ea}
.editor-dialog::backdrop{background:rgba(29,42,62,.35);backdrop-filter:blur(3px)}
.icon-btn{border-color:#dfe5ed;background:#f3f6fa;color:#4d5b70}
.toast{background:#fff;color:var(--text);border-color:#d8e0ea;box-shadow:0 12px 40px rgba(25,40,65,.16)}
.link-card{background:#fff;border-color:var(--line)}
.link-card span{color:var(--muted)}
.positive{color:var(--green)!important}
.negative{color:var(--red)!important}
.data-card-sub{color:#77849a}
.auth-foot{border-color:#e4e9f0;color:#7a879a}
.partner-balance-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}
.partner-balance-head h3{margin:0 0 5px}
@media(max-width:720px){.partner-balance-head{align-items:flex-start;flex-direction:column}.partner-balance-head .page-actions{width:100%}.partner-balance-head .btn{width:100%}}


/* ==========================================================
   IS Motors · Refined Light UI
   Prepared as part of the Islam Al-Fayed project dossier
   ========================================================== */
:root{
  color-scheme:light;
  --bg:#f5f7fb;
  --panel:#ffffff;
  --panel2:#f8fafd;
  --line:#e4e9f1;
  --text:#1e293b;
  --muted:#718096;
  --gold:#9a6a24;
  --gold2:#825719;
  --red:#c2414e;
  --green:#16835a;
  --blue:#2b78b7;
  --shadow:0 16px 42px rgba(29,43,67,.085);
}
html{background:var(--bg);scroll-behavior:smooth}
body{
  color:var(--text);
  background:
    radial-gradient(ellipse at 86% -12%,rgba(214,173,99,.14),transparent 34%),
    linear-gradient(180deg,#f8f9fc 0%,#f3f6fa 100%);
}
button,input,select,textarea{font-family:"Cairo",system-ui,sans-serif}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
  outline:3px solid rgba(154,106,36,.24);
  outline-offset:2px;
}
.app-shell{max-width:1560px}
.topbar{
  position:relative;
  min-height:82px;
  border-bottom:1px solid rgba(220,227,237,.9);
}
.brand-lockup strong{color:#1e293b;font-size:15px;letter-spacing:1.4px}
.brand-lockup span{color:#7b8798}
.brand-mark{
  border:1px solid rgba(154,106,36,.22);
  background:linear-gradient(145deg,#fff 0%,#f0f3f8 100%);
  color:#8c611f;
  box-shadow:0 8px 22px rgba(26,42,67,.08),inset 0 1px #fff;
}
.welcome-strip{
  margin:22px 0 16px;
  padding:22px 24px;
  align-items:center;
  border:1px solid #e7eaf0;
  border-radius:20px;
  background:linear-gradient(112deg,#fff 0%,#fbfcfe 66%,#f8f4eb 100%);
  box-shadow:0 8px 24px rgba(31,48,75,.045);
}
.welcome-strip h1{color:#1c293a;font-size:27px;letter-spacing:-.35px}
.welcome-strip .eyebrow{color:#9a6a24}
.welcome-actions{gap:10px}
.search-input{
  min-height:40px;
  border:1px solid #dfe5ee;
  background:#fff;
  color:#29364a;
  box-shadow:0 2px 8px rgba(28,44,70,.025);
}
.main-nav{
  position:sticky;
  top:8px;
  z-index:12;
  gap:6px;
  margin-bottom:22px;
  padding:7px;
  border:1px solid #e3e8f0;
  border-radius:16px;
  background:rgba(255,255,255,.94);
  box-shadow:0 8px 24px rgba(28,44,70,.065);
  backdrop-filter:blur(14px);
}
.nav-btn{
  min-height:39px;
  padding:8px 14px;
  border-radius:11px;
  color:#657187;
  font-size:12px;
  transition:background .18s ease,color .18s ease,border-color .18s ease,transform .18s ease;
}
.nav-btn:hover{
  color:#805515;
  background:#faf7f0;
  border-color:#eee4d1;
}
.nav-btn.active{
  color:#765016;
  border-color:#ead9b8;
  background:linear-gradient(135deg,#f6eddb,#fbf8f1);
  box-shadow:inset 0 1px rgba(255,255,255,.9);
}
.page-heading{margin-bottom:18px}
.page-heading h2{color:#1f2b3d;font-size:20px}
.page-heading p{color:#7b8798;line-height:1.7}
.page-actions{align-items:center}
.kpi-grid{gap:14px;margin-bottom:20px}
.kpi{
  position:relative;
  overflow:hidden;
  padding:18px 18px 17px;
  border:1px solid #e4e9f1;
  border-radius:17px;
  background:linear-gradient(145deg,#fff 0%,#fbfcfe 100%);
  box-shadow:0 6px 20px rgba(29,43,67,.045);
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;
}
.kpi:before{
  content:"";
  position:absolute;
  inset:0 0 auto;
  height:3px;
  background:linear-gradient(90deg,rgba(154,106,36,.65),rgba(154,106,36,0));
  opacity:.68;
}
.kpi:hover{
  transform:translateY(-2px);
  border-color:#d7dfeb;
  box-shadow:0 12px 26px rgba(29,43,67,.075);
}
.kpi .label{color:#738096;font-size:11px}
.kpi .value{color:#1f2c40;font-size:22px;letter-spacing:-.25px}
.kpi .hint{color:#8792a3;line-height:1.6}
.kpi.gold .value{color:#94651e}
.kpi.red .value{color:#c2414e}
.kpi.green .value{color:#16835a}
.kpi.blue .value{color:#2b78b7}
.panel{
  border:1px solid #e4e9f1;
  border-radius:18px;
  background:#fff;
  box-shadow:0 7px 23px rgba(29,43,67,.04);
}
.panel h3{color:#263449;font-size:14px}
.panel-note{color:#7d899b;line-height:1.7}
.two-col{gap:16px}
.data-card{
  border:1px solid #e6ebf2;
  border-radius:15px;
  background:linear-gradient(150deg,#fff 0%,#fcfdff 100%);
  box-shadow:0 4px 15px rgba(29,43,67,.03);
  transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease;
}
.data-card:hover{
  border-color:#d8e0ea;
  box-shadow:0 9px 21px rgba(29,43,67,.06);
  transform:translateY(-1px);
}
.data-card-title{color:#263449;font-size:14px}
.data-card-sub{color:#8190a3;line-height:1.6}
.data-cell span{color:#8792a3}
.data-cell strong{color:#344256;font-variant-numeric:tabular-nums}
.card-actions{border-top-color:#edf0f5}
.badge{
  padding:5px 9px;
  border:1px solid #e0e8f0;
  background:#f3f7fb;
  color:#376f9d;
}
.badge.ok{border-color:#d8eee4;background:#eff9f3;color:#16835a}
.badge.warn{border-color:#f4dce0;background:#fff3f4;color:#bd4551}
.badge.gold{border-color:#eee2cb;background:#fbf6eb;color:#8b641f}
.summary-list{gap:12px}
.summary-line{
  padding-bottom:11px;
  border-bottom:1px solid #edf0f5;
  color:#536176;
  line-height:1.7;
}
.summary-line strong{color:#253449}
.positive{color:#16835a!important}
.negative{color:#c2414e!important}
.empty-state{
  border:1px dashed #d8e0ea;
  border-radius:15px;
  background:#fbfcfe;
  color:#7b8798;
  line-height:1.9;
}
.table-wrap{
  border:1px solid #e4e9f1;
  border-radius:15px;
  background:#fff;
  box-shadow:0 4px 15px rgba(29,43,67,.025);
}
.data-table{font-size:12px}
.data-table th{
  position:sticky;
  top:0;
  background:#f4f6fa;
  color:#78531b;
  border-bottom:1px solid #e1e6ee;
}
.data-table td{color:#37465b}
.data-table tr:hover td{background:#fafbfd}
.data-table th,.data-table td{border-bottom-color:#edf0f5}
.form-stack label,.form-grid label{color:#46556b;line-height:1.6}
.form-stack input,.form-grid input,.form-grid select,.form-grid textarea,.search-input{
  min-height:42px;
  border:1px solid #dfe5ee;
  border-radius:12px;
  background:#fff;
  color:#253449;
}
.form-grid textarea{line-height:1.7}
.btn{
  min-height:38px;
  border-radius:11px;
  font-weight:800;
  transition:transform .16s ease,box-shadow .16s ease,filter .16s ease;
}
.btn-primary{
  background:linear-gradient(135deg,#d7b16d 0%,#b9893f 100%);
  color:#202b3b;
  box-shadow:0 5px 14px rgba(159,116,44,.16);
}
.btn-primary:hover{box-shadow:0 8px 18px rgba(159,116,44,.22)}
.btn-outline{
  border-color:#d8e0ea;
  color:#405068;
  background:#fff;
}
.btn-ghost{
  border-color:#e0e6ee;
  color:#526177;
  background:#f7f9fc;
}
.btn-danger{
  border-color:#f1dadd;
  background:#fff4f5;
  color:#bd4551;
}
.editor-dialog{
  border:1px solid #dfe5ee;
  border-radius:21px;
  background:#fff;
  color:#263449;
  box-shadow:0 24px 80px rgba(26,42,67,.20);
}
.editor-dialog::backdrop{background:rgba(30,43,62,.30);backdrop-filter:blur(4px)}
.dialog-head h2{color:#263449}
.icon-btn{border:1px solid #dfe5ee;background:#f7f9fc;color:#506076}
.dialog-actions{border-top-color:#edf0f5}
.sync-badge,.role-badge{font-weight:800}
.sync-badge{border-color:#d9eee4;background:#f0faf4;color:#16835a}
.sync-badge.busy{border-color:#eee2cb;background:#fbf6eb;color:#8b641f}
.sync-badge.offline{border-color:#f1dadd;background:#fff4f5;color:#bd4551}
.role-badge{border-color:#eee2cb;background:#fbf6eb;color:#8b641f}
.user-badge{border-color:#dce9f5;background:#f1f7fd;color:#2b78b7}
.toast{
  border:1px solid #dfe5ee;
  border-radius:14px;
  background:#fff;
  color:#263449;
  box-shadow:0 15px 42px rgba(29,43,67,.16);
}
.toast.error{border-color:#f1dadd;color:#bd4551}
.toast.success{border-color:#d9eee4;color:#16835a}
.link-card{
  border:1px solid #e4e9f1;
  border-radius:15px;
  background:linear-gradient(145deg,#fff,#fbfcfe);
  box-shadow:0 4px 14px rgba(29,43,67,.03);
}
.link-card strong{color:#2b394e}
.app-footer{
  margin-top:30px;
  border-top:1px solid #e4e9f1;
  color:#8792a3;
}
.auth-card,.employee-card{
  border:1px solid #e2e8f0;
  border-radius:25px;
  background:linear-gradient(150deg,#fff 0%,#fbfcfe 100%);
  box-shadow:0 24px 75px rgba(29,43,67,.11);
}
.auth-card h1,.employee-card h1{color:#263449}
.auth-intro,.employee-card>p:not(.eyebrow){color:#758297;line-height:1.8}
.auth-foot{border-top-color:#edf0f5;color:#8692a4}
.partner-balance-head{padding-bottom:13px;border-bottom:1px solid #edf0f5}
#mainContent{padding-bottom:12px}
@media(max-width:1050px){
  .kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(max-width:720px){
  .topbar{min-height:68px}
  .welcome-strip{margin-top:16px;padding:17px;border-radius:17px}
  .welcome-strip h1{font-size:23px}
  .main-nav{top:4px;margin-inline:-2px;border-radius:13px}
  .nav-btn{min-height:37px;padding:7px 11px}
  .kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .kpi{padding:14px}
  .kpi .value{font-size:18px}
  .panel{padding:14px;border-radius:15px}
  .data-card{border-radius:13px}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}
}


/* ==========================================================
   IS Motors · Navigation and workspace layout refresh
   ========================================================== */
.app-shell{max-width:1600px;padding:0 28px 26px}
.admin-layout{
  display:grid;
  grid-template-columns:252px minmax(0,1fr);
  gap:22px;
  align-items:start;
  margin-top:22px;
}
.sidebar{
  position:sticky;
  top:18px;
  min-width:0;
  padding:16px 12px 12px;
  border:1px solid #e4e9f1;
  border-radius:19px;
  background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%);
  box-shadow:0 8px 25px rgba(29,43,67,.055);
}
.sidebar-heading{padding:3px 9px 14px;border-bottom:1px solid #edf0f5}
.sidebar-heading .eyebrow{font-size:9px;letter-spacing:1.6px;margin-bottom:4px}
.sidebar-heading strong{display:block;color:#29384d;font-size:14px}
.sidebar-heading>span{display:block;margin-top:3px;color:#8792a3;font-size:10px}
.main-nav{
  position:static;
  display:flex;
  flex-direction:column;
  gap:13px;
  margin:12px 0 0;
  padding:0;
  overflow:visible;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
.nav-group{display:grid;gap:4px;min-width:0}
.nav-group-title{
  padding:0 10px 4px;
  color:#9aa4b3;
  font-size:9px;
  font-weight:900;
  letter-spacing:.35px;
}
.nav-btn{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:11px;
  width:100%;
  min-height:42px;
  padding:7px 9px;
  border:1px solid transparent;
  border-radius:11px;
  color:#637187;
  text-align:right;
  font-size:11px;
  font-weight:800;
  white-space:nowrap;
}
.nav-btn>span:last-child{overflow:hidden;text-overflow:ellipsis}
.nav-symbol{
  display:grid;
  flex:0 0 29px;
  width:29px;
  height:29px;
  place-items:center;
  border:1px solid #e8edf3;
  border-radius:9px;
  background:#f7f9fc;
  color:#8290a3;
  font-size:16px;
  line-height:1;
}
.nav-btn:hover{
  border-color:#ece4d5;
  background:#fcfaf6;
  color:#805719;
}
.nav-btn:hover .nav-symbol{border-color:#eadfc9;background:#fbf6eb;color:#966a2a}
.nav-btn.active{
  border-color:#eadfc9;
  background:linear-gradient(110deg,#f8f1e4,#fffaf1);
  color:#785319;
  box-shadow:0 3px 10px rgba(140,102,39,.055);
}
.nav-btn.active .nav-symbol{
  border-color:#e9d9b8;
  background:#f4e9d2;
  color:#805719;
}
.sidebar-foot{
  display:flex;
  align-items:center;
  gap:9px;
  margin-top:17px;
  padding:12px 8px 3px;
  border-top:1px solid #edf0f5;
}
.sidebar-foot-mark{
  display:grid;
  flex:0 0 31px;
  width:31px;
  height:31px;
  place-items:center;
  border:1px solid #eadfc9;
  border-radius:9px;
  background:#fbf6eb;
  color:#875c1e;
  font-size:13px;
  font-weight:900;
}
.sidebar-foot strong{display:block;color:#44536a;font-size:10px}
.sidebar-foot small{display:block;color:#97a1af;font-size:9px}
.workspace-main{min-width:0}
.workspace-main>.welcome-strip{
  margin:0 0 18px;
  min-height:116px;
  padding:22px 24px;
  border-radius:18px;
}
.workspace-main>.welcome-strip h1{font-size:25px}
.search-wrap{
  position:relative;
  display:block;
  min-width:min(300px,28vw);
}
.search-wrap .search-input{width:100%;padding-inline-start:38px}
.search-symbol{
  position:absolute;
  top:50%;
  inset-inline-start:12px;
  transform:translateY(-50%);
  color:#9aa5b4;
  font-size:23px;
  pointer-events:none;
}
.welcome-actions{gap:9px}
.welcome-actions .btn{white-space:nowrap}
.main-content{min-height:460px}
.main-content>.page-heading{padding:2px 2px 0}
.data-list{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:13px;
  align-items:stretch;
}
.data-list>.data-card{height:100%;align-content:start}
.data-list>.empty-state{grid-column:1/-1}
.app-footer{margin-top:25px}
@media(max-width:1180px){
  .app-shell{padding-inline:20px}
  .admin-layout{grid-template-columns:224px minmax(0,1fr);gap:16px}
  .sidebar{padding:13px 9px 10px}
  .nav-btn{gap:8px;padding:7px}
  .workspace-main>.welcome-strip{padding:18px}
  .search-wrap{min-width:min(250px,25vw)}
}
@media(max-width:920px){
  .app-shell{padding-inline:16px}
  .admin-layout{grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px}
  .sidebar{position:relative;top:auto;padding:11px 10px 9px;border-radius:15px}
  .sidebar-heading,.sidebar-foot{display:none}
  .main-nav{
    display:flex;
    flex-direction:row;
    align-items:stretch;
    gap:6px;
    margin:0;
    overflow-x:auto;
    padding:0 0 2px;
    scrollbar-width:thin;
  }
  .nav-group{display:flex;flex:0 0 auto;gap:5px;align-items:center}
  .nav-group-title{display:none}
  .nav-btn{width:auto;min-height:40px;flex:0 0 auto;gap:7px;padding:6px 9px}
  .nav-symbol{width:25px;height:25px;flex-basis:25px;font-size:14px}
  .workspace-main>.welcome-strip{margin-bottom:14px}
  .data-list{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:620px){
  .app-shell{padding:0 11px 16px}
  .topbar{min-height:64px}
  .admin-layout{gap:10px}
  .sidebar{padding:8px;border-radius:13px}
  .nav-btn{min-height:37px;font-size:10px;padding:5px 8px}
  .nav-symbol{width:23px;height:23px;flex-basis:23px;border-radius:7px}
  .workspace-main>.welcome-strip{
    min-height:0;
    padding:15px;
    gap:12px;
    border-radius:15px;
  }
  .workspace-main>.welcome-strip h1{font-size:21px}
  .welcome-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%}
  .search-wrap{min-width:0;width:100%}
  .welcome-actions .btn{padding-inline:9px;font-size:10px}
  .data-list{grid-template-columns:1fr;gap:10px}
  .main-content{min-height:340px}
}
@media(prefers-reduced-motion:reduce){
  .nav-btn,.data-card{transition:none}
}

```

## 12.3 `app.js`

```javascript
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
```
