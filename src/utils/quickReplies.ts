/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MerchantCategory = 'RESTAURANT' | 'PHARMACY' | 'CLOTHING' | 'OTHER';

export interface MerchantLike {
  id?: string;
  category?: string;
  name?: string;
  businessName?: string;
  merchantId?: string;
  merchantCategory?: string;
  merchantName?: string;
}

export function detectMerchantCategory(merchant?: MerchantLike | null): MerchantCategory {
  if (!merchant) return 'OTHER';
  const categoryStr = `${merchant.category || ''} ${merchant.merchantCategory || ''}`.toLowerCase();
  const nameStr = `${merchant.name || ''} ${merchant.businessName || ''} ${merchant.merchantName || ''}`.toLowerCase();
  const idStr = merchant.id || merchant.merchantId || '';

  // 1. Restaurant / Food
  if (
    idStr === 'merch-5' ||
    categoryStr.includes('مطاعم') ||
    categoryStr.includes('مأكولات') ||
    categoryStr.includes('أغذية') ||
    categoryStr.includes('شاورما') ||
    categoryStr.includes('طعام') ||
    categoryStr.includes('وجبات') ||
    categoryStr.includes('restaurant') ||
    categoryStr.includes('food') ||
    nameStr.includes('مطعم') ||
    nameStr.includes('شاورما') ||
    nameStr.includes('ريم')
  ) {
    return 'RESTAURANT';
  }

  // 2. Pharmacy / Medical
  if (
    idStr === 'merch-2' ||
    categoryStr.includes('صيدل') ||
    categoryStr.includes('طبية') ||
    categoryStr.includes('دواء') ||
    categoryStr.includes('أدوية') ||
    categoryStr.includes('علاج') ||
    categoryStr.includes('pharmacy') ||
    categoryStr.includes('medical') ||
    nameStr.includes('صيدلية') ||
    nameStr.includes('صيدليات') ||
    nameStr.includes('دواء') ||
    nameStr.includes('care pharmacy')
  ) {
    return 'PHARMACY';
  }

  // 3. Clothing / Fashion
  if (
    idStr === 'merch-4' ||
    categoryStr.includes('أزياء') ||
    categoryStr.includes('ملابس') ||
    categoryStr.includes('موضة') ||
    categoryStr.includes('fashion') ||
    categoryStr.includes('clothing') ||
    categoryStr.includes('apparel') ||
    nameStr.includes('ملابس') ||
    nameStr.includes('أزياء') ||
    nameStr.includes('brandstore')
  ) {
    return 'CLOTHING';
  }

  // 4. Other / General (e.g. Electronics, Supermarket, General Retail)
  return 'OTHER';
}

export const CATEGORY_QUICK_REPLIES: Record<MerchantCategory, string[]> = {
  RESTAURANT: [
    'استبدال البطاطس بالكول سلو',
    'إضافة مشروب',
    'بدون بصل',
    'تم تجهيز الطلب',
  ],
  PHARMACY: [
    'هل الدواء متوفر؟',
    'هل يوجد بديل؟',
    'برجاء إرسال الروشتة',
    'تم تجهيز الطلب',
  ],
  CLOTHING: [
    'هل المقاس متوفر؟',
    'هل اللون متوفر؟',
    'برجاء تحديد المقاس',
    'تم تجهيز الطلب',
  ],
  OTHER: [
    'هل الطلب متوفر؟',
    'متى يكون الطلب جاهزًا؟',
    'تم تجهيز الطلب',
    'شكرًا',
  ],
};

export function getQuickRepliesForMerchant(merchant?: MerchantLike | null): string[] {
  const cat = detectMerchantCategory(merchant);
  return CATEGORY_QUICK_REPLIES[cat];
}
