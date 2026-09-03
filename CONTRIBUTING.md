# المساهمة في EduAI

## 1. استراتيجية الفروع (GitHub Flow)
- `main` محمي - لا تدفع عليه مباشرة
- لكل مهمة فرع جديد:
```bash
git checkout main && git pull origin main
git checkout -b feature/اسم-الميزة      # أو fix/اسم-الإصلاح
# ... عمل ...
git push origin feature/اسم-الميزة
```
ثم افتح Pull Request على GitHub.

## 2. تسمية الفروع
- `feature/quiz-timer` - ميزة جديدة
- `fix/rag-chunk-error` - إصلاح
- `docs/readme-update` - توثيق

## 3. تجنب التعارضات
- `commit` صغير ومتكرر
- `git pull --rebase origin main` يومياً (أو قبل كل PR)
- لا تعدل نفس السطر الذي يعمل عليه زميلك - نسق عبر Issues

## 4. المراجعة
- كل PR يحتاج موافقة واحدة على الأقل (CODEOWNERS يحدد المراجع تلقائياً)
- الـ CI يجب أن ينجح قبل الدمج

## 5. الرسائل
```bash
git commit -m "feat: add quiz timer"
git commit -m "fix: handle empty PDF chunks"
```
