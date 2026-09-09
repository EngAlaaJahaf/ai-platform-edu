import React, { useState, useEffect } from 'react';
import AppShell from './components/AppShell';
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
import TermsView from './components/TermsView';
import AuthGateView from './components/AuthGateView';
import PresentationView from './components/PresentationView';
import TeamWorkspaceView from './components/TeamWorkspaceView';
import { checkHealth, getUserProfile, getLatestDocument, fetchPublicSettings, setGoogleClientId } from './services/api';
import { ShieldAlert } from 'lucide-react';

const VALID_TABS = [
  'dashboard', 
  'documents', 
  'presentations',
  'teams',
  'translate',
  'terms', 
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

  // Keep-alive: render the active tab + the last 3 visited (never all 12)
  const [visitedTabs, setVisitedTabs] = useState([getTabFromUrl()]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptCategory, setPromptCategory] = useState('quiz');
  
  // Theme state: 'dark' or 'light' (default detected in index.html)
  const [theme, setTheme] = useState(() => localStorage.getItem('eduai_theme') || 'dark');

  const [health, setHealth] = useState({ has_gemini: false, status: 'ok' });
  const [user, setUser] = useState(getUserProfile);

  const [activeDoc, setActiveDoc] = useState(null);

  const [activeQuizPrompt, setActiveQuizPrompt] = useState(null);
  const [activeSummaryPrompt, setActiveSummaryPrompt] = useState(null);
  const [activeChatPrompt, setActiveChatPrompt] = useState(null);
  const [activeTranslatePrompt, setActiveTranslatePrompt] = useState(null);
  const [activeTermsPrompt, setActiveTermsPrompt] = useState(null);
  const [activeProofreadPrompt, setActiveProofreadPrompt] = useState(null);

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
    fetchPublicSettings().then(ps => {
      if (ps && ps.google_client_id) {
        setGoogleClientId(ps.google_client_id);
      }
    }).catch(()=>{});

    const handlePopState = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTabState(tabFromUrl);
      setVisitedTabs(prev => {
        const next = prev.filter(t => t !== tabFromUrl && VALID_TABS.includes(t));
        next.push(tabFromUrl);
        return next.slice(-4);
      });
      localStorage.setItem('eduai_active_tab', tabFromUrl);
    };

    window.addEventListener('popstate', handlePopState);
    updateBrowserUrl(activeTab);

    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setVisitedTabs(prev => {
      const next = prev.filter(t => t !== activeTab && VALID_TABS.includes(t));
      next.push(activeTab);
      return next.slice(-4);
    });
  }, [activeTab]);

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
      } catch {
        setActiveDoc(null);
      }
    } else {
      setActiveDoc(null);
    }
  }, [user?.id]);

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
    const value = systemPrompt ? { prompt: systemPrompt, title } : null;
    if (promptCategory === 'quiz') {
      setActiveQuizPrompt(value);
    } else if (promptCategory === 'summary') {
      setActiveSummaryPrompt(value);
    } else if (promptCategory === 'chat') {
      setActiveChatPrompt(value);
    } else if (promptCategory === 'translate') {
      setActiveTranslatePrompt(value);
    } else if (promptCategory === 'terms') {
      setActiveTermsPrompt(value);
    } else if (promptCategory === 'proofread') {
      setActiveProofreadPrompt(value);
    }
  };

  const activePromptForCategory =
    promptCategory === 'quiz' ? activeQuizPrompt
    : promptCategory === 'summary' ? activeSummaryPrompt
    : promptCategory === 'chat' ? activeChatPrompt
    : promptCategory === 'translate' ? activeTranslatePrompt
    : promptCategory === 'terms' ? activeTermsPrompt
    : promptCategory === 'proofread' ? activeProofreadPrompt
    : null;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <AuthGateView
          onAuthSuccess={(authenticatedUser) => {
            setUser(authenticatedUser);
          }}
        />
      </div>
    );
  }

  const tabKeep = (id) => visitedTabs.includes(id);

  return (
    <>
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onCloseActiveDoc={() => setActiveDoc(null)}
        activeDoc={activeDoc}
        user={user}
        health={health}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenPromptManager={() => handleOpenPromptForCategory('quiz')}
        onOpenAuth={() => setIsAuthOpen(true)}
      >

        {/* Dashboard */}
        <div className={tabKeep('dashboard') ? (activeTab === 'dashboard' ? 'contents' : 'hidden') : 'hidden'}>
          <DashboardView
            onSelectTab={setActiveTab}
            onOpenUpload={() => setIsUploadOpen(true)}
            activeDoc={activeDoc}
          />
        </div>

        {/* Document Library */}
        <div className={tabKeep('documents') ? (activeTab === 'documents' ? 'contents' : 'hidden') : 'hidden'}>
          <DocumentLibraryView
            activeDoc={activeDoc}
            onSelectDoc={(doc) => {
              setActiveDoc(doc);
            }}
            onOpenUpload={() => setIsUploadOpen(true)}
            onNavigateToTab={setActiveTab}
          />
        </div>

        {/* Presentation Generator */}
        <div className={tabKeep('presentations') ? (activeTab === 'presentations' ? 'contents' : 'hidden') : 'hidden'}>
          <PresentationView
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Team Collaboration */}
        <div className={tabKeep('teams') ? (activeTab === 'teams' ? 'contents' : 'hidden') : 'hidden'}>
          <TeamWorkspaceView />
        </div>

        {/* Translation */}
        <div className={tabKeep('translate') ? (activeTab === 'translate' ? 'contents' : 'hidden') : 'hidden'}>
          <TranslateView
            activeDoc={activeDoc}
            activePrompt={activeTranslatePrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('translate')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Academic Terms Glossary */}
        <div className={tabKeep('terms') ? (activeTab === 'terms' ? 'contents' : 'hidden') : 'hidden'}>
          <TermsView
            activeDoc={activeDoc}
            activePrompt={activeTermsPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('terms')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Admin Dashboard */}
        <div className={tabKeep('admin') ? (activeTab === 'admin' ? 'contents' : 'hidden') : 'hidden'}>
          {user && user.role === 'admin' ? (
            <AdminDashboardView
              onBackToApp={() => setActiveTab('dashboard')}
              onNavigateToTab={setActiveTab}
            />
          ) : (
            <div className="rounded-3xl p-8 max-w-md mx-auto text-center space-y-4 my-12">
              <div className="w-16 h-16 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="font-head text-xl font-bold text-text-strong">لوحة الإدارة مقفلة (Admin Only)</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                هذه المنطقة مخصصة لإدارة خوادم الذكاء الاصطناعي والإحصائيات وتتطلب تسجيل الدخول بصلاحيات مدير النظام.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="btn-primary text-sm"
                >
                  تسجيل الدخول كمدير
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="btn-ghost"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className={tabKeep('chat') ? (activeTab === 'chat' ? 'contents' : 'hidden') : 'hidden'}>
          <ChatView
            activeDoc={activeDoc}
            activePrompt={activeChatPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('chat')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onCloseActiveDoc={() => setActiveDoc(null)}
          />
        </div>

        {/* Summary */}
        <div className={tabKeep('summary') ? (activeTab === 'summary' ? 'contents' : 'hidden') : 'hidden'}>
          <SummaryView
            activeDoc={activeDoc}
            activePrompt={activeSummaryPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('summary')}
            onSwitchToQuiz={() => setActiveTab('quiz')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Quiz */}
        <div className={tabKeep('quiz') ? (activeTab === 'quiz' ? 'contents' : 'hidden') : 'hidden'}>
          <QuizView
            activeDoc={activeDoc}
            activePrompt={activeQuizPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('quiz')}
            onSwitchToChat={() => setActiveTab('chat')}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenApiKey={() => setIsApiKeyOpen(true)}
          />
        </div>

        {/* Proofreader */}
        <div className={tabKeep('proofread') ? (activeTab === 'proofread' ? 'contents' : 'hidden') : 'hidden'}>
          <ProofreadView
            onOpenApiKey={() => setIsApiKeyOpen(true)}
            activePrompt={activeProofreadPrompt}
            onOpenPromptManager={() => handleOpenPromptForCategory('proofread')}
          />
        </div>

        {/* Subscription */}
        <div className={tabKeep('subscription') ? (activeTab === 'subscription' ? 'contents' : 'hidden') : 'hidden'}>
          <SubscriptionView
            user={user}
            onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
            onOpenAuthModal={() => setIsAuthOpen(true)}
          />
        </div>

      </AppShell>

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
        initialCategory={promptCategory}
        activePrompt={activePromptForCategory}
        onSelectPrompt={handleSelectPrompt}
      />
    </>
  );
}