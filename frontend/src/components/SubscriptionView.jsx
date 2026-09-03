import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  KeyRound, 
  Infinity as InfinityIcon, 
  Layers,
  BarChart3
} from 'lucide-react';
import { fetchCurrentUser } from '../services/api';

export default function SubscriptionView({ user, onOpenApiKeyModal, onOpenAuthModal }) {
  const [liveUser, setLiveUser] = useState(user);
  useEffect(() => {
    fetchCurrentUser().then(u => { if (u) setLiveUser(u); }).catch(()=>{});
  }, []);
  const displayUser = liveUser || user;
  const tokensUsed = displayUser?.tokens_used || 0;
  const tokensLimit = displayUser?.tokens_limit || 500000;
  const pct = Math.min(100, (tokensUsed / tokensLimit) * 100);
  const plans = [
    {
      id: 'free',
      name: 'الباقة المجانية (Free)',
      price: '0$',
      desc: 'للاستخدام الأكاديمي الأساسي وتجربة المنصة',
      features: [
        'رفع حتى 3 ملفات أسبوعياً',
        'محادثة RAG سريعة مع الصفحات',
        'توليد 5 اختبارات شهرياً',
        'تدقيق لغوي حتى 1000 كلمة',
        'دعم وضع Bring Your Own Key المجاني'
      ],
      current: !user || user.tier === 'Free',
      cta: 'باقتك الحالية',
      highlight: false
    },
    {
      id: 'pro',
      name: 'باقة الطالب المتفوق (Pro Academic)',
      price: '4.99$',
      period: '/ شهرياً',
      desc: 'الوصول الكامل وغير المحدود لجميع ميزات ونماذج الذكاء الاصطناعي',
      features: [
        'رفع غير محدود لملفات الـ PDF والـ Office',
        'وصول لنماذج Gemini 2.5 Flash و Pro فائقة الدقة',
        'توليد اختبارات وبطاقات استذكار لا نهائية',
        'تصدير الخرائط الذهنية والملخصات بصيغ متعددة',
        'تنبؤ ذكي ودقيق بدرجات الامتحانات وتحليل شامل',
        'تدقيق ومقارنة الأصالة الأكاديمية بلا حدود'
      ],
      current: user?.tier?.includes('Pro'),
      cta: user?.tier?.includes('Pro') ? 'مشترك بالفعل ✓' : 'ترقية الحساب الآن',
      highlight: true
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fade-in">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-300 text-xs font-black">
          <Crown className="w-4 h-4" />
          <span>إدارة الاشتراك والباقات الأكاديمية</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-black theme-text-primary font-['IBM_Plex_Sans_Arabic']">
          اختر الخطة المناسبة <span className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-amber-500 bg-clip-text text-transparent">لتفوقك الجامعي</span>
        </h2>
        <p className="text-xs md:text-sm theme-text-secondary max-w-xl mx-auto leading-relaxed font-medium">
          أو استخدم ميزة **BYOK** (مفتاحك الخاص) للوصول اللامحدود مجاناً 100% بدون أي رسوم!
        </p>
      </div>

      {/* Live Token Usage */}
      <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black theme-text-primary flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" /> استهلاكك الحقيقي</h3>
          <span className="text-xs font-mono theme-text-muted">{tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} توكن</span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full transition-all ${pct>90?'bg-rose-500': pct>70?'bg-amber-500':'bg-indigo-500'}`} style={{width: `${pct}%`}}></div>
        </div>
        <div className="flex justify-between mt-2 text-[11px] theme-text-muted font-bold">
          <span>{pct.toFixed(1)}% مستخدم</span>
          <span>الباقة: {displayUser?.subscription_tier || 'Pro Academic'}</span>
        </div>
        <p className="text-[11px] theme-text-muted mt-2">يُحدّث تلقائياً بعد كل استدعاء ذكاء (محادثة، تلخيص، اختبار، ترجمة).</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`glass-panel rounded-3xl p-8 border transition-all relative flex flex-col justify-between shadow-xl ${
              plan.highlight
                ? 'border-indigo-500/50 shadow-indigo-600/15'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-[11px] font-black shadow-md">
                الأكثر شعبية للطلاب 🌟
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black theme-text-primary">{plan.name}</h3>
                {plan.current && (
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
                    الخطة المفعلة
                  </span>
                )}
              </div>

              <p className="text-xs theme-text-secondary mb-6 leading-relaxed">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black theme-text-primary font-['JetBrains_Mono']">{plan.price}</span>
                {plan.period && <span className="text-xs theme-text-muted font-bold">{plan.period}</span>}
              </div>

              {/* Features List */}
              <ul className="space-y-3 border-t border-slate-200 dark:border-slate-800/80 pt-6 mb-8 text-xs font-bold theme-text-primary">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 ${
                      plan.highlight ? 'bg-indigo-600' : 'bg-slate-500 dark:bg-slate-700'
                    }`}>
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={plan.highlight && !user ? onOpenAuthModal : undefined}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition shadow-lg ${
                plan.highlight
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25'
                  : 'theme-card-inner border theme-text-secondary hover:theme-text-primary'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* BYOK Option Banner */}
      <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black theme-text-primary">خيار مجاني دائم: مفتاحك الخاص (BYOK)</h4>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                غير محدود
              </span>
            </div>
            <p className="text-xs theme-text-secondary mt-1 leading-relaxed">
              ضع مفتاحك المجاني من Google Gemini لتحصل على كافة مميزات Pro بلا أي قيود أو اشتراكات شهرية.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiKeyModal}
          className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shrink-0 shadow-lg shadow-cyan-600/25 transition flex items-center gap-2 border border-white/20"
        >
          <KeyRound className="w-4 h-4 text-white" />
          <span>إدخال مفتاح API الخاص بي</span>
        </button>
      </div>

    </div>
  );
}
