import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  FileText, 
  Sparkles, 
  Layers, 
  Download, 
  Printer, 
  Network, 
  BookMarked, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  Maximize2, 
  Minimize2,
  ZoomIn, 
  ZoomOut, 
  Upload, 
  KeyRound, 
  Wand2,
  Play,
  Sliders,
  BookOpen,
  Scale,
  AlertTriangle,
  Calculator,
  Compass,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  FolderPlus,
  FolderMinus
} from 'lucide-react';
import { fetchSummary } from '../services/api';
import ExportModal from './ExportModal';
import NotebookLMMindMap from './NotebookLMMindMap';

export default function SummaryView({ 
  activeDoc, 
  activePrompt, 
  onOpenPromptManager, 
  onSwitchToQuiz, 
  onOpenUpload, 
  onOpenApiKey 
}) {
  const currentDocId = activeDoc?.doc_id || activeDoc?.id || null;

  const [level, setLevel] = useState('full');
  const [language, setLanguage] = useState('ar'); // 'ar', 'bilingual', 'en'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Resilient localStorage and DB Cache Initializer
  const [summaryData, setSummaryData] = useState(() => {
    if (activeDoc?.summary_data) {
      return activeDoc.summary_data;
    }
    const docId = activeDoc?.doc_id || activeDoc?.id;
    if (docId) {
      const saved = localStorage.getItem(`eduai_summary_${docId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    const last = localStorage.getItem('eduai_last_summary');
    if (last) {
      try { return JSON.parse(last); } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    if (activeDoc?.summary_data) {
      setSummaryData(activeDoc.summary_data);
    } else {
      const docId = activeDoc?.doc_id || activeDoc?.id;
      if (docId) {
        const saved = localStorage.getItem(`eduai_summary_${docId}`);
        if (saved) {
          try { setSummaryData(JSON.parse(saved)); return; } catch (e) {}
        }
      }
      setSummaryData(null);
    }
  }, [activeDoc]);

  const [zoomScale, setZoomScale] = useState(1);
  const [activeTab, setActiveTab] = useState('pillars'); // 'pillars', 'comparisons', 'traps', 'definitions', 'mindmap'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const levels = [
    { id: 'quick', label: 'ملخص سريع', desc: 'أهم 4 نقاط للمراجعة السريعة في 3 دقائق' },
    { id: 'full', label: 'ملخص متكامل', desc: 'تغطية شاملة ومحاور ومقارنات ومصائد الامتحانات' },
    { id: 'deep', label: 'ملخص عميق وتفصيلي', desc: 'شرح مفاهيمي دقيق مع القوانين والمعادلات والأمثلة' },
  ];

  const languages = [
    { id: 'ar', label: '🇸🇦 عربي', desc: 'تلخيص عربي فصيح وشامل مع ترجمة المفاهيم' },
    { id: 'bilingual', label: '🌐 ثنائي اللغة', desc: 'شرح عربي مع إبراز المصطلحات بالإنجليزية' },
    { id: 'en', label: '🇬🇧 English', desc: 'Academic English summary and mindmap' },
  ];

  const handleGenerateSummary = async (selectedLevel = level, selectedLang = language) => {
    if (!activeDoc || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSummary(currentDocId, selectedLevel, selectedLang, activePrompt?.prompt);
      if (data) {
        setSummaryData(data);
        localStorage.setItem('eduai_last_summary', JSON.stringify(data));
        if (currentDocId) {
          localStorage.setItem(`eduai_summary_${currentDocId}`, JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'فشل توليد الملخص.');
    } finally {
      setLoading(false);
    }
  };

  // Load persisted summary data when active document changes
  useEffect(() => {
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_summary_${currentDocId}`);
      if (saved) {
        try {
          setSummaryData(JSON.parse(saved));
        } catch (e) {}
      }
    }
    setError(null);
  }, [currentDocId]);

  // Always sync summaryData to persistent storage
  useEffect(() => {
    if (summaryData) {
      localStorage.setItem('eduai_last_summary', JSON.stringify(summaryData));
      if (currentDocId) {
        localStorage.setItem(`eduai_summary_${currentDocId}`, JSON.stringify(summaryData));
      }
    }
  }, [summaryData, currentDocId]);

  const splitLegacyDifference = (diff) => {
    if (!diff || typeof diff !== 'string') return { a: diff || '—', b: diff || '—' };
    const text = diff.trim();

    // 1. Explicit separator
    if (text.includes(' | ')) {
      const parts = text.split(' | ');
      return { a: parts[0].trim(), b: parts.slice(1).join(' | ').trim() };
    }

    // 2. While / In contrast (بينما / في حين أن)
    const whileMatch = text.match(/^(.+?)(?:،\s*|\s+)بينما\s+(.+)$/i) || 
                       text.match(/^(.+?)(?:،\s*|\s+)في حين\s+(?:أن\s+)?(.+)$/i) ||
                       text.match(/^(.+?)(?:،\s*|\s+)أما\s+(.+)$/i);
    if (whileMatch) {
      return { a: whileMatch[1].trim(), b: whileMatch[2].trim() };
    }

    // 3. First vs Second (الأولى ... الثانية ...)
    const firstSecondMatch = text.match(/^(?:الأولى?|الطرف الأول)\s*[:\s](.+?)(?:،\s*|\s+)(?:الثانية?|الطرف الثاني)\s*[:\s](.+)$/i);
    if (firstSecondMatch) {
      return { a: firstSecondMatch[1].trim(), b: firstSecondMatch[2].trim() };
    }

    // 4. Comma / Semicolon splitting
    if (text.includes('،') || text.includes(';') || text.includes('؛')) {
      const delimiter = text.includes('،') ? '،' : (text.includes('؛') ? '؛' : ';');
      const parts = text.split(delimiter);
      if (parts.length === 2 && parts[0].trim().length > 3 && parts[1].trim().length > 3) {
        return { a: parts[0].trim(), b: parts[1].trim() };
      }
    }

    return { a: text, b: text };
  };

  const normalizeComparisons = (rawComparisons) => {
    if (!Array.isArray(rawComparisons) || rawComparisons.length === 0) return [];
    
    return rawComparisons.map((table, tIdx) => {
      // 1. If it has .items (dynamic multi-item format)
      if (Array.isArray(table.items) && table.items.length > 0) {
        const items = table.items;
        const rows = (table.rows || []).map(r => {
          let values = [];
          if (Array.isArray(r.values)) {
            values = r.values;
          } else {
            values = items.map((_, i) => r[`item_${String.fromCharCode(97 + i)}_val`] || r[`item_${String.fromCharCode(97 + i)}`] || '—');
          }
          return {
            aspect: r.aspect || r.title || 'وجه المقارنة',
            values: values
          };
        });
        return {
          title: table.title || `مقارنة ${tIdx + 1}`,
          items: items,
          rows: rows
        };
      }

      // 2. If it is table object with item_a and item_b (and optional item_c, item_d)
      if (table.item_a || table.item_b || Array.isArray(table.rows)) {
        const items = [];
        if (table.item_a) items.push(table.item_a);
        if (table.item_b) items.push(table.item_b);
        if (table.item_c) items.push(table.item_c);
        if (table.item_d) items.push(table.item_d);
        if (items.length === 0) items.push('الطرف الأول', 'الطرف الثاني');

        const rows = (table.rows || []).map(r => {
          let values = [];
          if (Array.isArray(r.values)) {
            values = r.values;
          } else {
            values = [
              r.item_a_val || r.item_a || '—',
              r.item_b_val || r.item_b || '—'
            ];
            if (table.item_c || r.item_c_val) values.push(r.item_c_val || r.item_c || '—');
            if (table.item_d || r.item_d_val) values.push(r.item_d_val || r.item_d || '—');
          }
          return {
            aspect: r.aspect || 'وجه المقارنة',
            values: values
          };
        });

        return {
          title: table.title || `مقارنة: ${items.join(' vs ')}`,
          items: items,
          rows: rows
        };
      }

      // 3. Fallback for flat comparison items
      return {
        title: table.title || `مقارنة ${tIdx + 1}`,
        items: [table.item_a || 'الطرف الأول', table.item_b || 'الطرف الثاني'],
        rows: [{
          aspect: table.aspect || 'المقارنة',
          values: [table.item_a_val || '—', table.item_b_val || '—']
        }]
      };
    });
  };

  const handleCopyRawMarkdown = () => {
    if (!summaryData) return;
    let content = `# 📑 ${summaryData.title || 'الملخص الأكاديمي'}\n\n`;
    
    if (summaryData.overview) {
      content += `## 🧭 نظرة عامة جوهرية\n${summaryData.overview}\n\n`;
    }

    if (summaryData.pillars && summaryData.pillars.length > 0) {
      content += `## 📚 المحاور والمفاهيم الأساسية\n`;
      summaryData.pillars.forEach((p, idx) => {
        content += `### ${p.pillar_title || `المحور ${idx + 1}`}\n`;
        if (p.description) content += `${p.description}\n\n`;
        (p.sub_points || []).forEach(sp => {
          content += `- ${sp}\n`;
        });
        content += `\n`;
      });
    }

    const compTables = normalizeComparisons(summaryData.comparisons);
    if (compTables.length > 0) {
      content += `## ⚖️ جداول المقارنة الأكاديمية\n\n`;
      compTables.forEach(tbl => {
        content += `### ${tbl.title || 'جدول مقارنة'}\n`;
        const headers = ['وجه المقارنة', ...(tbl.items || ['الطرف 1', 'الطرف 2'])];
        content += `| ${headers.join(' | ')} |\n`;
        content += `| ${headers.map(() => ':---').join(' | ')} |\n`;
        (tbl.rows || []).forEach(r => {
          const rowVals = [r.aspect, ...(r.values || [])];
          content += `| ${rowVals.join(' | ')} |\n`;
        });
        content += `\n`;
      });
    }

    if (summaryData.exam_traps && summaryData.exam_traps.length > 0) {
      content += `## ⚠️ مصائد الامتحانات والأخطاء الشائعة\n`;
      summaryData.exam_traps.forEach(t => {
        content += `- **الخطأ الشائع:** ${t.trap}\n  - **المفهوم الصحيح:** ${t.correct_concept}\n`;
      });
      content += `\n`;
    }

    if (summaryData.definitions && summaryData.definitions.length > 0) {
      content += `## 📖 قاموس المصطلحات والمفاهيم\n`;
      summaryData.definitions.forEach(d => {
        content += `### ${d.term}\n**التعريف:** ${d.meaning}\n`;
        if (d.example) content += `*مثال:* ${d.example}\n`;
        content += `\n`;
      });
    }
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ملخص_أكاديمي_${activeDoc?.filename || 'المحاضرة'}.md`;
    link.click();
  };

  if (!activeDoc) {
    return (
      <div className="glass-panel rounded-3xl p-16 text-center max-w-2xl mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-teal-400">
          <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black theme-text-primary">لم تقم باختيار أو رفع مادة تعليمية بعد</h3>
          <p className="text-xs theme-text-secondary leading-relaxed max-w-md mx-auto">
            ارفع ملف المحاضرة (Word أو PowerPoint أو PDF) أولاً ليقوم الذكاء الاصطناعي بتلخيصها وتوليد الخريطة الذهنية بناءً على طلبك.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 border border-white/20"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>رفع مادة تعليمية الآن</span>
          </button>
        </div>
      </div>
    );
  }

  // Launch Studio (when not generated yet)
  if (!summaryData && !loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="glass-panel rounded-3xl p-8 border shadow-xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>استوديو التلخيص ورسم الخرائط الذهنية الأكاديمي</span>
              </div>
              <h2 className="text-2xl font-black theme-text-primary">
                توليد ملخص أكاديمي متكامل للمحاضرة
              </h2>
              <p className="text-xs theme-text-secondary">
                المستند الحالي: <b className="theme-text-primary">{activeDoc.filename}</b> ({activeDoc.pages_count} صفحة • {activeDoc.words_count || 0} كلمة)
              </p>
            </div>

            <button
              onClick={onOpenUpload}
              className="text-xs font-bold text-teal-500 hover:underline shrink-0"
            >
              تبديل الملف
            </button>
          </div>

        <div className="space-y-3">
          <label className="text-xs font-black theme-text-primary block">
            1. اختر عمق ومستوى التلخيص المطلوب:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {levels.map((lvl) => {
              const isSelected = level === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-teal-500 shadow-md theme-text-primary ring-2 ring-teal-500/20'
                      : 'theme-card-inner border hover:border-emerald-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'theme-text-primary'}`}>
                      {lvl.label}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </div>
                  <p className="text-[11px] theme-text-muted leading-relaxed">
                    {lvl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selector */}
        <div className="space-y-3">
          <label className="text-xs font-black theme-text-primary block">
            2. اختر لغة صياغة الملخص والشروحات:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((l) => {
              const isSelected = language === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-teal-500 shadow-md theme-text-primary ring-2 ring-teal-500/20'
                      : 'theme-card-inner border hover:border-emerald-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-black ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'theme-text-primary'}`}>
                      {l.label}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </div>
                  <p className="text-[11px] theme-text-muted leading-relaxed">
                    {l.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl theme-card-inner flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Wand2 className="w-4 h-4 text-teal-500" />
            <span className="theme-text-muted">قالب البرومبت:</span>
            <span className="font-bold theme-text-primary">{activePrompt?.title || 'الافتراضي المعتمد'}</span>
          </div>
          <button
            onClick={onOpenPromptManager}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            اختيار قالب آخر
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-200">إغلاق</button>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => handleGenerateSummary(level, language)}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:scale-[1.01] text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 border border-white/20 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>جاري قراءة وتلخيص المادة وتوليد الخريطة الذهنية...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>بدء توليد الملخص والخريطة الذهنية الآن 🚀</span>
              </>
            )}
          </button>
        </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* View Header Bar */}
      <div className="glass-panel rounded-2xl p-6 border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black theme-text-primary">
              {summaryData?.title || 'الملخص والخريطة الذهنية'}
            </h2>
          </div>
          <p className="text-xs theme-text-muted">
            المستند: {activeDoc.filename} • {levels.find(l => l.id === level)?.label}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Switcher */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => {
                  setLevel(lvl.id);
                  handleGenerateSummary(lvl.id, language);
                }}
                disabled={loading}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  level === lvl.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border" title="تغيير لغة التلخيص">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLanguage(l.id);
                  handleGenerateSummary(level, l.id);
                }}
                disabled={loading}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  language === l.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'theme-text-muted hover:theme-text-primary'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGenerateSummary(level, language)}
            disabled={loading}
            className="p-2.5 rounded-xl theme-header-btn border hover:text-teal-500 transition"
            title="إعادة التوليد"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5 border border-white/20 hover:scale-[1.02]"
            title="تصدير وطباعة التقرير (PDF, HTML, MD, TXT)"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>تصدير وطباعة 📄</span>
          </button>

          <button
            onClick={onSwitchToQuiz}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>اختبرني في هذا الملخص 🎯</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border animate-pulse">
          <RefreshCw className="w-10 h-10 animate-spin text-teal-400 mx-auto" />
          <h3 className="text-lg font-black theme-text-primary">الذكاء الاصطناعي يحلل المحاضرة بعمق ويستخرج الملخص الأكاديمي...</h3>
          <p className="text-xs theme-text-muted">يتم استخلاص المحاور، والمقارنات، ومصائد الامتحانات، وشجرة المفاهيم</p>
        </div>
      )}

      {/* Summary Content Body */}
      {summaryData && !loading && (
        <div className="space-y-6">
          
          {/* Executive Overview Card */}
          <div className="glass-card rounded-2xl p-6 border space-y-3">
            <h3 className="text-sm font-black theme-text-primary flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-teal-500" />
              <span>نظرة عامة جوهرية (Executive Overview)</span>
            </h3>
            <p className="text-sm theme-text-secondary leading-relaxed font-['Tajawal'] whitespace-pre-wrap">
              {summaryData.overview}
            </p>
          </div>

          {/* Tab Navigation for Deep Academic Sections */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl theme-nav border overflow-x-auto scrollbar-none">
            {[
              { id: 'pillars', label: 'المحاور الأساسية', icon: Layers, count: summaryData.pillars?.length },
              { id: 'comparisons', label: 'جداول المقارنة', icon: Scale, count: summaryData.comparisons?.length },
              { id: 'traps', label: 'مصائد الامتحانات ⚠️', icon: AlertTriangle, count: summaryData.exam_traps?.length },
              { id: 'rules', label: 'القوانين والمعادلات', icon: Calculator, count: summaryData.formulas_rules?.length },
              { id: 'definitions', label: 'قاموس المصطلحات', icon: BookOpen, count: summaryData.definitions?.length },
              { id: 'mindmap', label: 'الخريطة الذهنية', icon: Network },
            ].map((tab) => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isAct
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'theme-text-secondary hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full ${isAct ? 'bg-white/20 text-white' : 'theme-card-inner text-emerald-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Body */}
          <div className="animate-fade-in">
            
            {/* 1. Pillars Tab */}
            {activeTab === 'pillars' && (
              <div className="space-y-4">
                {summaryData.pillars && summaryData.pillars.length > 0 ? (
                  summaryData.pillars.map((pillar, idx) => (
                    <div key={idx} className="glass-card rounded-2xl p-6 border space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <h4 className="text-base font-black theme-text-primary">
                          {pillar.pillar_title}
                        </h4>
                      </div>
                      <div className="text-sm theme-text-secondary leading-relaxed font-['Tajawal'] pr-9">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {pillar.description}
                        </ReactMarkdown>
                      </div>
                      {pillar.sub_points && pillar.sub_points.length > 0 && (
                        <div className="pr-9 pt-2 space-y-2">
                          {pillar.sub_points.map((sp, spIdx) => (
                            <div key={spIdx} className="p-3 rounded-xl theme-card-inner border text-sm theme-text-primary flex items-start gap-2 leading-relaxed">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <div className="flex-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                  {sp}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="glass-card rounded-2xl p-6 border space-y-3">
                    <h4 className="text-sm font-black theme-text-primary">النقاط المفتاحية المستخلصة:</h4>
                    <div className="space-y-2">
                      {summaryData.key_points?.map((kp, idx) => (
                        <div key={idx} className="p-3 rounded-xl theme-card-inner border text-sm theme-text-primary flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                          <div className="flex-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {kp}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Comparisons Tab */}
            {activeTab === 'comparisons' && (() => {
              const compTables = normalizeComparisons(summaryData.comparisons);
              return (
                <div className="space-y-6">
                  {compTables.length > 0 ? (
                    compTables.map((tbl, tIdx) => (
                      <div key={tIdx} className="glass-card rounded-2xl p-6 border space-y-4 shadow-sm animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black theme-text-primary flex items-center gap-2 font-['Tajawal']">
                            <Scale className="w-4 h-4 text-teal-400" />
                            <span>{tbl.title || `مقارنة ${tIdx + 1}`}</span>
                          </h4>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-bold font-mono">
                            {tbl.rows?.length || 0} أوجه مقارنة • {tbl.items?.length || 2} أطراف
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-right font-['Tajawal']">
                            <thead className="bg-slate-100 dark:bg-slate-900 font-black theme-text-primary">
                              <tr>
                                <th className="px-4 py-3.5 text-emerald-600 dark:text-teal-400 whitespace-nowrap min-w-[140px]">
                                  وجه المقارنة
                                </th>
                                {(tbl.items || ['الطرف الأول', 'الطرف الثاني']).map((item, iIdx) => (
                                  <th key={iIdx} className="px-4 py-3.5 min-w-[200px]">
                                    {item}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                              {(tbl.rows || []).map((r, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/5 transition">
                                  <td className="px-4 py-3.5 font-black text-emerald-600 dark:text-teal-400 align-top whitespace-nowrap">
                                    {r.aspect}
                                  </td>
                                  {(r.values || [r.item_a_val, r.item_b_val]).map((val, vIdx) => (
                                    <td key={vIdx} className="px-4 py-3.5 theme-text-primary leading-relaxed align-top">
                                      {val || '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="glass-card rounded-2xl p-8 border text-center">
                      <p className="text-xs theme-text-muted">لا توجد مقارنات مستخلصة في هذه المحاضرة.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. Exam Traps & Common Pitfalls Tab */}
            {activeTab === 'traps' && (
              <div className="glass-card rounded-2xl p-6 border space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                  <span>مصائد الامتحانات ونقاط اللبس الشائعة بين الطلاب</span>
                </div>
                {summaryData.exam_traps && summaryData.exam_traps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summaryData.exam_traps.map((trap, idx) => (
                      <div key={idx} className="p-4 rounded-2xl theme-card-inner border border-amber-500/20 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-bold text-[10px] shrink-0 mt-0.5">
                            فخ شائع ❌
                          </span>
                          <b className="text-xs theme-text-primary leading-relaxed">{trap.trap}</b>
                        </div>
                        <div className="flex items-start gap-2 pt-2 border-t border-white/10">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
                            المفهوم الصحيح ✓
                          </span>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300 leading-relaxed font-bold">{trap.correct_concept}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs theme-text-muted p-4 text-center">تم استعراض كافة المفاهيم بوضوح دون مصائد خاصة.</p>
                )}
              </div>
            )}

            {/* 4. Formulas & Rules Tab */}
            {activeTab === 'rules' && (
              <div className="glass-card rounded-2xl p-6 border space-y-4">
                <h4 className="text-sm font-black theme-text-primary flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>القوانين والمعادلات والخوارزميات</span>
                </h4>
                {summaryData.formulas_rules && summaryData.formulas_rules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summaryData.formulas_rules.map((rule, idx) => (
                      <div key={idx} className="p-4 rounded-2xl theme-card-inner border space-y-2">
                        <b className="text-xs font-black text-emerald-500 dark:text-teal-300 block">{rule.name}</b>
                        <div className="p-2.5 rounded-xl bg-slate-950 text-teal-400 font-mono text-xs text-left dir-ltr overflow-x-auto">
                          {rule.rule}
                        </div>
                        <p className="text-[11px] theme-text-secondary leading-relaxed">{rule.explanation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs theme-text-muted p-4 text-center">المحاضرة ذات طابع نظري ومفاهيمي لا تتضمن معادلات رياضية معقدة.</p>
                )}
              </div>
            )}

            {/* 5. Glossary Definitions Tab */}
            {activeTab === 'definitions' && (
              <div className="glass-card rounded-2xl p-6 border space-y-4">
                <h4 className="text-sm font-black theme-text-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>قاموس المصطلحات والمفاهيم الأكاديمية</span>
                </h4>
                {summaryData.definitions && summaryData.definitions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {summaryData.definitions.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl theme-card-inner border space-y-1.5">
                        <b className="text-xs font-black text-emerald-600 dark:text-teal-300 block">{item.term}</b>
                        <p className="text-xs theme-text-primary leading-relaxed font-medium">{item.meaning}</p>
                        {item.example && (
                          <span className="text-[10px] theme-text-muted block pt-1 border-t border-white/5">
                            💡 مثال: {item.example}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs theme-text-muted p-4 text-center">لا توجد مصطلحات منفصلة.</p>
                )}
              </div>
            )}

            {/* 6. NotebookLM-Style Interactive Mind Map Concept Tree Tab */}
            {activeTab === 'mindmap' && (
              <NotebookLMMindMap
                mindmapData={summaryData.mindmap}
                defaultTitle={summaryData.title}
                language={language}
              />
            )}

          </div>

        </div>
      )}

      {/* Academic Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="summary"
        data={summaryData}
        docName={activeDoc?.filename}
        currentTab={activeTab}
      />

    </div>
  );
}
