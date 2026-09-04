import React, { useState } from 'react';
import { 
  CheckCheck, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  FileEdit,
  Wand2,
  Download
} from 'lucide-react';
import { proofreadText } from '../services/api';
import ExportModal from './ExportModal';

export default function ProofreadView({ onOpenApiKey, onOpenPromptManager }) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleAudit = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const data = await proofreadText(inputText);
      if (data) {
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = (issue) => {
    if (!issue.original || !issue.correction) return;
    setInputText((prev) => prev.replace(issue.original, issue.correction));
    setResult((prev) => ({
      ...prev,
      issues: prev.issues.filter((i) => i !== issue)
    }));
  };

  const handleCopyParaphrased = () => {
    if (!result?.paraphrased_version) return;
    navigator.clipboard.writeText(result.paraphrased_version);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 dark:text-emerald-300">
              <CheckCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black theme-text-primary">التدقيق والأصالة الأكاديمية</h2>
          </div>
          <p className="text-xs theme-text-secondary">
            فحص لغوي ونحوي سياقي مع كشف نسبة الأصالة واقتراحات إعادة الصياغة الأكاديمية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white shadow-lg shadow-emerald-600/25 border border-white/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير وطباعة 📄</span>
            </button>
          )}

          <button
            onClick={handleAudit}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-xs font-black text-white shadow-lg shadow-emerald-600/25 border border-white/20 transition cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'جاري الفحص الدقيق...' : 'تدقيق النص الآن'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Text Input Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-2xl p-5 border flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold theme-text-primary flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-teal-500" /> أدخل نص فقرتك أو بحثك:
              </span>
              <span className="text-[11px] theme-text-muted font-mono">
                {inputText.split(/\s+/).filter(Boolean).length} كلمة
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="الصق فقرة من بحثك أو تقريرك هنا لفحصها لغوياً وأكاديمياً..."
              className="flex-1 w-full theme-card-inner border rounded-xl p-4 text-sm theme-text-primary outline-none resize-none font-['Tajawal'] leading-relaxed shadow-inner"
            ></textarea>

            <div className="flex items-center justify-between mt-3 text-xs theme-text-muted">
              <span>💡 اضغط زر التدقيق بالأعلى لتحليل الصياغة</span>
              <button
                onClick={() => setInputText('')}
                className="theme-text-muted hover:text-rose-500 font-bold"
              >
                مسح النص
              </button>
            </div>
          </div>
        </div>

        {/* Results & Score Area */}
        <div className="lg:col-span-5 space-y-4">
          
          {result ? (
            <div className="space-y-4">
              
              {/* Score Gauges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-2xl p-4 border text-center">
                  <span className="text-xs theme-text-secondary font-bold">نسبة الأصالة الأكاديمية</span>
                  <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400 font-['JetBrains_Mono'] my-1">
                    {result.originality_score}%
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    أصالة ممتازة ✓
                  </span>
                </div>

                <div className="glass-card rounded-2xl p-4 border text-center">
                  <span className="text-xs theme-text-secondary font-bold">سلامة اللغة والنحو</span>
                  <div className="text-3xl font-black text-teal-600 dark:text-teal-400 font-['JetBrains_Mono'] my-1">
                    {result.grammar_score}%
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                    {result.issues?.length || 0} تنبيهات
                  </span>
                </div>
              </div>

              {/* Issues List */}
              {result.issues && result.issues.length > 0 && (
                <div className="glass-card rounded-2xl p-5 border space-y-3">
                  <h4 className="text-xs font-extrabold text-emerald-500 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> التنبيهات والتصحيحات المقترحة
                  </h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {result.issues.map((iss, idx) => (
                      <div key={idx} className="p-3 rounded-xl theme-card-inner border flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 border border-rose-500/30">
                              {iss.type}
                            </span>
                            <span className="text-xs font-bold line-through text-rose-500">{iss.original}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">{iss.correction}</span>
                          </div>
                          <p className="text-[11px] theme-text-secondary mt-1">{iss.reason}</p>
                        </div>
                        <button
                          onClick={() => handleApplyFix(iss)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-[11px] font-bold text-emerald-500 dark:text-emerald-200 shrink-0 transition"
                        >
                          تطبيق
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paraphrased Version */}
              {result.paraphrased_version && (
                <div className="glass-card rounded-2xl p-5 border space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-teal-500 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> إعادة الصياغة الأكاديمية المقترحة
                    </h4>
                    <button
                      onClick={handleCopyParaphrased}
                      className="text-xs font-bold theme-text-secondary hover:theme-text-primary flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <p className="text-xs theme-text-primary leading-relaxed font-['Tajawal'] p-3 rounded-xl theme-card-inner border">
                    {result.paraphrased_version}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 border text-center flex flex-col items-center justify-center h-[480px]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-teal-500 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm theme-text-primary">في انتظار النص للتدقيق</h4>
              <p className="text-xs theme-text-secondary mt-1 max-w-xs leading-relaxed">
                اكتب أو الصق فقرتك في المربع المجاور واضغط «تدقيق النص الآن» لعرض مؤشرات الأصالة والتصويب اللغوي.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Academic Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        type="proofread"
        data={result}
        extraData={inputText}
        docName="تقرير_التدقيق_الأكاديمي"
      />

    </div>
  );
}
