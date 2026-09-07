---
name: eduai-phase3-collaboration
description: Execute Phase 3 of the EduAI ROADMAP (altaawun wa alnashr wa almizat / collaboration, deployment & features). Use when the user asks about teams, shared workspaces, sharing documents or presentations between members, مساحة فريق، مشاركة، كود دعوة، teammate collaboration, Docker, deployment, nginx, نشر الإنتاج, Deck Studio improvements, background art colors per identity, خلفيات العروض, analytics dashboards, real stats, or any task under المسار 3. Triggers include "شارك مستند مع زميل", "بناء فرق", "anazel النشر", "package with Docker", "صبغ خلفيات art"، "إحصائيات حقيقية", "فريق". Stage the whole phase per ROADMAP.md tasks T3.1–T3.6.
---

# Phase 3 — التعاون والنشر والميزات (Collaboration, Deployment & Features)

المسؤول: عضو المسار 3. الهدف: تمكين الزملاء من العمل على المحتوى المشترك + حزمة نشر إنتاجية + إثراء Deck Studio والتحليلات. كل مهمة من `ROADMAP.md` تحمل رقم `T3.x`. لا تعمل على مهام مسارات أخرى إلا بالتنسيق المعلن.

## أولاً: اقرأ السياق
- `ROADMAP.md` → القسم 3، المسار 3، المهام `T3.1`–`T3.6` + القسم 4 (سير العمل) والقسم 5 (الأسابيع).
- ملفات رئيسية: `backend/database.py` (المخطط والجداول — أضف جداول/دوال الفرق)، `backend/routes/api.py` (أضف `/api/teams/*`)، `frontend/src/components/DashboardView.jsx`, `DocumentLibraryView.jsx`, `PresentationView.jsx`.
- محرك العروض: `backend/presentation_engine/engine.py` + `artgen.py` (توليد خلفيات art) — المهمة T3.2 تلمس `artgen.py` فقط غالباً.
- النشر: لا يوجد `Dockerfile`/`docker-compose`/nginx حتى الآن؛ التشغيل عبر `run_dev.bat` (uvicorn 127.0.0.1:8001 + Vite :5173).

## طريقة التنفيذ لكل مهمة

### T3.1 مساحة فريق (الأولوية القصوى كميزة)
- في `backend/database.py`: جداول جديدة
  - `teams(id, name, owner_id, invite_code, created_at)`
  - `team_members(team_id, user_id, role['owner'|'admin'|'editor'|'viewer'], joined_at)`
  - وأعطِ `documents` و`presentations` ربط `team_id` اختياري (أو جدول ربط `team_shares(entity_type, entity_id, team_id)`).
  - دوال: create_team, join_team_by_code, add_member, remove_member, get_shared_for_user(user_id) (لنشرitary الخاص والعام للفريق).
- في `backend/routes/api.py`: `POST /api/teams`, `POST /api/teams/join` (invite_code), `GET /api/teams`, `POST /api/teams/{team_id}/shares` (مشاركة مستند/عرض), `DELETE /api/teams/{team_id}/members/{user_id}`.
- في الواجهة: شريط/لوحة فرق في `DashboardView` أو `DocumentLibraryView` + واجهة مشاركة في `PresentationView` مع فرض الأدوار (viewer لا يعدّل).
- معيار القبول: حسابان مختلفان، أحدهما ينشئ فريقاً ويرسل `invite_code`، والآخر ينضم → يرى نفس المستند/العرض ويُرفض تعديل حصراً حسب الدور.

### T3.2 تحسينات Deck Studio
- **صبغ خلفيات art بالهوية**: في `backend/presentation_engine/artgen.py` خوارزمية `generate_background()` تنتج خلفيات بألوان ثابتة — مرّر ألوان الهوية الحالية (من dict `deck['theme']`) بدلاً من اللوحة الثابتة واحتفظ بتدرج لطيف (استخدم الـ `--art-tint` الموجود في `engine.py`).
  - تحقق بصري: رنِّر شريحة واحدة بكل هوية (academic/dark-tech/mimported) وتأكد أن الخلفية تتغير مع `--art-tint`.
