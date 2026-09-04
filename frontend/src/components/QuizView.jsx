import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Award, 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Upload, 
  KeyRound, 
  Wand2, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Copy, 
  Check, 
  FileInput, 
  X,
  Play,
  Sliders,
  HelpCircle,
  BookOpen,
  Target,
  GraduationCap,
  Languages,
  Repeat,
  Clock,
  Settings,
  Trash2,
  History,
  MoreHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchQuiz, exportQuizData, importQuizFromText, fetchQuizProgress, saveQuizProgress } from '../services/api';
import ExportModal from './ExportModal';

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
      <div className="glass-panel rounded-3xl p-16 text-center max-w-2xl mx-auto space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mx-auto flex items-center justify-center text-cyan-400">
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
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 mx-auto border border-white/20"
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
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-black">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد بنك أسئلة مخصص</span>
              </div>
              <h3 className="text-xl font-black theme-text-primary font-['Tajawal']">استيراد أسئلة جاهزة (لصق أو رفع ملف نصي)</h3>
              <p className="text-xs theme-text-muted font-['Tajawal']">
                الصق أسئلة MCQ المنسقة بصيغة Q_EN / Q_AR أو بصيغة ##Chapter
              </p>
            </div>

            {/* File Upload Trigger */}
            <div className="p-3.5 rounded-2xl theme-card-inner border border-dashed border-cyan-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileInput className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold theme-text-primary font-['Tajawal']">
                  {importFileName ? `الملف: ${importFileName}` : 'رفع ملف نصي مباشرة (.txt, .md)'}
                </span>
              </div>
              <label className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 cursor-pointer transition font-['Tajawal']">
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
              className="w-full theme-card-inner border rounded-2xl p-4 text-xs font-mono theme-text-primary outline-none focus:border-cyan-400 leading-relaxed"
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md disabled:opacity-50 font-['Tajawal']"
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
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-['Tajawal']"
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
                    className="flex-1 text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-['Tajawal']"
                  >
                    <option value="#1e3a8a">أزرق داكن (LMS)</option>
                    <option value="#4f46e5">نيلي (Indigo)</option>
                    <option value="#7c3aed">بنفسجي (Purple)</option>
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
                    className="flex-1 text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-['Tajawal']"
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
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-['Tajawal']"
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
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-['Tajawal']"
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
                  className="w-full text-xs font-bold theme-card-inner theme-text-primary border rounded-xl p-2.5 outline-none focus:border-indigo-500 font-mono text-center"
                />
              </div>

              {/* Shuffling Checkboxes */}
              <div className="space-y-2 pt-2 text-right">
                <label className="flex items-center gap-2 cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    checked={quizSettings.randomizeQuestions}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold theme-text-primary font-['Tajawal']">عشوائية ترتيب الأسئلة داخل الفصل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer justify-start">
                  <input
                    type="checkbox"
                    checked={quizSettings.randomizeOptions}
                    onChange={(e) => setQuizSettings(prev => ({ ...prev, randomizeOptions: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500"
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md font-['Tajawal']"
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
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
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
                    <div key={att.id || idx} className="p-4 rounded-2xl theme-card-inner border border-white/5 hover:border-indigo-500/30 transition space-y-3">
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
                              className="text-xs font-black theme-text-primary bg-transparent border-b border-transparent hover:border-slate-500 focus:border-indigo-500 outline-none transition font-['Tajawal']"
                              title="انقر لتعديل اسم المحاولة"
                            />
                            <div className="text-[11px] theme-text-muted flex items-center gap-2">
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
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm font-['Tajawal']"
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
        <div className="glass-panel rounded-3xl p-8 border shadow-xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>استوديو توليد بنك الأسئلة الأكاديمي المتقدم</span>
              </div>
              <h2 className="text-2xl font-black theme-text-primary">
                توليد أسئلة MCQ وبطاقات استذكار
              </h2>
              <p className="text-xs theme-text-secondary">
                المستند الحالي: <b className="theme-text-primary">{activeDoc.filename}</b> ({activeDoc.pages_count} صفحة • {activeDoc.words_count || 0} كلمة)
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {history.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center gap-1.5 font-['Tajawal']"
                  title="سجل الاختبارات والمحاولات السابقة"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>الاختبارات المحفوظة ({history.length})</span>
                </button>
              )}
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-cyan-500 hover:border-cyan-400 transition flex items-center gap-1.5 font-['Tajawal']"
                title="استيراد بنك أسئلة نصي جاهز"
              >
                <FileInput className="w-3.5 h-3.5" />
                <span>استيراد أسئلة جاهزة</span>
              </button>
              {cachedQuizData ? (
                <button
                  onClick={() => setQuizData(cachedQuizData)}
                  className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-indigo-400 hover:border-indigo-400/50 hover:text-indigo-300 transition flex items-center gap-1.5 font-['Tajawal'] shadow-sm"
                  title="الرجوع للاختبار الحالي"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>الرجوع للاختبار</span>
                </button>
              ) : history.length > 0 ? (
                <button
                  onClick={() => {
                    const lastAttempt = history[0];
                    if (lastAttempt && (lastAttempt.quizData || lastAttempt.selectedAnswers)) {
                      if (lastAttempt.quizData) setQuizData(lastAttempt.quizData);
                      setReviewAttemptId(lastAttempt.id);
                    } else {
                      setIsHistoryOpen(true);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center gap-1.5 font-['Tajawal']"
                  title="الرجوع للاختبارات المحفوظة"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>الرجوع للاختبارات</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-black theme-text-primary block">نوع الأداة المطلوبة:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('mcq')}
                className={`p-4 rounded-2xl border text-right transition flex items-center justify-between ${
                  mode === 'mcq'
                    ? 'bg-gradient-to-r from-indigo-600/25 to-cyan-600/15 border-indigo-500 shadow-md shadow-indigo-600/10'
                    : 'theme-card-inner border'
                }`}
              >
                <div>
                  <b className="text-xs font-black theme-text-primary block">اختيار من متعدد (MCQ)</b>
                  <span className="text-[11px] theme-text-muted">أسئلة ثنائية وشروحات وتنبؤ بالدرجة</span>
                </div>
                {mode === 'mcq' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>}
              </button>

              <button
                onClick={() => setMode('flashcard')}
                className={`p-4 rounded-2xl border text-right transition flex items-center justify-between ${
                  mode === 'flashcard'
                    ? 'bg-gradient-to-r from-indigo-600/25 to-cyan-600/15 border-indigo-500 shadow-md shadow-indigo-600/10'
                    : 'theme-card-inner border'
                }`}
              >
                <div>
                  <b className="text-xs font-black theme-text-primary block">بطاقات استذكار (Flashcards)</b>
                  <span className="text-[11px] theme-text-muted">بطاقات تفاعلية تدعم التبديل اللغوي الفوري</span>
                </div>
                {mode === 'flashcard' && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>}
              </button>
            </div>
          </div>

          {/* Language Selector Option */}
          <div className="space-y-2">
            <label className="text-xs font-black theme-text-primary flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-cyan-400" />
              <span>لغة توليد الأسئلة والبطاقات:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'bilingual', label: 'ثنائي اللغة (EN + AR)', desc: 'السؤال والخيارات والشروحات باللغتين 🌐', badge: 'موصى به' },
                { id: 'ar', label: 'اللغة العربية فقط', desc: 'صياغة ومصطلحات عربية فصحى 🇸🇦', badge: 'عربي' },
                { id: 'en', label: 'English Only', desc: 'Pure Academic English Terminology 🇬🇧', badge: 'English' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between cursor-pointer ${
                    language === l.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-cyan-500 shadow-md theme-text-primary ring-2 ring-cyan-500/20'
                      : 'theme-card-inner border hover:border-indigo-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <b className={`text-xs font-black ${language === l.id ? 'text-cyan-600 dark:text-cyan-400' : 'theme-text-primary'}`}>{l.label}</b>
                    {language === l.id && <span className="w-2 h-2 rounded-full bg-cyan-500"></span>}
                  </div>
                  <p className="text-[10px] theme-text-muted leading-relaxed">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty & Count Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black theme-text-primary block">مستوى الصعوبة الأكاديمية:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'سهل (مفاهيم)' },
                  { id: 'medium', label: 'متوسط (شامل)' },
                  { id: 'hard', label: 'صعب (امتحان)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                      difficulty === d.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'theme-card-inner border theme-text-muted hover:theme-text-primary'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black theme-text-primary block">عدد الأسئلة المطلوب:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2.5 rounded-xl border text-xs font-mono font-bold text-center transition cursor-pointer ${
                      questionCount === cnt
                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                        : 'theme-card-inner border theme-text-muted hover:theme-text-primary'
                    }`}
                  >
                    {cnt} أسئلة
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl theme-card-inner flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span className="theme-text-muted">قالب البرومبت:</span>
              <span className="font-bold theme-text-primary">{activePrompt?.title || 'الافتراضي المعتمد'}</span>
            </div>
            <button
              onClick={onOpenPromptManager}
              className="text-[11px] font-bold text-indigo-500 hover:underline"
            >
              اختيار قالب آخر
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => handleGenerateQuiz(difficulty, questionCount, language, false)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:scale-[1.01] text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/25 border border-white/20 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>بدء توليد بنك الأسئلة الأكاديمي الآن 🎯</span>
            </button>
            <button
              onClick={() => handleGenerateQuiz(difficulty, questionCount, language, true)}
              className="w-full py-4 rounded-2xl bg-transparent hover:bg-white/5 text-indigo-400 font-bold text-sm flex items-center justify-center gap-3 border border-indigo-500/30 transition cursor-pointer"
            >
              <FileInput className="w-4 h-4" />
              <span>استخراج الأسئلة الجاهزة من الملف (بدون تأليف) 📄</span>
            </button>
          </div>
        </div>
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
      <div className="glass-panel rounded-2xl p-6 border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black theme-text-primary">
              {quizData?.chapter_title || 'استوديو الاختبارات الأكاديمية'}
            </h2>
          </div>
          <p className="text-xs theme-text-muted">
            المستند: {activeDoc.filename} • {questions.length} أسئلة ({quizData?.difficulty_level || difficulty})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border">
            <button
              onClick={() => setMode('mcq')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'mcq'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              اختبار MCQ
            </button>
            <button
              onClick={() => setMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                mode === 'flashcard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              بطاقات Flashcards
            </button>
          </div>

          {/* Interactive Language Display Switcher */}
          <div className="flex items-center p-1 rounded-xl theme-card-inner border" title="تبديل لغة العرض">
            <button
              onClick={() => setViewLang('bilingual')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                viewLang === 'bilingual' ? 'bg-cyan-600 text-white shadow-sm' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              🌐 ثنائي
            </button>
            <button
              onClick={() => setViewLang('ar')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                viewLang === 'ar' ? 'bg-cyan-600 text-white shadow-sm' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              🇸🇦 عربي
            </button>
            <button
              onClick={() => setViewLang('en')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                viewLang === 'en' ? 'bg-cyan-600 text-white shadow-sm' : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {/* Timer Countdown Pill */}
          {timeLeft !== null && !isCompleted && !isReviewActive && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-sm transition font-mono ${
              timeLeft < 300 
                ? 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse' 
                : 'theme-card-inner theme-text-primary'
            }`}>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Direct Export Trigger */}
          <button
            onClick={() => setIsAcademicExportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-1.5 font-['Tajawal'] cursor-pointer"
            title="تصدير بنك الأسئلة PDF / HTML"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير 📄</span>
          </button>

          {/* Unified Tools Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="px-3 py-2 rounded-xl theme-header-btn border hover:text-cyan-400 transition flex items-center gap-1.5 font-bold text-xs font-['Tajawal']"
              title="المزيد من الأدوات والإعدادات"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>الأدوات ⚙️</span>
            </button>

            {isMoreMenuOpen && (
              <div className="absolute left-0 mt-2 w-60 glass-panel rounded-2xl p-2 shadow-2xl z-30 border theme-nav text-xs font-bold space-y-1 animate-fade-in font-['Tajawal']">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition flex items-center gap-2 theme-text-primary cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>تخصيص ومظهر الاختبار ⚙️</span>
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsHistoryOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>الاختبارات المحفوظة</span>
                  </div>
                  {history.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono">
                      {history.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsImportOpen(true);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition flex items-center gap-2 theme-text-primary cursor-pointer"
                >
                  <FileInput className="w-4 h-4 text-cyan-400" />
                  <span>استيراد بنك أسئلة نصي</span>
                </button>
                <div className="border-t border-slate-200 dark:border-white/10 my-1"></div>
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setCachedQuizData(quizData);
                    setQuizData(null);
                  }}
                  className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-white/10 dark:hover:bg-slate-800/80 transition flex items-center gap-2 text-cyan-500 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>توليد بنك أسئلة جديد 🎯</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="glass-panel rounded-3xl p-16 text-center space-y-4 border animate-pulse">
          <BrainCircuit className="w-10 h-10 animate-pulse text-indigo-400 mx-auto" />
          <h3 className="text-lg font-black theme-text-primary">الذكاء الاصطناعي يستخرج أسئلة امتحانات محكمة...</h3>
          <p className="text-xs theme-text-muted">يتم إعداد الأسئلة والمشتتات والشروحات باللغة المحددة</p>
        </div>
      )}

      {/* Review Mode Banner */}
      {isReviewActive && (
        <div className="glass-panel p-4 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 text-center flex items-center justify-between gap-4 max-w-4xl mx-auto mb-4 animate-fade-in text-right">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span>وضع مراجعة الأخطاء لمارسة: "{reviewAttempt?.name}" • النتيجة: {activeScore}/{questions.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleRetryWrongOnly(reviewAttempt)}
              disabled={!reviewAttempt?.wrongQuestionIds?.length}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black transition disabled:opacity-50 font-['Tajawal']"
            >
              حل الأخطاء فقط 🔄
            </button>
            <button
              onClick={() => {
                setReviewAttemptId(null);
                setOnlyWrongQuestionsFilter(null);
                handleReset();
              }}
              className="px-3.5 py-1.5 rounded-lg theme-header-btn border text-[11px] font-black transition font-['Tajawal']"
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
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black transition font-['Tajawal']"
          >
            العودة للاختبار الكامل 🔁
          </button>
        </div>
      )}

      {/* MCQ Mode View */}
      {mode === 'mcq' && currentQ && !loading && !isCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Question Card Column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Question Quick Navigator Bar */}
            <div className="glass-card rounded-2xl p-3.5 border shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold theme-text-muted">فهرس الأسئلة:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {questions.map((q, qIdx) => {
                    const isCur = qIdx === currentIdx;
                    const isAns = activeAnswers[q.id] !== undefined;
                    return (
                      <button
                        key={q.id || qIdx}
                        onClick={() => setCurrentIdx(qIdx)}
                        className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                          isCur
                            ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30'
                            : isAns
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'theme-card-inner border theme-text-muted hover:theme-text-primary'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {quizSettings.mode === 'exam' && timeLeft !== null && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(timeLeft)}</span>
                  </span>
                )}
                <span className="text-xs font-bold theme-text-muted">
                  المستوى: <b>{difficulty === 'hard' ? 'متقدم (Exam)' : difficulty === 'easy' ? 'مبتدئ' : 'متوسط'}</b>
                </span>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 md:p-8 border space-y-6 shadow-lg">
              
              {/* Question Header */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-black flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>السؤال رقم {currentIdx + 1} من {questions.length}</span>
                  </span>
                  {currentQ.cognitive_level && (
                    <span className="px-2.5 py-1 rounded-lg theme-card-inner border text-xs font-bold theme-text-muted">
                      {currentQ.cognitive_level}
                    </span>
                  )}
                </div>
                {currentQ.topic && (
                  <span className="text-xs font-bold theme-text-muted">
                    الموضوع: {currentQ.topic}
                  </span>
                )}
              </div>

              {/* Dynamic Question Text based on viewLang */}
              <div className="space-y-2.5">
                {viewLang === 'ar' ? (
                  <h3 className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-['Tajawal']">
                    {currentQ.question_ar || currentQ.question}
                  </h3>
                ) : viewLang === 'en' ? (
                  <h3 className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-sans dir-ltr text-right">
                    {currentQ.question_en || currentQ.question}
                  </h3>
                ) : (
                  <>
                    <h3 className="text-lg md:text-xl font-black theme-text-primary leading-relaxed font-['Tajawal']">
                      {currentQ.question_ar || currentQ.question}
                    </h3>
                    {currentQ.question_en && (
                      <p className="text-sm font-semibold text-slate-400 font-sans leading-normal dir-ltr text-right">
                        {currentQ.question_en}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  const letter = letters[optIdx];
                  const isSelected = activeAnswers[currentQ.id] === optIdx;
                  const isAnswered = activeAnswers[currentQ.id] !== undefined;
                  const isCorrect = optIdx === currentQ.correct_index;

                  const hideCorrection = (quizSettings.mode === 'exam' || quizSettings.showResult === 'final') && !isReviewActive;

                  let optClass = 'theme-card-inner border hover:border-indigo-400';
                  if (isAnswered) {
                    if (hideCorrection) {
                      if (isSelected) {
                        optClass = 'bg-indigo-650/40 border-indigo-500 text-indigo-300 shadow-md';
                      } else {
                        optClass = 'opacity-60 theme-card-inner border';
                      }
                    } else {
                      if (isCorrect) {
                        optClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10';
                      } else if (isSelected) {
                        optClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
                      } else {
                        optClass = 'opacity-50 theme-card-inner border';
                      }
                    }
                  }

                  // Option display logic
                  let displayOpt = opt;
                  if (viewLang === 'ar' && currentQ.options_ar?.[optIdx]) {
                    displayOpt = currentQ.options_ar[optIdx];
                  } else if (viewLang === 'en' && currentQ.options_en?.[optIdx]) {
                    displayOpt = currentQ.options_en[optIdx];
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => {
                        if (isReviewActive) return;
                        handleSelectOption(currentQ.id, optIdx);
                      }}
                      disabled={isAnswered || isReviewActive}
                      className={`w-full p-4 rounded-2xl text-right transition-all flex items-start gap-3.5 ${optClass}`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isAnswered && !hideCorrection && isCorrect
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : isAnswered && !hideCorrection && isSelected
                          ? 'bg-rose-500 text-white font-black'
                          : isAnswered && hideCorrection && isSelected
                          ? 'bg-indigo-500 text-white font-black'
                          : 'bg-white/10 theme-text-primary'
                      }`}>
                        {letter}
                      </span>
                      <div className="flex-1 text-sm font-bold theme-text-primary leading-relaxed">
                        {displayOpt}
                      </div>
                      {isAnswered && !hideCorrection && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />}
                      {isAnswered && !hideCorrection && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Pagination Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="px-4 py-2.5 rounded-xl theme-header-btn border text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 font-['Tajawal']"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  onClick={() => {
                    if (isReviewActive) return;
                    const qId = currentQ.id;
                    setMarkedQuestions(prev => ({
                      ...prev,
                      [qId]: !prev[qId]
                    }));
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 font-['Tajawal'] ${
                    activeMarked[currentQ.id]
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'theme-header-btn border'
                  }`}
                >
                  <span>{activeMarked[currentQ.id] ? 'إلغاء التعليم ⚪' : 'تعليم السؤال 🔴'}</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={activeAnswers[currentQ.id] === undefined && !isReviewActive}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-indigo-600/25 font-['Tajawal']"
                >
                  <span>{currentIdx === questions.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Scientific Rationale Collapsible Explanation Box */}
              {activeAnswers[currentQ.id] !== undefined && !((quizSettings.mode === 'exam' || quizSettings.showResult === 'final') && !isReviewActive) && (
                <div className="space-y-2 mt-4 pt-4 border-t border-white/10 animate-fade-in">
                  <button
                    onClick={() => setIsExplanationExpanded(!isExplanationExpanded)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition hover:bg-indigo-500/20 font-['Tajawal']"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>التفسير والشرح الأكاديمي للحل</span>
                    </div>
                    <span>{isExplanationExpanded ? 'إخفاء ▲' : 'عرض الشرح والتفاصيل 👁️ ▼'}</span>
                  </button>

                  {isExplanationExpanded && (
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-white/5 text-right space-y-2.5 max-h-[180px] overflow-y-auto pr-2 animate-fade-in">
                      {(viewLang === 'ar' || viewLang === 'bilingual') && (
                        <p className="text-xs theme-text-primary leading-relaxed font-['Tajawal']">
                          {currentQ.explanation_ar || currentQ.explanation}
                        </p>
                      )}
                      {(viewLang === 'en' || (viewLang === 'bilingual' && currentQ.explanation_en)) && (
                        <p className="text-[11px] text-slate-400 font-sans pt-1 border-t border-white/5 dir-ltr text-right">
                          {currentQ.explanation_en || currentQ.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-4">

            <div className="glass-card rounded-2xl p-5 border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs theme-text-muted font-['Tajawal']">فهرس الأسئلة</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold font-mono">
                  {questions.length} سؤال
                </span>
              </div>

              {/* Chapter Selector Dropdown */}
              {quizData && quizData.chapters && quizData.chapters.length > 0 && (
                <div className="space-y-1">
                  <select
                    value={activeChapterIdx}
                    onChange={(e) => {
                      if (isReviewActive) return;
                      handleChapterChange(e.target.value);
                    }}
                    disabled={isReviewActive}
                    className="w-full text-xs font-bold theme-card-inner border rounded-xl p-2.5 outline-none focus:border-cyan-500 transition cursor-pointer theme-text-primary font-['Tajawal'] disabled:opacity-50"
                  >
                    <option value="all">عرض الكل / All Chapters ({quizData.chapters.flatMap(c => c.questions || []).length} سؤال)</option>
                    {quizData.chapters.map((ch, i) => (
                      <option key={ch.id || i} value={i}>
                        {ch.title || `الشابتر ${i + 1}`} ({ch.questions?.length || 0} أسئلة)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAns = activeAnswers[q.id] !== undefined;
                  const isCorrect = isAns && activeAnswers[q.id] === q.correct_index;
                  const isCur = currentIdx === idx;
                  const isMarked = activeMarked[q.id];
                  return (
                    <div key={q.id || idx} className="relative">
                      <button
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-full h-9 rounded-xl font-bold text-xs transition ${
                          isCur
                            ? 'border-2 border-cyan-400 bg-cyan-500/20 text-cyan-300 font-extrabold shadow-sm ring-1 ring-cyan-400/20'
                            : isAns
                            ? isCorrect
                              ? 'bg-emerald-600 dark:bg-emerald-600/90 text-white font-black shadow-sm'
                              : 'bg-rose-600 dark:bg-rose-600/90 text-white font-black shadow-sm'
                            : 'theme-card-inner theme-text-muted hover:theme-text-primary'
                        }`}
                      >
                        {idx + 1}
                      </button>
                      {isMarked && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900 animate-pulse shadow-sm shadow-rose-500/50"></span>
                      )}
                    </div>
                  );
                })}
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl theme-card-inner border text-xs font-bold text-amber-400 hover:border-amber-400/50 transition flex items-center justify-center gap-1.5 font-['Tajawal']"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>سجل الاختبارات السابقة ({history.length}) 📋</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Completed Summary View */}
      {isCompleted && (
        <div className="glass-panel rounded-3xl p-10 max-w-xl mx-auto text-center space-y-6 shadow-2xl animate-fade-in border">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400">
            <Award className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black theme-text-primary">أحسنت! اكتمل الاختبار بنجاح 🎉</h3>
            <p className="text-xs theme-text-muted font-['Tajawal']">حصلت على {activeScore} من أصل {questions.length} إجابات صحيحة.</p>
          </div>

          <div className="p-4 rounded-2xl theme-card-inner text-center space-y-1">
            <span className="text-xs theme-text-muted font-['Tajawal']">النسبة المئوية:</span>
            <b className="text-3xl font-black text-cyan-400 font-['JetBrains_Mono'] block">
              {Math.round((activeScore / (questions.length || 1)) * 100)}%
            </b>
          </div>

          {/* Rename Attempt Input */}
          {latestAttemptId && history.find(a => a.id === latestAttemptId) && (
            <div className="max-w-xs mx-auto p-3.5 rounded-2xl theme-card-inner border border-white/5 space-y-2 text-right">
              <span className="text-[11px] font-bold theme-text-secondary block font-['Tajawal']">تسمية هذه المحاولة (اختياري):</span>
              <input
                type="text"
                value={history.find(a => a.id === latestAttemptId)?.name || ''}
                onChange={(e) => renameAttempt(latestAttemptId, e.target.value)}
                className="w-full px-3 py-2 rounded-xl theme-card-inner border text-xs outline-none focus:border-indigo-500 font-['Tajawal'] theme-text-primary"
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
                className="flex-1 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 font-['Tajawal']"
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
              <Languages className="w-4 h-4 text-cyan-400" />
              <span>لغة البطاقة الحالية:</span>
            </div>
            <div className="flex items-center p-1 rounded-xl theme-card-inner border">
              <button
                onClick={() => setViewLang(viewLang === 'ar' ? 'en' : viewLang === 'en' ? 'bilingual' : 'ar')}
                className="px-3 py-1 rounded-lg text-xs font-bold text-cyan-400 hover:bg-white/10 transition flex items-center gap-1.5"
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
            className="glass-card rounded-3xl p-12 min-h-[320px] border flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl hover:scale-[1.01] transition-all select-none relative group"
          >
            <span className="absolute top-4 right-4 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
              بطاقة {cardIdx + 1} من {flashcards.length}
            </span>

            <span className="absolute top-4 left-4 text-[10px] font-bold theme-text-muted bg-white/5 px-2.5 py-1 rounded-full flex items-center gap-1">
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

            <span className="text-[11px] theme-text-muted mt-6 block opacity-60 group-hover:opacity-100 transition">
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-2 shadow-md"
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
