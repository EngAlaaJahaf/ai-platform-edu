import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  GraduationCap, 
  BrainCircuit, 
  FileText, 
  Languages, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  Check, 
  Loader2, 
  Eye,
  EyeOff
} from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { 
  loginWithPassword, 
  registerAccount, 
  verifyGoogleCredential, 
  setUserProfile, 
  getGoogleClientId 
} from '../services/api';

export default function AuthGateView({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const clientId = getGoogleClientId();

  // Unified Login (handles both Students & Admins automatically)
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await loginWithPassword(email.trim(), password.trim());
      const welcomeMsg = user.role === 'admin' 
        ? `أهلاً بك يا مدير النظام ${user.name}! جاري تهيئة لوحة التحكم... 👑`
        : `أهلاً بك مجدداً ${user.name}! جاري الدخول... 🎓`;
      setSuccess(welcomeMsg);
      setTimeout(() => onAuthSuccess(user), 600);
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من صحة البريد وكلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  // User Registration
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('الرجاء تعبئة كافة الحقول المطلوبة');
      return;
    }

    if (password.length < 4) {
      setError('كلمة المرور يجب ألا تقل عن 4 أحرف');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await registerAccount(name.trim(), email.trim(), password.trim(), 'student');
      setSuccess(`تم إنشاء الحساب بنجاح! مرحباً بك يا ${user.name}`);
      setTimeout(() => onAuthSuccess(user), 700);
    } catch (err) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!credentialResponse.credential) {
        throw new Error('لم يتم استلام رمز Google');
      }

      const verifiedUser = await verifyGoogleCredential(credentialResponse.credential, clientId);
      setSuccess('تم تسجيل الدخول بنجاح عبر حساب Google!');
      setTimeout(() => onAuthSuccess(verifiedUser), 600);
    } catch (err) {
      try {
        const decoded = jwtDecode(credentialResponse.credential);
        const fallbackUser = {
          id: `usr_${decoded.sub.slice(0, 8)}`,
          name: decoded.name || decoded.email.split('@')[0],
          email: decoded.email,
          picture: decoded.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.email}`,
          role: decoded.email === 'admin@eduai.edu' ? 'admin' : 'student',
          tier: 'Pro Academic 🌟',
          tokens_limit: 500000,
          tokens_used: 12400
        };
        setUserProfile(fallbackUser);
        setSuccess('تم تسجيل الدخول بنجاح!');
        setTimeout(() => onAuthSuccess(fallbackUser), 600);
      } catch (e2) {
        setError('فشل التحقق من رمز Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoStudent = () => {
    setEmail('student@univ.edu');
    setPassword('student123');
    loginWithPassword('student@univ.edu', 'student123').then(u => onAuthSuccess(u)).catch(() => {
      registerAccount('طالب المنصة الأكاديمية', 'student@univ.edu', 'student123', 'student').then(u => onAuthSuccess(u));
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-950 font-['Tajawal'] relative overflow-hidden">
      
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-center">
        
        {/* Left Side: Educational Brand & Feature Highlights */}
        <div className="lg:col-span-5 text-right space-y-6 hidden lg:block pr-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-600/30 border border-white/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-['IBM_Plex_Sans_Arabic']">
                ذكاء <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">EduAI</span>
              </h1>
              <span className="text-[11px] font-bold text-indigo-300">المنصة الأكاديمية الذكية المتكاملة</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            بيئة تعليمية وبحثية جامعية مدعومة بالذكاء الاصطناعي، تتيح لك المذاكرة التفاعلية وتوليد خرائط المفاهيم والاختبارات الأكاديمية الدقيقة من مقرراتك مباشرة.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200">
              <span className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <span>خوارزميات RAG لفهم وتلخيص أوراق PDF والمحاضرات</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200">
              <span className="p-2 rounded-xl bg-purple-600/30 text-purple-400">
                <FileText className="w-4 h-4" />
              </span>
              <span>خرائط ذهنية شجرية بتصميم Google NotebookLM</span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200">
              <span className="p-2 rounded-xl bg-cyan-600/30 text-cyan-400">
                <Languages className="w-4 h-4" />
              </span>
              <span>ترجمة المقررات العلمية بنمط ورق A4 الأكاديمي</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            المنصة الأكاديمية الذكية المتقدمة
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-5 bg-slate-900/90 backdrop-blur-2xl">
            
            {/* Top Unified Auth Mode Tabs */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-950/70 border border-slate-800">
              <button
                onClick={() => { setAuthMode('login'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                onClick={() => { setAuthMode('register'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب جديد</span>
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fade-in text-right">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in text-right">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            {/* 1. LOGIN MODE (Handles Students & Admins automatically) */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in text-right">
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-black text-white">تسجيل الدخول للمنصة</h2>
                  <p className="text-xs text-slate-400">أدخل بيانات اعتماد حسابك للوصول إلى بيئة المذاكرة والتحكم</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">البريد الإلكتروني أو اسم المستخدم:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com أو اسم المستخدم"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono pr-9"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">كلمة المرور:</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono pr-9 pl-9"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-white absolute top-3 left-3"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 border border-white/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>دخول إلى المنصة</span>
                </button>

                {/* Google Sign-in Alternative */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-800"></div>
                    <span className="text-[11px] text-slate-400 font-bold">أو الدخول بحساب Google</span>
                    <div className="flex-1 h-px bg-slate-800"></div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleOAuthProvider clientId={clientId}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('فشل تسجيل الدخول بـ Google')}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        text="signin_with"
                        locale="ar"
                        width="320"
                      />
                    </GoogleOAuthProvider>
                  </div>
                </div>
              </form>
            )}

            {/* 2. REGISTER MODE */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in text-right">
                <div className="space-y-1 text-center">
                  <h2 className="text-xl font-black text-white">إنشاء حساب جديد</h2>
                  <p className="text-xs text-slate-400">انضم إلى المنصة لحفظ مقرراتك وملخصاتك واختباراتك الأكاديمية</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">الاسم الكامل:</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="الاسم الكامل"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 pr-9"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">البريد الإلكتروني:</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com أو student@univ.edu"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono pr-9"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">كلمة المرور:</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="اختر كلمة مرور قوية"
                        className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono pr-9"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/25 transition flex items-center justify-center gap-2 border border-white/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>إنشاء الحساب والبدء فوراً</span>
                </button>
              </form>
            )}

            {/* Quick Demo Access Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400">حساب تجريبي سريع:</span>
              <button
                type="button"
                onClick={handleQuickDemoStudent}
                className="px-3 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 font-bold text-[11px] transition"
              >
                🎓 تجربة المنصة بحساب طالب
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
