import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  FolderOpen, 
  FileText, 
  FileCheck2, 
  ChevronUp, 
  Layers, 
  Sparkles,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

export default function DocumentFAB({ 
  activeDoc, 
  onOpenUpload, 
  onOpenDocumentLibrary 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (fabRef.current && !fabRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={fabRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 font-['Tajawal'] select-none"
    >
      {/* Expanded Quick Action Menu */}
      {isOpen && (
        <div className="glass-panel rounded-2xl p-2 shadow-2xl border mb-2 w-72 space-y-1.5 animate-fade-in text-xs font-bold">
          
          <div className="p-2.5 rounded-xl theme-card-inner border flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
              <div className="overflow-hidden">
                <span className="text-[10px] theme-text-muted block">المقرر الدراسي النشط</span>
                <span className="theme-text-primary font-black text-xs truncate block max-w-[170px]">
                  {activeDoc ? activeDoc.filename : 'لم يتم اختيار مقرر'}
                </span>
              </div>
            </div>
            {activeDoc && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-teal-400 font-bold shrink-0">
                {activeDoc.pages_count || 1} صفحة
              </span>
            )}
          </div>

          {/* Action 1: Upload New Course */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenUpload();
            }}
            className="w-full text-right p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black transition flex items-center justify-between shadow-md shadow-emerald-600/20"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-white" />
              <span>رفع مادة / مقرر جديد</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">PDF / DOCX</span>
          </button>

          {/* Action 2: Open Course Library */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenDocumentLibrary();
            }}
            className="w-full text-right p-2.5 rounded-xl theme-card-inner hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition flex items-center justify-between theme-text-primary"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-teal-500" />
              <span>استعراض مكتبة المقررات المحفوظة</span>
            </div>
            <ArrowUpDown className="w-3.5 h-3.5 theme-text-muted" />
          </button>
        </div>
      )}

      {/* Main Floating Capsule Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-500/50 transition-all transform hover:scale-[1.03] active:scale-95"
        title="إدارة المقررات ورفع المستندات (انقر للاستعراض)"
      >
        {activeDoc ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>

            <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[260px]">
              <BookOpen className="w-4 h-4 text-emerald-500 dark:text-teal-400 shrink-0" />
              <span className="font-black text-xs theme-text-primary truncate">
                {activeDoc.filename}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md theme-card-inner border theme-text-muted shrink-0 hidden sm:inline">
                {activeDoc.pages_count || 1} ص
              </span>
            </div>

            <div className="p-1 rounded-lg bg-emerald-600 text-white shadow-sm group-hover:rotate-180 transition-transform duration-300">
              <ChevronUp className={`w-3.5 h-3.5 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-sm">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-black text-xs theme-text-primary">اختر أو ارفع مادة</span>
          </div>
        )}
      </button>
    </div>
  );
}
