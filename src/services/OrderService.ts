/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Order,
  OrderStatus,
  ActorRole,
  AuditAction,
} from '../types';
import { IOrderService, CreateOrderParams } from './interfaces';
import { INITIAL_ORDERS, INITIAL_MERCHANTS, INITIAL_DRIVERS } from '../data/mockData';
import { auditService } from './AuditService';
import { notificationService } from './NotificationService';

export class MockOrderService implements IOrderService {
  private orders: Order[] = [...INITIAL_ORDERS];
  private listeners: ((orders: Order[]) => void)[] = [];

  constructor() {
    // Ensure Demo Order TW-1001 is ready for testing if not already present
    if (!this.orders.some((o) => o.id === 'TW-1001')) {
      const demoOrder: Order = {
        id: 'TW-1001',
        orderNumber: 'TW-1001',
        orderType: 'INTERNAL_ORDER',
        customerId: 'cust-1',
        customerName: 'أحمد مصطفى (Demo Customer)',
        customerPhone: '+20 100 123 4567',
        merchantId: 'merch-1',
        merchantName: 'ميدل إيست تيك (Demo Merchant)',
        merchantBranch: 'فرع التجمع الخامس',
        driverId: 'drv-1',
        driverName: 'إسلام عامر (Demo Driver)',
        driverPhone: '+20 111 876 5432',
        driverVehicle: 'فان كهربائية EV-04',
        smartBoxId: 'BOX-102',
        compartmentId: '02',
        compartmentSize: 'M',
        status: 'PENDING',
        items: [
          {
            id: 'item-demo-1',
            name: 'شاحن أنكر نانو 65W GaN فائق السرعة',
            specs: 'اللون: أسود داكن • أصلي 100%',
            quantity: 1,
            price: 850,
          },
          {
            id: 'item-demo-2',
            name: 'سماعة بلوتوث Soundcore اللاسلكية',
            specs: 'عزل ضوضاء فعال ANC • بطارية 32 ساعة',
            quantity: 1,
            price: 580,
          },
        ],
        subtotal: 1430,
        deliveryFee: 0,
        discount: 45,
        tax: 0,
        total: 1430,
        deliveryAddress: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس، القاهرة',
        deliveryNotes: 'يرجى الإيداع في الحجيرة M بالصندوق الذكي الرئيسي BOX-102',
        createdAt: 'اليوم، 10:00 ص',
        updatedAt: 'اليوم، 10:00 ص',
        estimatedDeliveryTime: 'خلال 20 دقيقة',
        accessAuthorizationId: 'AUTH-1001',
      };
      this.orders.unshift(demoOrder);
    }
  }

  subscribe(listener: (orders: Order[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const cloned = [...this.orders];
    this.listeners.forEach((l) => l(cloned));
  }

  async getAllOrders(): Promise<Order[]> {
    return [...this.orders];
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.find((o) => o.id === orderId);
  }

  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.customerId === customerId);
  }

