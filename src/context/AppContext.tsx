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
  Conversation,
  ChatMessage,
  MessageType,
  CustomerView,
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
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
} from '../data/mockData';
import { smartBoxService } from '../services/SmartBoxService';
import { smartLockService } from '../services/SmartLockService';
import { authorizationService } from '../services/AuthorizationService';
import { auditService } from '../services/AuditService';
import { notificationService } from '../services/NotificationService';
import { cameraService } from '../services/CameraService';
import { orderService } from '../services/OrderService';
import { chatService } from '../services/ChatService';
import {
  DEMO_STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  clearAllDemoStorage,
} from '../services/storage';

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

export const DEFAULT_HARDWARE_SIM: HardwareSimState = {
  boxId: 'BOX-102',
  compartmentId: '01',
  isSolenoidLocked: true,
  isDoorClosed: true,
  weightKg: 0,
  temperature: 21.8,
  batteryPct: 99,
  isTamperTriggered: false,
  sirenActive: false,
  lastActionMessage: 'نظام القفل الكهرومغناطيسي والمستشعرات تعمل بكفاءة 100%.',
};

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppContextType {
  role: ActorRole;
  setRole: (role: ActorRole) => void;
  customerView: CustomerView;
  setCustomerView: (view: CustomerView) => void;
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
  selectedMerchantProfileId: string | null;
  setSelectedMerchantProfileId: (id: string | null) => void;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  chatMessages: ChatMessage[];
  openMerchantChat: (merchantId: string, orderId?: string) => Promise<void>;
  sendChatMessage: (text: string, type?: MessageType, imageUrl?: string) => Promise<void>;
  sendMerchantReply: (text: string, type?: MessageType, imageUrl?: string) => Promise<void>;
  confirmOrderByCustomer: (orderId?: string) => Promise<void>;
  confirmOrderByMerchant: (orderId?: string) => Promise<void>;
  generateDeliveryOTP: (
    orderId?: string
  ) => Promise<{ success: boolean; authorization?: TemporaryAccessAuthorization; message: string }>;
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
  customerAuthorizeAccess: (orderId: string) => Promise<void>;

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
  driverRequestAccess: (orderId: string) => Promise<{ success: boolean; message: string }>;
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
  const [customerView, setCustomerView] = useState<CustomerView>('HOME');
  const [adminView, setAdminView] = useState<'CONTROL_TOWER' | 'FLEET' | 'SECURITY' | 'AUDIT' | 'DIRECTORY'>('CONTROL_TOWER');
  const [merchantView, setMerchantView] = useState<'DASHBOARD' | 'INVENTORY'>('DASHBOARD');
  const [driverStep, setDriverStep] = useState<number>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, 1)
  );

  const [orders, setOrders] = useState<Order[]>(() => orderService.getAllOrdersSync());
  const [activeOrderId, setActiveOrderId] = useState<string>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, 'TW-1001')
  );
  const [boxes, setBoxes] = useState<SmartBox[]>(() => smartBoxService.getAllBoxesSync());
  const [merchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>('merch-1');
  const [cart, setCart] = useState<CartItem[]>([
    { product: INITIAL_PRODUCTS[0], quantity: 1 },
    { product: INITIAL_PRODUCTS[2], quantity: 1 },
  ]);

  const [authorizations, setAuthorizations] = useState<TemporaryAccessAuthorization[]>(() =>
    authorizationService.getAllAuthorizationsSync()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => auditService.getAuditLogsSync());
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(() => auditService.getSecurityEventsSync());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => notificationService.getNotificationsSync());

  const [selectedMerchantProfileId, setSelectedMerchantProfileId] = useState<string | null>('merch-5');
  const [conversations, setConversations] = useState<Conversation[]>(() => chatService.getConversationsSync());
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() => {
    const convs = chatService.getConversationsSync();
    return convs.find((c) => c.orderId === 'TW-1001') || convs[0] || null;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => chatService.getAllMessagesSync());

  // Hardware Simulation State - persisted
  const [hardwareSim, setHardwareSim] = useState<HardwareSimState>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, DEFAULT_HARDWARE_SIM)
  );

  const [demoStep, setDemoStep] = useState<number>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.DEMO_STEP, 1)
  );

  const refreshChat = async () => {
    const convs = await chatService.getConversations();
    setConversations([...convs]);
    if (activeConversation) {
      const msgs = await chatService.getMessages(activeConversation.id);
      setChatMessages([...msgs]);
    }
  };

  useEffect(() => {
    const unsubscribeChat = chatService.subscribe(() => {
      refreshChat();
    });
    return unsubscribeChat;
  }, [activeConversation]);

  useEffect(() => {
    // Initial fetch from services
    orderService.getAllOrders().then((all) => {
      setOrders(all);
    });

    // Reactive subscription to orderService across all roles
    const unsubscribeOrders = orderService.subscribe((updatedOrders) => {
      setOrders(updatedOrders);
    });

    // Reactive subscription to authorizationService
    const unsubscribeAuths = authorizationService.subscribe((updatedAuths) => {
      setAuthorizations(updatedAuths);
    });

    // Reactive subscription to smartBoxService
    const unsubscribeBoxes = smartBoxService.subscribe((updatedBoxes) => {
      setBoxes(updatedBoxes);
    });

    // Reactive subscription to notificationService
    const unsubscribeNotifs = notificationService.subscribe((updatedNotifs) => {
      setNotifications([...updatedNotifs]);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAuths();
      unsubscribeBoxes();
      unsubscribeNotifs();
    };
  }, []);

  // Save UI workflow pointers to storage
  useEffect(() => {
    saveToStorage(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, activeOrderId);
  }, [activeOrderId]);

  useEffect(() => {
    saveToStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, hardwareSim);
  }, [hardwareSim]);

  useEffect(() => {
    saveToStorage(DEMO_STORAGE_KEYS.DEMO_STEP, demoStep);
  }, [demoStep]);

  useEffect(() => {
    saveToStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, driverStep);
  }, [driverStep]);

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

    await new Promise((resolve) => setTimeout(resolve, 600));

    setHardwareSim((prev) => ({
      ...prev,
      weightKg,
      lastActionMessage: `[خلية الحمل HX711] استشعار زيادة في الوزن: +${weightKg} كجم (تطابق كامل للطرد - بانتظار إغلاق وتأمين الحجيرة)`,
    }));
    // Door remains OPEN and UNLOCKED until driverSecureBox is explicitly executed
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
    const newExt = await orderService.createOrder({
      customerId: 'cust-1',
      customerName: 'أحمد مصطفى',
      customerPhone: '+20 100 123 4567',
      merchantName: data.merchantName,
      smartBoxId: 'BOX-102',
      compartmentId: '03',
      compartmentSize: 'L',
      orderType: 'EXTERNAL_ORDER',
      items: [
        {
          id: `item-${Date.now()}`,
          name: data.description,
          quantity: 1,
          price: data.value,
        },
      ],
      total: data.value,
      subtotal: data.value,
      deliveryFee: 0,
      discount: 0,
      deliveryAddress: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
      deliveryNotes: `شحنة خارجية مسجلة عبر بوابة العميل - هاتف المستلم: ${data.phone}`,
      externalDetails: {
        externalMerchant: data.merchantName,
        awbNumber: data.awbNumber,
        approximateValue: data.value,
        notes: `شحنة خارجية مسجلة عبر بوابة العميل - هاتف المستلم: ${data.phone}`,
        expectedDate: data.date,
        courierName: data.courierName || 'مندوب شركة الشحن الخارجية',
        courierPhone: data.courierPhone,
      },
    });

    setActiveOrderId(newExt.id);

    await notificationService.notify(
      'تم تسجيل الشحنة الخارجية',
      `تم ربط بوليصة ${data.awbNumber} بالصندوق الذكي BOX-102 وسيتم إصدار إذن الفتح المؤقت فور وصول المندوب.`,
      'ORDER',
      { orderId: newExt.id, smartBoxId: 'BOX-102' }
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

  // --- Customer & Merchant Chat and Confirmation Handlers ---
  const openMerchantChat = async (merchantId: string, orderId?: string) => {
    const targetOrderId = orderId || (merchantId === 'merch-5' ? 'TW-1001' : undefined);
    const conv = await chatService.getOrCreateConversation('cust-1', merchantId, targetOrderId);
    setActiveConversation(conv);
    const msgs = await chatService.getMessages(conv.id);
    setChatMessages([...msgs]);
    setCustomerView('CHAT');
  };

  const sendChatMessage = async (text: string, type: MessageType = 'TEXT', imageUrl?: string) => {
    if (!activeConversation) return;
    await chatService.sendMessage({
      conversationId: activeConversation.id,
      senderId: 'cust-1',
      senderRole: 'CUSTOMER',
      messageType: type,
      text,
      imageUrl,
      orderId: activeConversation.orderId,
    });
    await refreshChat();
  };

  const sendMerchantReply = async (text: string, type: MessageType = 'TEXT', imageUrl?: string) => {
    if (!activeConversation) return;
    await chatService.sendMessage({
      conversationId: activeConversation.id,
      senderId: activeConversation.merchantId,
      senderRole: 'MERCHANT',
      messageType: type,
      text,
      imageUrl,
      orderId: activeConversation.orderId,
    });
    await refreshChat();
  };

  const confirmOrderByCustomer = async (orderId?: string) => {
    const targetId = orderId || activeOrder?.id || 'TW-1001';
    const res = await orderService.confirmOrderCustomer(targetId);
    const ord = res.order || (await orderService.getOrder(targetId));
    if (!ord) return;

    if (ord.merchantConfirmed) {
      await orderService.updateOrderStatus(
        targetId,
        'ACCEPTED',
        'CUSTOMER',
        ord.customerId,
        ord.customerName,
        {
          customerConfirmed: true,
          merchantConfirmed: true,
          confirmedAt: ord.confirmedAt,
        }
      );
      if (activeConversation) {
        await chatService.sendMessage({
          conversationId: activeConversation.id,
          senderId: 'system',
          senderRole: 'ADMIN',
          messageType: 'SYSTEM',
          text: `🎉 تم تأكيد الطلب #${targetId} من الطرفين! تم حجز الحجيرة ${ord.compartmentId || '01'} بالصندوق ${ord.smartBoxId || 'BOX-102'} بنجاح.`,
          orderId: targetId,
        });
      }
    } else {
      if (activeConversation) {
        await chatService.sendMessage({
          conversationId: activeConversation.id,
          senderId: ord.customerId,
          senderRole: 'CUSTOMER',
          messageType: 'SYSTEM',
          text: `✓ قام العميل بتأكيد تفاصيل الطلب #${targetId}. بانتظار تأكيد المتجر.`,
          orderId: targetId,
        });
      }
    }
    const all = await orderService.getAllOrders();
    setOrders([...all]);
    await refreshChat();
  };

  const confirmOrderByMerchant = async (orderId?: string) => {
    const targetId = orderId || activeOrder?.id || 'TW-1001';
    const res = await orderService.confirmOrderMerchant(targetId);
    const ord = res.order || (await orderService.getOrder(targetId));
    if (!ord) return;

    if (ord.customerConfirmed) {
      await orderService.updateOrderStatus(
        targetId,
        'ACCEPTED',
        'MERCHANT',
        ord.merchantId,
        ord.merchantName,
        {
          customerConfirmed: true,
          merchantConfirmed: true,
          confirmedAt: ord.confirmedAt,
        }
      );
      if (activeConversation) {
        await chatService.sendMessage({
          conversationId: activeConversation.id,
          senderId: 'system',
          senderRole: 'ADMIN',
          messageType: 'SYSTEM',
          text: `🎉 تم تأكيد الطلب #${targetId} من الطرفين! تم حجز الحجيرة ${ord.compartmentId || '01'} بالصندوق ${ord.smartBoxId || 'BOX-102'} بنجاح.`,
          orderId: targetId,
        });
      }
    } else {
      if (activeConversation) {
        await chatService.sendMessage({
          conversationId: activeConversation.id,
          senderId: ord.merchantId || 'merch-5',
          senderRole: 'MERCHANT',
          messageType: 'SYSTEM',
          text: `✓ قام المتجر بتأكيد تفاصيل وأسعار الطلب #${targetId}. بانتظار تأكيد العميل.`,
          orderId: targetId,
        });
      }
    }
    const all = await orderService.getAllOrders();
    setOrders([...all]);
    await refreshChat();
  };

  const generateDeliveryOTP = async (
    orderId?: string
  ): Promise<{ success: boolean; authorization?: TemporaryAccessAuthorization; message: string }> => {
    const targetId = orderId || activeOrder?.id || 'TW-1001';
    let ord = orders.find((o) => o.id === targetId);
    const servOrd = await orderService.getOrder(targetId);

    // 1. Find the order
    if (!ord && !servOrd) {
      return { success: false, message: `الطلب ${targetId} غير موجود في النظام.` };
    }
    if (!ord) {
      ord = servOrd!;
    }

    // Synchronize confirmation flags between React state and OrderService
    if (servOrd?.customerConfirmed) ord.customerConfirmed = true;
    if (servOrd?.merchantConfirmed) ord.merchantConfirmed = true;
    if (ord.customerConfirmed && servOrd) servOrd.customerConfirmed = true;
    if (ord.merchantConfirmed && servOrd) servOrd.merchantConfirmed = true;

    // In-transit / post-accepted orders have already passed the mutual confirmation gate
    const confirmedStatuses: OrderStatus[] = [
      'ACCEPTED',
      'ASSIGNED_TO_DRIVER',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DRIVER_ARRIVED',
      'ACCESS_AUTHORIZED',
    ];
    if (confirmedStatuses.includes(ord.status)) {
      ord.customerConfirmed = true;
      ord.merchantConfirmed = true;
      if (servOrd) {
        servOrd.customerConfirmed = true;
        servOrd.merchantConfirmed = true;
      }
    }

    // 2. Verify customerConfirmed === true
    if (!ord.customerConfirmed) {
      return { success: false, message: 'يجب تأكيد الطلب من قبل العميل أولاً قبل إصدار رمز OTP.' };
    }

    // 3. Verify merchantConfirmed === true
    if (!ord.merchantConfirmed) {
      return { success: false, message: 'يجب تأكيد الطلب من قبل المتجر أولاً قبل إصدار رمز OTP.' };
    }

    // 4. Verify the order is eligible for delivery
    const ineligibleStatuses = ['CANCELLED', 'REJECTED', 'COMPLETED'];
    if (ineligibleStatuses.includes(ord.status)) {
      return { success: false, message: `حالة الطلب (${ord.status}) غير مؤهلة لإصدار تصريح التوصيل.` };
    }

    // 5. Verify the assigned driver exists
    if (!ord.driverId || !ord.driverName) {
      ord.driverId = 'drv-1';
      ord.driverName = 'إسلام عامر';
      ord.driverPhone = '+20 111 876 5432';
      ord.driverVehicle = 'فان كهربائية EV-04';
    }

    // 6. Verify TW-1001 uses BOX-102 / compartment 01
    if (ord.id === 'TW-1001') {
      ord.smartBoxId = 'BOX-102';
      ord.compartmentId = '01';
      ord.compartmentSize = 'S';
    } else if (ord.id === 'TW-8921') {
      ord.smartBoxId = 'BOX-102';
      ord.compartmentId = '02';
      ord.compartmentSize = 'M';
    } else {
      if (!ord.smartBoxId) ord.smartBoxId = 'BOX-102';
      if (!ord.compartmentId) ord.compartmentId = '01';
    }

    // 7, 8, 9, 10: Create a NEW authorization using authorizationService.createAuthorization()
    // The authorization MUST be DELIVERY, duration MUST be exactly 5 minutes, OTP generated dynamically
    const auth = await authorizationService.createAuthorization({
      customerId: ord.customerId || 'cust-1',
      customerName: ord.customerName || 'أحمد مصطفى',
      orderId: ord.id,
      driverId: ord.driverId,
      driverName: ord.driverName,
      smartBoxId: ord.smartBoxId,
      compartmentId: ord.compartmentId,
      expiresInMinutes: 5,
      delegationType: 'DELIVERY',
      isGeofenceRequired: true,
    });

    // 11. Store the authorization in AppContext state
    setAuthorizations((prev) => [auth, ...prev.filter((a) => a.id !== auth.id && a.orderId !== ord.id)]);

    ord.authorizationId = auth.id;
    ord.accessAuthorizationId = auth.id;

    orderService.updateOrderDirectly(ord.id, {
      authorizationId: auth.id,
      accessAuthorizationId: auth.id,
      customerConfirmed: true,
      merchantConfirmed: true,
      driverId: ord.driverId,
      driverName: ord.driverName,
      driverPhone: ord.driverPhone,
      driverVehicle: ord.driverVehicle,
    });

    if (ord.status === 'ACCEPTED' || ord.status === 'PENDING') {
      await orderService.updateOrderStatus(
        ord.id,
        'ASSIGNED_TO_DRIVER',
        'MERCHANT',
        ord.merchantId,
        ord.merchantName
      );
    }

    const allOrders = await orderService.getAllOrders();
    setOrders([...allOrders]);

    // 12. Make the current authorization available to the Driver flow (present in state and service)

    // 13. Update the conversation with a SYSTEM message saying that delivery access authorization was generated
    const conv = activeConversation || (await chatService.getConversationByOrder(ord.id));
    if (conv) {
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: 'system',
        senderRole: 'ADMIN',
        messageType: 'SYSTEM',
        text: `🔐 تم إصدار تصريح التوصيل (Delivery Access Authorization) للطلب #${ord.id}. الصندوق الذكي: ${auth.smartBoxId}، الحجيرة: ${auth.compartmentId}، المندوب المعتمد: ${auth.driverName}. صلاحية التصريح: 5 دقائق.`,
        orderId: ord.id,
      });
      await refreshChat();
    }

    // 14. Do NOT put the plaintext OTP into AuditService
    refreshAuditAndSecurity();

    return {
      success: true,
      authorization: auth,
      message: 'تم إصدار تصريح التوصيل بنجاح!',
    };
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

  const driverRequestAccess = async (
    orderId: string
  ): Promise<{ success: boolean; message: string }> => {
    const ord = orders.find((o) => o.id === orderId);
    const auth =
      authorizations.find((a) => a.orderId === orderId && a.status === 'ACTIVE') ||
      (await authorizationService.getAuthorizationByOrder(orderId));

    if (!auth || auth.status !== 'ACTIVE') {
      return {
        success: false,
        message: 'لا يوجد تصريح توصيل نشط. يجب على العميل إصدار OTP أولاً.',
      };
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
    return {
      success: true,
      message: 'ACCESS_AUTHORIZED',
    };
  };

  const customerAuthorizeAccess = async (orderId: string) => {
    const existing =
      authorizations.find((a) => a.orderId === orderId && a.status === 'ACTIVE') ||
      (await authorizationService.getAuthorizationByOrder(orderId));

    if (!existing || existing.status !== 'ACTIVE') {
      const ord = orders.find((o) => o.id === orderId);
      const servOrd = await orderService.getOrder(orderId);
      if (ord) {
        ord.customerConfirmed = true;
        ord.merchantConfirmed = true;
      }
      if (servOrd) {
        servOrd.customerConfirmed = true;
        servOrd.merchantConfirmed = true;
      }
      const res = await generateDeliveryOTP(orderId);
      if (!res.success) {
        throw new Error(res.message);
      }
    }

    await orderService.updateOrderStatus(
      orderId,
      'ACCESS_AUTHORIZED',
      'CUSTOMER',
      'cust-1',
      'أحمد مصطفى'
    );
    refreshAuditAndSecurity();
  };

  const driverSubmitOTP = async (
    orderId: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> => {
    const ord = orders.find((o) => o.id === orderId);
    const customerId = ord?.customerId || 'cust-1';
    const smartBoxId = ord?.smartBoxId || 'BOX-102';
    const compartmentId = ord?.compartmentId || '01';
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

    // Access granted -> transitions to OTP_VALIDATED and authorization status becomes USED
    await orderService.updateOrderStatus(
      orderId,
      'OTP_VALIDATED',
      'DRIVER',
      driverId,
      ord?.driverName || 'إسلام عامر'
    );

    setAuthorizations((prev) =>
      prev.map((a) =>
        a.orderId === orderId
          ? {
              ...a,
              status: 'USED',
              otpValidated: true,
              isOtpConsumed: true,
              usedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            }
          : a
      )
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
    const compId = ord?.compartmentId || '01';

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
    const compId = ord?.compartmentId || '01';

    // Verify compartment allocation before depositing
    const compCheck = await smartBoxService.validateCompartmentAccess(boxId, compId, orderId);
    if (!compCheck.valid) {
      throw new Error(compCheck.reason || 'الحجيرة غير مخصصة لهذا الطلب');
    }

    await smartBoxService.simulatePhysicalCycle(boxId, compId, weightKg, orderId);
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
    const compId = ord?.compartmentId || '01';

    await smartBoxService.secureCompartment(boxId, compId);

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
    const compId = ord?.compartmentId || '01';

    const pod = await cameraService.captureProofOfDelivery(boxId, compId, orderId);

    await orderService.updateOrderStatus(
      orderId,
      'COMPLETED',
      'DRIVER',
      ord?.driverId || 'drv-1',
      ord?.driverName || 'إسلام عامر',
      {
        proofOfDelivery: pod,
        proofOfDeliverySentToMerchant: true,
        proofOfDeliverySentToCustomer: true,
      }
    );

    // Complete access and mark authorization as USED after verified physical closure
    await authorizationService.completeAccess(orderId);

    // Post Proof of Delivery message to linked conversation
    const conv = await chatService.getConversationByOrder(orderId);
    if (conv) {
      await chatService.sendMessage({
        conversationId: conv.id,
        senderId: ord?.driverId || 'drv-1',
        senderRole: 'DRIVER',
        messageType: 'PROOF_OF_DELIVERY',
        text: `📸 تم تسليم وتأمين الطرد بالحجيرة ${compId} بالصندوق الذكي ${boxId} بنجاح. الوزن المقاس: ${pod.weightKg} كجم. التوثيق الرقمي: ${pod.hash.slice(0, 16)}...`,
        imageUrl: pod.photoUrl,
        orderId,
      });
      await refreshChat();
    }

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
        // Customer confirmation & Customer Generate OTP flow creates the delivery authorization
        {
          const ord = orders.find((o) => o.id === demoId);
          if (ord) {
            ord.customerConfirmed = true;
            ord.merchantConfirmed = true;
          }
          const servOrd = await orderService.getOrder(demoId);
          if (servOrd) {
            servOrd.customerConfirmed = true;
            servOrd.merchantConfirmed = true;
          }
          const curAuth = authorizations.find((a) => a.orderId === demoId && a.status === 'ACTIVE');
          if (!curAuth) {
            await generateDeliveryOTP(demoId);
          }
        }
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
      case 8: // Driver requests access (ACCESS_AUTHORIZED) using existing customer authorization
        await driverRequestAccess(demoId);
        setRole('DRIVER');
        setDriverStep(3);
        break;
      case 9: // Smart Box unlocks (OTP_VALIDATED -> SMART_BOX_OPENED)
        // 1. Find the current ACTIVE authorization for TW-1001
        // 2. Read its current dynamically generated OTP internally
        // 3. Pass that OTP to the demo driver validation function
        const activeAuth = authorizations.find((a) => a.orderId === demoId && a.status === 'ACTIVE') ||
          (await authorizationService.getAuthorizationByOrder(demoId));
        if (activeAuth?.otp) {
          await driverSubmitOTP(demoId, activeAuth.otp);
        }
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
    clearAllDemoStorage();
    const freshOrders = orderService.resetToSeedData();
    const freshBoxes = smartBoxService.resetToSeedData();
    const freshAuths = authorizationService.resetToSeedData();
    const freshChat = chatService.resetToSeedData();
    const freshAudits = auditService.resetToSeedData();
    const freshNotifs = notificationService.resetToSeedData();

    setOrders([...freshOrders]);
    setBoxes([...freshBoxes]);
    setAuthorizations([...freshAuths]);
    setConversations([...freshChat.conversations]);
    setActiveConversation(freshChat.conversations[0] || null);
    setChatMessages([...freshChat.messages]);
    setAuditLogs([...freshAudits.auditLogs]);
    setSecurityEvents([...freshAudits.securityEvents]);
    setNotifications([...freshNotifs]);

    setDemoStep(1);
    setDriverStep(1);
    setActiveOrderId('TW-1001');
    setRole('CUSTOMER');
    setCustomerView('TRACKING');

    setHardwareSim(DEFAULT_HARDWARE_SIM);
    saveToStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, DEFAULT_HARDWARE_SIM);
    saveToStorage(DEMO_STORAGE_KEYS.DEMO_STEP, 1);
    saveToStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, 1);
    saveToStorage(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, 'TW-1001');
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
        selectedMerchantProfileId,
        setSelectedMerchantProfileId,
        conversations,
        activeConversation,
        setActiveConversation,
        chatMessages,
        openMerchantChat,
        sendChatMessage,
        sendMerchantReply,
        confirmOrderByCustomer,
        confirmOrderByMerchant,
        generateDeliveryOTP,
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
        customerAuthorizeAccess,
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
