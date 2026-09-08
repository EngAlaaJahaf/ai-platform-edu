import React, { useState } from 'react';
import {
  Sparkles,
  History,
  FileInput,
  X,
  Play,
  HelpCircle,
  BookOpen,
  Wand2,
  Languages,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const toAr = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

const STEPS = [
  { num: '١', label: 'الوضع واللغة' },
  { num: '٢', label: 'الصعوبة والعدد' },
  { num: '٣', label: 'المصدر' }
];

const MODES = [
  { id: 'mcq', title: 'اختيار من متعدد', sub: 'سؤال مع 4 خيارات — تقييم تلقائي لحظي', ic: HelpCircle },
  { id: 'flashcard', title: 'بطاقات فحص', sub: 'إجابات قصيرة للتحقق السريع من الحفظ', ic: BookOpen }
];

const LANGS = [
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'الإنجليزية' },
  { id: 'bilingual', label: 'خليط' }
];

const DIFFS = [
  { id: 'easy', label: 'سهل' },
  { id: 'medium', label: 'متوسط' },
  { id: 'hard', label: 'صعب' }
];

const COUNTS = [5, 10, 15, 20];

export default function QWizard({
  mode,
  setMode,
  language,
  setLanguage,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  activeDoc,
  activePrompt,
  onOpenPromptManager,
  onHistory,
  historyCount,
  onOpenImport,
  showReturnToQuiz,
  onReturnToQuiz,
  showResumeLast,
  onResumeLast,
  onGenerate,
  onExtract
}) {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      <div className="card card-pad space-y-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>استوديو توليد بنك الأسئلة الأكاديمي المتقدم</span>
            </div>
            <h2 className="text-2xl font-black theme-text-primary">توليد أسئلة MCQ وبطاقات استذكار</h2>
            <p className="text-xs theme-text-secondary">
              المستند الحالي: <b className="theme-text-primary">{activeDoc?.filename}</b> ({activeDoc?.pages_count} صفخة • {activeDoc?.words_count || 0} كلمة)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showResumeLast && (
              <button
                onClick={onResumeLast}
                className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center gap-1.5 font-['Tajawal']"
                title="الرجوع للاختبارات المحفوظة"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>الرجوع للاختبارات</span>
              </button>
            )}
            {showReturnToQuiz && (
              <button
                onClick={onReturnToQuiz}
                className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-emerald-400 hover:border-emerald-400/50 transition flex items-center gap-1.5 font-['Tajawal'] shadow-sm"
                title="الرجوع للاختبار الحالي"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>الرجوع للاختبار</span>
              </button>
            )}
            {historyCount > 0 && (
              <button
                onClick={onHistory}
                className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center gap-1.5 font-['Tajawal']"
                title="سجل الاختبارات والمحاولات السابقة"
              >
                <History className="w-3.5 h-3.5" />
                <span>الاختبارات المحفوظة ({toAr(historyCount)})</span>
              </button>
            )}
            <button
              onClick={onOpenImport}
              className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-teal-500 hover:border-teal-400 transition flex items-center gap-1.5 font-['Tajawal']"
              title="استيراد بنك أسئلة نصي جاهز"
            >
              <FileInput className="w-3.5 h-3.5" />
              <span>استيراد أسئلة جاهزة</span>
            </button>
          </div>
        </div>

        {/* Wizard Stepper */}
        <div className="wizard">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.num}>
              {idx > 0 && <div className="wz-line"></div>}
              <button
                type="button"
                onClick={() => { if (step > idx) setStep(idx + 1); }}
                className={`wz-step ${step === idx + 1 ? 'on' : step > idx + 1 ? 'done' : ''} ${step > idx + 1 ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ background: 'none', padding: 0, textAlign: 'inherit' }}
              >
                <span className="wz-num">{s.num}</span>
                <span className="wz-label">{s.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Mode & Language */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="lbl">الوضع — اختر نوع الأسئلة</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODES.map((m) => {
                  const Ic = m.ic;
                  const sel = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`radio-card ${sel ? 'sel' : ''}`}
                    >
                      <span className="r-ic"><Ic className="w-5 h-5" /></span>
                      <div>
                        <div className="r-title">{m.title}</div>
                        <div className="r-sub">{m.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="lbl">لغة الأسئلة</span>
              <div className="flex gap-2 flex-wrap">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLanguage(l.id)}
                    className={`pill ${language === l.id ? 'sel' : ''}`}
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 flex-wrap pt-2 border-t">
              <span className="text-[13px] theme-text-muted">ستنتقل إلى خطوة الصعوبة والعدد بعد الاختيار</span>
              <button type="button" onClick={() => setStep(2)} className="btn btn-primary">
                <span>متابعة</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Difficulty & Count */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="lbl">مستوى الصعوبة الأكاديمية</span>
              <div className="flex gap-2 flex-wrap">
                {DIFFS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`pill ${difficulty === d.id ? 'sel' : ''}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="lbl">عدد الأسئلة المطلوب</span>
              <div className="flex gap-2 flex-wrap">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuestionCount(c)}
                    className={`pill font-mono ${questionCount === c ? 'sel' : ''}`}
                  >
                    {toAr(c)} أسئلة
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center gap-3 pt-2 border-t">
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost">
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-primary">
                <span>متابعة</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Source & Generate */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="lbl">المصدر</span>
              <div className="p-3.5 rounded-2xl theme-card-inner flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <b className="text-xs font-black theme-text-primary block font-['Tajawal']">{activeDoc?.filename}</b>
                    <span className="text-[11px] theme-text-muted">{activeDoc?.pages_count} صفخة • {activeDoc?.words_count || 0} كلمة</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl theme-card-inner flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <Wand2 className="w-4 h-4 text-teal-400" />
                <span className="theme-text-muted">قالب البرومبت:</span>
                <span className="font-bold theme-text-primary">{activePrompt?.title || 'الافتراضي المعتمد'}</span>
              </div>
              <button type="button" onClick={onOpenPromptManager} className="text-xs font-bold text-emerald-500 hover:underline">
                اختيار قالب آخر
              </button>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={onGenerate}
                className="btn btn-primary w-full py-3.5"
              >
                <Play className="w-4 h-4 fill-white text-white" />
                <span>بدء توليد بنك الأسئلة الأكاديمي الآن</span>
              </button>
              <button
                type="button"
                onClick={onExtract}
                className="btn btn-ghost w-full"
              >
                <FileInput className="w-4 h-4" />
                <span>استخراج الأسئلة الجاهزة من الملف (بدون تأليف)</span>
              </button>
              <div className="flex justify-center pt-1">
                <button type="button" onClick={() => setStep(2)} className="btn btn-ghost">
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}