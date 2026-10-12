/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  Package,
  Truck,
  Box,
  Store,
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  Camera,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  User,
  Phone,
  Check,
  XCircle,
  Lock,
} from 'lucide-react';

export const CustomerOrderDetails: React.FC = () => {
  const {
    activeOrderId,
    orders,
    setActiveOrderId,
    setCustomerView,
    openMerchantChat,
    customerAuthorizeAccess,
    customerRejectAccess,
    authorizations,
  } = useApp();

  const { currentUser } = useAuth();
  const currentCustomerId = currentUser?.role === 'CUSTOMER' ? currentUser.id : currentUser?.id;

  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [rejectNotice, setRejectNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Resolve the order strictly from the selected order in navigation/state (activeOrderId).
  // Strictly enforce customer ownership.
  const rawOrder = activeOrderId ? orders.find((o) => o.id === activeOrderId) || null : null;
  const order = rawOrder && currentCustomerId && rawOrder.customerId === currentCustomerId ? rawOrder : null;

  if (!order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center rounded-3xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
          <Package className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white font-['Cairo']">لا يوجد طلب محدد حالياً</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          لم يتم تحديد طلب لعرض تفاصيله، أو قد يكون الطلب تم إلغاؤه أو إزالته. يمكنك تصفح طلباتك واختيار أي طلب لعرض تفاصيله الكاملة.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setCustomerView('ORDERS')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            العودة إلى طلباتي
          </button>
        </div>
      </div>
    );
  }

  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Strict match on active authorization (Section 15)
  const activeAuth = authorizations
    .filter(
      (a) =>
        a.orderId === order.id &&
        a.status === 'ACTIVE' &&
        (!a.expiresAtTimestamp || a.expiresAtTimestamp > nowMs) &&
        !a.usedAt
    )
    .sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];

  const pendingAuth = authorizations
    .filter((a) => a.orderId === order.id && a.status === 'PENDING')
    .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];

  const expiredAuth = authorizations
    .filter((a) => a.orderId === order.id && a.status === 'EXPIRED')
    .sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0];

  const rejectedAuth = authorizations
    .filter((a) => a.orderId === order.id && a.status === 'REJECTED')
    .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];

  const remainingSeconds = activeAuth?.expiresAtTimestamp
    ? Math.max(0, Math.floor((activeAuth.expiresAtTimestamp - nowMs) / 1000))
    : 0;
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedCountdown = `${timerMinutes}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;


  const handleCustomerAuthorize = async () => {
    if (order.status === 'COMPLETED') return;
    setIsAuthorizing(true);
    setAuthError(null);
    try {
      await customerAuthorizeAccess(order.id);
    } catch (err: any) {
      console.error('Error authorizing access in order details:', err);
      setAuthError(err?.message || 'فشل منح إذن الوصول');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCustomerReject = async () => {
    try {
      await customerRejectAccess(order.id);
      setRejectNotice('تم رفض السماح بفتح الصندوق');
    } catch (err: any) {
      setAuthError(err?.message || 'حدث خطأ أثناء رفض الطلب');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: 'قيد الانتظار', bg: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'ACCEPTED':
        return { text: 'تم قبول الطلب', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800' };
      case 'PREPARING':
        return { text: 'جاري التجهيز', bg: 'bg-blue-950/80 text-blue-300 border-blue-800' };
      case 'READY':
        return { text: 'الطلب جاهز', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800' };
      case 'ASSIGNED_TO_DRIVER':
        return { text: 'تم إسناد الطلب للمندوب', bg: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'PICKED_UP':
        return { text: 'المندوب استلم الشحنة', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800' };
      case 'OUT_FOR_DELIVERY':
        return { text: 'جاري التوصيل', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800' };
      case 'DRIVER_ARRIVED':
        return { text: 'المندوب وصل أمام الصندوق', bg: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'ACCESS_AUTHORIZED':
      case 'OTP_VALIDATED':
      case 'SMART_BOX_OPENED':
        return { text: 'جاري الإيداع بالصندوق', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'PACKAGE_DEPOSITED':
        return { text: 'تم إيداع الطرد', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'SMART_BOX_SECURED':
        return { text: 'تم تأمين الصندوق', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'COMPLETED':
        return { text: 'تم التسليم بنجاح', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800' };
      case 'CANCELLED':
        return { text: 'ملغي', bg: 'bg-rose-950/80 text-rose-300 border-rose-800' };
      case 'REJECTED':
        return { text: 'مرفوض', bg: 'bg-rose-950/80 text-rose-300 border-rose-800' };
      default:
        return { text: 'قيد المعالجة', bg: 'bg-slate-900 text-slate-300 border-slate-700' };
    }
  };

  const badge = getStatusBadge(order.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => setCustomerView('ORDERS')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى طلباتي</span>
        </button>

        <span className="font-mono text-xs text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60 font-bold">
          #{order.id}
        </span>
      </div>

      {/* Feedback Alerts */}
      {authError && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
          <button
            onClick={() => setAuthError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {rejectNotice && (
        <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{rejectNotice}</span>
          </div>
          <button
            onClick={() => setRejectNotice(null)}
            className="text-amber-400 hover:text-amber-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Order Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Header: Title, Merchant, Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">طلب رقم:</span>
              <span className="font-mono text-base font-bold text-white">#{order.id}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{order.createdAt}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
              {order.merchantName}
            </h2>
            {order.merchantBranch && (
              <p className="text-xs text-slate-400">{order.merchantBranch}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.text}
            </span>
          </div>
        </div>

        {/* Confirmation Statuses (Customer & Merchant) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">تأكيد العميل:</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                order.customerConfirmed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {order.customerConfirmed ? 'تم التأكيد ✓' : 'بانتظار التأكيد'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">تأكيد المتجر:</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                order.merchantConfirmed
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {order.merchantConfirmed ? 'تم التأكيد ✓' : 'بانتظار التأكيد'}
            </span>
          </div>
        </div>

        {/* Order Contents */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <span>محتويات الطلب:</span>
          </h3>

          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{item.name}</h4>
                  {item.specs && <p className="text-[11px] text-slate-400 mt-0.5">{item.specs}</p>}
                </div>
                <div className="text-left font-mono">
                  <span className="text-slate-400">الكمية: {item.quantity}</span>
                  <span className="text-cyan-400 font-bold block">{item.price * item.quantity} ج.م</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>المجموع الفرعي:</span>
              <span className="font-mono text-slate-200">{order.subtotal} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>رسوم التوصيل للصندوق الذكي:</span>
              <span className="font-mono text-emerald-400">0 ج.م (توصيل مجاني)</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>الإجمالي:</span>
              <span className="font-mono text-cyan-400">{order.total || order.subtotal} ج.م</span>
            </div>
          </div>
        </div>

        {/* Delivery Details: Driver & Smart Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Driver Status */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>المندوب والتوصيل:</span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p>
                المندوب: <strong className="text-white">{order.driverName || 'إسلام عامر'}</strong>
              </p>
              {order.driverPhone && (
                <p className="font-mono text-[11px] text-slate-400">هاتف: {order.driverPhone}</p>
              )}
              {order.driverVehicle && (
                <p className="text-[11px] text-slate-400">المركبة: {order.driverVehicle}</p>
              )}
            </div>
          </div>

          {/* Smart Box Status */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Box className="w-4 h-4 text-cyan-400" />
              <span>الصندوق الذكي والحجيرة:</span>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <p>
                الصندوق: <strong className="font-mono text-amber-300">{order.smartBoxId || 'BOX-102'}</strong>
              </p>
              <p>
                الحجيرة:{' '}
                <strong className="font-mono text-cyan-300">{order.compartmentId || '01'}</strong>{' '}
                (حجم {order.compartmentSize || 'M'})
              </p>
              {order.deliveryAddress && (
                <p className="text-[11px] text-slate-400 truncate">الموقع: {order.deliveryAddress}</p>
              )}
              {order.status === 'COMPLETED' && (
                <div className="pt-1.5 flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>الصندوق مغلق ومؤمّن</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Delivery (POD) when available */}
        {order.proofOfDelivery && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>إثبات التسليم الميداني الموثق (POD)</span>
            </div>

            {order.proofOfDelivery.photoUrl && (
              <div className="h-44 rounded-xl overflow-hidden bg-slate-900 border border-emerald-700/60 max-w-sm">
                <img
                  src={order.proofOfDelivery.photoUrl}
                  alt="إثبات التسليم"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-300">
              <div>وزن الطرد: {order.proofOfDelivery.weightKg} كجم</div>
              <div>التشفير: {order.proofOfDelivery.hash}</div>
              <div className="col-span-2 text-slate-400">التاريخ: {order.proofOfDelivery.timestamp}</div>
            </div>
          </div>
        )}

        {/* Security Access Authorization Card - COMPLETED State takes strict priority */}
        {order.status === 'COMPLETED' ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/60 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-white text-sm sm:text-base">تم التسليم بنجاح</h4>
              </div>
              <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
                مكتمل ومؤمّن ✓
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-inner">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-400 block">
                  تم إيداع الشحنة وتأمين الصندوق
                </span>
                <p className="text-[11px] text-slate-300">
                  تم إيداع طلبك داخل الحجيرة بنجاح، وإغلاق القفل الإلكتروني وتأمين الصندوق بالكامل.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-xs shrink-0">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>الصندوق مغلق ومؤمّن</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 font-mono">
              <span>الصندوق: <strong className="text-amber-300">{order.smartBoxId || 'BOX-102'}</strong></span>
              <span>الحجيرة: <strong className="text-cyan-300">{order.compartmentId || '01'}</strong></span>
              <span>المندوب المعتمد: <strong className="text-white">{order.driverName || 'إسلام عامر'}</strong></span>
            </div>
          </div>
        ) : activeAuth ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/50 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-white text-sm">تم السماح بفتح الصندوق (تصريح نشط)</span>
              </div>
              <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                ساري المفعول (5 دقائق)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
              <div>
                <span className="text-xs text-slate-400 block font-medium">حالة تصريح الوصول الرقمي:</span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {order.status === 'SMART_BOX_SECURED'
                    ? 'تم تأمين الصندوق'
                    : order.status === 'PACKAGE_DEPOSITED'
                    ? 'تم إيداع الطلب'
                    : order.status === 'SMART_BOX_OPENED'
                    ? 'تم فتح الصندوق'
                    : 'تم تفويض المندوب'}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تصريح رقمي مؤمن (OTP صالح لمرة واحدة)</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1">
              <span>المندوب المعتمد: <strong className="text-white">{activeAuth.driverName || 'إسلام عامر'}</strong></span>
              <span>الصندوق: <strong className="font-mono text-amber-300">{activeAuth.smartBoxId}</strong></span>
              <span>الحجيرة: <strong className="font-mono text-cyan-300">{activeAuth.compartmentId}</strong></span>
              <span>الصلاحية: <strong className="text-amber-300">5 دقائق من وقت الإذن</strong></span>
            </div>
          </div>
        ) : order.status === 'DRIVER_ARRIVED' && pendingAuth ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/80 space-y-3.5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
              <h4 className="text-sm sm:text-base font-black text-white">
                {pendingAuth.isRetry
                  ? 'المندوب يطلب إذنًا جديدًا لفتح الصندوق'
                  : 'المندوب يطلب إذن فتح الصندوق'}
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">رقم الطلب</span>
                <span className="font-mono text-white font-bold">#{order.id}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الصندوق الذكي</span>
                <span className="font-mono text-amber-300 font-bold">{order.smartBoxId || 'BOX-102'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الحجيرة</span>
                <span className="font-mono text-cyan-300 font-bold">{order.compartmentId || '01'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المندوب المعتمد</span>
                <span className="text-white font-bold truncate block">{order.driverName || 'إسلام عامر'}</span>
              </div>
            </div>

            {pendingAuth.isRetry && (
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
                <span className="text-slate-300">سبب الطلب:</span>
                <strong className="font-bold text-amber-300">انتهت مهلة الإيداع السابقة</strong>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              {pendingAuth.isRetry
                ? 'انتهت مهلة الإيداع السابقة ولم يتم إيداع الشحنة. يطلب المندوب إذن فتح جديد صالح لمدة 5 دقائق لإتمام الإيداع بأمان.'
                : `المندوب أمام الصندوق الذكي ${order.smartBoxId || 'BOX-102'} الآن. بالضغط على "السماح بالفتح"، سيتم إصدار تصريح رقمي جديد للمندوب صالح لمدة 5 دقائق لفتح الحجيرة ${order.compartmentId || '01'}.`}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                id="btn-details-authorize-access"
                onClick={handleCustomerAuthorize}
                disabled={isAuthorizing}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isAuthorizing ? 'جارٍ الاعتماد وإصدار التصريح...' : 'السماح بالفتح'}</span>
              </button>
              <button
                id="btn-details-reject-access"
                onClick={handleCustomerReject}
                className="px-6 py-3 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                رفض
              </button>
            </div>
          </div>
        ) : order.status === 'DRIVER_ARRIVED' && expiredAuth && !pendingAuth ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/70 space-y-3.5 shadow-2xl animate-in zoom-in-95 text-center sm:text-right">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <h4 className="text-sm sm:text-base font-black text-white">
                انتهت مهلة الإيداع
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              الصندوق مغلق وآمن.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-sm text-xs font-bold text-slate-200 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>الصندوق مقفول</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>الباب مغلق ✓</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold text-center">
              في انتظار طلب جديد من المندوب.
            </div>
          </div>
        ) : order.status === 'DRIVER_ARRIVED' && rejectedAuth && !pendingAuth ? (
          <div className="p-5 rounded-2xl bg-slate-900 border-2 border-rose-800/80 space-y-3 shadow-xl text-center sm:text-right">
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <h4 className="text-sm font-bold text-white">تم رفض طلب فتح الصندوق</h4>
            </div>
            <p className="text-xs text-slate-300">
              لقد قمت برفض طلب المندوب لفتح الصندوق. الصندوق مقفول ومؤمن تماماً.
            </p>
          </div>
        ) : order.status === 'DRIVER_ARRIVED' ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>المندوب وصل لموقع الصندوق الذكي</span>
            </div>
            <p className="text-slate-300">
              المندوب أمام الصندوق الذكي {order.smartBoxId || 'BOX-102'} الآن. بانتظار قيامه بإرسال طلب إذن الفتح.
            </p>
          </div>
        ) : order.status !== 'CANCELLED' && order.status !== 'REJECTED' ? (
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>إذن الوصول للصندوق:</span>
              <span className="text-slate-300">
                {order.status === 'OUT_FOR_DELIVERY' || order.status === 'PICKED_UP' || order.status === 'ASSIGNED_TO_DRIVER'
                  ? 'سيصلك تنبيه أمني للسماح بالفتح فور وصول المندوب للصندوق الذكي'
                  : 'الطلب قيد التجهيز من قبل المتجر'}
              </span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">حماية مؤتمتة</span>
          </div>
        ) : null}

        {/* Clear Action Buttons: Track Order & Open Chat */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-800">
          <button
            id="btn-details-track"
            onClick={() => {
              setActiveOrderId(order.id);
              setCustomerView('TRACKING');
            }}
            className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>متابعة الطلب</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            id="btn-details-chat"
            onClick={() => {
              if (order.merchantId) {
                openMerchantChat(order.merchantId, order.id);
              }
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>فتح المحادثة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
