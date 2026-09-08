# منصة ذكاء | EduAI — المساعد الأكاديمي الذكي 🚀

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

منصة ذكاء اصطناعي متكاملة (Production-Ready) للطلاب والباحثين الجامعيين — تجمع **الاسترجاع المعزز بالتوليد (RAG)**، والتلخيص الهيكلي، وتوليد الخرائط الذهنية، ومولد الاختبارات التفاعلي، والتدقيق الأكاديمي، والترجمة الأكاديمية.

> **المستودع:** `https://github.com/EngAlaaJahaf/ai-platform-edu` — جاهز للتنصيب المحلي بثلاثة أوامر فقط.

---

## 📑 جدول المحتويات
- [المميزات](#-المميزات)
- [المعمارية](#️-المعمارية)
- [المتطلبات](#-المتطلبات)
- [التحميل والتنصيب](#-التحميل-والتنصيب)
- [إعداد متغيرات البيئة](#-إعداد-متغيرات-البيئة)
- [التشغيل](#-التشغيل)
- [توثيق الـ API](#-توثيق-الـ-api)
- [هيكل المشروع](#-هيكل-المشروع)
- [الأمان](#-الأمان)
- [المساهمة](#-المساهمة)

---

## 🌟 المميزات
1. **💬 المحادثة التوثيقية (RAG Chat)** — فهرسة PDF/Word/PPT تلقائياً مع تجزئة ذكية، أجوبة موثقة برقم الصفحة، وكشف خارج النطاق.
2. **📑 الملخص والخريطة الذهنية** — 3 مستويات (سريع/متكامل/عميق)، SVG تفاعلي، تصدير Markdown، ودعم الوثائق الطويلة بالتقديم المرحلي (Chunked).
3. **🎯 استوديو الاختبارات** — MCQ ثنائي اللغة، تصحيح فوري، Flashcards، تنبؤ الدرجة.
4. **✍️ التدقيق الأكاديمي** — أخطاء إملائية/نحوية + Originality Score + إعادة صياغة.
5. **🌐 الترجمة الأكاديمية** — 3 أنماط (هدف فقط / صفحة بصفحة / سطر بسطر) + تصدير Word .docx + دعم الوثائق الطويلة بالتقديم المرحلي.
6. **📊 لوحة الطالب + لوحة الإدارة** — إدارة المستخدمين، الإحصائيات الحقيقية من `/api/admin/stats`، السجلات، إعدادات المنصة.
7. **👥 مساحة الفريق (Collaboration)** — جداول `teams` + `team_members`، مشاركة المستندات/العروض عبر عضوية الفريق، كود دعوة قصير للانضمام، ومقاييس الفرقة في لوحة الأدمن.
8. **🎨 Deck Studio** — مولّد عروض مع هوية بصرية مخصّصة: خلفيات `art` مصبوغة بألوان الهوية (`--art-tint`)، 11 تخطيطاً أكاديمياً + 10 تخطيطات داكنة (Agenda/Quote/Compare)، وقائمة خطوط بيضاء موحّدة (25 خطاً) عبر الواجهة والمكوّن.

---

## 🛠️ المعمارية
- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 + Lucide Icons — RTL داكن Glassmorphism
- **Backend:** Python 3.11 + FastAPI + Uvicorn — SQLite + RAG + Google Gemini / OpenAI-compatible (Ollama/DeepSeek/Groq)
- **معالجة المستندات:** PyMuPDF (fitz), python-docx, python-pptx, openpyxl

---

## ✅ المتطلبات
| الأداة | الإصدار |
|-------|---------|
| Python | 3.11+ |
| Node.js | 20+ (npm 10+) |
| Git | أي إصدار حديث |
| مفتاح Gemini (اختياري) | من [aistudio.google.com](https://aistudio.google.com/app/apikey) |

> بدون مفتاح Gemini يعمل التطبيق في وضع محلي تجريبي، ومع المفتاح تعمل كل ميزات الذكاء.

---

## 📥 التحميل والتنصيب

### 1. استنساخ المستودع
```bash
git clone https://github.com/EngAlaaJahaf/ai-platform-edu.git
cd ai-platform-edu
```

### 2. إعداد الباك إند (Backend)
```bash
# إنشاء بيئة افتراضية (مستحسن)
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# تثبيت المكتبات
pip install fastapi uvicorn python-dotenv python-multipart
pip install openai httpx google-genai
pip install pymupdf python-docx python-pptx openpyxl pdfplumber

# أو إن وجد ملف requirements (بعد إضافته):
pip install -r backend/requirements.txt
```

### 3. إعداد الفرونت إند (Frontend)
```bash
cd frontend
npm install
cd ..
```

---

## 🔐 إعداد متغيرات البيئة

انسخ القالب وعبئ بياناتك:
```bash
copy backend\.env.example backend\.env   # Windows
# أو
cp backend/.env.example backend/.env     # macOS/Linux
```

افتح `backend/.env` وعدّل:
```env
GEMINI_API_KEY=AIza...your_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=8001
ADMIN_MASTER_KEY=sk_admin_your_secure_random_32chars
ADMIN_INITIAL_PASSWORD=AdminEduAI2026!
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

| المتغير | الوصف | افتراضي |
|--------|-------|---------|
| `GEMINI_API_KEY` | مفتاح Google Gemini | فارغ (وضع محلي) |
| `GEMINI_MODEL` | النموذج الافتراضي | `gemini-1.5-flash` |
| `PORT` | منفذ الباك إند | `8001` |
| `ADMIN_MASTER_KEY` | مفتاح المدير الرئيسي | فارغ |
| `ADMIN_INITIAL_PASSWORD` | كلمة مدير أولية (مجزأة تلقائياً) | `AdminEduAI2026!` |
| `ALLOWED_ORIGINS` | عناوين CORS المسموحة | `localhost:5173,3000` |

---

## ▶️ التشغيل

### الطريقة السريعة — بنقرة واحدة (Windows)
```bash
run_dev.bat
```
يفتح نافذتين: Backend على `8001` و Frontend على `5173`.

### يدوياً — نافذتان منفصلتان

**نافذة 1 — الباك إند:**
```bash
# من جذر المشروع
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```

**نافذة 2 — الفرونت إند:**
```bash
cd frontend
npm run dev
```

افتح المتصفح: **http://localhost:5173**  
توثيق الـ API: **http://localhost:8001/docs**

### بناء للإنتاج
```bash
cd frontend
npm run build
npm run preview  # معاينة الإنتاج على 4173
```

---

## 🐳 النشر عبر Docker

حزمة نشر كاملة (الحاوية الخلفية + الواجهة + عكس وكيل nginx) جاهزة:

```bash
# 1) إعداد المتغيرات
cp .env.example .env

# 2) بناء الصور وتشغيل المكدس
docker compose up -d --build
```

- **الواجهة:** `http://localhost` (nginx يقدم SPA + يمرر `/api/` إلى الخلفية على `8001`).
- **البيانات محفوظة** في مجلدات مسمّاة: `eduai_db`, `eduai_uploads`, `eduai_presentations`, `eduai_art`.
- متغيرات إضافية اختيارية: `BACKEND_PORT=8001`, `FRONTEND_PORT=80`.

> الملاحظات: قاعدة البيانات تُقتطع عند `/data/eduai.db` داخل الحاوية عبر `EDUAI_DB_PATH` (افتراضياً `backend/eduai.db` محلياً). توليد العروض PPTX داخل الحاوية يحتاج Chromium — على جهازك المحلي يستخدم `presentation_engine` مسار Chrome المثبّت؛ داخل Docker يُنصح برسم PNG/HTML أو تثبيت chromium في الصورة.

---

## 📚 توثيق الـ API
بعد تشغيل الباك إند:
- Swagger: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`
- الصحة: `GET /api/health`

أمثلة:
```bash
# فحص المفتاح
curl -X POST http://localhost:8001/api/validate-key -H "Content-Type: application/json" -d '{"provider":"gemini","api_key":"AIza..."}'

# رفع مستند
curl -X POST http://localhost:8001/api/upload -F "file=@lecture.pdf" -H "X-User-Id: usr_xxx"
```

---

## 📁 هيكل المشروع
```
ai-platform-edu/
├── backend/
│   ├── main.py              # FastAPI + CORS
│   ├── config.py            # متغيرات البيئة
│   ├── database.py          # SQLite + تجزئة كلمات المرور + مقاييس الأدمن
│   ├── routes/api.py        # كل endpoints (محمي /admin/*) + /api/teams/*
│   ├── services/
│   │   ├── ai_service.py    # Gemini/OpenAI + RAG + ترجمة/تلخيص Chunked
│   │   ├── rag_service.py
│   │   ├── document_service.py
│   │   ├── presentation_service.py  # Deck Studio القوالب والهويات
│   │   └── quiz_formatter.py
│   ├── presentation_engine/  # محرك العروض (HTML ← Chrome headless ← PPTX/PDF/PNG)
│   ├── uploads/             # ملفات مرفوعة (مستبعدة من Git)
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── admin/AdminSidebar.jsx
│   │   │   ├── PresentationView.jsx
│   │   │   ├── TemplateModal.jsx
│   │   │   └── StudentAnalytics.jsx
│   │   └── services/api.js  # API_BASE='/api' + X-User-Id header
│   ├── Dockerfile
│   ├── nginx.conf           # SPA fallback + proxy /api
│   └── README.md
├── docker-compose.yml       # backend + frontend + nginx + volumes
├── .env.example
├── .github/workflows/
│   ├── ci.yml
│   └── auto-review.yml
├── run_dev.bat
├── ROADMAP.md
└── README.md
```

---

## 🔒 الأمان
- كلمات المرور مجزأة `pbkdf2_sha256$150000$...` (`backend/database.py:12`) + ترحيل تلقائي للقديم.
- كل `/api/admin/*` محمي بـ `X-User-Id` + `role==admin` (`backend/routes/api.py:60`) — بدونها `401/403`.
- CORS مقيّد عبر `ALLOWED_ORIGINS` (`backend/main.py:18`) بدل `*`.
- المفاتيح لا تُرفع: `.gitignore` يستبعد `*.db`, `__pycache__`, `uploads/*`.

غيّر `ADMIN_INITIAL_PASSWORD` و `ADMIN_MASTER_KEY` فور التنصيب!

---

## 🤝 المساهمة
راجع `CONTRIBUTING.md` — الفروع `feature/*` → PR → مراجعة تلقائية + موافقة مالك.

---

## 📄 الترخيص
MIT

© 2026 ذكاء | EduAI
