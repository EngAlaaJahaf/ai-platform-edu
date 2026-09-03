import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Folder, FolderOpen, Clock, Trash2, Edit3, Plus, ChevronDown, ChevronLeft, FileText, FileDown, X, FolderPlus, ArrowRightLeft } from 'lucide-react';

const PROJECTS_KEY = 'eduai_projects';
const EXPORTS_KEY = 'eduai_exported_files';

function loadProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; } catch { return []; }
}
function saveProjects(projects) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); } catch {}
}
function loadExports() {
  try { return JSON.parse(localStorage.getItem(EXPORTS_KEY)) || []; } catch { return []; }
}
function saveExports(exports) {
  try { localStorage.setItem(EXPORTS_KEY, JSON.stringify(exports)); } catch {}
}

// Render text with the search term highlighted using theme-appropriate styling
function highlightText(text, query) {
  if (!text || !query || !query.trim()) return text;
  const q = query.trim();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return text;
  const before = text.substring(0, idx);
  const match = text.substring(idx, idx + q.length);
  const after = text.substring(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded-[3px] px-0.5 bg-amber-200/70 dark:bg-amber-500/40 text-inherit">{match}</mark>
      {after}
    </>
  );
}

export default function ChatSidebar({
  sessions, activeSessionId, onSelectSession, onDeleteSession, onRenameSession,
  onCreateNew, onMoveSession, searchQuery, setSearchQuery, searchResults,
  onExportTracked, onOpenSearchResult
}) {
  const [projects, setProjects] = useState(loadProjects);
  const [exports, setExports] = useState(loadExports);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [moveSessionId, setMoveSessionId] = useState(null);
  const menuRef = useRef(null);
  const newProjRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
        setOpenProjectMenuId(null);
        setMoveSessionId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (showNewProject && newProjRef.current) newProjRef.current.focus();
  }, [showNewProject]);

  const trackedExports = onExportTracked ? [] : loadExports();

  const sessionsByProject = (projectId) => sessions.filter(s => s.projectId === projectId);
  const unassignedSessions = sessions.filter(s => !s.projectId);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const p = { id: `proj_${Date.now()}`, title: newProjectName.trim(), color: '#6366f1', createdAt: new Date().toLocaleDateString('ar-EG') };
    const updated = [...projects, p];
    setProjects(updated);
    saveProjects(updated);
    setNewProjectName('');
    setShowNewProject(false);
  };

  const handleRenameProject = (projId, newTitle) => {
    if (!newTitle.trim()) return;
    const updated = projects.map(p => p.id === projId ? { ...p, title: newTitle.trim() } : p);
    setProjects(updated);
    saveProjects(updated);
  };

  const handleDeleteProject = (projId) => {
    if (!window.confirm('هل تريد حذف هذا المشروع؟ المحادثات ستبقى غير مرتبطة.')) return;
    const updated = projects.filter(p => p.id !== projId);
    setProjects(updated);
    saveProjects(updated);
    if (onMoveSession) {
      sessions.filter(s => s.projectId === projId).forEach(s => onMoveSession(s.id, null));
    }
  };

  const handleMoveSession = (sessionId, targetProjectId) => {
    if (onMoveSession) {
      onMoveSession(sessionId, targetProjectId);
    } else {
      const updated = sessions.map(s => s.id === sessionId ? { ...s, projectId: targetProjectId } : s);
      try { localStorage.setItem('eduai_chat_sessions_master', JSON.stringify(updated)); } catch {}
    }
    setMoveSessionId(null);
    setOpenMenuId(null);
  };

  const toggleProject = (projId) => {
    setCollapsedProjects(prev => ({ ...prev, [projId]: !prev[projId] }));
  };

  const addExport = (file) => {
    const updated = [file, ...exports].slice(0, 50);
    setExports(updated);
    saveExports(updated);
  };

  if (showLibrary) {
    const docList = [];
    const seen = new Set();
    sessions.forEach(s => {
      if (s.docName && !seen.has(s.docName)) {
        seen.add(s.docName);
        docList.push({ name: s.docName, docId: s.docId, date: s.createdAt });
      }
    });
    return (
      <div className="simplebar-content flex flex-col h-full overflow-y-auto" style={{ padding: '0px 8px 12px' }}>
        <div className="flex items-center gap-2 mb-3 mt-2">
          <button onClick={() => setShowLibrary(false)} className="size-[32px] rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><ChevronLeft size={18} /></button>
          <span className="text-sm font-bold theme-text-primary">المكتبة</span>
        </div>

        <div className="text-[12px] theme-text-muted font-medium mb-1 mt-1">المستندات المرفوعة</div>
        <div className="flex flex-col gap-px mb-4">
          {docList.length === 0 && (
            <div className="text-xs theme-text-muted text-center py-4">لا مستندات مرافعة بعد</div>
          )}
          {docList.map((doc, i) => (
            <div key={i} className="flex items-center rounded-[10px] h-[36px] gap-[8px] ps-[8px] pe-[2px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
              <FileText size={15} className="text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] theme-text-primary truncate">{doc.name}</div>
                <div className="text-[10px] theme-text-muted">{doc.date}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[12px] theme-text-muted font-medium mb-1">الملفات المُصدَّرة</div>
        <div className="flex flex-col gap-px">
          {exports.length === 0 && (
            <div className="text-xs theme-text-muted text-center py-4">لا ملفات مُصدَّرة بعد</div>
          )}
          {exports.map((file, i) => (
            <div key={i} className="flex items-center rounded-[10px] h-[40px] gap-[8px] ps-[8px] pe-[2px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group">
              <FileDown size={16} className="text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] theme-text-primary truncate">{file.name}</div>
                <div className="text-[10px] theme-text-muted">{file.date}</div>
              </div>
              <a href={file.url} download={file.name} className="size-[28px] rounded-[6px] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-500">
                <FileDown size={12} />
              </a>
            </div>
          ))}
          {exports.length > 0 && (
            <button onClick={() => { setExports([]); saveExports([]); }} className="text-[11px] text-rose-500 hover:underline mt-2">مسح السجل</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="simplebar-content flex flex-col h-full overflow-y-auto" ref={menuRef} style={{ padding: '0px 8px 12px' }}>
      {/* Search */}
      <div className="relative mb-3 mt-2">
        <input type="text" placeholder="بحث في المحادثات..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pr-8 pl-3 py-1.5 rounded-xl theme-card-inner border text-xs theme-text-primary focus:border-indigo-500" />
        <span className="absolute right-3 top-2 text-slate-400">⌕</span>
      </div>

      {searchQuery.trim() ? (
        <div className="space-y-1">
          <div className="text-[11px] theme-text-muted px-2 mb-1">نتائج البحث ({(searchResults || []).length})</div>
          {(searchResults || []).map(r => {
            const sess = sessions.find(s => s.id === r.sessionId);
            return sess ? (
              <div key={r.sessionId + r.messageId} onClick={() => onOpenSearchResult ? onOpenSearchResult(r) : onSelectSession(r.sessionId)} className="p-2.5 rounded-xl border theme-card-inner hover:border-indigo-500/30 cursor-pointer">
                <div className="text-xs font-bold theme-text-primary truncate">{highlightText(r.sessionTitle, searchQuery)}</div>
                <div className="text-[11px] theme-text-muted line-clamp-2" dir="auto">{highlightText(r.snippet, searchQuery)}</div>
              </div>
            ) : null;
          })}
          {(searchResults || []).length === 0 && <div className="text-xs theme-text-muted p-3 text-center">لا نتائج</div>}
        </div>
      ) : (
        <>
          {/* New Chat + Library buttons */}
          <div className="flex items-center gap-1 mb-2">
            <button onClick={() => onCreateNew()} className="flex-1 flex items-center justify-center gap-1.5 h-[34px] rounded-[10px] bg-indigo-600 text-white text-[13px] font-medium hover:bg-indigo-500 transition">
              <Plus size={16} /> محادثة جديدة
            </button>
            <button onClick={() => setShowLibrary(true)} className="size-[34px] rounded-[10px] border theme-card-inner hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" title="المكتبة">
              <FileDown size={16} className="theme-text-muted" />
            </button>
          </div>

          {/* Unassigned sessions */}
          {unassignedSessions.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between ps-[4px] pe-[2px] h-[32px] mb-0.5">
                <span className="text-[12px] theme-text-muted font-medium">محادثات</span>
              </div>
              <div className="flex flex-col gap-px">
                {unassignedSessions.map(sess => (
                  <SessionItem key={sess.id} sess={sess} activeSessionId={activeSessionId} onSelect={onSelectSession}
                    onDelete={onDeleteSession} onRename={onRenameSession}
                    projects={projects} moveSessionId={moveSessionId} setMoveSessionId={setMoveSessionId}
                    onMoveSession={handleMoveSession} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="flex items-center justify-between ps-[4px] pe-[2px] h-[32px] mb-0.5">
            <span className="text-[12px] theme-text-muted font-medium">المشاريع</span>
            <button onClick={() => setShowNewProject(true)} className="size-[28px] rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" title="مشروع جديد">
              <FolderPlus size={15} className="theme-text-muted" />
            </button>
          </div>

          {showNewProject && (
            <div className="flex items-center gap-1 mb-2">
              <input ref={newProjRef} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} placeholder="اسم المشروع..." className="flex-1 h-[34px] px-3 rounded-xl theme-card-inner border text-xs theme-text-primary" />
              <button onClick={handleCreateProject} className="size-[34px] rounded-[10px] bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500"><Plus size={16} /></button>
              <button onClick={() => { setShowNewProject(false); setNewProjectName(''); }} className="size-[34px] rounded-[10px] border theme-card-inner flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"><X size={14} /></button>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {projects.map(proj => {
              const projSessions = sessionsByProject(proj.id);
              const isCollapsed = collapsedProjects[proj.id];
              return (
                <div key={proj.id} className="flex flex-col">
                  <div className="flex items-center h-[34px] rounded-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group ps-[4px] pe-[2px]">
                    <button onClick={() => toggleProject(proj.id)} className="size-[24px] flex items-center justify-center shrink-0">
                      {isCollapsed ? <ChevronLeft size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </button>
                    <div onClick={() => toggleProject(proj.id)} className="flex items-center gap-[6px] flex-1 min-w-0">
                      <Folder size={15} style={{ color: proj.color }} className="shrink-0" />
                      <span className="text-[13px] theme-text-primary truncate">{proj.title}</span>
                      <span className="text-[11px] theme-text-muted">({projSessions.length})</span>
                    </div>
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenProjectMenuId(openProjectMenuId === proj.id ? null : proj.id); }} className="size-[28px] rounded-[8px] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <MoreHorizontal size={14} />
                      </button>
                      {openProjectMenuId === proj.id && (
                        <div className="absolute left-0 top-8 w-40 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(proj.id); setEditTitle(proj.title); setOpenProjectMenuId(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"><Edit3 size={14} /> إعادة تسمية</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); setOpenProjectMenuId(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 flex items-center gap-2"><Trash2 size={14} /> حذف المشروع</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-col gap-px ps-[28px]">
                      {projSessions.length === 0 && <div className="text-[11px] theme-text-muted ps-2 py-1">فارغ</div>}
                      {projSessions.map(sess => (
                        <SessionItem key={sess.id} sess={sess} activeSessionId={activeSessionId} onSelect={onSelectSession}
                          onDelete={onDeleteSession} onRename={onRenameSession}
                          projects={projects} moveSessionId={moveSessionId} setMoveSessionId={setMoveSessionId}
                          onMoveSession={handleMoveSession} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="text-[11px] theme-text-muted text-center py-2">لا مشاريع بعد. أضف مشروعًا لتنظيم محادثاتك.</div>
            )}
          </div>
        </>
      )}

      {/* Rename Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingId(null)}>
          <div className="theme-bg-card p-4 rounded-2xl border shadow-xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold theme-text-primary mb-2">إعادة تسمية</h3>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && (projects.find(p => p.id === editingId) ? handleRenameProject(editingId, editTitle) : onRenameSession(editingId, editTitle), setEditingId(null))} className="w-full theme-card-inner border rounded-xl px-3 py-2 text-sm theme-text-primary" autoFocus />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg border text-xs">إلغاء</button>
              <button onClick={() => { if (projects.find(p => p.id === editingId)) handleRenameProject(editingId, editTitle); else onRenameSession(editingId, editTitle); setEditingId(null); }} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionItem({ sess, activeSessionId, onSelect, onDelete, onRename, projects, moveSessionId, setMoveSessionId, onMoveSession, openMenuId, setOpenMenuId }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(sess.title);
  const isActive = sess.id === activeSessionId;

  return (
    <div className="flex flex-col">
      <div onClick={() => onSelect(sess.id)} className={`flex items-center rounded-[10px] cursor-pointer transition-colors gap-[8px] h-[34px] ps-[8px] pe-[2px] group ${isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
        <Clock size={14} className="text-slate-400 shrink-0" />
        {editing ? (
          <input value={title} onChange={e => setTitle(e.target.value)} onBlur={() => { if (title.trim()) onRename(sess.id, title.trim()); setEditing(false); setTitle(sess.title); }} onKeyDown={e => { if (e.key === 'Enter') { if (title.trim()) onRename(sess.id, title.trim()); setEditing(false); } if (e.key === 'Escape') { setEditing(false); setTitle(sess.title); } }} onClick={e => e.stopPropagation()} className="flex-1 min-w-0 text-[13px] theme-text-primary bg-transparent border-b border-indigo-500 outline-none px-1" autoFocus />
        ) : (
          <span className="text-[13px] theme-text-primary truncate flex-1" title={sess.title}>{sess.title}</span>
        )}
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === sess.id ? null : sess.id); }} className="size-[28px] rounded-[8px] hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shrink-0">
            <MoreHorizontal size={14} className="text-slate-500" />
          </button>
          {openMenuId === sess.id && (
            <div className="absolute left-0 top-8 w-44 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); setOpenMenuId(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"><Edit3 size={14} /> إعادة تسمية</button>
              <div className="border-t border-slate-100 dark:border-slate-800" />
              <button onClick={(e) => { e.stopPropagation(); setMoveSessionId(sess.id); setOpenMenuId(null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"><ArrowRightLeft size={14} /> نقل إلى مشروع</button>
              {sess.projectId && (
                <button onClick={(e) => { e.stopPropagation(); onMoveSession(sess.id, null); }} className="w-full text-right px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"><ArrowRightLeft size={14} /> إزالة من المشروع</button>
              )}
              <div className="border-t border-slate-100 dark:border-slate-800" />
              <button onClick={(e) => onDelete(sess.id, e)} className="w-full text-right px-3 py-2 text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 flex items-center gap-2"><Trash2 size={14} /> حذف</button>
            </div>
          )}
        </div>
      </div>

      {/* Move to project sub-menu */}
      {moveSessionId === sess.id && (
        <div className="ms-6 mb-1 mt-0.5 p-1 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-40">
          <div className="text-[10px] theme-text-muted px-2 py-1">اختر مشروعًا:</div>
          {projects.map(p => (
            <button key={p.id} onClick={(e) => { e.stopPropagation(); onMoveSession(sess.id, p.id); }} className="w-full text-right px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2">
              <Folder size={12} style={{ color: p.color }} /> {p.title}
            </button>
          ))}
          {projects.length === 0 && <div className="text-[10px] theme-text-muted px-2 py-1">لا مشاريع متاحة</div>}
        </div>
      )}
    </div>
  );
}
