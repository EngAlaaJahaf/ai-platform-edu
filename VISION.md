# رؤية المشروع وبدء العمل للفريق — منصة EduAI

> أُعِدَّت بتاريخ 2026-09-07 لتوجيه أعضاء الفريق الثلاثة.
> اقرأ هذا الملف أولاً، ثم `ROADMAP.md`، ثم افتح المهارة المخصصة لمسارك
> (داخل `.opencode/skills/`) لتوجيهك خطوة بخطوة.

---

## 1. ما هو المشروع

منصة تعليمية ذكية عربية (مشروع تخرج) تدمج أدوات الذكاء الاصطناعي للطلاب والباحثين:

- **الخلف**: Python 3.11 + FastAPI + Uvicorn + SQLite — يتضمن محرك عرض تقديمي يرنّر HTML → PPTX/PDF/PNG عبر Chrome headless.
- **الأمام**: React 19 + Vite + Tailwind CSS v4 + Lucide — واجهة RTL داكنة.

### الأدوات المبنية حالياً
| الأداة | الوصف |
|---|---|
| 💬 محادثة RAG | رفع PDF/Word/PPT → فهرسة → أجوبة موثقة برقم الصفحة |
| 📑 ملخص + خريطة ذهنية | 3 مستويات + SVG تفاعلي + تصدير |
| 🎯 استوديو اختبارات | MCQ + بطاقات + تصحيح فوري + تنبؤ درجة |
| ✍️ تدقيق أكاديمي | أخطاء + Originality Score + إعادة صياغة |
| 🌐 ترجمة أكاديمية | 3 أنماط + تصدير Word |
| 📊 لوحة طالب + إدارة | مستخدمون/إعدادات/سجلات/برومبتات |
| 🎨 **Deck Studio** (الجديد) | مولّد عروض بـ**نظام هويات بصرية**: معرض قوالب مدمجة، توليد هوية بالذكاء، استيراد من PPTX، قوالب مخصصة، إعادة تلوين كل الشريحة حسب هوية القالب |

---

## 2. الوضع الحالي — نقاط القوة والفجوات

### نقاط القوة
- عمل الميزات الأساسية كاملة وتعمل محلياً.
- Deck Studio شديد التقدم: القوالب، توليد الهوية، الاستيراد من PPTX، و**إعادة التلوين الكاملة** عبر CSS variables في `presentation_engine/engine.py`.
- البنية نظيفة نسبياً: `services/`, `routes/api.py`, `database.py` مفصولة.

### الفجوات الحرجة (تحتاج معالجة)
| الأولوية | المشكلة | المكان |
|---|---|---|
| 🔴 حرجة | الهوية عبر `X-User-Id` غير الموقّعة تُتلاعب بها بسهولة | `backend/routes/api.py:69` |
| 🔴 حرجة | تجاوز تحقيق Google JWT يثق بنص التوكن دون تحقق توقيع | `backend/services/auth_service.py:33-50` |
| 🔴 عالية | حد التوكنز مسجَّل لكن غير مفروض قبل أي استدعاء ذكاء | `backend/database.py`, `ai_service` |
| 🔴 عالية | مفتاح أدمن افتراضي + خطاف `sk_admin_` + `.env` يُعدّ للرفع | `backend/database.py:309` |
| 🟠 عالية | **صفر اختبارات** آلية؛ CI يبتلع الأخطاء (`|| true`) | لا pytest/vitest/workflows |
| 🟠 متوسطة | كود ميت + لا ErrorBoundary + حالات تحميل/فارغة ناقصة | 4 ملفات ميتة معروفة |
| 🟠 متوسطة | لا مساحة عمل مشتركة بين أعضاء الفريق | لا يوجد teams/template share |
| 🟠 متوسطة | خلفيات `art` بألوان ثابتة لا تتبع هوية القالب | `artgen.py` |
| 🟢 متوسطة | لا Docker/نشر إنتاج؛ تحليلات اللوحة أرقام ثابتة | — |
| 🟢 منخفضة | 3 ملفات DB مكررة مُرتكبة؛ CORS عريض؛ rate-limit في الذاكرة | — |

---

## 3. تقسيم العمل — ثلاثة مسارات متكاملة

**المبدأ العام**: كل مسار يملك ملفات محددة شبه منفصلة، ويدير فرع Git خاصاً به، ويراجع أعماله عبر PR. الاتصال والتنسيق في قناة الفريق عند أي ملامسة للملفات المشتركة (`routes/api.py`, `database.py`, `api.js`).

### المسار 1 — جودة الأكواد والبنية (`feat/quality`)
**مَن**: المسؤول عن الأساس الهندسي.
**الهدف**: توفير اختبارات وCI وصيانة تسمح للجميع بالعمل بأمان.
**الملفات**: `backend/tests/`, `frontend/src/**/__tests__/`, `pyproject.toml`, `oxlint.json`, `.github/workflows/ci.yml`, الكود الميت.
**مهامه (ROADMAP)**: `T1.1` pytest للـ API، `T1.2` اختبارات الخدمات، `T1.3` vitest للواجهات، `T1.4` ruff، `T1.5` تشديد oxlint، `T1.6` تنظيف الكود الميت، `T1.7` ErrorBoundary، `T1.8` ترحيلات DB آمنة، `T1.9` CI كاملة.
**يفتح المهارة**: `eduai-phase1-quality`

