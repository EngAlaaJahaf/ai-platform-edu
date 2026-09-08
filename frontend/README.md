# واجهة EduAI — Frontend (React 19 + Vite)

الواجهة الأمامية لمنصة ذكاء | EduAI — نسخة عربية RTL داكنة (Glassmorphism) مبنية بـ React 19 + Vite 8 + Tailwind CSS v4.

## المتطلبات
- Node.js 20+ (npm 10+)

## التشغيل محلياً
```bash
npm install
npm run dev        # Vite dev على http://localhost:5173 مع proxy إلى http://127.0.0.1:8001
```

## الأوامر
| الأمر | الوصف |
|-------|-------|
| `npm run dev` | خادم تطوير Vite (port 5173) مع وكيل `/api` إلى الباك إند |
| `npm run build` | بناء إنتاج + PWA (vite-plugin-pwa) إلى `dist/` |
| `npm run preview` | معاينة ناتج الإنتاج (port 4173) |
| `npm run lint` | فحص أوكس (oxlint) |

## التكامل مع الباك إند
- كل الاستدعاءات تذهب إلى `/api` (نفس الأصل) عبر `src/services/api.js`.
- في التطوير يُوكَّل `/api` إلى `http://127.0.0.1:8001` (إعداد `vite.config.js`).
- في الإنتاج يعكس nginx `/api/` إلى الحاوية الخلفية — راجع `nginx.conf`.

## المكونات الرئيسية
- `components/admin/AdminSidebar.jsx` — لوحة الأدمن (مقاييس حقيقية من `/api/admin/stats` بما فيها مقاييس الفرق).
- `components/PresentationView.jsx` + `TemplateModal.jsx` — Deck Studio (هويات بصرية، قائمة خطوط بيضاء، تخطيطات Agenda/Quote/Compare).
- `components/StudentAnalytics.jsx` — تحليلات الطالب من `progress_json` لكل مستند.
- `services/api.js` — عميل API مركزي (مصادقة، مستندات، فرق، عروض، إدارة).

## البناء داخل Docker
راجع `Dockerfile` في هذا المجلد — بناء متعدد المراحل (node → nginx) ويستخدم `npm ci` مع `package-lock.json`.