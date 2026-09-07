import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Presentation,
  Sparkles,
  Wand2,
  FileDown,
  Image as ImageIcon,
  Trash2,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  BadgeCheck,
  AlertCircle,
  MonitorPlay,
  FileArchive,
  FileText,
  KeyRound,
  SlidersHorizontal,
  Type,
  FileUp,
  BookOpen,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Settings2,
  Library,
  Play,
  Plus,
  Minus,
  LayoutGrid
} from 'lucide-react';
import {
  generatePresentation,
  savePresentationDeck,
  renderPresentation,
  fetchPresentations,
  fetchPresentation,
  deletePresentation,
  downloadPresentation,
  presentationSlideUrl,
  fetchDocuments,
  getApiKey,
  fetchTemplates
} from '../services/api';
import TemplateModal from './TemplateModal';

const THEMES = [
  { id: 'academic', label: 'أكاديمي هادئ', desc: 'أزرق فاتح، نظيف، مناسب للمقررات والمشاريع الجامعية', swatches: 'from-sky-500 to-blue-700', base: 'academic' },
  { id: 'dark-tech', label: 'تقني داكن', desc: 'واجهات داكنة، أنيق لعروض الابتكار ومشاريع التخرج التقنية', swatches: 'from-slate-800 to-slate-950', base: 'dark-tech' }
];

const SOURCES = [
  { id: 'text', label: 'نص حر', desc: 'اكتب وصف مشروعك مباشرة', icon: Type },
  { id: 'doc_full', label: 'ملف كامل', desc: 'يستخرج العرض من كامل المستند المرفوع', icon: FileUp },
  { id: 'doc_pages', label: 'صفحات محددة', desc: 'نطاق صفحات محدد من المستند', icon: Shuffle }
];

const LIBRARY_PAGE_SIZE = 6;

/* ──────────────────────────────────────────────────────────────────────
   مكوّن قسم قابل للطي (Accordion) — CSS Grid لحلقة مضمّنة لسماكة السطر
   ────────────────────────────────────────────────────────────────────── */
