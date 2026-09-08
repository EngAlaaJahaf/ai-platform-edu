import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Library,
  Sparkles,
  FileUp,
  Plus,
  Loader2,
  Trash2,
  Check,
  Palette,
  Wand2,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import {
  fetchTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplate,
  extractTemplateFromPptx
} from '../services/api';

const ACCENTS = [
  { id: 'gold', color: '#e3b341' },
  { id: 'sky', color: '#4cc2ff' },
  { id: 'purple', color: '#9b6bff' },
  { id: 'teal', color: '#3fd6c4' },
  { id: 'rose', color: '#ff7a90' },
];

const BLUEPRINT_HELP = {
  academic: ['navy', 'teal', 'bg', 'bg2', 'card', 'gray', 'line'],
  'dark-tech': ['main', 'bgDark', 'surface', 'text'],
};

const FONTS = [
  'Changa Fe', 'Cairo Fe', 'Tajawal', 'IBM Plex Sans Arabic', 'Almarai',
  'Noto Sans Arabic', 'Amiri', 'Aref Ruqaa', 'Markazi Text', 'Mada',
  'Mirza', 'Scheherazade New', 'Lateef', 'Reem Kufi', 'Zain',
  'El Messiri', 'Harmattan', 'Baloo Bhaijaan 2', 'Lalezar', 'Jomhuria',
  'Montserrat', 'Poppins', 'Inter', 'Roboto', 'Playfair Display',
];

const isWhitelistedFont = (name) =>
  FONTS.some((f) => String(name || '').trim().toLowerCase() === f.toLowerCase());

