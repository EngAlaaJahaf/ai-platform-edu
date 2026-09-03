import React from 'react';
import { Cpu, Server, Key, Terminal, RefreshCw, Zap, Check } from 'lucide-react';

export default function AISettings({
  provider,
  setProvider,
  apiKey,
  setApiKey,
  baseUrl,
  setBaseUrl,
  selectedModel,
  setSelectedModel,
  googleClientId,
  setGoogleClientId,
  validating,
  validationResult,
  handleValidateConnection,
  dynamicModels,
  fetchingModels,
  handleFetchModels,
  searchModelQuery,
  setSearchModelQuery,
  isModelDropdownOpen,
  setIsModelDropdownOpen,
  modelDropdownRef
}) {
  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12 font-['Tajawal']">
      <div>
        <h2 className="text-2xl font-black theme-text-primary mb-1">محركات الذكاء الاصطناعي (AI Engines)</h2>
        <p className="text-xs theme-text-muted font-bold">تحكم بمزودي الخدمة، النماذج، ومفاتيح API لعمل المنصة الأساسي</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" />
            المزود الرئيسي (Provider)
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black theme-text-muted mb-2">اختر مزود الذكاء الاصطناعي</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('gemini')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                    provider === 'gemini' 
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-500 shadow-md' 
                      : 'theme-card-inner border hover:border-indigo-500 theme-text-secondary'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('openai')}
                  className={`p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                    provider === 'openai' 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 shadow-md' 
                      : 'theme-card-inner border hover:border-indigo-500 theme-text-secondary'
                  }`}
                >
                  OpenAI / Custom API
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-black theme-text-muted mb-1">مفتاح API (اختياري / Global)</label>
              <div className="relative">
                <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="إذا تُرك فارغاً سيُطلب من الطلاب..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl theme-card-inner border text-xs font-mono font-bold theme-text-primary focus:border-indigo-500 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">Base URL (للخوادم المحلية أو البديلة)</label>
              <div className="relative">
                <Terminal className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl theme-card-inner border text-xs font-mono font-bold theme-text-primary focus:border-indigo-500 transition shadow-inner"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black theme-text-muted mb-1">Google OAuth Client ID</label>
              <div className="relative">
                <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="1234567890-xxxx.apps.googleusercontent.com"
                  value={googleClientId || ''}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl theme-card-inner border text-xs font-mono font-bold theme-text-primary focus:border-indigo-500 transition shadow-inner"
                  dir="ltr"
                />
              </div>
              <p className="text-[11px] theme-text-muted mt-1 font-bold">يُحفظ في النظام ويُستخدم لتسجيل الدخول بـ Google. اتركه فارغاً لتعطيل Google.</p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleValidateConnection}
                disabled={validating}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-white transition flex items-center gap-2"
              >
                {validating ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                اختبار الاتصال
              </button>
              
              {validationResult && (
                <div className={`text-xs font-bold flex items-center gap-1 ${validationResult.success ? 'text-emerald-400' : 'text-rose-400'} mt-2`}>
                  {validationResult.success ? <Check className="w-4 h-4" /> : <span className="text-lg leading-none">!</span>}
                  {validationResult.success ? 'متصل بنجاح' : (validationResult.error || 'فشل الاتصال')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="theme-bg-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-black theme-text-primary border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            النموذج الافتراضي (Default Model)
          </h3>
          
          <div className="space-y-4">
            <div className="relative" ref={modelDropdownRef}>
              <label className="block text-xs font-black theme-text-muted mb-1">اختر النموذج</label>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="w-full theme-card-inner border rounded-2xl px-4 py-2.5 text-xs font-bold theme-text-primary flex justify-between items-center focus:border-indigo-500 transition cursor-pointer"
              >
                <span className="font-mono text-indigo-500">{selectedModel || 'Gemini 1.5 Flash'}</span>
                <span className="text-[11px] theme-text-muted font-black">تغيير ▼</span>
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 theme-bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ابحث عن نموذج..."
                      value={searchModelQuery}
                      onChange={(e) => setSearchModelQuery(e.target.value)}
                      className="w-full bg-transparent border-none text-xs theme-text-primary focus:ring-0 px-2 font-bold"
                      dir="ltr"
                    />
                    <button
                      onClick={handleFetchModels}
                      disabled={fetchingModels}
                      className="p-1.5 hover:bg-slate-500/10 rounded-lg theme-text-muted hover:text-indigo-500 transition cursor-pointer"
                      title="جلب النماذج من الخادم"
                    >
                      <RefreshCw className={`w-4 h-4 ${fetchingModels ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {searchModelQuery && !dynamicModels.includes(searchModelQuery) && (
                      <button
                        onClick={() => {
                          setSelectedModel(searchModelQuery);
                          setIsModelDropdownOpen(false);
                          setSearchModelQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition text-indigo-500 hover:bg-indigo-500/10 border border-indigo-500/30 border-dashed mb-2 cursor-pointer"
                      >
                        + استخدام النموذج المخصص: <span className="font-bold">{searchModelQuery}</span>
                      </button>
                    )}
                    {dynamicModels.length > 0 ? (
                      dynamicModels
                        .filter(m => m.toLowerCase().includes(searchModelQuery.toLowerCase()))
                        .map(model => (
                        <button
                          key={model}
                          onClick={() => {
                            setSelectedModel(model);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                            selectedModel === model 
                              ? 'bg-indigo-500/20 text-indigo-500 font-bold border border-indigo-500/30' 
                              : 'theme-text-secondary hover:bg-slate-500/10'
                          }`}
                        >
                          {model}
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-center theme-text-muted py-4 font-bold">
                        لا توجد نماذج. اضغط أيقونة التحديث للجلب.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[11px] theme-text-muted mt-2 font-bold">
              هذا هو النموذج الافتراضي الذي سيستخدمه الطلاب عند عدم تحديد نموذج معين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
