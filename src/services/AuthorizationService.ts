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
import { DEMO_STORAGE_KEYS, loadFromStorage, saveToStorage } from './storage';

export const DELIVERY_AUTHORIZATION_DURATION_MINUTES = 5;

export class MockAuthorizationService implements IAuthorizationService {
  private authorizations: TemporaryAccessAuthorization[] = [];
  private listeners: ((auths: TemporaryAccessAuthorization[]) => void)[] = [];

  constructor() {
    const stored = loadFromStorage<TemporaryAccessAuthorization[] | null>(DEMO_STORAGE_KEYS.AUTHORIZATIONS, null);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      this.authorizations = stored;
    } else {
      this.authorizations = [...INITIAL_AUTHORIZATIONS];
      saveToStorage(DEMO_STORAGE_KEYS.AUTHORIZATIONS, this.authorizations);
    }
  }

  subscribe(listener: (auths: TemporaryAccessAuthorization[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    saveToStorage(DEMO_STORAGE_KEYS.AUTHORIZATIONS, this.authorizations);
    const cloned = [...this.authorizations];
    this.listeners.forEach((l) => l(cloned));
  }

  getAllAuthorizationsSync(): TemporaryAccessAuthorization[] {
    return [...this.authorizations];
  }

  resetToSeedData(): TemporaryAccessAuthorization[] {
    this.authorizations = [...INITIAL_AUTHORIZATIONS];
    this.notify();
    return [...this.authorizations];
  }

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
    const isDelivery = !params.delegationType || params.delegationType === 'DELIVERY';
    // Strict 5-minute security window for delivery authorizations
    const durationMins = isDelivery
      ? DELIVERY_AUTHORIZATION_DURATION_MINUTES
      : (params.expiresInMinutes || DELIVERY_AUTHORIZATION_DURATION_MINUTES);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
      otpValidated: false,
      isOtpConsumed: false,
    };

    this.authorizations.unshift(newAuth);
    this.notify();

    // Audit log - NEVER log the raw OTP value
    await auditService.recordEvent({
      actor: params.customerName,
      actorRole: 'CUSTOMER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'AUTHORIZATION_CREATED',
      result: 'SUCCESS',
      details: `تم إنشاء تصريح مؤقت برمز OTP مشفر صالح لمدة ${durationMins} دقائق للمندوب ${params.driverName || 'المعين'}`,
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
      this.notify();
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

    // Record audit event without writing the raw OTP value
    await auditService.recordEvent({
      actor: auth.driverName || 'المندوب المعتمد',
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: auth.smartBoxId,
      compartmentId: auth.compartmentId,
      action: 'OTP_GENERATED',
      result: 'SUCCESS',
      details: 'تم توليد رمز OTP بنجاح وتجهيز قناة التوثيق المشفرة BLE/NFC',
    });

    return auth.otp;
  }

  /**
   * Validates Smart Box Access with 10 strict security checks:
   * 1. Authorization exists
   * 2. Order matches
   * 3. Customer matches
   * 4. Driver matches
   * 5. Smart Box matches
   * 6. Compartment matches
   * 7. Status is ACTIVE
   * 8. Authorization has not expired (5-min window)
   * 9. OTP matches
   * 10. OTP has not already been consumed (single-use)
   */
  async validateAccess(params: ValidateAccessParams): Promise<ValidationResult> {
    // 1. Authorization exists
    const auth = this.authorizations.find(
      (a) => a.orderId === params.orderId && a.smartBoxId === params.smartBoxId
    );

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

    // 2. Authorization belongs to specified order
    if (auth.orderId !== params.orderId) {
      return {
        granted: false,
        reason: 'التصريح لا يتبع الطلب المحدد.',
        errorCode: 'INVALID_ORDER',
      };
    }

    // 3. Customer matches
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

    // 4. Driver matches
    if (auth.driverId && params.driverId && auth.driverId !== params.driverId) {
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

    // 5. Smart Box matches
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

    // 6. Compartment matches
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

    // 7. Authorization is ACTIVE
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

    // 8. Authorization has not expired (5-min window)
    const isTimestampExpired = auth.expiresAtTimestamp ? Date.now() > auth.expiresAtTimestamp : false;
    if (isTimestampExpired) {
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

      return { granted: false, reason: 'انتهت صلاحية هذا الرمز (تجاوز نافذة الـ 5 دقائق الأمنية).', errorCode: 'EXPIRED' };
    }

    // 9. OTP is correct
    if (auth.otp !== params.otp.trim()) {
      // NEVER log the raw OTP value in audit logs
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'فشل التحقق من رمز OTP (رمز غير مطابق)',
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

    // 10. Single-use OTP: Verify OTP has not already been consumed
    if (auth.isOtpConsumed) {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'محاولة إعادة استخدام رمز OTP مستهلك مسبقاً (Replay Attack Prevention)',
      });

      return {
        granted: false,
        reason: 'تم استخدام رمز OTP هذا مسبقاً ولا يمكن إعادة استخدامه (رمز للاستخدام لمرة واحدة فقط).',
        errorCode: 'INVALID_OTP',
      };
    }

    // All 10 checks passed! Mark OTP consumed and validated; update status to USED as required
    auth.isOtpConsumed = true;
    auth.otpValidated = true;
    auth.status = 'USED';
    auth.usedAt = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    auth.otpValidatedAt = auth.usedAt;
    this.notify();

    // NEVER log raw OTP in audit log
    await auditService.recordEvent({
      actor: auth.driverName || params.driverId,
      actorRole: 'DRIVER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'OTP_VALIDATED',
      result: 'SUCCESS',
      details: 'تم التحقق من رمز OTP بنجاح واستيفاء كافة الشروط الأمنية',
    });

    return {
      granted: true,
      authorization: auth,
    };
  }

  /**
   * Marks authorization as USED only after physical access & lock securement is complete
   */
  async completeAccess(orderId: string): Promise<boolean> {
    const auth = this.authorizations.find((a) => a.orderId === orderId);
    if (!auth) return false;
    auth.status = 'USED';
    auth.usedAt = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    this.notify();

    await auditService.recordEvent({
      actor: auth.driverName || 'المندوب',
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: auth.smartBoxId,
      compartmentId: auth.compartmentId,
      action: 'ACCESS_GRANTED',
      result: 'SUCCESS',
      details: 'اكتملت دورة الوصول الفيزيائي وتم تحويل حالة التصريح إلى مستخدم (USED)',
    });

    return true;
  }

  /**
   * Verifies if physical access is authorized for the box/compartment
   */
  async isAccessAuthorized(boxId: string, compartmentId: string, orderId: string): Promise<boolean> {
    const auth = this.authorizations.find(
      (a) => a.orderId === orderId && a.smartBoxId === boxId && a.compartmentId === compartmentId
    );
    if (!auth) return false;
    if (auth.status === 'REVOKED' || auth.status === 'EXPIRED') return false;
    if (auth.expiresAtTimestamp && Date.now() > auth.expiresAtTimestamp) {
      auth.status = 'EXPIRED';
      this.notify();
      return false;
    }
    return auth.otpValidated === true;
  }

  async revokeAuthorization(authId: string, reason: string): Promise<boolean> {
    const auth = this.authorizations.find((a) => a.id === authId);
    if (!auth) return false;
    auth.status = 'REVOKED';
    this.notify();

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

