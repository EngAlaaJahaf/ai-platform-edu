import React, { useState } from 'react';
import { Wand2, Plus, MessageSquare, Trash2, Check, X } from 'lucide-react';

export default function PromptsSettings({ prompts, setPrompts, handleSaveCustomPrompt, handleDeletePrompt, handleGeneratePromptWithAI }) {
  const [newPrompt, setNewPrompt] = useState({ category: 'quiz', title: '', description: '', system_prompt: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [generating, setGenerating] = useState(false);

  const categories = {
    quiz: 'الاختبارات (Quiz)',
    summary: 'التلخيص (Summary)',
    chat: 'الدردشة (Chat)',
    proofread: 'التدقيق اللغوي (Proofread)'
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newPrompt.title || !newPrompt.system_prompt) return;
    try {
      await handleSaveCustomPrompt(newPrompt);
      setIsAdding(false);
      setNewPrompt({ category: 'quiz', title: '', description: '', system_prompt: '' });
    } catch (e) {
      alert("فشل الحفظ: " + e.message);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiGoal) return;
    setGenerating(true);
    try {
      const res = await handleGeneratePromptWithAI(aiGoal, newPrompt.category);
      if (res && res.generated_prompt) {
        setNewPrompt({ ...newPrompt, system_prompt: res.generated_prompt });
      }
    } catch (err) {
      alert("فشل توليد التوجيه: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black theme-text-primary mb-1">قوالب التوجيه الذكية (System Prompts)</h2>
          <p className="text-sm theme-text-muted font-bold">إدارة القوالب الأساسية للذكاء الاصطناعي وتخصيص استجابته لكل وحدة</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          قالب جديد
        </button>
      </div>

      {isAdding && (
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 relative">
          <button onClick={() => setIsAdding(false)} className="absolute top-4 left-4 p-2 theme-text-muted hover:theme-text-primary hover:bg-slate-500/10 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-500" />
            إنشاء قالب توجيه
          </h3>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black theme-text-muted mb-1">عنوان القالب</label>
                <input
                  type="text"
                  required
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                  className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-black theme-text-muted mb-1">الفئة (Category)</label>
                <select
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                  className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition"
                >
                  {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">نص التوجيه الدقيق (System Prompt)</label>
              <textarea
                required
                rows={5}
                value={newPrompt.system_prompt}
                onChange={(e) => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })}
                className="w-full theme-card-inner border rounded-xl px-4 py-2.5 text-sm font-bold theme-text-primary focus:border-indigo-500 transition font-mono leading-relaxed"
                dir="auto"
              />
            </div>
            
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <label className="block text-xs font-black text-indigo-500 mb-2">توليد التوجيه بالذكاء الاصطناعي 🪄</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: أريد توجيه يصيغ أسئلة اختبار صعبة جداً لطلاب الطب..."
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="flex-1 theme-card-inner border border-indigo-500/30 rounded-xl px-4 py-2 text-sm font-bold theme-text-primary focus:border-indigo-400 transition"
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1"
                >
                  {generating ? "يتم التوليد..." : "توليد"}
                </button>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition flex items-center gap-2">
                <Check className="w-4 h-4" /> حفظ القالب
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className="theme-bg-card p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${prompt.is_default ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-slate-500/10 theme-text-muted border-slate-200 dark:border-slate-700'}`}>
                  {categories[prompt.category] || prompt.category}
                </span>
                <h4 className="text-sm font-black theme-text-primary">{prompt.title}</h4>
              </div>
              <p className="text-xs theme-text-muted font-bold line-clamp-2 mt-2 leading-relaxed" dir="auto">{prompt.system_prompt}</p>
            </div>
            {!prompt.is_default && (
              <button
                onClick={() => handleDeletePrompt(prompt.id)}
                className="p-2 theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
