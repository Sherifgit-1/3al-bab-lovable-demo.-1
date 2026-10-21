/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActorRole, AuthUser } from '../types';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from '../services/storage';
import {
  getSupabaseClient,
  checkIsSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  getSupabaseCredentials,
} from '../lib/supabase';
import {
  profileService,
  STORAGE_CUSTOM_ACCOUNTS,
  STORAGE_CUSTOM_MERCHANTS,
  STORAGE_CUSTOM_DRIVERS,
} from '../services/ProfileService';

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: ActorRole;
  phone?: string;
  businessName?: string;
  category?: string;
  address?: string;
}

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
    email: 'market@demo.tawseel',
    name: 'هايبر ماركت الوادي (Al-Wadi Hyper)',
    role: 'MERCHANT',
    phone: '+20 101 223 3445',
    title: 'سوبرماركت ومؤن غذائية',
    details: 'شارع التسعين الشمالي، التجمع',
  },
  'merch-4': {
    id: 'merch-4',
    email: 'fashion@demo.tawseel',
    name: 'براند ستور للملابس (BrandStore Fashion)',
    role: 'MERCHANT',
    phone: '+20 106 554 4332',
    title: 'أزياء وماركات عالمية',
    details: 'كايرو فستيفال سيتي مول',
  },
  'merch-5': {
    id: 'merch-5',
    email: 'food@demo.tawseel',
    name: 'مطعم شاورما الريم (Al-Reem Shawarma)',
    role: 'MERCHANT',
    phone: '+20 100 445 5667',
    title: 'مطاعم ومأكولات سريعة',
    details: 'مول داون تاون، التجمع الخامس',
  },
};

