import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  BarChart3, 
  FolderKanban, 
  Cpu, 
  Wand2, 
  ShieldAlert, 
  History, 
  RefreshCw, 
  Check, 
  Save, 
  Trash2, 
  KeyRound, 
  Database, 
  Sliders, 
  FileText, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Server,
  Zap,
  Lock,
  Globe,
  Plus,
  Search,
  ChevronDown,
  Sparkles,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { 
  fetchAdminStats, 
  fetchAdminSettings, 
  saveAdminSettings, 
  fetchAdminLogs, 
  clearAdminCache,
  fetchDocuments,
  deleteDocument,
  validateApiKey,
  fetchAvailableModels,
  fetchPrompts,
  saveCustomPrompt,
  deleteCustomPrompt,
  generatePromptWithAI
} from '../services/api';

export default function AdminDashboardModal({ 
  isOpen, 
  onClose,
  onReloadDocuments
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'files', 'ai', 'prompts', 'policies', 'logs'
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // AI Engine State
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [dynamicModels, setDynamicModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [searchModelQuery, setSearchModelQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const providers = [
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      tag: 'سحابي موصى به 🌟', 
      icon: Sparkles,
      defaultModel: 'gemini-1.5-flash',
      needBaseUrl: false,
      needKey: true,
      hint: 'احصل على مفتاحك مجاناً من Google AI Studio'
    },
    { 
      id: 'ollama', 
      name: 'Ollama (محلي / بدون إنترنت)', 
      tag: 'محلي مجاني 100% 🦙', 
      icon: Terminal,
      defaultModel: 'qwen2.5:latest',
      needBaseUrl: true,
      defaultBaseUrl: 'http://localhost:11434/v1',
      needKey: false,
      hint: 'شغل Ollama على جهازك واضغط «تحديث النماذج» لاكتشاف النماذج المثبتة لديك'
    },
    { 
      id: 'deepseek', 
      name: 'DeepSeek AI', 
      tag: 'اقتصادي وفائق الذكاء ⚡', 
      icon: Zap,
      defaultModel: 'deepseek-chat',
      needBaseUrl: true,
      defaultBaseUrl: 'https://api.deepseek.com/v1',
      needKey: true,
      hint: 'استخدم مفتاحك من منصة platform.deepseek.com'
    },
    { 
      id: 'groq', 
      name: 'Groq Cloud', 
      tag: 'أسرع استجابة بالعالم 🚀', 
      icon: Cpu,
      defaultModel: 'llama-3.3-70b-versatile',
      needBaseUrl: true,
      defaultBaseUrl: 'https://api.groq.com/openai/v1',
      needKey: true,
      hint: 'استخدم مفتاحك السريع من console.groq.com'
    },
    { 
      id: 'openai', 
      name: 'OpenAI / Custom', 
      tag: 'متوافق مع أي خادم 🌐', 
      icon: Server,
      defaultModel: 'gpt-4o-mini',
      needBaseUrl: true,
      defaultBaseUrl: 'https://api.openai.com/v1',
      needKey: true,
      hint: 'يدعم OpenAI و LM Studio و vLLM و OpenRouter'
    }
  ];

  const handleFetchModels = async (prov = provider, bUrl = baseUrl, key = apiKey) => {
    setFetchingModels(true);
    try {
      const models = await fetchAvailableModels(prov, bUrl, key);
      setDynamicModels(models);
      if (models.length > 0) {
        const exists = models.some(m => m.id === selectedModel);
        if (!exists) {
          setSelectedModel(models[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch models dynamically", e);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderSelect = (newProv) => {
    setProvider(newProv);
    setValidationResult(null);
    const pConfig = providers.find(p => p.id === newProv);
    
    if (pConfig) {
      if (pConfig.defaultBaseUrl && (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('api.'))) {
        setBaseUrl(pConfig.defaultBaseUrl);
      }
      setSelectedModel(pConfig.defaultModel);
      handleFetchModels(newProv, pConfig.defaultBaseUrl || baseUrl, apiKey);
    }
  };

  const defaultModelsList = {
    gemini: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (سريع ومثالي)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (عميق للمستندات الضخمة)' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp (الجيل الجديد)' }
    ],
    ollama: [
      { id: 'qwen2.5:latest', name: 'Qwen 2.5 (الأقوى في العربية)' },
      { id: 'llama3.2:latest', name: 'Llama 3.2 (سريع وخفيف)' },
      { id: 'mistral:latest', name: 'Mistral 7B' },
      { id: 'deepseek-r1:latest', name: 'DeepSeek R1 (تفكير متقدم)' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoning)' }
    ],
    groq: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (خارق السرعة)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (فوري)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
    ],
    openai: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (ذكي وسريع)' },
      { id: 'gpt-4o', name: 'GPT-4o (الرائد)' },
      { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest' }
    ]
  };

  const availableModels = dynamicModels.length > 0 ? dynamicModels : (defaultModelsList[provider] || []);

  const filteredModels = availableModels.filter(m => 
    m.id.toLowerCase().includes(searchModelQuery.toLowerCase()) || 
    (m.name && m.name.toLowerCase().includes(searchModelQuery.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prompt Form State
  const [promptCategory, setPromptCategory] = useState('quiz');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptDesc, setPromptDesc] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [aiPromptGoal, setAiPromptGoal] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, settingsData, logsData, docsData, promptsData] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAdminSettings().catch(() => ({})),
        fetchAdminLogs(50).catch(() => []),
        fetchDocuments().catch(() => []),
        fetchPrompts().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.default_provider) setProvider(settingsData.default_provider);
        if (settingsData.default_model) setSelectedModel(settingsData.default_model);
      }
      if (logsData) setLogs(logsData);
      if (docsData) setDocuments(docsData);
      if (promptsData) setPrompts(promptsData);

      // Load local credentials
      const savedKey = localStorage.getItem('eduai_gemini_key') || localStorage.getItem('eduai_api_key') || '';
      const savedProvider = localStorage.getItem('eduai_ai_provider') || 'gemini';
      const savedBaseUrl = localStorage.getItem('eduai_base_url') || '';
      const savedModel = localStorage.getItem('eduai_selected_model') || 'gemini-1.5-flash';

      setApiKey(savedKey);
      setProvider(savedProvider);
      setBaseUrl(savedBaseUrl);
      setSelectedModel(savedModel);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      setSaveSuccess(false);
      setValidationResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        default_provider: provider,
        default_model: selectedModel
      };

      await saveAdminSettings(updatedSettings);

      // Save client-side keys
      localStorage.setItem('eduai_ai_provider', provider);
      localStorage.setItem('eduai_api_key', apiKey);
      localStorage.setItem('eduai_gemini_key', apiKey);
      localStorage.setItem('eduai_base_url', baseUrl);
      localStorage.setItem('eduai_selected_model', selectedModel);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadAllData();
    } catch (e) {
      alert(`فشل حفظ الإعدادات: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelDiscoveryStatus, setModelDiscoveryStatus] = useState(null);
  const [isModelsListOpen, setIsModelsListOpen] = useState(false);

  const handleValidateConnection = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await validateApiKey(apiKey, provider, baseUrl, selectedModel);
      setValidationResult(res);
    } catch (e) {
      setValidationResult({ valid: false, error: e.message });
    } finally {
      setValidating(false);
    }
  };

  const handleDiscoverModels = async () => {
    setFetchingModels(true);
    setModelDiscoveryStatus(null);
    try {
      const models = await fetchAvailableModels(provider, baseUrl, apiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
        setIsModelsListOpen(true);
        setModelDiscoveryStatus({ type: 'success', text: `تم اكتشاف ${models.length} نموذج متاح بنجاح ✓` });
      } else {
        setModelDiscoveryStatus({ type: 'warn', text: 'لم يتم العثور على نماذج عبر هذا الرابط، تأكد من تشغيل السيرفر.' });
      }
    } catch (e) {
      setModelDiscoveryStatus({ type: 'error', text: `تعذر الاتصال بالرابط: ${e.message}` });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('هل تريد تنظيف الذاكرة المؤقتة وضغط قاعدة البيانات؟')) return;
    try {
      await clearAdminCache();
      alert('تم تنظيف الذاكرة المؤقتة بنجاح ✓');
      await loadAllData();
    } catch (e) {
      alert(`فشل التنظيف: ${e.message}`);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
    try {
      await deleteDocument(docId);
      await loadAllData();
      if (onReloadDocuments) onReloadDocuments();
    } catch (e) {
      alert(`فشل الحذف: ${e.message}`);
    }
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    if (!promptTitle.trim() || !promptText.trim()) return;
    try {
      await saveCustomPrompt({
        category: promptCategory,
        title: promptTitle.trim(),
        description: promptDesc.trim(),
        system_prompt: promptText.trim()
      });
      setPromptTitle('');
      setPromptDesc('');
      setPromptText('');
      await loadAllData();
      alert('تم حفظ القالب بنجاح ✓');
    } catch (err) {
      alert(`فشل حفظ القالب: ${err.message}`);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    try {
      await deleteCustomPrompt(promptId);
      await loadAllData();
    } catch (err) {
      alert(`فشل حذف القالب: ${err.message}`);
    }
  };

  const handleGeneratePromptWithAI = async () => {
    if (!aiPromptGoal.trim()) return;
    setIsGeneratingPrompt(true);
    try {
      const res = await generatePromptWithAI(aiPromptGoal, promptCategory);
      if (res) {
        setPromptTitle(res.title || `قالب ${promptCategory}`);
        setPromptDesc(res.description || aiPromptGoal);
        setPromptText(res.system_prompt || '');
      }
    } catch (err) {
      alert(`فشل توليد البرومبت: ${err.message}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '📊 نظرة عامة ومقاييس', icon: BarChart3 },
    { id: 'files', label: '📁 إدارة ملفات المنصة', icon: FolderKanban },
    { id: 'ai', label: '🤖 محركات الذكاء الاصطناعي', icon: Cpu },
    { id: 'prompts', label: '⚡ استوديو البرومبتات', icon: Wand2 },
    { id: 'policies', label: '🛡️ سياسات وميزات المنصة', icon: ShieldAlert },
    { id: 'logs', label: '📜 سجل النشاطات والأحداث', icon: History },
    { id: 'ai_errors', label: '⚠️ أخطاء المزودين', icon: AlertTriangle }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black theme-text-primary">لوحة التحكم الشاملة للإدارة (Admin Control Center)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {stats?.system_version || 'v2.4 Pro'}
                </span>
              </div>
              <p className="text-xs theme-text-secondary">
                التحكم الإداري الكامل في المحركات، المستندات، بنك التوجيهات، والسياسات البرمجية للمنصة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> تم الحفظ بنجاح
              </span>
            )}

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 border border-white/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl theme-header-btn border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'theme-card-inner border hover:border-emerald-400/40 theme-text-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">

          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl theme-card-inner border space-y-1.5">
                  <span className="text-[11px] theme-text-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" /> إجمالي المستندات
                  </span>
                  <div className="text-2xl font-black theme-text-primary">{stats?.total_documents || 0}</div>
                  <span className="text-[10px] theme-text-muted">{stats?.total_pages || 0} صفحة مفهرسة</span>
                </div>

                <div className="p-4 rounded-2xl theme-card-inner border space-y-1.5">
                  <span className="text-[11px] theme-text-muted flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" /> الكلمات المستخلصة
                  </span>
                  <div className="text-2xl font-black theme-text-primary">{(stats?.total_words || 0).toLocaleString()}</div>
                  <span className="text-[10px] theme-text-muted">مفهرسة في RAG</span>
                </div>

                <div className="p-4 rounded-2xl theme-card-inner border space-y-1.5">
                  <span className="text-[11px] theme-text-muted flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-amber-500" /> قوالب البرومبتات
                  </span>
                  <div className="text-2xl font-black theme-text-primary">{stats?.total_prompts || 0}</div>
                  <span className="text-[10px] theme-text-muted">جاهزة ومخصصة</span>
                </div>

                <div className="p-4 rounded-2xl theme-card-inner border space-y-1.5">
                  <span className="text-[11px] theme-text-muted flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-500" /> سعة قاعدة البيانات
                  </span>
                  <div className="text-2xl font-black theme-text-primary">{stats?.database_size_kb || 0} KB</div>
                  <span className="text-[10px] text-emerald-500 font-bold">SQLite نشط وسريع ✓</span>
                </div>
              </div>

              {/* Status & Health Card */}
              <div className="glass-card rounded-2xl p-6 border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black theme-text-primary flex items-center gap-2">
                    <Server className="w-4 h-4 text-teal-500" />
                    <span>حالة خوادم ومحركات المنصة الحالية</span>
                  </h4>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    السيرفر يعمل بكفاءة 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl theme-card-inner border space-y-1">
                    <span className="theme-text-muted text-[11px]">المحرك الافتراضي النشط</span>
                    <b className="theme-text-primary block font-mono text-sm uppercase">{provider}</b>
                  </div>
                  <div className="p-3 rounded-xl theme-card-inner border space-y-1">
                    <span className="theme-text-muted text-[11px]">النموذج المعتمد</span>
                    <b className="theme-text-primary block font-mono text-sm">{selectedModel}</b>
                  </div>
                  <div className="p-3 rounded-xl theme-card-inner border space-y-1">
                    <span className="theme-text-muted text-[11px]">إجمالي العمليات المسجلة</span>
                    <b className="theme-text-primary block text-sm">{stats?.total_activities || 0} حدث</b>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 rounded-xl theme-header-btn border text-xs font-bold hover:text-amber-500 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تنظيف الذاكرة المؤقتة وضغط القاعدة</span>
                </button>
              </div>

            </div>
          )}

          {/* 2. Files Management Tab */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black theme-text-primary">مستندات المنصة المخزنة ({documents.length})</h4>
                <span className="text-xs theme-text-muted">يمكن للإدارة حذف أو مراجعة أي مادة مخزنة</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-right">
                  <thead className="bg-slate-100 dark:bg-slate-900 font-black theme-text-primary">
                    <tr>
                      <th className="px-4 py-3">اسم المستند</th>
                      <th className="px-4 py-3">الصفحات</th>
                      <th className="px-4 py-3">الكلمات</th>
                      <th className="px-4 py-3">تاريخ الرفع</th>
                      <th className="px-4 py-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                    {documents.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-bold theme-text-primary max-w-xs truncate">{d.filename}</td>
                        <td className="px                {/* Provider & Key Configuration */}
                <div className="glass-card rounded-2xl p-5 border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-emerald-500 dark:text-teal-300 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-teal-500" /> إعداد المزود والمفاتيح
                    </h4>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {dynamicModels.length > 0 ? `${dynamicModels.length} نموذج متاح` : 'جاهز للربط'}
                    </span>
                  </div>

                  {/* 1. Provider Cards Grid */}
                  <div>
                    <label className="text-xs font-bold theme-text-primary block mb-2">
                      اختر مزود الذكاء الاصطناعي:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {providers.map((p) => {
                        const Icon = p.icon;
                        const isSelected = provider === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProviderSelect(p.id)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between h-18 ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500/10 shadow-md ring-2 ring-teal-500/30'
                                : 'theme-card-inner border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-500' : 'theme-text-muted'}`} />
                              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isSelected ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300' : 'theme-text-muted'}`}>
                                {p.tag}
                              </span>
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-teal-600 dark:text-teal-400 font-black' : 'theme-text-primary'}`}>
                              {p.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Provider Inputs Container */}
                  <div className="space-y-3 p-3.5 rounded-xl theme-card-inner border text-xs">
                    
                    {/* Base URL Input with Refresh Models button */}
                    {['ollama', 'custom', 'openrouter', 'deepseek', 'groq', 'openai'].includes(provider) && (
                      <div>
                        <label className="text-xs font-bold theme-text-primary block mb-1">
                          رابط الخادم (Base URL):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="http://localhost:11434/v1 أو http://localhost:20128/v1"
                            className="w-full theme-card-inner border rounded-xl px-3 py-2 text-xs theme-text-primary outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleFetchModels(provider, baseUrl, apiKey)}
                            disabled={fetchingModels}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            title="جلب وتحديث النماذج المثبتة من هذا الرابط"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                            <span>{fetchingModels ? 'جاري الفحص...' : 'تحديث النماذج'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* API Key Input */}
                    <div>
                      <label className="text-xs font-bold theme-text-primary block mb-1 flex items-center justify-between">
                        <span>{provider === 'ollama' ? 'مفتاح API (اختياري لـ Ollama):' : 'مفتاح API Key:'}</span>
                        {provider === 'gemini' && (
                          <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            <span>الحصول على مفتاح مجاني</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={provider === 'ollama' ? "غير مطلوب في Ollama المحلي" : "الصق مفتاحك هنا..."}
                        className="w-full theme-card-inner border rounded-xl px-3 py-2 text-xs theme-text-primary outline-none font-mono"
                      />
                    </div>

                    {/* 3. Searchable Models Selection Box (Same as ApiKeyModal) */}
                    <div className="relative" ref={modelDropdownRef}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold theme-text-primary block">
                          النموذج المختار (Search & Select Model):
                        </label>
                        {availableModels.length > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {availableModels.length} نموذج متاح
                          </span>
                        )}
                      </div>

                      {/* Model Input / Trigger */}
                      <div 
                        onClick={() => setIsModelDropdownOpen(true)}
                        className="w-full theme-card-inner border focus-within:border-teal-500 rounded-xl px-3 py-2 text-xs flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                          <Search className="w-3.5 h-3.5 theme-text-muted shrink-0" />
                          <input
                            type="text"
                            value={isModelDropdownOpen ? searchModelQuery : selectedModel}
                            onChange={(e) => {
                              setSearchModelQuery(e.target.value);
                              setSelectedModel(e.target.value);
                              if (!isModelDropdownOpen) setIsModelDropdownOpen(true);
                            }}
                            onFocus={() => {
                              setIsModelDropdownOpen(true);
                              setSearchModelQuery('');
                            }}
                            placeholder={selectedModel ? `النموذج الحالي: ${selectedModel}` : "ابحث في النماذج أو اكتب اسماً مخصصاً (مثل oc/big-pickle)..."}
                            className="bg-transparent theme-text-primary text-xs outline-none w-full font-mono placeholder-slate-400"
                          />
                        </div>
                        <ChevronDown className={`w-4 h-4 theme-text-muted transition-transform shrink-0 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>

                      {/* Searchable Dropdown Menu */}
                      {isModelDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 glass-panel border rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-52 overflow-y-auto animate-fade-in text-xs font-bold theme-nav">
                          
                          {searchModelQuery && !filteredModels.some(m => m.id.toLowerCase() === searchModelQuery.toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModel(searchModelQuery.trim());
                                setIsModelDropdownOpen(false);
                              }}
                              className="w-full text-right p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300 hover:bg-teal-500/25 transition flex items-center justify-between"
                            >
                              <span>استخدام النموذج المخصص: <span className="font-mono">{searchModelQuery}</span></span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 font-normal">مخصص</span>
                            </button>
                          )}

                          {filteredModels.map((m) => {
                            const isCurrent = selectedModel === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(m.id);
                                  setIsModelDropdownOpen(false);
                                }}
                                className={`w-full text-right p-2 rounded-xl transition flex items-center justify-between ${
                                  isCurrent 
                                    ? 'bg-emerald-600 text-white font-black' 
                                    : 'theme-card-inner hover:bg-white/10 theme-text-primary'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <span className="block font-mono text-xs">{m.id}</span>
                                  {m.name && <span className={`text-[10px] block ${isCurrent ? 'text-emerald-100' : 'theme-text-muted'}`}>{m.name}</span>}
                                </div>
                                {isCurrent && <Check className="w-4 h-4 text-white shrink-0" />}
                              </button>
                            );
                          })}

                          {filteredModels.length === 0 && !searchModelQuery && (
                            <div className="p-3 text-center theme-text-muted text-xs">
                              لم يتم العثور على نماذج. اكتب اسم النموذج في خانة البحث أعلاه.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Validate Connection Button */}
                    <button
                      type="button"
                      onClick={handleValidateConnection}
                      disabled={validating}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 disabled:opacity-50 mt-1"
                    >
                      <Zap className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
                      <span>{validating ? 'جاري فحص الاتصال بالمحرك...' : 'اختبار الاتصال والمفتاح الآن'}</span>
                    </button>

                    {/* Validation Result Box */}
                    {validationResult && (
                      <div className={`p-2.5 rounded-xl border text-xs font-bold ${
                        validationResult.valid
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        {validationResult.valid ? '✓ الاتصال بالمحرك سليم ومفتاح الـ API صالح 100%' : `❌ خطأ في الاتصال: ${validationResult.error}`}
                      </div>
                    )}

                  </div>
                </div>               );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleValidateConnection}
                      disabled={validating}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2"
                    >
                      <Zap className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
                      <span>{validating ? 'جاري فحص الاتصال بالمحرك...' : 'اختبار الاتصال والمفتاح الآن'}</span>
                    </button>

                    {validationResult && (
                      <div className={`p-3 rounded-xl border text-xs font-bold ${
                        validationResult.valid
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        {validationResult.valid ? '✓ الاتصال بالمحرك سليم ومفتاح الـ API صالح 100%' : `❌ خطأ في الاتصال: ${validationResult.error}`}
                      </div>
                    )}

                  </div>
                </div>

                {/* Hyperparameters & AI Tuning */}
                <div className="glass-card rounded-2xl p-5 border space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-500 dark:text-teal-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-500" /> ضبط معايير التوليد (Hyperparameters)
                  </h4>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="theme-text-muted font-bold">درجة الابتكارية (Temperature):</label>
                        <b className="theme-text-primary font-mono">{settings.temperature ?? 0.3}</b>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.temperature ?? 0.3}
                        onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-[10px] theme-text-muted block mt-1">القيمة 0.2 - 0.4 مثالية للدقة الأكاديمية الصارمة</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="theme-text-muted font-bold">عدد قطع RAG المسترجعة (Top Chunks):</label>
                        <b className="theme-text-primary font-mono">{settings.auto_rag_chunks ?? 4}</b>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="1"
                        value={settings.auto_rag_chunks ?? 4}
                        onChange={(e) => setSettings({ ...settings, auto_rag_chunks: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs theme-text-primary leading-relaxed">
                      💡 <b>نصيحة إدارية:</b> محرك <b>Gemini 1.5 Flash</b> يمتاز بنافذة سياق ضخمة وسرعة استجابة فائقة، وهو مهيأ تلقائياً للتعامل مع ملفات الكتب والمحاضرات الجامعية.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 4. Prompts Studio Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Prompts List */}
                <div className="md:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black theme-text-primary">القوالب المسجلة ({prompts.length})</h4>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {prompts.map((p) => (
                      <div key={p.id} className="p-3 rounded-2xl theme-card-inner border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <b className="text-xs font-black theme-text-primary">{p.title}</b>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-teal-400">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-[11px] theme-text-secondary line-clamp-2 leading-relaxed">{p.description || p.system_prompt}</p>
                        
                        {!p.is_default && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleDeletePrompt(p.id)}
                              className="text-[10px] text-rose-500 hover:underline font-bold"
                            >
                              حذف القالب
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Create New Prompt Form & AI Generator */}
                <div className="md:col-span-7 glass-card rounded-2xl p-5 border space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-500 dark:text-teal-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-teal-500" /> إضافة أو توليد قالب توجيه جديد
                  </h4>

                  {/* AI Prompt Generator Box */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-bold theme-text-primary flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" /> مولد البرومبتات الذكي
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={aiPromptGoal}
                        onChange={(e) => setAiPromptGoal(e.target.value)}
                        placeholder="مثال: اجعل الاختبار يركز على أسئلة الحالات السريرية المعقدة..."
                        className="w-full p-2 rounded-xl theme-card-inner border text-xs theme-text-primary outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={handleGeneratePromptWithAI}
                        disabled={isGeneratingPrompt || !aiPromptGoal.trim()}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 disabled:opacity-50"
                      >
                        {isGeneratingPrompt ? 'توليد...' : 'توليد ✨'}
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleCreatePrompt} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="theme-text-muted block font-bold mb-1">القسم المستهدف:</label>
                        <select
                          value={promptCategory}
                          onChange={(e) => setPromptCategory(e.target.value)}
                          className="w-full p-2.5 rounded-xl theme-card-inner border theme-text-primary outline-none font-bold"
                        >
                          <option value="quiz">الاختبارات (Quiz)</option>
                          <option value="summary">التلخيص (Summary)</option>
                          <option value="chat">المحادثة (Chat)</option>
                          <option value="proofread">التدقيق (Proofread)</option>
                        </select>
                      </div>

                      <div>
                        <label className="theme-text-muted block font-bold mb-1">عنوان القالب:</label>
                        <input
                          type="text"
                          value={promptTitle}
                          onChange={(e) => setPromptTitle(e.target.value)}
                          placeholder="مثال: أسئلة امتحانات بورد طبية"
                          className="w-full p-2.5 rounded-xl theme-card-inner border theme-text-primary outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="theme-text-muted block font-bold mb-1">نص البرومبت التوجيهي (System Prompt):</label>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="أنت أستاذ جامعي معتمد..."
                        rows={5}
                        className="w-full p-3 rounded-xl theme-card-inner border theme-text-primary outline-none focus:border-teal-500 leading-relaxed font-mono text-[11px]"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md transition"
                    >
                      حفظ القالب في بنك البرومبتات
                    </button>
                  </form>

                </div>

              </div>

            </div>
          )}

          {/* 5. Policies & Features Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Feature Toggles */}
                <div className="glass-card rounded-2xl p-5 border space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-500 dark:text-teal-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-teal-500" /> تفعيل / تعطيل أقسام المنصة
                  </h4>

                  <div className="space-y-3">
                    {[
                      { key: 'enable_summary', label: 'قسم التلخيص الأكاديمي والخريطة الذهنية' },
                      { key: 'enable_quiz', label: 'قسم استوديو الاختبارات وبنك الأسئلة' },
                      { key: 'enable_chat', label: 'قسم المساعد الأكاديمي والمحادثة الذكية' },
                      { key: 'enable_proofread', label: 'قسم التدقيق اللغوي والأصالة الأكاديمية' },
                    ].map((feat) => (
                      <div key={feat.key} className="flex items-center justify-between p-3 rounded-xl theme-card-inner border">
                        <span className="font-bold theme-text-primary">{feat.label}</span>
                        <input
                          type="checkbox"
                          checked={settings[feat.key] ?? true}
                          onChange={(e) => setSettings({ ...settings, [feat.key]: e.target.checked })}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload & Storage Limits */}
                <div className="glass-card rounded-2xl p-5 border space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-500 dark:text-teal-300 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-teal-500" /> حدود الرفع والملفات
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="theme-text-muted block font-bold mb-1">الحد الأقصى لحجم الملف المرفوع (MB):</label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={settings.max_upload_size_mb ?? 50}
                        onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-xl theme-card-inner border theme-text-primary outline-none focus:border-teal-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="theme-text-muted block font-bold mb-1">رسالة وتنبيه النظام العام:</label>
                      <input
                        type="text"
                        value={settings.system_notice || ''}
                        onChange={(e) => setSettings({ ...settings, system_notice: e.target.value })}
                        className="w-full p-2.5 rounded-xl theme-card-inner border theme-text-primary outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 6. Logs & Events Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black theme-text-primary">سجل العمليات والأحداث الحية ({logs.length})</h4>
                <button
                  onClick={loadAllData}
                  className="text-xs text-teal-500 hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> تحديث السجل
                </button>
              </div>

              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl theme-card-inner border flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.level === 'success' ? 'bg-emerald-500' :
                        log.level === 'warn' ? 'bg-amber-500' :
                        log.level === 'error' ? 'bg-rose-500' : 'bg-teal-500'
                      }`}></span>
                      <div>
                        <b className="theme-text-primary block">{log.details || log.action}</b>
                        <span className="text-[10px] font-mono theme-text-muted uppercase tracking-wider">{log.action}</span>
                      </div>
                    </div>
                    <span className="text-[10px] theme-text-muted font-mono shrink-0">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString('ar-EG') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
