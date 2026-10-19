/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
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
} from 'lucide-react';
import { ActorRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setErrorMessage(res.error || 'تعذر تسجيل الدخول بحساب Google.');
    }
    setIsGoogleLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني أو رقم الهاتف.');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = login(identifier, password, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'فشل تسجيل الدخول، يرجى التأكد من البيانات.');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const handleQuickDemoSelect = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleInstantQuickLogin = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage(null);
    setIsSubmitting(true);
    setTimeout(() => {
      login(email, pass, true);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-['Cairo'] antialiased selection:bg-cyan-500 selection:text-slate-950" dir="rtl">
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

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">نظام الدخول الموحد المشفر</span>
          <span className="text-emerald-400 font-mono font-bold">256-bit Secure</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="rounded-3xl bg-[#0b1320]/90 border border-slate-800 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-white">تسجيل الدخول</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                أدخل بياناتك للوصول إلى لوحة التحكم الخاصة بحسابك
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier (Email or Phone) */}
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
                    placeholder="customer@demo.tawseel أو 0100..."
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

            {/* Google Sign-In */}
            <div className="mt-3">
              <button
                id="login-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
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

            {/* Quick Demo Access Header */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0b1320] px-3 text-slate-400 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>حسابات تجريبية للاختبار السريع (Demo Accounts)</span>
                </span>
              </div>
            </div>

            {/* Quick Role Selector Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isCustomer = acc.role === 'CUSTOMER';
                const isMerchant = acc.role === 'MERCHANT';
                const isDriver = acc.role === 'DRIVER';
                const isAdmin = acc.role === 'ADMIN';

                const icon = isCustomer ? (
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                ) : isMerchant ? (
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                ) : isDriver ? (
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                );

                const activeBorder = identifier === acc.email ? 'border-cyan-500/70 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/60';

                return (
                  <div
                    key={acc.role}
                    className={`p-2.5 rounded-xl border ${activeBorder} hover:border-slate-700 transition-all flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                          {icon}
                          <span>{acc.role === 'CUSTOMER' ? 'العميل' : acc.role === 'MERCHANT' ? 'التاجر' : acc.role === 'DRIVER' ? 'المندوب' : 'المدير'}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{acc.role}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-mono">{acc.email}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoSelect(acc.email, acc.password)}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                      >
                        تعبئة
                      </button>
                      <button
                        type="button"
                        id={`quick-login-${acc.role.toLowerCase()}`}
                        onClick={() => handleInstantQuickLogin(acc.email, acc.password)}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold transition-colors"
                      >
                        دخول فوري
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prototype / Demo Notice */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400">
            <p className="text-[11px] leading-relaxed">
              بيئة تجريبية تفاعلية. يمكنك استخدام &quot;تعبئة&quot; أو &quot;دخول فوري&quot; لتسجيل الدخول بأي حساب تجريبي دون الحاجة لكتابة البيانات يدوياً.
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
            <h3 className="text-base font-bold text-white mb-2">استعادة كلمة المرور (تجريبي)</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              في هذه النسخة التجريبية، يمكنك النقر على &quot;دخول فوري&quot; أو &quot;تعبئة&quot; في بطاقة الحساب المناسب بالأسفل لتسجيل الدخول مباشرةً.
            </p>
            <p className="text-[11px] text-slate-500 mb-5">
              سيتم تفعيل خدمة التحقق عبر الرسائل النصية القصيرة (SMS OTP) في بيئة الإنتاج.
            </p>
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
            >
              العودة لشاشة الدخول
            </button>
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
