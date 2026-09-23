/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActorRole,
  Order,
  OrderStatus,
  CompartmentSize,
  SmartBox,
  TemporaryAccessAuthorization,
  AuditLog,
  SecurityEvent,
  NotificationItem,
  Merchant,
  Driver,
  Product,
} from '../types';
import {
  INITIAL_ORDERS,
  INITIAL_SMART_BOXES,
  INITIAL_MERCHANTS,
  INITIAL_DRIVERS,
  INITIAL_AUTHORIZATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRODUCTS,
} from '../data/mockData';
import { smartBoxService } from '../services/SmartBoxService';
import { smartLockService } from '../services/SmartLockService';
import { authorizationService } from '../services/AuthorizationService';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';
import { cameraService } from '../services/CameraService';
import { orderService } from '../services/OrderService';

export interface HardwareSimState {
  boxId: string;
  compartmentId: string;
  isSolenoidLocked: boolean;
  isDoorClosed: boolean;
  weightKg: number;
  temperature: number;
  batteryPct: number;
  isTamperTriggered: boolean;
  sirenActive: boolean;
  lastActionMessage: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppContextType {
  role: ActorRole;
  setRole: (role: ActorRole) => void;
  customerView: 'HOME' | 'STORE' | 'CHECKOUT' | 'TRACKING' | 'BOXES' | 'EXTERNAL_ORDER';
  setCustomerView: (view: 'HOME' | 'STORE' | 'CHECKOUT' | 'TRACKING' | 'BOXES' | 'EXTERNAL_ORDER') => void;
  adminView: 'CONTROL_TOWER' | 'FLEET' | 'SECURITY' | 'AUDIT' | 'DIRECTORY';
  setAdminView: (view: 'CONTROL_TOWER' | 'FLEET' | 'SECURITY' | 'AUDIT' | 'DIRECTORY') => void;
  merchantView: 'DASHBOARD' | 'INVENTORY';
  setMerchantView: (view: 'DASHBOARD' | 'INVENTORY') => void;
  driverStep: number;
  setDriverStep: (step: number) => void;

  orders: Order[];
  activeOrder: Order;
  setActiveOrder: (order: Order) => void;
  setActiveOrderId: (id: string) => void;
  boxes: SmartBox[];
  activeBox: SmartBox;
  merchants: Merchant[];
  drivers: Driver[];
  authorizations: TemporaryAccessAuthorization[];
  auditLogs: AuditLog[];
  securityEvents: SecurityEvent[];
  notifications: NotificationItem[];
  unreadCount: number;

  // Products and Cart for Customer
  products: Product[];
  selectedMerchantId: string | null;
  setSelectedMerchantId: (id: string | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  hardwareSim: HardwareSimState;
  triggerHardwareCycle: (weightKg?: number) => Promise<void>;
  toggleEmergencySiren: (active?: boolean) => Promise<void>;
  simulateTamperAttack: () => Promise<void>;
  resetTamperStatus: () => Promise<void>;

  // Demo Workflow Stepper
  demoStep: number;
  advanceDemoWorkflow: () => Promise<void>;
  resetDemoWorkflow: () => void;
  jumpToDemoStep: (step: number) => Promise<void>;

  // Customer actions
  placeNewOrder: (
    paramsOrItems: any[] | {
      items: any[];
      compartmentSize: CompartmentSize;
      merchantId?: string;
      deliveryAddress?: string;
      deliveryNotes?: string;
      smartBoxId?: string;
    },
    maybeSize?: CompartmentSize
  ) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; message: string }>;
  createExternalOrder: (data: {
    merchantName: string;
    awbNumber: string;
    description: string;
    value: number;
    phone: string;
    date: string;
  }) => Promise<Order>;
  createDelegation: (data: {
    name: string;
    type: 'DELIVERY' | 'FAMILY' | 'VISITOR';
    compartmentId: string;
    expiresInMins?: number;
  }) => Promise<TemporaryAccessAuthorization>;

  // Merchant actions
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason?: string) => Promise<void>;
  markOrderPreparing: (orderId: string) => Promise<void>;
  markOrderReady: (orderId: string) => Promise<void>;
  assignOrderToDriver: (orderId: string, driverId?: string) => Promise<void>;
  handOverToDriver: (orderId: string) => Promise<void>;

