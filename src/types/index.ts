/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActorRole = 'CUSTOMER' | 'MERCHANT' | 'DRIVER' | 'ADMIN';

export type OrderType = 'INTERNAL_ORDER' | 'EXTERNAL_ORDER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED_TO_DRIVER'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DRIVER_ARRIVED'
  | 'ACCESS_AUTHORIZED'
  | 'OTP_VALIDATED'
  | 'SMART_BOX_OPENED'
  | 'PACKAGE_DEPOSITED'
  | 'SMART_BOX_SECURED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DELIVERY_FAILED';

export type AuthorizationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'USED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'DENIED';

export type CompartmentSize = 'S' | 'M' | 'L' | 'XL';

export type CompartmentStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specs?: string;
  image?: string;
}

export interface Compartment {
  id: string; // '01', '02', '03', '04'
  name: string;
  size: CompartmentSize;
  status: CompartmentStatus;
  currentOrderId?: string;
  currentWeightKg: number;
  targetWeightKg?: number;
  isSolenoidLocked: boolean;
  isDoorClosed: boolean;
  temperature?: number;
}

export interface SmartBox {
  id: string; // 'BOX-102', 'BOX-219', 'BOX-408', 'BOX-088'
  name: string;
  location: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  connectionType: string; // '4G/Wi-Fi', 'FTTH Gateway', 'LTE Backup'
  batteryLevel: number;
  temperature: number;
  voltage: string;
  isLocked: boolean;
  isDoorOpen: boolean;
  isTampered: boolean;
  tamperAlertsCount: number;
  compartments: Compartment[];
  ownerId: string;
  ownerName: string;
  firmwareVersion: string;
  lastHeartbeat: string;
  isGeofenceEnabled: boolean;
  isCamera2KEnabled: boolean;
  isWeightAlarmEnabled: boolean;
}

export interface TemporaryAccessAuthorization {
  id: string;
  customerId: string;
  customerName: string;
  orderId: string;
  driverId?: string;
  driverName?: string;
  smartBoxId: string;
  compartmentId: string;
  otp: string;
  status: AuthorizationStatus;
  createdAt: string;
  expiresAt: string;
  expiresAtTimestamp?: number;
  usedAt?: string;
  isGeofenceRequired: boolean;
  isCameraPODRequired: boolean;
  isLoadCellVerified: boolean;
  geofenceRadiusMeters: number;
  delegationType: 'DELIVERY' | 'FAMILY' | 'VISITOR';
  otpValidated?: boolean;
  otpValidatedAt?: string;
  isOtpConsumed?: boolean;
}

export type AuditAction =
  | 'ORDER_CREATED'
  | 'ORDER_ACCEPTED'
  | 'ORDER_PREPARING'
  | 'ORDER_PREPARED'
  | 'ORDER_READY'
  | 'DRIVER_ASSIGNED'
  | 'ORDER_ASSIGNED'
  | 'ORDER_PICKED_UP'
  | 'DRIVER_OUT_FOR_DELIVERY'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_CANCELLED'
  | 'ORDER_REJECTED'
  | 'DRIVER_ARRIVED'
  | 'ACCESS_REQUESTED'
  | 'ACCESS_GRANTED'
  | 'AUTHORIZATION_CREATED'
  | 'OTP_GENERATED'
  | 'OTP_VALIDATED'
  | 'SMART_BOX_UNLOCKED'
  | 'BOX_UNLOCKED'
  | 'DOOR_OPENED'
  | 'PACKAGE_DEPOSITED'
  | 'DOOR_CLOSED'
  | 'SMART_BOX_LOCKED'
  | 'BOX_LOCKED'
  | 'DELIVERY_COMPLETED'
  | 'DELIVERY_FAILED'
  | 'ACCESS_DENIED'
  | 'OTP_EXPIRED'
  | 'TAMPER_DETECTED'
  | 'EMERGENCY_LOCKDOWN';

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: ActorRole;
  orderId?: string;
  smartBoxId: string;
  compartmentId?: string;
  action: AuditAction;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'ALERT';
  digitalHash: string;
  details: string;
}

export interface SecurityEvent {
  id: string;
  incidentCode: string; // INC-9824#, INC-9821#
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  smartBoxId: string;
  compartmentId?: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
  actionTaken?: string;
  sensorAnomaly?: string;
  location: string;
}

export interface ProofOfDelivery {
  photoUrl: string;
  weightKg: number;
  hash: string;
  timestamp: string;
  sensorAudit: {
    solenoidEngaged: boolean;
    reedSwitchClosed: boolean;
    weightDeltaKg: number;
  };
}

export interface ExternalOrderDetails {
  externalMerchant: string;
  awbNumber: string;
  notes?: string;
  approximateValue?: number;
  expectedDate?: string;
  courierName?: string;
  courierPhone?: string;
}

export interface Order {
  id: string; // 'TW-8921'
  orderNumber?: string;
  orderType: OrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId?: string; // Optional for EXTERNAL_ORDER
  merchantName?: string;
  merchantBranch?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  smartBoxId: string;
  compartmentId: string;
  compartmentSize: CompartmentSize;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedArrival?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  completedAt?: string;
  proofOfDelivery?: ProofOfDelivery;
  authorizationId?: string;
  accessAuthorizationId?: string;
  externalDetails?: ExternalOrderDetails;
  customerConfirmed?: boolean;
  merchantConfirmed?: boolean;
  customerConfirmedAt?: string;
  merchantConfirmedAt?: string;
  confirmedAt?: string;
  proofOfDeliverySentToMerchant?: boolean;
  proofOfDeliverySentToCustomer?: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  businessName: string;
  ownerName: string;
  category: string;
  rating: number;
  address: string;
  phone: string;
  phoneNumbers: string[];
  deliveryAvailable: boolean;
  workingHours: string;
  isOpen: boolean;
  storePhotos: string[];
  shelfPhotos: string[];
  featurePhotos: string[];
  ownerPhoto: string;
  menuPhotos: string[];
  todaySales?: number;
  todayCompletedOrders?: number;
  avgPrepTimeMinutes?: number;
  webhookStatus?: string;
  webhookLatencyMs?: number;
}

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'HANDWRITTEN_ORDER'
  | 'SYSTEM'
  | 'PROOF_OF_DELIVERY';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: ActorRole;
  messageType: MessageType;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  customerName?: string;
  merchantId: string;
  merchantName?: string;
  orderId?: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  code: string; // 'C-4091', 'C-3820'
  phone: string;
  vehicle: string;
  rating: number;
  status: 'AVAILABLE' | 'ON_DUTY' | 'DELIVERING' | 'OFFLINE';
  currentLocation: {
    lat: number;
    lng: number;
    description: string;
  };
  assignedOrdersCount: number;
  completedTodayCount: number;
  todayEarnings: number;
  batteryPct?: number;
  speedKmh?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'ORDER' | 'SECURITY' | 'DELIVERY' | 'SYSTEM';
  orderId?: string;
  smartBoxId?: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  category: string;
  price: number;
  specs?: string;
  image?: string;
  compartmentSize: CompartmentSize;
  description: string;
  inStock: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: ActorRole;
  phone?: string;
  title?: string;
  details?: string;
  avatarUrl?: string;
}

export type CustomerView =
  | 'HOME'
  | 'STORE'
  | 'CHECKOUT'
  | 'TRACKING'
  | 'BOXES'
  | 'EXTERNAL_ORDER'
  | 'MERCHANT_LIST'
  | 'MERCHANT_PROFILE'
  | 'CHAT'
  | 'ORDERS'
  | 'ORDER_DETAILS'
  | 'ACCOUNT';
