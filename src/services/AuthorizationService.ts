/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IAuthorizationService,
  ValidateAccessParams,
  ValidationResult,
} from './interfaces';
import { TemporaryAccessAuthorization } from '../types';
import { INITIAL_AUTHORIZATIONS } from '../data/mockData';
import { auditService } from './AuditService';

export class MockAuthorizationService implements IAuthorizationService {
  private authorizations: TemporaryAccessAuthorization[] = [...INITIAL_AUTHORIZATIONS];

  async createAuthorization(params: {
    customerId: string;
    customerName: string;
    orderId: string;
    driverId?: string;
    driverName?: string;
    smartBoxId: string;
    compartmentId: string;
    expiresInMinutes?: number;
    delegationType?: 'DELIVERY' | 'FAMILY' | 'VISITOR';
    isGeofenceRequired?: boolean;
  }): Promise<TemporaryAccessAuthorization> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Default duration is strictly 5 minutes for deliveries
    const durationMins = params.expiresInMinutes !== undefined ? params.expiresInMinutes : 5;
    const nowMs = Date.now();
    const expiresAtMs = nowMs + durationMins * 60 * 1000;
    const expiresAtDate = new Date(expiresAtMs);

    const newAuth: TemporaryAccessAuthorization = {
      id: `AUTH-${Date.now()}`,
      customerId: params.customerId,
      customerName: params.customerName,
      orderId: params.orderId,
      driverId: params.driverId,
      driverName: params.driverName,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      otp,
      status: 'ACTIVE',
      createdAt: new Date(nowMs).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      expiresAt: expiresAtDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      expiresAtTimestamp: expiresAtMs,
      isGeofenceRequired: params.isGeofenceRequired !== false,
      isCameraPODRequired: true,
      isLoadCellVerified: true,
      geofenceRadiusMeters: 20,
      delegationType: params.delegationType || 'DELIVERY',
    };

    this.authorizations.unshift(newAuth);

    // Audit log
    await auditService.recordEvent({
      actor: params.customerName,
      actorRole: 'CUSTOMER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'AUTHORIZATION_CREATED',
      result: 'SUCCESS',
      details: `تم إنشاء تصريح مؤقت برمز OTP مشفر صالح لمدة ${durationMins} دقيقة للمندوب ${params.driverName || 'المعين'}`,
    });

