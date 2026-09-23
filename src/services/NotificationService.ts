/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INotificationService } from './interfaces';
import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

export class MockNotificationService implements INotificationService {
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l([...this.notifications]));
  }

  async notify(
    title: string,
    message: string,
    type: 'ORDER' | 'SECURITY' | 'DELIVERY' | 'SYSTEM',
    metadata?: { orderId?: string; smartBoxId?: string }
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
    };
    this.notifications.unshift(item);
    this.notifyListeners();
  }

  async getNotifications(): Promise<NotificationItem[]> {
    return this.notifications;
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
}

export const notificationService = new MockNotificationService();
