import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Presentation,
  MessageSquareText,
  FileText,
  BrainCircuit,
  CheckCheck,
  Languages,
  BookMarked,
  Users,
  Crown,
  ShieldAlert,
  Sun,
  Moon,
  Upload,
  Settings,
  Wand2,
  ChevronDown,
  X,
  Plus,
  MoreHorizontal,
  GraduationCap,
  PanelRightClose,
  Sparkles,
  CircleUserRound
} from 'lucide-react';

const TABS = {
  dashboard: { label: 'اللوحة', icon: LayoutDashboard },
  documents: { label: 'مستنداتي', icon: FolderOpen },
  presentations: { label: 'العروض', icon: Presentation },
  teams: { label: 'الفرق', icon: Users },
  translate: { label: 'الترجمة', icon: Languages },
  terms: { label: 'المصطلحات', icon: BookMarked },
  chat: { label: 'المحادثة', icon: MessageSquareText },
  summary: { label: 'الملخص', icon: FileText },
  quiz: { label: 'الاختبار', icon: BrainCircuit },
  proofread: { label: 'المراجعة', icon: CheckCheck },
  subscription: { label: 'الاشتراك', icon: Crown },
  admin: { label: 'الإدارة', icon: ShieldAlert },
};

const GROUPS = [
  { label: 'الرئيسية', tabs: ['dashboard', 'documents', 'presentations'] },
  { label: 'أدوات الدراسة', tabs: ['chat', 'summary', 'quiz', 'proofread', 'translate', 'terms'] },
  { label: 'التعاون', tabs: ['teams'] },
  { label: 'الحساب', tabs: ['subscription', 'admin'] },
];

const MOBILE_PRIMARY = ['dashboard', 'chat', 'summary', 'quiz', 'documents'];