function Collapsible({ title, subtitle, icon: Icon, badge, open, onToggle, tone = 'slate', children }) {
  const toneMap = {
    slate: 'from-slate-500 to-slate-700',
    emerald: 'from-emerald-500 to-teal-600',
    violet: 'from-violet-500 to-indigo-600',
    sky: 'from-sky-500 to-blue-600'
  };
  return (
    <div className="glass-panel rounded-3xl border shadow-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 md:p-5 text-right transition cursor-pointer hover:bg-white/5"
        aria-expanded={open}
      >
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br ${toneMap[tone] || toneMap.slate} flex items-center justify-center text-white shadow-lg shrink-0`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm md:text-base font-black theme-text-primary">{title}</h3>
            {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">{badge}</span>}
          </div>
          {subtitle && <p className="text-[11px] md:text-xs theme-text-secondary mt-0.5 truncate">{subtitle}</p>}
        </div>
        <span className={`theme-text-muted transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="p-4 md:p-5 pt-1 md:pt-2 border-t border-white/5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* حالة: خط قلطي صغير مطوّع */
function InlineError({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-xs theme-text-primary">
      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      <span className="font-bold">{msg}</span>
    </div>
  );
}
function InlineNotice({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 text-xs theme-text-primary">
      <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      <span className="font-bold">{msg}</span>
    </div>
  );
}

export default function PresentationView({ onOpenApiKey }) {
  const [text, setText] = useState('');
  const [theme, setTheme] = useState('academic'); // 'academic' | 'dark-tech' | identity object
  const [slideMin, setSlideMin] = useState(8);
  const [slideMax, setSlideMax] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  const [currentId, setCurrentId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [deckText, setDeckText] = useState('');
  const [deckJson, setDeckJson] = useState(null);
  const [savingJson, setSavingJson] = useState(false);

  const [previews, setPreviews] = useState([]);

  const [library, setLibrary] = useState([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [libPage, setLibPage] = useState(1);

  const apiKeyMissing = !getApiKey();
  const [source, setSource] = useState('text');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocMeta, setSelectedDocMeta] = useState(null);

  /* أقسام قابلة للطي */
  const [openSource, setOpenSource] = useState(true);
  const [openEditor, setOpenEditor] = useState(false);
  const [openLibrary, setOpenLibrary] = useState(false);
  const [openPreviews, setOpenPreviews] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const sectionRefs = useRef({ source: null, editor: null, library: null });

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadLibrary = async () => {
    setLoadingLib(true);
    try {
      const data = await fetchPresentations();
      const items = data.presentations || [];
      setLibrary(items);
      localStorage.setItem('eduai_presentations_v1', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLib(false);
    }
  };

  useEffect(() => { loadLibrary(); }, []);

  const loadCustomTemplates = async () => {
    try {
      const data = await fetchTemplates();
      setCustomTemplates(data.templates || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadCustomTemplates(); }, []);

  const loadDocs = async () => {
    setLoadingDocs(true);
    try {
      const data = await fetchDocuments({ limit: 100 });
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => { if (source !== 'text') loadDocs(); }, [source]);

  /* تجزئة المكتبة لترقيم الصفحات */
  const totalLibPages = Math.max(1, Math.ceil(library.length / LIBRARY_PAGE_SIZE));
  const safeLibPage = Math.min(libPage, totalLibPages);
  const libraryPage = useMemo(() => {
    const start = (safeLibPage - 1) * LIBRARY_PAGE_SIZE;
    return library.slice(start, start + LIBRARY_PAGE_SIZE);
  }, [library, safeLibPage]);

  useEffect(() => { if (safeLibPage > 1 && libraryPage.length === 0) setLibPage(Math.max(1, safeLibPage - 1)); }, [safeLibPage, libraryPage.length]);

  const openPres = async (pres) => {
    setError('');
    setNotice('');
    setOpenEditor(true);
    setOpenPreviews(true);
    try {
      const detail = await fetchPresentation(pres.presentation_id || pres.id);
      setCurrentId(detail.presentation_id || detail.id);
      setCurrentTitle(detail.title || pres.title || 'عرض تقديمي');
      const deck = detail.deck;
      setDeckJson(deck);
      setDeckText(deck ? JSON.stringify(deck, null, 2) : '');
      setShowJson(false);
      const n = Number(detail.slide_count || (deck && deck.slides ? deck.slides.length : 0) || 0);
      if (detail.status === 'rendered' && n > 0) {
        const arr = [];
        for (let i = 1; i <= n; i++) arr.push(presentationSlideUrl(detail.presentation_id || detail.id, i));
        setPreviews(arr);
      } else {
        setPreviews([]);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const handleApplyTemplate = async (tpl) => {
    setTheme((prev) => {
      const identity = {
        base: tpl.base || (tpl.id === 'tpl_dark_tech' ? 'dark-tech' : 'academic'),
        id: tpl.id,
        name: tpl.title,
        description: tpl.description,
        colors: tpl.colors || {},
        fonts: tpl.fonts || {},
        accent: tpl.accent || (tpl.base === 'dark-tech' ? 'sky' : 'navy')
      };
      return identity;
    });
    setTemplateModalOpen(false);
    setNotice(`استخدمت الهوية: ${tpl.title || tpl.name || 'قالب مخصص'}.`);
    await loadCustomTemplates();
  };

  const handleGenerate = async () => {
    setError('');
    setNotice('');
    if (source === 'text' && !text.trim()) {
      setError('اكتب وصف مشروعك أو مقررك أولاً ليتمكن الذكاء الاصطناعي من بناء العرض.');
      return;
    }
    if ((source === 'doc_full' || source === 'doc_pages') && !selectedDocId) {
      setError('يرجى اختيار مستند من المكتبة أولاً.');
      return;
    }
    if (source === 'doc_pages') {
      const s = parseInt(startPage) || 1;
      const e = parseInt(endPage);
      if (!e || e < s) {
        setError('أدخل نطاق صفحات صحيح: الصفحة الأولى ≤ الصفحة الأخيرة.');
        return;
      }
    }

    setGenerating(true);
    try {
      const docId = (source === 'doc_full' || source === 'doc_pages') ? selectedDocId : null;
      const sp = source === 'doc_pages' ? (parseInt(startPage) || 1) : null;
      const ep = source === 'doc_pages' ? parseInt(endPage) : null;
      const sMin = parseInt(slideMin) || 8;
      const sMax = parseInt(slideMax) || 15;
      const result = await generatePresentation({
        text: source === 'text' ? text.trim() : '',
        theme,
        docId,
        startPage: sp,
        endPage: ep,
        slideMin: sMin,
        slideMax: sMax
      });
      setCurrentId(result.deck_id);
      setCurrentTitle(result.title || 'عرض تقديمي');
      setDeckJson(result.deck);
      setDeckText(JSON.stringify(result.deck, null, 2));
      setShowJson(false);
      setPreviews([]);
      setOpenEditor(true);
      setOpenPreviews(false);
      setOpenSource(false);
      const srcLabel = result.source || (source === 'text' ? 'نص حر' : source === 'doc_full' ? 'ملف كامل' : 'نطاق صفحات');
      setNotice(`تم التوليد من: ${srcLabel}. يمكنك الآن معاينة الشرائح وتحريرها قبل الرندر.`);
      await loadLibrary();
      setTimeout(() => scrollTo('editor'), 150);
    } catch (e) {
      setError(e.message || 'فشل توليد العرض. تأكد من إعداد مفتاح الذكاء الاصطناعي.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveJson = async () => {
    if (!currentId) return;
    setError('');
    setSavingJson(true);
    try {
      const parsed = JSON.parse(deckText);
      const result = await savePresentationDeck(currentId, parsed);
      setDeckJson(result.deck);
      setDeckText(JSON.stringify(result.deck, null, 2));
      setCurrentTitle(result.title || currentTitle);
      setNotice('تم حفظ التعديلات على هيكل العرض.');
    } catch (e) {
      if (e instanceof SyntaxError) setError('JSON غير صالح: تأكد من علامات الاقتباس والفواصل.');
      else setError(e.message || 'فشل حفظ التعديلات.');
    } finally {
      setSavingJson(false);
    }
  };

  const handleRender = async () => {
    if (!currentId) return;
    setError('');
    setNotice('');
    setRendering(true);
    try {
      const result = await renderPresentation(currentId);
      const n = Number(result.slide_count || 0);
      if (n > 0) {
        const arr = [];
        for (let i = 1; i <= n; i++) arr.push(presentationSlideUrl(currentId, i, Date.now()));
        setPreviews(arr);
        setOpenPreviews(true);
      } else {
        setPreviews([]);
        setOpenPreviews(false);
      }
      setNotice('تم الرندر بنجاح: PPTX + PDF + صور الشرائح جاهزة للتحميل.');
      await loadLibrary();
    } catch (e) {
      setError(e.message || 'فشل الرندر. تأكد من توافر محرك Chrome على الخادم.');
    } finally {
      setRendering(false);
    }
  };

  const handleDelete = async (pres, e) => {
    e.stopPropagation();
    if (!window.confirm('حذف هذا العرض التقديمي نهائياً؟ سيتم أيضاً تحرير مساحة الخادم.')) return;
    setDeletingId(pres.presentation_id || pres.id);
    try {
      await deletePresentation(pres.presentation_id || pres.id);
      if (currentId === (pres.presentation_id || pres.id)) {
        setCurrentId(null);
        setDeckJson(null);
        setDeckText('');
        setPreviews([]);
        setOpenEditor(false);
      }
      await loadLibrary();
    } catch (err) {
      alert(`فشل الحذف: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadges = {
    draft: <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-300 text-[10px] font-bold">مسودة</span>,
    rendering: (
      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> قيد الرندر
      </span>
    ),
    rendered: <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">جاهز</span>,
    error: <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">فشل</span>
  };

  const slideCount = deckJson && Array.isArray(deckJson.slides) ? deckJson.slides.length : 0;
  const themeLabel = typeof theme === 'string'
    ? (THEMES.find(t => t.id === theme)?.label || theme)
    : (theme?.name || theme?.title || theme?.base || 'هوية مخصصة');
  const activeIdentity = typeof theme === 'object' && theme !== null;
  const isDarkIdentity = typeof theme === 'string' ? theme === 'dark-tech' : theme?.base === 'dark-tech';
  const stepActive = (n) => {
    if (n === 1) return true;
    if (n === 2) return !!currentId;
    return library.length > 0;
  };

  return (
    <div className="animate-fade-in font-['Tajawal'] space-y-4 max-w-5xl mx-auto">
      {/* رأس مضغوط (بدل hero ضخم) */}
      <header className="flex flex-wrap items-center gap-3 glass-panel rounded-3xl border shadow-2xl px-5 py-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
          <Presentation className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-black theme-text-primary">مولّد العروض التقديمية</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">AI Deck Studio</span>
          </div>
          <p className="text-[11px] md:text-xs theme-text-secondary mt-0.5 truncate">
            وصف أو مستند ← ملف عرض تقديمي (PPTX + PDF) بهوية عربية احترافية، قابل للتحرير ثم الرندر.
          </p>
        </div>
        {apiKeyMissing && (
          <button
            onClick={onOpenApiKey}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" /> ضبط المفتاح
          </button>
        )}
      </header>

      {/* مؤشر تقدم (Stepper) */}
      <nav className="flex items-center gap-2 md:gap-4 px-1 py-1 overflow-x-auto" aria-label="خطوات الإنشاء">
        {[
          { n: 1, label: 'التهيئة', icon: Settings2, active: stepActive(1), go: () => { setOpenSource(true); scrollTo('source'); } },
          { n: 2, label: 'التوليد والرندر', icon: Play, active: stepActive(2), go: () => { if (currentId) { setOpenEditor(true); scrollTo('editor'); } } },
          { n: 3, label: 'المكتبة', icon: Library, active: stepActive(3), go: () => { setOpenLibrary(true); scrollTo('library'); } }
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <span className={`h-px w-6 md:w-12 shrink-0 ${s.active ? 'bg-emerald-500/60' : 'bg-white/10'}`} />}
            <button
              type="button"
              onClick={s.go}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                s.active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'theme-card-inner border theme-text-muted hover:theme-text-primary'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      {(error || notice) && (
        <div className="space-y-2">
          <InlineError msg={error} />
          <InlineNotice msg={notice} />
        </div>
      )}

      {/* ═══ القسم 1: التهيئة (المصدر + الهوية) ═══ */}
      <div ref={(el) => (sectionRefs.current.source = el)}>
        <Collapsible
          title="التهيئة"
          subtitle="اختر مصدر المحتوى (نص حر أو مستند) ثم الهوية البصرية للعرض"
          icon={Settings2}
          tone="emerald"
          badge={currentId ? 'يمكن التعديل' : 'الخطوة الأولى'}
          open={openSource}
          onToggle={() => setOpenSource(!openSource)}
        >
          <div>
            <p className="text-[11px] font-black theme-text-primary mb-2.5 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" /> مصدر المحتوى
            </p>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {SOURCES.map((s) => {
                const Icon = s.icon;
                const isActive = source === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSource(s.id); setSelectedDocId(''); setSelectedDocMeta(null); setStartPage(1); setEndPage(''); }}
                    className={`text-right rounded-2xl p-3.5 border transition cursor-pointer ${
                      isActive ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20' : 'theme-card-inner hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-500' : 'theme-text-muted'}`} />
                      <span className={`text-xs font-black ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-primary'}`}>{s.label}</span>
                    </div>
                    <span className="block text-[10px] theme-text-secondary mt-1 leading-tight">{s.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* نص حر */}
            {source === 'text' && (
              <div className="mt-4">
                <label className="text-[11px] font-black theme-text-primary block mb-1.5">وصف المشروع / المقرر</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder={'مثال:\nمشروع تخرج: منصة تعليمية ذكية تدمج الذكاء الاصطناعي لإنشاء الاختبارات والتلخيصات لطلاب الجامعة، مع لوحة تحكم للمشرفين ومكتبة مقررات، وتقارير أداء محوّلة إلى ملفات Word. تشمل خطة العمل: تحليل المشكلة، أهداف الحل، البنية التقنية FastAPI + React، مراحل التنفيذ، مقارنة بالأنظمة المنافسة، والنتائج المتوقعة.'}
                  className="w-full rounded-2xl theme-card-inner border p-4 text-sm theme-text-primary placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-emerald-500/50 resize-y font-['Tajawal'] leading-relaxed"
                />
              </div>
            )}

            {/* مستند */}
            {(source === 'doc_full' || source === 'doc_pages') && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-black theme-text-primary block mb-1.5">المستند من مكتبتك</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDocId(val);
                      const doc = documents.find(d => d.id === val || d.doc_id === val);
                      setSelectedDocMeta(doc || null);
                      if (doc) { setStartPage(1); setEndPage(String(doc.pages_count || 1)); }
                    }}
                    className="w-full rounded-2xl theme-card-inner border p-3 text-sm theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-['Tajawal'] appearance-none cursor-pointer"
                  >
                    <option value="">-- اختر مستنداً مرفوعاً --</option>
                    {documents.map(d => (
                      <option key={d.id || d.doc_id} value={d.id || d.doc_id}>
                        {d.filename} — {d.pages_count} صفحة، {d.words_count?.toLocaleString?.() || d.words_count} كلمة
                      </option>
                    ))}
                  </select>
                  {loadingDocs && <span className="text-[11px] theme-text-muted mt-1 inline-block">... جاري تحميل قائمة المستندات</span>}
                  {selectedDocMeta && (
                    <div className="flex items-center gap-2.5 mt-2 text-[11px] theme-text-secondary">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{selectedDocMeta.filename} — {selectedDocMeta.pages_count} صفحة، {selectedDocMeta.words_count?.toLocaleString?.() || selectedDocMeta.words_count} كلمة</span>
                    </div>
                  )}
                </div>

                {source === 'doc_pages' && selectedDocId && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
                    <Shuffle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold theme-text-primary">من الصفحة:</span>
                    <input
                      type="number"
                      min={1}
                      max={selectedDocMeta?.pages_count || 999}
                      value={startPage}
                      onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                      className="w-16 rounded-xl theme-card-inner border p-2 text-xs text-center font-mono theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <span className="text-xs theme-text-secondary">إلى الصفحة:</span>
                    <input
                      type="number"
                      min={startPage || 1}
                      max={selectedDocMeta?.pages_count || 999}
                      value={endPage}
                      onChange={(e) => setEndPage(e.target.value)}
                      placeholder={selectedDocMeta?.pages_count ? String(selectedDocMeta.pages_count) : '—'}
                      className="w-16 rounded-xl theme-card-inner border p-2 text-xs text-center font-mono theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <span className="text-[11px] theme-text-muted">(من أصل {selectedDocMeta?.pages_count || '—'} صفحة)</span>
                  </div>
                )}

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  placeholder="تعليمات إضافية اختيارية (مثلاً: ركّز على الفصل الثاني، أو أضف شريحة إحصائيات)..."
                  className="w-full rounded-2xl theme-card-inner border p-3 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y font-['Tajawal'] leading-relaxed"
                />
              </div>
            )}

            {/* الهوية البصرية */}
            <div className="flex items-center justify-between mt-5 mb-2.5">
              <p className="text-[11px] font-black theme-text-primary flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-500" /> الهوية البصرية
              </p>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-500 text-[11px] font-bold hover:bg-violet-500/25 transition cursor-pointer"
              >
                <Library className="w-3 h-3" /> معرض القوالب والألوان
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`text-right rounded-2xl p-4 border transition cursor-pointer ${
                    theme === t.id ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20' : 'theme-card-inner hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-2 rounded-full bg-gradient-to-r ${t.swatches}`}></span>
                    {theme === t.id && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <span className="block font-black text-sm theme-text-primary mt-2">{t.label}</span>
                  <span className="block text-[11px] theme-text-secondary mt-1 leading-relaxed">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* القوالب المخصصة المختارة */}
            {isDarkIdentity && (
              <div className="flex items-center gap-2 rounded-2xl p-3 border theme-card-inner mt-2.5">
                <span className="w-3 h-3 rounded-full" style={{ background: (theme?.colors?.main || '#4cc2ff') }}></span>
                <span className="text-[11px] font-black theme-text-primary flex-1">{theme?.name || theme?.title || 'هوية مخصصة'}</span>
                <button
                  type="button"
                  onClick={() => setTheme('academic')}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition cursor-pointer"
                >
                  إزالة
                </button>
              </div>
            )}
            {activeIdentity && !isDarkIdentity && (
              <div className="flex items-center gap-2 rounded-2xl p-3 border theme-card-inner mt-2.5">
                <span className="w-3 h-3 rounded-full" style={{ background: (theme?.colors?.navy || '#0F2D4A') }}></span>
                <span className="text-[11px] font-black theme-text-primary flex-1">{theme?.name || theme?.title || 'هوية مخصصة'}</span>
                <button
                  type="button"
                  onClick={() => setTheme('academic')}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition cursor-pointer"
                >
                  إزالة
                </button>
              </div>
            )}

            {/* نطاق عدد الشرائح */}
            <p className="text-[11px] font-black theme-text-primary mt-5 mb-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" /> عدد الشرائح
            </p>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] theme-text-secondary">من</span>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={slideMin}
                  onChange={(e) => { const v = Math.min(30, Math.max(5, parseInt(e.target.value) || 5)); setSlideMin(v); setSlideMax((m) => Math.max(v, parseInt(m) || v)); }}
                  className="w-16 rounded-xl theme-card-inner border p-2 text-center text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <span className="text-[11px] theme-text-muted">إلى</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={slideMax}
                  onChange={(e) => { const v = Math.min(30, Math.max(5, parseInt(e.target.value) || 5)); setSlideMax(v); setSlideMin((m) => Math.min(v, parseInt(m) || v)); }}
                  className="w-16 rounded-xl theme-card-inner border p-2 text-center text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[11px] theme-text-muted">شريحة</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || apiKeyMissing}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {generating ? 'جاري بناء العرض...' : 'توليد هيكل العرض'}
              </button>
              <span className="text-[11px] theme-text-muted">
                {source === 'text' && 'يولّد محتوى كاملاً من وصفك: غلاف، محاور، إحصائيات، رسوم بيانية، جدول زمني وجدول.'}
                {source === 'doc_full' && 'يولّد العرض من كل محتوى المستند المختار مع تحليل ذكي للمحاور.'}
                {source === 'doc_pages' && `يولّد العرض من الصفحات ${startPage || 1}–${endPage || '—'} فقط.`}
              </span>
            </div>
          </div>
        </Collapsible>
      </div>

      {/* ═══ القسم 2: التوليد والرندر ═══ */}
      {currentId && (
        <div ref={(el) => (sectionRefs.current.editor = el)}>
          <Collapsible
            title={currentTitle}
            subtitle={`عدد الشرائح: ${slideCount} • الهوية: ${themeLabel}`}
            icon={Play}
            tone="violet"
            badge="الخطوة الثانية"
            open={openEditor}
            onToggle={() => setOpenEditor(!openEditor)}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:text-emerald-500 hover:border-emerald-500/40 transition cursor-pointer"
                >
                  {showJson ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showJson ? 'إخفاء محرر JSON' : 'تحرير الهيكل (JSON)'}
                </button>
                <button
                  type="button"
                  onClick={handleRender}
                  disabled={rendering}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorPlay className="w-4 h-4" />}
                  {rendering ? 'جاري الرندر (المحرك يعمل...)' : 'رندر العرض (PPTX + PDF)'}
                </button>
                {previews.length > 0 && (
                  <span className="text-[11px] theme-text-muted flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" /> آخر رندر مكتمل
                  </span>
                )}
              </div>

              {/* محرر JSON قابل للطي */}
              {showJson && (
                <div className="space-y-3 animate-fade-in mb-4">
                  <textarea
                    value={deckText}
                    onChange={(e) => setDeckText(e.target.value)}
                    rows={12}
                    dir="ltr"
                    spellCheck={false}
                    className="w-full rounded-2xl theme-card-inner border p-4 text-[11px] font-mono text-left theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y leading-relaxed"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveJson}
                      disabled={savingJson}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {savingJson ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      حفظ التعديلات
                    </button>
                    <span className="text-[11px] theme-text-muted">يمكن تحرير النصوص والأرقام والأيقونات مباشرة في الهيكل قبل الرندر.</span>
                  </div>
                </div>
              )}

              {/* أزرار التنزيل دع رؤية سريعة */}
              {!showJson && previews.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[11px] theme-text-muted">تنزيل:</span>
                  <button onClick={() => downloadPresentation(currentId, 'pptx', currentTitle)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer">
                    <FileText className="w-3.5 h-3.5" /> PPTX
                  </button>
                  <button onClick={() => downloadPresentation(currentId, 'pdf', currentTitle)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer">
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={() => downloadPresentation(currentId, 'zip', currentTitle)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl theme-card-inner border text-xs font-bold theme-text-primary hover:border-emerald-500/40 transition cursor-pointer">
                    <FileArchive className="w-3.5 h-3.5" /> PNG (Zip)
                  </button>
                </div>
              )}

              {/* معرض الشرائح قابل للطي */}
              {previews.length > 0 && (
                <div className="animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setOpenPreviews(!openPreviews)}
                    className="w-full flex items-center justify-between rounded-2xl theme-card-inner border px-4 py-3 text-xs font-black theme-text-primary transition cursor-pointer hover:border-emerald-500/40"
                    aria-expanded={openPreviews}
                  >
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-500" /> معاينة الشرائح ({previews.length})
                    </span>
                    <span className="theme-text-muted transition-transform duration-300">
                      <ChevronDown className={`w-4 h-4 ${openPreviews ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {openPreviews && (
                    <div className="pt-3 animate-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {previews.map((src, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden theme-card-inner border shadow-xl group relative">
                          <img
                            src={src}
                            alt={`شريحة ${idx + 1}`}
                            className="w-full aspect-[16/9] object-cover bg-white transition group-hover:scale-[1.03] duration-300"
                            loading="lazy"
                          />
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur-sm">
                            {idx + 1} / {previews.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previews.length === 0 && !showJson && (
                <p className="text-[11px] theme-text-muted">اضغط «رندر العرض» لإنشاء ملف PPTX + PDF ومعاينة الشرائح.</p>
              )}
            </div>
          </Collapsible>
        </div>
      )}

      {/* ═══ القسم 3: المكتبة ═══ */}
      <div ref={(el) => (sectionRefs.current.library = el)}>
        <Collapsible
          title="مكتبة عروضي"
          subtitle={library.length ? `${library.length} عرض محفوظ` : 'العروض المولّدة تخزَّن هنا حتّى تُنزَّل أو تحذف'}
          icon={Library}
          tone="sky"
          badge="الخطوة الثالثة"
          open={openLibrary}
          onToggle={() => setOpenLibrary(!openLibrary)}
        >
          <div>
            {library.length === 0 ? (
              <div className="rounded-2xl theme-card-inner border border-dashed p-8 text-center space-y-2">
                <Presentation className="w-8 h-8 text-emerald-500/40 mx-auto" />
                <p className="text-xs theme-text-secondary font-bold">لا توجد عروض بعد. ابدأ من قسم التهيئة ثم اضغط «توليد هيكل العرض».</p>
              </div>
            ) : (
              <div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {libraryPage.map((pres) => {
                    const pid = pres.presentation_id || pres.id;
                    const isCurrent = currentId === pid;
                    const st = pres.status || 'draft';
                    return (
                      <div
                        key={pid}
                        onClick={() => openPres(pres)}
                        className={`rounded-2xl p-3.5 border transition cursor-pointer ${
                          isCurrent ? 'border-emerald-500/50 bg-emerald-500/10' : 'theme-card-inner hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                            <Presentation className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-black theme-text-primary truncate">{pres.title || 'عرض تقديمي'}</span>
                            <span className="block text-[11px] theme-text-muted mt-0.5">
                              {pres.slide_count ? `${pres.slide_count} شريحة` : 'مسودة'} • {new Date(pres.updated_at || pres.created_at || Date.now()).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {statusBadges[st] || statusBadges.draft}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(pres, e)}
                              disabled={deletingId === pid}
                              className="p-2 rounded-xl theme-card-inner border text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              title="حذف العرض"
                            >
                              {deletingId === pid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        {st === 'error' && pres.error && (
                          <p className="mt-2 text-[11px] text-rose-500 font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" /> {pres.error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ترقيم الصفحات */}
                {totalLibPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setLibPage((p) => Math.max(1, p - 1))}
                      disabled={safeLibPage <= 1}
                      className="p-1.5 rounded-lg theme-card-inner border text-xs theme-text-secondary transition disabled:opacity-30 cursor-pointer"
                      title="السابق"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] theme-text-muted font-bold">صفحة {safeLibPage} من {totalLibPages}</span>
                    <button
                      type="button"
                      onClick={() => setLibPage((p) => Math.min(totalLibPages, p + 1))}
                      disabled={safeLibPage >= totalLibPages}
                      className="p-1.5 rounded-lg theme-card-inner border text-xs theme-text-secondary transition disabled:opacity-30 cursor-pointer"
                      title="التالي"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={loadLibrary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:text-emerald-500 hover:border-emerald-500/40 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLib ? 'animate-spin' : ''}`} /> تحديث
              </button>
            </div>
          </div>
        </Collapsible>
      </div>

      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApply={handleApplyTemplate}
      />
    </div>
  );
}
