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
  FileCode
} from 'lucide-react';
import { uploadDocumentFile } from '../services/api';

export default function FileUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadDocumentFile(file);
      if (result.success) {
        onUploadSuccess(result);
        onClose();
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
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
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

        {/* Upload Dropzone */}
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
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full inline-block">
                جاهز للمعالجة والاستخراج
              </span>
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
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl theme-header-btn border text-xs font-bold transition"
          >
            إلغاء
          </button>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed border border-white/20"
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
