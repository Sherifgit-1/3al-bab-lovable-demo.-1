/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SmartBox,
  Compartment,
  TemporaryAccessAuthorization,
  AuditLog,
  SecurityEvent,
  ProofOfDelivery,
  ActorRole,
  AuditAction,
  Order,
  OrderStatus,
  OrderItem,
  CompartmentSize,
  OrderType,
  ExternalOrderDetails,
} from '../types';

export interface LockStateResult {
  isLocked: boolean;
  solenoidStatus: 'ENGAGED' | 'DISENGAGED';
  timestamp: string;
}

export interface DoorStateResult {
  isClosed: boolean;
  angleDegrees: number;
  reedSwitchStatus: 'CLOSED_100%' | 'OPEN';
  timestamp: string;
}

export interface BatteryStateResult {
  levelPct: number;
  voltage: string;
  isCharging: boolean;
}

export interface TamperStateResult {
  isTampered: boolean;
  vibrationG: number;
  lastTamperTime?: string;
  alertsCount: number;
}

/**
 * Hardware abstraction for smart locks and mechanical latches
 */
export interface ISmartLockService {
  unlock(boxId: string, compartmentId: string): Promise<{ success: boolean; message: string }>;
  lock(boxId: string, compartmentId: string): Promise<{ success: boolean; message: string }>;
  getLockStatus(boxId: string, compartmentId?: string): Promise<LockStateResult>;
  getDoorStatus(boxId: string, compartmentId?: string): Promise<DoorStateResult>;
  getBatteryStatus(boxId: string): Promise<BatteryStateResult>;
  getTamperStatus(boxId: string): Promise<TamperStateResult>;
  triggerTamperAlarm(boxId: string, severity: 'HIGH' | 'CRITICAL'): Promise<void>;
  resetTamper(boxId: string): Promise<void>;
}

/**
 * Smart Box management service
 */
export interface ISmartBoxService {
  getBox(boxId: string): Promise<SmartBox | undefined>;
  getAllBoxes(): Promise<SmartBox[]>;
  getCompartments(boxId: string): Promise<Compartment[]>;
  reserveCompartment(boxId: string, compartmentId: string, orderId: string): Promise<boolean>;
  releaseCompartment(boxId: string, compartmentId: string): Promise<boolean>;
  releaseCompartmentsForOrders(orderIds: string[]): SmartBox[];
  reconcileWithOrders(activeOrderIds: string[]): SmartBox[];
  updateWeight(boxId: string, compartmentId: string, weightKg: number): Promise<void>;
  simulatePhysicalCycle(boxId: string, compartmentId: string, packageWeightKg: number, orderId?: string): Promise<void>;
  secureCompartment(boxId: string, compartmentId: string): Promise<void>;
  validateCompartmentAccess(boxId: string, compartmentId: string, orderId: string): Promise<{ valid: boolean; reason?: string }>;
}

/**
 * Optical camera and AI verification service
 */
export interface ICameraService {
  captureProofOfDelivery(boxId: string, compartmentId: string, orderId: string): Promise<ProofOfDelivery>;
  getLiveSnapshot(boxId: string): Promise<string>;
  getSecurityIncidentSnapshot(incidentCode: string): Promise<string>;
}

/**
 * Secure Temporary Access and Multi-Party Authorization Service
 */
export interface ValidateAccessParams {
  customerId: string;
  orderId: string;
  driverId: string;
  smartBoxId: string;
  compartmentId: string;
  otp?: string;
  authId?: string;
  currentCoordinates?: { lat: number; lng: number };
}

export interface ValidationResult {
  granted: boolean;
  reason?: string;
  authorization?: TemporaryAccessAuthorization;
  errorCode?:
    | 'INVALID_ORDER'
    | 'INVALID_CUSTOMER'
    | 'INVALID_DRIVER'
    | 'INVALID_BOX'
    | 'INVALID_COMPARTMENT'
    | 'INVALID_STATUS'
    | 'INVALID_OTP'
    | 'EXPIRED'
    | 'REVOKED'
    | 'OUTSIDE_GEOFENCE';
}