  // Driver actions
  driverPickupOrder: (orderId: string) => Promise<void>;
  driverStartDelivery: (orderId: string) => Promise<void>;
  driverArriveAtBox: (orderId: string) => Promise<void>;
  driverRequestAccess: (orderId: string) => Promise<void>;
  driverSubmitOTP: (orderId: string, otp: string) => Promise<{ success: boolean; message: string }>;
  driverOpenBox: (orderId: string) => Promise<void>;
  driverDepositPackage: (orderId: string, weightKg?: number) => Promise<void>;
  driverSecureBox: (orderId: string) => Promise<void>;
  driverCompleteDelivery: (orderId: string) => Promise<void>;
  driverFailDelivery: (orderId: string, reason?: string) => Promise<void>;

  // General Status Transition with RBAC
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    options?: { actorRole?: ActorRole; actorName?: string; note?: string; extra?: Partial<Order> }
  ) => Promise<{ success: boolean; message: string }>;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<ActorRole>('CUSTOMER');
  const [customerView, setCustomerView] = useState<'HOME' | 'STORE' | 'CHECKOUT' | 'TRACKING' | 'BOXES' | 'EXTERNAL_ORDER'>('HOME');
  const [adminView, setAdminView] = useState<'CONTROL_TOWER' | 'FLEET' | 'SECURITY' | 'AUDIT' | 'DIRECTORY'>('CONTROL_TOWER');
  const [merchantView, setMerchantView] = useState<'DASHBOARD' | 'INVENTORY'>('DASHBOARD');
  const [driverStep, setDriverStep] = useState<number>(1);

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeOrderId, setActiveOrderId] = useState<string>('TW-1001');
  const [boxes, setBoxes] = useState<SmartBox[]>(INITIAL_SMART_BOXES);
  const [merchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>('merch-1');
  const [cart, setCart] = useState<CartItem[]>([
    { product: INITIAL_PRODUCTS[0], quantity: 1 },
    { product: INITIAL_PRODUCTS[2], quantity: 1 },
  ]);

  const [authorizations, setAuthorizations] = useState<TemporaryAccessAuthorization[]>(INITIAL_AUTHORIZATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(INITIAL_SECURITY_EVENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    // Initial fetch from orderService (the single source of truth)
    orderService.getAllOrders().then((all) => {
      setOrders(all);
    });

    // Subscribe to reactive updates from orderService across all roles
    const unsubscribe = orderService.subscribe((updatedOrders) => {
      setOrders(updatedOrders);
    });

    return unsubscribe;
  }, []);

  // Hardware Simulation State
  const [hardwareSim, setHardwareSim] = useState<HardwareSimState>({
    boxId: 'BOX-102',
    compartmentId: '02',
    isSolenoidLocked: true,
    isDoorClosed: true,
    weightKg: 0,
    temperature: 21.8,
    batteryPct: 99,
    isTamperTriggered: false,
    sirenActive: false,
    lastActionMessage: 'نظام القفل الكهرومغناطيسي والمستشعرات تعمل بكفاءة 100%.',
  });

  const [demoStep, setDemoStep] = useState<number>(1);

  const refreshAuditAndSecurity = async () => {
    const logs = await auditService.getAuditLogs();
    const events = await auditService.getSecurityEvents();
    const notifs = await notificationService.getNotifications();
    setAuditLogs([...logs]);
    setSecurityEvents([...events]);
    setNotifications([...notifs]);
  };

  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0] || INITIAL_ORDERS[0];
  const activeBox = boxes.find((b) => b.id === 'BOX-102') || boxes[0];

  // Cart Management
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      // Check if product belongs to same merchant
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Hardware Simulation Controls
  const triggerHardwareCycle = async (weightKg = 1.4) => {
    setHardwareSim((prev) => ({
      ...prev,
      isSolenoidLocked: false,
      isDoorClosed: false,
      lastActionMessage: '[متحكم ESP32] فك ارتباط الترباس الكهرومغناطيسي، ارتداد الباب بزاوية 85°',
    }));

    await new Promise((resolve) => setTimeout(resolve, 800));

    setHardwareSim((prev) => ({
      ...prev,
      weightKg,
      lastActionMessage: `[خلية الحمل HX711] استشعار زيادة في الوزن: +${weightKg} كجم (تطابق كامل للطرد)`,
    }));

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setHardwareSim((prev) => ({
      ...prev,
      isDoorClosed: true,
      isSolenoidLocked: true,
      lastActionMessage: '[مفتاح الريد] رصد إغلاق الباب 100%، تعشيق السولينويد وتأمين الحجيرة',
    }));
  };

  const simulateTamperAttack = async () => {
    setHardwareSim((prev) => ({
      ...prev,
      isTamperTriggered: true,
      sirenActive: true,
      lastActionMessage: '⚠️ تحذير أمني: رصد اهتزاز غير طبيعي ومحاولة نزع غطاء القفل!',
    }));
    await smartLockService.triggerTamperAlarm('BOX-102', 'CRITICAL');
    refreshAuditAndSecurity();
  };

  const resetTamperStatus = async () => {
    setHardwareSim((prev) => ({
      ...prev,
      isTamperTriggered: false,
      sirenActive: false,
      lastActionMessage: 'تمت استعادة حالة الأمان الطبيعية للصندوق الذكي.',
    }));
    await smartLockService.resetTamper('BOX-102');
    refreshAuditAndSecurity();
  };

  const toggleEmergencySiren = async (active?: boolean) => {
    const next = active !== undefined ? active : !hardwareSim.sirenActive;
    setHardwareSim((prev) => ({ ...prev, sirenActive: next }));
  };

  // --- Centralized Order Status Transition with Strict RBAC via OrderService ---
  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    options?: { actorRole?: ActorRole; actorName?: string; note?: string; extra?: Partial<Order> }
  ): Promise<{ success: boolean; message: string }> => {
    const currentRole = options?.actorRole || role;
    const res = await orderService.updateOrderStatus(
      orderId,
      newStatus,
      currentRole,
      undefined,
      options?.actorName,
      options?.extra
    );
    refreshAuditAndSecurity();
    return res;
  };

  // --- Customer Handlers ---
  const placeNewOrder = async (
    paramsOrItems: any[] | {
      items: any[];
      compartmentSize: CompartmentSize;
      merchantId?: string;
      deliveryAddress?: string;
      deliveryNotes?: string;
      smartBoxId?: string;
    },
    maybeSize?: CompartmentSize
  ): Promise<Order> => {
    let orderItems: any[];
    let compSize: CompartmentSize;
    let merchantId = 'merch-1';
    let deliveryAddress = 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس';
    let deliveryNotes = '';
    let targetBoxId = 'BOX-102';

    if (Array.isArray(paramsOrItems)) {
      orderItems = paramsOrItems;
      compSize = maybeSize || 'M';
    } else {
      orderItems = paramsOrItems.items;
      compSize = paramsOrItems.compartmentSize;
      merchantId = paramsOrItems.merchantId || selectedMerchantId || 'merch-1';
      deliveryAddress = paramsOrItems.deliveryAddress || deliveryAddress;
      deliveryNotes = paramsOrItems.deliveryNotes || '';
      targetBoxId = paramsOrItems.smartBoxId || targetBoxId;
    }

    const merchantObj = merchants.find((m) => m.id === merchantId) || merchants[0];

    const newOrder = await orderService.createOrder({
      customerId: 'cust-1',
      customerName: 'أحمد مصطفى',
      customerPhone: '+20 100 123 4567',
      merchantId: merchantObj.id,
      merchantName: merchantObj.name,
      smartBoxId: targetBoxId,
      compartmentId: '02',
      compartmentSize: compSize,
      items: orderItems,
      deliveryAddress,
      deliveryNotes,
    });

    setActiveOrderId(newOrder.id);
    clearCart();
    refreshAuditAndSecurity();
    return newOrder;
  };

  const cancelOrder = async (orderId: string): Promise<{ success: boolean; message: string }> => {
    const res = await orderService.cancelOrder(orderId, 'CUSTOMER');
    refreshAuditAndSecurity();
    return res;
  };

  const createExternalOrder = async (data: {
    merchantName: string;
    awbNumber: string;
    description: string;
    value: number;
    phone: string;
    date: string;
    courierName?: string;
    courierPhone?: string;
  }): Promise<Order> => {
    const id = `EX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExt: Order = {
      id,
      orderNumber: id,
      orderType: 'EXTERNAL_ORDER',
      customerId: 'cust-1',
      customerName: 'أحمد مصطفى',
      customerPhone: '+20 100 123 4567',
      // No internal merchantId required for external orders
      merchantName: data.merchantName,
      smartBoxId: 'BOX-102',
      compartmentId: '01',
      compartmentSize: 'S',
      status: 'PENDING',
      items: [
        {
          id: `item-${Date.now()}`,
          name: data.description,
          quantity: 1,
          price: data.value,
        },
      ],
      subtotal: data.value,
      deliveryFee: 0,
      discount: 0,
      tax: 0,
      total: data.value,
      deliveryAddress: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
      createdAt: 'اليوم، ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: 'اليوم، ' + new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      externalDetails: {
        externalMerchant: data.merchantName,
        awbNumber: data.awbNumber,
        approximateValue: data.value,
        notes: `شحنة خارجية مسجلة عبر بوابة العميل - هاتف المستلم: ${data.phone}`,
        expectedDate: data.date,
        courierName: data.courierName || 'مندوب شركة الشحن الخارجية',
        courierPhone: data.courierPhone,
      },
    };

    // Create strict 5-minute temporary access authorization for the Smart Box
    const auth = await authorizationService.createAuthorization({
      customerId: 'cust-1',
      customerName: 'أحمد مصطفى',
      orderId: id,
      smartBoxId: 'BOX-102',
      compartmentId: '01',
      driverName: data.courierName || 'مندوب الشحن الخارجي',
      delegationType: 'DELIVERY',
    });
    newExt.accessAuthorizationId = auth.id;

    setAuthorizations((prev) => [auth, ...prev]);
    setOrders((prev) => [newExt, ...prev]);
    setActiveOrderId(newExt.id);

    await auditService.recordEvent({
      actor: 'أحمد مصطفى',
      actorRole: 'CUSTOMER',
      orderId: id,
      smartBoxId: 'BOX-102',
      compartmentId: '01',
      action: 'AUTHORIZATION_CREATED',
      result: 'SUCCESS',
      details: `تم ربط بوليصة الشحنة الخارجية (${data.awbNumber}) مع تفويض الصندوق الذكي لمدة 5 دقائق`,
    });

    await notificationService.notify(
      'تم تسجيل الشحنة الخارجية',
      `تم ربط بوليصة ${data.awbNumber} بالصندوق الذكي BOX-102 وتجهيز إذن الفتح المؤقت.`,
      'ORDER',
      { orderId: id, smartBoxId: 'BOX-102' }
    );

    refreshAuditAndSecurity();
    return newExt;
  };

  const createDelegation = async (data: {
    name: string;
    type: 'DELIVERY' | 'FAMILY' | 'VISITOR';
    compartmentId: string;
    expiresInMins?: number;
  }): Promise<TemporaryAccessAuthorization> => {
    // Deliveries are strictly locked to 5 minutes
    const effectiveMins = data.type === 'DELIVERY' ? 5 : (data.expiresInMins || 60);
    const auth = await authorizationService.createAuthorization({
      customerId: 'cust-1',
      customerName: 'أحمد مصطفى',
      orderId: `MANUAL-${Date.now().toString().slice(-4)}`,
      driverName: data.name,
      smartBoxId: 'BOX-102',
      compartmentId: data.compartmentId,
      expiresInMinutes: effectiveMins,
      delegationType: data.type,
    });
    setAuthorizations((prev) => [auth, ...prev]);
    refreshAuditAndSecurity();
    return auth;
  };

  // --- Merchant Handlers ---
  const acceptOrder = async (orderId: string) => {
    await orderService.updateOrderStatus(orderId, 'ACCEPTED', 'MERCHANT', 'merch-1', 'ميدل إيست تيك');
    refreshAuditAndSecurity();
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    await orderService.rejectOrder(orderId, 'MERCHANT', reason);
    refreshAuditAndSecurity();
  };

  const markOrderPreparing = async (orderId: string) => {
    await orderService.updateOrderStatus(orderId, 'PREPARING', 'MERCHANT', 'merch-1', 'ميدل إيست تيك');
    refreshAuditAndSecurity();
  };

  const markOrderReady = async (orderId: string) => {
    await orderService.updateOrderStatus(orderId, 'READY', 'MERCHANT', 'merch-1', 'ميدل إيست تيك');
    refreshAuditAndSecurity();
  };

  const assignOrderToDriver = async (orderId: string, driverId = 'drv-1') => {
    const driverObj = drivers.find((d) => d.id === driverId) || drivers[0];
    const ord = orders.find((o) => o.id === orderId);

    // Create 5-minute temporary access authorization for the Smart Box
    const auth = await authorizationService.createAuthorization({
      customerId: ord?.customerId || 'cust-1',
      customerName: ord?.customerName || 'أحمد مصطفى',
      orderId,
      driverId: driverObj.id,
      driverName: driverObj.name,
      smartBoxId: ord?.smartBoxId || 'BOX-102',
      compartmentId: ord?.compartmentId || '02',
      expiresInMinutes: 5,
    });
    setAuthorizations((prev) => [auth, ...prev]);

    await orderService.assignDriver(orderId, driverObj.id, 'MERCHANT');
    refreshAuditAndSecurity();
  };

  const handOverToDriver = async (orderId: string) => {
    await assignOrderToDriver(orderId, 'drv-1');
  };

  // --- Driver Handlers ---
  const driverPickupOrder = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    await orderService.updateOrderStatus(
      orderId,
      'PICKED_UP',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    refreshAuditAndSecurity();
  };

  const driverStartDelivery = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    await orderService.updateOrderStatus(
      orderId,
      'OUT_FOR_DELIVERY',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(1);
    refreshAuditAndSecurity();
  };

  const driverArriveAtBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    await orderService.updateOrderStatus(
      orderId,
      'DRIVER_ARRIVED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(2);
    refreshAuditAndSecurity();
  };

  const driverRequestAccess = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    let auth = await authorizationService.getAuthorizationByOrder(orderId);
    if (!auth || auth.status !== 'ACTIVE') {
      auth = await authorizationService.createAuthorization({
        customerId: ord?.customerId || 'cust-1',
        customerName: ord?.customerName || 'أحمد مصطفى',
        orderId,
        driverId: ord?.driverId || 'drv-1',
        driverName: ord?.driverName || 'إسلام عامر',
        smartBoxId: ord?.smartBoxId || 'BOX-102',
        compartmentId: ord?.compartmentId || '02',
        expiresInMinutes: 5,
      });
      setAuthorizations((prev) => [auth!, ...prev]);
    }

    await orderService.updateOrderStatus(
      orderId,
      'ACCESS_AUTHORIZED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(3);
    refreshAuditAndSecurity();
  };

  const driverSubmitOTP = async (
    orderId: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> => {
    const ord = orders.find((o) => o.id === orderId);
    const customerId = ord?.customerId || 'cust-1';
    const smartBoxId = ord?.smartBoxId || 'BOX-102';
    const compartmentId = ord?.compartmentId || '02';
    const driverId = ord?.driverId || 'drv-1';

    const valResult = await authorizationService.validateAccess({
      customerId,
      orderId,
      driverId,
      smartBoxId,
      compartmentId,
      otp,
    });

    if (!valResult.granted) {
      refreshAuditAndSecurity();
      return { success: false, message: valResult.reason || 'فشل التحقق من التصريح' };
    }

    // Access granted -> transitions to OTP_VALIDATED
    await orderService.updateOrderStatus(
      orderId,
      'OTP_VALIDATED',
      'DRIVER',
      driverId,
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(3);
    refreshAuditAndSecurity();

    return {
      success: true,
      message: 'تم التحقق من رمز OTP بنجاح! جاهز لفتح مزلاج الصندوق الذكي.',
    };
  };

  const driverOpenBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    const boxId = ord?.smartBoxId || 'BOX-102';
    const compId = ord?.compartmentId || '02';

    // Hardware security check: Ensure access has been validated via OTP before unlocking
    const isAuth = await authorizationService.isAccessAuthorized(boxId, compId, orderId);
    if (!isAuth) {
      await auditService.recordSecurityIncident({
        incidentCode: `INC-DIRECT-OPEN-${Math.floor(Math.random() * 9000 + 1000)}#`,
        severity: 'HIGH',
        smartBoxId: boxId,
        compartmentId: compId,
        title: 'محاولة فتح الصندوق بدون إكمال التحقق من OTP',
        description: `حاول المندوب فتح الحجيرة للطلب ${orderId} بدون استيفاء توثيق OTP ساري المفعول`,
        status: 'ACTIVE',
        actionTaken: 'تم منع فك القفل وتجميد الأمر',
        location: 'موقع الصندوق الذكي',
      });
      throw new Error('غير مصرح بفتح الصندوق. يرجى إدخال رمز OTP ساري وتوثيقه أولاً.');
    }

    await smartLockService.unlock(boxId, compId);
    setHardwareSim((prev) => ({
      ...prev,
      boxId,
      compartmentId: compId,
      isSolenoidLocked: false,
      isDoorClosed: false,
      lastActionMessage: '[عتاد ذكي] انفتح قفل السولينويد وارتد الباب (85°)',
    }));

    await orderService.updateOrderStatus(
      orderId,
      'SMART_BOX_OPENED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverDepositPackage = async (orderId: string, weightKg = 1.4) => {
    const ord = orders.find((o) => o.id === orderId);
    const boxId = ord?.smartBoxId || 'BOX-102';
    const compId = ord?.compartmentId || '02';

    // Verify compartment allocation before depositing
    const compCheck = await smartBoxService.validateCompartmentAccess(boxId, compId, orderId);
    if (!compCheck.valid) {
      throw new Error(compCheck.reason || 'الحجيرة غير مخصصة لهذا الطلب');
    }

    await triggerHardwareCycle(weightKg);

    await orderService.updateOrderStatus(
      orderId,
      'PACKAGE_DEPOSITED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverSecureBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    const boxId = ord?.smartBoxId || 'BOX-102';
    const compId = ord?.compartmentId || '02';

    await smartLockService.lock(boxId, compId);
    setHardwareSim((prev) => ({
      ...prev,
      boxId,
      compartmentId: compId,
      isSolenoidLocked: true,
      isDoorClosed: true,
      lastActionMessage: '[عتاد ذكي] أُغلق الباب وتم تأمين القفل الكهرومغناطيسي 100%',
    }));

    await orderService.updateOrderStatus(
      orderId,
      'SMART_BOX_SECURED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر'
    );
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverCompleteDelivery = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    const boxId = ord?.smartBoxId || 'BOX-102';
    const compId = ord?.compartmentId || '02';

    const pod = await cameraService.captureProofOfDelivery(boxId, compId, orderId);

    await orderService.updateOrderStatus(
      orderId,
      'COMPLETED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر',
      {
        proofOfDelivery: pod,
      }
    );

    // Complete access and mark authorization as USED after verified physical closure
    await authorizationService.completeAccess(orderId);

    setDriverStep(5);
    refreshAuditAndSecurity();
  };

  const driverFailDelivery = async (orderId: string, reason?: string) => {
    const ord = orders.find((o) => o.id === orderId);
    await orderService.updateOrderStatus(
      orderId,
      'DELIVERY_FAILED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر',
      {
        deliveryNotes: reason || 'تعذر التسليم الميداني',
      }
    );
    refreshAuditAndSecurity();
  };

  // --- End-to-End Demo Workflow Runner ---
  const advanceDemoWorkflow = async () => {
    const nextStep = (demoStep % 15) + 1;
    await jumpToDemoStep(nextStep);
  };

  const jumpToDemoStep = async (step: number) => {
    setDemoStep(step);
    const demoId = 'TW-1001';
    setActiveOrderId(demoId);

    switch (step) {
      case 1: // Customer browses & places order (PENDING)
        await orderService.updateOrderStatus(demoId, 'PENDING', 'ADMIN');
        setRole('CUSTOMER');
        setCustomerView('TRACKING');
        break;
      case 2: // Order placed, Merchant receives PENDING
        setRole('MERCHANT');
        setMerchantView('DASHBOARD');
        break;
      case 3: // Merchant accepts (ACCEPTED)
        await acceptOrder(demoId);
        setRole('MERCHANT');
        break;
      case 4: // Merchant prepares (PREPARING)
        await markOrderPreparing(demoId);
        setRole('MERCHANT');
        break;
      case 5: // Merchant makes ready (READY) & hands to driver (ASSIGNED_TO_DRIVER)
        await markOrderReady(demoId);
        await assignOrderToDriver(demoId, 'drv-1');
        setRole('MERCHANT');
        break;
      case 6: // Driver in transit (PICKED_UP -> OUT_FOR_DELIVERY)
        await driverPickupOrder(demoId);
        await driverStartDelivery(demoId);
        setRole('DRIVER');
        setDriverStep(1);
        break;
      case 7: // Driver arrives at box (DRIVER_ARRIVED)
        await driverArriveAtBox(demoId);
        setRole('DRIVER');
        setDriverStep(2);
        break;
      case 8: // Driver enters OTP & requests access (ACCESS_AUTHORIZED)
        await driverRequestAccess(demoId);
        setRole('DRIVER');
        setDriverStep(3);
        break;
      case 9: // Smart Box unlocks (OTP_VALIDATED -> SMART_BOX_OPENED)
        await driverSubmitOTP(demoId, '129385');
        await driverOpenBox(demoId);
        setRole('DRIVER');
        setDriverStep(4);
        break;
      case 10: // Package deposited + weight detected (PACKAGE_DEPOSITED)
        await driverDepositPackage(demoId, 1.4);
        setRole('DRIVER');
        setDriverStep(4);
        break;
      case 11: // Door closed & locked (SMART_BOX_SECURED)
        await driverSecureBox(demoId);
        setRole('DRIVER');
        setDriverStep(4);
        break;
      case 12: // Delivery completes with 2K POD camera photo (COMPLETED)
        await driverCompleteDelivery(demoId);
        setRole('DRIVER');
        setDriverStep(5);
        break;
      case 13: // Customer views notification & tracking (COMPLETED)
        setRole('CUSTOMER');
        setCustomerView('TRACKING');
        break;
      case 14: // Merchant views COMPLETED order
        setRole('MERCHANT');
        setMerchantView('DASHBOARD');
        break;
      case 15: // Admin inspects complete audit trail & security center
        setRole('ADMIN');
        setAdminView('AUDIT');
        break;
      default:
        break;
    }
  };

  const resetDemoWorkflow = async () => {
    setDemoStep(1);
    setRole('CUSTOMER');
    setCustomerView('TRACKING');
    setActiveOrderId('TW-1001');
    await orderService.updateOrderStatus('TW-1001', 'PENDING', 'ADMIN');
    setHardwareSim({
      boxId: 'BOX-102',
      compartmentId: '02',
      isSolenoidLocked: true,
      isDoorClosed: true,
      weightKg: 0,
      temperature: 21.8,
      batteryPct: 99,
      isTamperTriggered: false,
      sirenActive: false,
      lastActionMessage: 'تمت استعادة حالة الصندوق الافتراضية بنجاح.',
    });
    refreshAuditAndSecurity();
  };

  const markNotificationRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllNotificationsRead = () => {
    notificationService.markAllAsRead();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        customerView,
        setCustomerView,
        adminView,
        setAdminView,
        merchantView,
        setMerchantView,
        driverStep,
        setDriverStep,
        orders,
        activeOrder,
        setActiveOrder: (ord) => setActiveOrderId(ord.id),
        setActiveOrderId,
        boxes,
        activeBox,
        merchants,
        drivers,
        products,
        selectedMerchantId,
        setSelectedMerchantId,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        authorizations,
        auditLogs,
        securityEvents,
        notifications,
        unreadCount,
        hardwareSim,
        triggerHardwareCycle,
        toggleEmergencySiren,
        simulateTamperAttack,
        resetTamperStatus,
        demoStep,
        advanceDemoWorkflow,
        resetDemoWorkflow,
        jumpToDemoStep,
        placeNewOrder,
        cancelOrder,
        createExternalOrder,
        createDelegation,
        acceptOrder,
        rejectOrder,
        markOrderPreparing,
        markOrderReady,
        assignOrderToDriver,
        handOverToDriver,
        driverPickupOrder,
        driverStartDelivery,
        driverArriveAtBox,
        driverRequestAccess,
        driverSubmitOTP,
        driverOpenBox,
        driverDepositPackage,
        driverSecureBox,
        driverCompleteDelivery,
        driverFailDelivery,
        updateOrderStatus,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
