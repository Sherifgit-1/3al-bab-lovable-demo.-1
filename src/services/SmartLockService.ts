/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ISmartLockService,
  LockStateResult,
  DoorStateResult,
  BatteryStateResult,
  TamperStateResult,
} from './interfaces';

export class MockSmartLockService implements ISmartLockService {
  private locksState: Map<string, { isLocked: boolean; isDoorClosed: boolean }> = new Map();
  private batteryState: Map<string, { level: number; voltage: string }> = new Map();
  private tamperState: Map<string, { isTampered: boolean; vibrationG: number; count: number }> = new Map();

  constructor() {
    // Initial mock states for BOX-102
    this.locksState.set('BOX-102-01', { isLocked: true, isDoorClosed: true });
    this.locksState.set('BOX-102-02', { isLocked: true, isDoorClosed: true });
    this.batteryState.set('BOX-102', { level: 99, voltage: '12.4V DC' });
    this.tamperState.set('BOX-102', { isTampered: false, vibrationG: 0.1, count: 0 });

    // Initial mock states for BOX-408 (simulated incident)
    this.tamperState.set('BOX-408', { isTampered: true, vibrationG: 4.8, count: 3 });
  }

  private getKey(boxId: string, compartmentId: string = '01') {
    return `${boxId}-${compartmentId}`;
  }

  async unlock(boxId: string, compartmentId: string = '01'): Promise<{ success: boolean; message: string }> {
    const key = this.getKey(boxId, compartmentId);
    this.locksState.set(key, { isLocked: false, isDoorClosed: false });
    return {
      success: true,
      message: `[SIMULATED HARDWARE] Solenoid latch released on ${boxId} (حجيرة ${compartmentId})`,
    };
  }

  async lock(boxId: string, compartmentId: string = '01'): Promise<{ success: boolean; message: string }> {
    const key = this.getKey(boxId, compartmentId);
    this.locksState.set(key, { isLocked: true, isDoorClosed: true });
    return {
      success: true,
      message: `[SIMULATED HARDWARE] Solenoid latch engaged and locked on ${boxId} (حجيرة ${compartmentId})`,
    };
  }

  async getLockStatus(boxId: string, compartmentId: string = '01'): Promise<LockStateResult> {
    const key = this.getKey(boxId, compartmentId);
    const state = this.locksState.get(key) || { isLocked: true, isDoorClosed: true };
    return {
      isLocked: state.isLocked,
      solenoidStatus: state.isLocked ? 'ENGAGED' : 'DISENGAGED',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
    };
  }

  async getDoorStatus(boxId: string, compartmentId: string = '01'): Promise<DoorStateResult> {
    const key = this.getKey(boxId, compartmentId);
    const state = this.locksState.get(key) || { isLocked: true, isDoorClosed: true };
    return {
      isClosed: state.isDoorClosed,
      angleDegrees: state.isDoorClosed ? 0 : 85,
      reedSwitchStatus: state.isDoorClosed ? 'CLOSED_100%' : 'OPEN',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
    };
  }

  async getBatteryStatus(boxId: string): Promise<BatteryStateResult> {
    const state = this.batteryState.get(boxId) || { level: 90, voltage: '12.2V DC' };
    return {
      levelPct: state.level,
      voltage: state.voltage,
      isCharging: true,
    };
  }

  async getTamperStatus(boxId: string): Promise<TamperStateResult> {
    const state = this.tamperState.get(boxId) || { isTampered: false, vibrationG: 0.1, count: 0 };
    return {
      isTampered: state.isTampered,
      vibrationG: state.vibrationG,
      alertsCount: state.count,
    };
  }

  async triggerTamperAlarm(boxId: string, severity: 'HIGH' | 'CRITICAL'): Promise<void> {
    this.tamperState.set(boxId, {
      isTampered: true,
      vibrationG: severity === 'CRITICAL' ? 4.8 : 2.5,
      count: ((this.tamperState.get(boxId)?.count || 0) + 1),
    });
  }

  async resetTamper(boxId: string): Promise<void> {
    this.tamperState.set(boxId, { isTampered: false, vibrationG: 0.05, count: 0 });
  }
}

export const smartLockService = new MockSmartLockService();
