import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Copy,
  Bot,
  User,
  FileText,
  FileCode,
  Printer,
  RotateCcw,
  Edit3,
  Trash2,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  ArrowDown,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
  Square,
} from 'lucide-react';

// Arabic Typography, Word Spacing & LaTeX Masking Formatter
function formatArabicText(text) {
  if (!text || typeof text !== 'string') return text;
  const placeholders = [];
  const masked = text.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g, (match) => {
    placeholders.push(match);
    return `___MATH_BLOCK_${placeholders.length - 1}___`;
  });
  let cleaned = masked.replace(/(\[المصدر:[^\]\n]+\])\s*([^\s\n\]\)])/g, '$1\n\n$2');
  cleaned = cleaned.replace(/([^\n])\s*([أ-ي]\))\s*/g, '$1\n$2 ');
  cleaned = cleaned.replace(/([\]\)])([\u0600-\u06FF])/g, '$1 $2');
  cleaned = cleaned.replace(/([\u0600-\u06FF])([\[\(])/g, '$1 $2');
  cleaned = cleaned.replace(/([\u0600-\u06FF]):([\u0600-\u06FFa-zA-Z$])/g, '$1: $2');
  cleaned = cleaned.replace(/([\u0600-\u06FF])([،؛!؟])([\u0600-\u06FFa-zA-Z$])/g, '$1$2 $3');
  cleaned = cleaned.replace(/([\u0600-\u06FF])([a-zA-Z])/g, '$1 $2');
  cleaned = cleaned.replace(/([a-zA-Z])([\u0600-\u06FF])/g, '$1 $2');
  const prepositions = '(من|في|عن|مع|بين|عند|لدى|نحو|ضد|حول|دون|غير|مثل|كافة|جميع|معظم|أغلب|سائر|حيث|حين|بأن|فإن|ولكن|حتى|إلى|على)';
  cleaned = cleaned.replace(new RegExp(`\\b${prepositions}(ال[\\u0600-\\u06FF]{2,})\\b`, 'g'), '$1 $2');
  const prefixes = '(خطوات|مراحل|عناصر|خصائص|مميزات|عيوب|أهداف|نتائج|طرق|أنواع|أشكال|أمثلة|أسباب|حلول|بيانات|تحديد|حساب|استخراج|استخدام|تطبيق|دراسة|تحليل|تقييم|توضيح|شرح|إيجاد|معرفة|فهم|مفهوم|نموذج|خوارزمية|نظام|طريقة|عملية|قيمة|نسبة|معدل|دالة|مصفوفة|متجه|معادلة|فرضية|نظرية|قاعدة|فكرة|مشكلة|نوع|عنصر|خاصية|ميزة|هدف|نتيجة|سبب|حل|بيان|نقطة|نقاط|درجة|مستوى|مجال|قسم|فصل|باب|صفحة|سؤال|إجابة|جواب|أقرب|أبعد|أكبر|أصغر|أفضل|أحسن|أسوأ|أهم|أكثر|أقل|أعلى|أدنى|أول|آخر|أحد|إحدى)';
  cleaned = cleaned.replace(new RegExp(`\\b${prefixes}(ال[\\u0600-\\u06FF]{2,})\\b`, 'g'), '$1 $2');
  placeholders.forEach((orig, i) => {
    cleaned = cleaned.replace(`___MATH_BLOCK_${i}___`, orig);
  });
  return cleaned;
}

// Smart Language Detection
function detectLanguage(rawLang, codeContent) {
  const normalized = (rawLang || '').trim().toLowerCase();
  const explicitMap = {
    py: 'python', python: 'python', js: 'javascript', javascript: 'javascript',
    ts: 'typescript', typescript: 'typescript', jsx: 'jsx', tsx: 'tsx',
    sh: 'bash', bash: 'bash', shell: 'bash', zsh: 'bash', sql: 'sql', json: 'json',
    html: 'markup', markup: 'markup', xml: 'markup', css: 'css',
    java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp', csharp: 'csharp',
    text: 'plaintext', txt: 'plaintext', plaintext: 'plaintext', plain: 'plaintext'
  };
  if (normalized && explicitMap[normalized]) return explicitMap[normalized];
  const trimmed = (codeContent || '').trim();
  if (!trimmed.includes('\n') && !trimmed.includes(';') && !trimmed.includes('import ') && !trimmed.includes('def ') && !trimmed.includes('const ') && !trimmed.includes('SELECT ')) return 'plaintext';
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return 'json'; } catch (_) {}
  }
  if (/(^|\s)(import\s+[\w.]+|from\s+[\w.]+\s+import|def\s+\w+\s*\(|class\s+\w+|print\s*\(|elif\s+|if\s+__name__\s*==|return\s+|np\.|pd\.|plt\.)/m.test(trimmed)) return 'python';
  if (/(^|\s)(const\s+\w+|let\s+\w+|var\s+\w+|function\s*\w*\s*\(|console\.log|export\s+(default|const)|import\s+.*from\s+['"]|=>\s*\{|\basync\s+function)/m.test(trimmed)) return 'javascript';
  if (/\b(SELECT\s+[\s\S]+FROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET|DELETE\s+FROM|WHERE\s+\w+|GROUP\s+BY|ORDER\s+BY)\b/i.test(trimmed)) return 'sql';
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed) && (trimmed.includes('</div>') || trimmed.includes('</span>') || trimmed.includes('<html') || trimmed.includes('<p>'))) return 'markup';
  if (/(^|\s)(npm\s+(run|install|i)|pip\s+install|git\s+(clone|commit|push|pull|status)|docker\s+run|sudo\s+apt|cd\s+[\w/.~]+|chmod\s+\+x)/m.test(trimmed)) return 'bash';
  if (/(#include\s+<[\w.]+>|public\s+class\s+\w+|int\s+main\s*\(|std::cout|System\.out\.println)/m.test(trimmed)) return 'cpp';
  return 'plaintext';
}

const displayBadgeMap = {
  python: 'PYTHON', javascript: 'JAVASCRIPT', typescript: 'TYPESCRIPT', jsx: 'REACT JSX',
  tsx: 'REACT TSX', bash: 'BASH / TERMINAL', sql: 'SQL DATABASE', json: 'JSON DATA',
  markup: 'HTML / XML', css: 'CSS STYLES', java: 'JAVA', cpp: 'C++', c: 'C',
  csharp: 'C#', plaintext: 'PLAIN TEXT'
};

function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const rawLang = match ? match[1] : '';
  const codeContent = String(children).replace(/\n$/, '');
  const lang = detectLanguage(rawLang, codeContent);
  const [copied, setCopied] = useState(false);

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-accent-soft border border-accent-border text-accent font-mono text-xs dir-ltr inline-block" {...props}>
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
    } catch {}
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
          <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${lang === 'plaintext' ? 'text-slate-400' : 'text-teal-400'}`}>
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
          <code className={`language-${lang} font-mono`} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <code className="font-mono text-slate-200">{codeContent}</code>
        )}
      </pre>
    </div>
  );
}

export default function ChatMessages({
  messages,
  loading,
  isStreaming,
  activeDoc,
  copiedId,
  handleCopy,
  feedback,
  handleFeedback,
  speakingMsgId,
  handleSpeak,
  handleExportMessage,
  handleEditUserMessage,
  handleRegenerate,
  handleDeleteMessage,
  handleRegenerateInterrupted,
  chatContainerRef,
  messagesEndRef,
  showScrollBottom,
  handleScroll,
  scrollToBottom,
  quickPrompts,
  onQuickPrompt,
  onStopStreaming,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markdownComponents = {
    code: CodeBlock,
    table: ({ node, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full divide-y divide-border text-xs text-right" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-card-hover font-bold text-text-strong" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="px-3.5 py-2.5 font-black text-right" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-3.5 py-2.5 border-t border-border font-medium" {...props} />
    ),
    h1: ({ node, ...props }) => (
      <h1 className="text-xl font-black text-text-strong my-3 pb-1 border-b border-border" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-lg font-black text-text-strong my-2.5" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-base font-extrabold text-accent my-2" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside my-2 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside my-2 space-y-1" {...props} />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-r-4 border-accent pr-3 my-3 text-text-muted bg-accent-soft py-1.5 rounded-l-lg" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a className="text-accent hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />
    ),
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="chat-empty">
          <div className="ce-ic">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-head">ابدأ سؤالك الأول</h2>
          <p>المحادثة تتذكر مستندك المرفوع وتوثّق كل إجابة برقم الصفحة والمصدر.</p>
          {quickPrompts && quickPrompts.length > 0 && (
            <div className="suggest">
              {quickPrompts.map((qp, idx) => (
                <button key={idx} onClick={() => onQuickPrompt && onQuickPrompt(qp.query)}>
                  <span>{qp.label}</span>
                  <span className="sg-arrow">←</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={chatContainerRef} onScroll={handleScroll} className="h-full overflow-y-auto p-3 md:p-4">
      <div className="chat-thread">
        {(messages || []).map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isLastAi = !isUser && index === (messages || []).length - 1;
          const previousUserMsg = isLastAi ? messages[index - 1]?.text : null;
          const isStreamingPlaceholder = !isUser && loading && !msg.text;
          const isInterrupted = !isUser && !loading && msg.streaming && !msg.text;
          const menuOpen = openMenuId === msg.id;

          return (
            <div key={msg.id} data-msg-id={msg.id}>
              {isUser ? (
                <div className="msg-user">
                  <span>{msg.text}</span>
                  <span className="block text-[11px] mt-1.5 opacity-70">{msg.timestamp}</span>
                </div>
              ) : (
                <div className="msg-ai">
                  <div className="chead">
                    <span className="w-[22px] h-[22px] rounded-lg grid place-items-center text-white bg-gradient-to-br from-[#059669] to-[#10B981]">
                      <Bot className="w-3.5 h-3.5" />
                    </span>
                    <b>الذكاء الدراسي</b>
                    {msg.is_out_of_scope ? (
                      <span className="srcchip muted">بحث في المستند</span>
                    ) : msg.citations && msg.citations.length > 0 ? (
                      <span className="srcchip">
                        <FileText className="w-3 h-3" />
                        {activeDoc?.filename || 'المستند'} · ص {msg.citations.slice(0, 4).join(', ')}
                      </span>
                    ) : null}
                  </div>

                  <div className="body">
                    {msg.is_out_of_scope && (
                      <div className="mb-3 px-3 py-2 rounded-xl bg-warning-soft text-warning text-xs font-bold flex items-center gap-2 border border-warning/30">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تنبيه: هذا السؤال غير مذكور في الملف المرفوع حالياً.</span>
                      </div>
                    )}

                    {isStreamingPlaceholder ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce"></span>
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0.3s]"></span>
                        </div>
                        <span className="text-sm font-bold text-accent">يجمع الإجابة الموثقة...</span>
                        {isStreaming && onStopStreaming && (
                          <button
                            type="button"
                            onClick={onStopStreaming}
                            className="flex items-center gap-1.5 text-xs font-bold text-danger border border-danger/30 rounded-lg px-2.5 py-1.5 bg-danger-soft hover:brightness-95 transition cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            إيقاف
                          </button>
                        )}
                      </div>
                    ) : isInterrupted ? (
                      <div className="flex items-center gap-2.5 py-1 flex-wrap text-sm">
                        <span className="font-bold text-warning flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          توقف توليد الإجابة قبل اكتمالها.
                        </span>
                        {previousUserMsg && (
                          <button
                            type="button"
                            onClick={() => handleRegenerateInterrupted(msg.id, previousUserMsg)}
                            className="px-2.5 py-1 rounded-lg bg-accent-soft border border-accent-border text-accent text-xs font-bold hover:brightness-95 transition cursor-pointer"
                          >
                            إعادة توليد الإجابة
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="prose max-w-none text-[15px] leading-relaxed break-words space-y-2 prose-p:text-text">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {formatArabicText(msg.text)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {!isStreamingPlaceholder && !isInterrupted && (
                    <div className="msg-tools">
                      {!isUser && (
                        <>
                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`mt-btn ${feedback[msg.id] === 'up' ? 'text-accent bg-accent-soft' : ''}`}
                            title="إجابة ممتازة ومفيدة"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`mt-btn ${feedback[msg.id] === 'down' ? 'text-danger bg-danger-soft' : ''}`}
                            title="تحتاج تحسيناً"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <span className="text-[11px] text-text-faint font-medium ms-1">{msg.timestamp}</span>

                      <span className="mt-spacer" />

                      <div className="relative" ref={menuRef}>
                        <button
                          onClick={() => setOpenMenuId(menuOpen ? null : msg.id)}
                          className={`mt-btn ${menuOpen ? 'bg-card-hover text-text' : ''}`}
                          title="مزيد من الإجراءات"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {menuOpen && (
                          <div className="absolute left-0 bottom-full mb-1.5 w-48 rounded-xl card p-1.5 z-40 text-xs font-bold space-y-0.5">
                            <button
                              onClick={() => { handleCopy(msg.id, msg.text); setOpenMenuId(null); }}
                              className="w-full text-right p-2 rounded-lg hover:bg-card-hover flex items-center gap-2 text-text"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === msg.id ? 'تم النسخ' : 'نسخ الإجابة'}</span>
                            </button>
                            {!isUser && (
                              <button
                                onClick={() => { handleSpeak(msg.id, msg.text); setOpenMenuId(null); }}
                                className="w-full text-right p-2 rounded-lg hover:bg-card-hover flex items-center gap-2 text-text"
                              >
                                {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                <span>{speakingMsgId === msg.id ? 'إيقاف القراءة' : 'استماع صوتي'}</span>
                              </button>
                            )}
                            {!isUser && (
                              <>
                                {['md', 'txt', 'html', 'print'].map(f => (
                                  <button
                                    key={f}
                                    onClick={() => { handleExportMessage(msg, f); setOpenMenuId(null); }}
                                    className="w-full text-right p-2 rounded-lg hover:bg-card-hover flex items-center gap-2 text-text"
                                  >
                                    {f === 'md' ? <FileCode className="w-3.5 h-3.5" /> : f === 'html' ? <FileCode className="w-3.5 h-3.5" /> : f === 'print' ? <Printer className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                    <span>{f === 'md' ? 'ملف Markdown' : f === 'txt' ? 'مستند نصي' : f === 'html' ? 'صفحة ويب' : 'طباعة / PDF'}</span>
                                  </button>
                                ))}
                              </>
                            )}
                            {!isUser && previousUserMsg && (
                              <button
                                onClick={() => { handleRegenerate(previousUserMsg); setOpenMenuId(null); }}
                                disabled={loading}
                                className="w-full text-right p-2 rounded-lg hover:bg-card-hover flex items-center gap-2 text-text disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>إعادة التوليد</span>
                              </button>
                            )}
                            {isUser && (
                              <button
                                onClick={() => { handleEditUserMessage(msg); setOpenMenuId(null); }}
                                className="w-full text-right p-2 rounded-lg hover:bg-card-hover flex items-center gap-2 text-text"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تعديل السؤال</span>
                              </button>
                            )}
                            <button
                              onClick={() => { handleDeleteMessage(msg.id); setOpenMenuId(null); }}
                              className="w-full text-right p-2 rounded-lg hover:bg-danger-soft flex items-center gap-2 text-danger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          aria-label="الانتقال للأسفل"
          title="الانتقال للأسفل"
          className="sticky bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-accent text-white shadow-xl flex items-center justify-center hover:brightness-105 hover:scale-105 transition z-20 cursor-pointer"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}