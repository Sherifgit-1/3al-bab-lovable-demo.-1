/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IAuditService } from './interfaces';
import { AuditLog, SecurityEvent, ActorRole, AuditAction } from '../types';
import { INITIAL_AUDIT_LOGS, INITIAL_SECURITY_EVENTS } from '../data/mockData';
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

export class MockAuditService implements IAuditService {
  private auditLogs: AuditLog[] = [];
  private securityEvents: SecurityEvent[] = [];

  constructor() {
    const storedLogs = loadFromStorage<AuditLog[] | null>(DEMO_STORAGE_KEYS.AUDIT_LOGS, null);
    if (storedLogs && Array.isArray(storedLogs) && storedLogs.length > 0) {
      this.auditLogs = storedLogs;
    } else {
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
      saveToStorage(DEMO_STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    }

    const storedSec = loadFromStorage<SecurityEvent[] | null>(DEMO_STORAGE_KEYS.SECURITY_EVENTS, null);
    if (storedSec && Array.isArray(storedSec) && storedSec.length > 0) {
      this.securityEvents = storedSec;
    } else {
      this.securityEvents = [...INITIAL_SECURITY_EVENTS];
      saveToStorage(DEMO_STORAGE_KEYS.SECURITY_EVENTS, this.securityEvents);
    }
  }

  private generateDigitalHash(): string {
    const chars = '0123456789abcdef';
    let h1 = '';
    let h2 = '';
    for (let i = 0; i < 4; i++) h1 += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 4; i++) h2 += chars[Math.floor(Math.random() * chars.length)];
    return `SHA256: ${h1}...${h2}`;
  }

  getAuditLogsSync(limit: number = 50): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  getSecurityEventsSync(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  resetToSeedData(): { auditLogs: AuditLog[]; securityEvents: SecurityEvent[] } {
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.securityEvents = [...INITIAL_SECURITY_EVENTS];
    saveToStorage(DEMO_STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    saveToStorage(DEMO_STORAGE_KEYS.SECURITY_EVENTS, this.securityEvents);
    return {
      auditLogs: [...this.auditLogs],
      securityEvents: [...this.securityEvents],
    };
  }

  async recordEvent(params: {
    actor: string;
    actorRole: ActorRole;
    orderId?: string;
    smartBoxId: string;
    compartmentId?: string;
    action: AuditAction;
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'ALERT';
    details: string;
  }): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: params.actor,
      actorRole: params.actorRole,
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: params.action,
      result: params.result,
      digitalHash: this.generateDigitalHash(),
      details: params.details,
    };

    this.auditLogs.unshift(newLog);
    saveToStorage(DEMO_STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
    return newLog;
  }

  async recordSecurityIncident(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const newEvent: SecurityEvent = {
      ...event,
      id: `sec-${Date.now()}`,
      timestamp: `الآن • ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
    };

    this.securityEvents.unshift(newEvent);
    saveToStorage(DEMO_STORAGE_KEYS.SECURITY_EVENTS, this.securityEvents);

    // Also record in audit log
    await this.recordEvent({
      actor: 'نظام الحراسة الآلي (IoT Security Core)',
      actorRole: 'ADMIN',
      smartBoxId: event.smartBoxId,
      compartmentId: event.compartmentId,
      action: 'TAMPER_DETECTED',
      result: 'ALERT',
      details: `${event.title} - ${event.description}`,
    });

    return newEvent;
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogs.slice(0, limit);
  }

  async getSecurityEvents(): Promise<SecurityEvent[]> {
    return this.securityEvents;
  }

  async resolveSecurityEvent(id: string, actionNote: string): Promise<void> {
    const evt = this.securityEvents.find((e) => e.id === id);
    if (evt) {
      evt.status = 'RESOLVED';
      evt.actionTaken = actionNote;
      saveToStorage(DEMO_STORAGE_KEYS.SECURITY_EVENTS, this.securityEvents);
    }
  }
}

export const auditService = new MockAuditService();
