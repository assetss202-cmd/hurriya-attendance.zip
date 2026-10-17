// تسجيل الدخول الحقيقي (Firebase Auth) – يستبدل معالجات الدخول القديمة، وباقي الوظائف كما هي
const PAD="#Hurriya1", ADMIN_EMAIL="admin@hurriya.local";
const empEmail=c=>"e_"+c+"@hurriya.local", pw=c=>c+PAD;
const waitDb=async()=>{while(typeof db==="undefined"||!db)await new Promise(r=>setTimeout(r,50))};

$("loginBtn").onclick=async()=>{
  const c=$("code").value.trim().toLowerCase(),m=$("loginMsg");
  if(!c){m.textContent="أدخل الرمز";return}
  m.textContent="جارٍ التحقق...";
  try{
    const cr=await fbAuth.signInWithEmailAndPassword(empEmail(c),pw(c));
    const u=await fbDb.doc("users/"+cr.user.uid).get();
    const e=u.exists?await fbDb.doc("employees/"+u.data().code).get():null;
    if(!e||!e.exists){await fbAuth.signOut();m.textContent="هذا الحساب غير مفعّل";return}
    me={code:u.data().code,...e.data()};
    window.__markReady();await waitDb();m.textContent="";showEmp();
  }catch(err){m.textContent="الرمز غير صحيح أو غير مسجّل"}
};

$("adminBtn").onclick=async()=>{
  const n=$("aName").value.trim(),c=$("aCode").value.trim(),m=$("aMsg");
  if(!n||c.length<4){m.textContent="أدخل الاسم ورمزاً من 4 خانات على الأقل";return}
  m.textContent="جارٍ التحقق...";
  try{
    const meta=await fbDb.doc("meta/setup").get();
    if(!meta.exists){ // أول تشغيل: إنشاء حساب المسؤول
      const cr=await fbAuth.createUserWithEmailAndPassword(ADMIN_EMAIL,c+PAD);
      const b=fbDb.batch();
      b.set(fbDb.doc("admins/"+cr.user.uid),{createdAt:new Date().toISOString()});
      b.set(fbDb.doc("meta/setup"),{adminName:n});
      await b.commit();
    }else{
      if(meta.data().adminName!==n){m.textContent="الاسم أو الرمز غير صحيح";return}
      await fbAuth.signInWithEmailAndPassword(ADMIN_EMAIL,c+PAD);
    }
    const a=await fbDb.doc("admins/"+fbAuth.currentUser.uid).get();
    if(!a.exists){await fbAuth.signOut();m.textContent="لا تملك صلاحية المسؤول";return}
    window.__markReady();await waitDb();m.textContent="";enterAdmin();
  }catch(err){m.textContent="الاسم أو الرمز غير صحيح"}
};

$("cSave").onclick=async()=>{ // تغيير اسم/رمز المسؤول
  const n=$("cName").value.trim(),c=$("cCode").value.trim();
  if(!n||c.length<4){$("cMsg").textContent="أدخل اسماً ورمزاً من 4 خانات على الأقل";return}
  try{await fbAuth.currentUser.updatePassword(c+PAD);await fbDb.doc("meta/setup").update({adminName:n});
    $("cMsg").textContent="تم تحديث بيانات الدخول ✔";$("cCode").value=""}
  catch(e){$("cMsg").textContent="فشل التحديث، أعد تسجيل الدخول وحاول مجدداً"}
};

$("addBtn").onclick=async()=>{ // إضافة موظف (ينشئ له حساب دخول عبر تطبيق ثانوي حتى لا تخرج من جلسة المسؤول)
  const n=$("nName").value.trim(),c=$("nCode").value.trim().toLowerCase(),sal=+$("nSal").value||null,m=$("addMsg");
  if(!n||!/^[a-z0-9]{3,12}$/.test(c)){m.textContent="أدخل الاسم ورمزاً من 3 إلى 12 حرفاً أو رقماً";return}
  if(employees[c]){m.textContent="هذا الرمز مستخدم";return}
  m.textContent="جارٍ الإضافة...";
  try{
    const sec=firebase.apps.find(a=>a.name==="sec")||firebase.initializeApp(firebaseConfig,"sec"),sa=sec.auth();
    let cr;
    try{cr=await sa.createUserWithEmailAndPassword(empEmail(c),pw(c))}
    catch(e){if(e.code==="auth/email-already-in-use")cr=await sa.signInWithEmailAndPassword(empEmail(c),pw(c));else throw e}
    const uid=cr.user.uid;await sa.signOut();
    const b=fbDb.batch();
    b.set(fbDb.doc("employees/"+c),{name:n,salary:sal,uid,createdAt:new Date().toISOString()});
    b.set(fbDb.doc("users/"+uid),{code:c});
    await b.commit();
    m.textContent="تمت إضافة "+n;$("nName").value=$("nCode").value=$("nSal").value="";
  }catch(e){m.textContent="فشلت الإضافة: "+(e.code||e.message)}
};

window.delEmp=async c=>{
  c=decodeURIComponent(c);const e=employees[c];
  if(!e||!confirm("حذف "+e.name+"؟"))return;
  try{const b=fbDb.batch();b.delete(fbDb.doc("employees/"+c));if(e.uid)b.delete(fbDb.doc("users/"+e.uid));await b.commit()}catch(x){}
};
window.logout=async()=>{try{await fbAuth.signOut()}catch(e){}location.reload()};