export interface DemoAccount {
  role: ActorRole;
  roleLabel: string;
  roleDescription: string;
  email: string;
  password: string;
  phone: string;
  user: AuthUser;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'CUSTOMER',
    roleLabel: 'العميل (Customer)',
    roleDescription: 'استعراض المتاجر، السلة، تتبع الشحنة اللحظي وفتح الصندوق الذكي',
    email: 'customer@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 100 123 4567',
    user: {
      id: 'cust-1',
      email: 'customer@demo.tawseel',
      name: 'أحمد مصطفى',
      role: 'CUSTOMER',
      phone: '+20 100 123 4567',
      title: 'عميل معتمد',
      details: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
    },
  },
  {
    role: 'MERCHANT',
    roleLabel: 'التاجر (Merchant)',
    roleDescription: 'إدارة الطلبات، التجهيز، إسناد المناديب والتنسيق مع الصناديق',
    email: 'merchant@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 102 334 5566',
    user: DEMO_MERCHANT_USERS['merch-1'],
  },
  {
    role: 'DRIVER',
    roleLabel: 'مندوب التوصيل (Driver)',
    roleDescription: 'استلام الطرود، الملاحة، الوصول للسياج الجغرافي وفتح الخزائن بالـ OTP',
    email: 'driver@demo.tawseel',
    password: 'Demo123!',
    phone: '+20 105 678 9012',
    user: {
      id: 'driver-1',
      email: 'driver@demo.tawseel',
      name: 'إسلام عامر',
      role: 'DRIVER',
      phone: '+20 105 678 9012',
      title: 'كابتن توصيل معتمد (C-4091)',
      details: 'مركبة: فان كهربائية EV-04 • خط سير شرق القاهرة',
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
  isProfileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  login: (identifier: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: RegisterUserData, autoLogin?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  idToken: string | null;
  logout: () => Promise<void>;
  switchDemoRole: (newRole: ActorRole) => void;
  switchDemoMerchant: (merchantId: string) => void;
  currentDemoMerchantId: string;
  unauthorizedNotice: string | null;
  setUnauthorizedNotice: (msg: string | null) => void;
  isDemoMode: boolean;
  setIsDemoMode: React.Dispatch<React.SetStateAction<boolean>>;
  hideDemoAccounts: boolean;
  setHideDemoAccounts: (val: boolean) => void;
  isSupabaseActive: boolean;
  customAccounts: any[];
  configureSupabaseConnection: (url: string, key: string) => boolean;
  clearSupabaseConnection: () => void;
  supabaseCredentials: { url: string; key: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'tawseel_demo_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDemoMerchantId, setCurrentDemoMerchantId] = useState<string>(() => {
    return loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
  });

  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'MERCHANT' && typeof parsed?.id === 'string' && parsed.id.startsWith('merch-')) {
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

  const [hideDemoAccounts, setHideDemoAccountsState] = useState<boolean>(() => {
    return loadFromStorage<boolean>('tawseel_hide_demo_accounts', false);
  });

  const setHideDemoAccounts = (val: boolean) => {
    setHideDemoAccountsState(val);
    saveToStorage('tawseel_hide_demo_accounts', val);
  };

  const [customAccounts, setCustomAccounts] = useState<any[]>(() => {
    return loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
  });

  const [supabaseCreds, setSupabaseCreds] = useState<{ url: string; key: string }>(() =>
    getSupabaseCredentials()
  );

  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(() =>
    checkIsSupabaseConfigured()
  );

  // Refresh profile from Supabase / persistent storage
  const refreshProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setIsProfileLoading(false);
      return;
    }
    setIsProfileLoading(true);
    setProfileError(null);
    try {
      const updated = await profileService.getProfile(currentUser.id, currentUser.email);
      if (updated) {
        setCurrentUser(updated);
        saveToStorage(STORAGE_KEY_AUTH, updated);
        if (updated.role === 'MERCHANT') {
          setCurrentDemoMerchantId(updated.id);
        }
      } else {
        console.warn('[AuthContext] Profile record could not be loaded for UID:', currentUser.id);
      }
    } catch (err: any) {
      console.error('[AuthContext] refreshProfile error:', err);
      setProfileError('تعذر تحديث الملف الشخصي من خادم البيانات.');
    } finally {
      setIsProfileLoading(false);
    }
  }, [currentUser?.id, currentUser?.email]);

  // Supabase Auth session synchronization and auth state subscription
  useEffect(() => {
    let isMounted = true;
    const supa = getSupabaseClient();
    const isConfigured = checkIsSupabaseConfigured();

    async function syncSession() {
      if (isConfigured && supa) {
        try {
          const { data: { session }, error } = await supa.auth.getSession();
          if (error) {
            console.warn('[AuthContext] getSession warning:', error.message);
          }
          if (session?.user && isMounted) {
            const profile = await profileService.getProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata
            );
            if (profile && isMounted) {
              setCurrentUser(profile);
              saveToStorage(STORAGE_KEY_AUTH, profile);
              if (profile.role === 'MERCHANT') {
                setCurrentDemoMerchantId(profile.id);
              }
            } else if (isMounted) {
              // Construct provisional AuthUser from Supabase metadata if profiles table is empty
              const meta = session.user.user_metadata || {};
              const provisional: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: meta.name || session.user.email?.split('@')[0] || 'مستخدم مسجل',
                role: (meta.role as ActorRole) || 'CUSTOMER',
                phone: meta.phone || undefined,
                title: meta.role === 'MERCHANT' ? (meta.businessName || meta.name) : 'عميل معتمد',
                details: meta.businessName ? `متجر: ${meta.businessName}` : meta.address,
              };
              setCurrentUser(provisional);
              saveToStorage(STORAGE_KEY_AUTH, provisional);
            }
          }
        } catch (err) {
          console.warn('[AuthContext] Session init note:', err);
        }
      }
      if (isMounted) {
        setIsProfileLoading(false);
      }
    }

    syncSession();

    if (isConfigured && supa) {
      const { data: { subscription } } = supa.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session?.user) {
            setIsProfileLoading(true);
            const profile = await profileService.getProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata
            );
            if (profile && isMounted) {
              setCurrentUser(profile);
              saveToStorage(STORAGE_KEY_AUTH, profile);
              if (profile.role === 'MERCHANT') {
                setCurrentDemoMerchantId(profile.id);
              }
            }
            if (isMounted) setIsProfileLoading(false);
          } else if (event === 'SIGNED_OUT') {
            if (isMounted) {
              setCurrentUser(null);
              setIsProfileLoading(false);
            }
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      setIsProfileLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isSupabaseActive]);

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

  /**
   * Safe registration for all 3 public roles (CUSTOMER, MERCHANT, DRIVER)
   * Strictly forbids public self-registration for ADMIN role.
   */
  const signup = async (
    data: RegisterUserData,
    autoLogin: boolean = true
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    // 1. Strict Administrator Privilege Protection
    if (data.role === 'ADMIN') {
      return {
        success: false,
        error: 'تسجيل حساب مدير نظام غير مصرح به عبر التسجيل العام. يتطلب ذلك اعتماداً أمنياً من إدارة المنصة.',
      };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPass = data.password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    }

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      let authenticatedUserId: string | null = null;
      let isEmailConfirmationPending = false;
      const supa = getSupabaseClient();
      const isConfigured = checkIsSupabaseConfigured();

      // 2. Real Supabase Auth Registration
      if (isConfigured && supa) {
        try {
          const { data: supaData, error: supaErr } = await supa.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: {
              data: {
                name: data.name,
                role: data.role,
                phone: data.phone || '',
                businessName: data.businessName || '',
                category: data.category || '',
                address: data.address || '',
              },
            },
          });

          if (supaErr) {
            console.warn('[AuthContext] Supabase signUp note:', supaErr.message);
            // If email already taken in Supabase, report immediately
            if (supaErr.message?.toLowerCase().includes('already registered')) {
              setIsProfileLoading(false);
              return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' };
            }
          } else if (supaData?.user) {
            authenticatedUserId = supaData.user.id;
            if (supaData.user.identities && supaData.user.identities.length === 0) {
              setIsProfileLoading(false);
              return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.' };
            }
            if (!supaData.session) {
              isEmailConfirmationPending = true;
            }
          }
        } catch (supaErr: any) {
          console.warn('[AuthContext] Supabase sign up exception:', supaErr);
        }
      }

      // 3. Robust UUID creation: use actual UUID from Supabase or generate standard UUID
      const finalUserId =
        authenticatedUserId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${data.role.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`);

      let roleLabel = 'عميل معتمد';
      let userDetails = data.address || 'التجمع الخامس، القاهرة';

      if (data.role === 'MERCHANT') {
        const storeName = data.businessName?.trim() || data.name;
        roleLabel = storeName;
        userDetails = `متجر: ${storeName} • ${data.address || 'القاهرة'}`;
      } else if (data.role === 'DRIVER') {
        const driverCode = `C-${Math.floor(1000 + Math.random() * 9000)}`;
        roleLabel = `كابتن توصيل معتمد (${driverCode})`;
        userDetails = 'مركبة: سكوتر كهربائي ذكي • نطاق القاهرة';
      }

      const newAuthUser: AuthUser = {
        id: finalUserId,
        email: cleanEmail,
        name: data.name || (data.role === 'MERCHANT' ? data.businessName || 'تاجر جديد' : 'مستخدم جديد'),
        role: data.role,
        phone: data.phone || '+20 100 000 0000',
        title: roleLabel,
        details: userDetails,
      };

      // 4. Persist to ProfileService (Supabase tables + persistent storage + saved password)
      await profileService.persistProfile(newAuthUser, {
        businessName: data.businessName,
        category: data.category,
        address: data.address,
        phone: data.phone,
        password: cleanPass, // Saved for instantaneous login
      });

      // Update custom accounts in state
      const updatedCustom = loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
      setCustomAccounts(updatedCustom);
      setIsDemoMode(false);

      if (data.role === 'MERCHANT') {
        setCurrentDemoMerchantId(finalUserId);
      }

      // 5. If autoLogin is requested (default), set currentUser immediately
      if (autoLogin) {
        setCurrentUser(newAuthUser);
        setUnauthorizedNotice(null);
        saveToStorage(STORAGE_KEY_AUTH, newAuthUser);
      }

      return {
        success: true,
        user: newAuthUser,
        error: isEmailConfirmationPending
          ? 'تم إنشاء الحساب بنجاح! يرجى تأكيد بريدك الإلكتروني لتسجيل الدخول مستقبلاً.'
          : undefined,
      };
    } catch (err: any) {
      console.error('[AuthContext] Signup error:', err);
      return { success: false, error: err.message || 'حدث خطأ غير متوقع أثناء إنشاء الحساب.' };
    } finally {
      setIsProfileLoading(false);
    }
  };

  /**
   * Login supporting Supabase Auth, custom registered accounts, and demo accounts
   */
  const login = async (
    identifier: string,
    pass: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    const cleanPass = pass ? pass.trim() : '';

    setIsProfileLoading(true);
    setProfileError(null);

    try {
      const supa = getSupabaseClient();
      const isConfigured = checkIsSupabaseConfigured();

      // 1. Try Supabase Auth first if configured
      if (isConfigured && supa && cleanPass && cleanId.includes('@')) {
        try {
          const { data: supaData, error: supaErr } = await supa.auth.signInWithPassword({
            email: cleanId,
            password: cleanPass,
          });

          if (supaData?.user && !supaErr) {
            const profile = await profileService.getProfile(
              supaData.user.id,
              supaData.user.email,
              supaData.user.user_metadata
            );

            if (profile) {
              setIsDemoMode(false);
              setCurrentUser(profile);
              setUnauthorizedNotice(null);
              if (profile.role === 'MERCHANT') {
                setCurrentDemoMerchantId(profile.id);
              }
              const payload = JSON.stringify(profile);
              if (rememberMe) localStorage.setItem(STORAGE_KEY_AUTH, payload);
              else sessionStorage.setItem(STORAGE_KEY_AUTH, payload);
              return { success: true };
            }
          } else if (supaErr) {
            console.warn('[AuthContext] Supabase sign-in note:', supaErr.message);
          }
        } catch (supaErr) {
          console.warn('[AuthContext] Supabase login error:', supaErr);
        }
      }

      // 2. Check Custom Registered Accounts (Local / Persistent Database)
      const storedCustom = loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
      const matchedCustom = storedCustom.find((acc) => {
        // Email match
        const emailMatch = acc.email?.toLowerCase() === cleanId;
        // Phone match
        const accPhoneDigits = (acc.phone || '').replace(/\D/g, '');
        const phoneMatch =
          (cleanDigits.length >= 7 && accPhoneDigits.endsWith(cleanDigits.slice(-7))) ||
          acc.phone?.toLowerCase() === cleanId;
        // Business name / Store name match (for merchants)
        const businessMatch = acc.businessName && acc.businessName.trim().toLowerCase() === cleanId;
        // User full name match
        const nameMatch = acc.user?.name && acc.user.name.trim().toLowerCase() === cleanId;
        // ID / UUID match
        const idMatch = acc.user?.id?.toLowerCase() === cleanId;

        const identifierMatches = emailMatch || phoneMatch || businessMatch || nameMatch || idMatch;

        // Password validation: match exact password, or allow instant login if acc has no password saved
        const passwordMatches = !acc.password || !cleanPass || acc.password.trim() === cleanPass;

        return identifierMatches && passwordMatches;
      });

      if (matchedCustom && matchedCustom.user) {
        const userToSet = matchedCustom.user as AuthUser;
        setIsDemoMode(false);
        setCurrentUser(userToSet);
        if (userToSet.role === 'MERCHANT') {
          setCurrentDemoMerchantId(userToSet.id);
        }
        setUnauthorizedNotice(null);
        const payload = JSON.stringify(userToSet);
        if (rememberMe) localStorage.setItem(STORAGE_KEY_AUTH, payload);
        else sessionStorage.setItem(STORAGE_KEY_AUTH, payload);
        return { success: true };
      }

      // 3. Fallback to Demo Accounts (Demo Simulator Mode)
      const matchedDemo = DEMO_ACCOUNTS.find(
        (acc) =>
          (acc.email.toLowerCase() === cleanId ||
            acc.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '') ||
            cleanId === acc.role.toLowerCase()) &&
          acc.password === cleanPass
      );

      if (!matchedDemo) {
        return {
          success: false,
          error: 'البريد الإلكتروني / رقم الهاتف أو كلمة المرور غير صحيحة.',
        };
      }

      let userToSet = matchedDemo.user;
      if (matchedDemo.role === 'MERCHANT') {
        const storedMerchId = loadFromStorage<string>(DEMO_STORAGE_KEYS.DEMO_MERCHANT_ID, 'merch-1');
        if (DEMO_MERCHANT_USERS[storedMerchId]) {
          userToSet = DEMO_MERCHANT_USERS[storedMerchId];
          setCurrentDemoMerchantId(storedMerchId);
        }
      }

      setIsDemoMode(true);
      setCurrentUser(userToSet);
      setUnauthorizedNotice(null);

      const payload = JSON.stringify(userToSet);
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_AUTH, payload);
      } else {
        sessionStorage.setItem(STORAGE_KEY_AUTH, payload);
      }

      return { success: true };
    } finally {
      setIsProfileLoading(false);
    }
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
        title: 'عميل معتمد عبر Google',
        details: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
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

  const logout = async () => {
    setIsProfileLoading(true);
    try {
      const supa = getSupabaseClient();
      if (checkIsSupabaseConfigured() && supa) {
        await supa.auth.signOut().catch(() => {});
      }
    } finally {
      setCurrentUser(null);
      setIdToken(null);
      setUnauthorizedNotice(null);
      try {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        sessionStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID);
      } catch {
        // Ignore
      }
      setIsProfileLoading(false);
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

  const configureSupabaseConnection = (url: string, key: string): boolean => {
    const success = saveSupabaseCredentials(url, key);
    setSupabaseCreds(getSupabaseCredentials());
    setIsSupabaseActive(checkIsSupabaseConfigured());
    return success;
  };

  const clearSupabaseConnection = () => {
    clearSupabaseCredentials();
    setSupabaseCreds(getSupabaseCredentials());
    setIsSupabaseActive(false);
  };

  const value: AuthContextType = {
    isAuthenticated: !!currentUser,
    currentUser,
    role: currentUser?.role || null,
    isProfileLoading,
    profileError,
    refreshProfile,
    login,
    signup,
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
    hideDemoAccounts,
    setHideDemoAccounts,
    isSupabaseActive,
    customAccounts,
    configureSupabaseConnection,
    clearSupabaseConnection,
    supabaseCredentials: supabaseCreds,
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
