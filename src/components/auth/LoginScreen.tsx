/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS, RegisterUserData } from '../../context/AuthContext';
import {
  Box,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  Store,
  Truck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Database,
  UserPlus,
  Phone,
  Building,
  Tag,
  MapPin,
  Check,
  Eye as EyeIcon,
  X,
  Copy,
  Code,
} from 'lucide-react';
import { ActorRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const {
    login,
    signup,
    loginWithGoogle,
    hideDemoAccounts,
    setHideDemoAccounts,
    isSupabaseActive,
    customAccounts,
    configureSupabaseConnection,
    clearSupabaseConnection,
    supabaseCredentials,
  } = useAuth();

  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseCredentials?.url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseCredentials?.key || '');
  const [supabaseSaveMsg, setSupabaseSaveMsg] = useState<string | null>(null);
  const [showSqlMigration, setShowSqlMigration] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Tab mode: 'LOGIN' or 'SIGNUP'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Sign in state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up state
  const [signupRole, setSignupRole] = useState<ActorRole>('CUSTOMER');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupBusinessName, setSignupBusinessName] = useState('');
  const [signupCategory, setSignupCategory] = useState('مطاعم ومأكولات');
  const [signupAddress, setSignupAddress] = useState('');

  const [registeredSuccess, setRegisteredSuccess] = useState<{
    user: any;
    password?: string;
    businessName?: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setErrorMessage(res.error || 'تعذر تسجيل الدخول بحساب Google.');
    }
    setIsGoogleLoading(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signupName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMessage('يرجى إدخال كلمة مرور مكونة من 6 أحرف أو أرقام على الأقل.');
      return;
    }
    if (signupRole === 'MERCHANT' && !signupBusinessName.trim()) {
      setErrorMessage('يرجى كتابة اسم المتجر أو العلامة التجارية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: RegisterUserData = {
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: signupRole,
        phone: signupPhone.trim() || '+20 100 000 0000',
        businessName: signupRole === 'MERCHANT' ? signupBusinessName.trim() : undefined,
        category: signupRole === 'MERCHANT' ? signupCategory : undefined,
        address: signupAddress.trim() || undefined,
      };

      // Call signup with autoLogin: false so user sees the confirmation screen
      const res = await signup(data, false);
      if (res.success && res.user) {
        setRegisteredSuccess({
          user: res.user,
          password: signupPassword,
          businessName: signupRole === 'MERCHANT' ? signupBusinessName.trim() : undefined,
        });
        setSuccessMessage('✓ تم إنشاء وتوثيق الحساب بنجاح في قاعدة البيانات!');
      } else {
        setErrorMessage(res.error || 'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء الحساب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSelect = (email: string, pass: string) => {
    setAuthMode('LOGIN');
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleInstantQuickLogin = async (email: string, pass: string) => {
    setAuthMode('LOGIN');
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, pass, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-['Cairo'] antialiased selection:bg-cyan-500 selection:text-slate-950"
      dir="rtl"
    >
      {/* Background Decorative Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 shadow-lg shadow-cyan-900/30 border border-cyan-400/40">
            <Box className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">3al-BaB</span>
              <span className="text-lg font-bold text-slate-300">عالباب</span>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-800/50">
                3AL-BAB V3
              </span>
            </div>
            <p className="text-xs text-slate-400">منصة التوصيل المؤتمت والصناديق الذكية</p>
          </div>
        </div>

        {/* Database & Cloud Connection Indicator */}
        <div className="flex items-center gap-2">
          {isSupabaseActive ? (
            <button
              type="button"
              onClick={() => {
                setSupabaseUrlInput(supabaseCredentials?.url || '');
                setSupabaseKeyInput(supabaseCredentials?.key || '');
                setSupabaseSaveMsg(null);
                setShowSupabaseModal(true);
              }}
              className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900/60 border border-emerald-800 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
              title="إعدادات قاعدة بيانات Supabase المتصلة"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">Supabase متصل ✓</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSupabaseUrlInput(supabaseCredentials?.url || '');
                setSupabaseKeyInput(supabaseCredentials?.key || '');
                setSupabaseSaveMsg(null);
                setShowSupabaseModal(true);
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-800/80 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
              title="قاعدة بيانات 3al-BaB المحلية نشطة مع إمكانية ربط مشروع Supabase الخارجي"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">قاعدة بيانات نشطة ✓ (ربط Supabase)</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Main Card */}
          <div className="rounded-3xl bg-[#0b1320]/90 border border-slate-800 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
            {/* Mode Switch Tabs: Login vs Sign Up */}
            <div className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'LOGIN'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                type="button"
                id="tab-signup-btn"
                onClick={() => {
                  setAuthMode('SIGNUP');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'SIGNUP'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب جديد</span>
              </button>
            </div>

            {/* Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {authMode === 'LOGIN' ? 'مرحباً بك مجدداً في عالباب' : 'إنشاء حساب جديد وتجربة المنصة'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                {authMode === 'LOGIN'
                  ? 'أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بدورك'
                  : 'اختر دورك (عميل، تاجر، مندوب) وسيتم توجيهك فوراً للواجهة المستقلة'}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ---------------- LOGIN FORM ---------------- */}
            {authMode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-identifier-input"
                      type="text"
                      dir="ltr"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="customer@demo.tawseel أو بريدك الإلكتروني"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl pr-10 pl-3.5 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">كلمة المرور</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl pr-10 pl-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="login-remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400">تذكرني في هذه الجلسة</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ التحقق والدخول...</span>
                    </div>
                  ) : (
                    <>
                      <span>تسجيل الدخول</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ---------------- SIGN UP FORM & SUCCESS CARD ---------------- */}
            {authMode === 'SIGNUP' && registeredSuccess && (
              <div
                id="registration-success-card"
                className="space-y-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/60 text-right animate-in fade-in zoom-in-95 shadow-2xl"
              >
                <div className="flex items-center gap-3.5 pb-4 border-b border-emerald-800/50">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/80">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      تم التسجيل والحفظ في قاعدة البيانات بنجاح ✓
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white mt-1 font-['Cairo']">
                      {registeredSuccess.user.role === 'MERCHANT'
                        ? `حساب تاجر معتمد: ${registeredSuccess.businessName || registeredSuccess.user.name}`
                        : registeredSuccess.user.role === 'DRIVER'
                        ? `حساب كابتن توصيل: ${registeredSuccess.user.name}`
                        : `حساب عميل معتمد: ${registeredSuccess.user.name}`}
                    </h2>
                    <p className="text-xs text-slate-300">
                      تم توثيق الهوية وحفظ الملف الشخصي في قاعدة بيانات المنصة.
                    </p>
                  </div>
                </div>

                {/* Account Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-medium">اسم الحساب:</span>
                    <span className="font-bold text-white text-xs">{registeredSuccess.user.name}</span>
                  </div>
                  {registeredSuccess.businessName && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block font-medium">اسم المتجر / العلامة:</span>
                      <span className="font-bold text-amber-300 text-xs">{registeredSuccess.businessName}</span>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-medium">البريد الإلكتروني:</span>
                    <span className="font-mono text-cyan-300 text-xs font-bold">{registeredSuccess.user.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-medium">رقم الهاتف:</span>
                    <span className="font-mono text-slate-300 text-xs">{registeredSuccess.user.phone || '+20 100 000 0000'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 sm:col-span-2">
                    <span className="text-slate-400 text-[10px] block font-medium">المعرف المعتمد (UUID):</span>
                    <span className="font-mono text-slate-300 text-[11px] select-all break-all">{registeredSuccess.user.id}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-medium">حالة قاعدة البيانات:</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        {isSupabaseActive
                          ? 'قاعدة بيانات Supabase السحابية (متصلة ومحدثة) ✓'
                          : 'قاعدة بيانات 3al-BaB المحلية الآمنة (متصلة ومحدثة) ✓'}
                      </span>
                    </div>
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    id="enter-dashboard-now-btn"
                    onClick={() => handleInstantQuickLogin(registeredSuccess.user.email, registeredSuccess.password || '')}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>الدخول إلى لوحة التحكم الخاصة بك الآن 🚀</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="login-with-created-account-btn"
                      onClick={() => {
                        setAuthMode('LOGIN');
                        setIdentifier(registeredSuccess.user.email);
                        setPassword(registeredSuccess.password || '');
                        setRegisteredSuccess(null);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تسجيل الدخول يدوياً</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRegisteredSuccess(null);
                        setSignupName('');
                        setSignupEmail('');
                        setSignupPassword('');
                        setSignupBusinessName('');
                        setSignupAddress('');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                      <span>إنشاء حساب آخر</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SIGN UP FORM ---------------- */}
            {authMode === 'SIGNUP' && !registeredSuccess && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                {/* Role Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    اختر نوع الحساب الذي ترغب بإنشائه:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      id="signup-role-customer"
                      onClick={() => setSignupRole('CUSTOMER')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        signupRole === 'CUSTOMER'
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-md shadow-cyan-950/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <User className={`w-5 h-5 ${signupRole === 'CUSTOMER' ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">عميل</span>
                      <span className="text-[10px] text-slate-400">طلب واستلام</span>
                    </button>

                    <button
                      type="button"
                      id="signup-role-merchant"
                      onClick={() => setSignupRole('MERCHANT')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        signupRole === 'MERCHANT'
                          ? 'border-amber-400 bg-amber-950/60 text-white shadow-md shadow-amber-950/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Store className={`w-5 h-5 ${signupRole === 'MERCHANT' ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">تاجر / متجر</span>
                      <span className="text-[10px] text-slate-400">إدارة الطلبات</span>
                    </button>

                    <button
                      type="button"
                      id="signup-role-driver"
                      onClick={() => setSignupRole('DRIVER')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        signupRole === 'DRIVER'
                          ? 'border-emerald-400 bg-emerald-950/60 text-white shadow-md shadow-emerald-950/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Truck className={`w-5 h-5 ${signupRole === 'DRIVER' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">مندوب توصيل</span>
                      <span className="text-[10px] text-slate-400">إيداع ومهام</span>
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {signupRole === 'MERCHANT' ? 'اسم صاحب المتجر / المدير' : 'الاسم بالكامل'}
                  </label>
                  <input
                    id="signup-name-input"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="مثال: محمد علي"
                    className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                  />
                </div>

                {/* Merchant Specific: Business Name & Category */}
                {signupRole === 'MERCHANT' && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-900/50 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>اسم المتجر أو العلامة التجارية:</span>
                      </label>
                      <input
                        id="signup-business-name-input"
                        type="text"
                        value={signupBusinessName}
                        onChange={(e) => setSignupBusinessName(e.target.value)}
                        placeholder="مثال: مطعم ساراي، صيدلية السلام..."
                        className="w-full bg-slate-950/80 border border-amber-800/80 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>نوع النشاط:</span>
                        </label>
                        <select
                          value={signupCategory}
                          onChange={(e) => setSignupCategory(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="مطاعم ومأكولات">مطاعم ومأكولات</option>
                          <option value="صيدليات ومستلزمات طبية">صيدليات ومستلزمات طبية</option>
                          <option value="أجهزة وإلكترونيات">أجهزة وإلكترونيات</option>
                          <option value="سوبرماركت ومؤن غذائية">سوبرماركت ومؤن غذائية</option>
                          <option value="أزياء وملابس">أزياء وملابس</option>
                          <option value="متاجر متنوعة">متاجر متنوعة</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>الفرع / العنوان:</span>
                        </label>
                        <input
                          type="text"
                          value={signupAddress}
                          onChange={(e) => setSignupAddress(e.target.value)}
                          placeholder="مثال: التجمع الخامس، شارع التسعين"
                          className="w-full bg-slate-950/80 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                    <input
                      id="signup-email-input"
                      type="email"
                      dir="ltr"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                    <input
                      id="signup-phone-input"
                      type="tel"
                      dir="ltr"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+20 100 123 4567"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور</label>
                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="6 أحرف أو أرقام على الأقل"
                      className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-500 rounded-xl pr-3.5 pl-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Sign up */}
                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ إنشاء الحساب والدخول...</span>
                    </div>
                  ) : (
                    <>
                      <span>إنشاء الحساب وبدء التجربة</span>
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Google Sign-In */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                id="login-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>تسجيل الدخول السريع بحساب Google</span>
              </button>
            </div>

            {/* Custom Registered Accounts Section (If user has created accounts) */}
            {customAccounts.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>حساباتك المنشأة حديثاً ({customAccounts.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                    حسابات مخصصة
                  </span>
                </div>

                <div className="space-y-2">
                  {customAccounts.map((acc: any) => (
                    <div
                      key={acc.email}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            acc.role === 'CUSTOMER'
                              ? 'bg-cyan-950 text-cyan-400'
                              : acc.role === 'MERCHANT'
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-emerald-950 text-emerald-400'
                          }`}
                        >
                          {acc.role === 'CUSTOMER' ? (
                            <User className="w-3.5 h-3.5" />
                          ) : acc.role === 'MERCHANT' ? (
                            <Store className="w-3.5 h-3.5" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{acc.user?.name || acc.email}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({acc.role})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{acc.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInstantQuickLogin(acc.email, acc.password)}
                        className="py-1 px-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 font-bold text-xs transition-colors cursor-pointer"
                      >
                        دخول
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Demo Accounts Switch */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>الحسابات التجريبية (Demo Accounts):</span>
              </span>
              <button
                type="button"
                id="toggle-hide-demo-accounts"
                onClick={() => setHideDemoAccounts(!hideDemoAccounts)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  hideDemoAccounts
                    ? 'bg-slate-900 border-slate-700 text-slate-400'
                    : 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
                }`}
              >
                {hideDemoAccounts ? 'إظهار الحسابات التجريبية' : 'إخفاء الحسابات التجريبية'}
              </button>
            </div>

            {/* Demo Accounts List (Shown only if not hidden) */}
            {!hideDemoAccounts && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCustomer = acc.role === 'CUSTOMER';
                  const isMerchant = acc.role === 'MERCHANT';
                  const isDriver = acc.role === 'DRIVER';

                  const icon = isCustomer ? (
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                  ) : isMerchant ? (
                    <Store className="w-3.5 h-3.5 text-amber-400" />
                  ) : isDriver ? (
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  );

                  const activeBorder =
                    identifier === acc.email
                      ? 'border-cyan-500/70 bg-cyan-950/30'
                      : 'border-slate-800 bg-slate-900/60';

                  return (
                    <div
                      key={acc.role}
                      className={`p-2.5 rounded-xl border ${activeBorder} hover:border-slate-700 transition-all flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                            {icon}
                            <span>
                              {acc.role === 'CUSTOMER'
                                ? 'العميل'
                                : acc.role === 'MERCHANT'
                                ? 'التاجر'
                                : acc.role === 'DRIVER'
                                ? 'المندوب'
                                : 'المدير'}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{acc.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{acc.email}</p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickDemoSelect(acc.email, acc.password)}
                          className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          تعبئة
                        </button>
                        <button
                          type="button"
                          id={`quick-login-${acc.role.toLowerCase()}`}
                          onClick={() => handleInstantQuickLogin(acc.email, acc.password)}
                          className="flex-1 py-1 px-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          دخول فوري
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prototype / Demo Notice */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400">
            <p className="text-[11px] leading-relaxed">
              يمكنك إنشاء حساباتك المخصصة لكل دور وتجربة سير العمل الكامل لكل مستخدم بصورة منفصلة ومحمية بالكامل.
            </p>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal (UI Simulation) */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-right">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-3">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">استعادة كلمة المرور</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              يمكنك تسجيل الدخول بالحسابات المنشأة أو استخدام الحسابات التجريبية بنقرة واحدة.
            </p>
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              العودة لشاشة الدخول
            </button>
          </div>
        </div>
      )}

      {/* Supabase Integration & Schema Settings Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d1627] border border-cyan-800/60 p-5 sm:p-6 shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-['Cairo']">
                    ربط قاعدة بيانات Supabase (3al-BaB Integration)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    مزامنة الحسابات الحقيقية لجميع الأدوار: العميل، التاجر، المندوب، والمدير.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Status Banner */}
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                isSupabaseActive
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSupabaseActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="font-bold">
                  {isSupabaseActive
                    ? 'قاعدة بيانات Supabase متصلة ومفعلة ✓'
                    : 'الوضع الحالي: تخزين ومصادقة محلية مشفرة (Local / Hybrid)'}
                </span>
              </div>
              {isSupabaseActive && (
                <button
                  type="button"
                  onClick={() => {
                    clearSupabaseConnection();
                    setSupabaseUrlInput('');
                    setSupabaseKeyInput('');
                    setSupabaseSaveMsg('تم فصل الاتصال والعودة للوضع المحلي.');
                  }}
                  className="text-[11px] text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  فصل الاتصال
                </button>
              )}
            </div>

            {supabaseSaveMsg && (
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs">
                {supabaseSaveMsg}
              </div>
            )}

            {/* Configuration Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رابط المشروع (Supabase Project URL)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://your-project-id.supabase.co"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المفتاح العام للمشروع (Supabase Anon Key)
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
                      setSupabaseSaveMsg('يرجى إدخال الرابط والمفتاح معاً.');
                      return;
                    }
                    const ok = configureSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
                    if (ok) {
                      setSupabaseSaveMsg('تم حفظ البيانات والاتصال بـ Supabase بنجاح!');
                    } else {
                      setSupabaseSaveMsg('يرجى التحقق من صحة رابط المشروع والمفتاح.');
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  حفظ وتفعيل الاتصال
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlMigration(!showSqlMigration)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{showSqlMigration ? 'إخفاء كود الـ SQL' : 'عرض كود الجداول SQL'}</span>
                </button>
              </div>
            </div>

            {/* SQL Migration Viewer & Copy Button */}
            {showSqlMigration && (
              <div className="space-y-2 pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">
                    انسخ هذا الكود والصقه في محرّر الـ SQL بمشروعك على Supabase لإنشاء الجداول وسياسات الأمان RLS:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const sqlContent = `-- 3al-BaB Profiles, Merchants, Drivers Schema Migration
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'MERCHANT', 'DRIVER', 'ADMIN')),
  phone TEXT,
  business_name TEXT,
  category TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  owner_name TEXT,
  category TEXT DEFAULT 'متاجر متنوعة',
  address TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 5.0,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle TEXT DEFAULT 'سكوتر كهربائي ذكي',
  code TEXT UNIQUE,
  status TEXT DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Profiles access policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND (role != 'ADMIN' OR public.is_admin()));
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Merchants read policy" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Merchants write policy" ON public.merchants FOR ALL USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Drivers read policy" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Drivers write policy" ON public.drivers FOR ALL USING (auth.uid() = id OR public.is_admin());`;
                      navigator.clipboard.writeText(sqlContent);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-bold cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-48 overflow-y-auto" dir="ltr">
                  <pre>{`-- 3al-BaB Profiles & Roles Migration
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER'
);
CREATE TABLE IF NOT EXISTS public.merchants ( ... );
CREATE TABLE IF NOT EXISTS public.drivers ( ... );`}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        <span>منصة عالباب الذكية (3al-BaB Smart Delivery Platform v3.0) • جميع الحقوق محفوظة 2026</span>
      </footer>
    </div>
  );
};
