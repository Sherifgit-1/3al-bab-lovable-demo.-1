/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEMO_STORAGE_KEYS = {
  ORDERS: 'tawseel_demo_orders',
  AUTHORIZATIONS: 'tawseel_demo_authorizations',
  BOXES: 'tawseel_demo_boxes',
  CONVERSATIONS: 'tawseel_demo_conversations',
  MESSAGES: 'tawseel_demo_messages',
  AUDIT_LOGS: 'tawseel_demo_audit_logs',
  SECURITY_EVENTS: 'tawseel_demo_security_events',
  NOTIFICATIONS: 'tawseel_demo_notifications',
  HARDWARE_SIM: 'tawseel_demo_hardware_sim',
  ACTIVE_ORDER_ID: 'tawseel_demo_active_order_id',
  DEMO_STEP: 'tawseel_demo_step',
  DRIVER_STEP: 'tawseel_demo_driver_step',
  MERCHANT_DRAFTS: 'tawseel_demo_merchant_drafts',
  ACTIVE_MERCHANT_ID: 'tawseel_demo_active_merchant_id',
  DEMO_MERCHANT_ID: 'tawseel_demo_simulated_merchant_id',
  ACCESS_SESSION: 'tawseel_demo_access_session',
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch (err) {
    console.warn(`[Tawseel Storage] Failed to parse ${key}:`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[Tawseel Storage] Failed to save ${key}:`, err);
  }
}

export function hasStoredData(key: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item !== null && item !== undefined;
  } catch {
    return false;
  }
}

export function clearAllDemoStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    Object.values(DEMO_STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  } catch (err) {
    console.warn('[Tawseel Storage] Failed to clear storage:', err);
  }
}
