/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ICameraService } from './interfaces';
import { ProofOfDelivery } from '../types';

export class MockCameraService implements ICameraService {
  async captureProofOfDelivery(
    _boxId: string,
    _compartmentId: string,
    _orderId: string
  ): Promise<ProofOfDelivery> {
    const chars = '0123456789ABCDEF';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];

    return {
      photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      weightKg: 1.4,
      hash: `SEC-HASH: #${rand}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sensorAudit: {
        solenoidEngaged: true,
        reedSwitchClosed: true,
        weightDeltaKg: 1.4,
      },
    };
  }

  async getLiveSnapshot(_boxId: string): Promise<string> {
    return 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80';
  }

  async getSecurityIncidentSnapshot(_incidentCode: string): Promise<string> {
    return 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80';
  }
}

export const cameraService = new MockCameraService();
