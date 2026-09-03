import React from 'react';
import { Activity, Trash2, Clock, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function ActivityLogs({ logs, handleClearLogs }) {
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'error': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'warn': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black theme-text-primary mb-1">سجلات النشاط (Audit Logs)</h2>
          <p className="text-sm theme-text-muted font-bold">مراقبة تحركات النظام، عمليات تسجيل الدخول، وتغييرات الإعدادات</p>
        </div>
        <button
          onClick={handleClearLogs}
          className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-sm font-black transition flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          تفريغ السجلات
        </button>
      </div>

      <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 theme-text-primary font-black">
                <th className="px-4 py-4 w-12"></th>
                <th className="px-4 py-4">النوع</th>
                <th className="px-4 py-4 w-1/2">التفاصيل</th>
                <th className="px-4 py-4">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {logs.map((log, i) => (
                <tr key={log.id || i} className="hover:bg-slate-500/5 transition-colors">
                  <td className="px-4 py-3 text-center">
                    {getLevelIcon(log.level)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black border ${getLevelBadge(log.level)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm theme-text-primary font-bold line-clamp-2" dir="auto">{log.details}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs font-mono theme-text-muted font-bold">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString('en-US')}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center theme-text-muted text-sm font-black">
                    لا توجد سجلات حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
