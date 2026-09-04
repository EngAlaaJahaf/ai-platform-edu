import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import { 
  Send, 
  Square, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  Check, 
  Copy, 
  Bot, 
  User, 
  FileText, 
  Upload, 
  KeyRound,
  Download,
  Printer,
  FileCode,
  RotateCcw,
  Edit3,
  Trash2,
  Share2,
  CheckCircle2,
  ChevronDown,
  Wand2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  ThumbsUp,
  ThumbsDown,
  ArrowDown,
  CornerDownLeft,
  Search,
  Plus,
  MessageSquare,
  MessageSquarePlus,
  X,
  Layers,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { sendChatMessage, sendChatMessageStream, getApiKey, getSelectedModel, setSelectedModel, getAIProvider, getBaseUrl, fetchAvailableModels, fetchCurrentUser } from '../services/api';
import ExportModal from './ExportModal';
import ChatSidebar from './ChatSidebar';

// Arabic Typography, Word Spacing & LaTeX Masking Formatter
function formatArabicText(text) {
  if (!text || typeof text !== 'string') return text;

  // 1. Temporarily mask code blocks and LaTeX math ($...$ / $$...$$) to avoid altering math syntax
  const placeholders = [];
  const masked = text.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g, (match) => {
    placeholders.push(match);
    return `___MATH_BLOCK_${placeholders.length - 1}___`;
  });

  // 2. Add line breaks after citation blocks when touching new sections/text
  // E.g. "[المصدر: صفحة 2]حالة تطبيقية" -> "[المصدر: صفحة 2]\n\nحالة تطبيقية"
  let cleaned = masked.replace(/(\[المصدر:[^\]\n]+\])\s*([^\s\n\]\)])/g, '$1\n\n$2');

  // 3. Add proper line break before sub-questions (e.g. "أ) ", "ب) ", "ج) ", "د) ")
  cleaned = cleaned.replace(/([^\n])\s*([أ-ي]\))\s*/g, '$1\n$2 ');

  // 4. Bracket spacing: Spacing after closing ] and ) when touching Arabic letters
  cleaned = cleaned.replace(/([\]\)])([\u0600-\u06FF])/g, '$1 $2');
  // Spacing before opening [ and ( when touching Arabic letters
  cleaned = cleaned.replace(/([\u0600-\u06FF])([\[\(])/g, '$1 $2');

  // 5. Punctuation spacing (colon, comma, semicolon, exclamation, question mark)
  cleaned = cleaned.replace(/([\u0600-\u06FF]):([\u0600-\u06FFa-zA-Z$])/g, '$1: $2');
  cleaned = cleaned.replace(/([\u0600-\u06FF])([،؛!؟])([\u0600-\u06FFa-zA-Z$])/g, '$1$2 $3');

  // 6. Spacing between Arabic and Latin tokens
  cleaned = cleaned.replace(/([\u0600-\u06FF])([a-zA-Z])/g, '$1 $2');
  cleaned = cleaned.replace(/([a-zA-Z])([\u0600-\u06FF])/g, '$1 $2');

  // 7. Fix Arabic prepositions concatenated with definite nouns (e.g. منالجيران -> من الجيران)
  const prepositions = '(من|في|عن|مع|بين|عند|لدى|نحو|ضد|حول|دون|غير|مثل|كافة|جميع|معظم|أغلب|سائر|حيث|حين|بأن|فإن|ولكن|حتى|إلى|على)';
  cleaned = cleaned.replace(new RegExp(`\\b${prepositions}(ال[\\u0600-\\u06FF]{2,})\\b`, 'g'), '$1 $2');

  // 8. Fix common Arabic prefix nouns / superlatives + definite nouns (e.g. خطواتالتنبؤ -> خطوات التنبؤ)
  const prefixes = '(خطوات|مراحل|عناصر|خصائص|مميزات|عيوب|أهداف|نتائج|طرق|أنواع|أشكال|أمثلة|أسباب|حلول|بيانات|تحديد|حساب|استخراج|استخدام|تطبيق|دراسة|تحليل|تقييم|توضيح|شرح|إيجاد|معرفة|فهم|مفهوم|نموذج|خوارزمية|نظام|طريقة|عملية|قيمة|نسبة|معدل|دالة|مصفوفة|متجه|معادلة|فرضية|نظرية|قاعدة|فكرة|مشكلة|نوع|عنصر|خاصية|ميزة|هدف|نتيجة|سبب|حل|بيان|نقطة|نقاط|درجة|مستوى|مجال|قسم|فصل|باب|صفحة|سؤال|إجابة|جواب|أقرب|أبعد|أكبر|أصغر|أفضل|أحسن|أسوأ|أهم|أكثر|أقل|أعلى|أدنى|أول|آخر|أحد|إحدى)';
  cleaned = cleaned.replace(new RegExp(`\\b${prefixes}(ال[\\u0600-\\u06FF]{2,})\\b`, 'g'), '$1 $2');

  // 9. Restore code and math placeholders
  placeholders.forEach((orig, i) => {
    cleaned = cleaned.replace(`___MATH_BLOCK_${i}___`, orig);
  });

  return cleaned;
}

// Smart Language Detection Function
function detectLanguage(rawLang, codeContent) {
  const normalized = (rawLang || '').trim().toLowerCase();
  
  const explicitMap = {
    py: 'python',
    python: 'python',
    js: 'javascript',
    javascript: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    sh: 'bash',
    bash: 'bash',
    shell: 'bash',
    zsh: 'bash',
    sql: 'sql',
    json: 'json',
    html: 'markup',
    markup: 'markup',
    xml: 'markup',
    css: 'css',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    csharp: 'csharp',
    text: 'plaintext',
    txt: 'plaintext',
    plaintext: 'plaintext',
    plain: 'plaintext'
  };

  if (normalized && explicitMap[normalized]) {
    return explicitMap[normalized];
  }

  const trimmed = (codeContent || '').trim();

  // If single line or short phrase without syntax keywords (e.g. "train_test_split") -> plaintext
  if (!trimmed.includes('\n') && !trimmed.includes(';') && !trimmed.includes('import ') && !trimmed.includes('def ') && !trimmed.includes('const ') && !trimmed.includes('SELECT ')) {
    return 'plaintext';
  }

  // Check JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch (_) {}
  }

  // Check Python
  if (
    /(^|\s)(import\s+[\w.]+|from\s+[\w.]+\s+import|def\s+\w+\s*\(|class\s+\w+|print\s*\(|elif\s+|if\s+__name__\s*==|return\s+|np\.|pd\.|plt\.)/m.test(trimmed)
  ) {
    return 'python';
  }

  // Check JavaScript / TypeScript
  if (
    /(^|\s)(const\s+\w+|let\s+\w+|var\s+\w+|function\s*\w*\s*\(|console\.log|export\s+(default|const)|import\s+.*from\s+['"]|=>\s*\{|\basync\s+function)/m.test(trimmed)
  ) {
    return 'javascript';
  }

  // Check SQL
  if (
    /\b(SELECT\s+[\s\S]+FROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET|DELETE\s+FROM|WHERE\s+\w+|GROUP\s+BY|ORDER\s+BY)\b/i.test(trimmed)
  ) {
    return 'sql';
  }

  // Check HTML / XML
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed) && (trimmed.includes('</div>') || trimmed.includes('</span>') || trimmed.includes('<html') || trimmed.includes('<p>'))) {
    return 'markup';
  }

  // Check Bash / Shell
  if (
    /(^|\s)(npm\s+(run|install|i)|pip\s+install|git\s+(clone|commit|push|pull|status)|docker\s+run|sudo\s+apt|cd\s+[\w/.~]+|chmod\s+\+x)/m.test(trimmed)
  ) {
    return 'bash';
  }

  // Check C / C++ / Java
  if (
    /(#include\s+<[\w.]+>|public\s+class\s+\w+|int\s+main\s*\(|std::cout|System\.out\.println)/m.test(trimmed)
  ) {
    return 'cpp';
  }

  return 'plaintext';
}

const displayBadgeMap = {
  python: 'PYTHON',
  javascript: 'JAVASCRIPT',
  typescript: 'TYPESCRIPT',
  jsx: 'REACT JSX',
  tsx: 'REACT TSX',
  bash: 'BASH / TERMINAL',
  sql: 'SQL DATABASE',
  json: 'JSON DATA',
  markup: 'HTML / XML',
  css: 'CSS STYLES',
  java: 'JAVA',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  plaintext: 'PLAIN TEXT'
};

// Custom Syntax-Highlighted CodeBlock Component
function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');
  const lang = detectLanguage(rawLang, codeContent);
  const [copied, setCopied] = useState(false);

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-mono text-xs dir-ltr inline-block" {...props}>
        {children}
      </code>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let highlightedHtml = '';
  if (lang !== 'plaintext' && Prism.languages[lang]) {
    try {
      highlightedHtml = Prism.highlight(codeContent, Prism.languages[lang], lang);
    } catch (e) {
      highlightedHtml = '';
    }
  }

  const badgeText = displayBadgeMap[lang] || (rawLang ? rawLang.toUpperCase() : 'TEXT');

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-700/60 bg-[#1d1f21] font-mono text-xs shadow-2xl dir-ltr text-left">
      <div className="px-4 py-2.5 bg-[#151718] border-b border-slate-800 flex items-center justify-between text-slate-400 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90"></span>
          </div>
          <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${
            lang === 'plaintext' ? 'text-slate-400' : 'text-teal-400'
          }`}>
            {badgeText}
          </span>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10 cursor-pointer"
          title="نسخ الكود"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-100 leading-relaxed font-mono dir-ltr text-left m-0 bg-transparent">
        {highlightedHtml ? (
          <code
            className={`language-${lang} font-mono`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code className="font-mono text-slate-200">{codeContent}</code>
        )}
      </pre>
    </div>
  );
}

export default function ChatView({ 
  activeDoc, 
  activePrompt,
  onOpenPromptManager,
  onSwitchToQuiz, 
  onSwitchToSummary, 
  onOpenUpload, 
  onOpenApiKey 
}) {
  // Master multi-session state
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('eduai_chat_sessions_master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => ({ projectId: null, exported: [], ...s }));
        }
      }
    } catch (_) {}
    return [
      {
        id: 'sess_default',
        title: activeDoc ? `محادثة: ${activeDoc.filename}` : 'محادثة عامة جديدة',
        docId: activeDoc?.doc_id || null,
        docName: activeDoc?.filename || null,
        createdAt: new Date().toLocaleDateString('ar-EG'),
        updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        messages: [
          {
            id: 'welcome',
            sender: 'ai',
            text: activeDoc 
              ? `مرحباً بك! 👋 أنا **ذكاء**، مساعدك الأكاديمي.\n\nتم فتح هذه الجلسة المخصصة لمستند: **${activeDoc.filename}** (${activeDoc.pages_count} صفحة).\n\nاسألني عن أي تفصيل أو مفهوم وسأجيبك باقتباس ورقم الصفحة من ملفك مباشرة!`
              : `أهلاً بك! 👋 أنا **ذكاء** — المساعد الأكاديمي الذكي.\n\nيمكنك الآن طرح استفساراتك أو إنشاء محادثة جديدة وتخصيصها لمادة دراسية معينة.`,
            citations: activeDoc ? [1] : [],
            is_out_of_scope: false,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('eduai_active_session_id') || 'sess_default';
  });

  const [messages, setMessages] = useState(() => {
    try {
      const activeSnapshot = localStorage.getItem('eduai_active_chat_messages');
      if (activeSnapshot) {
        const snapshot = JSON.parse(activeSnapshot);
        if (Array.isArray(snapshot) && snapshot.length > 0) {
          const cleaned = snapshot.filter(
            (m) => m.sender !== 'ai' || (m.text && m.text.trim() !== '') || m.streaming
          );
          if (cleaned.length > 0) return cleaned;
        }
      }
      const savedSessions = localStorage.getItem('eduai_chat_sessions_master');
      const activeId = localStorage.getItem('eduai_active_session_id') || 'sess_default';
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const current = parsed.find(s => s.id === activeId) || parsed[0];
        if (current && Array.isArray(current.messages) && current.messages.length > 0) {
          const cleaned = current.messages.filter(
            (m) => m.sender !== 'ai' || (m.text && m.text.trim() !== '') || m.streaming
          );
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (_) {}
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: activeDoc 
          ? `مرحباً بك! 👋 أنا **ذكاء**، مساعدك الأكاديمي.\n\nتم فتح هذه الجلسة المخصصة لمستند: **${activeDoc.filename}** (${activeDoc.pages_count} صفحة).\n\nاسألني عن أي تفصيل أو مفهوم وسأجيبك باقتباس ورقم الصفحة من ملفك مباشرة!`
          : `أهلاً بك! 👋 أنا **ذكاء** — المساعد الأكاديمي الذكي.\n\nيمكنك الآن طرح استفساراتك أو إنشاء محادثة جديدة وتخصيصها لمادة دراسية معينة.`,
        citations: activeDoc ? [1] : [],
        is_out_of_scope: false,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [activeExportId, setActiveExportId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Sessions Modal & Search state
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [highlight, setHighlight] = useState(null); // { messageId, keyword }

  // Voice & TTS states
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [navThumb, setNavThumb] = useState(0);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const hideNavTimer = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const exportMenuRef = useRef(null);
  const modelDropdownRef = useRef(null);
  const latestMessagesRef = useRef(messages);
  const model = getSelectedModel();
  const [chatModel, setChatModel] = useState(model);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [chatModels, setChatModels] = useState([]);
  const [fetchingChatModels, setFetchingChatModels] = useState(false);
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamControllerRef = useRef(null);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    async function loadChatModels() {
      try {
        setFetchingChatModels(true);
        const provider = getAIProvider();
        const baseUrl = getBaseUrl();
        const apiKey = getApiKey();
        const models = await fetchAvailableModels(provider, baseUrl, apiKey);
        if (models && models.length) {
          setChatModels(models.map(m => typeof m === 'string' ? m : m.id));
        } else {
          setChatModels([chatModel]);
        }
      } catch {}
      setFetchingChatModels(false);
    }
    loadChatModels();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync active session messages to localStorage
  useEffect(() => {
    if (sessions.length > 0 && activeSessionId && messages.length > 0) {
      setSessions(prevSessions => {
        const updated = prevSessions.map(sess => {
          if (sess.id === activeSessionId) {
            return {
              ...sess,
              messages,
              updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            };
          }
          return sess;
        });
        try {
          localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated));
          localStorage.setItem('eduai_active_chat_messages', JSON.stringify(messages));
        } catch (_) {}
        return updated;
      });
      try {
        localStorage.setItem('eduai_active_session_id', activeSessionId);
      } catch (_) {}
    }
  }, [messages, activeSessionId]);

  // Create a new session
  const handleCreateNewSession = (customTitle = '') => {
    const newId = `sess_${Date.now()}`;
    const title = customTitle.trim() || (activeDoc ? `محادثة: ${activeDoc.filename} (${sessions.length + 1})` : `محادثة جديدة (${sessions.length + 1})`);
    
    const newSession = {
      id: newId,
      title,
      projectId: null,
      docId: activeDoc?.doc_id || null,
      docName: activeDoc?.filename || null,
      createdAt: new Date().toLocaleDateString('ar-EG'),
      updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: 'welcome_new',
          sender: 'ai',
          text: `تم بدء محادثة جديدة بعنوان: **"${title}"** ✨\n\nتفضل بطرح سؤالك الأكاديمي أو مناقشة المادة التعليمية وسأقوم بالرد وتوثيق المراجع.`,
          citations: [],
          is_out_of_scope: false,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    setActiveSessionId(newId);
    setMessages(newSession.messages);
    setIsSessionsModalOpen(false);
    setNewSessionName('');
  };

  // Switch session
  const handleSelectSession = (sessionId) => {
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
      setActiveSessionId(target.id);
      setMessages(target.messages || []);
      setIsSessionsModalOpen(false);
      setSearchQuery('');
    }
  };

  // Open session from a search result and highlight/scroll to the matched message
  const handleOpenSearchResult = (result) => {
    const target = sessions.find(s => s.id === result.sessionId);
    if (!target) return;
    setActiveSessionId(target.id);
    setMessages(target.messages || []);
    setIsSessionsModalOpen(false);
    if (result.messageId) {
      setHighlight({ messageId: result.messageId, keyword: searchQuery.trim() });
    } else {
      setHighlight(null);
    }
  };

  // Wrap keyword occurrences in the target message's DOM text nodes with <mark>.
  const highlightDomText = (root, keyword) => {
    if (!root || !keyword) return;
    const q = keyword.toLowerCase();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const value = node.nodeValue;
      const lower = value.toLowerCase();
      if (!lower.includes(q)) return;
      const frag = document.createDocumentFragment();
      let last = 0;
      let i = lower.indexOf(q);
      while (i !== -1) {
        if (i > last) frag.appendChild(document.createTextNode(value.substring(last, i)));
        const mark = document.createElement('mark');
        mark.className = 'rounded-[3px] px-0.5 bg-amber-200/80 dark:bg-amber-500/40 text-inherit';
        mark.textContent = value.substring(i, i + q.length);
        frag.appendChild(mark);
        last = i + q.length;
        i = lower.indexOf(q, last);
      }
      if (last < value.length) frag.appendChild(document.createTextNode(value.substring(last)));
      node.parentNode.replaceChild(frag, node);
    });
  };

  // Delete session
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert('يجب الإبقاء على محادثة واحدة على الأقل.');
      return;
    }
    setConfirmDialog({
      title: 'حذف المحادثة',
      message: 'هل أنت متأكد من حذف هذه المحادثة بالكامل؟ لا يمكن التراجع عن ذلك.',
      confirmLabel: 'حذف',
      onConfirm: () => {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          setActiveSessionId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        }
        try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(remaining)); } catch (_) {}
      }
    });
  };

  // Save session title edit
  const handleSaveRename = (sessionId, e) => {
    e.stopPropagation();
    if (!editSessionTitle.trim()) return;
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, title: editSessionTitle.trim() } : s);
      try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
    setEditingSessionId(null);
  };

  const handleRenameFromSidebar = (id, newTitle) => {
    if (!newTitle.trim()) return;
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, title: newTitle.trim() } : s);
      try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Fast Full-Text Search across all sessions
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results = [];

    sessions.forEach(sess => {
      const titleMatch = sess.title?.toLowerCase().includes(q);
      
      (sess.messages || []).forEach((m) => {
        if (m.text?.toLowerCase().includes(q)) {
          const matchIdx = m.text.toLowerCase().indexOf(q);
          const start = Math.max(0, matchIdx - 35);
          const end = Math.min(m.text.length, matchIdx + q.length + 55);
          const snippet = (start > 0 ? '...' : '') + m.text.substring(start, end) + (end < m.text.length ? '...' : '');
          results.push({
            sessionId: sess.id,
            sessionTitle: sess.title,
            messageId: m.id,
            sender: m.sender,
            snippet,
            timestamp: m.timestamp || sess.createdAt
          });
        }
      });

      if (titleMatch && !(sess.messages || []).some(m => m.text?.toLowerCase().includes(q))) {
        results.push({
          sessionId: sess.id,
          sessionTitle: sess.title,
          messageId: null,
          sender: 'system',
          snippet: `تطابق في اسم المحادثة: "${sess.title}"`,
          timestamp: sess.updatedAt || sess.createdAt
        });
      }
    });

    return results;
  }, [sessions, searchQuery]);

  // Process pending chat prompt (e.g. from quiz mistakes discussion)
  useEffect(() => {
    const pending = localStorage.getItem('eduai_pending_chat_prompt');
    if (pending) {
      localStorage.removeItem('eduai_pending_chat_prompt');
      const timer = setTimeout(() => {
        handleSend(pending);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeDoc?.doc_id]);

  // Click outside export menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setActiveExportId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to + flash + highlight the matched message after it's rendered
  useEffect(() => {
    if (!highlight || !highlight.messageId) return;
    const timer = setTimeout(() => {
      const el = chatContainerRef.current?.querySelector(`[data-msg-id="${highlight.messageId}"]`);
      if (el) {
        highlightDomText(el, highlight.keyword);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('search-highlight-flash');
        setTimeout(() => el.classList.remove('search-highlight-flash'), 2600);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [highlight]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'ar-SA';
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      } catch (_) {}
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('ميزة الإملاء الصوتي غير مدعومة في متصفحك حالياً.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (_) {
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (msgId, text) => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة النطق الصوتي غير مدعومة في هذا المتصفح.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*_`~>-]/g, ' ').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (msgId, type) => {
    setFeedback((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
      const maxScroll = scrollHeight - clientHeight;
      const frac = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setNavThumb(frac * 100);
      const count = (messages || []).length;
      setActiveNavIndex(count > 1 ? Math.round(frac * (count - 1)) : 0);
    }
  };

  // Scroll the message stream to the message at the given index
  const scrollToNavMessage = (index) => {
    const nodes = chatContainerRef.current?.querySelectorAll('[data-msg-id]');
    const target = nodes && nodes[index];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const openNav = () => {
    if (hideNavTimer.current) clearTimeout(hideNavTimer.current);
    setNavOpen(true);
  };

  const scheduleCloseNav = () => {
    if (hideNavTimer.current) clearTimeout(hideNavTimer.current);
    hideNavTimer.current = setTimeout(() => setNavOpen(false), 220);
  };

  const quickPrompts = activeDoc ? [
    { label: 'لخص الفكرة الأساسية للملف', query: 'ما هي الفكرة والمحاور الأساسية في هذا المستند؟' },
    { label: 'ما هي أهم المفاهيم؟', query: 'استخرج لي أهم 3 مفاهيم أو تعريفات في المحاضرة' },
    { label: 'سؤال متوقع للامتحان', query: 'اقترح لي سؤال امتحان متوقع بناءً على هذا الملف' },
    { label: 'خطة مراجعة للملف', query: 'اعطني خطة لمراجعة هذا الملف قبل الامتحان' },
  ] : [
    { label: 'كيف يعمل محرك RAG؟', query: 'كيف يستطيع ذكاء قراءة الـ PDF وتوثيق الصفحات؟' },
    { label: 'ما هي مميزات المنصة؟', query: 'ما هي الخدمات التي تقدمها منصة ذكاء للطالب؟' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Regenerate an interrupted (empty) AI reply: drop the dangling placeholder,
  // then re-send the same preceding user question from scratch.
  const handleRegenerateInterrupted = (msgId, userText) => {
    if (!userText || loading) return;
    setMessages((prev) => prev.filter(m => m.id !== msgId));
    setTimeout(() => handleSend(userText), 0);
  };

  // Stop the in-flight stream. The partial answer (if any) is kept as final.
  const handleStopGeneration = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
    }
  };

  const handleSend = async (queryText = inputValue) => {
    const textToSend = queryText.trim();
    if (!textToSend || loading) return;

    setEditingMsgId(null);

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const aiId = (Date.now() + 1).toString();
    const placeholderMsg = {
      id: aiId,
      sender: 'ai',
      text: '',
      streaming: true,
      citations: [],
      is_out_of_scope: false,
      sources: [],
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    const persistPartial = (next) => {
      try {
        const raw = localStorage.getItem('eduai_chat_sessions_master');
        const allSessions = raw ? JSON.parse(raw) : [];
        let activeId = localStorage.getItem('eduai_active_session_id') || (allSessions[0]?.id || null);
        let updated = allSessions.map(s => s.id === activeId ? { ...s, messages: next, updatedAt: placeholderMsg.timestamp } : s);
        if (!Array.isArray(updated) || !updated.some(s => s.id === activeId)) {
          if (updated.length === 0) updated = [{ id: activeId || 'sess_default', title: 'محادثة', messages: next, createdAt: new Date().toLocaleDateString('ar-EG'), updatedAt: placeholderMsg.timestamp }];
          else updated[0] = { ...updated[0], messages: next, updatedAt: placeholderMsg.timestamp, id: activeId || updated[0].id };
        }
        localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated));
        if (!activeId) activeId = updated[0]?.id || 'sess_default';
        localStorage.setItem('eduai_active_session_id', activeId);
        localStorage.setItem('eduai_active_chat_messages', JSON.stringify(next));
      } catch (_) {}
    };

    setMessages((prev) => {
      const next = [...prev, userMsg, placeholderMsg];
      persistPartial(next);
      return next;
    });
    setInputValue('');
    setLoading(true);
    setIsStreaming(true);
    const controller = new AbortController();
    streamControllerRef.current = controller;

    try {
      const historyPayload = (latestMessagesRef.current || messages || []).slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      let fullAnswer = '';
      let streamed = false;
      try {
        await sendChatMessageStream(
          textToSend,
          activeDoc?.doc_id,
          historyPayload,
          activePrompt?.prompt,
          (chunk) => {
            fullAnswer += chunk;
            streamed = true;
            setMessages((prev) => {
              const next = prev.map(m => m.id === aiId ? { ...m, text: fullAnswer } : m);
              persistPartial(next);
              return next;
            });
          },
          controller.signal
        );
        if (!streamed || !fullAnswer.trim()) throw new Error('empty stream');
        setMessages((prev) => {
          const next = prev.map(m => m.id === aiId ? { ...m, text: fullAnswer, streaming: false } : m);
          persistPartial(next);
          return next;
        });
        fetchCurrentUser().catch(()=>{});
        return;
      } catch (streamErr) {
        if (controller.signal.aborted) {
          // User stopped the stream: keep the partial answer as final,
          // or drop the placeholder entirely if nothing arrived yet.
          if (fullAnswer.trim()) {
            setMessages((prev) => {
              const next = prev.map(m => m.id === aiId ? { ...m, text: fullAnswer, streaming: false } : m);
              persistPartial(next);
              return next;
            });
          } else {
            setMessages((prev) => {
              const next = prev.filter(m => m.id !== aiId);
              persistPartial(next);
              return next;
            });
          }
          fetchCurrentUser().catch(()=>{});
          return;
        }
        setIsStreaming(false);
        setMessages((prev) => prev.filter(m => m.id !== aiId));
        const res = await sendChatMessage(textToSend, activeDoc?.doc_id, historyPayload, activePrompt?.prompt);
        const aiMsg = {
          id: aiId,
          sender: 'ai',
          text: res.answer,
          streaming: false,
          citations: res.citations || [],
          is_out_of_scope: res.is_out_of_scope,
          sources: res.sources || [],
          timestamp: placeholderMsg.timestamp
        };
        setMessages((prev) => {
          const next = [...prev, aiMsg];
          persistPartial(next);
          return next;
        });
        fetchCurrentUser().catch(()=>{});
      }
    } catch (err) {
      console.error(err);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ تعذر استلام الإجابة من النموذج المختار.

سبب الخطأ: ${err.message || 'انتهت مهلة استجابة الخادم'}

💡 نصيحة: يرجى فتح (إعدادات المزود 🔑) والتأكد من اختيار نموذج مفعّل في خادمك.`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
      streamControllerRef.current = null;
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditUserMessage = (msg) => {
    setInputValue(msg.text);
    setEditingMsgId(msg.id);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
      }, 0);
    }
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleRegenerate = async (lastUserText) => {
    if (loading || !lastUserText) return;
    await handleSend(lastUserText);
  };

  const handleExportMessage = (msg, format) => {
    const filename = `EduAI_Response_${Date.now()}`;
    let content = msg.text;
    let mimeType = 'text/plain;charset=utf-8';
    let ext = 'txt';
    if (format === 'md') {
      mimeType = 'text/markdown;charset=utf-8';
      ext = 'md';
      content = `# إجابة ذكاء الأكاديمية (EduAI)\n\nالمستند: ${activeDoc?.filename || 'مستند أكاديمي'}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\n\n---\n\n${msg.text}`;
    } else if (format === 'html') {
      mimeType = 'text/html;charset=utf-8';
      ext = 'html';
      content = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>إجابة ذكاء</title><style>body{font-family:system-ui,sans-serif;padding:30px;line-height:1.8;max-width:800px;margin:auto;}pre{background:#f1f5f9;padding:15px;border-radius:10px;overflow-x:auto;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #cbd5e1;padding:8px;}</style></head><body><h1>إجابة ذكاء الأكاديمية</h1><hr/><pre style="white-space:pre-wrap;">${msg.text}</pre></body></html>`;
    } else if (format === 'print') {
      const printWin = window.open('', '', 'width=900,height=700');
      printWin.document.write(`<html><head><title>طباعة الإجابة</title><style>body{font-family:sans-serif;padding:30px;line-height:1.8;direction:rtl;}</style></head><body><h2>إجابة ذكاء الأكاديمية | EduAI</h2><p><b>المستند:</b> ${activeDoc?.filename || 'عام'}</p><hr/><pre style="white-space:pre-wrap;font-family:inherit;">${msg.text}</pre></body></html>`);
      printWin.document.close();
      printWin.focus();
      printWin.print();
      printWin.close();
      setActiveExportId(null);
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const fileName = `${filename}.${ext}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setActiveExportId(null);
    try {
      const exportsKey = 'eduai_exported_files';
      const existing = JSON.parse(localStorage.getItem(exportsKey)) || [];
      const newEntry = {
        name: fileName,
        date: new Date().toLocaleString('ar-EG'),
        url,
        fromSession: activeSessionId
      };
      localStorage.setItem(exportsKey, JSON.stringify([newEntry, ...existing].slice(0, 50)));
    } catch (_) {}
  };

  const handleClearHistory = () => {
    setConfirmDialog({
      title: 'مسح سجل المحادثة',
      message: 'هل تريد مسح سجل المحادثة الحالية بالكامل؟ لا يمكن التراجع عن ذلك.',
      confirmLabel: 'مسح',
      onConfirm: () => setMessages([]),
    });
  };

  // Delete a single message from the current session (persisted via the messages sync effect)
  const handleDeleteMessage = (id) => {
    const target = messages.find((m) => m.id === id);
    const label = target && target.sender === 'user' ? 'السؤال' : 'الرسالة';
    setConfirmDialog({
      title: 'تأكيد الحذف',
      message: `هل تريد حذف ${label}؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmLabel: 'حذف',
      onConfirm: () => setMessages((prev) => prev.filter((m) => m.id !== id)),
    });
  };

  // Move a session into/out of a project (persisted via the messages sync effect)
  const handleMoveSessionToProject = (sessionId, targetProjectId) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, projectId: targetProjectId } : s);
      try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  return (
    <div className={`grid gap-3 w-full lg:grid-cols-12 ${isChatFullscreen ? 'fixed inset-0 z-[70] p-3 grid-rows-1 max-w-none' : 'lg:h-[calc(100dvh-80px)] lg:grid-rows-1 w-full'}`}>
      
      {/* Right Sidebar - Manus style with options menu */}
      <div className={`flex-col gap-3 h-full ${isChatFullscreen ? 'flex lg:col-span-3 xl:col-span-3 min-h-0' : 'hidden lg:flex lg:col-span-3 xl:col-span-3 min-h-[500px]'}`}>
        <div className="glass-panel rounded-2xl border flex flex-col h-full overflow-hidden">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameFromSidebar}
            onMoveSession={handleMoveSessionToProject}
            onCreateNew={handleCreateNewSession}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            docs={[]}
            onOpenSearchResult={handleOpenSearchResult}
          />
        </div>
      </div>

      {/* Main Chat - ChatGPT style, airy and spacious */}
      <div className={`flex flex-col glass-panel overflow-hidden shadow-lg h-full min-h-[500px] ${isChatFullscreen ? 'lg:col-span-9 xl:col-span-9 col-span-1 rounded-none' : 'lg:col-span-9 xl:col-span-9 col-span-1 rounded-2xl'}`}>
        
        {/* Minimal Compact Header */}
        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 theme-nav flex items-center justify-between shrink-0 font-['Tajawal']">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs md:text-sm theme-text-primary">
                  {sessions.find(s => s.id === activeSessionId)?.title || 'المحادثة الأكاديمية التفاعلية RAG'}
                </h3>
                {activePrompt && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> {activePrompt.title}
                  </span>
                )}
              </div>
              <p className="text-[11px] theme-text-muted truncate max-w-sm">
                {activeDoc ? `المستند: ${activeDoc.filename} (${activeDoc.pages_count} صفحة)` : 'إجابات أكاديمية عامة'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Model Selector Pill */}
            <div className="relative" ref={modelDropdownRef}>
              <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary transition cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono text-xs truncate max-w-[110px]">{chatModel}</span>
                <ChevronDown className={`w-3 h-3 transition ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isModelDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-60 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1.5 max-h-60 overflow-y-auto space-y-1">
                    {chatModels.length ? chatModels.map(m => (
                      <button key={m} onClick={() => { setChatModel(m); setSelectedModel(m); setIsModelDropdownOpen(false); }} className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${chatModel===m ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold' : 'theme-text-secondary hover:bg-slate-500/10'}`}>{m}</button>
                    )) : <div className="text-xs theme-text-muted p-3 text-center">{fetchingChatModels ? 'جاري الجلب...' : 'لا توجد نماذج'}</div>}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleCreateNewSession()}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
              title="محادثة جديدة"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">جديد</span>
            </button>
            <button
              onClick={() => setIsSessionsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg theme-header-btn border text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="المحادثات"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">المحادثات</span>
              <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-[11px]">{sessions.length}</span>
            </button>
            <button
              onClick={() => setIsChatFullscreen(!isChatFullscreen)}
              className="p-1.5 rounded-lg theme-header-btn border hover:text-emerald-400 transition cursor-pointer"
              title={isChatFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}
            >
              {isChatFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg theme-header-btn border hover:text-rose-400 transition cursor-pointer"
              title="مسح"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream - Centered reading column */}
        <div className="relative flex-1 overflow-hidden">
        <div ref={chatContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto p-3 md:p-4">
          <div className="max-w-4xl w-full mx-auto space-y-3">
          {(messages || []).map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isLastAi = !isUser && index === (messages || []).length - 1;
            const previousUserMsg = isLastAi ? messages[index - 1]?.text : null;
            const isStreamingPlaceholder = !isUser && loading && !msg.text;
            const isInterrupted = !isUser && !loading && msg.streaming && !msg.text;

            return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={`flex gap-2.5 max-w-full ${isUser ? 'mr-auto flex-row-reverse justify-start' : 'ml-auto'}`}
              >
                {/* Avatar - Compact */}
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold shadow-xs mt-0.5 ${
                  isUser 
                    ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' 
                    : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border border-emerald-400/30'
                }`}>
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble - Compact & Efficient */}
                <div className={`flex flex-col ${isUser ? 'items-end max-w-[82%]' : 'items-start flex-1 max-w-full'} overflow-hidden`}>
                  <div className={`rounded-2xl text-[14.5px] leading-relaxed relative group w-full ${
                    isUser
                      ? 'px-4 py-2.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 theme-text-primary rounded-tr-none shadow-xs'
                      : 'px-4 py-3 md:px-5 md:py-3.5 glass-card theme-text-primary rounded-tl-none border shadow-xs'
                  }`}>
                    
                    {/* Out of scope warning */}
                    {msg.is_out_of_scope && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تنبيه: هذا السؤال غير مذكور في الملف المرفوع حالياً.</span>
                      </div>
                    )}

                    {/* Streaming placeholder - thinking state in-place */}
                    {isStreamingPlaceholder ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.3s]"></span>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">
                          ذكاء يبحث في المستند ويصيغ الإجابة الموثقة...
                        </span>
                      </div>
                    ) : isInterrupted ? (
                      <div className="flex items-center gap-2.5 py-1 flex-wrap text-sm">
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          توقف توليد الإجابة قبل اكتمالها.
                        </span>
                        {previousUserMsg && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateInterrupted(msg.id, previousUserMsg)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            إعادة توليد الإجابة
                          </button>
                        )}
                      </div>
                    ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none font-['Tajawal'] text-[15px] leading-relaxed break-words space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code: CodeBlock,
                          table: ({ node, ...props }) => (
                            <div className="my-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-right" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-slate-100 dark:bg-slate-900 font-bold theme-text-primary" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-3.5 py-2.5 font-black text-right" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-800/60 font-medium" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-xl font-black theme-text-primary my-3 pb-1 border-b border-slate-200 dark:border-slate-800" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-lg font-black theme-text-primary my-2.5" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-base font-extrabold theme-text-primary my-2 text-emerald-600 dark:text-emerald-400" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside my-2 space-y-1" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote className="border-r-4 border-emerald-500 pr-3 my-3 italic theme-text-secondary bg-emerald-500/5 py-1.5 rounded-l-lg" {...props} />
                          ),
                          a: ({ node, ...props }) => (
                            <a className="text-teal-600 dark:text-teal-400 hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />
                          )
                        }}
                      >
                        {formatArabicText(msg.text)}
                      </ReactMarkdown>
                    </div>
                    )}

                    {/* Citations Pages Badges */}
                    {!isStreamingPlaceholder && !isInterrupted && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold theme-text-muted flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> الصفحات المقتبسة:
                        </span>
                        {msg.citations.map((pageNo) => (
                          <span
                            key={pageNo}
                            className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                          >
                            صفحة {pageNo}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Per-Message Action Toolbar */}
                    {!isStreamingPlaceholder && !isInterrupted && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <span className="text-xs theme-text-muted font-medium">
                        {msg.timestamp}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                        
                        {/* Text to Speech Button for AI Message */}
                        {!isUser && (
                          <button
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`p-1.5 rounded-lg theme-header-btn border transition flex items-center gap-1 text-xs ${
                              speakingMsgId === msg.id ? 'text-teal-400 border-teal-400 animate-pulse' : 'hover:text-teal-400'
                            }`}
                            title={speakingMsgId === msg.id ? 'إيقاف القراءة الصوتية' : 'استماع صوتي للإجابة'}
                          >
                            {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
                            <span className="hidden sm:inline">{speakingMsgId === msg.id ? 'إيقاف' : 'استماع'}</span>
                          </button>
                        )}

                        {/* Thumbs Up / Down Feedback for AI Message */}
                        {!isUser && (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1.5 rounded-lg theme-header-btn border transition text-xs ${
                                feedback[msg.id] === 'up' ? 'text-emerald-500 border-emerald-500 bg-emerald-500/10' : 'hover:text-emerald-400'
                              }`}
                              title="إجابة ممتازة ومفيدة"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1.5 rounded-lg theme-header-btn border transition text-xs ${
                                feedback[msg.id] === 'down' ? 'text-rose-500 border-rose-500 bg-rose-500/10' : 'hover:text-rose-400'
                              }`}
                              title="تحتاج لتحسين أو غير دقيقة"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-emerald-600 dark:hover:text-teal-300 transition flex items-center gap-1 text-[11px]"
                          title="نسخ نص الرسالة"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{copiedId === msg.id ? 'تم النسخ' : 'نسخ'}</span>
                        </button>

                        {/* Edit Button for User Message */}
                        {isUser && (
                          <button
                            onClick={() => handleEditUserMessage(msg)}
                            className="p-1.5 rounded-lg theme-header-btn border hover:text-teal-600 dark:hover:text-teal-300 transition flex items-center gap-1 text-[11px]"
                            title="تعديل السؤال وإعادة الإرسال"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            <span className="hidden sm:inline">تعديل</span>
                          </button>
                        )}

                        {/* Regenerate Button for Last AI Message */}
                        {!isUser && previousUserMsg && (
                          <button
                            onClick={() => handleRegenerate(previousUserMsg)}
                            disabled={loading}
                            className="p-1.5 rounded-lg theme-header-btn border hover:text-amber-400 transition flex items-center gap-1 text-[11px] disabled:opacity-50"
                            title="إعادة توليد الإجابة"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">إعادة التوليد</span>
                          </button>
                        )}

                        {/* Export Dropdown for AI Message */}
                        {!isUser && (
                          <div className="relative" ref={exportMenuRef}>
                            <button
                              onClick={() => setActiveExportId(activeExportId === msg.id ? null : msg.id)}
                              className="p-1.5 rounded-lg theme-header-btn border hover:text-teal-400 transition flex items-center gap-1 text-[11px]"
                              title="تصدير هذه الإجابة كملف"
                            >
                              <Download className="w-3.5 h-3.5 text-teal-500" />
                              <span className="hidden sm:inline">تصدير</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {activeExportId === msg.id && (
                              <div className="absolute left-0 bottom-full mb-1.5 w-44 glass-panel rounded-2xl p-1.5 shadow-2xl z-30 border theme-nav text-xs font-bold space-y-1 animate-fade-in">
                                <button
                                  onClick={() => handleExportMessage(msg, 'md')}
                                  className="w-full text-right p-2 rounded-xl hover:bg-emerald-600/20 transition flex items-center gap-2 theme-text-primary"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-teal-400" />
                                  <span>ملف Markdown (.md)</span>
                                </button>
                                <button
                                  onClick={() => handleExportMessage(msg, 'txt')}
                                  className="w-full text-right p-2 rounded-xl hover:bg-emerald-600/20 transition flex items-center gap-2 theme-text-primary"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                                  <span>مستند نصي (.txt)</span>
                                </button>
                                <button
                                  onClick={() => handleExportMessage(msg, 'html')}
                                  className="w-full text-right p-2 rounded-xl hover:bg-emerald-600/20 transition flex items-center gap-2 theme-text-primary"
                                >
                                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                                  <span>صفحة ويب (.html)</span>
                                </button>
                                <button
                                  onClick={() => handleExportMessage(msg, 'print')}
                                  className="w-full text-right p-2 rounded-xl hover:bg-emerald-600/20 transition flex items-center gap-2 theme-text-primary"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>طباعة / PDF 📄</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delete Message Button */}
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 transition flex items-center gap-1 text-[11px]"
                          title="حذف هذه الرسالة"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span className="hidden sm:inline">حذف</span>
                        </button>

                      </div>
                    </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}

          {/* Streaming indicator is rendered in-place inside the placeholder AI bubble */}

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              aria-label="الانتقال للأسفل"
              title="الانتقال للأسفل"
              className="sticky bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center border border-white/20 hover:bg-emerald-500 hover:scale-105 transition animate-bounce z-20"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}

          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Navigation Rail between messages (Manus-style) */}
        {(messages || []).length >= 2 && (
            <div
              className="absolute end-0 top-1/2 -translate-y-1/2 flex flex-col items-end pr-1 w-[24px] z-30 cursor-pointer select-none"
              onMouseEnter={openNav}
              onMouseLeave={scheduleCloseNav}
            >
              <div className="relative h-[min(50vh,calc(100vh-160px))] w-[12px] flex flex-col justify-between">
                {(messages || []).map((m, idx) => (
                  <button
                    key={`nav-${m.id}`}
                    onClick={() => scrollToNavMessage(idx)}
                    className="group/tick flex h-[14px] w-[12px] shrink-0 items-center justify-end cursor-pointer"
                    title={`${m.sender === 'user' ? 'سؤال' : 'إجابة'}: ${m.text.replace(/\s+/g, ' ').slice(0, 40)}`}
                  >
                    <span className={`h-[2px] rounded-[40px] transition-all duration-300 origin-right ${
                      idx === activeNavIndex
                        ? 'w-[12px] bg-emerald-500 dark:bg-teal-400'
                        : 'w-[7px] bg-slate-300 dark:bg-slate-600 group-hover/tick:w-[12px] group-hover/tick:bg-slate-400 dark:group-hover/tick:bg-slate-400'
                    }`} />
                  </button>
                ))}
                <span
                  className="pointer-events-none absolute end-0 top-0 h-[4px] w-[16px] rounded-[40px] bg-emerald-500/70 dark:bg-teal-400/70 transition-[top] duration-75"
                  style={{ top: `${navThumb}%` }}
                />
              </div>

              {navOpen && (
                <div
                  className="absolute end-8 top-1/2 -translate-y-1/2 w-[240px] max-h-[min(50vh,calc(100vh-160px))] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 shadow-2xl p-1.5 z-40 animate-fade-in"
                  onMouseEnter={openNav}
                  onMouseLeave={scheduleCloseNav}
                >
                  <div className="text-xs font-black text-slate-400 dark:text-slate-500 px-2 py-1">
                    التنقّل السريع بين الرسائل ({messages.length})
                  </div>
                  {messages.map((m, idx) => (
                    <button
                      key={`navlist-${m.id}`}
                      onClick={() => { scrollToNavMessage(idx); setNavOpen(false); }}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs leading-[18px] transition flex items-center gap-1.5 cursor-pointer ${
                        idx === activeNavIndex
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="shrink-0 text-xs opacity-60">{m.sender === 'user' ? '💬' : '🤖'}</span>
                      <span className="truncate">{m.text.replace(/\s+/g, ' ').slice(0, 44) || '(رسالة فارغة)'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input - Slim Anchored Capsule */}
        <div className="p-2 md:p-3 border-t border-slate-200 dark:border-slate-800 theme-nav shrink-0">
          
          {/* Voice Listening Banner */}
          {isListening && (
            <div className="mb-2 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between animate-pulse font-['Tajawal']">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>جاري الاستماع لصوتك... تحدث الآن باللغة العربية أو الإنجليزية 🎙️</span>
              </div>
              <button 
                type="button"
                onClick={toggleListening}
                className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg transition"
              >
                إيقاف التسجيل
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto relative flex flex-col gap-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 focus-within:border-emerald-500 p-2 transition shadow-md"
          >
            {/* Auto-expanding Multiline Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                editingMsgId 
                  ? "تعديل السؤال وإعادة إرساله (Enter للإرسال)..." 
                  : activeDoc 
                  ? `اسأل أي سؤال حول "${activeDoc.filename}" (Enter للإرسال، Shift+Enter لسطر جديد)...` 
                  : "اكتب سؤالك الأكاديمي هنا (Enter للإرسال، Shift+Enter لسطر جديد)..."
              }
              className="w-full bg-transparent px-2 py-1.5 text-sm theme-text-primary outline-none transition font-['Tajawal'] resize-none leading-relaxed min-h-[32px] max-h-[120px]"
            />

            {/* Single-Line Action Bar (icons prominent, labels hidden) */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs font-['Tajawal']">
              
              {/* Left Action Shortcuts */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="px-2 py-1.5 rounded-lg theme-header-btn border hover:text-emerald-400 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="رفع مستند تعليمي جديد"
                >
                  <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden lg:inline">إرفاق مادة</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPromptManager}
                  className="px-2 py-1.5 rounded-lg theme-header-btn border hover:text-amber-400 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="استخدام قالب برومبت مخصص"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">{activePrompt ? activePrompt.title : 'البرومبتات'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-2 py-1.5 rounded-lg border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    isListening
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                      : 'theme-header-btn hover:text-teal-400'
                  }`}
                  title={isListening ? 'إيقاف التسجيل الصوتي' : 'إدخال صوتي (Voice Input)'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Quick Prompts - compact dropdown, no persistent strip */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsQuickPromptsOpen(o => !o)}
                    className="px-2 py-1.5 rounded-lg theme-header-btn border hover:text-amber-400 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="اقتراحات سريعة"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden lg:inline">سريع</span>
                  </button>
                  {isQuickPromptsOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden font-['Tajawal']">
                      <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                        {quickPrompts.map((qp, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setIsQuickPromptsOpen(false);
                              handleSend(qp.query);
                            }}
                            className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold theme-text-secondary hover:bg-emerald-500/10 hover:text-emerald-500 transition cursor-pointer flex items-center gap-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="leading-snug">{qp.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Button */}
              <div className="flex items-center gap-2">
                {editingMsgId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1.5 rounded-lg theme-header-btn border text-xs font-bold hover:text-rose-400 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
                
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    title="إيقاف توليد الإجابة"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-rose-600 dark:text-rose-400 font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/10"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف</span>
                  </button>
                ) : (
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{editingMsgId ? 'حفظ' : 'إرسال'}</span>
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
                )}
              </div>
            </div>
          </form>
        </div>

      </div>

      {/* Master Chat Sessions & Fast Full-Text Search Modal (mobile) */}
      {isSessionsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right font-['Tajawal']" dir="rtl">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black theme-text-primary">سجل وإدارة المحادثات الأكاديمية</h3>
                  <p className="text-xs theme-text-muted">بدء جلسات مخصصة والبحث السريع في كامل محتوى الأسئلة والإجابات</p>
                </div>
              </div>
              <button
                onClick={() => setIsSessionsModalOpen(false)}
                className="p-1.5 rounded-xl theme-header-btn border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ultra-Fast Live Full-Text Search Bar */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-emerald-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث فوراً في جميع المحادثات والأسئلة والردود السابقة..."
                className="w-full theme-card-inner border rounded-2xl pr-10 pl-10 py-2.5 text-xs font-bold theme-text-primary outline-none focus:border-emerald-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Create Custom Named Session Bar */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="اسم المحادثة الجديدة (مثال: مراجعة إدارة الأعمال، مقرر الشبكات...)"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs theme-text-primary outline-none focus:border-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewSession(newSessionName);
                  }
                }}
              />
              <button
                onClick={() => handleCreateNewSession(newSessionName)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>بدء الجلسة</span>
              </button>
            </div>

            {/* Sessions / Search Results Stream */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[420px]">
              
              {/* If Searching: Display Instant Search Results */}
              {searchQuery.trim() ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs theme-text-muted px-1">
                    <span>نتائج البحث الفوري: <b className="text-emerald-500">{searchResults.length} نتيجة</b></span>
                    <span className="text-[10px]">انقر على أي نتيجة للانتقال إليها فوراً</span>
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="p-8 text-center theme-text-muted text-xs space-y-2 border border-dashed rounded-2xl">
                      <Search className="w-8 h-8 mx-auto opacity-40" />
                      <p>لم يتم العثور على أي نتائج تطابق "{searchQuery}" في محتوى المحادثات.</p>
                    </div>
                  ) : (
                    searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleOpenSearchResult(res)}
                        className="p-3.5 rounded-2xl theme-card-inner border hover:border-emerald-500 transition cursor-pointer space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black theme-text-primary flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                            {res.sessionTitle}
                          </span>
                          <span className="text-[10px] theme-text-muted">{res.timestamp}</span>
                        </div>
                        <p className="text-xs theme-text-secondary leading-relaxed bg-white/5 p-2 rounded-xl border border-white/5">
                          {res.snippet}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Normal Session List */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs theme-text-muted px-1">
                    <span>جميع المحادثات المحفوظة ({sessions.length}):</span>
                  </div>

                  {sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    const isEditing = editingSessionId === sess.id;

                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess.id)}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600/15 to-teal-600/10 border-emerald-500 shadow-md'
                            : 'theme-card-inner hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editSessionTitle}
                                onChange={(e) => setEditSessionTitle(e.target.value)}
                                className="flex-1 bg-white dark:bg-slate-900 border rounded-lg px-2.5 py-1 text-xs theme-text-primary outline-none focus:border-emerald-500"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveRename(sess.id, e)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(null);
                                }}
                                className="px-2 py-1 rounded-lg theme-header-btn border text-xs"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs theme-text-primary truncate">
                                {sess.title}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black shrink-0">
                                  النشطة حالياً ✓
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] theme-text-muted">
                            <span>{sess.messages?.length || 0} رسائل</span>
                            <span>•</span>
                            <span>{sess.updatedAt || sess.createdAt}</span>
                            {sess.docName && (
                              <>
                                <span>•</span>
                                <span className="text-teal-500 truncate max-w-[150px]">{sess.docName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Session Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(sess.id);
                                setEditSessionTitle(sess.title);
                              }}
                              className="p-1.5 rounded-lg theme-header-btn border text-xs hover:text-teal-400 transition"
                              title="إعادة تسمية المحادثة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="p-1.5 rounded-lg theme-header-btn border text-xs hover:text-rose-400 transition"
                            title="حذف هذه المحادثة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs theme-text-muted shrink-0">
              <span>يتم حفظ جميع المحادثات والرسائل محلياً وتلقائياً.</span>
              <button
                onClick={() => setIsSessionsModalOpen(false)}
                className="px-4 py-2 rounded-xl theme-header-btn border font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Academic Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="chat"
        data={messages}
        docName={activeDoc?.filename || 'جلسة الحوار والمناقشة'}
      />

      {/* Custom Confirmation Modal (replaces native window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-right font-['Tajawal']" dir="rtl">
          <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 border shadow-2xl space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-rose-500" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black theme-text-primary">{confirmDialog.title}</h3>
              <p className="text-sm theme-text-muted leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex items-center gap-2.5 justify-center">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl theme-header-btn border font-bold text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  try { confirmDialog.onConfirm && confirmDialog.onConfirm(); } catch (_) {}
                  setConfirmDialog(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
