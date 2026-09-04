import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  X, 
  BrainCircuit, 
  FileText, 
  MessageSquare, 
  CheckCheck,
  BookmarkCheck,
  Loader2
} from 'lucide-react';
import { fetchPrompts, createPrompt, generateCustomPrompt, deletePrompt } from '../services/api';

export default function PromptManagerModal({ isOpen, onClose, initialCategory = 'quiz', onSelectPrompt }) {
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('list'); // 'list', 'create', 'generate'
  
  // Create / Generate state
  const [taskGoal, setTaskGoal] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSystemPrompt, setNewSystemPrompt] = useState('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatedPromptData, setGeneratedPromptData] = useState(null);

  const categories = [
    { id: 'quiz', label: 'بنك أسئلة الاختبارات', icon: BrainCircuit },
    { id: 'summary', label: 'قوالب التلخيص والخرائط', icon: FileText },
    { id: 'chat', label: 'المساعد الأكاديمي RAG', icon: MessageSquare },
    { id: 'proofread', label: 'التدقيق اللغوي والأصالة', icon: CheckCheck },
  ];

  const loadCategoryPrompts = async (cat) => {
    setLoading(true);
    try {
      const data = await fetchPrompts(cat);
      setPrompts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialCategory);
      setMode('list');
      loadCategoryPrompts(initialCategory);
    }
  }, [isOpen, initialCategory]);

  const handleTabChange = (catId) => {
    setActiveTab(catId);
    setMode('list');
    loadCategoryPrompts(catId);
  };

  const handleGenerateAI = async () => {
    if (!taskGoal.trim()) return;
    setGeneratingPrompt(true);
    try {
      const res = await generateCustomPrompt(taskGoal, activeTab);
      if (res) {
        setGeneratedPromptData(res);
        setNewTitle(res.title || '');
        setNewDesc(res.description || '');
        setNewSystemPrompt(res.system_prompt || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const handleSaveNewPrompt = async () => {
    if (!newTitle.trim() || !newSystemPrompt.trim()) return;
    try {
      await createPrompt({
        category: activeTab,
        title: newTitle,
        description: newDesc,
        system_prompt: newSystemPrompt
      });
      setMode('list');
      setTaskGoal('');
      setNewTitle('');
      setNewDesc('');
      setNewSystemPrompt('');
      setGeneratedPromptData(null);
      loadCategoryPrompts(activeTab);
    } catch (e) {
      alert('فشل حفظ البرومبت');
    }
  };

  const handleDelete = async (promptId) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا القالب؟')) return;
    try {
      await deletePrompt(promptId);
      loadCategoryPrompts(activeTab);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black theme-text-primary">بنك البرومبتات وقوالب الاستخراج الذكية</h3>
              <p className="text-xs theme-text-secondary">اختر أو ولّد برومبتات مخصصة لتحكم فائق في جودة الأسئلة والملخصات</p>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 theme-nav p-1 rounded-2xl border overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'theme-text-secondary hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-mode action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                mode === 'list' ? 'bg-emerald-600 text-white' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              القوالب المتاحة ({prompts.length})
            </button>
            <button
              onClick={() => setMode('generate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'generate' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30' : 'theme-text-muted hover:text-teal-400'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>توليد برومبت بالذكاء الاصطناعي 🪄</span>
            </button>
          </div>

          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة برومبت يدوي</span>
          </button>
        </div>

        {/* Mode 1: List Prompts */}
        {mode === 'list' && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-12 text-xs theme-text-muted flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                <span>جاري تحميل قوالب البرومبت...</span>
              </div>
            ) : prompts.length > 0 ? (
              prompts.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl theme-card-inner border hover:border-emerald-500/40 transition space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-sm font-black theme-text-primary">{p.title}</b>
                        {p.is_default === 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300">
                            أساسي معتمد
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs theme-text-secondary mt-1">{p.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectPrompt && (
                        <button
                          onClick={() => {
                            onSelectPrompt(p.system_prompt, p.title);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>استخدام</span>
                        </button>
                      )}

                      {p.is_default === 0 && (
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                          title="حذف البرومبت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl theme-card-inner border text-[11px] theme-text-secondary font-mono leading-relaxed line-clamp-2">
                    {p.system_prompt}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs theme-text-muted">
                لا توجد قوالب مخصصة في هذا القسم. اضغط على «توليد برومبت بالذكاء الاصطناعي» لإنشاء قالب مخصص لمادتك.
              </div>
            )}
          </div>
        )}

        {/* Mode 2: AI Prompt Generator */}
        {mode === 'generate' && (
          <div className="p-5 rounded-2xl theme-card-inner border border-teal-500/30 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-teal-500" />
              <h4 className="text-sm font-black theme-text-primary">مولد البرومبتات الأكاديمي الذكي</h4>
            </div>

            <p className="text-xs theme-text-secondary leading-relaxed">
              صف هدفك أو تخصصك (مثال: <em>"استخراج أسئلة دقيقة تركز على خوارزميات التشفير والمقارنة بينها"</em>)، وسيقوم الذكاء الاصطناعي بهندسة برومبت مخصص وحفظه كقالب دائم.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={taskGoal}
                onChange={(e) => setTaskGoal(e.target.value)}
                placeholder="صف أسلوب الأسئلة أو التلخيص الذي تريده في هذا القالب..."
                className="w-full theme-card-inner border border-emerald-500/30 focus:border-teal-500 rounded-xl px-4 py-3 text-xs theme-text-primary outline-none"
              />
              <button
                onClick={handleGenerateAI}
                disabled={generatingPrompt || !taskGoal.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingPrompt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري صياغة وهندسة البرومبت...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>توليد القالب الآن</span>
                  </>
                )}
              </button>
            </div>

            {generatedPromptData && (
              <div className="p-4 rounded-2xl theme-card-inner border border-teal-500/40 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <b className="text-xs font-black text-teal-600 dark:text-teal-300">{generatedPromptData.title}</b>
                  <span className="text-[10px] theme-text-muted">{generatedPromptData.description}</span>
                </div>
                <textarea
                  value={newSystemPrompt}
                  onChange={(e) => setNewSystemPrompt(e.target.value)}
                  className="w-full h-24 theme-card-inner border rounded-xl p-3 text-xs theme-text-primary outline-none font-mono resize-none leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSaveNewPrompt}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ في بنك البرومبتات</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Manual Create Prompt */}
        {mode === 'create' && (
          <div className="p-5 rounded-2xl theme-card-inner border border-emerald-500/30 space-y-3 animate-fade-in">
            <h4 className="text-sm font-black theme-text-primary">إضافة قالب برومبت مخصص يدوياً</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold theme-text-primary block mb-1">عنوان القالب:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: برومبت أسئلة المقارنات المتقدمة"
                  className="w-full theme-card-inner border rounded-xl px-3.5 py-2 text-xs theme-text-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold theme-text-primary block mb-1">وصف مختصر:</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="مثال: يركز على استخراج الفروقات بين التقنيات"
                  className="w-full theme-card-inner border rounded-xl px-3.5 py-2 text-xs theme-text-primary outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold theme-text-primary block mb-1">نص البرومبت الموجه للذكاء الاصطناعي (System Prompt):</label>
                <textarea
                  value={newSystemPrompt}
                  onChange={(e) => setNewSystemPrompt(e.target.value)}
                  placeholder="أنت أستاذ جامعي... ركز على صياغة أسئلة..."
                  className="w-full h-28 theme-card-inner border rounded-xl p-3 text-xs theme-text-primary outline-none font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setMode('list')}
                  className="px-4 py-2 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
                >
                  رجوع / إلغاء
                </button>
                <button
                  onClick={handleSaveNewPrompt}
                  disabled={!newTitle.trim() || !newSystemPrompt.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white shadow-md shadow-emerald-600/30 font-['Tajawal']"
                >
                  حفظ القالب
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Close / Back Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
          >
            رجوع / إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
