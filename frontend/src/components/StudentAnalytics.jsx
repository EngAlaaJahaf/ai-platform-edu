import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Clock, Award, Target } from 'lucide-react';
import { fetchDocuments, fetchQuizProgress } from '../services/api';

export default function StudentAnalytics() {
  const [docs, setDocs] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const documents = await fetchDocuments({ limit: 50 });
        setDocs(documents);
        const map = {};
        for (const d of documents) {
          try {
            const p = await fetchQuizProgress(d.doc_id || d.id);
            if (p) map[d.doc_id || d.id] = p;
          } catch {}
        }
        setProgressMap(map);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="theme-text-muted text-xs p-6">جاري تحميل التحليلات...</div>;

  const entries = Object.entries(progressMap);
  if (entries.length === 0) {
    return (
      <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
        <BarChart3 className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <h3 className="font-black theme-text-primary mb-1">لا توجد تحليلات بعد</h3>
        <p className="text-xs theme-text-muted">ابدأ حل الاختبارات وسيظهر تقدمك هنا بدل التنبؤ الثابت.</p>
      </div>
    );
  }

  // Aggregate stats
  let totalScore = 0, totalCount = 0, completed = 0;
  const perDoc = entries.map(([docId, p]) => {
    const score = p.score || 0;
    const total = p.history ? p.history.length : (p.score ? 1 : 0);
    const pct = p.isCompleted ? (score / Math.max(1, (p.selectedAnswers ? Object.keys(p.selectedAnswers).length : 1)) * 100) : 0;
    totalScore += score;
    totalCount += 1;
    if (p.isCompleted) completed += 1;
    return { docId, score, pct, title: docs.find(d => (d.doc_id||d.id)===docId)?.filename || docId };
  });

  const avgPct = perDoc.length ? (perDoc.reduce((a,b)=>a+b.pct,0)/perDoc.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl text-center">
          <Award className="w-6 h-6 mx-auto text-amber-500 mb-2" />
          <div className="text-2xl font-black theme-text-primary">{avgPct}%</div>
          <div className="text-xs theme-text-muted font-bold">متوسط الإنجاز</div>
        </div>
        <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl text-center">
          <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
          <div className="text-2xl font-black theme-text-primary">{completed}/{perDoc.length}</div>
          <div className="text-xs theme-text-muted font-bold">اختبارات مكتملة</div>
        </div>
        <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl text-center">
          <Target className="w-6 h-6 mx-auto text-emerald-500 mb-2" />
          <div className="text-2xl font-black theme-text-primary">{totalScore}</div>
          <div className="text-xs theme-text-muted font-bold">مجموع النقاط</div>
        </div>
      </div>

      <div className="theme-bg-card border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-black theme-text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> تقدمك حسب المادة (progress_json)</h3>
        <div className="space-y-3">
          {perDoc.map(item => (
            <div key={item.docId} className="space-y-1">
              <div className="flex justify-between text-xs font-bold theme-text-primary truncate">
                <span className="truncate max-w-[70%]">{item.title}</span>
                <span className="font-mono">{item.pct.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${item.pct>=80?'bg-emerald-500': item.pct>=50?'bg-amber-500':'bg-emerald-500'}`} style={{width: `${Math.min(100,item.pct)}%`}}></div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] theme-text-muted mt-4">بدل `predicted_score` الثابت (85)، يُحسب الآن من `progress_json` الحقيقي لكل محاولة.</p>
      </div>
    </div>
  );
}
