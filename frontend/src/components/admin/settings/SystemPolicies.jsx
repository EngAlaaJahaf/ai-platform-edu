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
        <h2 className="text-2xl font-black theme-text-primary mb-1">إعدادات النظام والسياسات</h2>
        <p className="text-sm theme-text-muted font-bold">إدارة القواعد العامة، تسجيل الدخول، وتفعيل/تعطيل الميزات الرئيسية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            حالة المنصة والتسجيل
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-2xl theme-card-inner border cursor-pointer hover:border-emerald-500/30 transition">
              <div>
                <span className="block text-sm theme-text-primary font-black mb-0.5">وضع الصيانة (Maintenance Mode)</span>
                <span className="text-xs theme-text-muted font-bold">إيقاف المنصة مؤقتاً للتحديثات</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="maintenance_mode" checked={settings.maintenance_mode || false} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl theme-card-inner border cursor-pointer hover:border-emerald-500/30 transition">
              <div>
                <span className="block text-sm theme-text-primary font-black mb-0.5">السماح بتسجيل حسابات جديدة</span>
                <span className="text-xs theme-text-muted font-bold">تمكين الطلاب من إنشاء حسابات</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="registration_enabled" checked={settings.registration_enabled !== false} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
            </label>
            
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">إشعار النظام (System Notice)</label>
              <textarea 
                name="system_notice"
                value={settings.system_notice || ''} 
                onChange={handleChange}
                rows={2}
                placeholder="رسالة تظهر لجميع المستخدمين في أعلى الشاشة..."
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-emerald-500 transition resize-none" 
              />
            </div>
          </div>
        </div>

        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-500" />
            حدود الاستهلاك الافتراضية
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">حد التوكنز للمستخدم الجديد</label>
              <input 
                type="number" 
                name="default_student_token_limit"
                value={settings.default_student_token_limit || 500000} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-emerald-500 transition font-mono" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">الحد الأقصى لحجم الملف (MB)</label>
              <input 
                type="number" 
                name="max_upload_size_mb"
                value={settings.max_upload_size_mb || 50} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-emerald-500 transition font-mono" 
              />
            </div>

            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">باقة المستخدم الجديد</label>
              <input 
                type="text" 
                name="default_subscription_tier"
                value={settings.default_subscription_tier || 'Pro Academic 🌟'} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-emerald-500 transition" 
              />
            </div>
          </div>
        </div>

        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 md:col-span-2">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            تفعيل / تعطيل الوحدات
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {['chat', 'quiz', 'summary', 'translate', 'proofread'].map(mod => (
              <label key={mod} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl theme-card-inner border cursor-pointer hover:border-emerald-500/30 transition text-center">
                <span className="block text-sm theme-text-primary font-black capitalize">وحدة {mod}</span>
                <div className="relative inline-flex items-center cursor-pointer mt-2">
                  <input type="checkbox" name={`enable_${mod}`} checked={settings[`enable_${mod}`] !== false} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
