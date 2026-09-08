import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookMarked, Sparkles, Download, FileText, Search, GraduationCap,
  RefreshCw, Volume2, CircleCheck, CircleX, ArrowRight, RotateCcw,
  Trophy, Loader2, ChevronLeft, ChevronRight, FileSpreadsheet, FileJson
} from 'lucide-react';
import { fetchTerms, exportTermsData } from '../services/api';

const LEVELS = [
  { id: 'weak', label: 'ط·ط§ظ„ط¨ ط¶ط¹ظٹظپ', color: 'amber', desc: 'ظ…طµط·ظ„ط­ط§طھ ط£ط³ط§ط³ظٹط© ظˆطھط¹ط±ظٹظپط§طھ ظ…ط¨ط³ط·ط©' },
  { id: 'medium', label: 'ط·ط§ظ„ط¨ ظ…طھظˆط³ط·', color: 'blue', desc: 'ظ…طµط·ظ„ط­ط§طھ ظ…طھظˆط³ط·ط© ظˆطھط¹ط±ظٹظپط§طھ طھط­ظ„ظٹظ„ظٹط©' },
  { id: 'excellent', label: 'ط·ط§ظ„ط¨ ظ…ظ…طھط§ط²', color: 'emerald', desc: 'ظ…طµط·ظ„ط­ط§طھ ظ…طھظ‚ط¯ظ…ط© ظˆطھط¹ط±ظٹظپط§طھ ظ…ط¹ظ…ظ‚ط©' }
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TermsView({
  activeDoc,
  activePrompt,
  onOpenPromptManager,
  onOpenUpload,
  onOpenApiKey
}) {
  const currentDocId = activeDoc?.doc_id || activeDoc?.id || null;

  const [level, setLevel] = useState('medium');
  const [count, setCount] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewTab, setViewTab] = useState('extract');
  const [speechOn, setSpeechOn] = useState(true);

  const [data, setData] = useState(() => {
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_terms_${currentDocId}`);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    const last = localStorage.getItem('eduai_last_terms');
    if (last) {
      try { return JSON.parse(last); } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (data) {
      localStorage.setItem('eduai_last_terms', JSON.stringify(data));
      if (currentDocId) {
        localStorage.setItem(`eduai_terms_${currentDocId}`, JSON.stringify(data));
      }
    }
  }, [data, currentDocId]);

  useEffect(() => {
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_terms_${currentDocId}`);
      if (saved) {
        try { setData(JSON.parse(saved)); } catch {}
      }
    }
  }, [currentDocId]);

  const terms = useMemo(() => (data?.terms || []), [data]);
  const filteredTerms = useMemo(() => {
    if (!search.trim()) return terms;
    const q = search.toLowerCase();
    return terms.filter(
      t => t.term_en?.toLowerCase().includes(q)
        || t.term_ar?.includes(search)
        || t.definition?.includes(search)
        || t.category?.includes(search)
    );
  }, [terms, search]);

  const speak = useCallback((text, lang = 'en-US') => {
    if (!speechOn || !text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = 0.88;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [speechOn]);

  const handleExtract = async () => {
    if (!activeDoc) {
      setError('ظٹط±ط¬ظ‰ ط±ظپط¹ ط£ظˆ ط§ط®طھظٹط§ط± ظ…ط§ط¯ط© طھط¹ظ„ظٹظ…ظٹط© ط£ظˆظ„ط§ظ‹.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTerms(currentDocId, level, count, 'ar', activePrompt?.prompt || null);
      setData(result);
      setViewTab('extract');
      if (result?.error) setError(result.error);
    } catch (err) {
      setError(err.message || 'ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (fmt) => {
    if (!data) return;
    try {
      await exportTermsData(data, fmt, data.chapter_title || activeDoc?.filename || 'Terms');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!activeDoc) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <div className="card p-12 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black theme-text-primary mb-2">
            ظ‚ط³ظ… ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©
          </h3>
          <p className="text-sm theme-text-muted mb-6 leading-relaxed">
            ط§ط³طھط®ط±ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„ط¹ظ„ظ…ظٹط© ظ…ظ† ظ…ط§ط¯طھظƒ ط§ظ„ط¯ط±ط§ط³ظٹط© ظ…ط¹ طھط¹ط±ظٹظپط§طھ ظˆطھط±ط¬ظ…ط§طھ ط£ظƒط§ط¯ظٹظ…ظٹط© ظ…ط¶ط¨ظˆط·ط© ط­ط³ط¨ ظ…ط³طھظˆط§ظƒ ط§ظ„ط¯ط±ط§ط³ظٹ
          </p>
          <button
            onClick={onOpenUpload}
            className="btn-primary"
          >
            ط±ظپط¹ ظ…ط§ط¯ط© طھط¹ظ„ظٹظ…ظٹط© ط§ظ„ط¢ظ†
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">

      {/* Header Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black theme-text-primary flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-emerald-500" />
            ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©
            {data && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {terms.length} ظ…طµط·ظ„ط­
              </span>
            )}
          </h2>
          <p className="text-xs theme-text-muted font-bold">
            ط§ط³طھط®ط±ط§ط¬ ظˆط­ظپط¸ ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„ط¹ظ„ظ…ظٹط© ظ…ظ†: {activeDoc.filename}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechOn(!speechOn)}
            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              speechOn
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'theme-card-inner theme-text-muted border'
            }`}
            title={speechOn ? 'ط¥ظٹظ‚ط§ظپ ط§ظ„ظ†ط·ظ‚' : 'طھط´ط؛ظٹظ„ ط§ظ„ظ†ط·ظ‚'}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewTab('extract')}
          className={`text-sm font-extrabold pb-2 transition relative cursor-pointer ${
            viewTab === 'extract' ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ
          {viewTab === 'extract' && (
            <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setViewTab('test')}
          className={`text-sm font-extrabold pb-2 transition relative cursor-pointer ${
            viewTab === 'test' ? 'text-emerald-600 dark:text-emerald-400' : 'theme-text-muted hover:theme-text-primary'
          }`}
        >
          ط§ط®طھط¨ط§ط± ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„طھظپط§ط¹ظ„ظٹ
          {viewTab === 'test' && (
            <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* EXTRACT TAB */}
      {viewTab === 'extract' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Controls */}
          <aside className="lg:col-span-4 card p-6 sticky top-20">
            <div className="space-y-4">

              {/* Level Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold theme-text-secondary block">ظ…ط³طھظˆظ‰ ط§ظ„ط·ط§ظ„ط¨ ط§ظ„ظ…ط³طھظ‡ط¯ظپ</label>
                {LEVELS.map(lv => (
                  <button
                    key={lv.id}
                    onClick={() => setLevel(lv.id)}
                    className={`w-full text-right p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      level === lv.id
                        ? `bg-${lv.color}-500/15 border-${lv.color}-500/40 text-${lv.color}-600 dark:text-${lv.color}-400 shadow-sm`
                        : 'theme-card-inner hover:bg-white/5 theme-text-primary'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold">{lv.label}</div>
                      <div className="theme-text-muted text-[11px] mt-0.5">{lv.desc}</div>
                    </div>
                    {level === lv.id && (
                      <span className={`w-2 h-2 rounded-full bg-${lv.color}-500`}></span>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800"></div>

              {/* Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold theme-text-secondary block">ط¹ط¯ط¯ ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©</label>
                <div className="flex items-center gap-2">
                  {[10, 15, 20, 30].map(n => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        count === n
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'theme-card-inner theme-text-muted'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Manager */}
              {onOpenPromptManager && (
                <button
                  onClick={onOpenPromptManager}
                  className="w-full py-2 rounded-xl theme-card-inner border text-xs font-bold theme-text-muted hover:theme-text-primary transition cursor-pointer"
                >
                  ط§ط³طھط®ط¯ط§ظ… ط¨ط±ظˆظ…ط¨طھ ظ…ط®طµطµ ظ„ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ
                </button>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold leading-relaxed">
                  {error}
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ط¬ط§ط±ظٹ ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Right: Terms Table */}
          <main className="lg:col-span-8 flex flex-col gap-4">

            {/* Search & Export Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ط¨ط­ط« ظپظٹ ط§ظ„ظ…طµط·ظ„ط­ط§طھ..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl theme-card-inner border text-xs font-bold theme-text-primary outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleExport('xlsx')}
                  disabled={!data}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="طھطµط¯ظٹط± Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={!data}
                  className="px-3 py-2 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="طھطµط¯ظٹط± CSV"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  disabled={!data}
                  className="px-3 py-2 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="طھطµط¯ظٹط± TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={!data}
                  className="px-3 py-2 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="طھطµط¯ظٹط± JSON"
                >
                  <FileJson className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terms List */}
            {!data ? (
              <div className="card p-16 text-center">
                <GraduationCap className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-sm theme-text-muted font-bold">
                  ط§ط¶ط؛ط· "ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ" ظ„طھظˆظ„ظٹط¯ ط§ظ„ظ‚ط§ظ…ظˆط³ ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹ ظ…ظ† ط§ظ„ظ…ط§ط¯ط© ط§ظ„ط¯ط±ط§ط³ظٹط© ط§ظ„ط­ط§ظ„ظٹط©
                </p>
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-sm theme-text-muted font-bold">ظ„ط§ طھظˆط¬ط¯ ظ†طھط§ط¦ط¬ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ط¨ط­ط«</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs theme-text-muted font-bold px-1">
                  ط¹ط±ط¶ {filteredTerms.length} ظ…ظ† ط£طµظ„ {terms.length} ظ…طµط·ظ„ط­
                  {data.level && ` â€¢ ط§ظ„ظ…ط³طھظˆظ‰: ${LEVELS.find(l => l.id === data.level)?.label || data.level}`}
                </p>
                <div className="card overflow-hidden">
                  <table className="w-full text-xs font-bold">
                    <thead>
                      <tr className="theme-card-inner border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 text-right theme-text-primary w-8">#</th>
                        <th className="p-3 text-right theme-text-primary">ط§ظ„ظ…طµط·ظ„ط­ ط¨ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©</th>
                        <th className="p-3 text-right theme-text-primary">ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط©</th>
                        <th className="p-3 text-right theme-text-primary">ط§ظ„طھط¹ط±ظٹظپ</th>
                        <th className="p-3 text-right theme-text-primary">ظ…ط«ط§ظ„</th>
                        <th className="p-3 text-right theme-text-primary">ط§ظ„طھطµظ†ظٹظپ</th>
                        <th className="p-3 text-center theme-text-primary">ط§ظ„ظ†ط·ظ‚</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTerms.map(t => (
                        <tr
                          key={t.id}
                          className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-emerald-500/5 transition"
                        >
                          <td className="p-3 theme-text-muted text-center">{t.id}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="theme-text-primary font-black">{t.term_en}</span>
                              <button
                                onClick={() => speak(t.term_en, 'en-US')}
                                className="text-emerald-500 hover:text-emerald-400 transition cursor-pointer"
                                title="ظ†ط·ظ‚ ط§ظ„ظ…طµط·ظ„ط­"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400 font-black">
                            {t.term_ar}
                          </td>
                          <td className="p-3 theme-text-secondary max-w-[200px] leading-relaxed">
                            {t.definition}
                          </td>
                          <td className="p-3 theme-text-secondary max-w-[150px] leading-relaxed italic text-[11px]">
                            {t.example || 'â€”'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] theme-text-secondary font-bold">
                              {t.category}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                speak(t.term_en, 'en-US');
                                setTimeout(() => speak(t.definition, 'ar-SA'), 1800);
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 transition cursor-pointer"
                              title="ظ†ط·ظ‚ ط§ظ„ظ…طµط·ظ„ط­ ظˆط§ظ„طھط¹ط±ظٹظپ"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      )}

      {/* TEST TAB */}
      {viewTab === 'test' && (
        <TermsInteractiveTest
          terms={terms}
          speak={speak}
          speechOn={speechOn}
          onUpload={onOpenUpload}
          hasTerms={terms.length > 0}
        />
      )}

    </div>
  );
}

// ===========================
// Interactive Terms Quiz Component
// ===========================
function TermsInteractiveTest({ terms, speak, speechOn, onUpload, hasTerms }) {
  const [testState, setTestState] = useState(null);
  // testState: { questions, index, score, answers: {}, done, startedAt }

  const questions = useMemo(() => {
    if (terms.length < 2) return [];
    return buildQuestions(terms);
  }, [terms]);

  function buildQuestions(allTerms) {
    const qs = [];
    let id = 1;

    // Type 1: What is the Arabic translation of [term_en]?
    allTerms.forEach(t => {
      if (!t.term_en || !t.term_ar) return;
      const distractors = allTerms
        .filter(x => x.id !== t.id && x.term_ar)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const opts = shuffleArray([
        { text: t.term_ar, correct: true },
        ...distractors.map(d => ({ text: d.term_ar, correct: false }))
      ]);
      qs.push({
        id: id++,
        type: 'meaning',
        questionText: `ظ…ط§ ظ‡ظٹ ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ط£ظƒط§ط¯ظٹظ…ظٹط© ظ„ظ„ظ…طµط·ظ„ط­ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ:`,
        termEn: t.term_en,
        termAr: t.term_ar,
        definition: t.definition,
        options: opts,
        speakEn: t.term_en
      });
    });

    // Type 2: What is the English term for [term_ar]?
    allTerms.forEach(t => {
      if (!t.term_en || !t.term_ar) return;
      const distractors = allTerms
        .filter(x => x.id !== t.id && x.term_en)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const opts = shuffleArray([
        { text: t.term_en, correct: true },
        ...distractors.map(d => ({ text: d.term_en, correct: false }))
      ]);
      qs.push({
        id: id++,
        type: 'term',
        questionText: `ظ…ط§ ط§ظ„ظ…طµط·ظ„ط­ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ط°ظٹ ظٹط¹ظ†ظٹ:`,
        termEn: t.term_en,
        termAr: t.term_ar,
        definition: t.definition,
        options: opts,
        speakAr: t.term_ar
      });
    });

    return shuffleArray(qs).slice(0, Math.min(qs.length, 20));
  }

  const startTest = () => {
    if (!hasTerms) return;
    setTestState({
      questions,
      index: 0,
      score: 0,
      answers: {},
      done: false,
      startedAt: Date.now()
    });
  };

  const handleAnswer = (questionId, optionIndex) => {
    if (!testState) return;
    const { questions: qs, answers } = testState;
    if (answers[questionId] !== undefined) return;
    const q = qs.find(x => x.id === questionId);
    const correct = q.options[optionIndex].correct;
    const newAnswers = { ...answers, [questionId]: { optionIndex, correct } };
    const newScore = correct ? testState.score + 1 : testState.score;
    setTestState({
      ...testState,
      score: newScore,
      answers: newAnswers
    });
  };

  const navigateQuestion = (dir) => {
    if (!testState) return;
    const next = testState.index + dir;
    if (next >= 0 && next < testState.questions.length) {
      setTestState({ ...testState, index: next });
    }
  };

  const finishTest = () => setTestState({ ...testState, done: true });

  if (!hasTerms) {
    return (
      <div className="card p-12 text-center">
        <BookMarked className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-50" />
        <p className="text-sm theme-text-muted font-bold mb-4">
          ظ„ط§ طھظˆط¬ط¯ ظ…طµط·ظ„ط­ط§طھ ط¨ط¹ط¯. ط§ط³طھط®ط±ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط£ظˆظ„ط§ظ‹ ظ…ظ† طھط¨ظˆظٹط¨ "ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…طµط·ظ„ط­ط§طھ"
        </p>
        <button
          onClick={onUpload}
          className="btn-primary"
        >
          ط±ظپط¹ ظ…ط§ط¯ط© طھط¹ظ„ظٹظ…ظٹط©
        </button>
      </div>
    );
  }

  if (!testState) {
    return (
      <div className="card p-12 max-w-lg mx-auto text-center">
        <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-black theme-text-primary mb-2">ط§ط®طھط¨ط§ط± ط§ظ„ظ…طµط·ظ„ط­ط§طھ ط§ظ„طھظپط§ط¹ظ„ظٹ</h3>
        <p className="text-sm theme-text-muted mb-2 leading-relaxed">
          ط§ط®طھط¨ط§ط± ظ…ظ† ظ†ظˆط¹ظٹظ†: طھط±ط¬ظ…ط© ط§ظ„ظ…طµط·ظ„ط­ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ â†” ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ط¹ط±ط¨ظٹط© ظ…ط¹ ظ†ط·ظ‚ طµظˆطھظٹ ظپظˆط±ظٹ
        </p>
        <p className="text-xs theme-text-muted mb-6">
          ط¹ط¯ط¯ ط§ظ„ط£ط³ط¦ظ„ط©: <span className="font-black theme-text-primary">{Math.min(questions.length, 20)}</span> ط³ط¤ط§ظ„
        </p>
        <button
          onClick={startTest}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 hover:scale-105 transition cursor-pointer"
        >
          ط§ط¨ط¯ط£ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط¢ظ†
        </button>
      </div>
    );
  }

  if (testState.done) {
    const total = testState.questions.length;
    const pct = total > 0 ? Math.round((testState.score / total) * 100) : 0;
    const grade = pct >= 90 ? 'ظ…ظ…طھط§ط² â­گ' : pct >= 70 ? 'ط¬ظٹط¯ ط¬ط¯ط§ظ‹' : pct >= 50 ? 'ظ…ظ‚ط¨ظˆظ„' : 'ظٹط­طھط§ط¬ ظ…ط±ط§ط¬ط¹ط©';
    return (
      <div className="space-y-4">
        <div className="card p-12 text-center">
          <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-black theme-text-primary mb-2">ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©</h3>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl font-black text-emerald-500">{testState.score}</div>
              <div className="text-xs theme-text-muted font-bold">طµط­ظٹط­ط©</div>
            </div>
            <div className="text-2xl theme-text-muted">/</div>
            <div className="text-center">
              <div className="text-4xl font-black theme-text-primary">{total}</div>
              <div className="text-xs theme-text-muted font-bold">ط¥ط¬ظ…ط§ظ„ظٹ</div>
            </div>
          </div>
          <div className="text-lg font-black mb-2">
            <span className="text-emerald-500">{pct}%</span> â€” {grade}
          </div>
        </div>

        {/* Review Wrong Answers */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 theme-card-inner">
            <h4 className="text-sm font-black theme-text-primary">ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط¥ط¬ط§ط¨ط§طھ ط§ظ„ط®ط§ط·ط¦ط©</h4>
          </div>
          <div className="p-4 space-y-3">
            {testState.questions.map(q => {
              const a = testState.answers[q.id];
              if (!a || a.correct) return null;
              const correctText = q.options.find(o => o.correct)?.text || '';
              return (
                <div key={q.id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs">
                  <div className="font-bold theme-text-primary mb-1">{q.questionText}</div>
                  {q.type === 'meaning' && <span className="font-black text-amber-500">{q.termEn}</span>}
                  {q.type === 'term' && <span className="font-black text-amber-500">{q.termAr}</span>}
                  <div className="mt-1">
                    <span className="text-rose-500 font-bold">ط¥ط¬ط§ط¨طھظƒ: </span>
                    <span className="theme-text-secondary">{q.options[a.optionIndex]?.text}</span>
                  </div>
                  <div>
                    <span className="text-emerald-500 font-bold">ط§ظ„ط¥ط¬ط§ط¨ط© ط§ظ„طµط­ظٹط­ط©: </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{correctText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={startTest}
          className="btn-primary"
        >
          ط¥ط¹ط§ط¯ط© ط§ظ„ط§ط®طھط¨ط§ط±
        </button>
      </div>
    );
  }

  // Active question
  const currentQ = testState.questions[testState.index];
  const answered = testState.answers[currentQ.id] !== undefined;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${((testState.index + 1) / testState.questions.length) * 100}%` }}
          ></div>
        </div>
        <span className="text-xs font-bold theme-text-muted whitespace-nowrap">
          {testState.index + 1} / {testState.questions.length}
        </span>
      </div>

      <div className="card p-8">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold theme-text-muted">
            ط§ظ„ط³ط¤ط§ظ„ {testState.index + 1} â€¢{' '}
            {currentQ.type === 'meaning' ? 'طھط±ط¬ظ…ط© ط¥ظ†ط¬ظ„ظٹط²ظٹ â†’ ط¹ط±ط¨ظٹ' : 'طھط±ط¬ظ…ط© ط¹ط±ط¨ظٹ â†’ ط¥ظ†ط¬ظ„ظٹط²ظٹ'}
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            ط§ظ„ظ†طھظٹط¬ط©: {testState.score}
          </span>
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <p className="text-base font-black theme-text-primary mb-2">{currentQ.questionText}</p>
          {currentQ.type === 'meaning' && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-amber-500">{currentQ.termEn}</span>
              {speechOn && (
                <button
                  onClick={() => speak(currentQ.termEn, 'en-US')}
                  className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/30 transition cursor-pointer"
                  title="ظ†ط·ظ‚ ط§ظ„ظ…طµط·ظ„ط­"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {currentQ.type === 'term' && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-amber-500">{currentQ.termAr}</span>
              {speechOn && (
                <button
                  onClick={() => speak(currentQ.termAr, 'ar-SA')}
                  className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500 hover:bg-amber-500/30 transition cursor-pointer"
                  title="ظ†ط·ظ‚ ط§ظ„ظ…طµط·ظ„ط­"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answered && testState.answers[currentQ.id].optionIndex === idx;
            const isCorrect = opt.correct;
            let optStyle = 'theme-card-inner hover:bg-white/5 theme-text-primary border';
            if (answered && isSelected && isCorrect) optStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
            else if (answered && isSelected && !isCorrect) optStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-500';
            else if (answered && isCorrect) optStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400';

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQ.id, idx)}
                disabled={answered}
                className={`p-4 rounded-xl border text-sm font-bold text-right transition cursor-pointer disabled:cursor-default ${optStyle}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black">
                    {letters[idx]}
                  </span>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback & Pronunciation after answering */}
        {answered && (
          <div className={`p-3 rounded-xl text-xs font-bold mb-4 ${
            testState.answers[currentQ.id].correct
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
          }`}>
            {testState.answers[currentQ.id].correct ? 'âœ” ط¥ط¬ط§ط¨ط© طµط­ظٹط­ط©!' : 'âœ– ط¥ط¬ط§ط¨ط© ط®ط§ط·ط¦ط©'}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateQuestion(-1)}
          disabled={testState.index === 0}
          className="px-4 py-2 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
          ط§ظ„ط³ط§ط¨ظ‚
        </button>
        <button
          onClick={finishTest}
          className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold cursor-pointer"
        >
          ط¥ظ†ظ‡ط§ط، ط§ظ„ط§ط®طھط¨ط§ط±
        </button>
        <button
          onClick={() => navigateQuestion(1)}
          disabled={testState.index === testState.questions.length - 1}
          className="px-4 py-2 rounded-xl theme-card-inner border theme-text-primary text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          ط§ظ„طھط§ظ„ظٹ
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
