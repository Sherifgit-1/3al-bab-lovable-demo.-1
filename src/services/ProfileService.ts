/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, ActorRole } from '../types';
import { getSupabaseClient, checkIsSupabaseConfigured } from '../lib/supabase';
import { loadFromStorage, saveToStorage } from './storage';

export const STORAGE_CUSTOM_ACCOUNTS = 'tawseel_custom_registered_accounts';
export const STORAGE_CUSTOM_MERCHANTS = 'tawseel_custom_merchants';
export const STORAGE_CUSTOM_DRIVERS = 'tawseel_custom_drivers';

export interface ProfileRecord {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
  phone?: string;
  businessName?: string;
  category?: string;
  address?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class ProfileService {
  /**
   * Fetch authenticated user profile using UUID / ID
   * Prioritizes Supabase profiles table, falls back to auth metadata, then persistent local storage.
   * NEVER returns another person's name or a stale demo user.
   */
  async getProfile(
    userId: string,
    email?: string,
    userMetadata?: Record<string, any>
  ): Promise<AuthUser | null> {
    if (!userId) return null;

    const supa = getSupabaseClient();
    const isConfigured = checkIsSupabaseConfigured();

    // 1. Try Supabase profiles table if Supabase is active
    if (isConfigured && supa) {
      try {
        const { data, error } = await supa
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (data && !error) {
          const role = (data.role as ActorRole) || 'CUSTOMER';
          let title =
            role === 'CUSTOMER'
              ? 'عميل معتمد'
              : role === 'MERCHANT'
              ? data.business_name || data.name
              : role === 'DRIVER'
              ? 'كابتن توصيل معتمد'
              : 'مدير العمليات المركزية والعتاد';

          let details = data.business_name
            ? `متجر: ${data.business_name}`
            : data.address || undefined;

          // Enrich Driver details from drivers table if available
          if (role === 'DRIVER') {
            try {
              const { data: driverData } = await supa
                .from('drivers')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

              if (driverData) {
                if (driverData.code) {
                  title = `كابتن توصيل معتمد (${driverData.code})`;
                }
                if (driverData.vehicle) {
                  details = `مركبة: ${driverData.vehicle}`;
                }
              }
            } catch (err) {
              console.warn('[ProfileService] Driver table query note:', err);
            }
          }

          // Enrich Merchant details from merchants table if available
          if (role === 'MERCHANT') {
            try {
              const { data: merchData } = await supa
                .from('merchants')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

              if (merchData) {
                if (merchData.business_name) {
                  details = `متجر: ${merchData.business_name}`;
                }
              }
            } catch (err) {
              console.warn('[ProfileService] Merchant table query note:', err);
            }
          }

          if (role === 'ADMIN') {
            title = 'مدير العمليات المركزية والعتاد';
            details = 'تصريح أمني Level-4 • القيادة العامة';
          }

          return {
            id: data.id,
            email: data.email || email || '',
            name: data.name || email?.split('@')[0] || 'مستخدم مسجل',
            role,
            phone: data.phone || undefined,
            title,
            details,
            avatarUrl: data.avatar_url || undefined,
          };
        }
      } catch (err) {
        console.warn('[ProfileService] Supabase profiles fetch exception:', err);
      }

      // 2. Fall back to Supabase user_metadata if profiles table query wasn't available
      if (userMetadata && Object.keys(userMetadata).length > 0) {
        const role = (userMetadata.role as ActorRole) || 'CUSTOMER';
        const name = userMetadata.name || email?.split('@')[0] || 'مستخدم مسجل';
        const title =
          role === 'CUSTOMER'
            ? 'عميل معتمد'
            : role === 'MERCHANT'
            ? userMetadata.businessName || name
            : role === 'DRIVER'
            ? 'كابتن توصيل معتمد'
            : 'مدير العمليات المركزية والعتاد';

        return {
          id: userId,
          email: email || '',
          name,
          role,
          phone: userMetadata.phone || undefined,
          title,
          details: userMetadata.businessName
            ? `متجر: ${userMetadata.businessName}`
            : userMetadata.address || undefined,
        };
      }
    }

    // 3. Check persistent custom accounts storage
    const customAccounts = loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
    const matched = customAccounts.find(
      (acc) =>
        acc.user?.id === userId ||
        (email && acc.email?.toLowerCase() === email.toLowerCase())
    );

    if (matched && matched.user) {
      return matched.user as AuthUser;
    }

    return null;
  }

  /**
   * Persist a user profile into Supabase and local storage
   */
  async persistProfile(
    user: AuthUser,
    details?: {
      businessName?: string;
      category?: string;
      address?: string;
      phone?: string;
      password?: string;
    }
  ): Promise<void> {
    const supa = getSupabaseClient();
    const isConfigured = checkIsSupabaseConfigured();

    // 1. Supabase persistence
    if (isConfigured && supa) {
      try {
        const payload: Record<string, any> = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone || details?.phone || null,
          business_name: details?.businessName || (user.role === 'MERCHANT' ? user.name : null),
          category: details?.category || null,
          address: details?.address || null,
          updated_at: new Date().toISOString(),
        };

        const { error: profileErr } = await supa.from('profiles').upsert(payload);
        if (profileErr) {
          console.warn('[ProfileService] Supabase profile upsert warning:', profileErr.message);
        }

        // Role-specific Supabase table updates
        if (user.role === 'MERCHANT') {
          try {
            await supa.from('merchants').upsert({
              id: user.id,
              name: details?.businessName || user.name,
              business_name: details?.businessName || user.name,
              owner_name: user.name,
              category: details?.category || 'متاجر متنوعة',
              address: details?.address || 'القاهرة - التجمع الخامس',
              phone: user.phone || details?.phone || null,
              is_open: true,
            });
          } catch (e: any) {
            console.warn('[ProfileService] merchants table note:', e);
          }
        } else if (user.role === 'DRIVER') {
          const code = `C-${Math.floor(1000 + Math.random() * 9000)}`;
          try {
            await supa.from('drivers').upsert({
              id: user.id,
              name: user.name,
              phone: user.phone || details?.phone || null,
              vehicle: 'سكوتر كهربائي ذكي',
              code,
              status: 'AVAILABLE',
            });
          } catch (e: any) {
            console.warn('[ProfileService] drivers table note:', e);
          }
        }
      } catch (err) {
        console.warn('[ProfileService] Supabase persistence error:', err);
      }
    }

    // 2. Synchronize to persistent custom accounts store (INCLUDING PASSWORD)
    const existingAccounts = loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
    const filtered = existingAccounts.filter(
      (a) => a.user?.id !== user.id && a.email?.toLowerCase() !== user.email.toLowerCase()
    );

    const record = {
      role: user.role,
      roleLabel: user.title || user.name,
      roleDescription: `حساب ${user.role} مخصص`,
      email: user.email,
      password: details?.password || '', // CRITICAL: Save password so quick login works!
      phone: user.phone || details?.phone,
      businessName: details?.businessName,
      category: details?.category,
      address: details?.address,
      user,
      updatedAt: new Date().toISOString(),
    };

    filtered.push(record);
    saveToStorage(STORAGE_CUSTOM_ACCOUNTS, filtered);

    // 3. Keep merchants/drivers lists updated
    if (user.role === 'MERCHANT') {
      const customMerchants = loadFromStorage<any[]>(STORAGE_CUSTOM_MERCHANTS, []);
      const existingIdx = customMerchants.findIndex((m) => m.id === user.id);
      const merchantObj = {
        id: user.id,
        name: details?.businessName || user.name,
        businessName: details?.businessName || user.name,
        ownerName: user.name,
        category: details?.category || 'متاجر متنوعة',
        rating: 5.0,
        address: details?.address || 'القاهرة - التجمع الخامس',
        phone: user.phone || details?.phone || '+20 100 000 0000',
        phoneNumbers: [user.phone || details?.phone || '+20 100 000 0000'],
        deliveryAvailable: true,
        workingHours: '10:00 ص - 11:00 م',
        isOpen: true,
        storePhotos: ['https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800'],
        shelfPhotos: [],
        featurePhotos: [],
        ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
        menuPhotos: [],
      };

      if (existingIdx >= 0) {
        customMerchants[existingIdx] = merchantObj;
      } else {
        customMerchants.push(merchantObj);
      }
      saveToStorage(STORAGE_CUSTOM_MERCHANTS, customMerchants);
    } else if (user.role === 'DRIVER') {
      const customDrivers = loadFromStorage<any[]>(STORAGE_CUSTOM_DRIVERS, []);
      const existingIdx = customDrivers.findIndex((d) => d.id === user.id);
      const driverCode = user.title?.match(/C-\d+/)?.[0] || `C-${Math.floor(1000 + Math.random() * 9000)}`;
      const driverObj = {
        id: user.id,
        name: user.name,
        code: driverCode,
        phone: user.phone || details?.phone || '+20 100 000 0000',
        vehicle: 'سكوتر كهربائي ذكي',
        rating: 5.0,
        status: 'AVAILABLE',
        currentLocation: {
          lat: 30.015,
          lng: 31.435,
          description: 'بالقرب من الصندوق الذكي BOX-102',
        },
        assignedOrdersCount: 0,
        completedTodayCount: 0,
        todayEarnings: 0,
      };

      if (existingIdx >= 0) {
        customDrivers[existingIdx] = { ...customDrivers[existingIdx], ...driverObj };
      } else {
        customDrivers.push(driverObj);
      }
      saveToStorage(STORAGE_CUSTOM_DRIVERS, customDrivers);
    }
  }

  /**
   * Helper to retrieve all custom registered drivers
   */
  getCustomDrivers(): any[] {
    return loadFromStorage<any[]>(STORAGE_CUSTOM_DRIVERS, []);
  }

  /**
   * Helper to retrieve all custom registered merchants
   */
  getCustomMerchants(): any[] {
    return loadFromStorage<any[]>(STORAGE_CUSTOM_MERCHANTS, []);
  }

  /**
   * Helper to retrieve all custom registered accounts
   */
  getCustomAccounts(): any[] {
    return loadFromStorage<any[]>(STORAGE_CUSTOM_ACCOUNTS, []);
  }
}

export const profileService = new ProfileService();
