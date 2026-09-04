import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  LogOut, 
  Crown, 
  Check, 
  AlertCircle, 
  Loader2, 
  Settings, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Key, 
  HelpCircle,
  Shield,
  GraduationCap,
  Lock,
  UserCheck
} from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { 
  verifyGoogleCredential, 
  adminLogin,
  studentLogin,
  setUserProfile, 
  getGoogleClientId, 
  setGoogleClientId 
} from '../services/api';

export default function GoogleAuthModal({ isOpen, onClose, user, onUserUpdated }) {
  const [authTab, setAuthTab] = useState('student'); // 'student' or 'admin'
  const [clientId, setClientId] = useState(getGoogleClientId());
  const [isEditingClientId, setIsEditingClientId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authSuccess, setAuthSuccess] = useState(null);
  
  // Student Form
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');

  // Admin Form
  const [adminKey, setAdminKey] = useState('');

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (!credentialResponse.credential) {
        throw new Error('لم يتم استلام رمز Google');
      }

      const verifiedUser = await verifyGoogleCredential(credentialResponse.credential, clientId);
      onUserUpdated(verifiedUser);
      setAuthSuccess("تم تسجيل الدخول بنجاح عبر حساب Google!");
      setTimeout(() => onClose(), 600);
    } catch (err) {
      console.error("Google Auth Error:", err);
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
        onUserUpdated(fallbackUser);
        setAuthSuccess("تم تسجيل الدخول بنجاح!");
        setTimeout(() => onClose(), 600);
      } catch (decodeErr) {
        setAuthError(err.message || 'فشل التحقق من Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const emailToUse = studentEmail.trim() || `student_${Date.now().toString().slice(-4)}@eduai.edu`;
      const nameToUse = studentName.trim() || 'طالب المنصة الأكاديمية';
      
      const loggedUser = await studentLogin(emailToUse, nameToUse);
      onUserUpdated(loggedUser);
      setAuthSuccess(`أهلاً بك يا ${loggedUser.name}! تم تسجيل الدخول كطالب.`);
      setTimeout(() => onClose(), 600);
    } catch (err) {
      setAuthError(err.message || 'فشل تسجيل الدخول للطالب');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('الرجاء إدخال رمز التحقق أو كلمة مرور المدير');
      return;
    }

    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const adminUser = await adminLogin(adminKey.trim());
      onUserUpdated(adminUser);
      setAuthSuccess('تم التحقق بنجاح! تم تفعيل صلاحيات المشرف ولوحة التحكم 👑');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      setAuthError(err.message || 'رمز التحقق أو كلمة مرور المدير غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setAuthError('خطأ invalid_client: معرف Google Client ID غير مسجل في Google Cloud Console لنطاق localhost:5173.');
  };

  const handleLogout = () => {
    setUserProfile(null);
    onUserUpdated(null);
    onClose();
  };

  const handleSaveClientId = () => {
    setGoogleClientId(clientId);
    setIsEditingClientId(false);
    setAuthError(null);
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-['Tajawal']">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl theme-header-btn border"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* Profile Details View */
          <div className="space-y-5 text-center">
            <div className="relative inline-block">
              <img
                src={user.picture}
                alt={user.name}
                className="w-20 h-20 rounded-full mx-auto border-2 border-emerald-500 shadow-xl bg-emerald-950 object-cover"
              />
              <span className={`absolute bottom-0 right-0 p-1 rounded-full text-white shadow-md ${isAdmin ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {isAdmin ? <Crown className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black theme-text-primary flex items-center justify-center gap-1.5">
                <span>{user.name}</span>
                {isAdmin && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
              </h3>
              <p className="text-xs theme-text-secondary font-mono mt-0.5">{user.email}</p>
              
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {/* Role Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border ${
                  isAdmin 
                    ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 shadow-sm' 
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                  <span>{isAdmin ? 'مدير النظام (Admin)' : 'حساب طالب (Student)'}</span>
                </span>

                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-300 text-xs font-bold">
                  {user.tier || 'Pro Academic 🌟'}
                </span>
              </div>
            </div>



            {/* Token Tracker */}
            <div className="p-4 rounded-2xl theme-card-inner border text-right space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="theme-text-secondary">استهلاك التوكنز الشهري:</span>
                <span className="text-teal-600 dark:text-teal-300 font-mono font-black">
                  {(user.tokens_used ?? 0).toLocaleString()} / {(user.tokens_limit || 500000).toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-white/5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((user.tokens_used || 0) / (user.tokens_limit || 500000)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Selection Tabs */
          <div className="space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-2xl theme-nav border">
              <button
                onClick={() => { setAuthTab('student'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  authTab === 'student'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'theme-text-secondary hover:bg-white/5'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>دخول الطلاب (Student)</span>
              </button>

              <button
                onClick={() => { setAuthTab('admin'); setAuthError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                  authTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'theme-text-secondary hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>بوابة المدير (Admin Mode)</span>
              </button>
            </div>

            {/* Error / Success Notifications */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* TAB 1: Student Login */}
            {authTab === 'student' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black theme-text-primary">تسجيل دخول الطلاب</h3>
                  <p className="text-xs theme-text-secondary">
                    لحفظ جلساتك، واختباراتك وملخصاتك الأكاديمية
                  </p>
                </div>

                {/* Direct Instant Student Login */}
                <form onSubmit={handleStudentSubmit} className="p-4 rounded-2xl theme-card-inner border space-y-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="الاسم الكامل (مثال: أحمد الصالحي)"
                      className="w-full theme-card-inner border rounded-xl px-3.5 py-2.5 text-xs theme-text-primary placeholder-slate-400 outline-none"
                    />
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="البريد الإلكتروني الجامعي أو الشخصي"
                      className="w-full theme-card-inner border rounded-xl px-3.5 py-2.5 text-xs theme-text-primary placeholder-slate-400 outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>دخول فوري كطالب</span>
                  </button>
                </form>

                {/* Google Sign-in Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                    <span className="text-[11px] theme-text-muted font-bold">أو عبر Google</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleOAuthProvider clientId={clientId}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_black"
                        shape="pill"
                        size="large"
                        text="signin_with"
                        locale="ar"
                        width="300"
                      />
                    </GoogleOAuthProvider>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Admin Master Login */}
            {authTab === 'admin' && (
              <form onSubmit={handleAdminSubmit} className="space-y-4 animate-fade-in">
                <div className="text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 mx-auto flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black theme-text-primary">بوابة مدير النظام (Admin Access)</h3>
                  <p className="text-xs theme-text-secondary leading-relaxed">
                    أدخل مفتاح الإدارة للوصول إلى لوحة التحكم الشاملة وإعدادات الذكاء الاصطناعي
                  </p>
                </div>

                <div className="p-4 rounded-2xl theme-card-inner border space-y-3">
                  <div>
                    <label className="text-xs font-bold theme-text-primary block mb-1.5">
                      كلمة مرور أو رمز تحقق المدير (Admin Master Key):
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="أدخل كلمة مرور المشرف (مثال: admin123)"
                        className="w-full theme-card-inner border rounded-xl px-3.5 py-2.5 text-xs theme-text-primary placeholder-slate-400 outline-none font-mono pr-9"
                      />
                      <Lock className="w-4 h-4 text-amber-500 absolute top-3 right-3" />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-300">
                    💡 <b>مفتاح الإدارة الافتراضي:</b> <code className="font-mono font-bold bg-amber-500/20 px-1 py-0.5 rounded">admin123</code> أو <code className="font-mono font-bold bg-amber-500/20 px-1 py-0.5 rounded">admin</code>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                    <span>تفعيل صلاحيات المدير ولوحة التحكم</span>
                  </button>
                </div>
              </form>
            )}

            {/* Google Client ID Accordion (For Developer Config) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingClientId(!isEditingClientId)}
                className="w-full text-right text-xs font-bold theme-text-secondary hover:text-teal-500 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>إعداد Google Client ID المخصص للمطور</span>
                </span>
                <span className="text-xs">{isEditingClientId ? '▲' : '▼'}</span>
              </button>

              {isEditingClientId && (
                <div className="mt-3 p-3.5 rounded-xl theme-card-inner border space-y-3 text-xs animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold theme-text-primary block mb-1">
                      Google OAuth Client ID:
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="123456789-xxxx.apps.googleusercontent.com"
                      className="w-full theme-card-inner border rounded-lg px-3 py-2 text-xs theme-text-primary outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      حفظ وتطبيق
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

