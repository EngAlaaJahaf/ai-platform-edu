import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Presentation,
  FileCode,
  ClipboardPaste
} from 'lucide-react';
import { uploadDocumentFile } from '../services/api';

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [isPastedFile, setIsPastedFile] = useState(false);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setMode('file');
    setPastedText('');
    setPastedTitle('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const allowedExtensions = [
    'pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt', 'md', 'csv', 'xlsx', 'xls', 'rtf'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`نوع الملف (.${ext}) غير مدعوم. يرجى رفع ملفات PDF أو Word (DOCX) أو PowerPoint (PPTX) أو نصوص (TXT/MD) أو Excel.`);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 50 ميجابايت.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsPastedFile(false);
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIsPastedFile(false);
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleConfirmPaste = () => {
    const text = pastedText.trim();
    if (!text) {
      setError('الصق نصاً أولاً قبل الاعتماد. الحقل فارغ حالياً.');
      return;
    }
    const cleanTitle = (pastedTitle.trim() || 'محتوى ملصق')
      .replace(/[\\/:*?"<>|]/g, '')
      .slice(0, 60) || 'محتوى ملصق';
    const pastedFile = new File([text], `${cleanTitle}.txt`, { type: 'text/plain;charset=utf-8' });
    setError(null);
    setIsPastedFile(true);
    validateAndSetFile(pastedFile);
    setMode('file');
    setPastedText('');
    setPastedTitle('');
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadDocumentFile(file);
      if (result.success) {
        onUploadSuccess(result);
        handleClose();
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء معالجة وقراءة المستند');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-8 h-8 text-blue-500" />;
    if (ext === 'pptx' || ext === 'ppt') return <Presentation className="w-8 h-8 text-amber-500" />;
    if (ext === 'xlsx' || ext === 'csv' || ext === 'xls') return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    return <FileCode className="w-8 h-8 text-teal-500" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl card p-6 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 left-5 iconbtn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black theme-text-primary">رفع المادة التعليمية أو المحاضرة</h3>
          <p className="text-xs theme-text-secondary">
            يدعم PDF، و Word (DOCX)، و PowerPoint (PPTX)، ونصوص TXT/MD، وجداول Excel
          </p>
        </div>

        {/* Supported Format Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">PDF</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">Word .docx</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">PowerPoint .pptx</span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-500">نص .txt / .md</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">Excel / CSV</span>
        </div>

        {/* Source Mode Toggle */}
        <div className="flex items-center gap-1.5 theme-nav p-1 rounded-2xl border">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'file'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'theme-text-secondary hover:bg-white/10'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>رفع ملف</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'paste'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'theme-text-secondary hover:bg-white/10'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>لصق نص</span>
          </button>
        </div>

        {mode === 'paste' ? (
          <div className="rounded-2xl theme-card-inner border p-4 space-y-3">
            <div>
              <label className="text-[11px] font-bold theme-text-primary block mb-1">عنوان المحتوى (اختياري):</label>
              <input
                type="text"
                value={pastedTitle}
                onChange={(e) => setPastedTitle(e.target.value)}
                placeholder="مثال: ملخص الفصل الرابع"
                className="w-full theme-card-inner border rounded-xl px-3.5 py-2 text-xs theme-text-primary outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold theme-text-primary">الصق النص هنا:</label>
                <span className="text-[10px] theme-text-muted font-mono">{pastedText.trim().length.toLocaleString()} حرف</span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="الصق محتوى المحاضرة أو المادة التعليمية هنا، وسيُعامل مثل أي ملف نصي..."
                dir="auto"
                className="w-full h-44 theme-card-inner border rounded-xl p-3 text-xs theme-text-primary outline-none leading-relaxed resize-y focus:border-emerald-500 transition"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmPaste}
                disabled={!pastedText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد النص كملف</span>
              </button>
            </div>
          </div>
        ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? 'border-teal-400 bg-teal-500/10 scale-[1.01]' 
              : file 
              ? 'border-emerald-500/60 bg-emerald-500/10' 
              : 'theme-card-inner border hover:border-emerald-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.xlsx,.xls,.rtf"
            onChange={handleChange}
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              <div className="mx-auto flex items-center justify-center">
                {getFileIcon(file.name)}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-extrabold theme-text-primary max-w-[280px] truncate">{file.name}</p>
                <p className="text-xs theme-text-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full inline-block">
                  جاهز للمعالجة والاستخراج
                </span>
                {isPastedFile && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-block">
                    من نص ملصق
                  </span>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full theme-card-inner flex items-center justify-center text-slate-400">
                <BookOpen className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-extrabold theme-text-primary">اسحب الملف هنا أو انقر للاختيار</p>
                <p className="text-xs theme-text-secondary mt-1">يدعم كافة مستندات المحاضرات حتى 50MB</p>
              </div>
            </>
          )}
        </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="btn-ghost"
            style={{ minHeight: 42, fontSize: 12.5, padding: '0 16px' }}
          >
            إلغاء
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary"
            style={{ minHeight: 42, fontSize: 12.5, padding: '0 18px' }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري معالجة المستند واستخراج المحتوى...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>بدء التحليل والمعالجة</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
