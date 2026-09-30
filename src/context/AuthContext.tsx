/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActorRole, AuthUser } from '../types';

export interface DemoAccountCredential {
  role: ActorRole;
  roleLabel: string;
  roleDescription: string;
  email: string;
  password: string;
  phone: string;
  user: AuthUser;
}

export const DEMO_ACCOUNTS: DemoAccountCredential[] = [
  {
    role: 'CUSTOMER',
    roleLabel: 'عميل المنصة',
    roleDescription: 'حساب العميل المستلم ومالك الصندوق الذكي BOX-102',
    email: 'customer@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 100 123 4567',
    user: {
      id: 'cust-1',
      email: 'customer@demo.tawseel',
      name: 'أحمد مصطفى',
      role: 'CUSTOMER',
      phone: '+20 100 123 4567',
      title: 'مالك الصندوق الذكي',
      details: 'الفيلا 14 - التجمع الخامس، القاهرة',
    },
  },
  {
    role: 'MERCHANT',
    roleLabel: 'التاجر والمستودع',
    roleDescription: 'إدارة طلبات التجهيز والمخزون وبوالص الشحن',
    email: 'merchant@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 102 334 5566',
    user: {
      id: 'merch-1',
      email: 'merchant@demo.tawseel',
      name: 'ميدل إيست تيك (Middle East Tech)',
      role: 'MERCHANT',
      phone: '+20 102 334 5566',
      title: 'متجر تقني معتمد',
      details: 'فرع التجمع الخامس - البوابة 3',
    },
  },
  {
    role: 'DRIVER',
    roleLabel: 'مندوب التوصيل الميداني',
    roleDescription: 'استلام الطرود وملاحة الصناديق وفتح الحجيرات برمز OTP',
    email: 'driver@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 111 876 5432',
    user: {
      id: 'drv-1',
      email: 'driver@demo.tawseel',
      name: 'إسلام عامر',
      role: 'DRIVER',
      phone: '+20 111 876 5432',
      title: 'كابتن توصيل معتمد (C-4091)',
      details: 'مركبة كهربائية EV-04 • نطاق التجمع والمعادي',
    },
  },
  {
    role: 'ADMIN',
    roleLabel: 'مدير النظام (SecOps & Fleet)',
    roleDescription: 'برج المراقبة المركزي، عن بعد للعتاد، التحقيق الجنائي والأمان',
    email: 'admin@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 100 999 8877',
    user: {
      id: 'adm-01',
      email: 'admin@demo.tawseel',
      name: 'م. خالد الدسوقي (SecOps)',
      role: 'ADMIN',
      phone: '+20 100 999 8877',
      title: 'مدير العمليات المركزية والعتاد',
      details: 'تصريح أمني Level-4 • القيادة العامة',
    },
  },
];

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  role: ActorRole | null;
  login: (identifier: string, pass: string, rememberMe?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  switchDemoRole: (newRole: ActorRole) => void;
  unauthorizedNotice: string | null;
  setUnauthorizedNotice: (msg: string | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'tawseel_demo_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });

  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('tawseel_demo_mode');
      if (stored !== null) return stored === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('tawseel_demo_mode', String(isDemoMode));
    }
  }, [isDemoMode]);

  // Auto-dismiss unauthorized notice after 5 seconds
  useEffect(() => {
    if (unauthorizedNotice) {
      const timer = setTimeout(() => {
        setUnauthorizedNotice(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [unauthorizedNotice]);

  const login = (
    identifier: string,
    pass: string,
    rememberMe: boolean = true
  ): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Find account by email or phone
    const matchedAccount = DEMO_ACCOUNTS.find(
      (acc) =>
        (acc.email.toLowerCase() === cleanId ||
          acc.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
          cleanId === acc.role.toLowerCase()) &&
        acc.password === cleanPass
    );

    if (!matchedAccount) {
      return {
        success: false,
        error: 'البريد الإلكتروني / رقم الهاتف أو كلمة المرور غير صحيحة.',
      };
    }

    setCurrentUser(matchedAccount.user);
    setUnauthorizedNotice(null);

    try {
      const payload = JSON.stringify(matchedAccount.user);
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_AUTH, payload);
      } else {
        sessionStorage.setItem(STORAGE_KEY_AUTH, payload);
      }
    } catch {
      // Ignore storage errors in sandbox
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setUnauthorizedNotice(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // Ignore
    }
  };

  const switchDemoRole = (newRole: ActorRole) => {
    const target = DEMO_ACCOUNTS.find((a) => a.role === newRole);
    if (target) {
      setCurrentUser(target.user);
      setUnauthorizedNotice(null);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(target.user));
      } catch {
        // Ignore
      }
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!currentUser,
    currentUser,
    role: currentUser?.role || null,
    login,
    logout,
    switchDemoRole,
    unauthorizedNotice,
    setUnauthorizedNotice,
    isDemoMode,
    setIsDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
