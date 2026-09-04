import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Sparkles, 
  FileText, 
  ArrowLeftRight, 
  Download, 
  FileDown, 
  Printer, 
  BookOpen, 
  Columns, 
  Rows, 
  Search, 
  Wand2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  Lock, 
  Copy, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { translateDocument, exportToDocx } from '../services/api';

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
  const [canvaTab, setCanvaTab] = useState('translate'); // 'translate', 'settings'
  const [inputText, setInputText] = useState('');
  const [useDoc, setUseDoc] = useState(true);
  
  const currentDocId = activeDoc?.doc_id || activeDoc?.id || null;

  const [loading, setLoading] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [error, setError] = useState(null);

  // Settings State (Canva Settings tab)
  const [reduceFontToFit, setReduceFontToFit] = useState(true);
  const [duplicatePage, setDuplicatePage] = useState(true);
  const [mirrorRtl, setMirrorRtl] = useState(true);

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

  // Canva A4 Reading controls
  const [fontSize, setFontSize] = useState(16); // px
  const [zoomScale, setZoomScale] = useState(1.0);
  const [pageTitle, setPageTitle] = useState('المستند الأكاديمي المترجم');

  useEffect(() => {
    if (result?.translated_title) {
      setPageTitle(result.translated_title);
    }
  }, [result]);

  const languages = [
    { code: 'en', label: 'الإنجليزية (English)', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية (Arabic)', flag: '🇸🇦' },
    { code: 'fr', label: 'الفرنسية (Français)', flag: '🇫🇷' },
    { code: 'de', label: 'الألمانية (Deutsch)', flag: '🇩🇪' },
    { code: 'es', label: 'الإسبانية (Español)', flag: '🇪🇸' },
    { code: 'zh', label: 'الصينية (中文)', flag: '🇨🇳' }
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
      if (data?.translated_title) setPageTitle(data.translated_title);
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
        title: result.translated_title || pageTitle,
        subtitle: `ترجمة أكاديمية معتمدة (${sourceLang.toUpperCase()} ➔ ${targetLang.toUpperCase()})`,
        docName: activeDoc?.filename || 'مستند_أكاديمي',
        content: result.full_translated_text,
        units: mode === 'line_by_line' ? result.units : null,
        filename: `Translated_${activeDoc?.filename ? activeDoc.filename.replace(/\.[^/.]+$/, '') : 'Document'}.docx`
      });
    } catch (e) {
      alert(`خطأ في تصدير Word: ${e.message}`);
    } finally {
      setExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Main Canva Docs Translation Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 1. LEFT: Canva Translate Side Panel */}
        <aside className="lg:col-span-4 glass-panel rounded-3xl p-6 border shadow-xl flex flex-col gap-5 sticky top-20">
          
          {/* Canva Tabs (Translate / Settings) */}
          <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setCanvaTab('translate')}
              className={`text-sm font-extrabold pb-2 transition relative cursor-pointer ${
                canvaTab === 'translate' ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Translate
              {canvaTab === 'translate' && (
                <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>
              )}
            </button>

            <button
              onClick={() => setCanvaTab('settings')}
              className={`text-sm font-extrabold pb-2 transition relative cursor-pointer ${
                canvaTab === 'settings' ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              Settings
              {canvaTab === 'settings' && (
                <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Tab 1 Content: Translate Controls */}
          {canvaTab === 'translate' && (
            <div className="space-y-4">
              
              {/* Language Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold theme-text-secondary block">Translate to</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full p-2.5 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold outline-none focus:border-emerald-500"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-xs theme-text-muted pt-0.5">
                  <span>المستند المصدر: <b className="theme-text-primary">{sourceLang.toUpperCase()}</b></span>
                  <button onClick={handleSwapLanguages} className="text-emerald-500 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>تبديل</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800"></div>

              {/* 3 Layout Modes Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold theme-text-secondary block">طريقة عرض الترجمة (Layout Mode)</label>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => setMode('a4_sheet')}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      mode === 'a4_sheet' 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'theme-card-inner hover:bg-white/5 theme-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>الوضع 1: ورقة A4 كاملة (Canva Sheet)</span>
                    </div>
                    {mode === 'a4_sheet' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  </button>

                  <button
                    onClick={() => setMode('line_by_line')}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      mode === 'line_by_line' 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'theme-card-inner hover:bg-white/5 theme-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Rows className="w-4 h-4 text-emerald-500" />
                      <span>الوضع 2: سطر بسطر (Bilingual Book)</span>
                    </div>
                    {mode === 'line_by_line' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  </button>

                  <button
                    onClick={() => setMode('page_by_page')}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      mode === 'page_by_page' 
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                        : 'theme-card-inner hover:bg-white/5 theme-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Columns className="w-4 h-4 text-emerald-500" />
                      <span>الوضع 3: صفحة بصفحة (White A4 Sheets)</span>
                    </div>
                    {mode === 'page_by_page' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800"></div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold theme-text-secondary block">Apply to page</label>
                <div className="p-2.5 rounded-xl theme-card-inner border text-xs font-bold flex items-center justify-between">
                  <span>الصفحة 1 (الصفحة الحالية)</span>
                  <span className="text-xs theme-text-muted">من أصل {activeDoc?.pages_count || 1}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Primary Canva Translate Button */}
              <button
                onClick={handleTranslate}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>جاري الترجمة الأكاديمية...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ترجمة المستند (Translate)</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* Tab 2 Content: Canva Settings */}
          {canvaTab === 'settings' && (
            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer theme-card-inner p-3 rounded-xl border">
                <input
                  type="checkbox"
                  checked={reduceFontToFit}
                  onChange={(e) => setReduceFontToFit(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <b className="theme-text-primary block">Reduce font size to fit</b>
                  <span className="theme-text-muted block mt-0.5 leading-relaxed text-xs">
                    ضبط أحجام الخطوط تلقائياً لملاءمة حجم ورقة A4.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer theme-card-inner p-3 rounded-xl border">
                <input
                  type="checkbox"
                  checked={duplicatePage}
                  onChange={(e) => setDuplicatePage(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <b className="theme-text-primary block">Duplicate page when translating</b>
                  <span className="theme-text-muted block mt-0.5 leading-relaxed text-xs">
                    الحفاظ على الصفحة الأصلية وإنشاء صفحة مستقلة للترجمة المقابلة.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer theme-card-inner p-3 rounded-xl border">
                <input
                  type="checkbox"
                  checked={mirrorRtl}
                  onChange={(e) => setMirrorRtl(e.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <div>
                  <b className="theme-text-primary block">Mirror page to match text direction</b>
                  <span className="theme-text-muted block mt-0.5 leading-relaxed text-xs">
                    عكس اتجاه وهوامش الصفحة تلقائياً عند الترجمة من الإنجليزية إلى العربية (RTL).
                  </span>
                </div>
              </label>
            </div>
          )}

        </aside>

        {/* 2. RIGHT: Canva Document Canvas */}
        <main className="lg:col-span-8 flex flex-col items-center gap-6">
          
          {/* Floating Canva Studio Toolbar (Zoom, Font Size & Export) */}
          <div className="sticky top-20 z-40 flex items-center gap-3 bg-slate-900/90 dark:bg-slate-900/95 text-white px-4 py-2 rounded-full border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold">
            
            {/* Font Size controls */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
              <span className="text-slate-400">الخط:</span>
              <button 
                onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >A-</button>
              <span className="font-mono text-emerald-400">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >A+</button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
              <span className="text-slate-400">الزوم:</span>
              <button onClick={() => setZoomScale(0.85)} className={`px-2 py-0.5 rounded cursor-pointer ${zoomScale === 0.85 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>85%</button>
              <button onClick={() => setZoomScale(1.0)} className={`px-2 py-0.5 rounded cursor-pointer ${zoomScale === 1.0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>100%</button>
              <button onClick={() => setZoomScale(1.15)} className={`px-2 py-0.5 rounded cursor-pointer ${zoomScale === 1.15 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>115%</button>
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDocx}
                disabled={exportingDocx || !result}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="تصدير مستند Word (.docx) منسق"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Word (.docx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
                title="طباعة أو حفظ PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MODE 1: Full A4 Translated Document Sheet (Canva Clean Doc) */}
          {mode === 'a4_sheet' && (
            <div 
              className="w-full max-w-[860px] space-y-2 transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            >
              {/* Canva Page Header Bar */}
              <div className="flex items-center justify-between px-2 text-xs font-bold theme-text-muted">
                <div className="flex items-center gap-2">
                  <span>Page 1 - </span>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="bg-transparent border border-transparent hover:border-slate-400 focus:border-emerald-500 rounded px-1.5 py-0.5 theme-text-primary outline-none text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-white/10 text-slate-400"><ChevronUp className="w-4 h-4" /></button>
                  <button className="p-1 rounded hover:bg-white/10 text-slate-400"><ChevronDown className="w-4 h-4" /></button>
                  <button className="p-1 rounded hover:bg-white/10 text-slate-400"><Lock className="w-3.5 h-3.5" /></button>
                  <button className="p-1 rounded hover:bg-white/10 text-slate-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Realistic White A4 Paper Canvas */}
              <div 
                className="w-full bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-300 p-10 md:p-16 space-y-6 font-['Tajawal'] select-text"
                style={{ fontSize: `${fontSize}px`, lineHeight: 2.0 }}
              >
                <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-['IBM_Plex_Sans_Arabic']">
                    {result?.translated_title || pageTitle}
                  </h1>
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-3 pt-1">
                    <span>المستند الأصلي: <b>{activeDoc?.filename || 'Lab 5.pdf'}</b></span>
                    <span>•</span>
                    <span>الترجمة: <b>{sourceLang.toUpperCase()} ➔ {targetLang.toUpperCase()}</b></span>
                    <span>•</span>
                    <span>التاريخ: <b>{new Date().toLocaleDateString('ar-EG')}</b></span>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-justify font-medium leading-loose space-y-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {result?.full_translated_text || 'يرجى الضغط على زر «Translate» لبدء ترجمة المستند وتوليد الصفحة الأكاديمية.'}
                  </ReactMarkdown>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>منصة المساعد الأكاديمي الذكي (EduAI Platform - Canva Translate Studio)</span>
                  <span>صفحة 1 من 1</span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Interlinear Line-by-Line Paper Sheet (Bilingual Book Flow - Zero Copy Buttons) */}
          {mode === 'line_by_line' && (
            <div 
              className="w-full max-w-[860px] space-y-2 transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            >
              <div className="flex items-center justify-between px-2 text-xs font-bold theme-text-muted">
                <div className="flex items-center gap-2">
                  <span>Page 1 - </span>
                  <span>الترجمة السطرية الموازية (Bilingual Flow)</span>
                </div>
                <span className="text-xs text-emerald-600 font-bold">نسق الكتاب الأكاديمي المعتمد</span>
              </div>

              <div 
                className="w-full bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-300 p-10 md:p-16 space-y-6 font-['Tajawal'] select-text"
                style={{ fontSize: `${fontSize}px`, lineHeight: 2.0 }}
              >
                <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight font-['IBM_Plex_Sans_Arabic']">
                    الترجمة السطرية الموازية (Line-by-Line Parallel Translation)
                  </h1>
                  <p className="text-xs text-slate-500 font-semibold">
                    المستند: {activeDoc?.filename || 'Lab 5.pdf'} • النمط: كتاب أكاديمي ثنائي اللغة
                  </p>
                </div>

                {result?.units && result.units.length > 0 ? (
                  <div className="space-y-6">
                    {result.units.map((unit, idx) => (
                      <div key={idx} className="pb-5 border-b border-dashed border-slate-200 last:border-b-0 space-y-2">
                        <div className="font-['Inter',sans-serif] text-sm text-slate-500 dir-ltr text-left leading-relaxed">
                          {unit.original}
                        </div>
                        <div className="font-bold text-slate-900 text-right leading-loose">
                          {unit.translated}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold text-sm">
                    اضغط على زر «Translate» لبدء استخراج وترجمة الأسطر الموازية.
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4 mt-8 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span>EduAI Canva Translate Engine</span>
                  <span>صفحة 1 من 1</span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: Page by Page Consecutive White A4 Sheets */}
          {mode === 'page_by_page' && (
            <div 
              className="w-full max-w-[860px] space-y-8 transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            >
              {/* Sheet 1: Original English Page on White Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-bold theme-text-muted">
                  <span className="font-bold text-slate-300">Page 1 - Original Source Content (English)</span>
                  <span className="px-2.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">ORIGINAL (EN)</span>
                </div>

                <div 
                  className="w-full bg-white text-slate-800 shadow-2xl rounded-xl border border-slate-300 p-10 md:p-14 space-y-6 font-['Inter',sans-serif] dir-ltr text-left select-text"
                  style={{ fontSize: `${fontSize - 1}px`, lineHeight: 1.85 }}
                >
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <h2 className="text-xl font-bold text-slate-900">Original Document Content</h2>
                    <span className="text-xs text-slate-400">Page 1 of {result?.parallel_pages?.length || 1}</span>
                  </div>

                  <div className="prose prose-slate max-w-none leading-relaxed space-y-3">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {result?.parallel_pages?.[0]?.original_text || result?.units?.map(u => u.original).slice(0, 10).join('\n\n') || 'Original page content will appear here.'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* Sheet 2: Certified Arabic Translation on White Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-bold theme-text-muted">
                  <span className="font-bold text-emerald-500">صفحة 1 - الترجمة الأكاديمية المعتمدة (العربية)</span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">CERTIFIED (AR)</span>
                </div>

                <div 
                  className="w-full bg-white text-slate-900 shadow-2xl rounded-xl border-2 border-emerald-500/40 p-10 md:p-14 space-y-6 font-['Tajawal'] select-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 2.0 }}
                >
                  <div className="border-b-2 border-slate-900 pb-3 text-center">
                    <h2 className="text-xl font-black text-slate-900 font-['IBM_Plex_Sans_Arabic']">الترجمة الأكاديمية المعتمدة</h2>
                    <span className="text-xs text-slate-500 font-bold">صفحة 1 من {result?.parallel_pages?.length || 1}</span>
                  </div>

                  <div className="prose prose-slate max-w-none text-justify font-medium leading-loose space-y-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {result?.parallel_pages?.[0]?.translated_text || result?.full_translated_text || 'الترجمة الأكاديمية ستظهر هنا.'}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Canva Add Page Button */}
          <button 
            onClick={onOpenUpload}
            className="w-full max-w-[860px] py-3 rounded-xl border border-dashed border-slate-400 dark:border-slate-700 hover:border-emerald-500 text-xs font-bold theme-text-muted hover:text-emerald-500 transition flex items-center justify-center gap-2 cursor-pointer bg-white/5"
          >
            <Plus className="w-4 h-4" />
            <span>Add page / إضافة مادة أخرى للمستند</span>
          </button>

        </main>

      </div>

    </div>
  );
}
