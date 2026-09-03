import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  File, 
  Printer, 
  Check, 
  Layers, 
  Sparkles,
  BookOpen,
  CheckCircle2,
  ListChecks,
  Languages,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Scale,
  Calculator,
  Compass,
  Network
} from 'lucide-react';
import { 
  exportSummaryDocument, 
  exportQuizDocument,
  exportProofreadDocument,
  exportChatDocument,
  exportTranslateDocument
} from '../services/exportService';

export default function ExportModal({ 
  isOpen, 
  onClose, 
  type = 'summary', // 'summary', 'quiz', 'proofread', 'chat', 'translate'
  data = null, 
  docName = '', 
  currentTab = 'all',
  extraData = null,
  quizSettings = null
}) {
  const [scope, setScope] = useState(currentTab || 'all');
  const [format, setFormat] = useState('pdf'); // 'pdf', 'html', 'md', 'txt'
  const [exporting, setExporting] = useState(false);

  if (!isOpen || !data) return null;

  // Granular section options per tool type
  const scopeOptionsByType = {
    summary: [
      { id: 'all', label: 'كامل الملخص الأكاديمي الشامل', desc: 'تصدير كامل الأقسام، الجداول، المحاور، والمصائد معاً', icon: BookOpen, badge: 'شامل 📚' },
      { id: 'mindmap', label: 'الخريطة الذهنية والشجرية فقط', desc: 'تصدير هيكل الشجرة والمحاور والمفاهيم المتفرعة', icon: Network, badge: 'خريطة ذهنية 🌳' },
      { id: 'overview', label: 'النظرة العامة الجوهرية فقط', desc: 'ملخص الفكرة المركزية للمستند', icon: Compass, badge: 'ملخص سريع' },
      { id: 'pillars', label: 'المحاور والمفاهيم الأساسية فقط', desc: 'تفصيل محاور المحاضرة مع النقاط الفرعية', icon: Layers, badge: 'المحاور' },
      { id: 'comparisons', label: 'جداول المقارنة الأكاديمية فقط', desc: 'مقارنات منظمة في جداول ثنائية الفوارق', icon: Scale, badge: 'مقارنات' },
      { id: 'traps', label: 'مصائد وأفخاخ الامتحانات فقط', desc: 'الأخطاء الشائعة والتصويب العلمي الدقيق', icon: AlertTriangle, badge: 'مصائد' },
      { id: 'rules', label: 'القوانين والمعادلات فقط', desc: 'المعادلات والقواعد والخوارزميات', icon: Calculator, badge: 'معادلات' },
      { id: 'definitions', label: 'قاموس المصطلحات والمفاهيم فقط', desc: 'شرح المصطلحات العلمية وسياقها', icon: FileText, badge: 'مصطلحات' }
    ],
    quiz: [
      { id: 'all', label: 'كامل بنك الأسئلة والبطاقات', desc: 'تصدير كافة أسئلة MCQ والبطاقات والنصائح', icon: ListChecks, badge: 'شامل 📚' },
      { id: 'mcq', label: 'أسئلة الاختيار من متعدد (MCQ) فقط', desc: 'الأسئلة مع الخيارات والشرح وتحديد الإجابة الصحيحة', icon: CheckCircle2, badge: 'MCQ فقط' },
      { id: 'flashcards', label: 'بطاقات الاستذكار (Flashcards) فقط', desc: 'بطاقات المراجعة السريعة على هيئة جدول مفاهيم', icon: Sparkles, badge: 'بطاقات' },
      { id: 'tips', label: 'نصائح وتوجيهات التفوق فقط', desc: 'إرشادات الأستاذ لحل الامتحان بدقة', icon: HelpCircle, badge: 'نصائح' }
    ],
    translate: [
      { id: 'all', label: 'كامل ملف الترجمة الأكاديمي', desc: 'تصدير كامل الترجمة بكافة تفاصيلها', icon: Languages, badge: 'شامل 📚' },
      { id: 'line_by_line', label: 'الترجمة السطرية الموازية (تحت كل سطر)', desc: 'وضع الترجمة مباشرة تحت كل فقرة إنجليزية', icon: Layers, badge: 'سطر بسطر' },
      { id: 'page_by_page', label: 'الترجمة صفحة بصفحة (Parallel)', desc: 'عرض الصفحات الأصلية والمترجمة في جداول متوازية', icon: FileText, badge: 'صفحات' },
      { id: 'target_only', label: 'النص المترجم فقط (باللغة العربية)', desc: 'نص مترجم بالكامل للغة الهدف دون تكرار النص الأصلي', icon: BookOpen, badge: 'عربي فقط' }
    ],
    proofread: [
      { id: 'all', label: 'كامل تقرير التدقيق والأصالة', desc: 'المؤشرات، قائمة الأخطاء والتصويبات، والنص المصاغ', icon: CheckCircle2, badge: 'شامل 📚' },
      { id: 'issues', label: 'قائمة الأخطاء والتصويبات فقط', desc: 'جدول تفصيلي بالأخطاء النحوية والتصحيح المقترح', icon: AlertTriangle, badge: 'أخطاء' },
      { id: 'paraphrased', label: 'النص المعاد صياغته فقط', desc: 'النص المحسن والمنقح أكاديمياً', icon: Sparkles, badge: 'النص المصاغ' },
      { id: 'original', label: 'النص الأصلي فقط', desc: 'المستند الأصلي قبل التدقيق', icon: FileText, badge: 'الأصلي' }
    ],
    chat: [
      { id: 'all', label: 'كامل سجل الحوار والمناقشة', desc: 'تصدير جلسة المحادثة الذكية كاملة مع الطوابع الزمنية', icon: MessageSquare, badge: 'سجل كامل' }
    ]
  };

  const currentScopeOptions = scopeOptionsByType[type] || scopeOptionsByType.summary;

  const formats = [
    {
      id: 'pdf',
      name: 'مستند PDF أكاديمي (جاهز للطباعة والحفظ)',
      desc: 'تنسيق أكاديمي كلاسيكي بخلفية بيضاء مع فهرس محتويات clickable وترقيم منظم',
      icon: Printer,
      badge: 'موصى به للطباعة 🌟',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
    },
    {
      id: 'html',
      name: 'صفحة ويب تفاعلية مستقلة (HTML)',
      desc: 'ملف ويب متكامل بتنسيق أكاديمي أنيق يعمل دون إنترنت مع خطوط مدمجة وفهرس تنقل',
      icon: FileCode,
      badge: 'تفاعلي 🌐',
      badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
    },
    {
      id: 'md',
      name: 'ملف ماركداون (Markdown .md)',
      desc: 'مناسب لبرامج تدوين الملاحظات مثل Obsidian و Notion مع جداول منسقة',
      icon: FileText,
      badge: 'للملاحظات 📝',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'txt',
      name: 'ملف نصي عادي (.txt)',
      desc: 'نص مجرد خفيف وسريع متوافق مع كافة الأجهزة والمحررات',
      icon: File,
      badge: 'نص بسيط 📋',
      badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30'
    }
  ];

  const handleExecuteExport = () => {
    setExporting(true);
    try {
      if (type === 'summary') {
        exportSummaryDocument({
          summaryData: data,
          docName,
          scope,
          format
        });
      } else if (type === 'quiz') {
        exportQuizDocument({
          quizData: data,
          docName,
          scope,
          format,
          settings: quizSettings
        });
      } else if (type === 'translate') {
        exportTranslateDocument({
          translateData: data,
          docName,
          scope,
          format
        });
      } else if (type === 'proofread') {
        exportProofreadDocument({
          proofreadData: data,
          inputText: extraData,
          docName,
          format
        });
      } else if (type === 'chat') {
        exportChatDocument({
          messages: data,
          docName,
          format
        });
      }
      onClose();
    } catch (e) {
      alert(`حدث خطأ أثناء التصدير: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black theme-text-primary">استوديو التصدير والطباعة الأكاديمية</h3>
            <p className="text-xs theme-text-secondary">
              تصدير المحتوى بتنسيق أبيض منظم مع فهرس محتويات تفاعلي وتحديد دقيق للأقسام
            </p>
          </div>
        </div>

        {/* 1. Scope Selection (Granular Selection of Elements) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black theme-text-primary block">
              1. حدد القسم أو العنصر المطلوب تصديره بدقة:
            </label>
            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {currentScopeOptions.find(o => o.id === scope)?.label || 'محدد'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {currentScopeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = scope === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setScope(opt.id)}
                  className={`p-3 rounded-2xl border text-right transition flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                      : 'theme-card-inner border hover:border-indigo-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-cyan-500 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-cyan-400'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <b className={`text-xs font-black block truncate ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'theme-text-primary'}`}>
                        {opt.label}
                      </b>
                      <span className="text-[10px] theme-text-muted block truncate mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-black theme-text-primary block">
            2. اختر صيغة الملف المناسبة:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formats.map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'theme-card-inner border hover:border-indigo-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 theme-text-secondary'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <b className={`text-xs font-black ${isSelected ? 'text-indigo-700 dark:text-cyan-300' : 'theme-text-primary'}`}>
                          {f.name.split('(')[0]}
                        </b>
                      </div>
                      <span className="text-[10px] theme-text-muted block mt-0.5">
                        {f.badge}
                      </span>
                    </div>
                  </div>

                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
          >
            رجوع / إلغاء
          </button>

          <button
            onClick={handleExecuteExport}
            disabled={exporting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 border border-white/20"
          >
            <Download className="w-4 h-4" />
            <span>تصدير {currentScopeOptions.find(o => o.id === scope)?.badge || 'الملف'} الآن</span>
          </button>
        </div>

      </div>
    </div>
  );
}
