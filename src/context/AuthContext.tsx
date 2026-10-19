/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActorRole, AuthUser } from '../types';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from '../services/storage';

export interface DemoMerchantOption {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  label: string;
  category: string;
  shortName: string;
}

export const DEMO_MERCHANT_OPTIONS: DemoMerchantOption[] = [
  {
    id: 'merch-1',
    name: 'ميدل إيست تيك (Middle East Tech)',
    nameAr: 'ميدل إيست تك',
    nameEn: 'Middle East Tech',
    label: 'ميدل إيست تك — Middle East Tech — merch-1',
    category: 'أجهزة وإلكترونيات',
    shortName: 'ميدل إيست تك',
  },
  {
    id: 'merch-2',
    name: 'صيدليات النور الرقمية (Care Pharmacy)',
    nameAr: 'الصيدلية',
    nameEn: 'Pharmacy B',
    label: 'الصيدلية — Pharmacy B — merch-2',
    category: 'صيدليات ومستلزمات طبية',
    shortName: 'الصيدلية',
  },
  {
    id: 'merch-3',
    name: 'هايبر ماركت الوادي (Al-Wadi Hyper)',
    nameAr: 'الوادي',
    nameEn: 'El Wadi',
    label: 'الوادي — El Wadi — merch-3',
    category: 'سوبرماركت ومؤن',
    shortName: 'الوادي',
  },
  {
    id: 'merch-4',
    name: 'براند ستور للملابس (BrandStore Fashion)',
    nameAr: 'براند ستور',
    nameEn: 'BrandStore Fashion',
    label: 'براند ستور — BrandStore Fashion — merch-4',
    category: 'أزياء وملابس',
    shortName: 'براند ستور',
  },
  {
    id: 'merch-5',
    name: 'مطعم شاورما الريم (Al-Reem Shawarma)',
    nameAr: 'مطعم شاورما',
    nameEn: 'Shawarma Restaurant',
    label: 'مطعم شاورما — Shawarma Restaurant — merch-5',
    category: 'مطاعم ومأكولات',
    shortName: 'مطعم شاورما',
  },
];

export const DEMO_MERCHANT_USERS: Record<string, AuthUser> = {
  'merch-1': {
    id: 'merch-1',
    email: 'merchant@demo.tawseel',
    name: 'ميدل إيست تيك (Middle East Tech)',
    role: 'MERCHANT',
    phone: '+20 102 334 5566',
    title: 'متجر تقني معتمد',
    details: 'فرع التجمع الخامس - البوابة 3',
  },
  'merch-2': {
    id: 'merch-2',
    email: 'pharmacy@demo.tawseel',
    name: 'صيدليات النور الرقمية (Care Pharmacy)',
    role: 'MERCHANT',
    phone: '+20 109 887 7665',
    title: 'صيدلية ومستلزمات طبية معتمدة',
    details: 'ميدان روكسي، مصر الجديدة',
  },
  'merch-3': {
    id: 'merch-3',
    email: 'elwadi@demo.tawseel',
    name: 'هايبر ماركت الوادي (Al-Wadi Hyper)',
    role: 'MERCHANT',
    phone: '+20 101 223 3445',
    title: 'هايبر ماركت وسوبرماركت ومؤن',
    details: 'شارع التسعين الشمالي، التجمع الخامس',
  },
  'merch-4': {
    id: 'merch-4',
    email: 'brandstore@demo.tawseel',
    name: 'براند ستور للملابس (BrandStore Fashion)',
    role: 'MERCHANT',
    phone: '+20 105 443 2211',
    title: 'أزياء وملابس ماركات عالمية',
    details: 'سيتي ستارز، مدينة نصر، القاهرة',
  },
  'merch-5': {
    id: 'merch-5',
    email: 'shawarma@demo.tawseel',
    name: 'مطعم شاورما الريم (Al-Reem Shawarma)',
    role: 'MERCHANT',
    phone: '+20 106 554 4332',
    title: 'مطاعم ومأكولات سريعة معتمدة',
    details: 'شارع التسعين الجنوبي - التجمع الخامس',
  },
};

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
    user: DEMO_MERCHANT_USERS['merch-1'],
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

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  role: ActorRole | null;
  login: (identifier: string, pass: string, rememberMe?: boolean) => { success: boolean; error?: string };
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  idToken: string | null;
  logout: () => void;
  switchDemoRole: (newRole: ActorRole) => void;
  switchDemoMerchant: (merchantId: string) => void;
  currentDemoMerchantId: string;
  unauthorizedNotice: string | null;
  setUnauthorizedNotice: (msg: string | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'tawseel_demo_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDemoMerchantId, setCurrentDemoMerchantId] = useState<string>(() => {
    return loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'MERCHANT') {
          const storedMerchId = loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
          return DEMO_MERCHANT_USERS[storedMerchId] || DEMO_MERCHANT_USERS['merch-1'];
        }
        return parsed;
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

  const switchDemoMerchant = (merchantId: string) => {
    if (!DEMO_MERCHANT_USERS[merchantId]) return;
    const targetUser = DEMO_MERCHANT_USERS[merchantId];
    setCurrentDemoMerchantId(merchantId);
    saveToStorage(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, merchantId);

    if (currentUser?.role === 'MERCHANT') {
      setCurrentUser(targetUser);
      setUnauthorizedNotice(null);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(targetUser));
      } catch {
        // Ignore
      }
    }
  };

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

    let userToSet = matchedAccount.user;
    if (matchedAccount.role === 'MERCHANT') {
      const storedMerchId = loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
      if (DEMO_MERCHANT_USERS[storedMerchId]) {
        userToSet = DEMO_MERCHANT_USERS[storedMerchId];
        setCurrentDemoMerchantId(storedMerchId);
      }
    }

    setCurrentUser(userToSet);
    setUnauthorizedNotice(null);

    try {
      const payload = JSON.stringify(userToSet);
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

  const [idToken, setIdToken] = useState<string | null>(null);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleAuthProvider } = await import('../lib/firebase.ts');
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      const user = userCredential.user;
      const token = await user.getIdToken();
      setIdToken(token);

      const authUser: AuthUser = {
        id: user.uid,
        email: user.email || 'user@3albab.app',
        name: user.displayName || 'مستخدم مسجل',
        role: 'CUSTOMER',
        phone: user.phoneNumber || '+20 100 000 0000',
        title: 'عميل مسجل عبر Google',
      };

      // Sync user profile to PostgreSQL backend
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: authUser.name,
            role: authUser.role,
          }),
        });
      } catch (err) {
        console.warn('PostgreSQL user sync warning:', err);
      }

      setCurrentUser(authUser);
      setUnauthorizedNotice(null);

      try {
        sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authUser));
      } catch {
        // Ignore
      }

      return { success: true };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      return { success: false, error: err.message || 'فشل تسجيل الدخول عبر Google' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIdToken(null);
    setUnauthorizedNotice(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {
      // Ignore
    }
  };

  const switchDemoRole = (newRole: ActorRole) => {
    if (newRole === 'MERCHANT') {
      const storedMerchId = loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
      const targetUser = DEMO_MERCHANT_USERS[storedMerchId] || DEMO_MERCHANT_USERS['merch-1'];
      setCurrentUser(targetUser);
      setCurrentDemoMerchantId(targetUser.id);
      setUnauthorizedNotice(null);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(targetUser));
      } catch {
        // Ignore
      }
      return;
    }

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
    loginWithGoogle,
    idToken,
    logout,
    switchDemoRole,
    switchDemoMerchant,
    currentDemoMerchantId,
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
