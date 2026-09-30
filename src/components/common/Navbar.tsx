/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { ActorRole } from '../../types';
import {
  Box,
  Store,
  Truck,
  ShieldCheck,
  Cpu,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  X,
  Layers,
  Sparkles,
  LogOut,
  User,
  Home,
  Package,
  PackageCheck,
  KeyRound,
  FilePlus2,
  Activity,
  Sliders,
  MessageSquare,
} from 'lucide-react';

export const Navbar: React.FC<{
  onOpenHardwareModal: () => void;
}> = ({ onOpenHardwareModal }) => {
  const {
    role,
    setRole,
    customerView,
    setCustomerView,
    adminView,
    setAdminView,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    hardwareSim,
    openMerchantChat,
    selectedMerchantId,
    activeConversation,
  } = useApp();

  const {
    currentUser,
    logout,
    switchDemoRole,
    isDemoMode,
    setIsDemoMode,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);

  // Quick roles metadata for Demo Mode
  const demoRoleItems: { id: ActorRole; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'CUSTOMER',
      label: 'العميل (Customer)',
      icon: <User className="w-3.5 h-3.5" />,
      color: 'text-cyan-400 bg-cyan-950/80 border-cyan-700',
    },
    {
      id: 'MERCHANT',
      label: 'التاجر (Merchant)',
      icon: <Store className="w-3.5 h-3.5" />,
      color: 'text-emerald-400 bg-emerald-950/80 border-emerald-700',
    },
    {
      id: 'DRIVER',
      label: 'المندوب (Driver)',
      icon: <Truck className="w-3.5 h-3.5" />,
      color: 'text-amber-400 bg-amber-950/80 border-amber-700',
    },
    {
      id: 'ADMIN',
      label: 'المدير (Admin)',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      color: 'text-blue-400 bg-blue-950/80 border-blue-700',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b1320]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 shadow-md shadow-cyan-900/30 border border-cyan-400/40">
              <Box className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0b1320]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-['Cairo']">
                  توصيل
                </span>
                <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/50">
                  SMART BOX V3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden lg:block">
                منصة التوصيل المؤتمت والصناديق الذكية
              </p>
            </div>
          </div>

          {/* Normal Role-Specific Navigation (NO GLOBAL ROLE SWITCHER HERE) */}
          <div className="hidden md:flex items-center gap-1">
            {role === 'CUSTOMER' && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <button
                  onClick={() => setCustomerView('HOME')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'HOME'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>الرئيسية</span>
                </button>
                <button
                  id="desktop-nav-orders"
                  onClick={() => setCustomerView('ORDERS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'ORDERS' || customerView === 'ORDER_DETAILS'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>طلباتي</span>
                </button>
                <button
                  onClick={() => setCustomerView('TRACKING')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'TRACKING'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>تتبع الشحنة</span>
                </button>
                <button
                  onClick={() => setCustomerView('BOXES')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'BOXES'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>الصناديق والتفويض</span>
                </button>
                <button
                  onClick={() => setCustomerView('EXTERNAL_ORDER')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'EXTERNAL_ORDER'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span>شحنة خارجية</span>
                </button>
                <button
                  onClick={() => setCustomerView('MERCHANT_LIST')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'MERCHANT_LIST' || customerView === 'MERCHANT_PROFILE'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>المتاجر</span>
                </button>
                <button
                  onClick={() => {
                    const targetMerchId = selectedMerchantId || activeConversation?.merchantId || 'merch-5';
                    openMerchantChat(targetMerchId);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    customerView === 'CHAT'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>الدردشة والطلب</span>
                </button>
              </div>
            )}

            {role === 'MERCHANT' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <Store className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">بوابة التاجر والمستودع</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-mono text-[11px]">ربط Webhook نشط</span>
              </div>
            )}

            {role === 'DRIVER' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <Truck className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">تطبيق المندوب الميداني</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-300 font-mono text-[11px]">كود C-4091</span>
              </div>
            )}

            {role === 'ADMIN' && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <button
                  onClick={() => setAdminView('CONTROL_TOWER')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    adminView === 'CONTROL_TOWER'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  العمليات
                </button>
                <button
                  onClick={() => setAdminView('FLEET')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    adminView === 'FLEET'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  الأسطول
                </button>
                <button
                  onClick={() => setAdminView('SECURITY')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    adminView === 'SECURITY'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  مركز الأمان
                </button>
                <button
                  onClick={() => setAdminView('AUDIT')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    adminView === 'AUDIT'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  سجل التدقيق
                </button>
                <button
                  onClick={() => setAdminView('DIRECTORY')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                    adminView === 'DIRECTORY'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  الدليل والطلبات
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Demo Mode Toggle, User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo / Developer Mode Toggle Button */}
            <button
              id="demo-mode-toggle-btn"
              onClick={() => setIsDemoMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isDemoMode
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-sm shadow-amber-900/40'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
              title="تفعيل/إلغاء وضع تجربة السيناريو والمطورين"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">وضع التجربة (Demo)</span>
              <span className="sm:hidden">تجربة</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </button>

            {/* IoT Telemetry Indicator - visible only for Admin or in Demo Mode */}
            {(role === 'ADMIN' || isDemoMode) && (
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-mono">MQTT: 8ms</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400 font-mono">BOX-102: 4G</span>
              </div>
            )}

            {/* Hardware Simulator Trigger Button - visible only for Admin or in Demo Mode */}
            {(role === 'ADMIN' || isDemoMode) && (
              <button
                id="hardware-sim-btn"
                onClick={onOpenHardwareModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                  hardwareSim.isTamperTriggered || hardwareSim.sirenActive
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                    : !hardwareSim.isSolenoidLocked
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="محاكي أجهزة الصندوق الذكي"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden lg:inline">محاكي العتاد</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    !hardwareSim.isSolenoidLocked ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                />
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="notifications-toggle-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="التنبيهات والأحداث"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0f1a2e] border border-slate-700 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-100">التنبيهات والأحداث اللحظية</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300"
                      >
                        تحديد الكل كمقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد تنبيهات حالياً</p>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markNotificationRead(item.id)}
                          className={`p-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors ${
                            !item.read ? 'bg-cyan-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5">
                              {item.type === 'SECURITY' ? (
                                <AlertTriangle className="w-4 h-4 text-rose-400" />
                              ) : item.type === 'DELIVERY' ? (
                                <Truck className="w-4 h-4 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                              )}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-200 truncate">{item.title}</h4>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {item.timestamp}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logged In User Profile Pill */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-semibold leading-none">
                    {role === 'CUSTOMER'
                      ? 'العميل'
                      : role === 'MERCHANT'
                      ? 'التاجر'
                      : role === 'DRIVER'
                      ? 'المندوب'
                      : 'مدير النظام'}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  id="navbar-logout-btn"
                  onClick={logout}
                  className="mr-1 p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-transparent hover:border-rose-800 transition-all"
                  title="تسجيل الخروج والعودة لشاشة الدخول"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer / Demo Mode Panel (ONLY visible when isDemoMode is toggled ON) */}
      {isDemoMode && (
        <div className="bg-slate-900/95 border-t border-amber-900/50 px-3 sm:px-6 py-2 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>أدوات المطورين وبيئة التجربة (Demo Quick Role Switcher):</span>
            </div>

            {/* Quick Switch Buttons for all 4 roles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {demoRoleItems.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    id={`demo-switch-${r.id.toLowerCase()}`}
                    onClick={() => {
                      switchDemoRole(r.id);
                      setRole(r.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isActive
                        ? `${r.color} shadow-sm ring-1 ring-white/20`
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
