/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Navbar } from './components/common/Navbar';
import { DemoWorkflowBar } from './components/common/DemoWorkflowBar';
import { SimulatedBoxWidget } from './components/common/SimulatedBoxWidget';

// Customer screens
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerStore } from './components/customer/CustomerStore';
import { CustomerCheckout } from './components/customer/CustomerCheckout';
import { CustomerTracking } from './components/customer/CustomerTracking';
import { CustomerBoxes } from './components/customer/CustomerBoxes';
import { CustomerExternalOrder } from './components/customer/CustomerExternalOrder';
import { CustomerMerchantList } from './components/customer/CustomerMerchantList';
import { CustomerMerchantProfile } from './components/customer/CustomerMerchantProfile';
import { CustomerChat } from './components/customer/CustomerChat';
import { CustomerOrders } from './components/customer/CustomerOrders';
import { CustomerOrderDetails } from './components/customer/CustomerOrderDetails';
import { CustomerAccount } from './components/customer/CustomerAccount';
import { CustomerMobileNav } from './components/customer/CustomerMobileNav';

// Merchant screen
import { MerchantDashboard } from './components/merchant/MerchantDashboard';

// Driver screen
import { DriverDeliveryView } from './components/driver/DriverDeliveryView';

// Admin screens
import { AdminControlTower } from './components/admin/AdminControlTower';
import { AdminFleetTelematics } from './components/admin/AdminFleetTelematics';
import { AdminSecurityCenter } from './components/admin/AdminSecurityCenter';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { AdminDirectory } from './components/admin/AdminDirectory';
import { ToastNotifications } from './components/common/ToastNotifications';

import { Cpu, ShieldAlert, X, Box, RefreshCw } from 'lucide-react';
import { ActorRole } from './types';