    return newAuth;
  }

  async generateOTPForEligibleDelivery(orderId: string, driverId: string): Promise<string | null> {
    const auth = this.authorizations.find(
      (a) => a.orderId === orderId && (!a.driverId || a.driverId === driverId) && a.status === 'ACTIVE'
    );
    if (!auth) return null;

    // Check expiration timestamp
    if (auth.expiresAtTimestamp && Date.now() > auth.expiresAtTimestamp) {
      auth.status = 'EXPIRED';
      await auditService.recordEvent({
        actor: auth.driverName || driverId,
        actorRole: 'DRIVER',
        orderId,
        smartBoxId: auth.smartBoxId,
        action: 'OTP_EXPIRED',
        result: 'FAILURE',
        details: 'محاولة توليد OTP لتصريح منتهي الصلاحية',
      });
      return null;
    }

    // Refresh OTP if needed or return existing
    await auditService.recordEvent({
      actor: auth.driverName || 'المندوب المعتمد',
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: auth.smartBoxId,
      compartmentId: auth.compartmentId,
      action: 'OTP_GENERATED',
      result: 'SUCCESS',
      details: `تم توليد ومزامنة كود OTP (${auth.otp}) عبر القناة المشفرة BLE/NFC`,
    });

    return auth.otp;
  }

  async validateAccess(params: ValidateAccessParams): Promise<ValidationResult> {
    const auth = this.authorizations.find(
      (a) => a.orderId === params.orderId && a.smartBoxId === params.smartBoxId
    );

    // 1. Check if authorization exists
    if (!auth) {
      await auditService.recordEvent({
        actor: `المندوب (${params.driverId})`,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'محاولة فتح الصندوق بدون وجود تصريح مؤقت معتمد',
      });

      await auditService.recordSecurityIncident({
        incidentCode: `INC-DENY-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'HIGH',
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        title: 'محاولة وصول غير مصرح بها (لا يوجد تفويض مسجل)',
        description: `حاول المندوب ${params.driverId} فتح الحجيرة للطلب ${params.orderId} بدون إذن مسبق`,
        status: 'ACTIVE',
        actionTaken: 'تم رفض طلب الفتح وتجميد الاستجابة اللحظية',
        location: 'موقع الصندوق الذكي',
      });

      return {
        granted: false,
        reason: 'لا يوجد تصريح دخول نشط مسجل لهذا الطلب والصندوق.',
        errorCode: 'INVALID_ORDER',
      };
    }

    // 2. Check expiration time (using exact numeric timestamp)
    const isTimestampExpired = auth.expiresAtTimestamp ? Date.now() > auth.expiresAtTimestamp : false;
    if (auth.status === 'EXPIRED' || isTimestampExpired) {
      auth.status = 'EXPIRED';
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'OTP_EXPIRED',
        result: 'FAILURE',
        details: 'انتهت صلاحية رمز الدخول المؤقت (أكثر من 5 دقائق)',
      });

      await auditService.recordSecurityIncident({
        incidentCode: `INC-EXP-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'MEDIUM',
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        title: 'محاولة فتح برمز OTP منتهي الصلاحية',
        description: `انتهت صلاحية الرمز المؤقت المحدد بـ 5 دقائق للطلب ${params.orderId}`,
        status: 'RESOLVED',
        actionTaken: 'تم منع الفتح وطلب تجديد الإذن من العميل',
        location: 'موقع الصندوق الذكي',
      });

      return { granted: false, reason: 'انتهت صلاحية هذا الرمز (تجاوز 5 دقائق).', errorCode: 'EXPIRED' };
    }

    // 3. Check authorization status
    if (auth.status === 'REVOKED') {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'محاولة فتح باستخدام تصريح ملغى من العميل',
      });
      return { granted: false, reason: 'تم إلغاء هذا التصريح من قبل العميل.', errorCode: 'REVOKED' };
    }

    if (auth.status === 'USED') {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'محاولة فتح باستخدام تصريح مستهلك مسبقاً',
      });
      return { granted: false, reason: 'تم استخدام هذا التصريح لعملية سابقة بالفعل.', errorCode: 'REVOKED' };
    }

    if (auth.status !== 'ACTIVE') {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `حالة التصريح غير نشطة: ${auth.status}`,
      });
      return { granted: false, reason: 'حالة التصريح لا تسمح بالوصول.', errorCode: 'INVALID_STATUS' };
    }

    // 4. Check Customer ID
    if (auth.customerId !== params.customerId) {
      await auditService.recordEvent({
        actor: params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `معرف العميل غير مطابق: المتوقع ${auth.customerId} والمقدم ${params.customerId}`,
      });
      return { granted: false, reason: 'معرف العميل غير مطابق للتفويض.', errorCode: 'INVALID_CUSTOMER' };
    }

    // 5. Check Driver ID (if set)
    if (auth.driverId && auth.driverId !== params.driverId) {
      await auditService.recordEvent({
        actor: params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `المندوب ${params.driverId} حاول فتح صندوق مخصص للمندوب ${auth.driverId}`,
      });

      await auditService.recordSecurityIncident({
        incidentCode: `INC-DRV-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'MEDIUM',
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        title: 'محاولة فتح من مندوب غير مسند إليه الطلب',
        description: `المندوب ${params.driverId} حاول فتح صندوق معتمد لمندوب آخر (${auth.driverId})`,
        status: 'INVESTIGATING',
        actionTaken: 'تم رفض العملية وإرسال إشعار أمني',
        location: 'موقع الصندوق الذكي',
      });
      return { granted: false, reason: 'هذا التفويض مسند لمندوب آخر.', errorCode: 'INVALID_DRIVER' };
    }

    // 6. Check Smart Box ID
    if (auth.smartBoxId !== params.smartBoxId) {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `معرف الصندوق الذكي غير مطابق: المتوقع ${auth.smartBoxId} والمقدم ${params.smartBoxId}`,
      });
      return { granted: false, reason: 'معرف الصندوق الذكي غير مطابق.', errorCode: 'INVALID_BOX' };
    }

    // 7. Check Compartment ID
    if (auth.compartmentId && params.compartmentId && auth.compartmentId !== params.compartmentId) {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `محاولة فتح حجيرة غير مصرح بها: المتوقع ${auth.compartmentId} والمقدم ${params.compartmentId}`,
      });

      await auditService.recordSecurityIncident({
        incidentCode: `INC-COMP-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'MEDIUM',
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        title: 'محاولة فتح حجيرة خاطئة',
        description: `حاول المندوب فتح الحجيرة ${params.compartmentId} بينما التصريح للحجيرة ${auth.compartmentId}`,
        status: 'ACTIVE',
        actionTaken: 'تم رفض فتح الحجيرة وتوجيه المندوب للحجيرة الصحيحة',
        location: 'موقع الصندوق الذكي',
      });

      return {
        granted: false,
        reason: `هذا التصريح مخصص للحجيرة (${auth.compartmentId}) وليس الحجيرة (${params.compartmentId}).`,
        errorCode: 'INVALID_COMPARTMENT',
      };
    }

    // 8. Check OTP validity
    if (auth.otp !== params.otp.trim()) {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: `إدخال رمز OTP غير صحيح: [${params.otp}]`,
      });

      await auditService.recordSecurityIncident({
        incidentCode: `INC-OTP-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'HIGH',
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        title: 'محاولة إدخال OTP غير صالح',
        description: `محاولة إدخال رمز خاطئ لفتح الحجيرة ${params.compartmentId}`,
        status: 'ACTIVE',
        actionTaken: 'تم حظر محاولة الفتح وتسجيل لقطة كاميرا فورية',
        location: 'موقع الصندوق الذكي',
      });

      return { granted: false, reason: 'رمز OTP المدخل غير صحيح.', errorCode: 'INVALID_OTP' };
    }

    // Validation passed! Mark authorization as USED
    auth.status = 'USED';
    auth.usedAt = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    await auditService.recordEvent({
      actor: auth.driverName || params.driverId,
      actorRole: 'DRIVER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'OTP_VALIDATED',
      result: 'SUCCESS',
      details: 'تم التحقق من هوية المندوب وصلاحية الرمز بنجاح واجتياز السياج الجغرافي',
    });

    return {
      granted: true,
      authorization: auth,
    };
  }

  async revokeAuthorization(authId: string, reason: string): Promise<boolean> {
    const auth = this.authorizations.find((a) => a.id === authId);
    if (!auth) return false;
    auth.status = 'REVOKED';

    await auditService.recordEvent({
      actor: auth.customerName,
      actorRole: 'CUSTOMER',
      orderId: auth.orderId,
      smartBoxId: auth.smartBoxId,
      action: 'ACCESS_DENIED',
      result: 'WARNING',
      details: `تم إلغاء تصريح الدخول المؤقت: ${reason}`,
    });

    return true;
  }

  async getAuthorizationByOrder(orderId: string): Promise<TemporaryAccessAuthorization | undefined> {
    return this.authorizations.find((a) => a.orderId === orderId);
  }

  async getAuthorizationsForBox(boxId: string): Promise<TemporaryAccessAuthorization[]> {
    return this.authorizations.filter((a) => a.smartBoxId === boxId);
  }
}

export const authorizationService = new MockAuthorizationService();
