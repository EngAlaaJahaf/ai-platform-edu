---
name: eduai-phase2-security
description: Execute Phase 2 of the EduAI ROADMAP (al-aman wa al-hisabat / security & accounts). Use when the user asks about security, auth, sessions, sessions, JWT, X-User-Id, Google OAuth, token limits, hadd altoknz, API keys, MIME validation, rate limiting, CORS, or any task under المسار 2 (الأمان والحسابات). Triggers include "أغلق ثغرة", "اقفل X-User-Id", "حد التوكنز غير مفروض", "إدارة مفاتيح API", "إصلاح الـ Google login", "make auth secure", "fix the session bypass", "securer the API keys". Stage the whole phase per ROADMAP.md tasks T2.1–T2.9.
---

# Phase 2 — الأمان والحسابات (Security & Accounts)

المسؤول: عضو المسار 2. الهدف: إغلاق الثغرات الحرجة وتأسيس هوية موثوقة للفريق. كل مهمة من `ROADMAP.md` تحمل رقم `T2.x`. لا تعمل على مهام مسارات أخرى إلا بالتنسيق المعلن.

## أولاً: اقرأ السياق
- `ROADMAP.md` → القسم 3، المسار 2، المهام `T2.1`–`T2.9` + القسم 5 لجدول الأسابيع.
- الملفات الحساسة: `backend/routes/api.py` (الدوال والروتر)، `backend/database.py` (المخطط والجداول والدوال)، `backend/services/auth_service.py`، `backend/main.py` (وسيط CORS)، `frontend/src/services/api.js` (الترويسة + إرسال المفاتيح)، `frontend/src/components/AuthGateView.jsx`, `ApiKeyModal.jsx`.

## الخطر الحالي (وثائق دقيقة)
- هوية المستخدم تُقرأ من `X-User-Id` في `backend/routes/api.py:69` (`def _get_current_user(x_user_id: Optional[str] = Header(None))`). هذا ترويسة غير موقّعة — أي عميل يرسل أي `X-User-Id` يتقمّص مستخدماً.
- `backend/services/auth_service.py:33-50`: عند فشل التحقق الرسمي من Google، يُفكّك الـ JWT يدوياً بالـ base64 دون التحقق من التوقيع/الجمهور (`audience`). هذا تجاوز أمني حرج (يمكن دمج توكن مزوّر يحتوي email+sub والتحقق سينجح).
- `backend/database.py:309`: خطأ قديم `sk_admin_` في `is_valid_sk` — إزالة أو ربط صارم بـ `ADMIN_MASTER_KEY` قوي من البيئة فقط.
- حد التوكنز مسجَّل (`tokens_used`/`tokens_limit` في جدول `users`, `backend/database.py:63-64`) لكنه **ليس مفروضاً** قبل استدعاء الذكاء.
- مفتاح Gemini يبيت في `localStorage['eduai_gemini_api_key']` ويُرسل من المتصفح (هكذا تصل عبر `api.js` كرويسة). يجب نقله لإدارة من الخادم.
- رفع الملفات في `backend/routes/api.py` (~سطر 412-436) بلا تحقق MIME ولا تعقيم اسم ملف.
- rate-limit في الذاكرة — يضيع عند إعادة التشغيل.
- CORS عريض في `backend/main.py` (allow_methods/allow_headers = "*") — يُضيَّق إلى المستخدمات الفعلية.

## طريقة التنفيذ لكل مهمة

### T2.1 الجلسات الموقّعة (الأولوية القصوى)
- أنشئ جدول `sessions` (id/توكن عشوائي 32 byte, user_id, created_at, expires_at) في `backend/database.py` مع دوال إنشاء/تحقق/إبطال + middleware.
- غيّر `_get_current_user` في `backend/routes/api.py` ليقرأ توكن الجلسة من `Authorization: Bearer <token>` (أو ترويسة موثقة) بدل `X-User-Id`.
- في `frontend/src/services/api.js`: احفظ التوكن في `localStorage` وأرسله ضمن المصادقة؛ أبقِ أي دالة تمدد الجلسة.
- معيار القبول: إرسال `X-User-Id` مزوّر = `401`. تسجيل دخول حقيقي يبقي الجلسة سارية؛ تسجيل الخروج يبطلها.
- ملاحظة: يجب تنسيق أي مساس بـ `routes/api.py`/`database.py`/`api.js` مع المسارين 1 و3 قبل اللمس لأنها ملفات مشتركة.

### T2.2 إغلاق تجاوز Google JWT
- احذف الفرع `except` في `backend/services/auth_service.py:33-50` أو اشترط فيه تحقق توقيع/audience فعلياً.
- الأفضل: قدّم `client_id` إلزامياً في `verify_google_credential` وارفض أي توكن لا يتحقق رسمياً. غطِّ ذلك باختبار (بالتنسيق مع المسار 1).
- معيار القبول: توكن JWT مزوّر (علامة غرامية عشوائية) → رفض لوغاريتمي نظيف.

