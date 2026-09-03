import React, { useState } from 'react';
import { MoreHorizontal, Folder, Clock, Library, Grid3X3, Sparkles, Trash2, Edit3 } from 'lucide-react';

export default function ChatSidebar({ sessions, activeSessionId, onSelectSession, onDeleteSession, onRenameSession, onCreateNew, searchQuery, setSearchQuery, searchResults }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const topItems = [
    { id: 'skills', label: 'مهارات', icon: Sparkles, badge: 'جديد' },
    { id: 'addons', label: 'الإضافات', icon: Grid3X3 },
    { id: 'scheduled', label: 'مجدول', icon: Clock },
    { id: 'library', label: 'مكتبة', icon: Library },
  ];

  const projects = [
    { id: 'p1', title: 'قوالب التطبيقات', sessions: sessions.slice(0, 2) },
    { id: 'p2', title: 'الجامعة الرقمية', sessions: sessions.slice(2, 3) },
    { id: 'p3', title: 'مشروع انشاء برومبت', sessions: sessions.slice(3, 4) },
  ];
  const pinned = sessions.slice(0, 1);
  const filteredSearchResults = searchResults || [];

  return (
    <div className="simplebar-content flex flex-col h-full overflow-y-auto" style={{ padding: '0px 8px 12px' }}>
      <div className="relative mb-3 mt-2">
        <input type="text" placeholder="بحث في المحادثات..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="w-full pr-8 pl-3 py-1.5 rounded-xl theme-card-inner border text-xs theme-text-primary focus:border-indigo-500" />
        <span className="absolute right-3 top-2 text-slate-400">⌕</span>
      </div>

      {searchQuery.trim() ? (
        <div className="space-y-1">
          <div className="text-[11px] theme-text-muted px-2 mb-1">نتائج البحث ({filteredSearchResults.length})</div>
          {filteredSearchResults.map(r => {
            const sess = sessions.find(s=>s.id===r.sessionId);
            return sess ? (
              <div key={r.sessionId + r.messageId} onClick={()=>onSelectSession(r.sessionId)} className="p-2.5 rounded-xl border theme-card-inner hover:border-indigo-500/30 cursor-pointer">
                <div className="text-xs font-bold theme-text-primary truncate">{r.sessionTitle}</div>
                <div className="text-[11px] theme-text-muted line-clamp-2" dir="auto">{r.snippet}</div>
              </div>
            ) : null;
          })}
          {filteredSearchResults.length===0 && <div className="text-xs theme-text-muted p-3 text-center">لا نتائج</div>}
        </div>
      ) : (
        <>
          <div className="space-y-[1px]">
            {topItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center rounded-[10px] cursor-pointer gap-[8px] h-[36px] hover:bg-slate-100 dark:hover:bg-slate-800 w-full ps-[8px] pe-[2px]">
                  <div className="shrink-0 size-[20px] flex items-center justify-center">
                    <Icon size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0 flex gap-[4px] items-center text-[14px] theme-text-primary">
                    <span className="truncate" title={item.label}>{item.label}</span>
                    {item.badge && <div className="bg-indigo-500 ms-[2px] text-white text-[12px] leading-[14px] px-[4px] py-[2px] rounded-[5px]">{item.badge}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative mt-4">
            <div className="flex items-center justify-between ps-[10px] pe-[2px] h-[36px]">
              <span className="text-[13px] theme-text-muted font-medium">مثبّت</span>
            </div>
            <div className="flex flex-col w-full gap-px">
              {pinned.map(sess => (
                <div key={sess.id} onClick={() => onSelectSession(sess.id)} className={`flex items-center rounded-[10px] cursor-pointer gap-[8px] h-[36px] ps-[8px] pe-[2px] group ${activeSessionId===sess.id?'bg-indigo-500/10 border border-indigo-500/20':''} hover:bg-slate-100 dark:hover:bg-slate-800`}>
                  <div className="shrink-0 size-[20px] flex items-center justify-center"><Folder size={16} className="text-amber-500" /></div>
                  <div className="flex-1 min-w-0 text-[14px] theme-text-primary truncate" title={sess.title}>{sess.title}</div>
                  <div className="flex items-center relative">
                    <button onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId===sess.id?null:sess.id);}} className="rounded-[8px] flex items-center justify-center size-[32px] hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition">
                      <MoreHorizontal size={16} className="text-slate-500" />
                    </button>
                    {openMenuId===sess.id && (
                      <div className="absolute left-0 top-8 w-40 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                        <button onClick={(e)=>{e.stopPropagation(); setEditingId(sess.id); setEditTitle(sess.title); setOpenMenuId(null);}} className="w-full text-right px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"><Edit3 size={14}/> إعادة تسمية</button>
                        <button onClick={(e)=>{e.stopPropagation(); onDeleteSession(sess.id, e); setOpenMenuId(null);}} className="w-full text-right px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 flex items-center gap-2"><Trash2 size={14}/> حذف</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-3">
            <div className="flex items-center justify-between ps-[10px] pe-[2px] h-[36px]">
              <span className="text-[13px] theme-text-muted font-medium">المشاريع</span>
              <button onClick={onCreateNew} className="size-[32px] rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><span className="text-lg">+</span></button>
            </div>
            <div className="flex flex-col gap-1">
              {projects.map(proj => (
                <div key={proj.id} className="flex flex-col gap-px">
                  <div className="flex items-center gap-[8px] h-[36px] ps-[8px] pe-[2px] rounded-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <Folder size={16} className="text-indigo-500" />
                    <span className="text-sm theme-text-primary truncate">{proj.title}</span>
                  </div>
                  <div className="flex flex-col gap-px ps-[24px]">
                    {proj.sessions.map(sess => (
                      <div key={sess.id} onClick={()=>onSelectSession(sess.id)} className={`flex items-center rounded-[10px] h-[36px] gap-[8px] ps-[8px] pe-[2px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group ${activeSessionId===sess.id?'bg-indigo-500/10':''}`}>
                        <span className="text-[14px] theme-text-primary truncate flex-1" title={sess.title}>{sess.title}</span>
                        <button onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId===sess.id?null:sess.id);}} className="size-[32px] rounded-[8px] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between ps-[10px] pe-[2px] h-[36px]">
              <span className="text-[13px] theme-text-muted">المهام</span>
            </div>
            <div className="space-y-1">
              {sessions.slice(0,5).map(sess => (
                <div key={sess.id} onClick={()=>onSelectSession(sess.id)} className="flex items-center rounded-[10px] h-[36px] gap-[8px] ps-[8px] pe-[2px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-[14px] theme-text-primary truncate flex-1">{sess.title}</span>
                  <button onClick={(e)=>{e.stopPropagation(); setOpenMenuId(openMenuId===sess.id?null:sess.id);}} className="opacity-0 group-hover:opacity-100 size-[32px] flex items-center justify-center rounded-[8px] hover:bg-slate-200 dark:hover:bg-slate-700">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={()=>setEditingId(null)}>
          <div className="theme-bg-card p-4 rounded-2xl border shadow-xl w-80" onClick={e=>e.stopPropagation()}>
            <h3 className="text-sm font-bold theme-text-primary mb-2">إعادة تسمية</h3>
            <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="w-full theme-card-inner border rounded-xl px-3 py-2 text-sm theme-text-primary" autoFocus />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={()=>setEditingId(null)} className="px-3 py-1.5 rounded-lg border text-xs">إلغاء</button>
              <button onClick={()=>{onRenameSession(editingId, editTitle); setEditingId(null);}} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
