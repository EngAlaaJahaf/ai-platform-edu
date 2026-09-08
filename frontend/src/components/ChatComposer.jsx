import React, { useState } from 'react';
import {
  Paperclip,
  Wand2,
  Sparkles,
  Mic,
  MicOff,
  CornerDownLeft,
  Square,
  X,
  FileText,
} from 'lucide-react';

export default function ChatComposer({
  inputValue,
  setInputValue,
  handleSend,
  loading,
  isStreaming,
  handleStopGeneration,
  activeDoc,
  onCloseActiveDoc,
  onOpenUpload,
  onOpenPromptManager,
  activePrompt,
  toggleListening,
  isListening,
  editingMsgId,
  handleCancelEdit,
  quickPrompts,
  textareaRef,
}) {
  const [isQuickPromptsOpen, setIsQuickPromptsOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const placeholder = editingMsgId
    ? 'عدّل سؤالك ثم أعد إرساله (Enter للإرسال)...'
    : activeDoc
      ? `اسأل أي سؤال حول "${activeDoc.filename}" (Enter للإرسال، Shift+Enter لسطر جديد)...`
      : 'اكتب سؤالك الأكاديمي هنا (Enter للإرسال، Shift+Enter لسطر جديد)...';

  return (
    <div className="composer-zone">
      {isListening && (
        <div className="mb-2 px-3.5 py-2 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-ping"></span>
            <span>جاري الاستماع لصوتك... تحدث الآن باللغة العربية أو الإنجليزية</span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="text-xs bg-danger hover:opacity-90 text-white px-2.5 py-1 rounded-lg transition"
          >
            إيقاف التسجيل
          </button>
        </div>
      )}

      {activeDoc && (
        <div className="active-doc">
          <FileText className="w-4 h-4 shrink-0" />
          <b className="truncate">{activeDoc.filename}</b>
          <button type="button" onClick={onCloseActiveDoc} className="close" title="إزالة المستند من الجلسة">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="composer flex-col sm:flex-row"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />

        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="comp-tools">
            <button
              type="button"
              onClick={toggleListening}
              className={`iconbtn w-10 h-10 text-xs transition ${isListening ? 'bg-danger-soft text-danger border-danger' : ''}`}
              title={isListening ? 'إيقاف التسجيل الصوتي' : 'إدخال صوتي (Voice Input)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenUpload}
              className="iconbtn w-10 h-10 text-xs transition"
              title="رفع مستند تعليمي جديد"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenPromptManager}
              className="iconbtn w-10 h-10 text-xs transition"
              title={activePrompt ? `البرومبت النشط: ${activePrompt.title}` : 'استخدام قالب برومبت مخصص'}
            >
              <Wand2 className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsQuickPromptsOpen(o => !o)}
                className={`iconbtn w-10 h-10 text-xs transition ${isQuickPromptsOpen ? 'bg-accent-soft text-accent border-accent-border' : ''}`}
                title="اقتراحات سريعة"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              {isQuickPromptsOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 card p-1.5 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-1.5 space-y-0.5 max-h-72 overflow-y-auto">
                    {(quickPrompts || []).map((qp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setIsQuickPromptsOpen(false);
                          handleSend(qp.query);
                        }}
                        className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold text-text-secondary hover:bg-accent-soft hover:text-accent transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="leading-snug">{qp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingMsgId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-ghost h-10 px-3 text-xs"
              >
                إلغاء
              </button>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                title="إيقاف توليد الإجابة"
                className="w-[46px] h-[46px] rounded-[14px] border border-danger/30 bg-danger-soft text-danger grid place-items-center flex-none transition hover:brightness-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="send-btn"
                title="إرسال السؤال"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}