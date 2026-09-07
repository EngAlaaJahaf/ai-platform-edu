---
name: eduai-phase1-quality
description: Excute Phase 1 of the EduAI ROADMAP (jouda al-akwad / quality & engineering). Use when the user asks to work on quality, testing, اختبارات, pytest, vitest, lint, ruff, oxlint, CI workflows, dead code cleanup, ErrorBoundary, DB migrations, or any task under المسار 1 (جودة الأكواد والبنية). Triggers include "أضف اختبارات", "نظّم الاختبارات", "شغّل CI", "نظّف الكود الميت", "هاجر قاعدة البيانات بأمان", "اكتب assert tests للـ API", "Fix the CI", "add pytest/vitest". Stage the whole phase per ROADMAP.md tasks T1.1–T1.9.
---

# Phase 1 — جودة الأكواد والبنية (Quality & Engineering)

المسؤول: عضو المسار 1. الهدف: أرضية آمنة للعمل الجماعي (اختبارات، lint، صيانة). كل مهمة من `ROADMAP.md` تحمل رقم `T1.x`. لا تعمل على مهام مسارات أخرى إلا بالتنسيق المعلن.

## أولاً: اقرأ السياق
- `ROADMAP.md` → القسم 3، المسار 1، والمهام `T1.1`–`T1.9` + جدول أولويات الأسابيع (القسم 5).
- `README.md` لفهم طريقة التشغيل الحالية (`run_dev.bat`).
- بنية الدليل: `backend/routes/api.py`, `backend/services/*.py`, `backend/database.py`, `backend/presentation_engine/*.py`, `frontend/src/components/*.jsx`, `frontend/src/services/api.js`.

## الحقائق المعمارية المهمة
- لا يوجد أي اختبار اليوم (لا `pytest` ولا `vitest`) ولا CI (لا `.github/workflows`).
- `backend/requirements.txt` لا يحوي `pytest`/`httpx` (لكن `httpx==0.28.1` موجود للاستخدام).
- أوامر الحالة الحالية: `npm run build` = `vite build`؛ `npm run lint` = `oxlint` (لا vitest بعد).
- الترقية الحالية لقاعدة البيانات تتم عبر try/except ALTER في `backend/database.py` (تُستبدل بجداول ترحيل).
- الملفات الميتة المعروفة: `backend/services/pdf_service.py`, `frontend/src/components/AdminDashboardModal.jsx`, `frontend/src/components/DocumentLibraryModal.jsx`, `frontend/src/components/DocumentFAB.jsx` + تبقّيات CSS في `App.css` — تحقق من عدم الاستيراد قبل الحذف.
- CI يجب ألا يبتلع الأخطاء: حالياً أي أمر CI يستخدم `|| true` يُفشل الهدف — أزل هذا النمط.

## طريقة التنفيذ لكل مهمة

### T1.1 اختبارات الـ API (الأولوية القصوى)
- أضف للخلف `pytest` و`httpx` إلى `backend/requirements.txt` (قسم dev بحرص) وملف `backend/pytest.ini` أو `pyproject.toml` (`[tool.pytest.ini_options] testpaths=["tests"]`).
- أنشئ `backend/tests/` مع:
  - `conftest.py` يوفر عزل قاعدة بيانات (اختبار مؤقت أو DB منفصلة عبر متغيّر بيئة) وعميل `httpx.TestClient` على `backend.main.app` + هزيلة streaming للذكاء.
  - `test_auth.py`, `test_documents.py`, `test_presentations.py`, `test_templates.py`, `test_admin.py`.
- المعيار: تغطية ≥ 80% لواجهات الحفظ/العرض/الحذف الرئيسية. شغّل `python -m pytest backend/tests -v`. اختبار دخول مزوّر (X-User-Id عشوائي) يجب أن يرجع 401 — سيقرّب هذا لاحقاً من ملاحظات المسار 2.

### T1.2 اختبارات الخدمات
- `backend/tests/test_services.py` لـ: `ai_service` (تعقيم المخرجات/هندسة الانهيار)، `rag_service`، `presentation_service` (normalize_deck و resolve_theme/الهوية)، `pptx_theme_extractor`، `auth_service`.

### T1.3 اختبارات الواجهة الأمامية
- أضف `vitest` + `@testing-library/react` + `jsdom` إلى `frontend/package.json`، مع سكريبت `"test": "vitest run"`.
- أنشئ `frontend/src/components/__tests__/` لـ `PresentationView`, `TemplateModal`, `QuizView` (تعامل مع مكونات المكتبات بـ mock عند الحاجة).

### T1.4 تفعيل ruff خلفاً
- أضف `ruff` لـ `requirements.txt` + إعداد `pyproject.toml` (خطوط 100–120، exclude `backend/presentations`, `backend/uploads`).
- شغّل `ruff check backend` ثم `ruff format --check backend` كأساس مرجعي في CI.

### T1.5 تشديد oxlint أماماً
- فعّل قواعد إضافية عبر `oxlint.json`. ضع قياس الحالة الحالية `oxlint -f json` (إن تيسّر) وبيّن الزيادة. لا إجبار على صفر أخطاء دفعة واحدة — اقترح تقسيماً مرحلياً مرفقاً.

### T1.6 تنظيف الكود الميت
- قارن `grep` مسارات الاستيراد للملفات الميتة أولاً (`backend/services/pdf_service.py`, المكونات أعلاه)؛ احذف المؤكد فقط + تبقّياتها في `App.jsx` و`index.css`/`App.css`.
- سجل في الـ PR أي مكوّن حُذف مع سبب.

### T1.7 ErrorBoundary + حالات تحميل/فارغة
- أضف فئة `ErrorBoundary` عامة في `frontend/src/` ولفّ الأقسام الرئيسية (`App.jsx`).
- أكمل حالات تحميل/فارغة الناقصة في `DashboardView`, `ChatView` (empty-state), `DocumentLibraryView`.

### T1.8 ترحيلات DB آمنة
- أنشئ جدول `schema_migrations` في `backend/database.py` + دالة `migrate()` تدير الترحيلات بأرقام إصدار بدل try/except. رحّل **القالب الحالي** (ALTER الحالي) إلى أول ترحيل. حافظ على التشغيل القديم للأخذ بالاعتبار.

### T1.9 CI كاملة
- أنشئ `.github/workflows/ci.yml`: jobs خلفية (install → pytest → ruff) وأمامية (npm ci → oxlint → vitest → build). بدون `|| true`. أضف `coverage` مع تقرير، وشارة حالة في `README.md`.

## أوامر تحقق سريعة
- خلف: `python -m pytest backend/tests -v` ثم `ruff check backend`.
- أمام: `cd frontend && npm test && npm run lint && npm run build`.
- من المستودع: `py -3 -m` مكان `python` إذا فشل path على ويندوز.

## معايير القبول النهائية للمسار
- وجود `backend/tests/` + `frontend/src/components/__tests__/` يعملان محلياً.
- CI أخضر فعلياً على `main` مع تشغيل حقيقي للاختبارات (لا `|| true`).
- لا ملفات ميتة في القائمة المذكورة، و`App.jsx` يعمل بعد التنظيف.
- `schema_migrations` يحفظ حالة الترقية ويطبق ترحيلاً جديداً تجريبياً بدوره.