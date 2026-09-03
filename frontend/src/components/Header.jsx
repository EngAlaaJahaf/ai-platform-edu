import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  BrainCircuit, 
  CheckCheck, 
  LayoutDashboard, 
  Upload, 
  KeyRound, 
  User, 
  Crown, 
  Wand2, 
  Sun, 
  Moon,
  Settings,
  ChevronDown,
  FileCheck2,
  Sliders,
  ShieldCheck,
  Plus,
  FolderOpen,
  SlidersHorizontal,
  Languages,
  Clock,
  Flame,
  MoreHorizontal,
  GraduationCap,
  Menu,
  X
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const settingsRef = useRef(null);
  const moreToolsRef = useRef(null);

  const hasCustomKey = Boolean(getApiKey());
  const provider = getAIProvider();
  const model = getSelectedModel();

  // Primary 4 Core Study Tabs
  const primaryTabs = [
    { id: 'chat', label: 'المحادثة الذكية', shortLabel: 'المحادثة', icon: MessageSquareText, color: 'from-blue-500 to-indigo-600' },
    { id: 'summary', label: 'التلخيص والخريطة', shortLabel: 'التلخيص', icon: FileText, color: 'from-purple-500 to-indigo-600' },
    { id: 'quiz', label: 'استوديو الاختبارات', shortLabel: 'الاختبارات', icon: BrainCircuit, color: 'from-emerald-500 to-teal-600' },
    { id: 'translate', label: 'ترجمة المقررات', shortLabel: 'الترجمة', icon: Languages, color: 'from-cyan-500 to-blue-600' },
  ];

  // Secondary Tools (Inside "More" Dropdown)
  const secondaryTabs = [
    { id: 'proofread', label: 'التدقيق الأكاديمي واللغوي', icon: CheckCheck, desc: 'تحسين الصياغة وتصحيح الأخطاء' },
    { id: 'dashboard', label: 'لوحة الإحصائيات الأكاديمية', icon: LayoutDashboard, desc: 'سجل الإنجاز والتقدم' },
    { id: 'subscription', label: 'خطة الاشتراك ومزايا Pro', icon: Crown, desc: 'ترقية الحساب والحدود' },
  ];

  const providerLabels = {
    gemini: 'Google Gemini',
    ollama: 'Ollama محلي',
    deepseek: 'DeepSeek AI',
    groq: 'Groq Cloud',
    openai: 'OpenAI / Proxy'
  };

  // Student Study Session Live Timer (Gamification / Engagement)
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setStudySeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatStudyTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target)) {
        setIsMoreToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);
  const isAdmin = user && user.role === 'admin';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl px-3 lg:px-6 py-2 transition-colors duration-200 theme-header border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        
        {/* Left: Modern Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer group select-none" 
            onClick={() => setActiveTab('dashboard')}
            title="الرئيسية"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/25 border border-white/25 group-hover:scale-105 transition-all">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-sm tracking-tight font-['IBM_Plex_Sans_Arabic'] theme-text-primary">
                  ذكاء <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">EduAI</span>
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  PRO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Clean Floating Studio Navigation (4 Core Study Pillars) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl theme-nav border shadow-sm">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 scale-[1.02]'
                    : 'theme-text-secondary hover:bg-slate-500/10 hover:theme-text-primary'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'theme-text-muted'}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}

          {/* Secondary Tools Dropdown ("المزيد ▾") */}
          <div className="relative" ref={moreToolsRef}>
            <button
              onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isSecondaryActive
                  ? 'bg-indigo-600/20 text-indigo-600 dark:text-cyan-300 border border-indigo-500/30'
                  : 'theme-text-secondary hover:bg-slate-500/10'
              }`}
              title="أدوات إضافية"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">المزيد</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMoreToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreToolsOpen && (
              <div className="absolute left-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-50 border theme-nav text-xs font-bold space-y-1 animate-fade-in">
                <div className="px-2.5 py-1 text-[10px] theme-text-muted font-bold">أدوات دراسية إضافية</div>
                {secondaryTabs.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMoreToolsOpen(false);
                      }}
                      className={`w-full text-right p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                        isItemActive
                          ? 'bg-indigo-600 text-white'
                          : 'theme-text-primary hover:bg-indigo-600/15'
                      }`}
                    >
                      <ItemIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isItemActive ? 'text-white' : 'text-indigo-500'}`} />
                      <div>
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className={`text-[10px] font-normal ${isItemActive ? 'text-indigo-100' : 'theme-text-muted'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right: Study Session HUD & Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Study Session Focus Timer Pill */}
          <div 
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl theme-card-inner border text-xs font-bold cursor-pointer hover:border-amber-400/50 transition select-none"
            title={isTimerRunning ? "انقر لإيقاف مؤقت التركيز مؤقتاً" : "انقر لاستئناف مؤقت التركيز"}
          >
            <Flame className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-mono text-xs font-black theme-text-primary">{formatStudyTime(studySeconds)}</span>
            <span className="text-[10px] theme-text-muted font-normal">تركيز</span>
          </div>

          {/* Document Library Button */}
          <button
            onClick={onOpenDocumentLibrary}
            className="p-2 rounded-xl theme-header-btn border transition hidden md:flex items-center justify-center hover:border-cyan-500"
            title="مكتبة المستندات والمقررات المحفوظة"
          >
            <FolderOpen className="w-4 h-4 text-cyan-500" />
          </button>

          {/* Admin Dashboard Button - ONLY VISIBLE IF ADMIN */}
          {isAdmin && (
            <button
              onClick={onOpenAdminDashboard}
              className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-500 transition hidden md:flex items-center justify-center relative hover:scale-105 shadow-sm"
              title="لوحة تحكم الإدارة الشاملة (Admin Mode Active)"
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            </button>
          )}

          {/* Prominent Theme Toggle Button (☀️ / 🌙) */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl theme-card-inner border hover:border-amber-400/60 dark:hover:border-indigo-400/60 transition shadow-sm select-none"
            title={theme === 'dark' ? 'التبديل إلى الوضع النهاري ☀️' : 'التبديل إلى الوضع الليلي 🌙'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
              </>
            )}
          </button>

          {/* Unified Settings & Tools Dropdown Menu */}
          <div className="relative hidden md:block" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-xl theme-header-btn border transition flex items-center gap-1"
              title="الإعدادات وحساب المستخدم"
            >
              <Settings className="w-4 h-4 theme-text-primary" />
              <ChevronDown className={`w-3 h-3 theme-text-muted transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Box */}
            {isSettingsOpen && (
              <div className="absolute left-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-50 border theme-nav text-xs font-bold space-y-1 animate-fade-in">
                
                {/* Active Provider & Model Status Header */}
                <div className="p-2.5 rounded-xl theme-card-inner mb-1 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] theme-text-muted block">محرك الذكاء الاصطناعي النشط</span>
                    <span className="theme-text-primary font-bold text-xs">{providerLabels[provider] || provider}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                {/* Admin Mode Item (Visible strictly only for Admin accounts) */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenAdminDashboard();
                    }}
                    className="w-full text-right p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 hover:bg-amber-500/25 border border-amber-500/30 transition flex items-center justify-between text-amber-600 dark:text-amber-300 font-black"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                      <span>لوحة التحكم الشاملة للإدارة</span>
                    </div>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">Admin</span>
                  </button>
                )}

                {/* Theme Mode Selector in Menu */}
                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-amber-500/10 transition flex items-center justify-between theme-text-primary"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    <span>نمط العرض (المظهر)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold">
                    {theme === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️'}
                  </span>
                </button>

                {/* AI Models & Keys Config */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onOpenApiKey();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-indigo-600/15 transition flex items-center justify-between theme-text-primary"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>إعدادات المفاتيح والنماذج</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold max-w-[90px] truncate border border-indigo-200 dark:border-indigo-800/60">
                    {model?.split(':')[0] || 'Default'}
                  </span>
                </button>

                {/* Prompt Bank */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onOpenPromptManager();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-indigo-600/15 transition flex items-center justify-between theme-text-primary"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-cyan-500" />
                    <span>بنك البرومبتات التعليمية</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </button>

                <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

                {/* User Account / Profile */}
                <div className="pt-1">
                  {user ? (
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full text-right p-2.5 rounded-xl theme-card-inner hover:bg-white/10 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-6 h-6 rounded-full border border-indigo-400 object-cover"
                        />
                        <div className="text-right">
                          <span className="text-xs font-bold block max-w-[120px] truncate theme-text-primary">{user.name}</span>
                          <span className="text-[10px] text-emerald-400 font-bold block">{user.email}</span>
                        </div>
                      </div>
                      <Sliders className="w-3.5 h-3.5 theme-text-muted" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <User className="w-3.5 h-3.5 text-white" />
                      <span>تسجيل الدخول / إنشاء حساب</span>
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl theme-header-btn border transition flex md:hidden items-center justify-center hover:border-indigo-500 cursor-pointer"
            title="القائمة الرئيسية"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md md:hidden flex justify-start" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-72 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-l border-indigo-500/20 p-5 space-y-4 overflow-y-auto h-full flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="space-y-4">
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center">
                    <GraduationCap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="font-black text-sm text-white">ذكاء EduAI</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active AI Status header */}
              <div className="p-2.5 rounded-xl theme-card-inner flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] theme-text-muted block">محرك الذكاء الاصطناعي</span>
                  <span className="theme-text-primary font-bold">{providerLabels[provider] || provider}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>

              {/* Nav Links List */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] theme-text-muted font-bold">أدوات الدراسة الأساسية</div>
                {primaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-right p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                          : 'theme-text-primary hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-indigo-500'}`} />
                      <span className="text-xs font-bold">{tab.label}</span>
                    </button>
                  );
                })}

                <div className="border-t border-white/10 my-2"></div>
                <div className="px-2 py-1 text-[10px] theme-text-muted font-bold">أدوات إضافية</div>
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-right p-2.5 rounded-xl transition flex items-center gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                          : 'theme-text-primary hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-indigo-500'}`} />
                      <span className="text-xs font-bold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/10 my-2"></div>
              <div className="px-2 py-1 text-[10px] theme-text-muted font-bold">الإعدادات العامة</div>

              {/* Quick settings controls inside drawer */}
              <div className="space-y-1.5 text-xs">
                
                {/* Theme switch */}
                <button
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    <span>نمط العرض</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 theme-text-secondary">
                    {theme === 'dark' ? 'ليلي' : 'نهاري'}
                  </span>
                </button>

                {/* API settings */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenApiKey();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>إعدادات المفاتيح والنماذج</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 theme-text-secondary font-mono truncate max-w-[80px]">
                    {model?.split(':')[0] || 'Default'}
                  </span>
                </button>

                {/* Prompt bank */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenPromptManager();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-cyan-500" />
                    <span>بنك البرومبتات</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </button>

                {/* Document Library Link */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenDocumentLibrary();
                  }}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-white/5 transition flex items-center justify-between theme-text-primary cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-cyan-500" />
                    <span>مكتبة المستندات</span>
                  </div>
                </button>

                {/* Admin Dashboard if applicable */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAdminDashboard();
                    }}
                    className="w-full text-right p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition flex items-center justify-between text-amber-400 font-bold cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                      <span>لوحة تحكم الإدارة</span>
                    </div>
                    <span className="text-[9px] bg-amber-500 text-slate-900 px-1 rounded">Admin</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-t border-white/10 my-2"></div>

              {/* User Account / Profile bottom card */}
              <div className="pt-2">
                {user ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-right p-2 rounded-xl theme-card-inner flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-6 h-6 rounded-full border border-indigo-400 object-cover"
                      />
                      <div className="text-right">
                        <span className="text-[11px] font-bold block max-w-[120px] truncate theme-text-primary">{user.name}</span>
                        <span className="text-[9px] text-emerald-400 block max-w-[120px] truncate">{user.email}</span>
                      </div>
                    </div>
                    <Sliders className="w-3 h-3 theme-text-muted" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>تسجيل الدخول / إنشاء حساب</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
