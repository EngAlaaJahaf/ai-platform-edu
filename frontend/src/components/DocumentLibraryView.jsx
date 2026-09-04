import React, { useState, useEffect } from 'react';
import { 
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
  Download,
  X,
  LayoutGrid,
  List,
  ArrowRight,
  Plus
} from 'lucide-react';
import { 
  fetchDocuments, 
  deleteDocument, 
  updateDocumentTitle, 
  fetchDocumentDetails 
} from '../services/api';

export default function DocumentLibraryView({ 
  activeDoc, 
  onSelectDoc, 
  onOpenUpload,
  onNavigateToTab 
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [editingDocId, setEditingDocId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

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
      if (activeDoc?.doc_id === docId || activeDoc?.id === docId) {
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
      if (activeDoc?.doc_id === docId || activeDoc?.id === docId) {
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
    if (onNavigateToTab) {
      onNavigateToTab(tabName);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black theme-text-primary">مكتبة المقررات والمستندات</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 font-black text-xs">
                {documents.length} مستندات محفوظة
              </span>
            </div>
            <p className="text-xs theme-text-secondary mt-1">
              استعرض، ابحث، بدّل المستند النشط فوراً، أو انطلق للتلخيص والاختبارات بنقرة واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition flex items-center gap-2 border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>رفع مقرر جديد</span>
          </button>

          <button
            onClick={loadDocs}
            disabled={loading}
            className="p-2.5 rounded-xl theme-header-btn border hover:text-teal-500 transition"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
      <div className="glass-card rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 theme-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في أسماء أو نصوص المقررات المحفوظة..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl theme-card-inner border text-xs theme-text-primary placeholder-slate-400 outline-none focus:border-teal-500 font-['Tajawal']"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="theme-text-muted hidden sm:inline">
            إجمالي الكلمات المفهرسة: <b className="theme-text-primary font-mono">{documents.reduce((acc, d) => acc + (d.words_count || 0), 0).toLocaleString()} كلمة</b>
          </span>

          <div className="flex items-center gap-1 p-1 rounded-xl theme-card-inner border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'theme-text-muted'}`}
              title="عرض شبكي"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'theme-text-muted'}`}
              title="عرض جدولي"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      {loading ? (
        <div className="py-24 text-center space-y-3 glass-card rounded-3xl p-8 border animate-pulse">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
          <p className="text-xs theme-text-muted">جاري قراءة واسترجاع ملفاتك من قاعدة البيانات...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-24 text-center space-y-4 glass-card rounded-3xl p-8 border">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold theme-text-primary">
            {searchQuery ? 'لم يتم العثور على مستند يطابق البحث' : 'مكتبة المقررات فارغة حتى الآن'}
          </h3>
          <p className="text-xs theme-text-secondary max-w-md mx-auto">
            قم برفع مذكراتك أو كتبك الجامعية (PDF, Word, PPTX) لتتم فهرستها وتوليد ملخصات واختبارات تفاعلية لها.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>رفع أول مقرر الآن</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const isActive = activeDoc?.doc_id === doc.id || activeDoc?.id === doc.id;
            const isEditing = editingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className={`glass-card rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-xl ${
                  isActive
                    ? 'ring-2 ring-teal-500/40 border-teal-500 shadow-teal-500/10 bg-gradient-to-br from-emerald-50/50 to-teal-50/40 dark:from-emerald-950/70 dark:to-teal-950/40'
                    : 'hover:border-emerald-400/40'
                }`}
              >
                
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 overflow-hidden">
                    <span className={`p-2.5 rounded-2xl shrink-0 ${isActive ? 'bg-teal-500 text-white shadow-md' : 'bg-emerald-500/15 text-emerald-600 dark:text-teal-400'}`}>
                      <FileText className="w-5 h-5" />
                    </span>

                    <div className="flex-1 overflow-hidden">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border theme-card-inner text-xs font-bold theme-text-primary outline-none focus:border-teal-500 w-full"
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
                            <b className="text-sm font-black theme-text-primary truncate block" title={doc.filename}>
                              {doc.filename}
                            </b>
                            <button
                              onClick={() => handleStartEdit(doc)}
                              className="theme-text-muted hover:text-teal-500 transition shrink-0"
                              title="تعديل اسم المستند"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] theme-text-muted block mt-1">
                            {doc.pages_count} صفحة • {(doc.words_count || 0).toLocaleString()} كلمة • {doc.created_at ? new Date(doc.created_at).toLocaleDateString('ar-EG') : 'حديثاً'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-black shrink-0 shadow-sm flex items-center gap-1">
                      <Check className="w-3 h-3" /> نشط
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectDoc(doc)}
                      className="px-3 py-1 rounded-xl theme-header-btn border text-xs font-bold shrink-0 hover:border-teal-500 hover:text-teal-600 transition"
                      title="تفعيل كملف نشط للمنصة"
                    >
                      تفعيل
                    </button>
                  )}
                </div>

                {/* Preview text */}
                {doc.preview_text && (
                  <p className="text-xs theme-text-secondary line-clamp-3 leading-relaxed p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-medium">
                    {doc.preview_text}
                  </p>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAction(doc, 'summary')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition flex items-center gap-1"
                      title="الانتقال للملخص"
                    >
                      <BookMarked className="w-3.5 h-3.5 text-teal-500" />
                      <span>تلخيص</span>
                    </button>

                    <button
                      onClick={() => handleAction(doc, 'quiz')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition flex items-center gap-1"
                      title="الانتقال للاختبار"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>اختبار</span>
                    </button>

                    <button
                      onClick={() => handleAction(doc, 'chat')}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition flex items-center gap-1"
                      title="الانتقال للمحادثة"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>محادثة</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handlePreview(doc.id, e)}
                      className="p-2 rounded-xl theme-header-btn border hover:text-teal-500 transition"
                      title="معاينة النص المستخلص"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      disabled={deletingId === doc.id}
                      className="p-2 rounded-xl theme-header-btn border hover:text-rose-500 transition"
                      title="حذف المستند"
                    >
                      <Trash2 className={`w-4 h-4 ${deletingId === doc.id ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-900 font-black theme-text-primary">
              <tr>
                <th className="px-5 py-4">اسم المستند</th>
                <th className="px-5 py-4">الصفحات</th>
                <th className="px-5 py-4">الكلمات</th>
                <th className="px-5 py-4">تاريخ الرفع</th>
                <th className="px-5 py-4 text-center">الحالة</th>
                <th className="px-5 py-4 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {filteredDocs.map((doc) => {
                const isActive = activeDoc?.doc_id === doc.id || activeDoc?.id === doc.id;
                return (
                  <tr key={doc.id} className="hover:bg-white/5 transition">
                    <td className="px-5 py-4 font-bold theme-text-primary max-w-sm truncate">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 theme-text-secondary">{doc.pages_count}</td>
                    <td className="px-5 py-4 theme-text-secondary">{(doc.words_count || 0).toLocaleString()}</td>
                    <td className="px-5 py-4 theme-text-muted">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('ar-EG') : '-'}</td>
                    <td className="px-5 py-4 text-center">
                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white font-black text-[10px]">
                          نشط حالياً
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectDoc(doc)}
                          className="px-2.5 py-1 rounded-xl theme-header-btn border text-[11px] font-bold"
                        >
                          تفعيل
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleAction(doc, 'summary')}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-teal-500"
                          title="تلخيص"
                        >
                          <BookMarked className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAction(doc, 'quiz')}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-amber-500"
                          title="اختبار"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handlePreview(doc.id, e)}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-emerald-500"
                          title="معاينة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1.5 rounded-lg theme-header-btn border hover:text-rose-500"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Text Preview Modal / Drawer */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black theme-text-primary">{previewDoc.filename}</h4>
                  <p className="text-xs theme-text-muted">
                    {previewDoc.pages_count} صفحة • {previewDoc.words_count} كلمة • {previewDoc.chunks?.length || 0} قطع RAG
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl theme-header-btn border"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl theme-card-inner border text-xs leading-relaxed theme-text-primary font-mono whitespace-pre-wrap">
              {previewDoc.full_text}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onSelectDoc(previewDoc);
                  setPreviewDoc(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md"
              >
                تعيين كمستند نشط للمنصة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
