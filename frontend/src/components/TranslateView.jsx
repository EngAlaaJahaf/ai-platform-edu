import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Sparkles, 
  Layers, 
  FileText, 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Download, 
  FileCode,
  FileDown,
  RefreshCw, 
  BookOpen, 
  FileCheck, 
  Columns, 
  Rows, 
  Search, 
  Sliders, 
  HelpCircle,
  Wand2,
  KeyRound,
  Upload,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { translateDocument, exportToDocx } from '../services/api';
import ExportModal from './ExportModal';

export default function TranslateView({ 
  activeDoc, 
  activePrompt, 
  onOpenPromptManager,
  onOpenUpload,
  onOpenApiKey 
}) {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ar');
  const [mode, setMode] = useState('a4_sheet'); // 'a4_sheet', 'line_by_line', 'page_by_page'
  const [inputText, setInputText] = useState('');
  const [useDoc, setUseDoc] = useState(true);
  
  const currentDocId = activeDoc?.doc_id || activeDoc?.id || null;

  const [loading, setLoading] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [error, setError] = useState(null);

  // Resilient state initializer from localStorage
  const [result, setResult] = useState(() => {
    const docId = activeDoc?.doc_id || activeDoc?.id;
    if (docId) {
      const saved = localStorage.getItem(`eduai_translate_${docId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    const last = localStorage.getItem('eduai_last_translate');
    if (last) {
      try { return JSON.parse(last); } catch (e) {}
    }
    return null;
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [copiedUnitIndex, setCopiedUnitIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync result to localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem('eduai_last_translate', JSON.stringify(result));
      if (currentDocId) {
        localStorage.setItem(`eduai_translate_${currentDocId}`, JSON.stringify(result));
      }
    }
  }, [result, currentDocId]);

  // Load result on active document change
  useEffect(() => {
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_translate_${currentDocId}`);
      if (saved) {
        try {
          setResult(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [currentDocId]);

  // A4 Reading comfort controls
  const [fontSize, setFontSize] = useState(16); // px
  const [lineHeight, setLineHeight] = useState(2.0); // rem/factor

  const languages = [
    { code: 'en', label: 'الإنجليزية (English)', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
    { code: 'fr', label: 'الفرنسية (Français)', flag: '🇫🇷' },
    { code: 'de', label: 'الألمانية (Deutsch)', flag: '🇩🇪' },
    { code: 'es', label: 'الإسبانية (Español)', flag: '🇪🇸' },
    { code: 'zh', label: 'الصينية (中文)', flag: '🇨🇳' }
  ];

  const modes = [
    { 
      id: 'a4_sheet', 
      title: 'ورقة A4 أكاديمية منسقة (خالية من التشتيت)', 
      desc: 'عرض النص المترجم كـ ورقة A4 بيضاء أنيقة وبخط أكاديمي فصيح واضح ومريح للقراءة والمذاكرة', 
      icon: BookOpen,
      badge: 'نمط القراءة الهادئ 📄'
    },
    { 
      id: 'line_by_line', 
      title: 'ترجمة سطرية موازية (تحت كل سطر)', 
      desc: 'عرض النص الإنجليزي الأصلي وتظهر تحته مباشرة الترجمة العربية المقابلة', 
      icon: Rows,
      badge: 'سطر بسطر 🔤'
    },
    { 
      id: 'page_by_page', 
      title: 'صفحة بصفحة (Page-by-Page)', 
      desc: 'عرض صفحة النص الأصلي تليها صفحة الترجمة المقابلة بشكل متتابع ومنظم', 
      icon: Columns,
      badge: 'للمقارنة الثنائية 📄'
    }
  ];

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const handleTranslate = async () => {
    if (useDoc && !activeDoc) {
      setError('يرجى رفع أو اختيار مادة تعليمية (PDF / Word) أولاً.');
      return;
    }
    if (!useDoc && !inputText.trim()) {
      setError('يرجى إدخال النص المطلوب ترجمته.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await translateDocument({
        docId: useDoc ? currentDocId : null,
        text: !useDoc ? inputText : null,
        sourceLang,
        targetLang,
        mode: mode === 'a4_sheet' ? 'target_only' : mode,
        customSystemPrompt: activePrompt?.prompt || null
      });
      setResult(data);
      localStorage.setItem('eduai_last_translate', JSON.stringify(data));
      if (currentDocId) {
        localStorage.setItem(`eduai_translate_${currentDocId}`, JSON.stringify(data));
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء الترجمة الأكاديمية.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (!result) return;
    setExportingDocx(true);
    try {
      await exportToDocx({
        title: result.translated_title || 'المستند الأكاديمي المترجم',
        subtitle: `ترجمة أكاديمية معتمدة (${sourceLang.toUpperCase()} ➔ ${targetLang.toUpperCase()})`,
        docName: activeDoc?.filename || 'مستند_أكاديمي',
        content: result.full_translated_text,
        units: mode === 'line_by_line' ? result.units : null,
        filename: `Translated_${activeDoc?.filename ? activeDoc.filename.replace(/\.[^/.]+$/, '') : 'Doc'}.docx`
      });
    } catch (e) {
      alert(`خطأ في تصدير Word: ${e.message}`);
    } finally {
      setExportingDocx(false);
    }
  };

  const handleCopyUnit = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedUnitIndex(idx);
    setTimeout(() => setCopiedUnitIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    let fullContent = '';
    if (mode === 'line_by_line' && result.units) {
      fullContent = result.units.map(u => `${u.original}\n${u.translated}`).join('\n\n');
    } else {
      fullContent = result.full_translated_text || '';
    }
    navigator.clipboard.writeText(fullContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const filteredUnits = result?.units?.filter(u => 
    u.original?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    u.translated?.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-cyan-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-cyan-600/25">
            <Languages className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black theme-text-primary">مترجم المقررات والمستندات الأكاديمي</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-black text-xs">
                Smart Academic Engine
              </span>
            </div>
            <p className="text-xs theme-text-secondary mt-1">
              استخراج فوري للنصوص من ملفات PDF وترجمتها لعرض A4 أكاديمي نقي مريح للعين مع تصدير Word و PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {activePrompt && (
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>قالب مخصص: {activePrompt.title}</span>
            </span>
          )}

          <button
            onClick={onOpenPromptManager}
            className="px-3.5 py-2 rounded-xl theme-header-btn border text-xs font-bold transition flex items-center gap-1.5"
            title="تخصيص برومبت وقواعد الترجمة"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>بنك البرومبتات</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Languages & Modes Setup */}
      <div className="glass-card rounded-3xl p-6 border shadow-lg space-y-6">
        
        {/* Row 1: Source & Target Language Selector */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          
          {/* Source Lang */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold theme-text-muted block">لغة المستند المصدر (Source Language):</label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full p-3 rounded-2xl theme-card-inner border theme-text-primary text-xs font-bold outline-none focus:border-cyan-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-5">
            <button
              onClick={handleSwapLanguages}
              className="p-3 rounded-2xl theme-header-btn border hover:border-cyan-500 hover:text-cyan-500 transition shadow-sm"
              title="تبديل اللغات"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Target Lang */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold theme-text-muted block">اللغة الهدف للترجمة (Target Language):</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full p-3 rounded-2xl theme-card-inner border theme-text-primary text-xs font-bold outline-none focus:border-cyan-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Translation Mode Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold theme-text-muted block">نمط وتنسيق العرض المطلوب للترجمة:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-50 to-cyan-50/60 dark:from-indigo-950/70 dark:to-cyan-950/40 border-cyan-500 shadow-md ring-2 ring-cyan-500/25'
                      : 'theme-card-inner border hover:border-indigo-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-cyan-400'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <b className="text-xs font-black theme-text-primary">{m.title}</b>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-cyan-400">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-[11px] theme-text-secondary leading-relaxed font-medium">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: Source Content Selection (Active Doc vs Manual Text) */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-xs font-bold">
              <label className="flex items-center gap-2 cursor-pointer theme-text-primary">
                <input
                  type="radio"
                  name="source_type"
                  checked={useDoc}
                  onChange={() => setUseDoc(true)}
                  className="accent-indigo-600"
                />
                <span>ترجمة ملف الـ PDF / المستند المرفوع</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer theme-text-primary">
                <input
                  type="radio"
                  name="source_type"
                  checked={!useDoc}
                  onChange={() => setUseDoc(false)}
                  className="accent-indigo-600"
                />
                <span>إدخال نص مخصص يدوياً</span>
              </label>
            </div>

            {useDoc && activeDoc && (
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span className="max-w-xs truncate">{activeDoc.filename} ({activeDoc.pages_count} صفحة)</span>
              </span>
            )}
          </div>

          {!useDoc ? (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="الصق النص الأكاديمي المطلوب ترجمته هنا..."
              rows={4}
              className="w-full p-3.5 rounded-2xl theme-card-inner border text-xs theme-text-primary outline-none focus:border-cyan-500 leading-relaxed font-mono"
            />
          ) : !activeDoc ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold theme-text-primary flex items-center justify-between">
              <span>لم يتم اختيار أو رفع ملف PDF حالياً.</span>
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-sm"
              >
                رفع ملف PDF الآن
              </button>
            </div>
          ) : null}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs theme-text-muted">
            النمط المختار: <b className="theme-text-primary">{modes.find(m => m.id === mode)?.title}</b>
          </span>

          <button
            onClick={handleTranslate}
            disabled={loading || (useDoc && !activeDoc)}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02] border border-white/20 flex items-center gap-2.5 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{loading ? 'جاري استخراج النص والترجمة الأكاديمية...' : 'بدء الترجمة الآن'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Translation Results Workspace */}
      {result && (
        <div className="glass-card rounded-3xl p-6 border shadow-xl space-y-6 animate-fade-in">
          
          {/* Results Header Toolbar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black theme-text-primary">{result.translated_title || 'المستند المترجم'}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                  مكتمل ✓
                </span>
              </div>
              <p className="text-xs theme-text-secondary mt-0.5">{result.summary_overview}</p>
            </div>

            {/* Toolbar Actions: Word Export, Academic Export, Copy, Search */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
              
              {/* Direct Word (.docx) Export Button */}
              <button
                onClick={handleExportDocx}
                disabled={exportingDocx}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-black shadow-md transition flex items-center gap-2 border border-white/20 disabled:opacity-50"
                title="تصدير الترجمة كمستند Microsoft Word (.docx) رسمي"
              >
                <FileDown className={`w-4 h-4 ${exportingDocx ? 'animate-bounce' : 'text-cyan-300'}`} />
                <span>{exportingDocx ? 'جاري تجهيز Word...' : 'تصدير كمستند Word (.docx)'}</span>
              </button>

              {/* Multi-Format Academic Export Button */}
              <button
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black shadow-md transition flex items-center gap-1.5 border border-white/20"
                title="تصدير بصيغة PDF أبيض، HTML، أو TXT"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>خيارات التصدير الأكاديمي</span>
              </button>

              <button
                onClick={handleCopyAll}
                className="px-3.5 py-2 rounded-xl theme-header-btn border text-xs font-bold transition flex items-center gap-1.5"
                title="نسخ كامل المحتوى المترجم"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Pure A4 Academic Paper Sheet (خالية من التشتيت) */}
          {mode === 'a4_sheet' && (
            <div className="space-y-4">
              
              {/* Reading Bar */}
              <div className="flex items-center justify-between text-xs theme-text-muted px-2">
                <span className="font-bold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-500" />
                  <span>معاينة ورقة A4 الأكاديمية (طباعة وقراءة نقية)</span>
                </span>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] font-bold">حجم الخط:</span>
                    <button 
                      onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                      className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-white/20"
                    >-</button>
                    <span className="font-mono font-bold text-xs">{fontSize}px</span>
                    <button 
                      onClick={() => setFontSize(Math.min(22, fontSize + 1))}
                      className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-white/20"
                    >+</button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] font-bold">تباعد الأسطر:</span>
                    <button 
                      onClick={() => setLineHeight(Math.max(1.5, lineHeight - 0.2))}
                      className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-white/20"
                    >-</button>
                    <span className="font-mono font-bold text-xs">{lineHeight.toFixed(1)}</span>
                    <button 
                      onClick={() => setLineHeight(Math.min(2.8, lineHeight + 0.2))}
                      className="px-1.5 py-0.5 rounded text-xs font-bold hover:bg-white/20"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* A4 Paper Sheet Simulation */}
              <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-8 rounded-3xl overflow-x-auto flex justify-center border border-slate-200 dark:border-slate-800">
                <div 
                  className="bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-300 w-full max-w-[850px] min-h-[1050px] p-8 md:p-14 space-y-6 font-['Tajawal'] select-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                >
                  {/* A4 Document Academic Header */}
                  <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {result.translated_title || 'المستند الأكاديمي المترجم'}
                    </h1>
                    <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-3">
                      <span>المستند الأصلي: <b>{activeDoc?.filename || 'مقرر دراسي'}</b></span>
                      <span>•</span>
                      <span>الترجمة: <b>{sourceLang.toUpperCase()} ➔ {targetLang.toUpperCase()}</b></span>
                      <span>•</span>
                      <span>التاريخ: <b>{new Date().toLocaleDateString('ar-EG')}</b></span>
                    </div>
                  </div>

                  {/* Clean Markdown Text Content (Zero Noise / No Distractions) */}
                  <div className="prose prose-slate max-w-none text-justify font-medium leading-loose space-y-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {result.full_translated_text}
                    </ReactMarkdown>
                  </div>

                  {/* A4 Document Footer */}
                  <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                    <span>منصة المساعد الأكاديمي الذكي (EduAI Platform)</span>
                    <span>صفحة 1 من 1</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Mode 2: Interlinear Line-by-Line Cards */}
          {mode === 'line_by_line' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs theme-text-muted">
                <span>إجمالي الفقرات والسطور المترجمة: <b className="theme-text-primary">{filteredUnits.length} وحدة</b></span>
                <span className="text-[11px]">💡 النص الأصلي بالأعلى متبوعاً بالترجمة العربية الموازية مباشرة</span>
              </div>

              <div className="space-y-3.5 max-h-[750px] overflow-y-auto pr-1">
                {filteredUnits.map((unit, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl theme-card-inner border transition hover:border-cyan-500/50 space-y-2.5 group"
                  >
                    
                    {/* Original Source Line */}
                    <div className="flex items-start justify-between gap-3 text-xs leading-relaxed font-sans theme-text-secondary dir-ltr text-left">
                      <div className="flex-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/15 text-slate-500 dark:text-slate-400 mr-2 uppercase">
                          {sourceLang} {idx + 1}
                        </span>
                        <span>{unit.original}</span>
                      </div>

                      <button
                        onClick={() => handleCopyUnit(unit.original, `orig_${idx}`)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg theme-header-btn border transition shrink-0"
                        title="نسخ النص الأصلي"
                      >
                        {copiedUnitIndex === `orig_${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Translated Target Line */}
                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-start justify-between gap-3 text-xs font-bold leading-relaxed theme-text-primary bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 p-2.5 rounded-xl border border-indigo-500/10">
                      <div className="flex-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 ml-2 uppercase">
                          {targetLang}
                        </span>
                        <span>{unit.translated}</span>
                      </div>

                      <button
                        onClick={() => handleCopyUnit(unit.translated, `trans_${idx}`)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg theme-header-btn border transition shrink-0"
                        title="نسخ الترجمة"
                      >
                        {copiedUnitIndex === `trans_${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode 3: Canva-Style Page-by-Page Structured White Paper Sheet */}
          {mode === 'page_by_page' && (
            <div className="space-y-8 flex flex-col items-center">
              
              {/* Page View Info Header */}
              <div className="w-full max-w-[850px] flex items-center justify-between text-xs theme-text-muted px-2">
                <span className="font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-500" />
                  <span>عرض صفحة بصفحة (ورقة A4 بيضاء • النص الإنجليزي أولاً وتحته العربي)</span>
                </span>
                <span className="font-bold bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-xs">
                  إجمالي الصفحات: {(result.parallel_pages || []).length || 1}
                </span>
              </div>

              {/* A4 White Sheet per Page (Canva Style) */}
              {(result.parallel_pages || [{ page_num: 1, original_text: result.full_translated_text, translated_text: result.full_translated_text }]).map((page, pIdx) => {
                // Smart structuring: break numbered points and headers if collapsed into single line
                const formatPage = (txt) => {
                  if (!txt) return '';
                  let formatted = txt.trim();
                  if (!formatted.includes('\n\n')) {
                    formatted = formatted
                      .replace(/(LEARNING OBJECTIVES|OBJECTIVES|CHAPTER|المخرجات التعليمية|الأهداف التعليمية|الفصل)/gi, '\n\n### $1\n\n')
                      .replace(/(\s)((\d+\.\d+|\d+\.)\s+)/g, '\n\n* **$2** ')
                      .replace(/(\s)(-\s+)/g, '\n\n* ')
                      .trim();
                  }
                  return formatted;
                };

                const origFormatted = formatPage(page.original_text);
                const transFormatted = formatPage(page.translated_text);

                return (
                  <div
                    key={pIdx}
                    className="bg-white text-slate-900 shadow-2xl rounded-3xl border border-slate-300 w-full max-w-[850px] min-h-[900px] p-8 md:p-14 space-y-8 font-['Tajawal'] select-text transition hover:shadow-cyan-500/5 relative"
                  >
                    {/* Top Sheet Header Banner */}
                    <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-900 text-white text-xs font-black">
                            📄 الصفحة رقم {page.page_num || pIdx + 1}
                          </span>
                          <span className="text-xs text-slate-500 font-bold truncate max-w-[280px]">
                            {activeDoc?.filename || 'المستند الأكاديمي'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <button
                          onClick={() => handleCopyUnit(`${page.original_text}\n\n---\n\n${page.translated_text}`, `page_${pIdx}`)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1 text-[11px] cursor-pointer"
                          title="نسخ الصفحة كاملة"
                        >
                          {copiedUnitIndex === `page_${pIdx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUnitIndex === `page_${pIdx}` ? 'تم النسخ' : 'نسخ الصفحة'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 1. UPPER SECTION: Original English Content (Top) */}
                    <div className="space-y-3 dir-ltr text-left">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-black tracking-wide">
                          🇬🇧 ORIGINAL PAGE CONTENT ({sourceLang.toUpperCase()})
                        </span>
                      </div>
                      
                      <div className="prose prose-slate max-w-none text-slate-800 font-sans text-[14.5px] leading-relaxed space-y-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {origFormatted}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Divider Ribbon */}
                    <div className="relative py-2 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-indigo-200"></div>
                      </div>
                      <span className="relative px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-black shadow-md flex items-center gap-1.5 font-['Tajawal']">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>🇸🇦 الترجمة الأكاديمية المعتمدة (العربية)</span>
                      </span>
                    </div>

                    {/* 2. LOWER SECTION: Certified Arabic Content (Bottom) */}
                    <div className="space-y-3 dir-rtl text-right">
                      <div className="prose prose-slate max-w-none text-slate-900 font-['Tajawal'] text-[15px] font-medium leading-loose space-y-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {transFormatted}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Bottom Sheet Footer */}
                    <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>منصة المساعد الأكاديمي الذكي (EduAI Platform - Canva Translate Engine)</span>
                      <span>صفحة {page.page_num || pIdx + 1}</span>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>
      )}

      {/* Academic Export Modal Integration */}
      {isExportOpen && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          type="translate"
          data={result}
          docName={activeDoc?.filename || 'مستند_مترجم'}
          currentTab={mode}
        />
      )}

    </div>
  );
}
