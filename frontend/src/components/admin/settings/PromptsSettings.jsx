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
          <h2 className="text-2xl font-black text-white mb-2">قوالب التوجيه الذكية (System Prompts)</h2>
          <p className="text-sm text-slate-400">إدارة القوالب الأساسية للذكاء الاصطناعي وتخصيص استجابته لكل وحدة</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          قالب جديد
        </button>
      </div>

      {isAdding && (
        <div className="glass-panel p-6 rounded-2xl border space-y-4 relative">
          <button onClick={() => setIsAdding(false)} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-400" />
            إنشاء قالب توجيه
          </h3>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">عنوان القالب</label>
                <input
                  type="text"
                  required
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الفئة (Category)</label>
                <select
                  value={newPrompt.category}
                  onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition"
                >
                  {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">نص التوجيه الدقيق (System Prompt)</label>
              <textarea
                required
                rows={5}
                value={newPrompt.system_prompt}
                onChange={(e) => setNewPrompt({ ...newPrompt, system_prompt: e.target.value })}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 transition font-mono leading-relaxed"
                dir="auto"
              />
            </div>
            
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <label className="block text-xs font-bold text-indigo-400 mb-2">توليد التوجيه بالذكاء الاصطناعي 🪄</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="مثال: أريد توجيه يصيغ أسئلة اختبار صعبة جداً لطلاب الطب..."
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="flex-1 bg-slate-900/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-400 transition"
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  {generating ? "يتم التوليد..." : "توليد"}
                </button>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center gap-2">
                <Check className="w-4 h-4" /> حفظ القالب
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className="glass-panel p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${prompt.is_default ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-300 border-white/10'}`}>
                  {categories[prompt.category] || prompt.category}
                </span>
                <h4 className="text-sm font-bold text-white">{prompt.title}</h4>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed" dir="auto">{prompt.system_prompt}</p>
            </div>
            {!prompt.is_default && (
              <button
                onClick={() => handleDeletePrompt(prompt.id)}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition shrink-0"
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