export interface IAuthorizationService {
  createAuthorization(params: {
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
  }): Promise<TemporaryAccessAuthorization>;

  validateAccess(params: ValidateAccessParams): Promise<ValidationResult>;
  generateOTPForEligibleDelivery(orderId: string, driverId: string): Promise<string | null>;
  revokeAuthorization(authId: string, reason: string): Promise<boolean>;
  getAuthorizationByOrder(
    orderId: string,
    criteria?: { customerId?: string; driverId?: string; smartBoxId?: string; compartmentId?: string; }
  ): Promise<TemporaryAccessAuthorization | undefined>;
  getAuthorizationsForBox(boxId: string): Promise<TemporaryAccessAuthorization[]>;
  completeAccess(
    orderId: string,
    authId?: string,
    criteria?: { customerId?: string; driverId?: string; smartBoxId?: string; compartmentId?: string; }
  ): Promise<boolean>;
  isAccessAuthorized(boxId: string, compartmentId: string, orderId: string, driverId?: string): Promise<boolean>;
}

/**
 * Audit Trail & Security Event Logger (Hash-chained / Immutable-like)
 */
export interface IAuditService {
  recordEvent(params: {
    actor: string;
    actorRole: ActorRole;
    orderId?: string;
    smartBoxId: string;
    compartmentId?: string;
    action: AuditAction;
    result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'ALERT';
    details: string;
  }): Promise<AuditLog>;

  recordSecurityIncident(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getEventsForOrder(orderId: string): Promise<AuditLog[]>;
  getSecurityEvents(): Promise<SecurityEvent[]>;
  resolveSecurityEvent(id: string, actionNote: string): Promise<void>;
}

/**
 * Real-time User and Stakeholder Notification Service
 */
export interface INotificationService {
  notify(
    title: string,
    message: string,
    type: 'ORDER' | 'SECURITY' | 'DELIVERY' | 'SYSTEM',
    metadata?: {
      orderId?: string;
      smartBoxId?: string;
      driverId?: string;
      customerId?: string;
      compartmentId?: string;
      targetRole?: 'CUSTOMER' | 'DRIVER' | 'MERCHANT' | 'ADMIN';
    }
  ): Promise<void>;
  getNotifications(): Promise<any[]>;
  markAsRead(id: string): Promise<void>;
}

export interface CreateOrderParams {
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  merchantId?: string; // Optional for EXTERNAL_ORDER
  merchantName?: string;
  smartBoxId: string;
  compartmentId?: string;
  compartmentSize: CompartmentSize;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  total?: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
  orderType?: OrderType;
  externalDetails?: ExternalOrderDetails;
}

export interface IOrderService {
  getAllOrders(): Promise<Order[]>;
  getOrder(orderId: string): Promise<Order | undefined>;
  getCustomerOrders(customerId: string): Promise<Order[]>;
  getMerchantOrders(merchantId: string): Promise<Order[]>;
  getDriverOrders(driverId: string): Promise<Order[]>;
  createOrder(params: CreateOrderParams): Promise<Order>;
  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    role: ActorRole,
    actorId?: string,
    actorName?: string,
    additionalData?: Partial<Order>
  ): Promise<{ success: boolean; message: string; order?: Order }>;
  assignDriver(orderId: string, driverId: string, role: ActorRole): Promise<{ success: boolean; message: string; order?: Order }>;
  confirmOrderCustomer(orderId: string): Promise<{ success: boolean; message: string; order?: Order }>;
  confirmOrderMerchant(orderId: string): Promise<{ success: boolean; message: string; order?: Order }>;
  attachPODPhoto(orderId: string, photoUrl: string): Promise<{ success: boolean; message: string; order?: Order }>;
  sendPODToCustomer(orderId: string): Promise<{ success: boolean; message: string; order?: Order }>;
  cancelOrder(orderId: string, role: ActorRole, reason?: string): Promise<{ success: boolean; message: string; order?: Order }>;
  rejectOrder(orderId: string, role: ActorRole, reason?: string): Promise<{ success: boolean; message: string; order?: Order }>;
  subscribe(listener: (orders: Order[]) => void): () => void;
}

