/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  SmartBoxAccessSession,
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
import { useAuth } from './AuthContext';

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
  activeOrder: Order | null;
  setActiveOrder: (order: Order) => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
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
  confirmOrderByCustomer: (orderId?: string, merchantId?: string) => Promise<void>;
  confirmOrderByMerchant: (orderId?: string, merchantId?: string) => Promise<void>;
  createOrderForMerchant: (merchantId: string, items?: any[]) => Promise<Order>;
  merchantDrafts: Record<string, any>;
  saveMerchantDraft: (merchantId: string, draft: any) => void;
  getMerchantDraft: (merchantId: string) => any;
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
      compartmentId?: string;
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
  customerRejectAccess: (orderId: string, reason?: string) => Promise<void>;

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
  driverRequestAccess: (orderId: string, isRetry?: boolean) => Promise<{ success: boolean; message: string }>;
  driverSubmitOTP: (orderId: string, otp: string) => Promise<{ success: boolean; message: string }>;
  driverOpenBox: (orderId: string) => Promise<void>;
  driverDepositPackage: (orderId: string, weightKg?: number, authId?: string) => Promise<void>;
  driverSecureBox: (orderId: string) => Promise<void>;
  driverCompleteDelivery: (orderId: string) => Promise<void>;
  driverFailDelivery: (orderId: string, reason?: string) => Promise<void>;
  accessSession: SmartBoxAccessSession | null;
  driverExpireAccessSession: (orderId: string) => Promise<void>;

  // General Status Transition with RBAC
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    options?: { actorRole?: ActorRole; actorName?: string; note?: string; extra?: Partial<Order> }
  ) => Promise<{ success: boolean; message: string }>;

  // Notification actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Demo Cleanup Action
  cleanupUnfinishedDemoOrders: () => Promise<{
    success: boolean;
    removedCount: number;
    message: string;
  }>;

  // Single Order State Sync Helper
  refreshOrdersFromService: () => Promise<Order[]>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, switchDemoRole } = useAuth();
  const [role, setRole] = useState<ActorRole>('CUSTOMER');
  const [customerView, setCustomerView] = useState<CustomerView>('HOME');
  const [adminView, setAdminView] = useState<'CONTROL_TOWER' | 'FLEET' | 'SECURITY' | 'AUDIT' | 'DIRECTORY'>('CONTROL_TOWER');
  const [merchantView, setMerchantView] = useState<'DASHBOARD' | 'INVENTORY'>('DASHBOARD');
  const [driverStep, setDriverStep] = useState<number>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, 1)
  );

  const [orders, setOrders] = useState<Order[]>(() => orderService.getAllOrdersSync());
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() =>
    loadFromStorage<string | null>(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, null)
  );
  const [boxes, setBoxes] = useState<SmartBox[]>(() => smartBoxService.getAllBoxesSync());
  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    const custom = loadFromStorage<Merchant[]>('tawseel_custom_merchants', []);
    return [...INITIAL_MERCHANTS, ...custom];
  });
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const customDrivers = loadFromStorage<Driver[]>('tawseel_custom_drivers', []);
    return [...INITIAL_DRIVERS, ...customDrivers];
  });
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(() =>
    loadFromStorage<string | null>(DEMO_STORAGE_KEYS.ACTIVE_MERCHANT_ID, 'merch-5')
  );
  const [cart, setCart] = useState<CartItem[]>([]);

  const [authorizations, setAuthorizations] = useState<TemporaryAccessAuthorization[]>(() =>
    authorizationService.getAllAuthorizationsSync()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => auditService.getAuditLogsSync());
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(() => auditService.getSecurityEventsSync());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => notificationService.getNotificationsSync());

  const [selectedMerchantProfileId, setSelectedMerchantProfileId] = useState<string | null>(() =>
    loadFromStorage<string | null>(DEMO_STORAGE_KEYS.ACTIVE_MERCHANT_ID, 'merch-5')
  );

  const [merchantDrafts, setMerchantDrafts] = useState<Record<string, any>>(() =>
    loadFromStorage<Record<string, any>>(DEMO_STORAGE_KEYS.MERCHANT_DRAFTS, {})
  );

  const saveMerchantDraft = (merchantId: string, draft: any) => {
    setMerchantDrafts((prev) => {
      const updated = { ...prev, [merchantId]: { ...(prev[merchantId] || {}), ...draft } };
      saveToStorage(DEMO_STORAGE_KEYS.MERCHANT_DRAFTS, updated);
      return updated;
    });
  };

  const getMerchantDraft = (merchantId: string) => {
    return merchantDrafts[merchantId] || null;
  };

  const [conversations, setConversations] = useState<Conversation[]>(() => chatService.getConversationsSync());
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(() => {
    const convs = chatService.getConversationsSync();
    const storedMerchId = loadFromStorage<string | null>(DEMO_STORAGE_KEYS.ACTIVE_MERCHANT_ID, null);
    if (storedMerchId) {
      const match = convs.find((c) => c.merchantId === storedMerchId);
      if (match) return match;
    }
    return null;
  });

  const activeConversationRef = useRef<Conversation | null>(activeConversation);
  const expiringOrderIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const convs = chatService.getConversationsSync();
    const storedMerchId = loadFromStorage<string | null>(DEMO_STORAGE_KEYS.ACTIVE_MERCHANT_ID, null);
    const initialActive = storedMerchId ? convs.find((c) => c.merchantId === storedMerchId) || null : null;
    if (initialActive) {
      return chatService.getAllMessagesSync().filter((m) => m.conversationId === initialActive.id);
    }
    return [];
  });

  // Hardware Simulation State - persisted
  const [hardwareSim, setHardwareSim] = useState<HardwareSimState>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, DEFAULT_HARDWARE_SIM)
  );

  // Smart Box Access Session (5 minutes from box opening)
  const [accessSession, setAccessSession] = useState<SmartBoxAccessSession | null>(() =>
    loadFromStorage<SmartBoxAccessSession | null>(DEMO_STORAGE_KEYS.ACCESS_SESSION, null)
  );

  const [demoStep, setDemoStep] = useState<number>(() =>
    loadFromStorage(DEMO_STORAGE_KEYS.DEMO_STEP, 1)
  );

  const refreshChat = async (targetConvId?: string) => {
    const convs = await chatService.getConversations();
    setConversations([...convs]);
    const currentConvId = targetConvId || activeConversationRef.current?.id;
    if (currentConvId) {
      const msgs = await chatService.getMessages(currentConvId);
      if (activeConversationRef.current?.id === currentConvId) {
        setChatMessages(msgs.filter((m) => m.conversationId === currentConvId));
      }
    } else {
      setChatMessages([]);
    }
  };

  // Sync chat messages whenever activeConversation changes
  useEffect(() => {
    if (activeConversation) {
      chatService.getMessages(activeConversation.id).then((msgs) => {
        if (activeConversationRef.current?.id === activeConversation.id) {
          setChatMessages(msgs.filter((m) => m.conversationId === activeConversation.id));
        }
      });
    } else {
      setChatMessages([]);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    const unsubscribeChat = chatService.subscribe(() => {
      refreshChat();
    });
    return unsubscribeChat;
  }, []);

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

  // Synchronize merchants & drivers when currentUser or custom records change
  useEffect(() => {
    const customMerchants = loadFromStorage<Merchant[]>('tawseel_custom_merchants', []);
    const mergedMerchants = [...INITIAL_MERCHANTS];
    for (const cm of customMerchants) {
      const idx = mergedMerchants.findIndex((m) => m.id === cm.id);
      if (idx >= 0) mergedMerchants[idx] = cm;
      else mergedMerchants.push(cm);
    }
    if (currentUser?.role === 'MERCHANT' && currentUser.id) {
      const exists = mergedMerchants.some((m) => m.id === currentUser.id);
      if (!exists) {
        const userMerch: Merchant = {
          id: currentUser.id,
          name: currentUser.name,
          businessName: currentUser.name,
          ownerName: currentUser.name,
          category: 'متجر معتمد',
          rating: 5.0,
          address: currentUser.details || 'القاهرة - الحي الخامس',
          phone: currentUser.phone || '+20 100 000 0000',
          phoneNumbers: [currentUser.phone || '+20 100 000 0000'],
          deliveryAvailable: true,
          workingHours: '10:00 ص - 11:00 م',
          isOpen: true,
          storePhotos: ['https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800'],
          shelfPhotos: [],
          featurePhotos: [],
          ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
          menuPhotos: [],
        };
        mergedMerchants.push(userMerch);
      }
    }
    setMerchants(mergedMerchants);

    const customDrivers = loadFromStorage<Driver[]>('tawseel_custom_drivers', []);
    const mergedDrivers = [...INITIAL_DRIVERS];
    for (const cd of customDrivers) {
      const idx = mergedDrivers.findIndex((d) => d.id === cd.id);
      if (idx >= 0) mergedDrivers[idx] = cd;
      else mergedDrivers.push(cd);
    }
    if (currentUser?.role === 'DRIVER' && currentUser.id) {
      const exists = mergedDrivers.some((d) => d.id === currentUser.id);
      if (!exists) {
        const userDriver: Driver = {
          id: currentUser.id,
          name: currentUser.name,
          code: currentUser.title?.match(/C-\d+/)?.[0] || 'C-4091',
          phone: currentUser.phone || '+20 100 000 0000',
          vehicle: 'سكوتر كهربائي ذكي',
          rating: 5.0,
          status: 'AVAILABLE',
          currentLocation: {
            lat: 30.015,
            lng: 31.435,
            description: 'بالقرب من الصندوق الذكي BOX-102',
          },
          assignedOrdersCount: 0,
          completedTodayCount: 0,
          todayEarnings: 0,
        };
        mergedDrivers.push(userDriver);
      }
    }
    setDrivers(mergedDrivers);
  }, [currentUser?.id, currentUser?.role, currentUser?.name]);

  // Continuous 1-second background watcher for 5-minute Smart Box authorization expiration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      authorizations.forEach((auth) => {
        if (
          auth.status === 'ACTIVE' &&
          auth.expiresAtTimestamp &&
          now >= auth.expiresAtTimestamp
        ) {
          const ord = orders.find((o) => o.id === auth.orderId);
          if (
            ord &&
            !['PACKAGE_DEPOSITED', 'SMART_BOX_SECURED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(
              ord.status
            )
          ) {
            driverExpireAccessSession(auth.orderId);
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [authorizations, orders]);

  const refreshAuditAndSecurity = async () => {
    const logs = await auditService.getAuditLogs();
    const events = await auditService.getSecurityEvents();
    const notifs = await notificationService.getNotifications();
    setAuditLogs([...logs]);
    setSecurityEvents([...events]);
    setNotifications([...notifs]);
  };

  const refreshOrdersFromService = async (): Promise<Order[]> => {
    const all = await orderService.getAllOrders();
    setOrders([...all]);
    return all;
  };

  const activeOrder: Order | null = (activeOrderId ? orders.find((o) => o.id === activeOrderId) : null) || null;
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
    await refreshOrdersFromService();
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
      compartmentId?: string;
    },
    maybeSize?: CompartmentSize
  ): Promise<Order> => {
    let orderItems: any[];
    let compSize: CompartmentSize;
    let merchantId = selectedMerchantId || 'merch-5';
    let deliveryAddress = 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس';
    let deliveryNotes = '';
    let targetBoxId = 'BOX-102';

    if (Array.isArray(paramsOrItems)) {
      orderItems = paramsOrItems;
      compSize = maybeSize || 'M';
      merchantId = selectedMerchantId || 'merch-5';
    } else {
      orderItems = paramsOrItems.items;
      compSize = paramsOrItems.compartmentSize;
      merchantId = paramsOrItems.merchantId || selectedMerchantId || 'merch-5';
      deliveryAddress = paramsOrItems.deliveryAddress || deliveryAddress;
      deliveryNotes = paramsOrItems.deliveryNotes || '';
      targetBoxId = paramsOrItems.smartBoxId || targetBoxId;
    }

    const effectiveCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;
    if (!effectiveCustomerId) {
      throw new Error('لا يمكن إنشاء الطلب: يرجى تسجيل الدخول بحساب عميل صالح.');
    }
    const merchantObj = merchants.find((m) => m.id === merchantId);
    if (!merchantObj) {
      throw new Error('المتجر المحدد غير موجود.');
    }

    const newOrder = await orderService.createOrder({
      customerId: effectiveCustomerId,
      customerName: currentUser?.name || 'العميل',
      customerPhone: currentUser?.phone || '+20 100 123 4567',
      merchantId: merchantObj.id,
      merchantName: merchantObj.businessName || merchantObj.name,
      smartBoxId: targetBoxId,
      compartmentId: Array.isArray(paramsOrItems) ? undefined : paramsOrItems.compartmentId,
      compartmentSize: compSize,
      items: orderItems,
      deliveryAddress,
      deliveryNotes,
    });

    if (activeConversation && activeConversation.merchantId === merchantObj.id) {
      activeConversation.orderId = newOrder.id;
      chatService.updateConversationOrder(activeConversation.id, newOrder.id);
    }

    setBoxes(smartBoxService.getAllBoxesSync());
    setActiveOrderId(newOrder.id);
    clearCart();
    refreshAuditAndSecurity();
    return newOrder;
  };

  const createOrderForMerchant = async (merchantId: string, customItems?: any[]): Promise<Order> => {
    const effectiveCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;
    if (!effectiveCustomerId) {
      throw new Error('لا يمكن إنشاء الطلب: يرجى تسجيل الدخول بحساب عميل صالح.');
    }
    const merchantObj = merchants.find((m) => m.id === merchantId);
    if (!merchantObj) {
      throw new Error('المتجر المحدد غير موجود.');
    }
    const merchantProducts = products.filter((p) => p.merchantId === merchantId);

    let itemsToOrder: any[];
    if (customItems && customItems.length > 0) {
      itemsToOrder = customItems;
    } else if (merchantProducts.length > 0) {
      itemsToOrder = [
        {
          id: merchantProducts[0].id,
          name: merchantProducts[0].name,
          specs: merchantProducts[0].specs || merchantProducts[0].category,
          quantity: 1,
          price: merchantProducts[0].price,
        },
        ...(merchantProducts.length > 1
          ? [
              {
                id: merchantProducts[1].id,
                name: merchantProducts[1].name,
                specs: merchantProducts[1].specs || merchantProducts[1].category,
                quantity: 1,
                price: merchantProducts[1].price,
              },
            ]
          : []),
      ];
    } else {
      itemsToOrder = [
        {
          id: `item-${Date.now()}`,
          name: `طلب معتمد من ${merchantObj.businessName || merchantObj.name}`,
          specs: merchantObj.category,
          quantity: 1,
          price: 150,
        },
      ];
    }

    const compSize = merchantProducts[0]?.compartmentSize || 'M';
    const newOrder = await orderService.createOrder({
      customerId: effectiveCustomerId,
      customerName: currentUser?.name || 'العميل',
      customerPhone: currentUser?.phone || '+20 100 123 4567',
      merchantId: merchantObj.id,
      merchantName: merchantObj.businessName || merchantObj.name,
      smartBoxId: 'BOX-102',
      compartmentSize: compSize,
      items: itemsToOrder,
      deliveryAddress: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
      deliveryNotes: `طلب مباشر تم إنشاؤه عبر المحادثة مع ${merchantObj.businessName || merchantObj.name}`,
    });

    const conv = await chatService.getOrCreateConversation(effectiveCustomerId, merchantId, newOrder.id);
    conv.orderId = newOrder.id;
    chatService.updateConversationOrder(conv.id, newOrder.id);
    activeConversationRef.current = conv;
    setActiveConversation(conv);

    setBoxes(smartBoxService.getAllBoxesSync());
    const all = await orderService.getAllOrders();
    setOrders([...all]);
    setActiveOrderId(newOrder.id);
    refreshAuditAndSecurity();
    await refreshChat(conv.id);

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
    const effectiveCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;
    if (!effectiveCustomerId) {
      throw new Error('لا يمكن تسجيل الشحنة: يرجى تسجيل الدخول بحساب عميل صالح.');
    }
    const newExt = await orderService.createOrder({
      customerId: effectiveCustomerId,
      customerName: currentUser?.name || 'العميل',
      customerPhone: data.phone || currentUser?.phone || '+20 100 123 4567',
      merchantName: data.merchantName,
      smartBoxId: 'BOX-102',
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

    setBoxes(smartBoxService.getAllBoxesSync());
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
    const effectiveCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;
    if (!effectiveCustomerId) {
      throw new Error('لا يمكن إنشاء تفويض: يرجى تسجيل الدخول بحساب عميل صالح.');
    }
    // Deliveries are strictly locked to 5 minutes
    const effectiveMins = data.type === 'DELIVERY' ? 5 : (data.expiresInMins || 60);
    const auth = await authorizationService.createAuthorization({
      customerId: effectiveCustomerId,
      customerName: currentUser?.name || 'العميل',
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
    setSelectedMerchantId(merchantId);
    setSelectedMerchantProfileId(merchantId);
    saveToStorage(DEMO_STORAGE_KEYS.ACTIVE_MERCHANT_ID, merchantId);

    // Immediately clear chat messages to avoid showing messages from previous merchant
    setChatMessages([]);

    let targetOrderId: string | undefined = undefined;
    if (orderId && orders.some((o) => o.id === orderId && o.merchantId === merchantId)) {
      targetOrderId = orderId;
    } else if (orderId && orders.some((o) => o.id === orderId)) {
      targetOrderId = orderId;
    }

    const effectiveCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;
    if (!effectiveCustomerId) {
      throw new Error('يرجى تسجيل الدخول بحساب عميل لفتح المحادثة.');
    }

    const conv = await chatService.getOrCreateConversation(effectiveCustomerId, merchantId, targetOrderId);
    activeConversationRef.current = conv;
    setActiveConversation(conv);
    const msgs = await chatService.getMessages(conv.id);
    if (activeConversationRef.current?.id === conv.id) {
      setChatMessages(msgs.filter((m) => m.conversationId === conv.id));
    }
    setCustomerView('CHAT');
  };

  const sendChatMessage = async (text: string, type: MessageType = 'TEXT', imageUrl?: string) => {
    if (!activeConversation) return;
    const senderId = currentUser?.role === 'CUSTOMER' ? currentUser.id : (currentUser?.id || activeConversation.customerId);
    await chatService.sendMessage({
      conversationId: activeConversation.id,
      senderId,
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

  const confirmOrderByCustomer = async (orderId?: string, merchantId?: string) => {
    let targetId = orderId;
    const currentMerchantId = merchantId || activeConversation?.merchantId || selectedMerchantId;

    if (!targetId && activeConversation?.orderId) {
      targetId = activeConversation.orderId;
    }
    if (!targetId && !activeConversation && activeOrder && (!currentMerchantId || activeOrder.merchantId === currentMerchantId)) {
      targetId = activeOrder.id;
    }

    if (!targetId) {
      throw new Error('لا يوجد طلب محدد لهذه العملية');
    }

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

  const confirmOrderByMerchant = async (orderId?: string, merchantId?: string) => {
    let targetId = orderId;
    const currentMerchantId = merchantId || activeConversation?.merchantId || selectedMerchantId;

    if (!targetId && activeConversation?.orderId) {
      targetId = activeConversation.orderId;
    }
    if (!targetId && !activeConversation && activeOrder && (!currentMerchantId || activeOrder.merchantId === currentMerchantId)) {
      targetId = activeOrder.id;
    }

    if (!targetId) {
      throw new Error('لا يوجد طلب محدد لهذه العملية');
    }

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
          senderId: ord.merchantId || currentMerchantId || 'system',
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
    const targetId = orderId || (activeOrder ? activeOrder.id : undefined);
    if (!targetId) {
      return { success: false, message: 'لا يوجد طلب محدد لهذه العملية' };
    }
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

    // Strict Safety: Enforce DRIVER_ARRIVED requirement inside the authorization/OTP path too
    if (ord.status !== 'DRIVER_ARRIVED' && ord.status !== 'ACCESS_AUTHORIZED') {
      return {
        success: false,
        message: 'لا يمكن إصدار تصريح التوصيل أو رمز OTP إلا بعد وصول المندوب أمام الصندوق الذكي (DRIVER_ARRIVED).',
      };
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
    if (!ord.driverId) {
      return { success: false, message: 'لا يمكن إصدار تصريح التوصيل قبل إسناد الطلب لمندوب معتمد.' };
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

    if (!ord.customerId) {
      return { success: false, message: 'لا يمكن إصدار تصريح: الطلب غير مرتبط بعميل.' };
    }

    // 7, 8, 9, 10: Create a NEW authorization using authorizationService.createAuthorization()
    // The authorization MUST be DELIVERY, duration MUST be exactly 5 minutes, OTP generated dynamically
    const auth = await authorizationService.createAuthorization({
      customerId: ord.customerId,
      customerName: ord.customerName || 'العميل',
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



    const allOrders = await orderService.getAllOrders();
    setOrders([...allOrders]);

    // 12. Make the current authorization available to the Driver flow (present in state and service)

    // 13. Security isolation: The normal customer <-> merchant chat remains separate from delivery authorization.
    // Do NOT send OTP or delivery authorization messages through the merchant chat.

    // 14. Do NOT put the plaintext OTP into AuditService
    refreshAuditAndSecurity();

    return {
      success: true,
      authorization: auth,
      message: 'تم إصدار تصريح التوصيل بنجاح!',
    };
  };

  // --- Merchant Handlers (FIX 5: Merchant ID Isolation & Ownership Verification) ---
  const getEffectiveMerchantId = (order?: Order): string => {
    if (currentUser?.role === 'MERCHANT') return currentUser.id;
    if (order?.merchantId) return order.merchantId;
    if (selectedMerchantId) return selectedMerchantId;
    throw new Error('لا يمكن تحديد هوية المتجر للعملية الحالية.');
  };

  const verifyMerchantOwnership = (order: Order, effectiveMerchantId: string) => {
    if (order.merchantId && order.merchantId !== effectiveMerchantId) {
      throw new Error('غير مصرح لك بتعديل أو متابعة طلب يتبع متجراً آخر.');
    }
  };

  const acceptOrder = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const merchantId = getEffectiveMerchantId(ord);
    verifyMerchantOwnership(ord, merchantId);
    await orderService.updateOrderStatus(orderId, 'ACCEPTED', 'MERCHANT', merchantId, ord.merchantName || 'المتجر');
    refreshAuditAndSecurity();
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const merchantId = getEffectiveMerchantId(ord);
    verifyMerchantOwnership(ord, merchantId);
    await orderService.rejectOrder(orderId, 'MERCHANT', reason);
    refreshAuditAndSecurity();
  };

  const markOrderPreparing = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const merchantId = getEffectiveMerchantId(ord);
    verifyMerchantOwnership(ord, merchantId);
    await orderService.updateOrderStatus(orderId, 'PREPARING', 'MERCHANT', merchantId, ord.merchantName || 'المتجر');
    refreshAuditAndSecurity();
  };

  const markOrderReady = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const merchantId = getEffectiveMerchantId(ord);
    verifyMerchantOwnership(ord, merchantId);
    await orderService.updateOrderStatus(orderId, 'READY', 'MERCHANT', merchantId, ord.merchantName || 'المتجر');
    refreshAuditAndSecurity();
  };

  const assignOrderToDriver = async (orderId: string, driverId?: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const merchantId = getEffectiveMerchantId(ord);
    verifyMerchantOwnership(ord, merchantId);
    const targetDriverId = driverId || (drivers.length > 0 ? drivers[0].id : undefined);
    if (!targetDriverId) {
      throw new Error('يرجى تحديد مندوب توصيل لتعيين الطلب إليه.');
    }
    await orderService.assignDriver(orderId, targetDriverId, 'MERCHANT');
    refreshAuditAndSecurity();
  };

  const handOverToDriver = async (orderId: string) => {
    await assignOrderToDriver(orderId);
  };

  // --- Driver Handlers ---
  const driverPickupOrder = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const effectiveDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!effectiveDriverId) {
      throw new Error('لا يوجد مندوب محدد لتنفيذ هذه العملية. يرجى تسجيل الدخول كمندوب.');
    }
    if (ord.driverId && ord.driverId !== effectiveDriverId) {
      throw new Error('الطلب غير مسند لهذا المندوب.');
    }
    await orderService.updateOrderStatus(
      orderId,
      'PICKED_UP',
      'DRIVER',
      effectiveDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );
    refreshAuditAndSecurity();
  };

  const driverStartDelivery = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const effectiveDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!effectiveDriverId) {
      throw new Error('لا يوجد مندوب محدد لتنفيذ هذه العملية. يرجى تسجيل الدخول كمندوب.');
    }
    if (ord.driverId && ord.driverId !== effectiveDriverId) {
      throw new Error('الطلب غير مسند لهذا المندوب.');
    }
    await orderService.updateOrderStatus(
      orderId,
      'OUT_FOR_DELIVERY',
      'DRIVER',
      effectiveDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );
    setDriverStep(1);
    refreshAuditAndSecurity();
  };

  const driverArriveAtBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');
    const effectiveDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!effectiveDriverId) {
      throw new Error('لا يوجد مندوب محدد لتنفيذ هذه العملية. يرجى تسجيل الدخول كمندوب.');
    }
    if (ord.driverId && ord.driverId !== effectiveDriverId) {
      throw new Error('الطلب غير مسند لهذا المندوب.');
    }
    await orderService.updateOrderStatus(
      orderId,
      'DRIVER_ARRIVED',
      'DRIVER',
      effectiveDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );
    setDriverStep(2);
    refreshAuditAndSecurity();
  };

  const driverRequestAccess = async (
    orderId: string,
    isRetry = false
  ): Promise<{ success: boolean; message: string }> => {
    const ord = orders.find((o) => o.id === orderId) || (await orderService.getOrder(orderId));
    if (!ord) return { success: false, message: 'الطلب غير موجود.' };

    // Requirement 5: Driver can request Smart Box access ONLY when order.status === DRIVER_ARRIVED
    if (ord.status !== 'DRIVER_ARRIVED') {
      return {
        success: false,
        message: 'لا يمكن طلب إذن الفتح إلا عندما تكون حالة الطلب وصول المندوب (DRIVER_ARRIVED).',
      };
    }

    const customerId = ord.customerId;
    if (!customerId) return { success: false, message: 'الطلب غير مرتبط بعميل صالح.' };
    const driverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!driverId) return { success: false, message: 'يرجى تسجيل الدخول كمندوب توصيل معتمد.' };
    if (ord.driverId && ord.driverId !== driverId) return { success: false, message: 'الطلب غير مسند لهذا المندوب.' };
    const customerName = ord.customerName || 'العميل';
    const driverName = ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب');
    const smartBoxId = ord.smartBoxId || 'BOX-102';
    const compartmentId = ord.compartmentId || '01';

    // FIX 2: Check for existing PENDING request before creating a new one or sending notification
    const existingPending = authorizations.find(
      (a) =>
        a.status === 'PENDING' &&
        a.orderId === orderId &&
        a.customerId === customerId &&
        (!driverId || !a.driverId || a.driverId === driverId) &&
        a.smartBoxId === smartBoxId &&
        a.compartmentId === compartmentId
    );

    if (existingPending) {
      return {
        success: true,
        message: 'طلب فتح الصندوق مرسل بالفعل وفي انتظار اعتماد العميل.',
      };
    }

    // Create a new PENDING authorization request
    await authorizationService.createAccessRequest({
      customerId,
      customerName,
      orderId,
      driverId,
      driverName,
      smartBoxId,
      compartmentId,
      reason: isRetry ? 'انتهت مهلة الإيداع السابقة' : undefined,
      isRetry,
    });

    setAuthorizations(authorizationService.getAllAuthorizationsSync());

    // Dispatches customer notification (Requirement 17.A)
    await notificationService.notify(
      isRetry ? 'المندوب يطلب إذن فتح جديد' : 'المندوب يطلب إذن فتح الصندوق',
      isRetry
        ? `المندوب يطلب إذن فتح الصندوق (${smartBoxId} - حجيرة ${compartmentId}) للطلب #${orderId} مرة أخرى بعد انتهاء المهلة السابقة.`
        : `المندوب يطلب إذن فتح الصندوق (${smartBoxId} - حجيرة ${compartmentId}) للطلب #${orderId}.`,
      'SECURITY',
      {
        orderId,
        smartBoxId,
        compartmentId,
        driverId,
        customerId,
        targetRole: 'CUSTOMER',
      }
    );

    refreshAuditAndSecurity();
    return {
      success: true,
      message: 'تم إرسال طلب فتح الصندوق للعميل، في انتظار اعتماده.',
    };
  };

  const customerAuthorizeAccess = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId) || (await orderService.getOrder(orderId));
    if (!ord) {
      throw new Error('الطلب غير موجود');
    }

    // Requirement 6: Customer can authorize ONLY if ALL conditions met:
    // 1. Current customer owns the order
    const currentCustId = currentUser?.role === 'CUSTOMER' ? currentUser.id : undefined;
    if (!currentCustId) {
      throw new Error('يرجى تسجيل الدخول بحساب العميل صاحب الطلب.');
    }
    if (ord.customerId && ord.customerId !== currentCustId) {
      throw new Error('غير مصرح لك بتفويض هذا الطلب.');
    }

    // 2. order.status === DRIVER_ARRIVED
    if (ord.status !== 'DRIVER_ARRIVED') {
      throw new Error('لا يمكن تفويض الفتح إلا عندما تكون حالة الطلب وصول المندوب (DRIVER_ARRIVED).');
    }

    // 3. Driver is assigned
    if (!ord.driverId) {
      throw new Error('لم يتم تعيين مندوب لهذا الطلب بعد.');
    }

    // 4. Smart Box exists
    const smartBoxId = ord.smartBoxId || 'BOX-102';
    const box = boxes.find((b) => b.id === smartBoxId);
    if (!box) {
      throw new Error('الصندوق الذكي المحدد غير موجود بالنظام.');
    }

    // 5. Compartment exists
    const compartmentId = ord.compartmentId || '01';
    const comp = box.compartments.find((c) => c.id === compartmentId);
    if (!comp) {
      throw new Error('حجيرة الصندوق المحددة غير موجودة.');
    }

    // 6. Matching PENDING access request exists
    const assignedDriverId = ord.driverId;
    const customerId = ord.customerId || currentCustId;
    const pendingRequest = authorizations.find(
      (a) =>
        a.orderId === orderId &&
        a.status === 'PENDING' &&
        a.customerId === customerId &&
        (!a.driverId || a.driverId === assignedDriverId) &&
        a.smartBoxId === smartBoxId &&
        a.compartmentId === compartmentId
    );
    if (!pendingRequest) {
      throw new Error('لا يوجد طلب فتح معلق من المندوب بانتظار الاعتماد.');
    }

    // 7. No currently valid authorization exists
    const now = Date.now();
    const existingValidAuth = authorizations.find(
      (a) =>
        a.orderId === orderId &&
        a.status === 'ACTIVE' &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > now)
    );
    if (existingValidAuth) {
      throw new Error('يوجد تصريح فتح نشط وساري المفعول بالفعل لهذا الطلب.');
    }

    // Create / activate NEW authorization record with fresh OTP and independent 5-minute timer
    await authorizationService.createAuthorization({
      customerId,
      customerName: ord.customerName || 'أحمد مصطفى',
      orderId,
      driverId: assignedDriverId,
      driverName: ord.driverName || 'إسلام عامر',
      smartBoxId,
      compartmentId,
      expiresInMinutes: 5,
    });

    setAuthorizations(authorizationService.getAllAuthorizationsSync());
    setAccessSession(null);
    saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, null);

    await orderService.updateOrderStatus(
      orderId,
      'ACCESS_AUTHORIZED',
      'CUSTOMER',
      customerId,
      ord.customerName || 'أحمد مصطفى'
    );
    await refreshOrdersFromService();

    // In-App Push Notification for assigned driver (Requirements 6 & 17.B / 17.E)
    const isRetryApproval = authorizations.some(
      (a) => a.orderId === orderId && (a.status === 'EXPIRED' || a.isRetry)
    );
    const notifTitle = isRetryApproval ? 'تمت الموافقة على طلب الفتح الجديد' : 'تمت الموافقة على فتح الصندوق';
    const notifMessage = isRetryApproval
      ? `تمت الموافقة على طلب الفتح الجديد (${smartBoxId} - حجيرة ${compartmentId}) للطلب #${orderId}. التصريح صالح لمدة 5 دقائق.`
      : `تمت الموافقة على فتح الصندوق (${smartBoxId} - حجيرة ${compartmentId}) للطلب #${orderId}. التصريح صالح لمدة 5 دقائق.`;

    await notificationService.notify(
      notifTitle,
      notifMessage,
      'SECURITY',
      {
        orderId,
        smartBoxId,
        compartmentId,
        driverId: assignedDriverId,
        customerId,
        targetRole: 'DRIVER',
      }
    );
    setNotifications([...notificationService.getNotificationsSync()]);

    refreshAuditAndSecurity();
  };

  const customerRejectAccess = async (orderId: string, reason = 'رفض العميل السماح بفتح الصندوق') => {
    const ord = orders.find((o) => o.id === orderId);
    await authorizationService.rejectAccessRequest(orderId, reason);
    setAuthorizations(authorizationService.getAllAuthorizationsSync());

    await auditService.recordEvent({
      actor: ord?.customerName || 'العميل',
      actorRole: 'CUSTOMER',
      orderId,
      smartBoxId: ord?.smartBoxId || 'BOX-102',
      compartmentId: ord?.compartmentId || '01',
      action: 'ACCESS_DENIED',
      result: 'WARNING',
      details: reason,
    });

    // Notify Driver of rejection (Requirement 17.C)
    if (ord) {
      await notificationService.notify(
        'تم رفض طلب فتح الصندوق',
        `قام العميل برفض إذن فتح الصندوق للطلب #${orderId}.`,
        'SECURITY',
        {
          orderId,
          smartBoxId: ord.smartBoxId || 'BOX-102',
          compartmentId: ord.compartmentId || '01',
          driverId: ord.driverId || '',
          customerId: ord.customerId || '',
          targetRole: 'DRIVER',
        }
      );
    }

    refreshAuditAndSecurity();
  };

  const driverSubmitOTP = async (
    orderId: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return { success: false, message: 'الطلب غير موجود بالنظام.' };
    const customerId = ord.customerId;
    const driverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!customerId || !driverId) {
      return { success: false, message: 'يرجى تسجيل الدخول كمندوب معتمد مرتبط بالطلب.' };
    }
    if (ord.driverId && ord.driverId !== driverId) {
      return { success: false, message: 'الطلب غير مسند لهذا المندوب.' };
    }
    const smartBoxId = ord.smartBoxId || 'BOX-102';
    const compartmentId = ord.compartmentId || '01';

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
      return { success: false, message: valResult.reason || 'رمز OTP غير صحيح أو منتهي الصلاحية.' };
    }

    // Access granted -> transitions to OTP_VALIDATED
    await orderService.updateOrderStatus(
      orderId,
      'OTP_VALIDATED',
      'DRIVER',
      driverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );

    const validatedAuthId = valResult.authorization?.id;
    setAuthorizations((prev) =>
      prev.map((a) =>
        (validatedAuthId ? a.id === validatedAuthId : (a.orderId === orderId && a.status === 'ACTIVE'))
          ? {
              ...a,
              otpValidated: true,
              isOtpConsumed: true,
              otpValidatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            }
          : a
      )
    );

    await auditService.recordEvent({
      actor: ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب الميداني'),
      actorRole: 'DRIVER',
      orderId,
      smartBoxId,
      compartmentId,
      action: 'OTP_VALIDATED',
      result: 'SUCCESS',
      details: `تم التحقق بنجاح من صحة رمز المرور (OTP) لفتح الحجيرة ${compartmentId}`,
    });

    setDriverStep(3);
    await refreshOrdersFromService();
    refreshAuditAndSecurity();

    return {
      success: true,
      message: 'تم التحقق من رمز OTP بنجاح! جاهز لفتح مزلاج الصندوق الذكي.',
    };
  };

  const driverOpenBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');

    // FIX 1 — ABSOLUTE OTP GATE BEFORE SMART BOX OPEN
    // Require ALL 11 conditions:
    // 6. order.status === OTP_VALIDATED
    if (ord.status !== 'OTP_VALIDATED') {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    const currentDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!currentDriverId) {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    // 7. order belongs to current driver
    if (ord.driverId && ord.driverId !== currentDriverId) {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    const now = Date.now();
    const boxId = ord.smartBoxId || 'BOX-102';
    const compId = ord.compartmentId || '01';
    const customerId = ord.customerId;

    // 1. authorization exists & find current active authorization (FIX 3)
    const candidateAuths = authorizations.filter(
      (a) =>
        a.orderId === orderId &&
        a.status === 'ACTIVE' &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
        (!a.driverId || a.driverId === currentDriverId) &&
        (!customerId || a.customerId === customerId) &&
        a.smartBoxId === boxId &&
        a.compartmentId === compId &&
        !a.usedAt &&
        a.otpValidated === true
    );

    const auth = candidateAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];

    if (!auth) {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    // 2. authorization.status === ACTIVE
    // 3. authorization has not expired
    // 4. authorization has not been used
    // 5. authorization.otpValidated === true
    // 8. authorization.orderId === order.id
    // 9. authorization.driverId === current driver
    // 10. authorization.smartBoxId === order.smartBoxId
    // 11. authorization.compartmentId === order.compartmentId
    const isExpired = auth.expiresAtTimestamp ? now > auth.expiresAtTimestamp : false;
    const isUsed = auth.status === 'USED' || Boolean(auth.usedAt);
    const isDriverMatch = !auth.driverId || auth.driverId === currentDriverId;
    const isCustMatch = !customerId || auth.customerId === customerId;
    const isBoxMatch = auth.smartBoxId === boxId;
    const isCompMatch = auth.compartmentId === compId;

    if (
      auth.status !== 'ACTIVE' ||
      isExpired ||
      isUsed ||
      auth.otpValidated !== true ||
      auth.orderId !== ord.id ||
      !isDriverMatch ||
      !isCustMatch ||
      !isBoxMatch ||
      !isCompMatch
    ) {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    // Verify with service layer
    const isAuth = await authorizationService.isAccessAuthorized(boxId, compId, orderId, currentDriverId, customerId);
    if (!isAuth) {
      throw new Error('يجب التحقق من OTP أولاً');
    }

    // 1. Unlock Smart Lock
    await smartLockService.unlock(boxId, compId);

    // 2. Start 5-minute Smart Box Access Session
    const session: SmartBoxAccessSession = {
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      startedAt: now,
      expiresAt: now + 5 * 60 * 1000,
      status: 'ACTIVE',
    };
    setAccessSession(session);
    saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, session);

    // 3. Update hardware simulation
    setHardwareSim((prev) => ({
      ...prev,
      boxId,
      compartmentId: compId,
      isSolenoidLocked: false,
      isDoorClosed: false,
      weightKg: 0,
      lastActionMessage: '[عتاد ذكي] انفتح قفل السولينويد وبدأت جلسة إيداع الطرد المؤقتة (5:00 دقائق)',
    }));

    // 4. Update order status
    await orderService.updateOrderStatus(
      orderId,
      'SMART_BOX_OPENED',
      'DRIVER',
      currentDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );

    await auditService.recordEvent({
      actor: ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب الميداني'),
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'SMART_BOX_UNLOCKED',
      result: 'SUCCESS',
      details: `تم تحرير القفل الكهرومغناطيسي للحجيرة ${compId} وبدء جلسة الإيداع`,
    });

    await auditService.recordEvent({
      actor: ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب الميداني'),
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'DOOR_OPENED',
      result: 'SUCCESS',
      details: `تم فتح باب الحجيرة ${compId} بنجاح للإيداع`,
    });

    await refreshOrdersFromService();
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverDepositPackage = async (orderId: string, weightKg = 1.4, authId?: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');

    // Strict Service-Level Security Guard:
    if (ord.status !== 'SMART_BOX_OPENED') {
      throw new Error('لا يمكن إيداع الشحنة قبل فتح الصندوق الذكي.');
    }

    if (!accessSession || accessSession.orderId !== orderId || accessSession.status !== 'ACTIVE' || accessSession.expiresAt <= Date.now()) {
      throw new Error('انتهت صلاحية جلسة فتح الصندوق أو لم تبدأ بعد.');
    }

    const currentDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!currentDriverId) {
      throw new Error('لا يمكن إيداع الشحنة: لم يتم التحقق من هوية المندوب.');
    }
    if (ord.driverId && ord.driverId !== currentDriverId) {
      throw new Error('لا يمكن إيداع الشحنة: الطلب غير مسند لهذا المندوب.');
    }

    const now = Date.now();
    const boxId = ord.smartBoxId || 'BOX-102';
    const compId = ord.compartmentId || '01';
    const customerId = ord.customerId;
    if (!customerId) {
      throw new Error('لا يمكن إيداع الشحنة: لم يتم العثور على هوية العميل المرتبط بالطلب.');
    }

    // FIX 2 — Absolute current authorization check for package deposit:
    // Package deposit MUST use the CURRENT authorization for the CURRENT delivery attempt.
    // The authorization must match ALL:
    // - current orderId
    // - current driverId
    // - current customerId
    // - current smartBoxId
    // - current compartmentId
    // - status === ACTIVE
    // - otpValidated === true
    // - not expired
    // - not used
    let auth: TemporaryAccessAuthorization | undefined;

    if (authId) {
      auth = authorizations.find(
        (a) =>
          a.id === authId &&
          a.orderId === orderId &&
          (!a.driverId || a.driverId === currentDriverId) &&
          a.customerId === customerId &&
          a.smartBoxId === boxId &&
          a.compartmentId === compId &&
          a.status === 'ACTIVE' &&
          a.otpValidated === true &&
          (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
          !a.usedAt
      );
    }

    if (!auth) {
      const candidateAuths = authorizations.filter(
        (a) =>
          a.orderId === orderId &&
          (!a.driverId || a.driverId === currentDriverId) &&
          a.customerId === customerId &&
          a.smartBoxId === boxId &&
          a.compartmentId === compId &&
          a.status === 'ACTIVE' &&
          a.otpValidated === true &&
          (!a.expiresAtTimestamp || a.expiresAtTimestamp > now) &&
          !a.usedAt
      );
      if (candidateAuths.length > 0) {
        auth = candidateAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
      }
    }

    if (!auth) {
      throw new Error('لا يمكن إيداع الشحنة: لا يوجد تصريح وصول نشط وموثق برمز OTP للدورة الحالية.');
    }

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
      currentDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );

    await auditService.recordEvent({
      actor: ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب الميداني'),
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'PACKAGE_DEPOSITED',
      result: 'SUCCESS',
      details: `تم رصد استقرار الطرد على حساس الوزن الديناميكي (+${weightKg} كجم)`,
    });

    await refreshOrdersFromService();
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverSecureBox = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');

    // Strict Service-Level Security Guard:
    // Normal successful path MUST require PACKAGE_DEPOSITED and recorded weight!
    if (ord.status !== 'PACKAGE_DEPOSITED') {
      throw new Error('لا يمكن إغلاق وتأمين الصندوق قبل تسجيل إيداع الشحنة في الحجيرة.');
    }

    if (hardwareSim.weightKg <= 0) {
      throw new Error('لم يتم رصد وزن الشحنة بالحجيرة! يرجى إيداع الطرد أولاً.');
    }

    const currentDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!currentDriverId) {
      throw new Error('لا يمكن تأمين الصندوق: لم يتم التحقق من هوية المندوب.');
    }
    if (ord.driverId && ord.driverId !== currentDriverId) {
      throw new Error('لا يمكن تأمين الصندوق: الطلب غير مسند لهذا المندوب.');
    }

    const boxId = ord.smartBoxId || 'BOX-102';
    const compId = ord.compartmentId || '01';

    await smartBoxService.secureCompartment(boxId, compId);

    setHardwareSim((prev) => ({
      ...prev,
      boxId,
      compartmentId: compId,
      isSolenoidLocked: true,
      isDoorClosed: true,
      lastActionMessage: '[عتاد ذكي] أُغلق الباب وتم تأمين القفل الكهرومغناطيسي 100%',
    }));

    // End access session
    setAccessSession((prev) => {
      if (!prev) return null;
      const updated = { ...prev, status: 'COMPLETED' as const };
      saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, updated);
      return updated;
    });

    // Consume Driver Authorization
    const candidateAuths = authorizations.filter(
      (a) =>
        a.orderId === orderId &&
        a.status === 'ACTIVE' &&
        a.otpValidated === true &&
        (!a.driverId || a.driverId === currentDriverId) &&
        (!ord.customerId || a.customerId === ord.customerId) &&
        a.smartBoxId === boxId &&
        a.compartmentId === compId &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > Date.now()) &&
        !a.usedAt
    );
    const currentAuth = candidateAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];

    if (currentAuth) {
      await authorizationService.completeAccess(orderId, currentAuth.id);
      setAuthorizations((prev) =>
        prev.map((a) =>
          a.id === currentAuth.id
            ? {
                ...a,
                status: 'USED',
                isOtpConsumed: true,
                usedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
              }
            : a
        )
      );
    }

    await orderService.updateOrderStatus(
      orderId,
      'SMART_BOX_SECURED',
      'DRIVER',
      currentDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب')
    );

    await auditService.recordEvent({
      actor: ord.driverName || 'المندوب الميداني',
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'DOOR_CLOSED',
      result: 'SUCCESS',
      details: `تم إغلاق باب الحجيرة ${compId} بنجاح`,
    });

    await auditService.recordEvent({
      actor: ord.driverName || 'المندوب الميداني',
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'SMART_BOX_LOCKED',
      result: 'SUCCESS',
      details: `تم تأمين قفل الصندوق الذكي ${boxId} بعد إيداع الشحنة بنجاح`,
    });

    await refreshOrdersFromService();
    setDriverStep(4);
    refreshAuditAndSecurity();
  };

  const driverExpireAccessSession = async (orderId: string) => {
    if (expiringOrderIdsRef.current.has(orderId)) {
      return;
    }
    expiringOrderIdsRef.current.add(orderId);

    try {
      const currentOrder = orders.find((o) => o.id === orderId) || (await orderService.getOrder(orderId));
      if (!currentOrder) return;

      // Idempotency: if order is already terminal or already handled, return early
      if (['COMPLETED', 'DELIVERY_FAILED', 'CANCELLED', 'REJECTED'].includes(currentOrder.status)) {
        return;
      }
      const activeCandidates = authorizations.filter(
        (a) =>
          a.orderId === orderId &&
          a.status === 'ACTIVE' &&
          (!currentOrder.driverId || !a.driverId || a.driverId === currentOrder.driverId) &&
          (!currentOrder.customerId || a.customerId === currentOrder.customerId) &&
          (!currentOrder.smartBoxId || a.smartBoxId === currentOrder.smartBoxId) &&
          (!currentOrder.compartmentId || a.compartmentId === currentOrder.compartmentId)
      );
      const currentActiveAuth = activeCandidates.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
      const isSessionActive = accessSession?.orderId === orderId && accessSession?.status === 'ACTIVE';

      if (!currentActiveAuth && !isSessionActive && currentOrder.status === 'DRIVER_ARRIVED') {
        return;
      }

      const boxId = currentOrder.smartBoxId || 'BOX-102';
      const compId = currentOrder.compartmentId || '01';

      // 1. Automatically lock and secure the physical compartment & box
      await smartBoxService.secureCompartment(boxId, compId);

      setHardwareSim((prev) => ({
        ...prev,
        boxId,
        compartmentId: compId,
        isSolenoidLocked: true,
        isDoorClosed: true,
        weightKg: currentOrder.status === 'PACKAGE_DEPOSITED' ? prev.weightKg : 0,
        lastActionMessage: '[عتاد ذكي] انتهت مهلة جلسة فتح الصندوق (5 دقائق) وتم تأمين وقفل الصندوق تلقائيًا',
      }));

      // 2. Mark access session status as EXPIRED
      setAccessSession((prev) => {
        const updated = {
          orderId,
          smartBoxId: boxId,
          compartmentId: compId,
          startedAt: prev?.startedAt || Date.now() - 5 * 60 * 1000,
          expiresAt: Date.now(),
          status: 'EXPIRED' as const,
        };
        saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, updated);
        return updated;
      });

      // 3. Mark driver authorization as EXPIRED and consumed (never reusable)
      const hasExpiredAuth = await authorizationService.expireAuthorization(orderId);
      setAuthorizations(authorizationService.getAllAuthorizationsSync());

      // 4. Branch based on whether package was already deposited:
      if (currentOrder.status === 'PACKAGE_DEPOSITED' || hardwareSim.weightKg > 0) {
        // Package WAS deposited before timeout: preserve deposit evidence & advance to SMART_BOX_SECURED
        if (currentOrder.status !== 'SMART_BOX_SECURED') {
          await orderService.updateOrderStatus(
            orderId,
            'SMART_BOX_SECURED',
            'DRIVER',
            currentOrder.driverId || '',
            currentOrder.driverName || 'المندوب'
          );

          await auditService.recordEvent({
            actor: 'نظام الصندوق الذكي',
            actorRole: 'ADMIN',
            orderId,
            smartBoxId: boxId,
            compartmentId: compId,
            action: 'SMART_BOX_LOCKED',
            result: 'SUCCESS',
            details: 'تم قفل الصندوق آلياً بعد إيداع الشحنة لانقضاء مهلة الجلسة (5 دقائق)',
          });
        }
      } else {
        // Access session expired BEFORE package was deposited:
        // DO NOT mark SMART_BOX_SECURED! DO NOT mark COMPLETED! DO NOT mark DELIVERY_FAILED!
        // Return order state to DRIVER_ARRIVED with no active authorization, ready for a NEW access request!
        if (currentOrder.status !== 'DRIVER_ARRIVED') {
          await orderService.updateOrderStatus(
            orderId,
            'DRIVER_ARRIVED',
            'ADMIN',
            'SYSTEM',
            'نظام الصندوق الذكي',
            {
              lastTimeoutAt: new Date().toLocaleTimeString('ar-EG'),
              timeoutReason: 'انتهت مهلة الإيداع ولم يتم تسجيل إيداع الشحنة',
            }
          );
        }

        if (hasExpiredAuth || isSessionActive) {
          // Requirement 18: For timeout -> ACCESS_EXPIRED and SMART_BOX_LOCKED
          await auditService.recordEvent({
            actor: 'نظام الأمان والصناديق الذكية',
            actorRole: 'ADMIN',
            orderId,
            smartBoxId: boxId,
            compartmentId: compId,
            action: 'ACCESS_EXPIRED',
            result: 'FAILURE',
            details: 'انتهت مهلة إيداع الشحنة (5 دقائق) دون تسجيل إيداع الطرد بالحجيرة، تم قفل الصندوق آلياً وإلغاء صلاحية الرمز، وأصبح الطلب جاهزاً لطلب إذن جديد',
          });

          await auditService.recordEvent({
            actor: 'نظام الصندوق الذكي',
            actorRole: 'ADMIN',
            orderId,
            smartBoxId: boxId,
            compartmentId: compId,
            action: 'SMART_BOX_LOCKED',
            result: 'SUCCESS',
            details: 'تم قفل وتأمين مزلاج الحجيرة آلياً بعد انتهاء مهلة إذن الدخول دون إيداع',
          });

          await auditService.recordSecurityIncident({
            incidentCode: `INC-SESSEXP-${Math.floor(Math.random() * 9000 + 1000)}#`,
            severity: 'MEDIUM',
            smartBoxId: boxId,
            compartmentId: compId,
            title: 'انتهاء مهلة فتح الصندوق دون إيداع',
            description: `انتهت مهلة الـ 5 دقائق للطلب ${orderId} دون إيداع الطرد، وتم تأمين القفل آلياً وسحب التصريح`,
            status: 'RESOLVED',
            actionTaken: 'تم قفل المزلاج آلياً وإلغاء صلاحية OTP وإعادة حالة الطلب لوصول المندوب DRIVER_ARRIVED بانتظار طلب جديد',
            location: 'موقع الصندوق الذكي',
          });

          // Persistent customer notification (Requirement 4 & 17.D)
          await notificationService.notify(
            'انتهاء مهلة فتح الصندوق',
            'انتهت مهلة السماح للمندوب بفتح الصندوق دون تسجيل إيداع الشحنة.\nتم قفل الصندوق تلقائيًا.',
            'SECURITY',
            {
              orderId,
              smartBoxId: boxId,
              compartmentId: compId,
              customerId: currentOrder.customerId || '',
              targetRole: 'CUSTOMER',
            }
          );

          // Notification for driver (Requirement 2 & 17.D)
          await notificationService.notify(
            'انتهت مهلة الإيداع',
            'انتهت مهلة الإيداع ولم يتم تسجيل إيداع الشحنة.\nتم قفل الصندوق تلقائيًا. يمكنك طلب إذن فتح جديد.',
            'SECURITY',
            {
              orderId,
              smartBoxId: boxId,
              compartmentId: compId,
              driverId: currentOrder.driverId || '',
              targetRole: 'DRIVER',
            }
          );
        }
      }

      await refreshOrdersFromService();
      refreshAuditAndSecurity();
    } finally {
      expiringOrderIdsRef.current.delete(orderId);
    }
  };

  const driverCompleteDelivery = async (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('الطلب غير موجود');

    // FIX 8 — FINAL COMPLETION GUARDS
    // 1. Order status must be SMART_BOX_SECURED
    if (ord.status !== 'SMART_BOX_SECURED') {
      throw new Error('لا يمكن إتمام التسليم: يجب تأمين وقفل الصندوق الذكي أولاً.');
    }

    // 2. PACKAGE_DEPOSITED evidence exists
    const hasWeightDeposit = hardwareSim.weightKg > 0;
    const orderEvents = await auditService.getEventsForOrder(orderId);
    const hasDepositAudit = orderEvents.some(
      (e: AuditLog) => e.action === 'PACKAGE_DEPOSITED' && e.result === 'SUCCESS'
    );
    if (!hasWeightDeposit && !hasDepositAudit && !ord.proofOfDelivery) {
      throw new Error('لا يمكن إتمام التسليم قبل تسجيل إيداع الشحنة.');
    }

    const currentDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;
    if (!currentDriverId) {
      throw new Error('لا يمكن إتمام التسليم: لم يتم التحقق من هوية المندوب.');
    }
    if (ord.driverId && ord.driverId !== currentDriverId) {
      throw new Error('لا يمكن إتمام التسليم: الطلب غير مسند لهذا المندوب.');
    }

    const candidateAuths = authorizations.filter(
      (a) =>
        a.orderId === orderId &&
        (a.status === 'ACTIVE' || (a.status === 'USED' && a.otpValidated)) &&
        (!a.driverId || a.driverId === currentDriverId) &&
        (!ord.customerId || a.customerId === ord.customerId) &&
        (!ord.smartBoxId || a.smartBoxId === ord.smartBoxId) &&
        (!ord.compartmentId || a.compartmentId === ord.compartmentId) &&
        a.otpValidated === true
    );
    const currentAuth = candidateAuths.sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];
    if (!currentAuth) {
      throw new Error('لا يمكن إتمام التسليم: لا يوجد تصريح وصول صالح وموثق برمز OTP لدورة التسليم الحالية.');
    }

    // 4. Door is closed
    const doorStatus = await smartLockService.getDoorStatus(ord.smartBoxId || 'BOX-102', ord.compartmentId || '01');
    if (!doorStatus.isClosed || !hardwareSim.isDoorClosed) {
      throw new Error('الصندوق الذكي غير مقفل! يرجى إحكام إغلاقه قبل إتمام التسليم.');
    }

    // 5. Smart Box is locked/secured
    const lockStatus = await smartLockService.getLockStatus(ord.smartBoxId || 'BOX-102', ord.compartmentId || '01');
    if (!lockStatus.isLocked || !hardwareSim.isSolenoidLocked) {
      throw new Error('الصندوق الذكي غير مقفل! يرجى إحكام إغلاقه قبل إتمام التسليم.');
    }

    const boxId = ord.smartBoxId || 'BOX-102';
    const compId = ord.compartmentId || '01';

    // 6. POD capture / verification
    const pod = ord.proofOfDelivery || (await cameraService.captureProofOfDelivery(boxId, compId, orderId));

    await orderService.updateOrderStatus(
      orderId,
      'COMPLETED',
      'DRIVER',
      currentDriverId,
      ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب'),
      {
        proofOfDelivery: pod,
        proofOfDeliverySentToMerchant: true,
        proofOfDeliverySentToCustomer: true,
      }
    );
    await refreshOrdersFromService();

    // FIX 3: Complete access and mark ONLY the current authorization as USED (do NOT modify old expired authorizations)
    await authorizationService.completeAccess(orderId, currentAuth.id);
    setAuthorizations((prev) =>
      prev.map((a) =>
        a.id === currentAuth.id
          ? {
              ...a,
              status: 'USED',
              isOtpConsumed: true,
              usedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            }
          : a
      )
    );

    // Release compartment reservation upon successful completion
    await smartBoxService.releaseCompartment(boxId, compId);
    setBoxes(smartBoxService.getAllBoxesSync());

    await auditService.recordEvent({
      actor: ord.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب الميداني'),
      actorRole: 'DRIVER',
      orderId,
      smartBoxId: boxId,
      compartmentId: compId,
      action: 'DELIVERY_COMPLETED',
      result: 'SUCCESS',
      details: `اكتملت دورة التسليم بنجاح مع توثيق POD وحفظ البصمة الرقمية ${pod.hash}`,
    });

    await notificationService.notify(
      'اكتمل التوصيل بنجاح',
      `تم إيداع وتأمين الطلب #${orderId} في الصندوق الذكي ${boxId} بالحجيرة ${compId}.`,
      'DELIVERY',
      { orderId, smartBoxId: boxId }
    );

    setDriverStep(5);
    refreshAuditAndSecurity();
  };

  const driverFailDelivery = async (orderId: string, reason?: string) => {
    const ord = orders.find((o) => o.id === orderId);
    const driverId = currentUser?.role === 'DRIVER' ? currentUser.id : (ord?.driverId || '');
    await orderService.updateOrderStatus(
      orderId,
      'DELIVERY_FAILED',
      'DRIVER',
      driverId,
      ord?.driverName || (currentUser?.role === 'DRIVER' ? currentUser.name : 'المندوب'),
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
        switchDemoRole('CUSTOMER');
        await orderService.updateOrderStatus(demoId, 'PENDING', 'ADMIN');
        setRole('CUSTOMER');
        setCustomerView('TRACKING');
        break;
      case 2: // Order placed, Merchant receives PENDING
        switchDemoRole('MERCHANT');
        setRole('MERCHANT');
        setMerchantView('DASHBOARD');
        break;
      case 3: // Merchant accepts (ACCEPTED)
        switchDemoRole('MERCHANT');
        await acceptOrder(demoId);
        setRole('MERCHANT');
        break;
      case 4: // Merchant prepares (PREPARING)
        switchDemoRole('MERCHANT');
        await markOrderPreparing(demoId);
        setRole('MERCHANT');
        break;
      case 5: // Merchant makes ready (READY) & assigns to driver (ASSIGNED_TO_DRIVER)
        // Strict Security Rule: Never generate OTP or authorization when driver is assigned or merchant marks ready.
        switchDemoRole('MERCHANT');
        await markOrderReady(demoId);
        await assignOrderToDriver(demoId, 'drv-1');
        setRole('MERCHANT');
        break;
      case 6: // Driver in transit (PICKED_UP -> OUT_FOR_DELIVERY)
        switchDemoRole('DRIVER');
        await driverPickupOrder(demoId);
        await driverStartDelivery(demoId);
        setRole('DRIVER');
        setDriverStep(1);
        break;
      case 7: // Driver arrives at box (DRIVER_ARRIVED)
        switchDemoRole('DRIVER');
        await driverArriveAtBox(demoId);
        switchDemoRole('CUSTOMER');
        setRole('CUSTOMER');
        setCustomerView('TRACKING');
        break;
      case 8: // Customer authorizes access (ACCESS_AUTHORIZED) - 5-min Driver Authorization created & in-app push notification dispatched
        switchDemoRole('CUSTOMER');
        await customerAuthorizeAccess(demoId);
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        setDriverStep(3);
        break;
      case 9: // Driver receives in-app push notification & opens authorization card
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        setDriverStep(3);
        break;
      case 10: // Driver opens Smart Box (SMART_BOX_OPENED) & 5-min Access Session starts
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        await driverOpenBox(demoId);
        setDriverStep(4);
        break;
      case 11: // Package deposited + weight detected (PACKAGE_DEPOSITED)
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        await driverDepositPackage(demoId, 1.4);
        setDriverStep(4);
        break;
      case 12: // Driver secures box: door closed & solenoid locked (SMART_BOX_SECURED)
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        await driverSecureBox(demoId);
        setDriverStep(4);
        break;
      case 13: // Delivery completes: authorization becomes USED (COMPLETED)
        switchDemoRole('DRIVER');
        setRole('DRIVER');
        await driverCompleteDelivery(demoId);
        setDriverStep(5);
        break;
      case 14: // Customer views notification & tracking (COMPLETED)
        switchDemoRole('CUSTOMER');
        setRole('CUSTOMER');
        setCustomerView('TRACKING');
        break;
      case 15: // Admin inspects complete audit trail & security center
        switchDemoRole('ADMIN');
        setRole('ADMIN');
        setAdminView('AUDIT');
        break;
      default:
        break;
    }
  };

  const resetDemoWorkflow = async () => {
    clearAllDemoStorage();
    switchDemoRole('CUSTOMER');
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

    setAccessSession(null);
    saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, null);

    setHardwareSim(DEFAULT_HARDWARE_SIM);
    saveToStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, DEFAULT_HARDWARE_SIM);
    saveToStorage(DEMO_STORAGE_KEYS.DEMO_STEP, 1);
    saveToStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, 1);
    saveToStorage(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, 'TW-1001');
  };

  const cleanupUnfinishedDemoOrders = async (): Promise<{
    success: boolean;
    removedCount: number;
    message: string;
  }> => {
    const currentOrders = orderService.getAllOrdersSync();
    const unfinished = currentOrders.filter((o) => o.status !== 'COMPLETED');

    if (unfinished.length === 0) {
      const emptyMsg = 'لا توجد طلبات غير مكتملة.';
      await notificationService.notify('تنظيف الطلبات التجريبية', emptyMsg, 'SYSTEM');
      setNotifications(notificationService.getNotificationsSync());
      return {
        success: false,
        removedCount: 0,
        message: emptyMsg,
      };
    }

    const removedOrderIds = unfinished.map((o) => o.id);

    // 2. Mark those orders as CANCELLED first where appropriate for audit/state consistency
    unfinished.forEach((order) => {
      auditService.recordEvent({
        actor: 'نظام التجربة (Demo Cleanup)',
        actorRole: 'ADMIN',
        orderId: order.id,
        smartBoxId: order.smartBoxId || 'BOX-102',
        action: 'ORDER_CANCELLED',
        result: 'SUCCESS',
        details: 'إلغاء وتنظيف طلب تجريبي غير مكتمل لإفساح المجال لاختبار جديد',
      });
    });

    // 3 & 4. Remove unfinished/cancelled Demo orders and keep COMPLETED orders untouched
    const cleanupResult = orderService.cleanupUnfinishedOrders();
    setOrders([...cleanupResult.remainingOrders]);

    // 5. Clean related Demo-only state for removed orders:
    // - temporary authorizations & delivery authorization state
    const remainingAuths = authorizationService.removeAuthorizationsForOrders(removedOrderIds);
    setAuthorizations([...remainingAuths]);

    // - release reserved compartments in smart boxes for cancelled/removed orders
    const updatedBoxes = smartBoxService.releaseCompartmentsForOrders(removedOrderIds);
    setBoxes([...updatedBoxes]);

    // - active Smart Box Access Sessions
    if (accessSession && removedOrderIds.includes(accessSession.orderId)) {
      setAccessSession(null);
      saveToStorage(DEMO_STORAGE_KEYS.ACCESS_SESSION, null);
    }

    // - Driver & Customer notifications related to those orders
    const remainingNotifs = notificationService.removeNotificationsForOrders(removedOrderIds);
    setNotifications([...remainingNotifs]);

    // 6. If the current active order is removed: set activeOrderId = null
    if (activeOrderId && removedOrderIds.includes(activeOrderId)) {
      setActiveOrderId(null);
      saveToStorage(DEMO_STORAGE_KEYS.ACTIVE_ORDER_ID, null);
      setDriverStep(1);
      saveToStorage(DEMO_STORAGE_KEYS.DRIVER_STEP, 1);
    }

    // Reset hardware sim sensors if box was left open during the abandoned test
    if (!hardwareSim.isSolenoidLocked || !hardwareSim.isDoorClosed || hardwareSim.weightKg > 0) {
      setHardwareSim(DEFAULT_HARDWARE_SIM);
      saveToStorage(DEMO_STORAGE_KEYS.HARDWARE_SIM, DEFAULT_HARDWARE_SIM);
    }

    // 11. Show success notification
    const successMsg = 'تم تنظيف الطلبات غير المكتملة بنجاح.\nيمكنك الآن إنشاء طلب جديد للاختبار.';
    await notificationService.notify('تنظيف الطلبات التجريبية', successMsg, 'SYSTEM');
    setNotifications(notificationService.getNotificationsSync());

    return {
      success: true,
      removedCount: removedOrderIds.length,
      message: successMsg,
    };
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
        activeOrderId,
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
        createOrderForMerchant,
        merchantDrafts,
        saveMerchantDraft,
        getMerchantDraft,
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
        customerRejectAccess,
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
        accessSession,
        driverExpireAccessSession,
        updateOrderStatus,
        markNotificationRead,
        markAllNotificationsRead,
        cleanupUnfinishedDemoOrders,
        refreshOrdersFromService,
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
