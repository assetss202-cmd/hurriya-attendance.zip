// يربط كود الواجهة الحالي بـ Firebase دون تغيير وظائفه (db / downloads بنفس الواجهة السابقة)
(function(){
  firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth(), fs=firebase.firestore();
  auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  window.fbAuth=auth; window.fbDb=fs;
  let ok; window.__ready=new Promise(r=>ok=r); window.__markReady=()=>ok();
  window.claude={use:async n=>{
    if(n==="db"){await window.__ready;return fs}          // يبدأ بعد نجاح تسجيل الدخول فقط
    if(n==="user")return {isOwner:()=>false,canEdit:()=>false};
    if(n==="downloads")return {save:async({filename,data})=>{
      const a=document.createElement("a");a.href=URL.createObjectURL(data);a.download=filename;
      document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}};
    return null;
  }};
})();
