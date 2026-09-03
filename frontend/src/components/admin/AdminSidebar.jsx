import React from 'react';
import { Palette, Users, Cpu, Settings, MessageSquare, Save, Server, Shield, Activity, HardDrive, RefreshCw, Layers, Sliders } from 'lucide-react';

export default function AdminSidebar({ activeSection, setActiveSection, stats, onSave, saving, saveSuccess, loading, onRefresh }) {
  const sections = [
    { id: 'branding', label: 'الهوية البصرية والاسم', icon: Palette, category: 'General' },
    { id: 'users', label: 'المستخدمين والصلاحيات', icon: Users, category: 'Access' },
    { id: 'ai', label: 'محركات الذكاء والنماذج', icon: Cpu, category: 'Configuration' },
    { id: 'prompts', label: 'قوالب التوجيه', icon: MessageSquare, category: 'Configuration' },
    { id: 'policies', label: 'إعدادات النظام والسياسات', icon: Settings, category: 'General' },
    { id: 'advanced', label: 'إعدادات متقدمة', icon: Sliders, category: 'Configuration' },
    { id: 'logs', label: 'سجلات النشاط (Logs)', icon: Activity, category: 'Access' },
  ];

  return (
    <div className="w-64 flex flex-col theme-bg-panel border-l border-slate-200 dark:border-slate-800 min-h-screen shrink-0 font-['Tajawal'] select-none">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-black theme-text-primary mb-1">الإدارة الشاملة</h2>
        <p className="text-xs theme-text-muted font-bold">تحكم كامل (Atom Level)</p>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1.5">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/30'
                    : 'theme-text-secondary hover:theme-text-primary hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </div>

        {stats ? (
          <div className="px-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-[10px] uppercase font-black theme-text-muted mb-3 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> نظرة عامة حية
            </h3>
            <div className="space-y-4">
              {(() => {
                const usersPct = Math.min(100, ((stats.total_users || 0) / 50) * 100);
                const docsPct = Math.min(100, ((stats.total_documents || 0) / 50) * 100);
                const dbPct = Math.min(100, ((stats.db_size_kb || 0) / 5120) * 100);
                const promptsPct = Math.min(100, ((stats.total_prompts || 0) / 20) * 100);
                return (
                  <>
                    <div>
                      <div className="flex justify-between text-xs theme-text-secondary mb-1">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> المستخدمين</span>
                        <span className="font-mono font-bold theme-text-primary">{stats.total_users || 0} <span className="text-[10px] theme-text-muted">({usersPct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-700" style={{width: `${usersPct}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs theme-text-secondary mb-1">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> المستندات</span>
                        <span className="font-mono font-bold theme-text-primary">{stats.total_documents || 0} <span className="text-[10px] theme-text-muted">({docsPct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-700" style={{width: `${docsPct}%`}}></div>
                      </div>
                      <div className="text-[10px] theme-text-muted mt-1 flex justify-between"><span>{stats.total_pages || 0} صفحة</span><span>{(stats.total_words || 0).toLocaleString()} كلمة</span></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs theme-text-secondary mb-1">
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> القوالب</span>
                        <span className="font-mono font-bold theme-text-primary">{stats.total_prompts || 0}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all duration-700" style={{width: `${promptsPct}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs theme-text-secondary mb-1">
                        <span>قاعدة البيانات</span>
                        <span className="font-mono font-bold theme-text-primary">{stats.db_size_kb || 0} KB</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${dbPct>80?'bg-rose-500': dbPct>60?'bg-amber-500':'bg-emerald-500'}`} style={{width: `${dbPct}%`}}></div>
                      </div>
                      <div className="text-[10px] theme-text-muted mt-1 flex justify-between"><span>{stats.total_activities || 0} سجل</span><span className={`font-bold ${stats.server_status==='healthy'?'text-emerald-500':'text-rose-500'}`}>{stats.server_status || 'unknown'}</span></div>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="text-[10px] theme-text-muted mt-3 flex items-center gap-1"><Activity className="w-3 h-3" /> تحديث تلقائي كل 30 ثانية</div>
          </div>
        ) : (
          <div className="px-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full py-2.5 rounded-xl theme-header-btn border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? 'تم الحفظ بنجاح ✓' : 'حفظ التعديلات الشاملة'}</span>
        </button>
      </div>
    </div>
  );
}
