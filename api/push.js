const webpush = require("web-push");
const SUPABASE_URL = "https://xnogogvdxforrpdijuuu.supabase.co";
const SUPABASE_KEY = "sb_publishable_Hgm9b9fTqPS9RWm7QGdeJA_dx4FBZ0m";

async function verifyAdmin(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("يلزم تسجيل الدخول."), {status:401});
  const userResponse = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: {apikey:SUPABASE_KEY, Authorization:"Bearer "+token}
  });
  if (!userResponse.ok) throw Object.assign(new Error("جلسة الدخول غير صالحة."), {status:401});
  const user = await userResponse.json();
  const roleResponse = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_my_is_motors_role", {
    method:"POST", headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+token,"Content-Type":"application/json"}, body:"{}"
  });
  if (!roleResponse.ok || (await roleResponse.json()) !== "admin") throw Object.assign(new Error("هذه الخدمة متاحة لمدير النظام فقط."), {status:403});
  return {token,user};
}
function supaHeaders(token, extra) {
  return Object.assign({apikey:SUPABASE_KEY,Authorization:"Bearer "+token,"Content-Type":"application/json"},extra||{});
}
module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if (req.method === "GET") {
    if (!process.env.VAPID_PUBLIC_KEY) return res.status(503).json({error:"إعداد إشعارات الهاتف غير مكتمل على الخادم."});
    return res.status(200).json({publicKey:process.env.VAPID_PUBLIC_KEY});
  }
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  try {
    const {token,user}=await verifyAdmin(req);
    const body=req.body||{};
    if(body.action==="subscribe") {
      const sub=body.subscription;
      if(!sub||typeof sub.endpoint!=="string"||!sub.endpoint.startsWith("https://")||!sub.keys||!sub.keys.p256dh||!sub.keys.auth) return res.status(400).json({error:"بيانات اشتراك الإشعارات غير صحيحة."});
      const response=await fetch(SUPABASE_URL+"/rest/v1/push_subscriptions?on_conflict=endpoint",{
        method:"POST",headers:supaHeaders(token,{Prefer:"resolution=merge-duplicates,return=minimal"}),
        body:JSON.stringify({user_id:user.id,endpoint:sub.endpoint,subscription:sub,user_agent:String(body.userAgent||"").slice(0,240),updated_at:new Date().toISOString()})
      });
      if(!response.ok) return res.status(502).json({error:"تعذر حفظ اشتراك الهاتف."});
      return res.status(200).json({ok:true});
    }
    if(body.action==="unsubscribe") {
      const endpoint=String(body.endpoint||"");
      const response=await fetch(SUPABASE_URL+"/rest/v1/push_subscriptions?endpoint=eq."+encodeURIComponent(endpoint)+"&user_id=eq."+encodeURIComponent(user.id),{
        method:"DELETE",headers:supaHeaders(token,{Prefer:"return=minimal"})
      });
      if(!response.ok) return res.status(502).json({error:"تعذر إلغاء اشتراك الهاتف."});
      return res.status(200).json({ok:true});
    }
    if(body.action==="notify") {
      const title=String(body.title||"تنبيه IS Motors").slice(0,160);
      const message=String(body.body||"يوجد تنبيه جديد في النظام.").slice(0,800);
      const kind=["info","warning","error","finance","system"].includes(body.kind)?body.kind:"info";
      const crypto=require("crypto");
      const dedupe=crypto.createHash("sha256").update(user.id+":"+String(body.dedupeKey||title+message)).digest("hex");
      const insert=await fetch(SUPABASE_URL+"/rest/v1/app_notifications?on_conflict=dedupe_key",{
        method:"POST",headers:supaHeaders(token,{Prefer:"resolution=ignore-duplicates,return=representation"}),
        body:JSON.stringify({user_id:user.id,kind,title,body:message,dedupe_key:dedupe,metadata:{source:"web-client"}})
      });
      if(!insert.ok) return res.status(502).json({error:"تعذر حفظ سجل التنبيه."});
      const inserted=await insert.json();
      if(!inserted.length) return res.status(200).json({ok:true,deduplicated:true});
      const subsResponse=await fetch(SUPABASE_URL+"/rest/v1/push_subscriptions?select=id,endpoint,subscription&user_id=eq."+encodeURIComponent(user.id),{headers:supaHeaders(token)});
      if(!subsResponse.ok) return res.status(502).json({error:"تم حفظ التنبيه لكن تعذر قراءة أجهزة الهاتف."});
      const subscriptions=await subsResponse.json();
      if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY||!process.env.VAPID_SUBJECT) return res.status(503).json({error:"تم حفظ التنبيه داخل الموقع، لكن إعداد Push غير مكتمل."});
      webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
      const payload=JSON.stringify({title,body:message,tag:dedupe,url:"/"});
      const results=await Promise.allSettled(subscriptions.map(async row=>{
        try { await webpush.sendNotification(row.subscription,payload); return true; }
        catch(error) {
          if(error.statusCode===404||error.statusCode===410) {
            await fetch(SUPABASE_URL+"/rest/v1/push_subscriptions?id=eq."+encodeURIComponent(row.id),{method:"DELETE",headers:supaHeaders(token)});
          }
          throw error;
        }
      }));
      return res.status(200).json({ok:true,saved:true,pushSent:results.filter(x=>x.status==="fulfilled").length,pushFailed:results.filter(x=>x.status==="rejected").length});
    }
    return res.status(400).json({error:"إجراء غير معروف."});
  } catch(error) {
    return res.status(error.status||500).json({error:error.message||"حدث خطأ بالخادم."});
  }
};