export default function TemplateModal({ isOpen, onClose, onApply }) {
  const [tab, setTab] = useState('gallery');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  // generate state
  const [goal, setGoal] = useState('');
  const [topic, setTopic] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  // pptx import state
  const [pptxName, setPptxName] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef(null);

  // manual state
  const [manual, setManual] = useState({
    title: '', description: '', base: 'academic',
    colors: {}, fonts: { fh: 'Changa Fe', fb: 'Cairo Fe' }, accent: 'gold'
  });
  const [saving, setSaving] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data.templates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTab('gallery');
      loadTemplates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (t) => setSelected(selected?.id === t.id ? null : t);
  const handleApply = () => {
    if (selected && onApply) onApply(selected);
  };

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setGenLoading(true);
    try {
      const saved = await generateTemplate({ goal, topic: topic.trim() || null });
      await loadTemplates();
      setGoal('');
      setTopic('');
      setTab('gallery');
      setSelected(saved);
    } catch (e) {
      alert(e.message || 'فشل توليد الهوية');
    } finally {
      setGenLoading(false);
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    setPptxName(file.name);
    setImportError('');
    setImportLoading(true);
    try {
      const blueprint = await extractTemplateFromPptx(file);
      await saveTemplate({
        title: blueprint.name || 'قالب مستورد',
        description: blueprint.description || '',
        base: blueprint.base || 'academic',
        colors: blueprint.colors || {},
        fonts: blueprint.fonts || {},
        accent: blueprint.accent || 'gold'
      });
      await loadTemplates();
      setPptxName('');
      setTab('gallery');
    } catch (e) {
      setPptxName('');
      setImportError(e.message || 'فشل استخراج الهوية من الملف');
    } finally {
      setImportLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleManualChange = (patch) => setManual((m) => ({ ...m, ...patch }));

  const handleSaveManual = async () => {
    if (!manual.title.trim()) return;
    setSaving(true);
    try {
      const saved = await saveTemplate({
        title: manual.title,
        description: manual.description,
        base: manual.base,
        colors: manual.colors,
        fonts: manual.fonts,
        accent: manual.accent
      });
      await loadTemplates();
      setManual({ title: '', description: '', base: 'academic', colors: {}, fonts: { fh: 'Changa Fe', fb: 'Cairo Fe' }, accent: 'gold' });
      setTab('gallery');
      setSelected(saved);
    } catch (e) {
      alert(e.message || 'فشل حفظ القالب');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('حذف هذا القالب؟')) return;
    try {
      await deleteTemplate(id);
      await loadTemplates();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert(err.message || 'فشل الحذف');
    }
  };

  const isBuiltIn = (t) => t.user_id === 'system';

  const tabs = [
    { id: 'gallery', label: 'المعرض', icon: Library },
    { id: 'generate', label: 'توليد AI', icon: Wand2 },
    { id: 'import', label: 'استيراد PPTX', icon: FileUp },
    { id: 'manual', label: 'مخصص يدوي', icon: Palette },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl card p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black theme-text-primary">مكتبة الهويات البصرية</h3>
              <p className="text-[11px] theme-text-secondary">إنشاء، استيراد، أو توليد قوالب هوية للعروض التقديمية</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl theme-card-inner hover:bg-rose-500/10 hover:text-rose-500 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tab === t.id ? 'bg-violet-500 text-slate-950 shadow-lg shadow-violet-500/25' : 'theme-card-inner theme-text-secondary hover:theme-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ===== GALLERY ===== */}
        {tab === 'gallery' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black theme-text-secondary flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5 text-violet-500" /> {loading ? 'جارٍ التحميل…' : `${templates.length} قالب`}
              </p>
              <button
                type="button"
                onClick={() => setTab('generate')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-500 text-[11px] font-bold hover:bg-violet-500/25 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> اطلب هوية جديدة
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {templates.map((t) => {
                const isSel = selected?.id === t.id;
                const colors = t.colors || {};
                const swatch = t.base === 'dark-tech'
                  ? [colors.main || '#4cc2ff', colors.bgDark || '#0b1220', colors.surface || '#121c33']
                  : [colors.navy || '#0F2D4A', colors.teal || '#20B2AA', colors.bg || '#F8F7F2'];
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(t)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(t)}
                    className={`text-right rounded-2xl p-3.5 border transition cursor-pointer ${
                      isSel ? 'border-violet-500/60 bg-violet-500/10 ring-2 ring-violet-500/25' : 'theme-card-inner hover:border-violet-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1.5">
                        {swatch.map((c, i) => (
                          <span key={i} className="w-7 h-2 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                      {isBuiltIn(t) && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-500 text-[10px] font-bold">مدمج</span>}
                      {isSel && <CheckCircle2 className="w-4 h-4 text-violet-500 mr-auto" />}
                    </div>
                    <div className="font-black text-sm theme-text-primary">{t.title}</div>
                    <div className="text-[11px] theme-text-secondary mt-0.5 leading-relaxed line-clamp-2">{t.description || (t.base === 'dark-tech' ? 'هوية داكنة' : 'هوية أكاديمية')}</div>
                    {!isBuiltIn(t) && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(t.id, e)}
                        className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> حذف
                      </button>
                    )}
                  </div>
                );
              })}
              {!loading && templates.length === 0 && (
                <div className="col-span-2 text-center py-8 text-xs theme-text-muted">
                  لا توجد قوالب بعد. استخدم "توليد AI" أو "استيراد PPTX" لإنشاء هوية.
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 rounded-xl theme-card-inner theme-text-secondary text-xs font-bold hover:bg-rose-500/10 transition cursor-pointer">إلغاء</button>
              <button
                type="button"
                disabled={!selected}
                onClick={handleApply}
                className="btn-primary"
                style={{ minHeight: 40, fontSize: 12.5, padding: '0 16px' }}
              >
                <Check className="w-3.5 h-3.5" /> استخدام هذه الهوية
              </button>
            </div>
          </div>
        )}

        {/* ===== GENERATE ===== */}
        {tab === 'generate' && (
          <div className="space-y-3">
            <div className="rounded-2xl theme-card-inner p-4 border space-y-3">
              <label className="block text-[11px] font-black theme-text-primary">الوصف / نوع الهوية المطلوبة</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                placeholder="مثال: هوية دافئة وترابية لشركة ناشئة في الأغذية العضوية، ألوان خضراء وبنية هادئة"
                className="w-full rounded-2xl theme-card-inner border p-3 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 resize-y font-['Tajawal'] leading-relaxed"
              />
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='موضوع العرض (اختياري): مثل "منصة تعليمية تقنية"'
                className="w-full rounded-2xl theme-card-inner border p-3 text-xs theme-text-primary placeholder:theme-text-muted focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-['Tajawal']"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={genLoading || !goal.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-slate-950 text-xs font-bold shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {genLoading ? 'جارٍ التصميم…' : 'صمّم الهوية الآن'}
              </button>
            </div>
          </div>
        )}

        {/* ===== IMPORT ===== */}
        {tab === 'import' && (
          <div className="space-y-3">
            <div className="rounded-2xl theme-card-inner p-4 border space-y-3">
              <p className="text-[11px] theme-text-secondary leading-relaxed">
                ارفع ملف PowerPoint (.pptx) وسنستخرج تلقائياً ألوان السمة وخطوطها لإنشاء هوية بصرية مطابقة، ثم تُضاف إلى معرض قوالبك.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pptx"
                onChange={(e) => handleImport(e.target.files?.[0])}
                className="block w-full text-xs theme-text-primary file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-500 file:text-slate-950 file:cursor-pointer hover:file:bg-violet-400 transition cursor-pointer"
              />
              {importLoading && (
                <div className="flex items-center gap-2 text-xs theme-text-secondary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" /> جارٍ استخراج الهوية من {pptxName || 'الملف'}…
                </div>
              )}
              {!importLoading && pptxName && <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">تم استيراد {pptxName} بنجاح</div>}
              {!importLoading && importError && (
                <div className="text-xs text-rose-500 font-bold">{importError}</div>
              )}
            </div>
          </div>
        )}

        {/* ===== MANUAL ===== */}
        {tab === 'manual' && (
          <div className="space-y-3">
            <div className="rounded-2xl theme-card-inner p-4 border space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-black theme-text-primary">عنوان الهوية *</span>
                  <input
                    value={manual.title}
                    onChange={(e) => handleManualChange({ title: e.target.value })}
                    placeholder="مثل: هوية مؤسسية هادئة"
                    className="mt-1 w-full rounded-2xl theme-card-inner border p-2.5 text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-['Tajawal']"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-black theme-text-primary">الوصف</span>
                  <input
                    value={manual.description}
                    onChange={(e) => handleManualChange({ description: e.target.value })}
                    placeholder="وصف موجز"
                    className="mt-1 w-full rounded-2xl theme-card-inner border p-2.5 text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-['Tajawal']"
                  />
                </label>
              </div>

              {/* Base */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-black theme-text-primary">القاعدة البصرية:</span>
                {['academic', 'dark-tech'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleManualChange({ base: b, colors: {} })}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      manual.base === b ? 'bg-violet-500 text-slate-950' : 'theme-card-inner theme-text-secondary'
                    }`}
                  >
                    {b === 'academic' ? 'فاتحة أكاديمية' : 'داكنة تقنية'}
                  </button>
                ))}
              </div>

              {/* Colors */}
              <div>
                <p className="text-[11px] font-black theme-text-primary mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-violet-500" /> الألوان (HEX)
                </p>
                <div className="grid sm:grid-cols-4 gap-2">
                  {(BLUEPRINT_HELP[manual.base] || []).map((k) => (
                    <label key={k} className="block">
                      <span className="text-[10px] font-bold theme-text-secondary">{k}</span>
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{6}$/.test(manual.colors[k] || '') ? manual.colors[k] : '#888888'}
                        onChange={(e) => handleManualChange({ colors: { ...manual.colors, [k]: e.target.value } })}
                        className="mt-1 w-full h-9 rounded-xl cursor-pointer border theme-card-inner"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-black theme-text-primary flex items-center gap-1"><Type className="w-3 h-3" /> خط العناوين</span>
                  <select
                    value={isWhitelistedFont(manual.fonts.fh) ? manual.fonts.fh : ''}
                    onChange={(e) => handleManualChange({ fonts: { ...manual.fonts, fh: e.target.value } })}
                    className="mt-1 w-full rounded-2xl theme-card-inner border p-2.5 text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-['Tajawal'] cursor-pointer"
                  >
                    <option value="" disabled>اختر خطاً من القائمة البيضاء…</option>
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-black theme-text-primary flex items-center gap-1"><Type className="w-3 h-3" /> خط النصوص</span>
                  <select
                    value={isWhitelistedFont(manual.fonts.fb) ? manual.fonts.fb : ''}
                    onChange={(e) => handleManualChange({ fonts: { ...manual.fonts, fb: e.target.value } })}
                    className="mt-1 w-full rounded-2xl theme-card-inner border p-2.5 text-xs theme-text-primary focus:outline-none focus:ring-2 focus:ring-violet-500/40 font-['Tajawal'] cursor-pointer"
                  >
                    <option value="" disabled>اختر خطاً من القائمة البيضاء…</option>
                    {FONTS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Accent */}
              <div>
                <p className="text-[11px] font-black theme-text-primary mb-2">اللون المميز (للهوية الداكنة)</p>
                <div className="flex gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleManualChange({ accent: a.id })}
                      className={`w-8 h-8 rounded-full border-2 transition cursor-pointer ${manual.accent === a.id ? 'border-current ring-2 ring-violet-500/40 scale-110' : 'border-transparent'}`}
                      style={{ background: a.color, color: a.color }}
                      title={a.id}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveManual}
                disabled={saving || !manual.title.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-slate-950 text-xs font-bold shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {saving ? 'جارٍ الحفظ…' : 'حفظ القالب'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}