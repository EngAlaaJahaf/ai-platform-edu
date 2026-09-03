import React from 'react';
import { ShieldCheck, Sliders, Globe } from 'lucide-react';

export default function SystemPolicies({ settings, setSettings }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">إعدادات النظام والسياسات</h2>
        <p className="text-sm text-slate-400">إدارة القواعد العامة، تسجيل الدخول، وتفعيل/تعطيل الميزات الرئيسية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            حالة المنصة والتسجيل
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-white/5 transition">
              <div>
                <span className="block text-sm text-white font-bold mb-0.5">وضع الصيانة (Maintenance Mode)</span>
                <span className="text-xs text-slate-500">إيقاف المنصة مؤقتاً للتحديثات (تظهر رسالة للطلاب)</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode || false} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-white/5 transition">
              <div>
                <span className="block text-sm text-white font-bold mb-0.5">السماح بتسجيل حسابات جديدة</span>
                <span className="text-xs text-slate-500">تمكين الطلاب من إنشاء حسابات بأنفسهم</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="registration_enabled" checked={settings.registration_enabled !== false} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">إشعار النظام (System Notice)</label>
              <textarea 
                name="system_notice"
                value={settings.system_notice || ''} 
                onChange={handleChange}
                rows={2}
                placeholder="رسالة تظهر لجميع المستخدمين في أعلى الشاشة..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition resize-none" 
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            حدود الاستهلاك الافتراضية
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">حد التوكنز للمستخدم الجديد (Tokens Limit)</label>
              <input 
                type="number" 
                name="default_student_token_limit"
                value={settings.default_student_token_limit || 500000} 
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">الحد الأقصى لحجم الملف المرفوع (MB)</label>
              <input 
                type="number" 
                name="max_upload_size_mb"
                value={settings.max_upload_size_mb || 50} 
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">باقة المستخدم الجديد (Subscription Tier)</label>
              <input 
                type="text" 
                name="default_subscription_tier"
                value={settings.default_subscription_tier || 'Pro Academic 🌟'} 
                onChange={handleChange}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition" 
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            تفعيل / تعطيل الوحدات (Global Modules Enable)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['chat', 'quiz', 'summary', 'translate', 'proofread'].map(mod => (
              <label key={mod} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-white/5 transition text-center">
                <span className="block text-sm text-white font-bold capitalize">وحدة {mod}</span>
                <div className="relative inline-flex items-center cursor-pointer mt-2">
                  <input type="checkbox" name={`enable_${mod}`} checked={settings[`enable_${mod}`] !== false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
