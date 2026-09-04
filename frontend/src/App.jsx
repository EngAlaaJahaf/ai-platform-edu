import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatView from './components/ChatView';
import SummaryView from './components/SummaryView';
import QuizView from './components/QuizView';
import ProofreadView from './components/ProofreadView';
import DashboardView from './components/DashboardView';
import SubscriptionView from './components/SubscriptionView';
import FileUploadModal from './components/FileUploadModal';
import ApiKeyModal from './components/ApiKeyModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import PromptManagerModal from './components/PromptManagerModal';
import DocumentLibraryView from './components/DocumentLibraryView';
import AdminDashboardView from './components/AdminDashboardView';
import TranslateView from './components/TranslateView';
import DocumentFAB from './components/DocumentFAB';
import AuthGateView from './components/AuthGateView';
import { checkHealth, getUserProfile, getLatestDocument, fetchPublicSettings, setGoogleClientId } from './services/api';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

const VALID_TABS = [
  'dashboard', 
  'documents', 
  'translate', 
  'chat', 
  'summary', 
  'quiz', 
  'proofread', 
  'admin', 
  'subscription'
];

function getTabFromUrl() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (VALID_TABS.includes(path)) {
    return path;
  }
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (VALID_TABS.includes(hash)) {
    return hash;
  }
  return localStorage.getItem('eduai_active_tab') || 'dashboard';
}

