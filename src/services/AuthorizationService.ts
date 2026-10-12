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

  removeAuthorizationsForOrders(orderIds: string[]): TemporaryAccessAuthorization[] {
    const idSet = new Set(orderIds);
    this.authorizations = this.authorizations.filter((a) => !idSet.has(a.orderId));
    this.notify();
    return [...this.authorizations];
  }

  async createAccessRequest(params: {
    customerId: string;
    customerName: string;
    orderId: string;
    driverId?: string;
    driverName?: string;
    smartBoxId: string;
    compartmentId: string;
    reason?: string;
    isRetry?: boolean;
  }): Promise<TemporaryAccessAuthorization> {
    // FIX 2: Check for existing PENDING request matching exact parameters
    const existingPending = this.authorizations.find(
      (a) =>
        a.status === 'PENDING' &&
        a.orderId === params.orderId &&
        a.customerId === params.customerId &&
        (!params.driverId || !a.driverId || a.driverId === params.driverId) &&
        a.smartBoxId === params.smartBoxId &&
        a.compartmentId === params.compartmentId
    );
    if (existingPending) {
      return existingPending;
    }

    const newAuth: TemporaryAccessAuthorization = {
      id: `AUTH-REQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: params.customerId,
      customerName: params.customerName,
      orderId: params.orderId,
      driverId: params.driverId,
      driverName: params.driverName,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      otp: '', // Not usable until approved
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      expiresAt: '',
      isGeofenceRequired: true,
      isCameraPODRequired: true,
      isLoadCellVerified: true,
      geofenceRadiusMeters: 20,
      delegationType: 'DELIVERY',
      otpValidated: false,
      isOtpConsumed: false,
      requestReason: params.reason || (params.isRetry ? 'انتهت مهلة الإيداع السابقة' : undefined),
      isRetry: Boolean(params.isRetry),
    };

    this.authorizations.unshift(newAuth);
    this.notify();

    await auditService.recordEvent({
      actor: params.driverName || 'المندوب الميداني',
      actorRole: 'DRIVER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'ACCESS_REQUESTED',
      result: 'SUCCESS',
      details: params.isRetry
        ? 'طلب المندوب إذن فتح جديد للصندوق بعد انتهاء المهلة السابقة'
        : 'طلب المندوب إذن فتح الصندوق الذكي',
    });

    return newAuth;
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
    isRetry?: boolean;
  }): Promise<TemporaryAccessAuthorization> {
    const isDelivery = !params.delegationType || params.delegationType === 'DELIVERY';
    // Strict independent 5-minute security window for delivery authorizations
    const durationMins = isDelivery
      ? DELIVERY_AUTHORIZATION_DURATION_MINUTES
      : (params.expiresInMinutes || DELIVERY_AUTHORIZATION_DURATION_MINUTES);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const nowMs = Date.now();
    const expiresAtMs = nowMs + durationMins * 60 * 1000;
    const expiresAtDate = new Date(expiresAtMs);

    // If a pending request exists for this order, resolve it
    const existingPending = this.authorizations.find(
      (a) => a.orderId === params.orderId && a.status === 'PENDING'
    );

    const newAuth: TemporaryAccessAuthorization = {
      id: `AUTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
      isRetry: params.isRetry ?? existingPending?.isRetry,
      requestReason: existingPending?.requestReason,
    };

    if (existingPending) {
      this.authorizations = this.authorizations.map((a) => (a.id === existingPending.id ? newAuth : a));
    } else {
      this.authorizations.unshift(newAuth);
    }
    this.notify();

    // Audit log - NEVER log the raw OTP value
    await auditService.recordEvent({
      actor: params.customerName,
      actorRole: 'CUSTOMER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'ACCESS_AUTHORIZED',
      result: 'SUCCESS',
      details: `تم منح إذن فتح الصندوق وإصدار رمز رقمي جديد صالح لمدة ${durationMins} دقائق للمندوب ${params.driverName || 'المعين'}`,
    });

    return newAuth;
  }

  async rejectAccessRequest(orderId: string, reason?: string): Promise<boolean> {
    const auth = this.authorizations.find(
      (a) => a.orderId === orderId && (a.status === 'PENDING' || a.status === 'ACTIVE')
    );
    if (!auth) return false;
    auth.status = 'REJECTED';
    this.notify();

    await auditService.recordEvent({
      actor: auth.customerName || 'العميل',
      actorRole: 'CUSTOMER',
      orderId: auth.orderId,
      smartBoxId: auth.smartBoxId,
      compartmentId: auth.compartmentId,
      action: 'ACCESS_DENIED',
      result: 'WARNING',
      details: reason || 'رفض العميل السماح بفتح الصندوق الذكي',
    });

    return true;
  }

  async expireAuthorization(orderId: string): Promise<boolean> {
    let hasChanged = false;
    let smartBoxId = 'BOX-102';
    let compartmentId = '01';

    this.authorizations.forEach((a) => {
      if (a.orderId === orderId && a.status === 'ACTIVE') {
        a.status = 'EXPIRED';
        a.isOtpConsumed = true;
        hasChanged = true;
        smartBoxId = a.smartBoxId || smartBoxId;
        compartmentId = a.compartmentId || compartmentId;
      }
    });

    if (!hasChanged) return false;
    this.notify();

    await auditService.recordEvent({
      actor: 'نظام الصندوق الذكي',
      actorRole: 'ADMIN',
      orderId,
      smartBoxId,
      compartmentId,
      action: 'ACCESS_EXPIRED',
      result: 'FAILURE',
      details: 'انتهت مهلة السماح بفتح الصندوق (5 دقائق) وتم إلغاء صلاحية الرمز وقفل الصندوق آلياً',
    });

    return true;
  }

  async generateOTPForEligibleDelivery(orderId: string, driverId: string): Promise<string | null> {
    const activeCandidates = this.authorizations.filter(
      (a) => a.orderId === orderId && (!a.driverId || a.driverId === driverId) && a.status === 'ACTIVE'
    );
    if (activeCandidates.length === 0) return null;
    const auth = activeCandidates.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];

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
    // 1. Authorization exists and is ACTIVE
    let auth: TemporaryAccessAuthorization | undefined;

    if (params.authId) {
      auth = this.authorizations.find(
        (a) =>
          a.id === params.authId &&
          a.orderId === params.orderId &&
          (!params.driverId || !a.driverId || a.driverId === params.driverId) &&
          (!params.customerId || a.customerId === params.customerId) &&
          (!params.smartBoxId || a.smartBoxId === params.smartBoxId) &&
          (!params.compartmentId || a.compartmentId === params.compartmentId) &&
          a.status === 'ACTIVE'
      );
    }

    if (!auth) {
      const activeCandidates = this.authorizations.filter(
        (a) =>
          a.orderId === params.orderId &&
          (!params.driverId || !a.driverId || a.driverId === params.driverId) &&
          (!params.customerId || a.customerId === params.customerId) &&
          (!params.smartBoxId || a.smartBoxId === params.smartBoxId) &&
          (!params.compartmentId || a.compartmentId === params.compartmentId) &&
          a.status === 'ACTIVE'
      );
      if (activeCandidates.length > 0) {
        auth = activeCandidates.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
      }
    }

    if (!auth) {
      const expiredAuth = this.authorizations.find(
        (a) => a.orderId === params.orderId && a.smartBoxId === params.smartBoxId && a.status === 'EXPIRED'
      );
      if (expiredAuth) {
        return {
          granted: false,
          reason: 'انتهت صلاحية رمز الدخول المؤقت وتم قفل الصندوق.',
          errorCode: 'EXPIRED',
        };
      }

      const pendingAuth = this.authorizations.find(
        (a) => a.orderId === params.orderId && a.smartBoxId === params.smartBoxId && a.status === 'PENDING'
      );
      if (pendingAuth) {
        return {
          granted: false,
          reason: 'طلب الفتح لا يزال معلقاً بانتظار موافقة العميل.',
          errorCode: 'INVALID_STATUS',
        };
      }

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

    // 9. If OTP is provided, verify OTP is correct
    if (params.otp && auth.otp !== params.otp.trim()) {
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

    // 10. Single-use: Verify authorization has not already been consumed
    if (auth.isOtpConsumed) {
      await auditService.recordEvent({
        actor: auth.driverName || params.driverId,
        actorRole: 'DRIVER',
        orderId: params.orderId,
        smartBoxId: params.smartBoxId,
        compartmentId: params.compartmentId,
        action: 'ACCESS_DENIED',
        result: 'FAILURE',
        details: 'محاولة إعادة استخدام تصريح مستهلك مسبقاً (Replay Attack Prevention)',
      });

      return {
        granted: false,
        reason: 'تم استخدام هذا التصريح مسبقاً ولا يمكن إعادة استخدامه (تصريح للاستخدام لمرة واحدة فقط).',
        errorCode: 'INVALID_OTP',
      };
    }

    // All checks passed! Mark authorization validated.
    // Authorization remains ACTIVE until completeAccess marks it USED upon delivery completion.
    auth.isOtpConsumed = true;
    auth.otpValidated = true;
    auth.otpValidatedAt = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    this.notify();

    // Audit event without exposing plaintext secrets
    await auditService.recordEvent({
      actor: auth.driverName || params.driverId,
      actorRole: 'DRIVER',
      orderId: params.orderId,
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId,
      action: 'OTP_VALIDATED',
      result: 'SUCCESS',
      details: 'تم التحقق من التصريح الرقمي للمندوب بنجاح واستيفاء كافة الشروط الأمنية',
    });

    return {
      granted: true,
      authorization: auth,
    };
  }

  /**
   * Marks authorization as USED only after physical access & lock securement is complete.
   * FIX 3: Marks ONLY the current delivery cycle authorization, never modifying old expired authorizations.
   */
  async completeAccess(
    orderId: string,
    authId?: string,
    criteria?: {
      customerId?: string;
      driverId?: string;
      smartBoxId?: string;
      compartmentId?: string;
    }
  ): Promise<boolean> {
    const now = Date.now();
    let auth: TemporaryAccessAuthorization | undefined;

    // 1. authorizationId associated with the current delivery/access session
    if (authId) {
      auth = this.authorizations.find(
        (a) =>
          a.id === authId &&
          a.status === 'ACTIVE' &&
          a.otpValidated === true &&
          !a.usedAt &&
          (!a.expiresAtTimestamp || a.expiresAtTimestamp > now)
      );
    }

    // 2. otherwise the current ACTIVE authorization with otpValidated === true matching exact criteria
    if (!auth) {
      const candidates = this.authorizations.filter(
        (a) =>
          a.orderId === orderId &&
          a.status === 'ACTIVE' &&
          a.otpValidated === true &&
          (!criteria?.driverId || !a.driverId || a.driverId === criteria.driverId) &&
          (!criteria?.customerId || a.customerId === criteria.customerId) &&
          (!criteria?.smartBoxId || a.smartBoxId === criteria.smartBoxId) &&
          (!criteria?.compartmentId || a.compartmentId === criteria.compartmentId) &&
          (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
          !a.usedAt
      );
      if (candidates.length > 0) {
        auth = candidates.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
      }
    }

    if (!auth || auth.status !== 'ACTIVE' || !auth.otpValidated) return false;
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
   * Verifies if physical access is authorized for the box/compartment.
   * Absolute OTP Gate: Access is authorized ONLY when status is ACTIVE and otpValidated === true.
   */
  async isAccessAuthorized(
    boxId: string,
    compartmentId: string,
    orderId: string,
    driverId?: string,
    customerId?: string
  ): Promise<boolean> {
    const now = Date.now();
    const candidateAuths = this.authorizations.filter(
      (a) =>
        a.orderId === orderId &&
        a.smartBoxId === boxId &&
        a.compartmentId === compartmentId &&
        a.status === 'ACTIVE' &&
        (!driverId || !a.driverId || a.driverId === driverId) &&
        (!customerId || a.customerId === customerId) &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
        !a.usedAt &&
        a.otpValidated === true
    );

    if (candidateAuths.length === 0) return false;
    const auth = candidateAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
    // CRITICAL SECURITY REQUIREMENT (FIX 1): Absolute OTP Gate
    return auth.otpValidated === true && auth.status === 'ACTIVE';
  }

  getCurrentAuthorization(params: {
    orderId: string;
    driverId?: string;
    customerId?: string;
    smartBoxId?: string;
    compartmentId?: string;
    authId?: string;
  }): TemporaryAccessAuthorization | undefined {
    const now = Date.now();
    if (params.authId) {
      const byId = this.authorizations.find(
        (a) =>
          a.id === params.authId &&
          a.status !== 'EXPIRED' &&
          a.status !== 'USED' &&
          !a.usedAt &&
          (!a.expiresAtTimestamp || a.expiresAtTimestamp > now)
      );
      if (byId) return byId;
    }

    // Latest active authorization matching exact criteria
    const activeAuths = this.authorizations.filter(
      (a) =>
        a.orderId === params.orderId &&
        a.status === 'ACTIVE' &&
        (!params.driverId || !a.driverId || a.driverId === params.driverId) &&
        (!params.customerId || a.customerId === params.customerId) &&
        (!params.smartBoxId || a.smartBoxId === params.smartBoxId) &&
        (!params.compartmentId || a.compartmentId === params.compartmentId) &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
        !a.usedAt
    );
    if (activeAuths.length > 0) {
      return activeAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
    }

    // Check pending request for this cycle
    const pendingAuths = this.authorizations.filter(
      (a) =>
        a.orderId === params.orderId &&
        a.status === 'PENDING' &&
        (!params.driverId || !a.driverId || a.driverId === params.driverId) &&
        (!params.customerId || a.customerId === params.customerId) &&
        (!params.smartBoxId || a.smartBoxId === params.smartBoxId) &&
        (!params.compartmentId || a.compartmentId === params.compartmentId)
    );
    if (pendingAuths.length > 0) {
      return pendingAuths[0];
    }

    return undefined;
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

  async getAuthorizationByOrder(
    orderId: string,
    criteria?: {
      customerId?: string;
      driverId?: string;
      smartBoxId?: string;
      compartmentId?: string;
    }
  ): Promise<TemporaryAccessAuthorization | undefined> {
    const now = Date.now();
    const active = this.authorizations.find(
      (a) =>
        a.orderId === orderId &&
        a.status === 'ACTIVE' &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
        (!criteria?.driverId || !a.driverId || a.driverId === criteria.driverId) &&
        (!criteria?.customerId || a.customerId === criteria.customerId) &&
        (!criteria?.smartBoxId || a.smartBoxId === criteria.smartBoxId) &&
        (!criteria?.compartmentId || a.compartmentId === criteria.compartmentId)
    );
    if (active) return active;

    const pending = this.authorizations.find(
      (a) =>
        a.orderId === orderId &&
        a.status === 'PENDING' &&
        (!criteria?.driverId || !a.driverId || a.driverId === criteria.driverId) &&
        (!criteria?.customerId || a.customerId === criteria.customerId) &&
        (!criteria?.smartBoxId || a.smartBoxId === criteria.smartBoxId) &&
        (!criteria?.compartmentId || a.compartmentId === criteria.compartmentId)
    );
    return pending || undefined;
  }

  async getAuthorizationsForBox(boxId: string): Promise<TemporaryAccessAuthorization[]> {
    return this.authorizations.filter((a) => a.smartBoxId === boxId);
  }
}

export const authorizationService = new MockAuthorizationService();