function NavItem({ id, collapsed, activeTab, setActiveTab, isAdmin }) {
  const tab = TABS[id];
  if (!tab) return null;
  if (id === 'admin' && !isAdmin) return null;
  const Icon = tab.icon;
  const isActive = activeTab === id;
  return (
    <button
      onClick={() => setActiveTab(id)}
      title={tab.label}
      className={`flex items-center gap-3 w-full rounded-xl text-sm font-medium transition cursor-pointer ${
        collapsed ? 'justify-center py-2.5' : 'py-2.5 px-3 text-right'
      } ${
        isActive
          ? 'bg-accent-soft text-accent font-bold'
          : 'text-text-muted hover:bg-card-hover hover:text-text'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.4 : 1.9} />
      {!collapsed && <span className="truncate">{tab.label}</span>}
    </button>
  );
}

export default function AppShell({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onCloseActiveDoc,
  activeDoc,
  user,
  health,
  theme,
  onToggleTheme,
  onOpenApiKey,
  onOpenPromptManager,
  onOpenAuth,
  children,
}) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('eduai_sidebar_collapsed') === '1');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const profileRef = useRef(null);
  const moreRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  const activeLabel = TABS[activeTab]?.label || 'الرئيسية';

  useEffect(() => {
    localStorage.setItem('eduai_sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setIsMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenus = () => {
    setIsProfileOpen(false);
    setIsMoreOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ================= HEADER h-14 ================= */}
      <header className="sticky top-0 z-50 h-14 flex items-center gap-2 md:gap-3 px-3 md:px-5 bg-panel/90 backdrop-blur-md border-b border-border">
        {/* Zone 1 — brand + current tool */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-90 transition"
            title="EduAI"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#059669] to-[#10B981] flex items-center justify-center text-white shadow-md shadow-accent/20">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="hidden sm:block font-bold text-sm text-text-strong leading-none">EduAI</span>
          </button>
          <span className="hidden md:flex items-center gap-1.5 text-xs text-text-muted font-medium">
            <span>/</span>
            <span className="text-text-strong font-bold">{activeLabel}</span>
          </span>
        </div>

        {/* Zone 2 — active document chip + close */}
        {activeDoc && (
          <div className="hidden sm:flex items-center gap-2 border border-border bg-panel rounded-xl pl-1.5 max-w-[260px] shrink-0">
            <span className="truncate px-2 py-1 text-xs font-bold text-accent">
              <span className="text-text-muted font-medium">المرجع: </span>{activeDoc.filename}
            </span>
            <button
              onClick={onCloseActiveDoc}
              className="w-6 h-6 rounded-lg grid place-items-center text-text-faint hover:text-danger hover:bg-danger-soft transition cursor-pointer"
              title="إغلاق المستند النشط"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Zone 3 — quick actions + theme switch */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-panel text-text-muted hover:text-text hover:border-border-strong text-xs font-bold transition cursor-pointer"
            title="رفع مستند"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">مستند</span>
          </button>
          <button
            onClick={onOpenApiKey}
            className="h-9 w-9 rounded-xl border border-border bg-panel grid place-items-center text-text-muted hover:text-text hover:border-border-strong transition cursor-pointer"
            title="إعدادات نماذج الذكاء الاصطناعي"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPromptManager}
            className="hidden md:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-border bg-panel text-text-muted hover:text-text hover:border-border-strong text-xs font-bold transition cursor-pointer"
            title="بنك البرومبتات"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-500" />
          </button>
          <button
            onClick={onToggleTheme}
            className="h-9 w-9 rounded-xl border border-border bg-panel grid place-items-center text-text-muted hover:text-text hover:border-border-strong transition cursor-pointer"
            title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Zone 4 — profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-xl border border-border bg-panel py-1 pe-1 ps-2 cursor-pointer hover:border-border-strong transition text-xs font-bold text-text"
          >
            <span className="w-6 h-6 rounded-lg bg-accent-soft text-accent grid place-items-center font-black text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'ط'}
            </span>
            <span className="hidden sm:inline font-bold truncate max-w-[90px]">{user?.name || 'زائر'}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-text-faint transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl card p-2 z-50 space-y-1">
              <div className="p-3 rounded-xl bg-card-hover border border-border">
                <span className="text-xs text-text-muted block truncate">{user?.email || 'حساب محلي'}</span>
                <span className="text-sm font-bold text-text-strong block mt-0.5">{user?.name || 'زائر'}</span>
                <div className="mt-1.5 flex items-center justify-between text-xs text-text-muted">
                  <span>
                    <span className="font-mono font-bold text-accent">{user?.tokens_used || 0}</span> توكن
                  </span>
                  <span className="tag success">{user?.tier || 'Free'}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-text-muted border-t border-border pt-2">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${health?.status === 'ok' ? 'bg-success' : 'bg-danger'}`} />
                    الخادم {health?.status === 'ok' ? 'متصل' : 'غير متصل'}
                  </span>
                  <span className="font-bold text-accent">{health?.has_gemini ? '✓ نموذج AI' : 'بلا مفتاح'}</span>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => { closeMenus(); setActiveTab('admin'); }}
                  className="w-full text-right p-2.5 rounded-xl bg-warning-soft text-warning hover:brightness-95 transition flex items-center gap-2 border border-warning/30 cursor-pointer text-xs font-bold"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>لوحة تحكم المدير</span>
                </button>
              )}
              <button
                onClick={() => { closeMenus(); setActiveTab('subscription'); }}
                className="w-full text-right p-2.5 rounded-xl hover:bg-card-hover transition flex items-center gap-2.5 text-text cursor-pointer text-xs font-bold"
              >
                <Crown className="w-4 h-4 text-warning" />
                <span>الخطة والاشتراك</span>
              </button>
              <button
                onClick={() => { closeMenus(); setActiveTab('documents'); }}
                className="w-full text-right p-2.5 rounded-xl hover:bg-card-hover transition flex items-center gap-2.5 text-text cursor-pointer text-xs font-bold"
              >
                <FolderOpen className="w-4 h-4 text-accent" />
                <span>مكتبة المستندات</span>
              </button>
              <button
                onClick={() => { closeMenus(); onOpenApiKey(); }}
                className="w-full text-right p-2.5 rounded-xl hover:bg-card-hover transition flex items-center gap-2.5 text-text cursor-pointer text-xs font-bold"
              >
                <Settings className="w-4 h-4 text-info" />
                <span>إعدادات الخادم والنماذج</span>
              </button>
              <button
                onClick={() => { closeMenus(); onOpenAuth(); }}
                className="w-full text-right p-2.5 rounded-xl hover:bg-card-hover transition flex items-center gap-2.5 text-text cursor-pointer text-xs font-bold"
              >
                <CircleUserRound className="w-4 h-4 text-sky-500" />
                <span>إدارة الحساب وتسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ================= BODY: SIDEBAR + MAIN ================= */}
      <div className="flex flex-1 min-h-0">
        {/* Right RTL sidebar — wide / icon-only / hidden (mobile → bottom nav) */}
        <aside className={`hidden lg:flex flex-col sticky top-14 h-[calc(100vh-56px)] bg-panel border-inline-end border-border overflow-y-auto transition-all ${collapsed ? 'w-16 py-5 px-2' : 'flex-none w-[230px] py-5 px-3'}`}>
          {!collapsed && (
            <button
              onClick={onOpenUpload}
              className="btn-primary w-full mb-4 text-sm"
            >
              <Plus className="w-4 h-4" />
              مستند جديد
            </button>
          )}
          {collapsed && (
            <button
              onClick={onOpenUpload}
              className="iconbtn w-full mb-4 mx-auto text-accent border-accent-border bg-accent-soft"
              title="رفع مستند جديد"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {GROUPS.map(group => (
            <div key={group.label} className="mb-3">
              {!collapsed && <div className="sidebarlabel">{group.label}</div>}
              <div className={collapsed ? 'flex flex-col items-center gap-1' : 'flex flex-col gap-0.5'}>
                {group.tabs.map(id => (
                  <NavItem key={id} id={id} collapsed={collapsed} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-auto pt-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center gap-2.5 rounded-xl text-text-faint hover:text-text hover:bg-card-hover text-xs font-bold transition cursor-pointer py-2 px-3"
              title={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
            >
              <PanelRightClose className={`w-4 h-4 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              {!collapsed && <span className="truncate">طي الشريط</span>}
            </button>
          </div>
        </aside>

        {/* Main content — full-width app container */}
        <main className="flex-1 min-w-0">
          <div className="w-full p-4 md:p-6 pb-28 lg:pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-panel border-t border-border backdrop-blur-md">
        <div className="grid grid-cols-6 h-16">
          {MOBILE_PRIMARY.map(id => {
            const tab = TABS[id];
            const Icon = tab.icon;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${isActive ? 'text-accent' : 'text-text-faint'}`}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.9} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          {/* More */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`relative w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${isMoreOpen ? 'text-accent' : 'text-text-faint'}`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>المزيد</span>
            </button>
            {isMoreOpen && (
              <div className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl card p-2 z-50 space-y-1 max-h-[60vh] overflow-y-auto">
                <div className="p-2 text-xs font-bold text-text-faint flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  جميع الأدوات
                </div>
                {Object.keys(TABS)
                  .filter(id => !(id === 'admin' && !isAdmin) && !MOBILE_PRIMARY.includes(id))
                  .map(id => {
                    const tab = TABS[id];
                    const Icon = tab.icon;
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => { setActiveTab(id); setIsMoreOpen(false); }}
                        className={`w-full text-right p-2.5 rounded-xl transition flex items-center gap-2.5 text-xs font-bold cursor-pointer ${isActive ? 'bg-accent-soft text-accent' : 'text-text hover:bg-card-hover'}`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 1.9} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                <button
                  onClick={() => { setIsMoreOpen(false); onOpenAuth(); }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-card-hover transition flex items-center gap-2.5 text-text text-xs font-bold cursor-pointer"
                >
                  <CircleUserRound className="w-4 h-4 text-sky-500" />
                  <span>الحساب والتفاصيل</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}