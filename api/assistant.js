const SUPABASE_URL = process.env.SUPABASE_URL || "https://xnogogvdxforrpdijuuu.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_Hgm9b9fTqPS9RWm7QGdeJA_dx4FBZ0m";
const MODEL = "gemini-3.8-flash";
const requestCounts = new Map();

function send(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function numericContext(context) {
  const allowed = [
    "sales", "grossProfit", "operatingExpenses", "netOperatingResult",
    "receivables", "capitalDeposits", "capitalWithdrawals",
    "cashReconciliationDifferences", "pendingEmployeeRequests"
  ];
  const clean = { currency: "EGP", asOf: String(context && context.asOf || "").slice(0, 10) };
  allowed.forEach((key) => {
    const value = Number(context && context[key]);
    clean[key] = Number.isFinite(value) ? value : 0;
  });
  return clean;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "طريقة الطلب غير مدعومة." });
  const authorization = String(req.headers.authorization || "");
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return send(res, 401, { error: "سجّل الدخول أولاً." });

  try {
    const userResponse = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + token }
    });
    if (!userResponse.ok) return send(res, 401, { error: "انتهت جلسة الدخول. سجّل الدخول مرة أخرى." });

    const roleResponse = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_my_is_motors_role", {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: "{}"
    });
    if (!roleResponse.ok || (await roleResponse.json()) !== "admin") {
      return send(res, 403, { error: "المساعد الذكي متاح لمدير النظام فقط." });
    }

    const user = await userResponse.json();
    const now = Date.now();
    const bucket = Math.floor(now / 60000);
    const rateKey = String(user.id) + ":" + bucket;
    const used = requestCounts.get(rateKey) || 0;
    if (used >= 20) return send(res, 429, { error: "تم الوصول إلى حد الطلبات المؤقت. حاول بعد دقيقة." });
    requestCounts.set(rateKey, used + 1);
    for (const key of requestCounts.keys()) if (!key.endsWith(":" + bucket)) requestCounts.delete(key);

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const message = String(body.message || "").trim();
    if (!message || message.length > 3000) return send(res, 400, { error: "اكتب سؤالاً لا يتجاوز 3000 حرف." });
    if (!process.env.GEMINI_API_KEY) return send(res, 503, { error: "المساعد جاهز، لكن يلزم إضافة GEMINI_API_KEY في متغيرات Vercel السرية." });

    const context = numericContext(body.context || {});
    const prompt = [
      "أنت المساعد الإداري والمالي لنظام IS Motors. أجب باللغة العربية وبأسلوب واضح ومهني.",
      "حلل الأرقام المجمعة فقط. لا تخترع بيانات أو معاملات أو أسماء. وضّح الافتراضات وحدود الحسابات.",
      "لا تقدم فتوى محاسبية أو قانونية نهائية، ولا تنفذ أي تعديل أو حذف أو تحويل مالي. اقترح خطوات يراجعها المدير.",
      "بيانات مالية مجمعة بصيغة JSON:",
      JSON.stringify(context),
      "سؤال المدير:",
      message
    ].join("\n\n");

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "أنت مستشار إداري مالي حذر. لا تكشف أسرارًا ولا تطلب كلمات مرور أو مفاتيح API." }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 900 }
      }),
      signal: AbortSignal.timeout(30000)
    });
    const result = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      const status = aiResponse.status === 429 ? 429 : 502;
      return send(res, status, { error: aiResponse.status === 429 ? "وصلت خدمة الذكاء الاصطناعي إلى حد الاستخدام الحالي." : "تعذر على خدمة الذكاء الاصطناعي معالجة الطلب." });
    }
    const answer = (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts || [])
      .map((part) => part.text || "").join("\n").trim();
    if (!answer) return send(res, 502, { error: "لم تُرجع خدمة الذكاء الاصطناعي إجابة نصية." });
    return send(res, 200, { answer });
  } catch (error) {
    return send(res, 500, { error: "حدث خطأ داخلي أثناء معالجة طلب المساعد." });
  }
};
