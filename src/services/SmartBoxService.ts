/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISmartBoxService } from './interfaces';
import { SmartBox, Compartment } from '../types';
import { INITIAL_SMART_BOXES } from '../data/mockData';
import { smartLockService } from './SmartLockService';
import { auditService } from './AuditService';

export class MockSmartBoxService implements ISmartBoxService {
  private boxes: SmartBox[] = [...INITIAL_SMART_BOXES];

  async getBox(boxId: string): Promise<SmartBox | undefined> {
    return this.boxes.find((b) => b.id === boxId);
  }

  async getAllBoxes(): Promise<SmartBox[]> {
    return this.boxes;
  }

  async getCompartments(boxId: string): Promise<Compartment[]> {
    const box = this.boxes.find((b) => b.id === boxId);
    return box ? box.compartments : [];
  }

  async reserveCompartment(boxId: string, compartmentId: string, orderId: string): Promise<boolean> {
    const box = this.boxes.find((b) => b.id === boxId);
    if (!box) return false;
    const comp = box.compartments.find((c) => c.id === compartmentId);
    if (!comp || comp.status !== 'AVAILABLE') return false;

    comp.status = 'RESERVED';
    comp.currentOrderId = orderId;
    return true;
  }

  async releaseCompartment(boxId: string, compartmentId: string): Promise<boolean> {
    const box = this.boxes.find((b) => b.id === boxId);
    if (!box) return false;
    const comp = box.compartments.find((c) => c.id === compartmentId);
    if (!comp) return false;

    comp.status = 'AVAILABLE';
    comp.currentOrderId = undefined;
    comp.currentWeightKg = 0;
    return true;
  }

  async updateWeight(boxId: string, compartmentId: string, weightKg: number): Promise<void> {
    const box = this.boxes.find((b) => b.id === boxId);
    if (!box) return;
    const comp = box.compartments.find((c) => c.id === compartmentId);
    if (!comp) return;

    comp.currentWeightKg = weightKg;
  }

  /**
   * Simulates full physical hardware cycle:
   * 1. Unlock Solenoid
   * 2. Door opens (Reed switch open)
   * 3. Package deposited (Load cell detects +weightKg)
   * 4. Door closes (Reed switch closed)
   * 5. Solenoid latch engages and locks
   */
  async simulatePhysicalCycle(
    boxId: string,
    compartmentId: string,
    packageWeightKg: number = 1.4
  ): Promise<void> {
    const box = this.boxes.find((b) => b.id === boxId);
    if (!box) return;
    const comp = box.compartments.find((c) => c.id === compartmentId);

    // Step 1: Unlock
    await smartLockService.unlock(boxId, compartmentId);
    box.isLocked = false;
    box.isDoorOpen = true;
    if (comp) {
      comp.isSolenoidLocked = false;
      comp.isDoorClosed = false;
    }

    await auditService.recordEvent({
      actor: 'محاكي العتاد الذكي (IoT Box Hardware)',
      actorRole: 'ADMIN',
      smartBoxId: boxId,
      compartmentId,
      action: 'SMART_BOX_UNLOCKED',
      result: 'SUCCESS',
      details: `[SIMULATED HARDWARE] فتح مزلاج السولينويد للحجيرة ${compartmentId}`,
    });

    await auditService.recordEvent({
      actor: 'محاكي العتاد الذكي (IoT Box Hardware)',
      actorRole: 'ADMIN',
      smartBoxId: boxId,
      compartmentId,
      action: 'DOOR_OPENED',
      result: 'SUCCESS',
      details: `[SIMULATED HARDWARE] ارتداد الباب بزاوية 85 درجة ومفتاح الريد مفتوح`,
    });

    // Step 2: Deposit Package (Load cell weight)
    if (comp) {
      comp.currentWeightKg = packageWeightKg;
      comp.status = 'OCCUPIED';
    }

    await auditService.recordEvent({
      actor: 'محاكي العتاد الذكي (IoT Box Hardware)',
      actorRole: 'ADMIN',
      smartBoxId: boxId,
      compartmentId,
      action: 'PACKAGE_DEPOSITED',
      result: 'SUCCESS',
      details: `[SIMULATED HARDWARE] رصد حساس الوزن الديناميكي للوزن الجديد: +${packageWeightKg} كجم`,
    });

    // Step 3: Close Door & Lock
    await smartLockService.lock(boxId, compartmentId);
    box.isLocked = true;
    box.isDoorOpen = false;
    if (comp) {
      comp.isSolenoidLocked = true;
      comp.isDoorClosed = true;
    }

    await auditService.recordEvent({
      actor: 'محاكي العتاد الذكي (IoT Box Hardware)',
      actorRole: 'ADMIN',
      smartBoxId: boxId,
      compartmentId,
      action: 'DOOR_CLOSED',
      result: 'SUCCESS',
      details: `[SIMULATED HARDWARE] إغلاق الباب بنسبة 100% وتطابق حساس المغناطيس`,
    });

    await auditService.recordEvent({
      actor: 'محاكي العتاد الذكي (IoT Box Hardware)',
      actorRole: 'ADMIN',
      smartBoxId: boxId,
      compartmentId,
      action: 'SMART_BOX_LOCKED',
      result: 'SUCCESS',
      details: `[SIMULATED HARDWARE] تعشيق مزلاج القفل الكهرومغناطيسي وتأمين الحجيرة`,
    });
  }
}

export const smartBoxService = new MockSmartBoxService();
