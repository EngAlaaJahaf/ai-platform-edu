import React from 'react';
import { 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  BrainCircuit, 
  CheckCheck, 
  Upload, 
  Zap, 
  ArrowLeft,
  Presentation,
  BookMarked
} from 'lucide-react';
import StudentAnalytics from './StudentAnalytics';

export default function DashboardView({ 
  onSelectTab, 
  onOpenUpload 
}) {
  const quickActions = [
    {
      id: 'chat',
      title: 'محادثة ذكية RAG',
      desc: 'اسأل كتابك بالعربية ويجيبك برقم الصفحة مع منع الهلوسة',
      icon: MessageSquareText,
      gradient: 'from-emerald-600 to-emerald-700',
      badge: 'موثق بالمصادر',
      badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    },
    {
      id: 'summary',
      title: 'تلخيص + خريطة ذهنية',
      desc: 'تحويل 20 صفحة إلى 4 نقاط مفتاحية وخريطة تفاعلية',
      icon: FileText,
      gradient: 'from-teal-600 to-teal-700',
      badge: '3 مستويات',
      badgeColor: 'bg-teal-500/15 text-teal-500 border-teal-500/30'
    },
    {
      id: 'quiz',
      title: 'استوديو الاختبارات والتنبؤ',
      desc: 'توليد أسئلة MCQ وشروحات ثنائية وتنبؤ بالدرجة',
      icon: BrainCircuit,
      gradient: 'from-emerald-600 to-teal-700',
      badge: 'تنبؤ ذكي',
      badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    },
    {
      id: 'proofread',
      title: 'التدقيق والأصالة',
      desc: 'فحص نحوي وإملائي مع قياس نسبة التشابه وإعادة الصياغة',
      icon: CheckCheck,
      gradient: 'from-amber-600 to-orange-700',
      badge: 'أكاديمي',
      badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30'
    },
    {
      id: 'terms',
      title: 'المصطلحات الأكاديمية',
      desc: 'استخراج المصطلحات العلمية مع تعريفات وترجمات أكاديمية واختبار تفاعلي',
      icon: BookMarked,
      gradient: 'from-cyan-600 to-sky-700',
      badge: 'Interactive',
      badgeColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30'
    },
    {
      id: 'presentations',
      title: 'مولّد العروض التقديمية',
      desc: 'حوّل وصف مشروعك إلى عرض تقديمي احترافي (PPTX + PDF) بهوية بصرية عربية',
      icon: Presentation,
      gradient: 'from-violet-600 to-indigo-700',
      badge: 'AI Deck Studio',
      badgeColor: 'bg-violet-500/15 text-violet-500 border-violet-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>منصة المساعد الأكاديمي الذكي — الإصدار 2.1</span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-black leading-tight font-['IBM_Plex_Sans_Arabic'] theme-text-primary">
              ذكاؤك الأكاديمي... <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 bg-clip-text text-transparent">يتكلم العربية.</span>
            </h1>
            
            <p className="text-sm theme-text-secondary leading-relaxed font-['Tajawal']">
              منصة ذكاء اصطناعي تفهم كافة موادك التعليمية (Word, PowerPoint, PDF)، تلخصها، تجيب عن أسئلتها بدقة التوثيق، وتجهزك للاختبار النهائي بتنبؤات مدروسة.
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={onOpenUpload}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:scale-[1.02] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 border border-white/20 transition"
            >
              <Upload className="w-4 h-4 text-white" />
              <span className="text-white font-extrabold">رفع مادة تعليمية جديدة</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="stat p-4 text-center">
            <b className="v font-['JetBrains_Mono']">10,000+</b>
            <p className="t mt-0.5 font-bold">ملخص أكاديمي</p>
          </div>
          <div className="stat p-4 text-center">
            <b className="v text-teal-400 font-['JetBrains_Mono']">98%</b>
            <p className="t mt-0.5 font-bold">دقة RAG بالصفحات</p>
          </div>
          <div className="stat p-4 text-center">
            <b className="v text-emerald-400 font-['JetBrains_Mono']">&lt; 1.5s</b>
            <p className="t mt-0.5 font-bold">سرعة الاستجابة</p>
          </div>
          <div className="stat p-4 text-center">
            <b className="v text-amber-400 font-['JetBrains_Mono']">24/7</b>
            <p className="t mt-0.5 font-bold">متاح دائماً للطالب</p>
          </div>
        </div>
      </div>

      {/* Quick Interactive Features Grid */}
      <div className="space-y-4">
        <div className="sec-head">
          <h2 className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>الأدوات الأكاديمية التفاعلية</span>
          </h2>
          <small>الكل بخطوة واحدة</small>
        </div>

        <div className="tools-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                onClick={() => onSelectTab(action.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTab(action.id);
                  }
                }}
                tabIndex={0}
                className="tool-card group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span className={`t-ic bg-gradient-to-br ${action.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </span>

                <div style={{ minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="t-title group-hover:text-teal-400 transition">{action.title}</div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>
                  <div className="t-sub leading-relaxed mt-1">{action.desc}</div>
                </div>

                <ArrowLeft className="w-4 h-4 t-arrow group-hover:text-emerald-400 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Student Analytics - Real progress_json */}
      <StudentAnalytics />

    </div>
  );
}
