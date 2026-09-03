import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Cpu, 
  ShieldCheck, 
  Trash2, 
  Server, 
  Terminal, 
  Zap, 
  RefreshCw,
  Search,
  Check,
  ChevronDown
} from 'lucide-react';
import { 
  getAIProvider, 
  setAIProvider, 
  getApiKey, 
  setApiKey, 
  getBaseUrl, 
  setBaseUrl, 
  getSelectedModel, 
  setSelectedModel, 
  validateConnection,
  fetchAvailableModels,
  getUseBaseRules,
  setUseBaseRules
} from '../services/api';

export default function ApiKeyModal({ isOpen, onClose, onKeyUpdated }) {
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKeyState] = useState('');
  const [baseUrl, setBaseUrlState] = useState('');
  const [model, setModelState] = useState('gemini-1.5-flash');
  
  // Searchable Models state
  const [dynamicModels, setDynamicModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [useBaseRules, setUseBaseRulesState] = useState(true);

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
      hint: 'شغل Ollama على جهازك واضغط «جلب النماذج» لاكتشاف النماذج المثبتة لديك'
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
        const exists = models.some(m => m.id === model);
        if (!exists) {
          setModelState(models[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch models dynamically", e);
    } finally {
      setFetchingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const currentProv = getAIProvider();
      const currentKey = getApiKey();
      const currentBaseUrl = getBaseUrl();
      const currentModel = getSelectedModel();

      setProvider(currentProv);
      setApiKeyState(currentKey);
      setBaseUrlState(currentBaseUrl);
      setModelState(currentModel);
      setUseBaseRulesState(getUseBaseRules());
      setValidationResult(null);
      setIsDropdownOpen(false);
      setSearchQuery('');

      handleFetchModels(currentProv, currentBaseUrl, currentKey);
    }
  }, [isOpen]);

  // Click outside to close models dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProviderChange = (newProv) => {
    setProvider(newProv);
    setValidationResult(null);
    const pConfig = providers.find(p => p.id === newProv);
    
    if (pConfig) {
      if (pConfig.defaultBaseUrl && (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('api.'))) {
        setBaseUrlState(pConfig.defaultBaseUrl);
      }
      setModelState(pConfig.defaultModel);
      handleFetchModels(newProv, pConfig.defaultBaseUrl || baseUrl, apiKey);
    }
  };

  const currentConfig = providers.find(p => p.id === provider) || providers[0];

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
    m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleValidateAndSave = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await validateConnection(
        provider, 
        apiKey.trim(), 
        baseUrl.trim(), 
        model.trim()
      );

      setValidationResult(res);

      if (res.valid) {
        setAIProvider(provider);
        setApiKey(apiKey.trim());
        setBaseUrl(baseUrl.trim());
        setSelectedModel(model.trim());
        setUseBaseRules(useBaseRules);
        onKeyUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setValidationResult({ valid: false, error: err.message || 'فشل الاتصال بالمزود' });
    } finally {
      setValidating(false);
    }
  };

  const handleClear = () => {
    setApiKeyState('');
    setApiKey('');
    setBaseUrlState('');
    setBaseUrl('');
    setValidationResult(null);
    onKeyUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black theme-text-primary">إعدادات النماذج والمزودات الذكية</h3>
            <p className="text-xs theme-text-secondary">يدعم Ollama المحلي، و Google Gemini، و DeepSeek، و Groq</p>
          </div>
        </div>

        {/* Provider Selector Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold theme-text-primary block">اختر مزود الذكاء الاصطناعي:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {providers.map((p) => {
              const Icon = p.icon;
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-cyan-500 text-indigo-900 dark:text-cyan-300 shadow-md ring-2 ring-cyan-500/30'
                      : 'theme-card-inner hover:border-indigo-400/50 theme-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-500' : 'theme-text-muted'}`} />
                    {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>}
                  </div>
                  <div>
                    <b className="text-xs font-bold block">{p.name}</b>
                    <span className="text-[10px] theme-text-secondary block mt-0.5">{p.tag}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Provider Configuration Fields */}
        <div className="space-y-3.5 p-4 rounded-2xl theme-card-inner border">
          
          {/* Base URL Input */}
          {currentConfig.needBaseUrl && (
            <div>
              <label className="text-xs font-bold theme-text-primary block mb-1">
                رابط الخادم (Base URL):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrlState(e.target.value)}
                  placeholder={currentConfig.defaultBaseUrl || "http://localhost:11434/v1"}
                  className="w-full theme-card-inner border rounded-xl px-3.5 py-2.5 text-xs theme-text-primary outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleFetchModels(provider, baseUrl, apiKey)}
                  disabled={fetchingModels}
                  className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-md"
                  title="جلب وتحديث النماذج المثبتة من هذا الرابط"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                  <span>تحديث النماذج</span>
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
                  className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>الحصول على مفتاح مجاني</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder={provider === 'ollama' ? "غير مطلوب في Ollama المحلي" : "الصق مفتاحك هنا..."}
              className="w-full theme-card-inner border rounded-xl px-3.5 py-2.5 text-xs theme-text-primary outline-none font-mono"
            />
          </div>

          {/* Searchable Models Selection Box */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold theme-text-primary block">
                النموذج المختار (Search & Select Model):
              </label>
              {dynamicModels.length > 0 && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {dynamicModels.length} نموذج متاح
                </span>
              )}
            </div>

            {/* Model Input / Trigger */}
            <div 
              onClick={() => setIsDropdownOpen(true)}
              className="w-full theme-card-inner border focus-within:border-cyan-500 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <Search className="w-3.5 h-3.5 theme-text-muted shrink-0" />
                <input
                  type="text"
                  value={isDropdownOpen ? searchQuery : model}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setModelState(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    setSearchQuery('');
                  }}
                  placeholder={model ? `النموذج الحالي: ${model}` : "ابحث في النماذج أو اكتب اسماً مخصصاً..."}
                  className="bg-transparent theme-text-primary text-xs outline-none w-full font-mono placeholder-slate-400"
                />
              </div>
              <ChevronDown className={`w-4 h-4 theme-text-muted transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Searchable Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 glass-panel border rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-56 overflow-y-auto animate-fade-in text-xs font-bold theme-nav">
                
                {searchQuery && !filteredModels.some(m => m.id.toLowerCase() === searchQuery.toLowerCase()) && (
                  <button
                    onClick={() => {
                      setModelState(searchQuery.trim());
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-right p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-500/25 transition flex items-center justify-between"
                  >
                    <span>استخدام النموذج المخصص: <span className="font-mono">{searchQuery}</span></span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 font-normal">مخصص</span>
                  </button>
                )}

                {filteredModels.map((m) => {
                  const isCurrent = model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setModelState(m.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-right p-2.5 rounded-xl transition flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white font-black' 
                          : 'theme-card-inner hover:bg-white/10 theme-text-primary'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-mono text-xs">{m.id}</span>
                        {m.name && <span className={`text-[10px] block ${isCurrent ? 'text-indigo-100' : 'theme-text-muted'}`}>{m.name}</span>}
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}

                {filteredModels.length === 0 && !searchQuery && (
                  <div className="p-3 text-center theme-text-muted text-xs">
                    لم يتم العثور على نماذج. اكتب اسم النموذج في خانة البحث أعلاه.
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] theme-text-secondary mt-1.5">
              💡 {currentConfig.hint}
            </p>
          </div>

        </div>

        {/* Formatting Rules Option Toggle */}
        <div className="p-4 rounded-2xl theme-card-inner border space-y-3.5">
          <label className="flex items-start justify-between gap-4 cursor-pointer group">
            <div className="space-y-1">
              <span className="text-xs font-black theme-text-primary flex items-center gap-1.5 group-hover:text-cyan-500 transition">
                📝 تطبيق قواعد الكتابة الأكاديمية الصارمة
              </span>
              <p className="text-[10px] theme-text-secondary leading-relaxed max-w-[380px]">
                عند التفعيل، يلتزم الذكاء الاصطناعي بلغة أكاديمية واضحة ومقتضبة، جمل قصيرة، تجنب الاستعارات، الحشو، والكلمات المبالغ فيها.
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={useBaseRules}
                onChange={(e) => {
                  const val = e.target.checked;
                  setUseBaseRulesState(val);
                  setUseBaseRules(val);
                  onKeyUpdated();
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-350 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </div>
          </label>
        </div>

        {/* Validation Feedback Result */}
        {validationResult && (
          <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
            validationResult.valid 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300'
          }`}>
            {validationResult.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="leading-relaxed">
                  <p>تم التحقق والاتصال بنجاح! ({validationResult.message || 'المزود جاهز'})</p>
                  <span className="text-[10px] opacity-80">تم حفظ الإعدادات تلقائياً وسيتم إغلاق النافذة...</span>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="leading-relaxed">
                  <p>فشل الاتصال: {validationResult.error}</p>
                  <span className="text-[10px] opacity-80">يرجى التأكد من تشغيل الخادم المحلي أو صحة مفتاح API</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl theme-header-btn border text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              onClick={handleValidateAndSave}
              disabled={validating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 disabled:opacity-50 border border-white/20"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري فحص الاتصال بالنموذج...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>فحص وحفظ الإعدادات</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