### T2.3 إلغاء خطاف sk_admin_
- في `backend/database.py:299-312`: لا تقبل `sk_admin_` إطلاقاً، فقط `ADMIN_MASTER_KEY` قوي من `.env`/متغيّر بيئة. حدِّث `frontend/src/services/api.js` إن أرسل مفاتيح قديمة.

### T2.4 كلمة مرور الأدمن + .env
- لا كلمة مرور افتراضية؛ تُولَّد عشوائياً وتُطبع مرة واحدة في سجل الدخول لو لم تُضبط.
- أزل `backend/.env` من التتبع (احذفه من index إذا كان مرتكباً) وأنشئ `backend/.env.example` بوثائق كل مفتاح. لا تضع أي secret في الملفات المرسلة.

### T2.5 فرض حد التوكنز
- أضف تحققاً في بداية كل استدعاء AI: اقرأ `tokens_used`/`tokens_limit` (دالة من `backend/database.py`) وإذا `tokens_used >= tokens_limit` ارجع `429` برسالة عربية واضحة وكود `QUOTA_EXCEEDED`.
- قدّر استهلاك النقاط لكل عملية (`estimate_tokens(input_length, output_length)`) وحدّث `tokens_used` بعد الإجابة (كلاس المغلف مع `admin` لديه قواعد مختلفة).
- معيار القبول: حساب بحد 0 لا يستطيع تنفيذ أي مكالمة AI.

### T2.6 إدارة مفاتيح API من الخادم
- انقل التخزين إلى جدول `user_api_keys` (مشفر بمفتاح خادم من env) مع endpoints إدارة؛ أوقف إرسال المفتاح من المتصفح.
- حدِّث `ApiKeyModal.jsx` ليعرض "الحالة/التوفير من الخادم" بدل كشف المفتاح، وحدِّث `api.js` ليستخدِم مفتاح الخادم تلقائياً.
- حافظ على التوافق مع مزودات متعددة (Gemini/Ollama/Groq/OpenAI-compatible).

### T2.7 تحقق MIME + تعقيم اسم الملف
- في رفع `document_service`/`api.py`: تحقق من `Content-Type`/السحرة البايتية (`%PDF`, `PK`, `last`) ضد قائمة الصيغ المسموحة (مطابقة exports)، ولافتراض العنوان `Uploads/winter.png` لاسم الملف بأحرف آمنة وتجنّب `../`.

### T2.8 rate-limit دائم
- حوّل عدّاد rate-limit من الذاكرة إلى جدول DB (مثلاً `rate_limits(user_id, window, hits)`) مع تنظيف دوري؛ راعِ المزودات والعمليات الثقيلة.

### T2.9 تضييق CORS
- في `backend/main.py`: اجعل `allow_methods` و`allow_headers` قائمة صريحة (GET/POST/PUT/DELETE/OPTIONS، الترويسات الفعلية فقط) مع `allow_origins` محددة بدل `"*"` عند النشر.

## أوامر تحقق سريعة
- `python -m pytest backend/tests -v` (بعد مسار 1؛ استهدف اختبارات T2.x).
- `python -m py_compile backend/routes/api.py backend/database.py backend/services/auth_service.py`.
- `frontend: npm run build` لعكس أي كسر في `api.js`.
- لو PowerShell يرفض تشغيل سكربت، استخدم `cmd /c "..."` (معرفة سابقة للمشروع).

## التعامل مع GitHub (سحب ورفع التحديثات)
- **دائماً على فرعك** `feat/security` — لا تعمل على `main` مباشرة.
- **بداية كل جلسة** (رتّب بالترتيب — لا تَسحب وأنت على فرعك مباشرة):
  ```bash
  git fetch origin
  git checkout main && git pull origin main
  git checkout feat/security && git merge main   # دمج مستجدات الزملاء وحل التعارضات إن وقعت
  ```
- **رفع عملك** بعد إتمام مهمة أمنية:
  ```bash
  git add <ملفات> && git commit -m "security: ..."   # رسائل Conventional: security:/fix:/refactor:
  git push -u origin feat/security   # -u فقط أول مرة، ثم git push
  ```
- **عند التعارض**: افتح الملف، اترك النسخة الصحيحة واحذف علامات `<<<<<<< == ===== >>>>>>>`، ثم `git add <ملف>` و`git commit`.
- **أمان إضافي**: تأكد قبل أي `git add .` أن ملف ضمن `.env` غير موقع (فإن أرفقته ضمناً، أزله بـ `git rm --cached .env`). لا ترفع أي مفتاح/secret أبداً.
- **PR**: بعد الرفع افتح PR نحو `main` (الرابط يظهر في الطرفية، أو `gh pr create --base main`).

## معايير القبول النهائية للمسار
- لا اعتماد على `X-User-Id` في أي endpoint (باستثناء Compatibility مؤقت موثق).
- تجاوز Google معطل؛ مطاردة `sk_admin_` صفرية في المصدر.
- حد التوكنز مفروض فعلياً يعيد 429 عند التجاوز.
- لا مفتاح API في `localStorage` للمُدار من الخادم عبر مزودات مدعومة.
- CORS/rate-limit/MIME معتمدة ومختبرة.