  async getMerchantOrders(merchantId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.merchantId === merchantId);
  }

  async getDriverOrders(driverId: string): Promise<Order[]> {
    return this.orders.filter(
      (o) =>
        o.driverId === driverId ||
        (o.status === 'READY' && !o.driverId) ||
        o.status === 'ASSIGNED_TO_DRIVER'
    );
  }

  async createOrder(params: CreateOrderParams): Promise<Order> {
    const timestampStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const orderId = `TW-${Math.floor(1000 + Math.random() * 9000)}`;

    const merchant = params.merchantId ? INITIAL_MERCHANTS.find((m) => m.id === params.merchantId) : undefined;
    const subtotal =
      params.subtotal ??
      params.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const deliveryFee = params.deliveryFee ?? 0;
    const discount = params.discount ?? 0;
    const total = params.total ?? subtotal + deliveryFee - discount;

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderId,
      orderType: params.orderType || 'INTERNAL_ORDER',
      customerId: params.customerId,
      customerName: params.customerName || 'أحمد مصطفى',
      customerPhone: params.customerPhone || '+20 100 123 4567',
      merchantId: params.merchantId,
      merchantName: params.merchantName || merchant?.name || (params.externalDetails ? params.externalDetails.externalMerchant : 'متجر معتمد'),
      merchantBranch: merchant?.address ? `فرع ${merchant.address.split('-')[0].trim()}` : (params.orderType === 'EXTERNAL_ORDER' ? 'شحنة متجر خارجي' : 'الفرع الرئيسي'),
      smartBoxId: params.smartBoxId,
      compartmentId: params.compartmentId || '02',
      compartmentSize: params.compartmentSize,
      status: 'PENDING',
      items: params.items,
      subtotal,
      deliveryFee,
      discount,
      tax: 0,
      total,
      deliveryAddress:
        params.deliveryAddress || 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
      deliveryNotes:
        params.deliveryNotes || 'يرجى إيداع الطرد بالحجيرة المحددة وإغلاق الباب بإحكام.',
      createdAt: `اليوم، ${timestampStr}`,
      updatedAt: `اليوم، ${timestampStr}`,
      estimatedDeliveryTime: 'خلال 25 دقيقة',
      accessAuthorizationId: `AUTH-${orderId}`,
      externalDetails: params.externalDetails,
    };

    this.orders.unshift(newOrder);
    this.notifyListeners();

    // 1. Audit Log: ORDER_CREATED
    await auditService.recordEvent({
      actor: newOrder.customerName,
      actorRole: 'CUSTOMER',
      orderId: newOrder.id,
      smartBoxId: newOrder.smartBoxId,
      compartmentId: newOrder.compartmentId,
      action: 'ORDER_CREATED',
      result: 'SUCCESS',
      details: `تم إنشاء طلب جديد #${newOrder.id} بقيمة ${newOrder.total} ج.م مع حجز الحجيرة (${newOrder.compartmentSize}) بالصندوق الذكي ${newOrder.smartBoxId}`,
    });

    // 2. Notifications: Merchant & Admin
    await notificationService.notify(
      'تم استلام طلب جديد',
      `طلب جديد #${newOrder.id} من العميل ${newOrder.customerName} بقيمة ${newOrder.total} ج.م`,
      'ORDER',
      { orderId: newOrder.id, smartBoxId: newOrder.smartBoxId }
    );

    await notificationService.notify(
      'طلب جديد بالنظام',
      `تم تسجيل طلب جديد #${newOrder.id} موجه للصندوق ${newOrder.smartBoxId}`,
      'SYSTEM',
      { orderId: newOrder.id, smartBoxId: newOrder.smartBoxId }
    );

    return newOrder;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    role: ActorRole,
    actorId?: string,
    actorName?: string,
    additionalData?: Partial<Order>
  ): Promise<{ success: boolean; message: string; order?: Order }> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'الطلب غير موجود بالنظام.' };
    }

    const currentStatus = order.status;

    // RBAC & Lifecycle State Machine Verification
    const validation = this.validateTransition(currentStatus, newStatus, role);
    if (!validation.allowed) {
      return {
        success: false,
        message: validation.reason || 'الانتقال بين هذه الحالات غير مسموح لدورك الحالي.',
      };
    }

    // Apply updates
    const nowStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    order.status = newStatus;
    order.updatedAt = `اليوم، ${nowStr}`;

    if (additionalData) {
      Object.assign(order, additionalData);
    }

    if (newStatus === 'COMPLETED') {
      order.completedAt = `اليوم، ${nowStr}`;
      order.actualDeliveryTime = `اليوم، ${nowStr}`;
    }

    this.notifyListeners();

    // Trigger Audit & Notifications based on state
    await this.handleStateEffects(order, newStatus, role, actorId, actorName);

    return { success: true, message: 'تم تحديث حالة الطلب بنجاح.', order };
  }

  async assignDriver(
    orderId: string,
    driverId: string,
    role: ActorRole
  ): Promise<{ success: boolean; message: string; order?: Order }> {
    if (role !== 'MERCHANT' && role !== 'ADMIN') {
      return { success: false, message: 'صلاحية إسناد المندوب متاحة للتاجر أو إدارة المنصة فقط.' };
    }

    const driver = INITIAL_DRIVERS.find((d) => d.id === driverId) || INITIAL_DRIVERS[0];
    return this.updateOrderStatus(
      orderId,
      'ASSIGNED_TO_DRIVER',
      role,
      role === 'MERCHANT' ? 'merch-1' : 'admin-1',
      role === 'MERCHANT' ? 'ميدل إيست تيك' : 'مدير العمليات',
      {
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        driverVehicle: driver.vehicle,
      }
    );
  }

  async cancelOrder(
    orderId: string,
    role: ActorRole,
    reason?: string
  ): Promise<{ success: boolean; message: string; order?: Order }> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'الطلب غير موجود.' };

    if (role === 'CUSTOMER' && order.status !== 'PENDING') {
      return {
        success: false,
        message: 'لا يمكن إلغاء الطلب بعد اعتماده وبدء تجهيزه من قبل المتجر.',
      };
    }

    return this.updateOrderStatus(
      orderId,
      'CANCELLED',
      role,
      order.customerId,
      order.customerName,
      { deliveryNotes: reason ? `سبب الإلغاء: ${reason}` : order.deliveryNotes }
    );
  }

  async rejectOrder(
    orderId: string,
    role: ActorRole,
    reason?: string
  ): Promise<{ success: boolean; message: string; order?: Order }> {
    if (role !== 'MERCHANT' && role !== 'ADMIN') {
      return { success: false, message: 'صلاحية رفض الطلب متاحة للتاجر فقط.' };
    }

    return this.updateOrderStatus(
      orderId,
      'REJECTED',
      role,
      'merch-1',
      'إدارة المتجر',
      { deliveryNotes: reason ? `اعتذار المتجر: ${reason}` : 'اعتذر المتجر عن تلبية الطلب' }
    );
  }

  private validateTransition(
    current: OrderStatus,
    target: OrderStatus,
    role: ActorRole
  ): { allowed: boolean; reason?: string } {
    if (role === 'ADMIN') {
      return { allowed: true };
    }

    // Cancellation & Rejection handling
    if (target === 'CANCELLED') {
      if (role === 'CUSTOMER') {
        if (current === 'PENDING') return { allowed: true };
        return { allowed: false, reason: 'لا يمكن للعميل إلغاء الطلب بعد اعتماده من المتجر.' };
      }
      return { allowed: true };
    }

    if (target === 'REJECTED') {
      if (role === 'MERCHANT' && current === 'PENDING') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'لا يمكن رفض الطلب إلا وهو بحالة جديدة معلقة (PENDING).' };
    }

    if (target === 'DELIVERY_FAILED') {
      if (role === 'DRIVER') return { allowed: true };
      return { allowed: false, reason: 'تعذر التسليم يسجل فقط بواسطة المندوب الميداني.' };
    }

    // Role-specific allowed transitions:
    switch (role) {
      case 'CUSTOMER':
        return {
          allowed: false,
          reason: 'العميل لا يملك صلاحية تغيير مرحلة تشغيل الطلب يدوياً.',
        };

      case 'MERCHANT':
        if (current === 'PENDING') {
          if (target === 'ACCEPTED') return { allowed: true };
        }
        if (current === 'ACCEPTED') {
          if (target === 'PREPARING') return { allowed: true };
        }
        if (current === 'PREPARING') {
          if (target === 'READY') return { allowed: true };
        }
        if (current === 'READY') {
          if (target === 'ASSIGNED_TO_DRIVER') return { allowed: true };
        }
        if (target === 'COMPLETED') {
          return {
            allowed: false,
            reason: 'لا يمكن للتاجر وسم الطلب كمكتمل قبل إتمام التسليم الفعلي بالصندوق الذكي.',
          };
        }
        return {
          allowed: false,
          reason: `التاجر غير مصرح له بالانتقال من ${current} إلى ${target}.`,
        };

      case 'DRIVER':
        if (current === 'READY' || current === 'ASSIGNED_TO_DRIVER') {
          if (target === 'PICKED_UP') return { allowed: true };
        }
        if (current === 'PICKED_UP') {
          if (target === 'OUT_FOR_DELIVERY') return { allowed: true };
        }
        if (current === 'OUT_FOR_DELIVERY') {
          if (target === 'DRIVER_ARRIVED') return { allowed: true };
        }
        if (current === 'DRIVER_ARRIVED') {
          if (target === 'ACCESS_AUTHORIZED') return { allowed: true };
        }
        if (current === 'ACCESS_AUTHORIZED') {
          if (target === 'OTP_VALIDATED') return { allowed: true };
        }
        if (current === 'OTP_VALIDATED') {
          if (target === 'SMART_BOX_OPENED') return { allowed: true };
        }
        if (current === 'SMART_BOX_OPENED') {
          if (target === 'PACKAGE_DEPOSITED') return { allowed: true };
        }
        if (current === 'PACKAGE_DEPOSITED') {
          if (target === 'SMART_BOX_SECURED') return { allowed: true };
        }
        if (current === 'SMART_BOX_SECURED') {
          if (target === 'COMPLETED') return { allowed: true };
        }
        return {
          allowed: false,
          reason: `المندوب غير مصرح له بالانتقال من ${current} إلى ${target} دون المرور بتسلسل الأمان.`,
        };

      default:
        return { allowed: false, reason: 'دور غير معروف.' };
    }
  }

  private async handleStateEffects(
    order: Order,
    newStatus: OrderStatus,
    role: ActorRole,
    actorId?: string,
    actorName?: string
  ) {
    const actor: string =
      actorName ||
      (role === 'CUSTOMER'
        ? order.customerName
        : role === 'MERCHANT'
        ? order.merchantName || 'المتجر'
        : order.driverName || 'المندوب');

    switch (newStatus) {
      case 'ACCEPTED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_ACCEPTED',
          result: 'SUCCESS',
          details: `تم قبول الطلب #${order.id} من المتجر وتثبيت أولوية التجهيز`,
        });
        await notificationService.notify(
          'تم قبول طلبك',
          `قام المتجر ${order.merchantName} بقبول طلبك #${order.id} بنجاح`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'PREPARING':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_PREPARING',
          result: 'SUCCESS',
          details: `المتجر بدأ مرحلة التجهيز والتغليف الآمن للطلب #${order.id}`,
        });
        await notificationService.notify(
          'جاري تجهيز طلبك',
          `يقوم المتجر الآن بفحص وتغليف محتويات طلبك #${order.id}`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'READY':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_READY',
          result: 'SUCCESS',
          details: `اكتمل تجهيز الطلب #${order.id} وجاهز للاستلام من قبل المندوب`,
        });
        await notificationService.notify(
          'الطلب جاهز',
          `طلبك #${order.id} جاهز تماماً للاستلام من المندوب`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'ASSIGNED_TO_DRIVER':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'DRIVER_ASSIGNED',
          result: 'SUCCESS',
          details: `تم إسناد الطلب #${order.id} للمندوب ${order.driverName || 'إسلام عامر'} (${order.driverVehicle || 'EV-04'})`,
        });
        await notificationService.notify(
          'تم تعيين طلب جديد',
          `لديك شحنة جديدة مسندة #${order.id} للاستلام من ${order.merchantName}`,
          'DELIVERY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        await notificationService.notify(
          'تم تعيين مندوب',
          `تم إسناد طلب #${order.id} للمندوب ${order.driverName || 'إسلام عامر'}`,
          'SYSTEM',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'PICKED_UP':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_PICKED_UP',
          result: 'SUCCESS',
          details: `استلم المندوب ${order.driverName} الشحنة #${order.id} من مقر المتجر`,
        });
        await notificationService.notify(
          'المندوب استلم الطلب',
          `استلم المندوب طلبك #${order.id} من المتجر وبصدد الانطلاق`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        await notificationService.notify(
          'المندوب استلم الطلب',
          `قام المندوب ${order.driverName} باستلام طرد الشحنة #${order.id}`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'OUT_FOR_DELIVERY':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'DRIVER_OUT_FOR_DELIVERY',
          result: 'SUCCESS',
          details: `المندوب في خط السير الميداني نحو الصندوق الذكي ${order.smartBoxId}`,
        });
        await notificationService.notify(
          'المندوب في الطريق',
          `المندوب ${order.driverName} في طريقه الآن لتسليم الطلب #${order.id} بالصندوق الذكي`,
          'DELIVERY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'DRIVER_ARRIVED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'DRIVER_ARRIVED',
          result: 'SUCCESS',
          details: `وصل المندوب أمام الصندوق الذكي ${order.smartBoxId} وتم التحقق من السياج الجغرافي`,
        });
        await notificationService.notify(
          'المندوب وصل',
          `وصل المندوب أمام الصندوق الذكي ${order.smartBoxId} لبدء الإيداع`,
          'DELIVERY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        await notificationService.notify(
          'تم الوصول إلى Smart Box',
          `المندوب ${order.driverName} وصل لموقع الصندوق ${order.smartBoxId}`,
          'SYSTEM',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'ACCESS_AUTHORIZED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ACCESS_REQUESTED',
          result: 'SUCCESS',
          details: `طلب المندوب إذن الدخول المؤقت وتم تفعيل صلاحية الفتح لمدة 5 دقائق`,
        });
        await notificationService.notify(
          'تم السماح بالوصول إلى الصندوق',
          `تم تفعيل تصريح الدخول المؤقت برمز OTP لفتح الحجيرة ${order.compartmentId}`,
          'SECURITY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'OTP_VALIDATED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'OTP_VALIDATED',
          result: 'SUCCESS',
          details: `تمت مطابقة رمز التحقق OTP بنجاح والتحقق من كافة الشروط الأمنية`,
        });
        break;

      case 'SMART_BOX_OPENED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'SMART_BOX_UNLOCKED',
          result: 'SUCCESS',
          details: `تم فصل مزلاج السولينويد الكهرومغناطيسي وفتح باب الحجيرة ${order.compartmentId}`,
        });
        await notificationService.notify(
          'تم فتح الصندوق',
          `تم فك قفل الحجيرة ${order.compartmentId} بالصندوق ${order.smartBoxId} لإيداع الطرد`,
          'SECURITY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'PACKAGE_DEPOSITED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'PACKAGE_DEPOSITED',
          result: 'SUCCESS',
          details: `تم وضع الطرد ورصد زيادة الوزن عبر مستشعر Load Cell بالحجيرة ${order.compartmentId}`,
        });
        await notificationService.notify(
          'تم إيداع طلبك في الصندوق',
          `تم وضع شحنتك #${order.id} داخل الحجيرة الذكية بنجاح`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'SMART_BOX_SECURED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'SMART_BOX_LOCKED',
          result: 'SUCCESS',
          details: `تم إغلاق الباب ميكانيكياً وإحكام قفل السولينويد وتأمين الحجيرة 100%`,
        });
        await notificationService.notify(
          'تم تأمين الصندوق',
          `تم إغلاق وقفل باب الحجيرة بالصندوق ${order.smartBoxId} بالكامل`,
          'SECURITY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'COMPLETED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'DELIVERY_COMPLETED',
          result: 'SUCCESS',
          details: `اكتملت دورة تسليم الطلب #${order.id} بالكامل وتم حفظ توثيق التسليم POD بسجل التدقيق الرقمي`,
        });
        await notificationService.notify(
          'تم التسليم',
          `تم تسليم وتأمين طلبك #${order.id} في الصندوق الذكي. جاهز لاستلامك بأي وقت!`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        await notificationService.notify(
          'تم اكتمال تسليم الطلب',
          `تم إيداع الطلب #${order.id} بالصندوق بنجاح واكتمال الدورة`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        await notificationService.notify(
          'تم إكمال التسليم',
          `تم إنهاء تسليم الطلب #${order.id} وتأمين الصندوق ${order.smartBoxId}`,
          'SYSTEM',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'CANCELLED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_CANCELLED',
          result: 'WARNING',
          details: `تم إلغاء الطلب #${order.id} بواسطة ${actor} (${role})`,
        });
        await notificationService.notify(
          'تم إلغاء الطلب',
          `تم إلغاء الطلب #${order.id} بنجاح`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'REJECTED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'ORDER_REJECTED',
          result: 'WARNING',
          details: `تم رفض الطلب #${order.id} من المتجر`,
        });
        await notificationService.notify(
          'اعتذر المتجر عن الطلب',
          `اعتذر المتجر عن تلبية طلبك #${order.id}`,
          'ORDER',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;

      case 'DELIVERY_FAILED':
        await auditService.recordEvent({
          actor,
          actorRole: role,
          orderId: order.id,
          smartBoxId: order.smartBoxId,
          compartmentId: order.compartmentId,
          action: 'DELIVERY_FAILED',
          result: 'ALERT',
          details: `تعذر تسليم الطلب #${order.id} بالصندوق الذكي`,
        });
        await notificationService.notify(
          'تعذر تسليم الطلب',
          `تعذر تسليم شحنتك #${order.id} في الصندوق الذكي، جاري متابعة الحالة`,
          'SECURITY',
          { orderId: order.id, smartBoxId: order.smartBoxId }
        );
        break;
    }
  }
}

export const orderService = new MockOrderService();
