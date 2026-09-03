import React from 'react';
import { Sliders, Thermometer, Layers, FileType, Mail, Info, Type } from 'lucide-react';

const ALL_FORMATS = [".pdf", ".docx", ".pptx", ".txt", ".md", ".xlsx", ".csv", ".ppt", ".doc", ".rtf"];

export default function AdvancedSettings({ settings, setSettings }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'temperature' || name === 'max_upload_size_mb' || name === 'auto_rag_chunks' || name === 'default_student_token_limit') {
      val = value === '' ? '' : Number(value);
    }
    setSettings(prev => ({ ...prev, [name]: val }));
  };

  const toggleFormat = (fmt) => {
    const current = settings.allowed_formats || ALL_FORMATS.slice(0, 7);
    const next = current.includes(fmt) ? current.filter(f => f !== fmt) : [...current, fmt];
    setSettings(prev => ({ ...prev, allowed_formats: next }));
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-black theme-text-primary mb-1">إعدادات متقدمة</h2>
        <p className="text-xs theme-text-muted font-bold">تحكم دقيق في سلوك الذكاء، الاسترجاع، الصيغ، والهوية الإضافية — كلها محفوظة في `system_settings`</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Behavior */}
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-500" /> سلوك النموذج
          </h3>
          <div>
            <label className="block text-xs font-black theme-text-muted mb-1">الحرارة (Temperature) — {settings.temperature ?? 0.3}</label>
            <input type="range" name="temperature" min="0" max="1" step="0.05" value={settings.temperature ?? 0.3} onChange={handleChange} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-[10px] theme-text-muted font-bold"><span>دقيق 0</span><span>متوازن 0.5</span><span>مبدع 1</span></div>
            <p className="text-[11px] theme-text-muted mt-1">يُمرر إلى `AIService.execute_chat_completion` كـ `temperature`.</p>
          </div>
          <div>
            <label className="block text-xs font-black theme-text-muted mb-1">عدد مقاطع RAG المسترجعة (auto_rag_chunks)</label>
            <input type="number" name="auto_rag_chunks" min="1" max="20" value={settings.auto_rag_chunks ?? 4} onChange={handleChange} className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-mono theme-text-primary" />
            <p className="text-[11px] theme-text-muted mt-1">يُستخدم في `RAGService.search_relevant_chunks(top_k)`.</p>
          </div>
          <label className="flex items-center justify-between p-3 rounded-xl theme-card-inner border cursor-pointer hover:border-indigo-500/30 transition">
            <div>
              <span className="block text-xs font-black theme-text-primary">قواعد الصياغة الأساسية</span>
              <span className="text-[11px] theme-text-muted font-bold">تُضاف لكل برومبت (~300 توكن) — عطّلها لتوفير التوكن</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="enable_base_rules" checked={settings.enable_base_rules !== false} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </div>
          </label>
        </div>

        {/* Formats & Limits */}
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <FileType className="w-4 h-4 text-cyan-500" /> الصيغ والحدود
          </h3>
          <div>
            <label className="block text-xs font-black theme-text-muted mb-2">الصيغ المسموحة (allowed_formats)</label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_FORMATS.map(fmt => {
                const active = (settings.allowed_formats || ALL_FORMATS.slice(0,7)).includes(fmt);
                return (
                  <button key={fmt} type="button" onClick={() => toggleFormat(fmt)} className={`px-2 py-1.5 rounded-xl text-xs font-mono font-bold border transition ${active ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-500' : 'theme-card-inner border theme-text-muted'}`}>{fmt}</button>
                );
              })}
            </div>
          </div>
          <div className="pt-2">
            <label className="block text-xs font-black theme-text-muted mb-1">الحد الأقصى للرفع (MB) — مكرر للتحكم السريع</label>
            <input type="number" name="max_upload_size_mb" value={settings.max_upload_size_mb ?? 50} onChange={handleChange} className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-mono theme-text-primary" />
          </div>
        </div>

        {/* Branding extended */}
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 md:col-span-2">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> هوية إضافية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1"><Mail className="inline w-3 h-3 mr-1" /> البريد للدعم</label>
              <input name="support_email" value={settings.support_email || ''} onChange={handleChange} placeholder="admin@eduai.edu" className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm theme-text-primary font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">أيقونة الشعار (Lucide)</label>
              <input name="logo_icon" value={settings.logo_icon || 'GraduationCap'} onChange={handleChange} placeholder="GraduationCap" className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm theme-text-primary font-mono" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">نص الفوتر</label>
              <input name="footer_text" value={settings.footer_text || ''} onChange={handleChange} placeholder="المنصة الأكاديمية الذكية المتقدمة" className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm theme-text-primary" />
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs theme-text-muted">
            <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <span>هذه الحقول تُحفظ عبر <code>POST /api/admin/settings</code> وتُقرأ من `get_system_settings()` وتظهر فوراً في الهيدر والفوتر.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
