import React, { useState, useRef, useEffect } from 'react';
import { 
  Languages, 
  BrainCircuit, 
  MessageSquareText, 
  FileText, 
  LayoutDashboard, 
  CheckCheck, 
  Crown, 
  Upload, 
  User, 
  Wand2, 
  Sun, 
  Moon, 
  Settings, 
  ChevronDown, 
  FolderOpen, 
  MoreHorizontal, 
  GraduationCap, 
  Menu, 
  X, 
  BookOpen, 
  ShieldAlert 
} from 'lucide-react';
import { getApiKey, getAIProvider, getSelectedModel } from '../services/api';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  onOpenUpload, 
  onOpenDocumentLibrary, 
  onOpenAdminDashboard, 
  activeDoc, 
  health, 
  user, 
  onOpenAuth, 
  onOpenApiKey, 
  onOpenPromptManager, 
  theme, 
  onToggleTheme 
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const moreToolsRef = useRef(null);
  const docRef = useRef(null);

  const provider = getAIProvider();
  const model = getSelectedModel();

  // Primary 4 Core Study Tabs
  const primaryTabs = [
    { id: 'translate', label: 'ترجمة المقررات (Canva)', icon: Languages },
    { id: 'quiz', label: 'استوديو الاختبارات', icon: BrainCircuit },
    { id: 'chat', label: 'المحادثة الذكية', icon: MessageSquareText },
    { id: 'summary', label: 'التلخيص والخريطة', icon: FileText }
  ];

  // Secondary Tools
  const secondaryTabs = [
    { id: 'dashboard', label: 'لوحة الإحصائيات الأكاديمية', icon: LayoutDashboard },
    { id: 'proofread', label: 'التدقيق الأكاديمي واللغوي', icon: CheckCheck },
    { id: 'subscription', label: 'خطة الاشتراك ومزايا Pro', icon: Crown }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target)) {
        setIsMoreToolsOpen(false);
      }
      if (docRef.current && !docRef.current.contains(event.target)) {
        setIsDocDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);
  const isAdmin = user && user.role === 'admin';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl px-4 lg:px-6 h-16 transition-colors duration-200 theme-header border-b flex items-center justify-between">
      
      {/* 1. RIGHT: Brand Logo & Active Course Capsule */}
      <div className="flex items-center gap-3 md:gap-5">
        
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-right transition hover:opacity-90 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <span className="font-['IBM_Plex_Sans_Arabic'] font-extrabold text-base theme-text-primary block leading-tight">
              ذكاء | EduAI
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
              المنصة الأكاديمية الذكية
            </span>
          </div>
        </button>

        {/* Active Course Capsule & Selector */}
        <div className="relative" ref={docRef}>
          <button
            onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary hover:border-emerald-500/50 transition cursor-pointer max-w-[220px] md:max-w-[320px]"
            title="انقر لإدارة أو تغيير المقرر الدراسي الحالي"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
            <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              {activeDoc ? activeDoc.filename : 'لم يتم اختيار مقرر'}
            </span>
            {activeDoc && (
              <span className="text-[11px] px-1.5 py-0.2 rounded theme-header-btn border shrink-0 opacity-75">
                {activeDoc.pages_count || 1} ص
              </span>
            )}
            <ChevronDown className={`w-3 h-3 theme-text-muted transition-transform ${isDocDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Course Actions Dropdown */}
          {isDocDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 glass-panel rounded-2xl p-2 shadow-2xl border theme-nav text-xs font-bold space-y-1.5 z-50 animate-fade-in">
              <div className="p-2 rounded-xl theme-card-inner border">
                <span className="text-xs theme-text-muted block">المقرر الدراسي الحالي</span>
                <span className="theme-text-primary font-bold text-sm truncate block mt-0.5">
                  {activeDoc ? activeDoc.filename : 'لا يوجد مقرر محدد'}
                </span>
              </div>

              <button
                onClick={() => {
                  setIsDocDropdownOpen(false);
                  onOpenUpload();
                }}
                className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-between shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>رفع مقرر / مادة جديدة</span>
                </div>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">PDF / DOCX</span>
              </button>

              <button
                onClick={() => {
                  setIsDocDropdownOpen(false);
                  onOpenDocumentLibrary();
                }}
                className="w-full p-2.5 rounded-xl theme-card-inner hover:bg-white/10 transition flex items-center justify-between theme-text-primary cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-500" />
                  <span>استعراض مكتبة المقررات</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 theme-text-muted -rotate-90" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. CENTER: Clean Segmented Navigation Switcher (Desktop) */}
      <nav className="hidden md:flex items-center gap-1.5 theme-card-inner border p-1 rounded-2xl">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                isActive 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm' 
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* More Tools Dropdown */}
        <div className="relative" ref={moreToolsRef}>
          <button
            onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              isSecondaryActive ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'theme-text-muted hover:theme-text-primary'
            }`}
            title="المزيد من الأدوات"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMoreToolsOpen && (
            <div className="absolute left-0 mt-2 w-60 glass-panel rounded-2xl p-2 shadow-2xl border theme-nav text-xs font-bold space-y-1 z-50 animate-fade-in">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isCur = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMoreToolsOpen(false);
                    }}
                    className={`w-full text-right p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                      isCur ? 'bg-emerald-600 text-white font-black' : 'theme-card-inner hover:bg-white/10 theme-text-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* 3. LEFT: Actions & User Menu */}
      <div className="flex items-center gap-2">
        
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl theme-header-btn border text-xs font-bold transition cursor-pointer hover:border-emerald-500/40"
          title="تبديل الثيم (داكن / فاتح)"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* AI Provider & Models Settings Button */}
        <button
          onClick={onOpenApiKey}
          className="p-2 rounded-xl theme-header-btn border text-xs font-bold transition cursor-pointer hover:border-emerald-500/40"
          title="إعدادات نماذج الذكاء الاصطناعي والمزودات"
        >
          <Settings className="w-4 h-4 theme-text-muted hover:theme-text-primary" />
        </button>

        {/* Prompt Bank Button */}
        <button
          onClick={onOpenPromptManager}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-header-btn border text-xs font-bold hover:border-emerald-500/40 transition cursor-pointer"
          title="بنك البرومبتات والقوالب"
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>البرومبتات</span>
        </button>

        {/* User Profile Capsule Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl theme-card-inner border text-xs font-bold theme-text-primary hover:border-emerald-500/50 transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'ط'}
            </div>
            <span className="hidden sm:inline font-bold truncate max-w-[100px]">
              {user?.name || 'طالب جامعي'}
            </span>
            <ChevronDown className="w-3 h-3 theme-text-muted" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl border theme-nav text-xs font-bold space-y-1.5 z-50 animate-fade-in">
              <div className="p-2.5 rounded-xl theme-card-inner border">
                <span className="text-xs theme-text-muted block">{user?.email || 'طالب جامعي'}</span>
                <span className="text-sm font-bold theme-text-primary block mt-0.5">{user?.name || 'حساب مفعل'}</span>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <span>الرصيد: {user?.tokens_used || 0} توكن</span>
                  <span>{user?.tier || 'Pro Academic'}</span>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="w-full text-right p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition flex items-center gap-2 border border-amber-500/20 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>لوحة تحكم المدير (Admin Dashboard)</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setActiveTab('dashboard');
                }}
                className="w-full text-right p-2 rounded-xl theme-card-inner hover:bg-white/10 transition flex items-center gap-2 theme-text-primary cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                <span>لوحة الإحصائيات الأكاديمية</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full text-right p-2 rounded-xl theme-card-inner hover:bg-white/10 transition flex items-center gap-2 theme-text-primary cursor-pointer"
              >
                <User className="w-4 h-4 text-cyan-500" />
                <span>إدارة الحساب وتسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl theme-header-btn border text-xs cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 glass-panel border-b p-4 space-y-2 z-50 theme-nav animate-fade-in text-sm font-bold shadow-2xl">
          {[...primaryTabs, ...secondaryTabs].map((tab) => {
            const Icon = tab.icon;
            const isCur = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-right p-3 rounded-xl transition flex items-center gap-3 cursor-pointer ${
                  isCur ? 'bg-emerald-600 text-white font-black' : 'theme-card-inner theme-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

    </header>
  );
}
