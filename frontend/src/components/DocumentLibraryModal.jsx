import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  Search, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  Eye, 
  Sparkles, 
  BookMarked, 
  MessageSquare, 
  Upload, 
  Calendar, 
  Layers, 
  FileCheck,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { 
  fetchDocuments, 
  deleteDocument, 
  updateDocumentTitle, 
  fetchDocumentDetails 
} from '../services/api';

export default function DocumentLibraryModal({ 
  isOpen, 
  onClose, 
  activeDoc, 
  onSelectDoc, 
  onOpenUpload,
  onNavigateToTab
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDocId, setEditingDocId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDocs();
      setPreviewDoc(null);
      setEditingDocId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) => 
    d.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.preview_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (doc) => {
    setEditingDocId(doc.id);
    setEditTitle(doc.filename);
  };

  const handleSaveEdit = async (docId) => {
    if (!editTitle.trim()) return;
    try {
      await updateDocumentTitle(docId, editTitle.trim());
      setEditingDocId(null);
      await loadDocs();
      if (activeDoc?.doc_id === docId) {
        onSelectDoc({
          ...activeDoc,
          filename: editTitle.trim()
        });
      }
    } catch (e) {
      alert(`فشل تعديل الاسم: ${e.message}`);
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند نهائياً من الذاكرة وقاعدة البيانات؟')) return;
    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      await loadDocs();
      if (activeDoc?.doc_id === docId) {
        onSelectDoc(null);
      }
    } catch (err) {
      alert(`فشل حذف المستند: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreview = async (docId, e) => {
    e.stopPropagation();
    setPreviewLoading(true);
    try {
      const details = await fetchDocumentDetails(docId);
      setPreviewDoc(details);
    } catch (err) {
      alert(`فشل تحميل معاينة المستند: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAction = (doc, tabName) => {
    onSelectDoc(doc);
    onClose();
    if (onNavigateToTab) {
      onNavigateToTab(tabName);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black theme-text-primary">مكتبة المستندات والمقررات</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                  {documents.length} مستندات
                </span>
              </div>
              <p className="text-xs theme-text-secondary">
                استعرض كافة ملفاتك المحفوظة، بدّل المستند النشط، أو انطلق للتلخيص والاختبارات بنقرة واحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 border border-white/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع مادة جديدة</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 theme-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في أسماء أو نصوص الملفات..."
              className="w-full pr-9 pl-3 py-2 rounded-xl theme-card-inner border text-xs theme-text-primary placeholder-slate-400 outline-none focus:border-cyan-500 font-['Tajawal']"
            />
          </div>

          <div className="flex items-center gap-2 text-xs theme-text-muted">
            <button
              onClick={loadDocs}
              disabled={loading}
              className="p-2 rounded-xl theme-header-btn border hover:text-cyan-500 transition"
              title="تحديث القائمة"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span>إجمالي الكلمات المفهرسة: <b className="theme-text-primary">{documents.reduce((acc, d) => acc + (d.words_count || 0), 0).toLocaleString()} كلمة</b></span>
          </div>
        </div>

        {/* Documents Grid / List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
          {loading ? (
            <div className="py-20 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
              <p className="text-xs theme-text-muted">جاري تحميل مكتبة المستندات...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-20 text-center space-y-3 glass-card rounded-2xl p-8 border">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold theme-text-primary">
                {searchQuery ? 'لم يتم العثور على مستند يطابق البحث' : 'مكتبة المستندات فارغة'}
              </h4>
              <p className="text-xs theme-text-muted max-w-sm mx-auto">
                قم برفع أول مادة تعليمية (PDF, Word, PPTX) لتظهر هنا وتتمكن من الرجوع إليها في أي وقت.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpload();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>رفع مستند الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocs.map((doc) => {
                const isActive = activeDoc?.doc_id === doc.id || activeDoc?.id === doc.id;
                const isEditing = editingDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-50 to-cyan-50/50 dark:from-indigo-950/70 dark:to-cyan-950/40 border-cyan-500 shadow-md ring-2 ring-cyan-500/20'
                        : 'theme-card-inner border hover:border-indigo-400/40'
                    }`}
                  >
                    
                    {/* Top Row: File Name & Active Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 overflow-hidden">
                        <span className={`p-2 rounded-xl shrink-0 mt-0.5 ${isActive ? 'bg-cyan-500 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-cyan-400'}`}>
                          <FileText className="w-4 h-4" />
                        </span>

                        <div className="flex-1 overflow-hidden">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="px-2.5 py-1 rounded-lg border theme-card-inner text-xs font-bold theme-text-primary outline-none focus:border-cyan-500 w-full"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(doc.id)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white"
                                title="حفظ"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingDocId(null)}
                                className="p-1.5 rounded-lg bg-slate-400 text-white"
                                title="إلغاء"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <b className="text-xs font-black theme-text-primary truncate block" title={doc.filename}>
                                  {doc.filename}
                                </b>
                                <button
                                  onClick={() => handleStartEdit(doc)}
                                  className="theme-text-muted hover:text-cyan-500 transition"
                                  title="تعديل اسم المستند"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[10px] theme-text-muted block mt-0.5">
                                {doc.pages_count} صفحة • {doc.words_count || 0} كلمة • {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ar-EG') : 'حديثاً'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-black shrink-0 shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3" /> نشط حالياً
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectDoc(doc);
                          }}
                          className="px-2.5 py-1 rounded-xl theme-header-btn border text-[11px] font-bold shrink-0 hover:border-cyan-500 hover:text-cyan-600 transition"
                          title="تعيين كملف نشط للمنصة"
                        >
                          تفعيل الآن
                        </button>
                      )}
                    </div>

                    {/* Preview Snippet */}
                    {doc.preview_text && (
                      <p className="text-[11px] theme-text-secondary line-clamp-2 leading-relaxed p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-medium">
                        {doc.preview_text}
                      </p>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      {/* Shortcuts */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAction(doc, 'summary')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition flex items-center gap-1"
                          title="الانتقال للملخص"
                        >
                          <BookMarked className="w-3 h-3 text-cyan-500" />
                          <span>تلخيص</span>
                        </button>

                        <button
                          onClick={() => handleAction(doc, 'quiz')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition flex items-center gap-1"
                          title="الانتقال للاختبار"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>اختبار</span>
                        </button>

                        <button
                          onClick={() => handleAction(doc, 'chat')}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/25 transition flex items-center gap-1"
                          title="الانتقال للمحادثة"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400" />
                          <span>محادثة</span>
                        </button>
                      </div>

                      {/* Preview & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handlePreview(doc.id, e)}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-cyan-500 transition"
                          title="معاينة محتوى المستند"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-rose-500 transition"
                          title="حذف المستند"
                        >
                          <Trash2 className={`w-3.5 h-3.5 ${deletingId === doc.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Document Preview Drawer Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-500" />
                  <div>
                    <h4 className="text-sm font-black theme-text-primary">{previewDoc.filename}</h4>
                    <p className="text-[11px] theme-text-muted">
                      {previewDoc.pages_count} صفحة • {previewDoc.words_count} كلمة • {previewDoc.chunks?.length || 0} قطع RAG
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl theme-header-btn border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 rounded-2xl theme-card-inner border text-xs leading-relaxed theme-text-primary font-mono whitespace-pre-wrap">
                {previewDoc.full_text}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    onSelectDoc(previewDoc);
                    setPreviewDoc(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs"
                >
                  تعيين كمستند نشط وبدء الدراسة
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