function updateBrowserUrl(tab) {
  const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const targetPath = tab === 'dashboard' ? '/' : `/${tab}`;
  const targetCheck = tab === 'dashboard' ? '' : tab;
  if (currentPath !== targetCheck) {
    window.history.pushState({ tab }, '', targetPath);
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(getTabFromUrl);

  const setActiveTab = (tab, pushHistory = true) => {
    if (!VALID_TABS.includes(tab)) return;
    setActiveTabState(tab);
    localStorage.setItem('eduai_active_tab', tab);
    if (pushHistory) {
      updateBrowserUrl(tab);
    }
  };

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptCategory, setPromptCategory] = useState('quiz');
  
  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('eduai_theme') || 'dark');

  const [health, setHealth] = useState({ has_gemini: false, status: 'ok' });
  // User state
  const [user, setUser] = useState(getUserProfile);

  // Persistent activeDoc strictly scoped per user
  const [activeDoc, setActiveDoc] = useState(null);

  // Active prompt overrides per tool
  const [activeQuizPrompt, setActiveQuizPrompt] = useState(null);
  const [activeSummaryPrompt, setActiveSummaryPrompt] = useState(null);
  const [activeChatPrompt, setActiveChatPrompt] = useState(null);
  const [activeTranslatePrompt, setActiveTranslatePrompt] = useState(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(nextTheme);
    localStorage.setItem('eduai_theme', nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    checkHealth().then(data => {
      if (data) setHealth(data);
    });
    // Sync Google Client ID from server (admin-set)
    fetchPublicSettings().then(ps => {
      if (ps && ps.google_client_id) {
        setGoogleClientId(ps.google_client_id);
      }
    }).catch(()=>{});

    // Sync active tab with browser URL history (Back / Forward buttons)
    const handlePopState = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
      localStorage.setItem('eduai_active_tab', tabFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    updateBrowserUrl(activeTab);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch or restore document strictly belonging to this authenticated user
  useEffect(() => {
    if (user && user.id) {
      try {
        const saved = localStorage.getItem(`eduai_active_doc_${user.id}`);
        if (saved) {
          setActiveDoc(JSON.parse(saved));
        } else {
          getLatestDocument().then(doc => {
            setActiveDoc(doc || null);
          });
        }
      } catch (e) {
        setActiveDoc(null);
      }
    } else {
      setActiveDoc(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('eduai_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user && user.id) {
      if (activeDoc) {
        localStorage.setItem(`eduai_active_doc_${user.id}`, JSON.stringify(activeDoc));
      } else {
        localStorage.removeItem(`eduai_active_doc_${user.id}`);
      }
    }
  }, [activeDoc, user?.id]);

  const handleUploadSuccess = (uploadedDoc) => {
    setActiveDoc(uploadedDoc);
    // Keep user in their current active section
  };

  const handleKeyUpdated = () => {
    checkHealth().then(data => {
      if (data) setHealth(data);
    });
  };

  const handleOpenPromptForCategory = (cat) => {
    setPromptCategory(cat);
    setIsPromptOpen(true);
  };

  const handleSelectPrompt = (systemPrompt, title) => {
    if (promptCategory === 'quiz') {
      setActiveQuizPrompt({ prompt: systemPrompt, title });
    } else if (promptCategory === 'summary') {
      setActiveSummaryPrompt({ prompt: systemPrompt, title });
    } else if (promptCategory === 'chat') {
      setActiveChatPrompt({ prompt: systemPrompt, title });
    } else if (promptCategory === 'translate') {
      setActiveTranslatePrompt({ prompt: systemPrompt, title });
    }
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${theme}`}>
        <AuthGateView
          onAuthSuccess={(authenticatedUser) => {
            setUser(authenticatedUser);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${theme}`}>
      
      {/* Background Visual Mesh */}
      <div className="glow-mesh"></div>
      <div className="grid-bg"></div>

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDocumentLibrary={() => setActiveTab('documents')}
        onOpenAdminDashboard={() => setActiveTab('admin')}
        activeDoc={activeDoc}
        health={health}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenPromptManager={() => handleOpenPromptForCategory('quiz')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Workspace */}
      {/* Main Content Workspace - Keep-Alive Architecture across all sections */}
      <main className={`flex-1 w-full mx-auto ${activeTab === 'chat' || activeTab === 'translate' ? 'max-w-[1600px] p-2 md:p-4' : 'max-w-7xl p-4 md:p-8'}`}>
        
        {/* Dashboard Workspace */}
        <div className={activeTab === 'dashboard' ? 'contents' : 'hidden'}>
          <DashboardView
            onSelectTab={setActiveTab}
            onOpenUpload={() => setIsUploadOpen(true)}
            activeDoc={activeDoc}
          />
        </div>

        {/* Document Library Workspace */}
        <div className={activeTab === 'documents' ? 'contents' : 'hidden'}>
          <DocumentLibraryView
            activeDoc={activeDoc}
            onSelectDoc={(doc) => {
              setActiveDoc(doc);
              if (user && user.id) {
                if (doc) {
                  localStorage.setItem(`eduai_active_doc_${user.id}`, JSON.stringify(doc));
                } else {
                  localStorage.removeItem(`eduai_active_doc_${user.id}`);
                }
              }
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onNavigateToTab={setActiveTab}
          />
        </div>

        {/* Academic Translation Workspace */}
        <div className={activeTab === 'translate' ? 'contents' : 'hidden'}>
          <TranslateView
            activeDoc={activeDoc}
            activePrompt={activeTranslatePrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('translate')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Admin Dashboard Workspace */}
        <div className={activeTab === 'admin' ? 'contents' : 'hidden'}>
          {user && user.role === 'admin' ? (
            <AdminDashboardView
              onBackToApp={() => setActiveTab('dashboard')}
              onNavigateToTab={setActiveTab}
            />
          ) : (
            <div className="glass-panel rounded-3xl p-8 max-w-md mx-auto text-center space-y-4 my-12 border shadow-2xl animate-fade-in font-['Tajawal']">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black theme-text-primary">لوحة الإدارة مقفلة (Admin Only)</h3>
              <p className="text-xs theme-text-secondary leading-relaxed">
                هذه المنطقة مخصصة لإدارة خوادم الذكاء الاصطناعي والإحصائيات وتتطلب تسجيل الدخول بصلاحيات مدير النظام.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition"
                >
                  تسجيل الدخول كمدير
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2.5 rounded-xl theme-card-inner border text-xs font-bold theme-text-secondary hover:theme-text-primary transition"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Chat Workspace */}
        <div className={activeTab === 'chat' ? 'contents' : 'hidden'}>
          <ChatView
            activeDoc={activeDoc}
            activePrompt={activeChatPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('chat')}
            onSwitchToQuiz={() => setActiveTab('quiz')}
            onSwitchToSummary={() => setActiveTab('summary')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* AI Summary & Mindmap Workspace */}
        <div className={activeTab === 'summary' ? 'contents' : 'hidden'}>
          <SummaryView
            activeDoc={activeDoc}
            activePrompt={activeSummaryPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('summary')}
            onSwitchToQuiz={() => setActiveTab('quiz')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Question Bank & Interactive Exam Workspace */}
        <div className={activeTab === 'quiz' ? 'contents' : 'hidden'}>
          <QuizView
            activeDoc={activeDoc}
            activePrompt={activeQuizPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('quiz')}
            onSwitchToChat={() => setActiveTab('chat')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Academic Proofreader Workspace */}
        <div className={activeTab === 'proofread' ? 'contents' : 'hidden'}>
          <ProofreadView 
            onOpenApiKey={() => setIsApiKeyOpen(true)}
            onOpenPromptManager={() => handleOpenPromptForCategory('proofread')}
          />
        </div>

        {/* Subscription & Plans Workspace */}
        <div className={activeTab === 'subscription' ? 'contents' : 'hidden'}>
          <SubscriptionView
            user={user}
            onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
            onOpenAuthModal={() => setIsAuthOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onKeyUpdated={handleKeyUpdated}
      />

      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onUserUpdated={setUser}
      />

      <PromptManagerModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        activeCategory={promptCategory}
        onSelectPrompt={handleSelectPrompt}
      />

    </div>
  );
}
