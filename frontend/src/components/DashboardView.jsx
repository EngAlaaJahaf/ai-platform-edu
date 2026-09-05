import React from 'react';
import { 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  BrainCircuit, 
  CheckCheck, 
  Upload, 
  Clock, 
  Calendar, 
  Award, 
  BookOpen, 
  Zap, 
  ArrowLeft
} from 'lucide-react';
import StudentAnalytics from './StudentAnalytics';

export default function DashboardView({ 
  onSelectTab, 
  onOpenUpload, 
  activeDoc 
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
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden glass-panel">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl -z-10"></div>
        
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
          <div className="p-4 rounded-2xl theme-card-inner text-center">
            <b className="text-xl font-black theme-text-primary font-['JetBrains_Mono']">10,000+</b>
            <p className="text-xs theme-text-muted font-bold mt-0.5">ملخص أكاديمي</p>
          </div>
          <div className="p-4 rounded-2xl theme-card-inner text-center">
            <b className="text-xl font-black text-teal-400 font-['JetBrains_Mono']">98%</b>
            <p className="text-xs theme-text-muted font-bold mt-0.5">دقة RAG بالصفحات</p>
          </div>
          <div className="p-4 rounded-2xl theme-card-inner text-center">
            <b className="text-xl font-black text-emerald-400 font-['JetBrains_Mono']">&lt; 1.5s</b>
            <p className="text-xs theme-text-muted font-bold mt-0.5">سرعة الاستجابة</p>
          </div>
          <div className="p-4 rounded-2xl theme-card-inner text-center">
            <b className="text-xl font-black text-amber-400 font-['JetBrains_Mono']">24/7</b>
            <p className="text-xs theme-text-muted font-bold mt-0.5">متاح دائماً للطالب</p>
          </div>
        </div>
      </div>

      {/* Quick Interactive Features Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-black theme-text-primary flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>الأدوات الأكاديمية التفاعلية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="glass-card rounded-2xl p-6 hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${action.badgeColor}`}>
                      {action.badge}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base theme-text-primary mb-1.5 group-hover:text-teal-400 transition">
                    {action.title}
                  </h4>
                  <p className="text-xs theme-text-secondary leading-relaxed">
                    {action.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-[-3px] transition-transform">
                  <span>فتح الأداة</span>
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Day Study Plan & Material Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Study Plan Section */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h4 className="font-extrabold text-base theme-text-primary">خطة المراجعة الذكية المقترحة (3 أيام)</h4>
            </div>
            <span className="text-xs font-bold theme-text-muted">
              {activeDoc ? `مخصصة لـ: ${activeDoc.filename}` : 'خطة نموذجية تفاعلية'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl theme-card-inner flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                يوم 1
              </span>
              <div>
                <b className="text-sm theme-text-primary block mb-0.5">استيعاب المفاهيم والخريطة الذهنية</b>
                <p className="text-xs theme-text-secondary leading-relaxed">
                  قراءة الملخص النقطي المتكامل وتصفح الخريطة الذهنية التفاعلية لتثبيت المصطلحات والمحاور.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl theme-card-inner flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                يوم 2
              </span>
              <div>
                <b className="text-sm theme-text-primary block mb-0.5">حل اختبار MCQ تفاعلي ومراجعة الأخطاء</b>
                <p className="text-xs theme-text-secondary leading-relaxed">
                  توليد 15 سؤالاً تدريبياً ثنائي اللغة وقراءة التفسيرات الأكاديمية لكل سؤال لتقوية نقاط الضعف.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl theme-card-inner flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                يوم 3
              </span>
              <div>
                <b className="text-sm theme-text-primary block mb-0.5">جلسة أسئلة مكثفة (RAG Q&A)</b>
                <p className="text-xs theme-text-secondary leading-relaxed">
                  طرح أصعب الأسئلة المتوقعة على المساعد الذكي مع استعراض الاقتباسات وأرقام الصفحات.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Analytics - Real progress_json */}
      <StudentAnalytics />

    </div>
  );
}
