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
import { renderMarkdownToHtml } from '../services/exportService';

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

  const handlePrint = () => {
    if (!result) return;
    const printWin = window.open('', '_blank', 'width=900,height=1200');
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة (Popups) لمعاينة وطباعة ملف الـ PDF');
      return;
    }
    let bodyHtml = '';
    const docName = activeDoc?.filename || 'مستند أكاديمي';
    const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    if (mode === 'line_by_line' && result?.units?.length) {
      const rows = result.units.map(u => `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left;direction:ltr;color:#475569;font-size:13px;">${u.original || ''}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;direction:rtl;font-weight:700;">${u.translated || ''}</td>
        </tr>
      `).join('');
      bodyHtml = `
        <div style="margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:13.5px;">
            <thead><tr style="background:#1e3a8a;color:#fff;"><th style="padding:10px;text-align:left;">Original (${sourceLang.toUpperCase()})</th><th style="padding:10px;text-align:right;">الترجمة (${targetLang.toUpperCase()})</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    } else {
      const md = result?.full_translated_text || result?.parallel_pages?.[0]?.translated_text || '';
      bodyHtml = `<div class="prose-content">${renderMarkdownToHtml(md)}</div>`;
    }

    const htmlDoc = `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
      <meta charset="UTF-8">
      <title>ترجمة أكاديمية - ${docName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&family=IBM+Plex+Sans+Arabic:wght@700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Tajawal',sans-serif;background:#fff;color:#0f172a;padding:40px;line-height:1.9;font-size:14px}
        .page-header{border-bottom:2.5px solid #1e3a8a;padding-bottom:16px;margin-bottom:24px}
        .page-header h1{font-family:'IBM Plex Sans Arabic',sans-serif;font-size:22px;font-weight:800;color:#1e3a8a;margin-bottom:4px}
        .page-header p{font-size:12px;color:#64748b;font-weight:700}
        .prose-content{font-size:14.5px;line-height:1.95;direction:rtl;text-align:justify}
        .prose-content h1,.prose-content h2,.prose-content h3{font-family:'IBM Plex Sans Arabic',sans-serif;color:#1e3a8a;margin-top:18px;margin-bottom:6px;font-weight:700}
        .prose-content h2{font-size:17px;color:#0284c7}
        .prose-content p{margin-bottom:12px}
        .page-footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:10px;color:#94a3b8}
        @media print{body{padding:0;font-size:12pt}.page-header{page-break-after:avoid}}
      </style>
    </head><body>
      <div class="page-header">
        <h1>${result?.translated_title || pageTitle}</h1>
        <p>المستند: ${docName} • الترجمة: ${sourceLang.toUpperCase()} ➔ ${targetLang.toUpperCase()} • التاريخ: ${currentDate}</p>
      </div>
      ${bodyHtml}
      <div class="page-footer">تم الترجمة عبر منصة المساعد الأكاديمي الذكي (EduAI Platform)</div>
    </body></html>`;

    printWin.document.write(htmlDoc);
    printWin.document.close();
    printWin.onload = () => {
      setTimeout(() => {
        printWin.focus();
        printWin.print();
      }, 600);
    };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Main Canva Docs Translation Studio Layout */}
      <div className="tr-grid">
        
        {/* 1. LEFT: Canva Translate Side Panel */}
        <aside className="card tr-settings flex flex-col gap-5">
          
          {/* Canva Tabs (Translate / Settings) */}
          <div className="flex items-center gap-1.5 theme-bg-card p-1 rounded-2xl border w-fit">
            <button
              onClick={() => setCanvaTab('translate')}
              className={`pill text-xs px-4 py-2 font-extrabold transition cursor-pointer ${canvaTab === 'translate' ? 'sel' : ''}`}
            >
              Translate
            </button>
            <button
              onClick={() => setCanvaTab('settings')}
              className={`pill text-xs px-4 py-2 font-extrabold transition cursor-pointer ${canvaTab === 'settings' ? 'sel' : ''}`}
            >
              Settings
            </button>
          </div>

          {/* Tab 1 Content: Translate Controls */}
          {canvaTab === 'translate' && (
            <div className="space-y-4">
              
              {/* Language Selection */}
              <div className="space-y-1.5">
                <label className="lbl">الترجمة إلى (Translate to)</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="field w-full theme-text-primary text-xs font-bold outline-none focus:border-emerald-500"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
                <div className="tr-row">
                  <span className="text-xs theme-text-muted flex-1">المستند المصدر: <b className="theme-text-primary">{sourceLang.toUpperCase()}</b></span>
                  <button onClick={handleSwapLanguages} type="button" className="tr-swap" title="تبديل اللغتين">
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800"></div>

              {/* 3 Layout Modes Selection */}
              <div className="space-y-2">
                <label className="lbl">طريقة عرض الترجمة (Layout Mode)</label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    onClick={() => setMode('a4_sheet')}
                    className="btn-ghost"
                    style={{ minHeight: 64, flexDirection: 'column', gap: 4, fontSize: 11.5, ...(mode === 'a4_sheet' ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}) }}
                    title="الوضع 1: ورقة A4 كاملة (Canva Sheet)"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>ورقة A4</span>
                  </button>

                  <button
                    onClick={() => setMode('line_by_line')}
                    className="btn-ghost"
                    style={{ minHeight: 64, flexDirection: 'column', gap: 4, fontSize: 11.5, ...(mode === 'line_by_line' ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}) }}
                    title="الوضع 2: سطر بسطر (Bilingual Book)"
                  >
                    <Rows className="w-4 h-4" />
                    <span>سطر بسطر</span>
                  </button>

                  <button
                    onClick={() => setMode('page_by_page')}
                    className="btn-ghost"
                    style={{ minHeight: 64, flexDirection: 'column', gap: 4, fontSize: 11.5, ...(mode === 'page_by_page' ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}) }}
                    title="الوضع 3: صفحة بصفحة (White A4 Sheets)"
                  >
                    <Columns className="w-4 h-4" />
                    <span>صفحة بصفحة</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800"></div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="lbl">النطاق (Apply to page)</label>
                <div className="tr-row">
                  <span className="field" style={{ padding: '0 12px', display: 'inline-flex', alignItems: 'center' }}>الصفحة 1 — الحالية</span>
                  <span className="text-xs theme-text-muted">من {activeDoc?.pages_count || 1}</span>
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
                className="btn-primary w-full"
                style={{ fontSize: 13.5 }}
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
        <main className="tr-paper-wrap flex flex-col items-center gap-6 w-full">
          
          {/* Floating Canva Studio Toolbar (Zoom, Font Size & Export) */}
          <div className="tr-toolbar sticky top-20 z-40">
            
            {/* Font Size controls */}
            <div className="grp">
              <span className="text-[11px] text-slate-400 px-1">الخط:</span>
              <button 
                onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                className="tt-btn"
                title="تصغير الخط"
              >A-</button>
              <span className="font-mono text-emerald-400 px-1">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="tt-btn"
                title="تكبير الخط"
              >A+</button>
            </div>

            {/* Zoom controls */}
            <div className="grp">
              <span className="text-[11px] text-slate-400 px-1">الزوم:</span>
              <button onClick={() => setZoomScale(0.85)} className={`tt-btn ${zoomScale === 0.85 ? 'active' : ''}`}>85%</button>
              <button onClick={() => setZoomScale(1.0)} className={`tt-btn ${zoomScale === 1.0 ? 'active' : ''}`}>100%</button>
              <button onClick={() => setZoomScale(1.15)} className={`tt-btn ${zoomScale === 1.15 ? 'active' : ''}`}>115%</button>
            </div>

            {/* Export buttons */}
            <div className="grp">
              <button
                onClick={handleExportDocx}
                disabled={exportingDocx || !result}
                className="tt-btn flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                title="تصدير مستند Word (.docx) منسق"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>
              <button
                onClick={handlePrint}
                className="tt-btn cursor-pointer"
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
