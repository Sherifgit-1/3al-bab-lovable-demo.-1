/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INotificationService } from './interfaces';
import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

export class MockNotificationService implements INotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];

  constructor() {
    const stored = loadFromStorage<NotificationItem[] | null>(DEMO_STORAGE_KEYS.NOTIFICATIONS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      this.notifications = stored;
    } else {
      this.notifications = [...INITIAL_NOTIFICATIONS];
      saveToStorage(DEMO_STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    }
  }

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    saveToStorage(DEMO_STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.listeners.forEach((l) => l([...this.notifications]));
  }

  getNotificationsSync(): NotificationItem[] {
    return [...this.notifications];
  }

  resetToSeedData(): NotificationItem[] {
    this.notifications = [...INITIAL_NOTIFICATIONS];
    this.notifyListeners();
    return [...this.notifications];
  }

  async notify(
    title: string,
    message: string,
    type: 'ORDER' | 'SECURITY' | 'DELIVERY' | 'SYSTEM',
    metadata?: {
      orderId?: string;
      smartBoxId?: string;
      driverId?: string;
      customerId?: string;
      compartmentId?: string;
      targetRole?: 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'ADMIN';
    }
  ): Promise<void> {
    const item: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'الآن',
      read: false,
      type,
      orderId: metadata?.orderId,
      smartBoxId: metadata?.smartBoxId,
      driverId: metadata?.driverId,
      customerId: metadata?.customerId,
      compartmentId: metadata?.compartmentId,
      targetRole: metadata?.targetRole,
    };
    this.notifications.unshift(item);
    this.notifyListeners();
  }

  async getNotifications(): Promise<NotificationItem[]> {
    return [...this.notifications];
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      this.notifyListeners();
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach((n) => (n.read = true));
    this.notifyListeners();
  }

  removeNotificationsForOrders(orderIds: string[]): NotificationItem[] {
    const idSet = new Set(orderIds);
    this.notifications = this.notifications.filter((n) => !n.orderId || !idSet.has(n.orderId));
    this.notifyListeners();
    return [...this.notifications];
  }
}

export const notificationService = new MockNotificationService();