### المسار 2 — الأمان والحسابات (`feat/security`)
**مَن**: المسؤول عن حماية الحسابات والجلسات.
**الهدف**: إغلاق الثغرات الحرجة وتأسيس هوية موثوقة (تمدّ المسار 3 مستقبلاً).
**الملفات**: `backend/routes/api.py` (auth), `backend/services/auth_service.py`, `backend/database.py` (sessions/keys), `frontend/src/services/api.js`, `main.py` (CORS).
**مهامه (ROADMAP)**: `T2.1` جلسات موقّعة، `T2.2` إغلاق تجاوز Google، `T2.3` إلغاء خطاف `sk_admin_`، `T2.4` كلمة أدمن + `.env.example`، `T2.5` فرض حد التوكنز، `T2.6` مفاتيح API من الخادم، `T2.7` تحقق MIME، `T2.8` rate-limit دائم، `T2.9` تضييق CORS.
**يفتح المهارة**: `eduai-phase2-security`

### المسار 3 — التعاون والنشر والميزات (`feat/collab`)
**مَن**: المسؤول عن تمكين الفريق من العمل المشترك + النشر.
**الهدف**: مساحات فرق مشتركة (تحقق هدف دعوة الزملاء) + حزمة إنتاج جاهزة + إثراء Deck Studio.
**الملفات**: `backend/database.py` (جداول teams), `backend/routes/api.py` (`/api/teams/*`), `backend/presentation_engine/artgen.py`, `frontend` (Dashboard/DocumentLibrary/PresentationView), `Dockerfile*`, `docker-compose.yml`, `README.md`.
**مهامه (ROADMAP)**: `T3.1` مساحة فريق، `T3.2` تحسينات Deck Studio (صبغ art + خطوط + رفع حد الترجمة)، `T3.3` تحليلات حقيقية، `T3.4` حزمة Docker، `T3.5` توثيق، `T3.6` اشتراكات (اختياري).
**يفتح المهارة**: `eduai-phase3-collaboration`

---

## 4. سير العمل الجماعي

1. **حماية `main`**: يجب تفعيلها من GitHub → Settings → Branches → *Require a pull request before merging* + *Require status checks* (بعد وجود CI). اطلبها من المالك/الأدمن (المستودع عام — الإنفاذ من إعدادات GitHub).
2. **فروع مخصصة**: كل مسار ينشئ فرعه من `main` أحدث إصدار:
   ```
   git checkout -b feat/quality   # المسار 1
   git checkout -b feat/security  # المسار 2
   git checkout -b feat/collab    # المسار 3
   ```
3. **مهام صغيرة**: أنجز مهمة واحدة (`T2.3` مثلاً) في فرع فرعي قصير العمر ← PR صغير ← مراجعة زميل ← squash-merge.
4. **رسائل الالتزام**: نمط Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `security:`.
5. **قبل أي PR**:
   - خلف: `python -m pytest backend/tests -v` ثم `ruff check backend` (إن وُجد بعد المسار 1).
   - أمام: `cd frontend && npm test` ثم `npm run lint` ثم `npm run build`.
   - لا ترفع أي secret؛ تأكد أن `.env` غير مرتكب.
6. **التنسيق على الملفات المشتركة**: قبل تعديل `routes/api.py` أو `database.py` أو `api.js` أعلن في القناة ثم نفّذ فرعك بسرعة وmergه لتقليل التصادم.

---

## 5. البدء السريع محلياً (لأي عضو)

```bash
git clone https://github.com/EngAlaaJahaf/ai-platform-edu.git
cd ai-platform-edu
```

**الخلف:**
```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r backend/requirements.txt
copy backend\.env.example backend\.env   # ثم املأ GEMINI_API_KEY
```

**الأمام:**
```bash
cd frontend
npm install
```

**التشغيل:**
```bash
run_dev.bat   # أم، يدوياً:
# نافذة 1: python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
# نافذة 2: (من frontend) npm run dev
```
افتح `http://localhost:5173` — التوثيق `http://localhost:8001/docs`.

> **تنبيه Windows**: إن منع PowerShell تنفيذ سكربت (`.ps1`)، استخدم `cmd /c "..."`.

---

## 6. خطة الأسابيع المتوقعة (مرجع)

| الأسبوع | المسار 1 | المسار 2 | المسار 3 |
|---|---|---|---|
| 1 | pytest للـ API + ruff في CI | الجلسات الموقّعة T2.1 + إغلاق Google | جداول الفرق + كود الدعوة (T3.1) |
| 2 | اختبارات الخدمات + vitest | فرض التوكنز + مفتاح الأدمن | مشاركة المستندات/العروض (أدوار) |
| 3 | تنظيف الموت + ErrorBoundary | مفاتيح API من الخادم + MIME | Deck Studio: صبغ art + خطوط + حد الترجمة |
| 4 | ترحيلات DB + CI كاملة | rate-limit دائم + CORS | Docker + nginx + تحليلات حقيقية |
| 5+ | استكمال تغطية + مراجعة | توثيق أمان + مراجعة شاملة | توثيق النشر + اشتراكات |

---

## 7. مقاييس النجاح (Definition of Done لكل مسار)

- **المسار 1**: `pytest` + `vitest` يعملان محلياً؛ CI أخضر فعلياً (لا `|| true`)؛ لا ملفات ميتة في القائمة؛ `schema_migrations` يعمل.
- **المسار 2**: لا اعتماد على `X-User-Id`؛ تجاوز Google معطل؛ حد التوكنز يفرض `429`؛ لا مفتاح API في `localStorage`؛ CORS/MIME/rate-limit مفعّلة.
- **المسار 3**: مشاركة فرق شغّالة من طرفين بأدوار؛ خلفيات `art` تصبغ بالهوية؛ `GET /api/admin/stats` حقيقي؛ حزمة Docker تبني؛ README محدّث.

---

*أي غموض؟ اسأل المالك أو افتح Issue في المستودع. مرجع المهام الكامل: `ROADMAP.md`.*