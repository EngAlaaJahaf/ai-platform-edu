import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  Lightbulb, 
  Upload, 
  Download, 
  FileInput, 
  Flag, 
  X, 
  Sliders, 
  Languages, 
  Repeat, 
  Settings, 
  Trash2, 
  History 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchQuiz, exportQuizData, importQuizFromText, fetchQuizProgress, saveQuizProgress } from '../services/api';
import ExportModal from './ExportModal';
import QWizard from './QWizard';

const toAr = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

export default function QuizView({ 
  activeDoc, 
  activePrompt, 
  onOpenPromptManager, 
  onSwitchToChat, 
  onOpenUpload, 
  onOpenApiKey 
}) {
  const [mode, setMode] = useState('mcq'); // 'mcq' or 'flashcard'
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState('bilingual'); // 'bilingual', 'ar', 'en'
  const [viewLang, setViewLang] = useState('bilingual'); // Interactive display toggle
  const currentDocId = activeDoc?.doc_id || activeDoc?.id || null;

  // State
  const [quizData, setQuizData] = useState(() => {
    if (activeDoc?.quiz_data) return activeDoc.quiz_data.quizData || activeDoc.quiz_data;
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_quiz_${currentDocId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.quizData || parsed;
        } catch (e) {}
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [isAcademicExportOpen, setIsAcademicExportOpen] = useState(false);
  
  // MCQ state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState('all');
  const [markedQuestions, setMarkedQuestions] = useState({});

  const [history, setHistory] = useState([]);
  const [reviewAttemptId, setReviewAttemptId] = useState(null);
  const [onlyWrongQuestionsFilter, setOnlyWrongQuestionsFilter] = useState(null);
  const [latestAttemptId, setLatestAttemptId] = useState(null);

  const [quizSettings, setQuizSettings] = useState({
    template: 'classic',
    primaryColor: '#1e3a8a',
    backgroundColor: '#ffffff',
    mode: 'training',
    showResult: 'final',
    duration: 30,
    randomizeQuestions: false,
    randomizeOptions: false
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [processedQuestions, setProcessedQuestions] = useState([]);
  const [isExplanationExpanded, setIsExplanationExpanded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load progress from backend
  useEffect(() => {
    async function loadProgress() {
      if (currentDocId) {
        const progress = await fetchQuizProgress(currentDocId);
        if (progress) {
          if (progress.selectedAnswers) setSelectedAnswers(progress.selectedAnswers);
          if (progress.currentIdx !== undefined) setCurrentIdx(progress.currentIdx);
          if (progress.isCompleted) setIsCompleted(progress.isCompleted);
          if (progress.score) setScore(progress.score);
          if (progress.history) setHistory(progress.history);
          if (progress.onlyWrongQuestionsFilter) setOnlyWrongQuestionsFilter(progress.onlyWrongQuestionsFilter);
          if (progress.selectedChapterIdx) setSelectedChapterIdx(progress.selectedChapterIdx);
          if (progress.quizSettings) setQuizSettings(progress.quizSettings);
        } else {
          // fallback to localStorage if no backend progress
          const saved = localStorage.getItem(`eduai_quiz_${currentDocId}`);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
              if (parsed.score) setScore(parsed.score);
              if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);
              if (parsed.isCompleted) setIsCompleted(parsed.isCompleted);
              if (parsed.history) setHistory(parsed.history);
              if (parsed.onlyWrongQuestionsFilter) setOnlyWrongQuestionsFilter(parsed.onlyWrongQuestionsFilter);
              if (parsed.selectedChapterIdx) setSelectedChapterIdx(parsed.selectedChapterIdx);
              if (parsed.quizSettings) setQuizSettings(parsed.quizSettings);
            } catch (e) {}
          }
        }
      }
    }
    loadProgress();
  }, [currentDocId]);

  // Sync state changes to localStorage and backend (debounced)
  useEffect(() => {
    if (quizData && currentDocId) {
      const stateToSave = {
        quizData,
        selectedAnswers,
        score,
        currentIdx,
        isCompleted,
        history,
        onlyWrongQuestionsFilter,
        selectedChapterIdx,
        quizSettings
      };
      localStorage.setItem(`eduai_quiz_${currentDocId}`, JSON.stringify(stateToSave));
      
      const timeoutId = setTimeout(() => {
        saveQuizProgress(currentDocId, stateToSave);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [quizData, selectedAnswers, score, currentIdx, isCompleted, currentDocId, history, onlyWrongQuestionsFilter, selectedChapterIdx, quizSettings]);

  useEffect(() => {
    if (activeDoc?.quiz_data) {
      setQuizData(activeDoc.quiz_data.quizData || activeDoc.quiz_data);
    }
  }, [activeDoc]);

  // Flashcard state
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Export / Import state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [cachedQuizData, setCachedQuizData] = useState(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isReviewActive = reviewAttemptId !== null;
  const reviewAttempt = isReviewActive ? history.find(a => a.id === reviewAttemptId) : null;

  const activeAnswers = isReviewActive ? reviewAttempt.selectedAnswers : selectedAnswers;
  const activeMarked = isReviewActive ? reviewAttempt.markedQuestions : markedQuestions;
  const activeScore = isReviewActive ? reviewAttempt.score : score;
  const activeChapterIdx = isReviewActive ? (reviewAttempt.selectedChapterIdx || 'all') : selectedChapterIdx;
  const activeWrongFilter = isReviewActive ? (reviewAttempt.wrongQuestionIds || null) : onlyWrongQuestionsFilter;

  // Initialize timer on load or duration settings change
  useEffect(() => {
    if (quizData && !isCompleted && !isReviewActive) {
      setTimeLeft(quizSettings.duration * 60);
    }
  }, [quizData, quizSettings.duration, isCompleted, isReviewActive]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft === null || isCompleted || isReviewActive || loading || !quizData) return;
    if (timeLeft <= 0) {
      handleCompleteQuiz();
      alert("انتهى وقت الاختبار! تم تقديم إجاباتك تلقائياً.");
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isCompleted, isReviewActive, loading, quizData]);

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process stable randomization of questions/options
  useEffect(() => {
    if (!quizData) {
      setProcessedQuestions([]);
      return;
    }

    let list = [];
    if (quizData.chapters && quizData.chapters.length > 0) {
      if (activeChapterIdx === 'all') {
        list = quizData.chapters.flatMap(ch => ch.questions || []);
      } else {
        const ch = quizData.chapters[parseInt(activeChapterIdx, 10)];
        list = ch ? (ch.questions || []) : [];
      }
    } else {
      list = quizData.questions || [];
    }

    if (activeWrongFilter && activeWrongFilter.length > 0) {
      list = list.filter(q => activeWrongFilter.includes(q.id));
    }

    if (quizSettings.randomizeQuestions) {
      list = [...list].sort((a, b) => {
        const hashA = (a.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hashB = (b.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return (hashA % 7) - (hashB % 7);
      });
    }

    if (quizSettings.randomizeOptions) {
      list = list.map(q => {
        const optsWithIdx = q.options.map((opt, idx) => ({
          opt,
          opt_ar: q.options_ar?.[idx] || null,
          opt_en: q.options_en?.[idx] || null,
          isCorrect: idx === q.correct_index
        }));
        const qHash = (q.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const shuffled = [...optsWithIdx].sort((a, b) => {
          const hashA = (a.opt || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + qHash;
          const hashB = (b.opt || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + qHash;
          return (hashA % 5) - (hashB % 5);
        });
        const correctIdx = shuffled.findIndex(item => item.isCorrect);
        return {
          ...q,
          options: shuffled.map(item => item.opt),
          options_ar: q.options_ar ? shuffled.map(item => item.opt_ar) : undefined,
          options_en: q.options_en ? shuffled.map(item => item.opt_en) : undefined,
          correct_index: correctIdx
        };
      });
    }

    setProcessedQuestions(list);
  }, [quizData, activeChapterIdx, activeWrongFilter, quizSettings.randomizeQuestions, quizSettings.randomizeOptions]);

  const questions = processedQuestions;
  const currentQ = questions[currentIdx] || null;

  useEffect(() => {
    setIsExplanationExpanded(false);
  }, [currentIdx, currentQ?.id]);

  const handleGenerateQuiz = async (diff = difficulty, count = questionCount, lang = language, extractOnly = false) => {
    if (!activeDoc || loading) return;
    setLoading(true);
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setScore(0);
    setCardIdx(0);
    setFlipped(false);
    setViewLang(lang);

    try {
      const data = await fetchQuiz(
        currentDocId, 
        count, 
        diff, 
        lang,
        activePrompt?.prompt,
        extractOnly
      );
      if (data) {
        setQuizData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load persisted quiz state when document changes
  useEffect(() => {
    if (currentDocId) {
      const saved = localStorage.getItem(`eduai_quiz_${currentDocId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.quizData || parsed.questions)) {
            const data = parsed.quizData || parsed;
            setQuizData(data);
            if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
            if (parsed.score !== undefined) setScore(parsed.score);
            if (parsed.isCompleted !== undefined) setIsCompleted(parsed.isCompleted);
            if (parsed.currentIdx !== undefined) setCurrentIdx(parsed.currentIdx);
            if (parsed.cardIdx !== undefined) setCardIdx(parsed.cardIdx);
          }
        } catch (e) {}
      }
    }
  }, [currentDocId]);

  const getFilteredQuestions = (quiz, chapterIdx, wrongFilter = onlyWrongQuestionsFilter) => {
    if (!quiz) return [];
    let list = [];
    if (quiz.chapters && quiz.chapters.length > 0) {
      if (chapterIdx === 'all') {
        list = quiz.chapters.flatMap(ch => ch.questions || []);
      } else {
        const ch = quiz.chapters[parseInt(chapterIdx, 10)];
        list = ch ? (ch.questions || []) : [];
      }
    } else {
      list = quiz.questions || [];
    }

    if (wrongFilter && wrongFilter.length > 0) {
      return list.filter(q => wrongFilter.includes(q.id));
    }
    return list;
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (selectedAnswers[qId] !== undefined) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));

    const activeQuestions = getFilteredQuestions(quizData, selectedChapterIdx);
    const currentQ = activeQuestions[currentIdx];
    if (currentQ && optionIdx === currentQ.correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const saveCurrentAttemptToHistory = (activeQs = questions) => {
    const attemptId = `attempt_${Date.now()}`;
    const defaultName = `اختبار - ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}`;
    
    const wrongQs = activeQs.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correct_index);
    
    const newAttempt = {
      id: attemptId,
      name: defaultName,
      timestamp: Date.now(),
      selectedAnswers: { ...selectedAnswers },
      score: score,
      totalQuestions: activeQs.length,
      selectedChapterIdx: selectedChapterIdx,
      wrongQuestionIds: wrongQs.map(q => q.id),
      markedQuestions: { ...markedQuestions }
    };

    setHistory(prev => {
      if (prev.some(att => att.timestamp === newAttempt.timestamp)) return prev;
      return [newAttempt, ...prev];
    });

    setLatestAttemptId(attemptId);
  };

  const renameAttempt = (id, newName) => {
    setHistory(prev => prev.map(att => {
      if (att.id === id) {
        return { ...att, name: newName };
      }
      return att;
    }));
  };

  const handleRetryWrongOnly = (attemptObj) => {
    if (!attemptObj || !attemptObj.wrongQuestionIds || attemptObj.wrongQuestionIds.length === 0) return;
    setOnlyWrongQuestionsFilter(attemptObj.wrongQuestionIds);
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setScore(0);
    setCardIdx(0);
    setFlipped(false);
    setMarkedQuestions({});
    setReviewAttemptId(null);
  };

  const handleDeleteAttempt = (attemptId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الاختبار من السجل؟')) return;
    setHistory(prev => prev.filter(a => a.id !== attemptId));
    if (reviewAttemptId === attemptId) {
      setReviewAttemptId(null);
    }
  };

  const handleCompleteQuiz = () => {
    setIsCompleted(true);
    const activeQuestions = getFilteredQuestions(quizData, selectedChapterIdx);
    saveCurrentAttemptToHistory(activeQuestions);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleNext = () => {
    const activeQuestions = getFilteredQuestions(quizData, selectedChapterIdx);
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
    setScore(0);
    setCardIdx(0);
    setFlipped(false);
    setMarkedQuestions({});
  };

  const handleDiscussMistakes = () => {
    const allQuestions = quizData?.questions || (quizData?.chapters || []).flatMap(ch => ch.questions || []);
    const wrongQuestions = [];
    allQuestions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correctIdx = q.correct_index;
      if (selected !== undefined && selected !== correctIdx) {
        wrongQuestions.push({
          question: q.question || q.question_ar || q.question_en || '',
          selectedOption: q.options ? q.options[selected] : null,
          correctOption: q.options ? q.options[correctIdx] : null,
          explanation: q.explanation || q.explanation_ar || q.explanation_en || ''
        });
      }
    });

    if (wrongQuestions.length === 0) {
      alert("لم ترتكب أي أخطاء في هذا الاختبار! 🎉");
      return;
    }

    let prompt = "مرحباً، لقد انتهيت من الاختبار وأريد منك مراجعة ومناقشة الأخطاء التي ارتكبتها بالتفصيل:\n\n";
    wrongQuestions.forEach((wq, idx) => {
      prompt += `السؤال ${idx + 1}: ${wq.question}\n`;
      if (wq.selectedOption) prompt += `❌ إجابتي: ${wq.selectedOption}\n`;
      if (wq.correctOption) prompt += `✅ الإجابة الصحيحة: ${wq.correctOption}\n`;
      if (wq.explanation) {
        prompt += `📖 الشرح الموجود: ${wq.explanation}\n`;
      }
      prompt += "\n";
    });
    prompt += "يرجى توضيح هذه المفاهيم لي بأسلوب مبسط ومساعدتي في فهم الأخطاء وكيفية تجنبها.";

    localStorage.setItem("eduai_pending_chat_prompt", prompt);
    onSwitchToChat();
  };

  // Export handlers
  const handleExportFile = async (format) => {
    const allQs = quizData?.questions || (quizData?.chapters || []).flatMap(c => c.questions || []);
    if (!allQs || allQs.length === 0) return;
    setExporting(true);
    setIsExportOpen(false);

    try {
      if (format === 'copy') {
        const res = await exportQuizData(allQs, 'txt');
        const text = await res.text();
        navigator.clipboard.writeText(text);
        setCopiedRaw(true);
        setTimeout(() => setCopiedRaw(false), 2000);
      } else {
        const res = await exportQuizData(allQs, format);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extMap = { txt: 'txt', json: 'json', csv: 'csv', xlsx: 'xlsx' };
        a.download = `EduAI_Quiz_${activeDoc?.filename || 'Questions'}.${extMap[format] || format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  // Import handler
  const handleImportSubmit = async () => {
    if (!importText.trim()) return;
    try {
      const result = await importQuizFromText(importText);
      const hasQuestions = (result?.questions && result.questions.length > 0) || 
                           (result?.chapters && result.chapters.some(c => c.questions?.length > 0));
      if (result && hasQuestions) {
        setQuizData(result);
        setIsImportOpen(false);
        setImportText('');
        setImportFileName('');
        handleReset();
      } else {
        alert("لم يتم العثور على أي أسئلة في النص أو الملف المدخل. يرجى التحقق من التنسيق.");
      }
    } catch (err) {
      alert("فشل استيراد الأسئلة: " + (err.message || 'تأكد من صحة التنسيق'));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target?.result || '');
    };
    reader.readAsText(file, 'UTF-8');
  };

  if (!activeDoc) {
    return (
      <div className="card p-16 text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-teal-400">
          <Upload className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black theme-text-primary">لم يتم رفع مادة لتوليد الاختبار</h3>
          <p className="text-xs theme-text-secondary leading-relaxed max-w-md mx-auto">
            ارفع ملف المحاضرة (Word أو PowerPoint أو PDF) أولاً لتوليد أسئلة اختيار من متعدد تفاعلية أو بطاقات استذكار.
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 mx-auto border border-white/20"
        >
          <Upload className="w-4 h-4 text-white" />
          <span>رفع مادة تعليمية الآن</span>
        </button>
      </div>
    );
  }

  const renderModals = () => (
    <>
      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right" dir="rtl">
          <div className="relative w-full max-w-2xl card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-black">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد بنك أسئلة مخصص</span>
              </div>
              <h3 className="text-xl font-black theme-text-primary font-['Tajawal']">استيراد أسئلة جاهزة (لصق أو رفع ملف نصي)</h3>
              <p className="text-xs theme-text-muted font-['Tajawal']">
                الصق أسئلة MCQ المنسقة بصيغة Q_EN / Q_AR أو بصيغة ##Chapter
              </p>
            </div>

            {/* File Upload Trigger */}
            <div className="p-3.5 rounded-2xl theme-card-inner border border-dashed border-teal-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileInput className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold theme-text-primary font-['Tajawal']">
                  {importFileName ? `الملف: ${importFileName}` : 'رفع ملف نصي مباشرة (.txt, .md)'}
                </span>
              </div>
              <label className="px-3.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-xs font-bold border border-teal-500/30 cursor-pointer transition font-['Tajawal']">
                <span>تصفح الملفات</span>
                <input
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`##Chapter 1: Network Fundamentals\n\nQ_EN: What is the main function of a router?\nQ_AR: ما هي الوظيفة الأساسية للموجه (الراوتر)؟\nA: Route packets | توجيه الحزم\nB: Store files | تخزين الملفات\nC: Display web pages | عرض صفحات الويب\nD: Encrypt emails | تشفير البريد\nANSWER: A\nEXPLANATION_EN: Routers forward data packets across networks.\nEXPLANATION_AR: يقوم الراوتر بتوجيه حزم البيانات بين الشبكات المختلفة.`}
              rows={10}
              className="w-full theme-card-inner border rounded-2xl p-4 text-xs font-mono theme-text-primary outline-none focus:border-teal-400 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/5">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-5 py-2.5 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
              >
                رجوع / إلغاء
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md disabled:opacity-50 font-['Tajawal']"
              >
                استيراد وبدء الاختبار 🎯
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Export Modal */}
      <ExportModal
        isOpen={isAcademicExportOpen}
        onClose={() => setIsAcademicExportOpen(false)}
        type="quiz"
        data={quizData}
        docName={activeDoc?.filename}
        currentTab={mode}
        quizSettings={quizSettings}
      />

      {/* Quiz Customization Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right" dir="rtl">
          <div className="relative w-full max-w-xl card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black theme-text-primary font-['Tajawal'] font-black">إعدادات وتخصيص الاختبار ⚙️</h3>
              <p className="text-xs theme-text-muted font-['Tajawal']">حدد مظهر وقوانين الاختبار التفاعلي الحالي والمصدر</p>
            </div>

            <div className="space-y-3.5 pt-2">
              
              {/* Template Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">قالب الاختبار:</label>
                <select
                  value={quizSettings.template}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, template: e.target.value }))}
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-['Tajawal']"
                >
                  <option value="classic">كلاسيكي (مطابق) LMS</option>
                </select>
              </div>

              {/* Primary Color Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">اللون الرئيسي (للملف المصدّر HTML):</label>
                <div className="flex gap-2">
                  <select
                    value={['#1e3a8a', '#4f46e5', '#7c3aed', '#0f172a'].includes(quizSettings.primaryColor) ? quizSettings.primaryColor : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizSettings(prev => ({ ...prev, primaryColor: val === 'custom' ? '#2563eb' : val }));
                    }}
                    className="flex-1 text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-['Tajawal']"
                  >
                    <option value="#1e3a8a">أزرق داكن (LMS)</option>
                    <option value="#4f46e5">نيلي (emerald)</option>
                    <option value="#7c3aed">بنفسجي (emerald)</option>
                    <option value="#0f172a">داكن (Slate)</option>
                    <option value="custom">مخصص...</option>
                  </select>
                  {!['#1e3a8a', '#4f46e5', '#7c3aed', '#0f172a'].includes(quizSettings.primaryColor) && (
                    <input
                      type="color"
                      value={quizSettings.primaryColor}
                      onChange={(e) => setQuizSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 p-1 rounded-xl theme-card-inner border cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Background Color Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">خلفية الاختبار (للملف المصدّر HTML):</label>
                <div className="flex gap-2">
                  <select
                    value={['#ffffff', '#f8fafc', '#090d16'].includes(quizSettings.backgroundColor) ? quizSettings.backgroundColor : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizSettings(prev => ({ ...prev, backgroundColor: val === 'custom' ? '#ffffff' : val }));
                    }}
                    className="flex-1 text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-['Tajawal']"
                  >
                    <option value="#ffffff">أبيض (قالب الفحص LMS)</option>
                    <option value="#f8fafc">رمادي فاتح</option>
                    <option value="#090d16">داكن (Dark Theme)</option>
                    <option value="custom">مخصص...</option>
                  </select>
                  {!['#ffffff', '#f8fafc', '#090d16'].includes(quizSettings.backgroundColor) && (
                    <input
                      type="color"
                      value={quizSettings.backgroundColor}
                      onChange={(e) => setQuizSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-10 p-1 rounded-xl theme-card-inner border cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Quiz Mode Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">وضع الاختبار:</label>
                <select
                  value={quizSettings.mode}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-['Tajawal']"
                >
                  <option value="training">وضع تدريب (مع تصحيح)</option>
                  <option value="exam">وضع اختبار فعلي (بدون تصحيح)</option>
                </select>
              </div>

              {/* Show Result Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">عرض النتيجة:</label>
                <select
                  value={quizSettings.showResult}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, showResult: e.target.value }))}
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-['Tajawal']"
                >
                  <option value="final">في النهاية</option>
                  <option value="instant" disabled={quizSettings.mode === 'exam'}>بعد كل سؤال (تدريب فقط)</option>
                </select>
              </div>

              {/* Duration Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold theme-text-secondary block font-['Tajawal']">مدة الاختبار (دقيقة):</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={quizSettings.duration}
                  onChange={(e) => setQuizSettings(prev => ({ ...prev, duration: parseInt(e.target.value, 10) || 30 }))}
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono text-center"
                />
              </div>

              {/* Shuffling Checkboxes */}
              <div className="space-y-2 pt-2 text-right">
                <label className="flex items-center gap-2 cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    checked={quizSettings.randomizeQuestions}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold theme-text-primary font-['Tajawal']">عشوائية ترتيب الأسئلة داخل الفصل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    checked={quizSettings.randomizeOptions}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold theme-text-primary font-['Tajawal']">عشوائية ترتيب الخيارات (A/B/C/D)</span>
                </label>
              </div>

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
              >
                رجوع / إلغاء
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md font-['Tajawal']"
              >
                تطبيق وحفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz History & Saved Attempts Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right" dir="rtl">
          <div className="relative w-full max-w-2xl card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black">
                <History className="w-3.5 h-3.5" />
                <span>سجل الاختبارات والمحاولات السابقة</span>
              </div>
              <h3 className="text-xl font-black theme-text-primary font-['Tajawal']">الاختبارات المحفوظة</h3>
              <p className="text-xs theme-text-muted font-['Tajawal']">
                المستند الحالي: <b className="theme-text-primary">{activeDoc?.filename}</b> • {history.length} محاولة مسجلة
              </p>
            </div>

            {history.length === 0 ? (
              <div className="p-10 rounded-2xl theme-card-inner text-center space-y-3 border border-white/5 my-4">
                <Award className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="font-bold text-sm theme-text-primary font-['Tajawal']">لا توجد محاولات مسجلة حتى الآن</h4>
                <p className="text-xs theme-text-muted leading-relaxed max-w-md mx-auto font-['Tajawal']">
                  عند إكمال أي اختبار، ستُحفظ نتيجتك وإجاباتك هنا تلقائياً، لتتمكن من مراجعة أخطائك أو إعادة حل الأسئلة في أي وقت.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2 max-h-[55vh] overflow-y-auto pr-1">
                {history.map((att, idx) => {
                  const percent = Math.round((att.score / (att.totalQuestions || 1)) * 100);
                  const isSuccess = percent >= 60;
                  const dateStr = att.timestamp ? new Date(att.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—';
                  const wrongCount = att.wrongQuestionIds ? att.wrongQuestionIds.length : (att.totalQuestions - att.score);

                  return (
                    <div key={att.id || idx} className="p-4 rounded-2xl theme-card-inner border border-white/5 hover:border-emerald-500/30 transition space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {percent}%
                          </span>
                          <div>
                              <input
                                type="text"
                                value={att.name || `محاولة #${idx + 1}`}
                                onChange={(e) => renameAttempt(att.id, e.target.value)}
                                className="text-sm font-black theme-text-primary bg-transparent border-b border-transparent hover:border-slate-500 focus:border-emerald-500 outline-none transition font-['Tajawal']"
                                title="انقر لتعديل اسم المحاولة"
                              />
                              <div className="text-xs theme-text-muted flex items-center gap-2 mt-0.5">
                                <span>📅 {dateStr}</span>
                                <span>•</span>
                                <span>الدرجة: {att.score} من {att.totalQuestions}</span>
                                {wrongCount > 0 && <span className="text-rose-400 font-bold">({wrongCount} أخطاء)</span>}
                              </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setReviewAttemptId(att.id);
                              setIsCompleted(false);
                              setCurrentIdx(0);
                              setIsHistoryOpen(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm font-['Tajawal']"
                            title="مراجعة الإجابات الصحيحة والخاطئة لهذه المحاولة"
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            <span>مراجعة الأخطاء 👁️</span>
                          </button>

                          {att.wrongQuestionIds && att.wrongQuestionIds.length > 0 && (
                            <button
                              onClick={() => {
                                handleRetryWrongOnly(att);
                                setIsHistoryOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm font-['Tajawal']"
                              title="إعادة حل الأسئلة التي أخطأت فيها فقط"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إعادة الخاطئة فقط 🔁</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteAttempt(att.id)}
                            className="p-2 rounded-xl theme-header-btn border text-rose-400 hover:bg-rose-500/20 transition"
                            title="حذف هذا الاختبار من السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-6 py-2.5 rounded-xl theme-header-btn border text-xs font-bold font-['Tajawal']"
              >
                رجوع / إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Pre-generation Launch Studio
  if (!quizData && !loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <QWizard
          mode={mode}
          setMode={setMode}
          language={language}
          setLanguage={setLanguage}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          questionCount={questionCount}
          setQuestionCount={setQuestionCount}
          activeDoc={activeDoc}
          activePrompt={activePrompt}
          onOpenPromptManager={onOpenPromptManager}
          onHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          onOpenImport={() => setIsImportOpen(true)}
          showReturnToQuiz={!!cachedQuizData}
          onReturnToQuiz={() => setQuizData(cachedQuizData)}
          showResumeLast={history.length > 0 && !cachedQuizData}
          onResumeLast={() => {
            const lastAttempt = history[0];
            if (lastAttempt && (lastAttempt.quizData || lastAttempt.selectedAnswers)) {
              if (lastAttempt.quizData) setQuizData(lastAttempt.quizData);
              setReviewAttemptId(lastAttempt.id);
            } else {
              setIsHistoryOpen(true);
            }
          }}
          onGenerate={() => handleGenerateQuiz(difficulty, questionCount, language, false)}
          onExtract={() => handleGenerateQuiz(difficulty, questionCount, language, true)}
        />
        {renderModals()}
      </div>
    );
  }

  const handleChapterChange = (val) => {
    setSelectedChapterIdx(val);
    setCurrentIdx(0);
  };

  const flashcards = quizData?.flashcards || [];
  const currentCard = flashcards[cardIdx] || null;

  // Helper for flashcard language rendering
  const getCardFront = (card) => {
    if (!card) return '';
    if (viewLang === 'ar') return card.front_ar || card.front;
    if (viewLang === 'en') return card.front_en || card.front;
    // Bilingual
    return (
      <div className="space-y-2">
        <h3 className="text-xl font-black theme-text-primary leading-relaxed">{card.front_ar || card.front}</h3>
        {card.front_en && (
          <p className="text-sm font-semibold text-slate-400 font-sans dir-ltr text-center">{card.front_en}</p>
        )}
      </div>
    );
  };

  const getCardBack = (card) => {
    if (!card) return '';
    if (viewLang === 'ar') return card.back_ar || card.back;
    if (viewLang === 'en') return card.back_en || card.back;
    // Bilingual
    return (
      <div className="space-y-3 text-right">
        <p className="text-base font-bold theme-text-primary leading-relaxed font-['Tajawal']">{card.back_ar || card.back}</p>
        {card.back_en && (
          <p className="text-xs text-slate-400 font-sans pt-2 border-t border-white/10 dir-ltr">{card.back_en}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header Bar */}
      <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black theme-text-primary">
              {quizData?.chapter_title || 'استوديو الاختبارات الأكاديمية'}
            </h2>
            <p className="text-xs theme-text-muted mt-0.5">
              المستند: {activeDoc.filename} • {questions.length} أسئلة ({quizData?.difficulty_level || difficulty})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border">
            <button
              onClick={() => setMode('mcq')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'mcq'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              اختبار MCQ
            </button>
            <button
              onClick={() => setMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'flashcard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              بطاقات Flashcards
            </button>
          </div>

          {/* Compact Language Display Toggle */}
          <button
            onClick={() => {
              const nextLang = viewLang === 'bilingual' ? 'ar' : viewLang === 'ar' ? 'en' : 'bilingual';
              setViewLang(nextLang);
            }}
            className="px-3 py-1.5 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary transition flex items-center gap-1.5 cursor-pointer"
            title="تبديل لغة العرض (ثنائي / عربي / إنجليزي)"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-500" />
            <span>{viewLang === 'bilingual' ? '🌐 ثنائي' : viewLang === 'ar' ? '🇸🇦 عربي' : '🇬🇧 EN'}</span>
          </button>

          {/* Direct Export Trigger */}
          <button
            onClick={() => setIsAcademicExportOpen(true)}
            className="px-3 py-1.5 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary hover:border-emerald-500/50 transition flex items-center gap-1.5 cursor-pointer"
            title="تصدير بنك الأسئلة PDF / HTML"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>تصدير</span>
          </button>

          {/* Unified Tools Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-2 rounded-xl theme-header-btn border hover:border-emerald-500/50 transition flex items-center justify-center cursor-pointer"
              title="المزيد من الأدوات والإعدادات"
            >
              <Settings className="w-4 h-4 theme-text-muted hover:theme-text-primary" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 card p-2 z-30 theme-nav text-xs font-bold space-y-1 animate-fade-in font-['Tajawal']">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2 theme-text-primary cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span>تخصيص ومظهر الاختبار ⚙️</span>
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsHistoryOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>الاختبارات المحفوظة</span>
                  </div>
                  {history.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono">
                      {history.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsImportOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2 theme-text-primary cursor-pointer"
                >
                  <FileInput className="w-4 h-4 text-teal-400" />
                  <span>استيراد بنك أسئلة نصي</span>
                </button>
                <div className="border-t border-slate-200 dark:border-white/10 my-1"></div>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setCachedQuizData(quizData);
                    setQuizData(null);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-emerald-500 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>توليد بنك أسئلة جديد 🎯</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="card p-16 text-center animate-pulse">
          <BrainCircuit className="w-10 h-10 animate-pulse text-emerald-400 mx-auto" />
          <h3 className="text-lg font-black theme-text-primary">الذكاء الاصطناعي يستخرج أسئلة امتحانات محكمة...</h3>
          <p className="text-xs theme-text-muted">يتم إعداد الأسئلة والمشتتات والشروحات باللغة المحددة</p>
        </div>
      )}

      {/* Review Mode Banner */}
      {isReviewActive && (
        <div className="glass-panel p-4 rounded-2xl border border-dashed border-teal-500/30 bg-teal-500/5 text-center flex items-center justify-between gap-4 max-w-4xl mx-auto mb-4 animate-fade-in text-right">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <BrainCircuit className="w-5 h-5 text-teal-400" />
            <span>وضع مراجعة الأخطاء لمارسة: "{reviewAttempt?.name}" • النتيجة: {activeScore}/{questions.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRetryWrongOnly(reviewAttempt)}
              disabled={!reviewAttempt?.wrongQuestionIds?.length}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition disabled:opacity-50 font-['Tajawal']"
            >
              حل الأخطاء فقط 🔄
            </button>
            <button
              onClick={() => {
                setReviewAttemptId(null);
                setOnlyWrongQuestionsFilter(null);
                handleReset();
              }}
              className="px-3.5 py-1.5 rounded-xl theme-header-btn border text-xs font-black transition font-['Tajawal']"
            >
              الخروج من المراجعة 🔙
            </button>
          </div>
        </div>
      )}

      {/* Wrong Questions Mode Banner */}
      {onlyWrongQuestionsFilter && !isReviewActive && (
        <div className="glass-panel p-4 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center flex items-center justify-between gap-4 max-w-4xl mx-auto mb-4 animate-fade-in text-right">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span>أنت الآن في وضع إعادة حل الأسئلة الخاطئة فقط ({questions.length} أسئلة)</span>
          </div>
          <button
            onClick={() => {
              setOnlyWrongQuestionsFilter(null);
              handleReset();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition font-['Tajawal']"
          >
            العودة للاختبار الكامل 🔁
          </button>
        </div>
      )}

      {/* MCQ Mode View */}
      {mode === 'mcq' && currentQ && !loading && !isCompleted && (
        <div className="quiz-grid">
          {/* Main Question Column */}
          <div className="space-y-4">
            <div className="qbar">
              <span className="tag info">MCQ</span>
              <span className="text-[13px] theme-text-muted">السؤال {toAr(currentIdx + 1)} من {toAr(questions.length)}</span>
              <div className="progress" style={{ maxWidth: 220 }}>
                <i style={{ width: `${((currentIdx + 1) / (questions.length || 1)) * 100}%` }}></i>
              </div>
              {quizSettings.mode === 'exam' && timeLeft !== null && (
                <span className="text-[13px] theme-text-faint font-mono font-bold flex items-center gap-1">
                  ⏱ {formatTime(timeLeft)}
                </span>
              )}
              {currentQ.topic && (
                <span className="text-[13px] theme-text-faint">{currentQ.topic}</span>
              )}
              <div style={{ marginInlineStart: 'auto' }} className="flex gap-2">
                <button
                  onClick={() => setIsAcademicExportOpen(true)}
                  className="btn-ghost"
                  style={{ minHeight: 38, fontSize: 13, padding: '0 14px' }}
                  title="تصدير بنك الأسئلة PDF / HTML"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير</span>
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="iconbtn"
                  style={{ width: 38, height: 38 }}
                  title="إعدادات وتخصيص الاختبار"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="card card-pad space-y-4">
              {/* Dynamic Question Text based on viewLang with KaTeX Support */}
              <div className="space-y-2.5">
                {viewLang === 'ar' ? (
                  <div className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-['Tajawal']">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQ.question_ar || currentQ.question}
                    </ReactMarkdown>
                  </div>
                ) : viewLang === 'en' ? (
                  <div className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-sans dir-ltr text-right">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {currentQ.question_en || currentQ.question}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <>
                    <div className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-['Tajawal']">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {currentQ.question_ar || currentQ.question}
                      </ReactMarkdown>
                    </div>
                    {currentQ.question_en && (
                      <div className="text-sm font-semibold text-slate-400 font-sans leading-normal dir-ltr text-right pt-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {currentQ.question_en}
                        </ReactMarkdown>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Options List with KaTeX Support */}
              <div className="flex flex-col gap-2.5 pt-1">
                {currentQ.options?.map((opt, optIdx) => {
                  const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
                  const letter = letters[optIdx] || String.fromCharCode(1569 + optIdx);
                  const isSelected = activeAnswers[currentQ.id] === optIdx;
                  const isAnswered = activeAnswers[currentQ.id] !== undefined;
                  const isCorrect = optIdx === currentQ.correct_index;

                  const hideCorrection = (quizSettings.mode === 'exam' || quizSettings.showResult === 'final') && !isReviewActive;

                  let optClass = '';
                  let dimmed = false;
                  if (isAnswered) {
                    if (hideCorrection) {
                      if (isSelected) optClass = 'sel';
                      else dimmed = true;
                    } else {
                      if (isCorrect) optClass = 'correct';
                      else if (isSelected) optClass = 'wrong';
                      else dimmed = true;
                    }
                  }

                  let displayOpt = opt;
                  if (viewLang === 'ar' && currentQ.options_ar?.[optIdx]) {
                    displayOpt = currentQ.options_ar[optIdx];
                  } else if (viewLang === 'en' && currentQ.options_en?.[optIdx]) {
                    displayOpt = currentQ.options_en[optIdx];
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => {
                        if (isReviewActive) return;
                        handleSelectOption(currentQ.id, optIdx);
                      }}
                      disabled={isAnswered || isReviewActive}
                      className={`opt-card ${optClass}`}
                      style={dimmed ? { opacity: 0.5 } : undefined}
                    >
                      <span className="m">{letter}</span>
                      <div className="flex-1 text-sm font-bold theme-text-primary leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {displayOpt}
                        </ReactMarkdown>
                      </div>
                      {isAnswered && !hideCorrection && isCorrect && (
                        <CheckCircle2 className="check" style={{ width: 19, height: 19 }} />
                      )}
                      {isAnswered && !hideCorrection && isSelected && !isCorrect && (
                        <XCircle className="x" style={{ width: 19, height: 19 }} />
                      )}
                      {isAnswered && hideCorrection && isSelected && (
                        <CheckCircle2 className="check" style={{ width: 19, height: 19 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scientific Rationale Collapsible Explanation Box */}
              {activeAnswers[currentQ.id] !== undefined && !((quizSettings.mode === 'exam' || quizSettings.showResult === 'final') && !isReviewActive) && (
                <div className="space-y-2 mt-4 pt-4 border-t border-white/10 animate-fade-in">
                  <button
                    onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition hover:bg-emerald-500/20 font-['Tajawal']"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>التفسير والشرح الأكاديمي للحل</span>
                    </div>
                    <span>{isExplanationExpanded ? 'إخفاء ▲' : 'عرض الشرح والتفاصيل 👁️ ▼'}</span>
                  </button>

                  {isExplanationExpanded && (
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-right space-y-2.5 max-h-[220px] overflow-y-auto pr-2 animate-fade-in text-sm leading-relaxed">
                      {(viewLang === 'ar' || viewLang === 'bilingual') && (
                        <div className="theme-text-primary font-['Tajawal'] font-medium">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {currentQ.explanation_ar || currentQ.explanation}
                          </ReactMarkdown>
                        </div>
                      )}
                      {(viewLang === 'en' || (viewLang === 'bilingual' && currentQ.explanation_en)) && (
                        <div className="text-xs text-slate-400 font-sans pt-1 border-t border-white/5 dir-ltr text-right">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {currentQ.explanation_en || currentQ.explanation}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Pagination Footer */}
            <div className="q-foot">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="btn-ghost"
                style={{ minHeight: 40 }}
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <div className="mid">
                <button
                  type="button"
                  onClick={() => {
                    if (isReviewActive) return;
                    const qId = currentQ.id;
                    setMarkedQuestions(prev => ({
                      ...prev,
                      [qId]: !prev[qId]
                    }));
                  }}
                  className="btn-soft"
                  style={{
                    minHeight: 40,
                    background: activeMarked[currentQ.id] ? 'var(--warning-soft)' : undefined,
                    borderColor: activeMarked[currentQ.id] ? 'var(--warning)' : undefined,
                    color: activeMarked[currentQ.id] ? 'var(--warning)' : undefined
                  }}
                >
                  <Flag className="w-4 h-4" />
                  <span>{activeMarked[currentQ.id] ? 'إلغاء التعليم' : 'وضع علامة'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={activeAnswers[currentQ.id] === undefined && !isReviewActive}
                className="btn-primary"
                style={{ minHeight: 40 }}
              >
                <span>{currentIdx === questions.length - 1 ? 'عرض النتيجة' : 'التالي'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Index Side Column */}
          <div className="idx-card card">
            <div className="card-pad">
              <div className="flex items-center justify-between mb-3">
                <b className="text-sm theme-text-primary">الأسئلة</b>
                <span className="pill" style={{ minHeight: 30, fontSize: 12, padding: '0 10px' }}>
                  {toAr(questions.length)} سؤال
                </span>
              </div>

              {quizData && quizData.chapters && quizData.chapters.length > 0 && (
                <select
                  value={activeChapterIdx}
                  onChange={(e) => {
                    if (isReviewActive) return;
                    handleChapterChange(e.target.value);
                  }}
                  disabled={isReviewActive}
                  className="field mb-3 font-['Tajawal'] text-xs"
                >
                  <option value="all">عرض الكل / All Chapters ({quizData.chapters.flatMap(c => c.questions || []).length} سؤال)</option>
                  {quizData.chapters.map((ch, i) => (
                    <option key={ch.id || i} value={i}>
                      {ch.title || `الشابتر ${i + 1}`} ({ch.questions?.length || 0} أسئلة)
                    </option>
                  ))}
                </select>
              )}

              <div className="idx-grid">
                {questions.map((q, idx) => {
                  const isAns = activeAnswers[q.id] !== undefined;
                  const isCur = currentIdx === idx;
                  const isMarked = activeMarked[q.id];
                  let cellClass = '';
                  if (isCur) cellClass = 'cur';
                  else if (isAns) cellClass = 'done';
                  else if (isMarked) cellClass = 'flag';
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`idx-cell ${cellClass}`}
                    >
                      {toAr(idx + 1)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-1.5 text-xs theme-text-muted">
                <span className="flex items-center gap-2"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--success)' }}></i> حُلّ</span>
                <span className="flex items-center gap-2"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--warning)' }}></i> معلّمة للمراجعة</span>
                <span className="flex items-center gap-2"><i style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--accent)' }}></i> الجارية</span>
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center justify-center gap-1.5 font-['Tajawal'] mt-4"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>سجل الاختبارات السابقة ({toAr(history.length)})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Summary View */}
      {isCompleted && (
        <div className="card p-10 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black theme-text-primary">أحسنت! اكتمل الاختبار بنجاح 🎉</h3>
            <p className="text-xs theme-text-muted font-['Tajawal']">حصلت على {activeScore} من أصل {questions.length} إجابات صحيحة.</p>
          </div>

          <div className="p-4 rounded-2xl theme-card-inner text-center space-y-1">
            <span className="text-xs theme-text-muted font-['Tajawal']">النسبة المئوية:</span>
            <b className="text-3xl font-black text-teal-400 font-['JetBrains_Mono'] block">
              {Math.round((activeScore / (questions.length || 1)) * 100)}%
            </b>
          </div>

          {/* Rename Attempt Input */}
          {latestAttemptId && history.find(a => a.id === latestAttemptId) && (
            <div className="max-w-xs mx-auto p-3.5 rounded-2xl theme-card-inner border border-white/5 space-y-2 text-right">
              <span className="text-xs font-bold theme-text-secondary block font-['Tajawal']">تسمية هذه المحاولة (اختياري):</span>
              <input
                type="text"
                value={history.find(a => a.id === latestAttemptId)?.name || ''}
                onChange={(e) => renameAttempt(latestAttemptId, e.target.value)}
                className="w-full px-3 py-2 rounded-xl theme-card-inner border text-xs outline-none focus:border-emerald-500 font-['Tajawal'] theme-text-primary"
                placeholder="تسمية المحاولة..."
              />
            </div>
          )}

          <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
            <button
              onClick={() => handleRetryWrongOnly(history.find(a => a.id === latestAttemptId))}
              disabled={!latestAttemptId || !history.find(a => a.id === latestAttemptId)?.wrongQuestionIds?.length}
              className="w-full px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40 font-['Tajawal']"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الأسئلة الخاطئة فقط 🔄</span>
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 font-['Tajawal']"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة من البداية 🔁</span>
              </button>
              <button
                onClick={handleDiscussMistakes}
                className="flex-1 px-5 py-3 rounded-xl theme-header-btn border text-xs font-bold transition font-['Tajawal']"
              >
                مناقشة الأخطاء
              </button>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center justify-center gap-1.5 font-['Tajawal'] mt-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>عرض سجل المحاولات والاختبارات المحفوظة ({history.length}) 📋</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Flashcard Mode with Interactive Language Swap Button */}
      {mode === 'flashcard' && currentCard && !loading && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card Lang Swap Bar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5 text-xs font-bold theme-text-muted">
              <Languages className="w-4 h-4 text-teal-400" />
              <span>لغة البطاقة الحالية:</span>
            </div>
            <div className="flex items-center p-1 rounded-xl theme-card-inner border">
              <button
                onClick={() => setViewLang(viewLang === 'ar' ? 'en' : viewLang === 'en' ? 'bilingual' : 'ar')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-teal-400 hover:bg-white/10 transition flex items-center gap-1.5"
                title="تبديل اللغة"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>
                  {viewLang === 'bilingual' ? '🌐 ثنائي (EN + AR)' : viewLang === 'ar' ? '🇸🇦 عربي' : '🇬🇧 English'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="card p-12 min-h-[320px] flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.01] transition-all select-none relative group"
          >
            <span className="absolute top-4 right-4 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              بطاقة {cardIdx + 1} من {flashcards.length}
            </span>

            <span className="absolute top-4 left-4 text-xs font-bold theme-text-muted bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
              {flipped ? 'الوجه الخلفي (الشرح) 🔄' : 'الوجه الأمامي (المصطلح) 👁️'}
            </span>

            <div className="space-y-3 max-w-lg w-full">
              {flipped ? (
                <div className="animate-fade-in w-full">
                  {typeof getCardBack(currentCard) === 'string' ? (
                    <p className="text-base font-bold theme-text-primary leading-relaxed font-['Tajawal']">
                      {getCardBack(currentCard)}
                    </p>
                  ) : (
                    getCardBack(currentCard)
                  )}
                </div>
              ) : (
                <div className="animate-fade-in w-full">
                  {typeof getCardFront(currentCard) === 'string' ? (
                    <h3 className="text-2xl font-black theme-text-primary leading-relaxed font-['Tajawal']">
                      {getCardFront(currentCard)}
                    </h3>
                  ) : (
                    getCardFront(currentCard)
                  )}
                </div>
              )}
            </div>

            <span className="text-xs theme-text-muted mt-6 block opacity-60 group-hover:opacity-100 transition">
              انقر على البطاقة لقلبها
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setFlipped(false);
                setCardIdx(Math.max(0, cardIdx - 1));
              }}
              disabled={cardIdx === 0}
              className="px-5 py-2.5 rounded-xl theme-header-btn border text-xs font-bold transition disabled:opacity-40 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>البطاقة السابقة</span>
            </button>

            <span className="text-xs font-mono font-bold theme-text-muted">
              {cardIdx + 1} / {flashcards.length}
            </span>

            <button
              onClick={() => {
                setFlipped(false);
                setCardIdx(Math.min(flashcards.length - 1, cardIdx + 1));
              }}
              disabled={cardIdx === flashcards.length - 1}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 shadow-md"
            >
              <span>البطاقة التالية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {renderModals()}
    </div>
  );
}
