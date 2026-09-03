import React from 'react';
import { Palette, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function BrandingSettings({ settings, setSettings }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-black theme-text-primary mb-1">الهوية البصرية والاسم</h2>
        <p className="text-sm theme-text-muted font-bold">إدارة العلامة التجارية والرسائل الترحيبية للمنصة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-400" />
            النصوص الأساسية
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">اسم المنصة الرئيسية</label>
              <input 
                type="text" 
                name="platform_name"
                value={settings.platform_name || ''} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">الشعار اللفظي (Subtitle)</label>
              <input 
                type="text" 
                name="platform_subtitle"
                value={settings.platform_subtitle || ''} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">الجامعة / المؤسسة</label>
              <input 
                type="text" 
                name="university_name"
                value={settings.university_name || ''} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">الكلية / القسم</label>
              <input 
                type="text" 
                name="faculty_name"
                value={settings.faculty_name || ''} 
                onChange={handleChange}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              الترحيب والشعارات
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black theme-text-muted mb-1">عنوان شاشة الترحيب</label>
                <input 
                  type="text" 
                  name="welcome_headline"
                  value={settings.welcome_headline || ''} 
                  onChange={handleChange}
                  className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-black theme-text-muted mb-1">وصف شاشة الترحيب</label>
                <textarea 
                  name="welcome_description"
                  value={settings.welcome_description || ''} 
                  onChange={handleChange}
                  rows={3}
                  className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition resize-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-black theme-text-muted mb-1">رابط الشعار المخصص (URL اختياري)</label>
                <input 
                  type="text" 
                  name="custom_logo_url"
                  placeholder="https://..."
                  value={settings.custom_logo_url || ''} 
                  onChange={handleChange}
                  className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition font-mono" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