const MainContent: React.FC = () => {
  const {
    role,
    setRole,
    customerView,
    adminView,
    notifications,
    hardwareSim,
  } = useApp();

  const {
    isAuthenticated,
    currentUser,
    isProfileLoading,
    profileError,
    refreshProfile,
    logout,
    unauthorizedNotice,
    setUnauthorizedNotice,
    isDemoMode,
    hideDemoAccounts,
  } = useAuth();

  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);

  // Sync role with authenticated user when currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.role !== role) {
      setRole(currentUser.role);
    }
  }, [currentUser, role, setRole]);

  // Route protection via URL Hash listener
  useEffect(() => {
    if (!currentUser) return;

    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (!hash) return;

      const userRole = currentUser.role;

      const isTryingCustomer = hash.includes('/customer');
      const isTryingMerchant = hash.includes('/merchant');
      const isTryingDriver = hash.includes('/driver');
      const isTryingAdmin = hash.includes('/admin');

      let isViolation = false;

      if (userRole === 'CUSTOMER' && (isTryingMerchant || isTryingDriver || isTryingAdmin)) {
        isViolation = true;
        window.location.hash = '#/customer';
      } else if (userRole === 'MERCHANT' && (isTryingCustomer || isTryingDriver || isTryingAdmin)) {
        isViolation = true;
        window.location.hash = '#/merchant';
      } else if (userRole === 'DRIVER' && (isTryingCustomer || isTryingMerchant || isTryingAdmin)) {
        isViolation = true;
        window.location.hash = '#/driver';
      } else if (userRole === 'ADMIN' && (isTryingCustomer || isTryingMerchant || isTryingDriver)) {
        isViolation = true;
        window.location.hash = '#/admin';
      }

      if (isViolation) {
        setUnauthorizedNotice(
          'غير مصرح لك بالدخول إلى هذه الصفحة. تم منع الوصول وإعادتك للوحة التحكم المصرح بها لدورك.'
        );
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Check initial hash
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser, setUnauthorizedNotice]);

  // Loading state while verifying identity and retrieving profile from database
  if (isProfileLoading) {
    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-['Cairo'] antialiased p-6 text-center select-none"
        dir="rtl"
      >
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 border border-cyan-400/40 animate-pulse">
            <Box className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
        </div>
        <h2 className="text-xl font-black text-white mb-2 tracking-tight">3al-BaB • منصة عالباب الذكية</h2>
        <p className="text-xs text-slate-400 mb-5 max-w-sm">
          جارٍ استرجاع الملف الشخصي والتحقق من هوية الحساب المعتمدة...
        </p>
        <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="w-full h-full bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse" />
        </div>
      </div>
    );
  }

  // Explicit recovery screen if authenticated but profile record cannot be found
  if (isAuthenticated && !currentUser) {
    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-['Cairo'] antialiased p-6 text-center"
        dir="rtl"
      >
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white font-['Cairo']">تعذر استرجاع الملف الشخصي</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            تم تسجيل الدخول بنجاح ولكن لم يتم العثور على سجل الملف الشخصي لهذا الحساب، أو تعذر الاتصال ببيانات المستخدم.
          </p>
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={refreshProfile}
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            <button
              onClick={logout}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show professional demo Login Screen
  if (!isAuthenticated || !currentUser) {
    return <LoginScreen />;
  }

  // Active authorized role
  const effectiveRole: ActorRole = currentUser.role;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo'] antialiased selection:bg-cyan-500 selection:text-slate-950" dir="rtl">
      {/* Top Main Navigation (No general role switcher in normal UI) */}
      <Navbar onOpenHardwareModal={() => setIsHardwareModalOpen(true)} />

      {/* Guided 15-Step Full Delivery Workflow Bar - visible only in Demo Mode when demo accounts are enabled */}
      {isDemoMode && !hideDemoAccounts && <DemoWorkflowBar />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {/* Route Access Denial Notification */}
        {unauthorizedNotice && (
          <div
            id="unauthorized-access-banner"
            className="mb-6 p-4 rounded-2xl bg-rose-950/90 border border-rose-600/80 text-rose-200 text-xs sm:text-sm flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-900/60 border border-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">غير مصرح لك بالدخول إلى هذه الصفحة</p>
                <p className="text-xs text-rose-300 mt-0.5">{unauthorizedNotice}</p>
              </div>
            </div>
            <button
              onClick={() => setUnauthorizedNotice(null)}
              className="p-1.5 rounded-lg hover:bg-rose-900/80 text-rose-300 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Customer Role Views - strictly guarded */}
        {effectiveRole === 'CUSTOMER' && (
          <>
            {customerView === 'HOME' && <CustomerHome />}
            {customerView === 'STORE' && <CustomerStore />}
            {customerView === 'CHECKOUT' && <CustomerCheckout />}
            {customerView === 'TRACKING' && <CustomerTracking />}
            {customerView === 'BOXES' && <CustomerBoxes />}
            {customerView === 'EXTERNAL_ORDER' && <CustomerExternalOrder />}
            {customerView === 'MERCHANT_LIST' && <CustomerMerchantList />}
            {customerView === 'MERCHANT_PROFILE' && <CustomerMerchantProfile />}
            {customerView === 'CHAT' && <CustomerChat />}
            {customerView === 'ORDERS' && <CustomerOrders />}
            {customerView === 'ORDER_DETAILS' && <CustomerOrderDetails />}
            {customerView === 'ACCOUNT' && <CustomerAccount />}
          </>
        )}

        {/* Merchant Role Views - strictly guarded */}
        {effectiveRole === 'MERCHANT' && <MerchantDashboard />}

        {/* Driver Role Views - strictly guarded */}
        {effectiveRole === 'DRIVER' && <DriverDeliveryView />}

        {/* Admin Role Views - strictly guarded */}
        {effectiveRole === 'ADMIN' && (
          <>
            {adminView === 'CONTROL_TOWER' && <AdminControlTower />}
            {adminView === 'FLEET' && <AdminFleetTelematics />}
            {adminView === 'SECURITY' && <AdminSecurityCenter />}
            {adminView === 'AUDIT' && <AdminAuditLogs />}
            {adminView === 'DIRECTORY' && <AdminDirectory />}
          </>
        )}
      </main>

      {/* Customer Mobile Navigation (Visible only on mobile for Customer role) */}
      {effectiveRole === 'CUSTOMER' && <CustomerMobileNav />}

      {/* Floating IoT Hardware Simulator Trigger Pill - visible only for Admin or when in Demo Mode */}
      {(effectiveRole === 'ADMIN' || isDemoMode) && (
        <div className="fixed bottom-4 left-4 z-40">
          <button
            id="toggle-hardware-sim-fab"
            onClick={() => setIsHardwareModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl backdrop-blur-md transition-all hover:scale-105"
          >
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>محاكي العتاد الذكي IoT</span>
            <span
              className={`w-2 h-2 rounded-full ${
                !hardwareSim.isSolenoidLocked ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
          </button>
        </div>
      )}

      {/* IoT Hardware Simulator Modal / Drawer */}
      <SimulatedBoxWidget
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
      />

      {/* In-App Toast Notifications (Responsive, auto-dismissing, dismissible) */}
      <ToastNotifications />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 pb-24 md:pb-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>منصة عالباب الذكية (3al-BaB Smart Delivery Platform v3.0) • جميع الحقوق محفوظة</span>
          <span className="font-mono text-[11px] text-cyan-500/80">
            تشفير عتادي كامل • إدارة صلاحيات الوصول RBAC • محاكاة الصناديق الذكية IoT
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}