- **تخطيطات وأنماط إضافية**: أضف نماذج تخطيط صفحات (تغطية/قائمة/محتوى/خاتمة) إن كانت محدودة اليوم وحافظ على التوافق مع النظام الحالي للموضوعات والتنسيق.
- **خطوط أوسع + تحميل**: فعّل قائمة `fonts` مدعومة إضافية؛ اجعل اقتراح الخطوط في `generate_template_theme` يبدأ من القائمة المدعومة فقط.
- **رفع حد الترجمة/التلخيص**: حالياً نحو 8000 حرف unicode تقطع — نفّذ تقسيم وثائقي (chunk) مع تلخيص تدريجي وتوحيد وexplicit في `ai_service` (بالتنسيق مع المسار 1 إن سمعتها).

### T3.3 تحليلات حقيقية
- في `backend/routes/api.py` أنشئ `GET /api/admin/stats` يجمع من DB: عدد المستندات، الشرائح المولدة، أسابيع الجلسات، المستخدمين النشطون الأسبوعي، استهلاك التوكنز الإجمالي (التماسك `SUM(tokens_used)` موجود في `database.py:1100`) — بدلاً من الأرقام الثابتة في `frontend/src/components/AdminDashboardView.jsx`/`StudentAnalytics.jsx`.
- اربط الأرقام بالأنشطة الحقيقية (document_count, deck_count, slide_count, session_count).

### T3.4 حزمة نشر
- `Dockerfile` (backend) + `Dockerfile` (frontend build → nginx/alpine) أو compose متعدد مراحل:
  - `backend/Dockerfile` يعمل بـ `uvicorn backend.main:app --host 0.0.0.0 --port 8001`.
  - `frontend/Dockerfile` يبني `npm run build` ويقدّم عبر nginx مع reverse proxy `/api` → backend.
  - `docker-compose.yml` يربط الاثنين + حجم بيانات لـ `backend/data.db` والبورتفوليو.
- وثّق في `README.md` (أو ملف `DEPLOY.md`) خطوات التشغيل الإنتاجية + متغيرات البيئة.
- لا تغير `run_dev.bat` — خصّه للتطوير والتوثيق فقط.

### T3.5 توثيق التضمين
- حدِّث `README.md` بالهيكل الحالي (المجلدات والمكونات المهمة)، وأنشئ `CONTRIBUTING.md` بدءاً من فرع العمل والسير (قسم 4 من ROADMAP).
- تأكد من المراجع: `frontend/README.md` إن وُجد أو أضفه مع أوامر التشغيل.

### T3.6 اشتراكات (اختياري/مرحلة لاحقة)
- اربط فاتورة `SubscriptionView.jsx` بنظام اشتراكات فعلي أو آلية تجديد دورية للحصص؛ أضف `subscription_expires_at` إن لزم.

## أوامر تحقق سريعة
- خلف: `python -m py_compile backend/database.py backend/routes/api.py`.
- محرك العرض: استدعِ `render_deck` يدوياً عبر سكربت صغير يمرّر هُويةين مختلفتين ويحفظ PNGs للمتصفح (كما في الاختبارات المحلية السابقة `test_identity.pptx`).
- أمام: `cd frontend && npm run build`.
- تشغيل محلي للأمان عند التحقق: `cmd /c run_dev.bat` أو uvicorn مباشرة.

## معايير القبول النهائية للمسار
- مشاركة فريق شغّالة من طرفين (إنشاء/انضمام/مشاركة/أدوار) موثقة في PR.
- خلفيات `art` مرئياً تصبغ بهوية كل قالب؛ ولا يكسر الرندر للقوالب الحالية.
- `GET /api/admin/stats` يعيد أرقاماً حقيقية واللوحة تعرضها.
- حزمة Docker تبني وتشغّل الخدمتين؛ README محدّث.