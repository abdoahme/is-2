self.addEventListener("push",event=>{
  let data={title:"تنبيه IS Motors",body:"يوجد تنبيه جديد في النظام.",url:"/"};
  try{if(event.data)data=Object.assign(data,event.data.json());}catch(_){}
  event.waitUntil(self.registration.showNotification(data.title||"تنبيه IS Motors",{
    body:data.body||"يوجد تنبيه جديد في النظام.",
    tag:data.tag||"is-motors-alert",
    renotify:false,
    data:{url:data.url||"/"}
  }));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification.data&&event.notification.data.url||"/",self.location.origin).href;
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){if(client.url.startsWith(self.location.origin)){client.focus();return;}}
    return clients.openWindow(target);
  }));
});
