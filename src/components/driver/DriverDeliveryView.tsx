/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import {
  Truck,
  MapPin,
  Navigation,
  Compass,
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  Unlock,
  Scale,
  Camera,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Radio,
  Coins,
  ChevronLeft,
  Smartphone,
  Wifi,
  Package,
  Layers,
  XCircle,
} from 'lucide-react';

export const DriverDeliveryView: React.FC = () => {
  const { currentUser } = useAuth();
  const currentDriverId = currentUser?.role === 'DRIVER' ? currentUser.id : currentUser?.id;

  const {
    orders,
    activeOrder,
    setActiveOrderId,
    driverStep,
    setDriverStep,
    driverPickupOrder,
    driverStartDelivery,
    driverArriveAtBox,
    driverRequestAccess,
    driverSubmitOTP,
    driverOpenBox,
    driverDepositPackage,
    driverSecureBox,
    driverExpireAccessSession,
    driverCompleteDelivery,
    hardwareSim,
    authorizations,
    accessSession,
  } = useApp();

  const [otpInput, setOtpInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingAuthSeconds, setRemainingAuthSeconds] = useState<number>(300);

  const [justCompletedOrder, setJustCompletedOrder] = useState<Order | null>(null);

  const ACTIVE_DRIVER_STATUSES: OrderStatus[] = [
    'ASSIGNED_TO_DRIVER',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DRIVER_ARRIVED',
    'ACCESS_AUTHORIZED',
    'OTP_VALIDATED',
    'SMART_BOX_OPENED',
    'PACKAGE_DEPOSITED',
    'SMART_BOX_SECURED',
  ];

  const TERMINAL_STATUSES: OrderStatus[] = [
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
    'DELIVERY_FAILED',
  ];

  // Orders visible to the driver: strictly actionable active orders assigned to the driver
  // COMPLETED, CANCELLED, REJECTED, and DELIVERY_FAILED must NEVER appear in the active assigned list
  const driverOrders = currentDriverId
    ? orders.filter(
        (o) =>
          ACTIVE_DRIVER_STATUSES.includes(o.status) &&
          !TERMINAL_STATUSES.includes(o.status) &&
          (o.driverId === currentDriverId || (!o.driverId && o.status === 'ASSIGNED_TO_DRIVER'))
      )
    : [];

  // Current order resolution:
  // If in step 5 showing the just completed order, display it
  // Otherwise, strictly select the explicitly selected active order if it belongs to current driver
  // NEVER automatically fallback to first driver order or any unrelated/completed order
  const currentOrder: Order | null =
    (driverStep === 5 && justCompletedOrder ? justCompletedOrder : null) ||
    (activeOrder &&
    ACTIVE_DRIVER_STATUSES.includes(activeOrder.status) &&
    !TERMINAL_STATUSES.includes(activeOrder.status) &&
    (activeOrder.driverId === currentDriverId || (!activeOrder.driverId && activeOrder.status === 'ASSIGNED_TO_DRIVER'))
      ? driverOrders.find((o) => o.id === activeOrder.id) || null
      : null);

  const [nowMs, setNowMs] = React.useState<number>(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAuth =
    currentOrder && currentOrder.status !== 'COMPLETED'
      ? authorizations
          .filter(
            (a) =>
              a.orderId === currentOrder.id &&
              a.status === 'ACTIVE' &&
              (!a.expiresAtTimestamp || a.expiresAtTimestamp > nowMs) &&
              (!a.driverId || !currentOrder.driverId || a.driverId === currentOrder.driverId || a.driverId === currentDriverId) &&
              (!currentOrder.customerId || a.customerId === currentOrder.customerId) &&
              (!currentOrder.smartBoxId || a.smartBoxId === currentOrder.smartBoxId) &&
              (!currentOrder.compartmentId || a.compartmentId === currentOrder.compartmentId) &&
              !a.usedAt
          )
          .sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0]
      : undefined;

  const pendingAuth =
    currentOrder && currentOrder.status !== 'COMPLETED'
      ? authorizations
          .filter(
            (a) =>
              a.orderId === currentOrder.id &&
              a.status === 'PENDING' &&
              (!a.driverId || !currentOrder.driverId || a.driverId === currentOrder.driverId || a.driverId === currentDriverId) &&
              (!currentOrder.customerId || a.customerId === currentOrder.customerId) &&
              (!currentOrder.smartBoxId || a.smartBoxId === currentOrder.smartBoxId) &&
              (!currentOrder.compartmentId || a.compartmentId === currentOrder.compartmentId)
          )
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]
      : undefined;

  const expiredAuth =
    currentOrder && currentOrder.status !== 'COMPLETED'
      ? authorizations
          .filter(
            (a) =>
              a.orderId === currentOrder.id &&
              (a.status === 'EXPIRED' ||
                (a.status === 'ACTIVE' && a.expiresAtTimestamp && a.expiresAtTimestamp <= nowMs)) &&
              (!a.driverId || !currentOrder.driverId || a.driverId === currentOrder.driverId || a.driverId === currentDriverId)
          )
          .sort((x, y) => (y.expiresAtTimestamp || 0) - (x.expiresAtTimestamp || 0))[0]
      : undefined;

  const rejectedAuth =
    currentOrder && currentOrder.status !== 'COMPLETED'
      ? authorizations
          .filter(
            (a) =>
              a.orderId === currentOrder.id &&
              a.status === 'REJECTED' &&
              (!a.driverId || !currentOrder.driverId || a.driverId === currentOrder.driverId || a.driverId === currentDriverId)
          )
          .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]
      : undefined;

  // Auto-sync OTP input when a new active authorization is issued
  React.useEffect(() => {
    if (activeAuth?.otp) {
      setOtpInput(activeAuth.otp);
    }
  }, [activeAuth?.otp, activeAuth?.id]);

  // Countdown timer for active driver authorization (5 minutes window)
  React.useEffect(() => {
    if (!activeAuth || !currentOrder || activeAuth.status !== 'ACTIVE') {
      setRemainingAuthSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const expiresAt = activeAuth.expiresAtTimestamp || (Date.now() + 5 * 60 * 1000);
      const diff = Math.floor((expiresAt - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingAuthSeconds(0);
        // CRITICAL: Authorization window expired before box was opened -> Trigger timeout cycle!
        driverExpireAccessSession(currentOrder.id);
      } else {
        setRemainingAuthSeconds(diff);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeAuth?.id, activeAuth?.expiresAtTimestamp, activeAuth?.status, currentOrder?.id]);

  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState<number>(300);

  // Check if box is currently open in active access session
  const isAccessSessionActive = Boolean(
    currentOrder &&
    (currentOrder.status === 'SMART_BOX_OPENED' || currentOrder.status === 'PACKAGE_DEPOSITED') &&
    accessSession?.status === 'ACTIVE' &&
    accessSession?.orderId === currentOrder.id
  );

  // Authorization or access session expired before package was deposited
  const isTimeoutExpired = Boolean(
    currentOrder &&
    currentOrder.status !== 'PACKAGE_DEPOSITED' &&
    currentOrder.status !== 'SMART_BOX_SECURED' &&
    currentOrder.status !== 'COMPLETED' &&
    !activeAuth &&
    !pendingAuth &&
    (expiredAuth || (accessSession?.status === 'EXPIRED' && accessSession?.orderId === currentOrder.id))
  );

  // Countdown timer for 5-minute Smart Box Access Session (stops when box is secured, auto-expires when reaches 00:00)
  React.useEffect(() => {
    if (!isAccessSessionActive || !accessSession?.expiresAt || !currentOrder?.id) {
      return;
    }
    const updateSessionCountdown = () => {
      const now = Date.now();
      const diff = Math.floor((accessSession.expiresAt - now) / 1000);
      if (diff <= 0) {
        setRemainingSessionSeconds(0);
        // CRITICAL: Execute Access Session expiration handler automatically!
        driverExpireAccessSession(currentOrder.id);
      } else {
        setRemainingSessionSeconds(diff);
      }
    };
    updateSessionCountdown();
    const interval = setInterval(updateSessionCountdown, 1000);
    return () => clearInterval(interval);
  }, [isAccessSessionActive, accessSession?.expiresAt, currentOrder?.id]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-sync driverStep to match currentOrder.status on load / status change
  React.useEffect(() => {
    if (!currentOrder) return;
    if (currentOrder.status === 'DRIVER_ARRIVED') {
      if (activeAuth) {
        setDriverStep(3);
      } else {
        setDriverStep(2);
      }
    } else if (
      (currentOrder.status === 'ACCESS_AUTHORIZED' || currentOrder.status === 'OTP_VALIDATED') &&
      activeAuth
    ) {
      setDriverStep(3);
    } else if (
      ['SMART_BOX_OPENED', 'PACKAGE_DEPOSITED', 'SMART_BOX_SECURED'].includes(currentOrder.status) &&
      !isTimeoutExpired
    ) {
      setDriverStep(4);
    } else if (currentOrder.status === 'COMPLETED') {
      setDriverStep(5);
    }
  }, [currentOrder?.status, activeAuth?.id, isTimeoutExpired]);

  // Lifecycle Actions
  const handlePickup = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverPickupOrder(currentOrder.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل استلام الشحنة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverStartDelivery(currentOrder.id);
      setDriverStep(1);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل بدء التوصيل');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrival = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverArriveAtBox(currentOrder.id);
      setDriverStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تسجيل الوصول');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleValidateOtp = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const codeToSubmit = otpInput.trim() || activeAuth?.otp || '';
      const res = await driverSubmitOTP(currentOrder.id, codeToSubmit);
      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }
      setDriverStep(3);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل التحقق من رمز OTP');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestAccessRetry = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await driverRequestAccess(currentOrder.id, true);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل إرسال طلب تصريح فتح جديد');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenBox = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverOpenBox(currentOrder.id);
      setDriverStep(4);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل فتح الصندوق الذكي');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDepositPackage = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverDepositPackage(currentOrder.id, 1.4, activeAuth?.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل إيداع الشحنة في الحجيرة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSecureBox = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverSecureBox(currentOrder.id);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل تأمين وقفل الصندوق الذكي');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!currentOrder || currentOrder.status === 'COMPLETED') return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const orderCopy = { ...currentOrder, status: 'COMPLETED' as OrderStatus };
      setJustCompletedOrder(orderCopy);
      await driverCompleteDelivery(currentOrder.id);
      setDriverStep(5);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل توثيق وإتمام عملية التسليم');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnToAssignedOrders = () => {
    setJustCompletedOrder(null);
    setActiveOrderId(null);
    setDriverStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Delivery Header & Order Selection */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#231e13] border border-amber-900/60 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60">
                تطبيق المندوب الميداني • C-4091
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                إسلام عامر • فان كهربائية EV-04
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              {currentOrder ? `توصيل شحنة للصندوق الذكي #${currentOrder.id}` : 'لوحة مهام التوصيل الميداني'}
            </h1>
            {currentOrder && (
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                الوجهة: <span className="text-amber-300 font-bold">{currentOrder.smartBoxId}</span> •{' '}
                {currentOrder.deliveryAddress || 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس'}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 font-bold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              مكافأة التسليم: +45.00 ج.م
            </span>
            {currentOrder && (
              <div className="text-[11px] text-cyan-300 font-mono">
                حالة الطلب الحالية: <span className="font-bold underline">{currentOrder.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Orders Selector for Driver */}
        {driverOrders.length > 0 && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-800/80 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 whitespace-nowrap">الطلبات المسندة إليك:</span>
            {driverOrders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => {
                  setJustCompletedOrder(null);
                  setActiveOrderId(ord.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  ord.id === currentOrder?.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                #{ord.id} ({ord.status})
              </button>
            ))}
          </div>
        )}

        {/* Workflow Phase Stepper */}
        {currentOrder && (
          <div className="grid grid-cols-5 gap-2 pt-4 mt-4 border-t border-slate-800/80 text-center text-xs">
            {[
              { step: 1, label: 'الملاحة بالخريطة' },
              { step: 2, label: 'الوصول والسياج' },
              { step: 3, label: 'تصريح فتح الصندوق' },
              { step: 4, label: 'إيداع الطرد والوزن' },
              { step: 5, label: 'توثيق POD والمكافأة' },
            ].map((s) => {
              const effectiveStep = currentOrder.status === 'COMPLETED' ? 5 : driverStep;
              const isActive = effectiveStep === s.step;
              const isDone = effectiveStep > s.step;
              return (
                <div
                  key={s.step}
                  className={`p-2 rounded-xl border select-none transition-all ${
                    isActive
                      ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                      : isDone
                      ? 'bg-slate-950 border-emerald-700/60 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 font-mono">مرحلة {s.step}</div>
                  <div className="text-[11px] truncate">{s.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty State when no active driver order is selected or assigned */}
      {!currentOrder && (
        <div className="p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-['Cairo']">
              {driverOrders.length > 0 ? 'يرجى اختيار طلب لمتابعته' : 'لا توجد طلبات مسندة حالياً'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {driverOrders.length > 0
                ? 'لديك طلبات مسندة نشطة، يرجى اختيار أحد الطلبات من القائمة لبدء إجراءات التوصيل والتسليم.'
                : 'جميع طلبات التوصيل مكتملة أو لم يتم إسناد طلبات نشطة لك بعد. سيظهر أي طلب جديد فور إسناده من التاجر.'}
            </p>
          </div>
          {driverOrders.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {driverOrders.map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => setActiveOrderId(ord.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>بدء الطلب #{ord.id} ({ord.customerName})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PHASE 0: If Order is ASSIGNED_TO_DRIVER or PICKED_UP */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && currentOrder.status === 'ASSIGNED_TO_DRIVER' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <Package className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">طلب مسند جديد بانتظار الاستلام من المتجر</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            قام المتجر {currentOrder.merchantName} بإسناد الطلب #{currentOrder.id} إليك. يرجى التوجه للمتجر
            واستلام الطرد.
          </p>
          <button
            onClick={handlePickup}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد استلام الطرد من المتجر (PICKED_UP)</span>
          </button>
        </div>
      )}

      {currentOrder && currentOrder.status !== 'COMPLETED' && currentOrder.status === 'PICKED_UP' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-blue-400">
            <Navigation className="w-5 h-5 animate-spin" />
            <h3 className="text-base font-bold text-white">تم استلام الطرد • جاهز للانطلاق</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            تم استلام الطرد بنجاح. اضغط أدناه لبدء خط السير نحو الصندوق الذكي للعميل {currentOrder.customerName}.
          </p>
          <button
            onClick={handleStartDelivery}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>بدء خط السير والملاحة نحو الصندوق الذكي (OUT_FOR_DELIVERY)</span>
          </button>
        </div>
      )}

      {/* PHASE 1: In-transit Navigation */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && driverStep === 1 && currentOrder.status !== 'ASSIGNED_TO_DRIVER' && currentOrder.status !== 'PICKED_UP' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            {/* Navigation HUD Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">الوقت المتبقي (ETA)</span>
                <span className="font-mono text-amber-400 font-bold text-base">دقيقتان</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">المسافة للصندوق</span>
                <span className="font-mono text-cyan-400 font-bold text-base">800 متر</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">سرعة المركبة</span>
                <span className="font-mono text-white font-bold text-base">38 كم/س</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">حالة الصندوق</span>
                <span className="font-mono text-emerald-400 font-bold text-base">متصل وجاهز</span>
              </div>
            </div>

            {/* Simulated Live Road Navigation Map */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-64 sm:h-80 flex flex-col justify-between p-4">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-full h-full stroke-cyan-500/60 stroke-[3] fill-none" viewBox="0 0 400 200">
                  <path d="M 50 160 Q 150 120 220 140 T 350 50" strokeDasharray="6 6" />
                </svg>
              </div>

              {/* Map Pins */}
              <div className="relative z-10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200">
                  <Navigation className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>موقعك الحالي: شارع التسعين الشمالي</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan-950/90 border border-cyan-700 text-cyan-300 font-bold">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>الوجهة: {currentOrder.smartBoxId}</span>
                </div>
              </div>

              {/* Live Vehicle Pulse Icon */}
              <div className="relative z-10 self-center flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-amber-500/50 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/50">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">انعطف يميناً بعد 200 متر إلى شارع جنوب الأكاديمية</div>
                  <div className="text-[10px] text-slate-400">الصندوق الذكي مثبت عند المدخل الخارجي للفيلا</div>
                </div>
              </div>

              {/* Arrival CTA */}
              <button
                id="driver-arrive-btn"
                onClick={handleArrival}
                disabled={isProcessing}
                className="relative z-10 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>وصلت للصندوق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIMEOUT EXPIRED STATE (Requirements 2, 8, 16): When authorization expires before package is deposited */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && isTimeoutExpired && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-amber-950/70 border-2 border-rose-500/80 space-y-5 text-center shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/80">
            <Clock className="w-8 h-8 animate-pulse text-rose-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>انتهت مهلة الإيداع</span>
            </div>
            <h3 className="text-lg font-black text-white">انتهت مهلة الإيداع ولم يتم تسجيل إيداع الشحنة</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              انتهت مهلة الإيداع ولم يتم تسجيل إيداع الشحنة. تم قفل الصندوق تلقائيًا.
            </p>
            <p className="text-[11px] text-slate-400">
              تم إلغاء صلاحية رمز OTP السابق وقفل الحجيرة آلياً لحماية الأمان. يمكنك الضغط أدناه لإرسال طلب إذن جديد للعميل.
            </p>
          </div>

          {/* Safe physical locked indicators (Requirement 9) */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs font-bold text-slate-200">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الباب مغلق ✓</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الصندوق مقفول ✓</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Active Enabled Retry CTA Button (Requirements 2, 5, 14) */}
          <button
            id="btn-request-access-retry"
            onClick={handleRequestAccessRetry}
            disabled={isProcessing}
            className="w-full max-w-md mx-auto py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-5 h-5" />
            <span>{isProcessing ? 'جاري إرسال طلب تصريح جديد...' : 'طلب إذن فتح مرة أخرى'}</span>
          </button>
        </div>
      )}

      {/* PENDING APPROVAL STATE (Requirements 2, 5, 16): Waiting for customer approval */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && pendingAuth && !activeAuth && !isTimeoutExpired && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/50 space-y-5 text-center shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Clock className="w-8 h-8 animate-spin text-amber-400" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">
              في انتظار موافقة العميل
            </span>
            <h3 className="text-lg font-bold text-white">
              {pendingAuth.isRetry ? 'طلب إذن فتح جديد معلق' : 'طلب إذن فتح الصندوق معلق'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              تم إرسال طلب تصريح فتح جديد للعميل. بانتظار الموافقة وإصدار رمز التحقق الجديد.
            </p>
            <p className="text-[11px] text-slate-400">
              جاري انتظار موافقة العميل على منح إذن فتح جديد...
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-w-sm mx-auto flex items-center justify-between text-xs font-mono text-slate-400">
            <span>الصندوق: {currentOrder.smartBoxId}</span>
            <span>الحجيرة: {currentOrder.compartmentId || '01'}</span>
            <span className="text-amber-400 font-bold">بانتظار الاعتماد</span>
          </div>
        </div>
      )}

      {/* REJECTED STATE (Requirements 6 & 16): When customer rejects access request */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && rejectedAuth && !activeAuth && !pendingAuth && !isTimeoutExpired && (
        <div className="p-6 rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 space-y-5 text-center shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/80">
            <XCircle className="w-8 h-8 text-rose-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-900 text-rose-200 border border-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>تم رفض طلب فتح الصندوق</span>
            </div>
            <h3 className="text-lg font-black text-white">قام العميل برفض إذن فتح الصندوق الذكي</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              تم رفض التصريح من قبل العميل. الصندوق مقفول ومؤمن تماماً ولا يمكن فتحه بدون موافقة صريحة من العميل.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs font-bold text-slate-200">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الباب مغلق ✓</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>الصندوق مقفول ✓</span>
            </div>
          </div>

          <button
            onClick={handleRequestAccessRetry}
            disabled={isProcessing}
            className="w-full max-w-md mx-auto py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-5 h-5" />
            <span>{isProcessing ? 'جاري إرسال طلب تصريح جديد...' : 'طلب إذن فتح مرة أخرى'}</span>
          </button>
        </div>
      )}

      {/* PHASE 2: Arrival at Box & Initial Access Request */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && driverStep === 2 && !isTimeoutExpired && !pendingAuth && !activeAuth && !rejectedAuth && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">تم التحقق من الموقع الجغرافي بنجاح!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              أنت الآن على بعد 8 أمتار من الصندوق الذكي {currentOrder.smartBoxId} (داخل نطاق السياج الجغرافي 20 متراً).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-w-sm mx-auto flex items-center justify-between text-xs">
            <span className="text-slate-400">الحجيرة المخصصة لطردك:</span>
            <span className="font-bold text-cyan-400 font-mono">
              حجيرة {currentOrder.compartmentId || '01'} (حجم {currentOrder.compartmentSize || 'S'})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>جاهز لطلب إذن الفتح من العميل</span>
            </div>
            <p className="text-xs text-slate-300">
              اضغط أدناه لإرسال طلب تصريح فتح مؤقت للعميل لفتح الحجيرة {currentOrder.compartmentId || '01'}.
            </p>
            <button
              onClick={handleRequestAccessRetry}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isProcessing ? 'جاري إرسال الطلب...' : 'طلب إذن فتح الصندوق من العميل'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: Driver Authorization Card & OTP Verification */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && driverStep === 3 && activeAuth && !isTimeoutExpired && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-5 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">بطاقة تصريح فتح الصندوق</h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              سياج الموقع: موثق (8م)
            </span>
          </div>

          {/* Authorization Card Details */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-950 to-cyan-950/60 border border-emerald-500/40 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-base font-black text-white">العميل وافق على فتح الصندوق</h4>
                <p className="text-xs text-slate-300">
                  تم اعتماد التفويض المباشر لفتح مزلاج الحجيرة. يرجى التحقق من رمز OTP لفتح الصندوق وبدء جلسة الإيداع.
                </p>
              </div>
            </div>

            {/* Grid: Order, Smart Box, Compartment, Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">رقم الطلب</span>
                <span className="font-mono text-white font-bold text-sm">#{currentOrder.id}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">الصندوق الذكي</span>
                <span className="font-mono text-cyan-300 font-bold text-sm">{currentOrder.smartBoxId}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">الحجيرة المخصصة</span>
                <span className="font-mono text-amber-300 font-bold text-sm">
                  حجيرة {currentOrder.compartmentId || '01'} ({currentOrder.compartmentSize || 'S'})
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">حالة التصريح</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {activeAuth.otpValidated || currentOrder.status === 'OTP_VALIDATED' ? 'تم التحقق من الرمز ✓' : 'نشط وبانتظار التحقق'}
                </span>
              </div>
            </div>

            {/* Remaining Authorization Time (Requirements 7 & 8) */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                الوقت المتبقي لصلاحية التصريح:
              </span>
              <span className="font-mono text-sm sm:text-base text-amber-400 bg-amber-950/90 px-3 py-0.5 rounded-lg border border-amber-800 font-black">
                {remainingAuthSeconds > 0 ? formatTimer(remainingAuthSeconds) : 'انتهت الصلاحية'}
              </span>
            </div>

            {/* OTP Verification Section (Requirements 13 & 14) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold">رمز التحقق الرقمي (OTP) لفتح الحجيرة:</span>
                </div>
                {activeAuth.otp && (
                  <span className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    رمز المحاكاة التجريبي (Demo OTP): <strong className="text-cyan-400 font-black text-sm tracking-wider">{activeAuth.otp}</strong>
                  </span>
                )}
              </div>

              {!(activeAuth.otpValidated || currentOrder.status === 'OTP_VALIDATED') ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="أدخل رمز OTP (6 أرقام)"
                    className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleValidateOtp}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? 'جاري التحقق...' : 'التحقق من الرمز'}
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم التحقق من صحة رمز OTP بنجاح — الصندوق جاهز للفتح</span>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ONE PRIMARY ACTION: Open Box (Requires OTP validated & active auth) */}
          <button
            id="driver-open-box-btn"
            onClick={handleOpenBox}
            disabled={
              isProcessing ||
              !activeAuth ||
              activeAuth.status !== 'ACTIVE' ||
              remainingAuthSeconds <= 0 ||
              !(activeAuth.otpValidated || currentOrder.status === 'OTP_VALIDATED')
            }
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Unlock className="w-5 h-5" />
            <span>{isProcessing ? 'جاري التحقق من التصريح وفتح القفل...' : 'فتح الصندوق'}</span>
          </button>

          {/* Quick Security Timeout Simulator for Instant QA Testing */}
          <div className="pt-2 text-center">
            <button
              onClick={() => driverExpireAccessSession(currentOrder.id)}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors underline cursor-pointer"
            >
              [محاكاة الأمان] إنهاء مهلة الـ 5 دقائق لاختبار دورة القفل وإعادة الطلب
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: Deposit & Sensors Diagnosis */}
      {currentOrder && currentOrder.status !== 'COMPLETED' && driverStep === 4 && !isTimeoutExpired && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                إيداع الشحنة ومستشعرات الصندوق الذكي
              </h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono">
              حجيرة {currentOrder.compartmentId || '01'} • {currentOrder.smartBoxId}
            </span>
          </div>

          {/* Active 5-minute Smart Box Access Session Banner while box is open */}
          {isAccessSessionActive && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-950 to-amber-950/40 border border-cyan-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyan-300 shadow-lg">
              <span className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Unlock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>الصندوق مفتوح</span>
              </span>
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-amber-400 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-amber-800 font-bold">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>وقت الإيداع المتبقي:</span>
                <span className="font-black text-amber-300 text-base">{formatTimer(remainingSessionSeconds)}</span>
              </div>
            </div>
          )}

          {/* Secured State Card after Driver successfully closes and locks the box */}
          {currentOrder.status === 'SMART_BOX_SECURED' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-950 to-emerald-950/80 border-2 border-emerald-500 space-y-3 text-center shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>✅ تم تأمين الصندوق بنجاح</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto text-xs font-bold text-emerald-300">
                <div className="p-2 rounded-xl bg-slate-950/90 border border-emerald-700/60 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الباب مغلق</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/90 border border-emerald-700/60 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الصندوق مقفول</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/90 border border-emerald-700/60 flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم تأمين الطلب</span>
                </div>
              </div>
            </div>
          )}

          {/* Hardware Diagnostic Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs">مستشعر الوزن الديناميكي</span>
              <div className="text-xl font-bold font-mono text-cyan-400">
                +{hardwareSim.weightKg.toFixed(2)} كجم
              </div>
              <p className="text-[10px] text-emerald-400">
                {hardwareSim.weightKg > 0 ? 'تم تحسس زيادة الوزن بنجاح' : 'بانتظار وضع الطرد'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs">مزلاج القفل (Solenoid)</span>
              <div
                className={`text-xl font-bold font-mono ${
                  hardwareSim.isSolenoidLocked ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {hardwareSim.isSolenoidLocked ? 'مؤمن ومقفل' : 'مفتوح للإيداع'}
              </div>
              <p className="text-[10px] text-slate-400">
                {hardwareSim.isSolenoidLocked ? 'القفل الكهرومغناطيسي مغلق' : 'الباب مفتوح حالياً'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs">إحكام إغلاق الباب</span>
              <div
                className={`text-xl font-bold font-mono ${
                  hardwareSim.isDoorClosed ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {hardwareSim.isDoorClosed ? '100% مغلق' : 'مفتوح'}
              </div>
              <p className="text-[10px] text-slate-400">مستشعر إغلاق الباب الميكانيكي</p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step Controls: Deposit Package & Secure Box */}
          <div className="space-y-3">
            {currentOrder.status === 'SMART_BOX_OPENED' && !isTimeoutExpired && (
              <button
                onClick={handleDepositPackage}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>إيداع الطرد بالحجيرة (تحسس الوزن +1.4 كجم)</span>
              </button>
            )}

            {currentOrder.status === 'PACKAGE_DEPOSITED' && !isTimeoutExpired && (
              <div className="space-y-3 pt-1 animate-in fade-in">
                <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-center space-y-1">
                  <span className="text-emerald-400 font-black text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>تم رصد الشحنة بنجاح</span>
                    <span className="font-mono text-cyan-300 text-xs">(+{hardwareSim.weightKg.toFixed(2)} كجم)</span>
                  </span>
                  <p className="text-xs text-slate-300">
                    تم استشعار استقرار الطرد على حساس الوزن الديناميكي. يرجى إغلاق وتأمين الصندوق.
                  </p>
                </div>

                <button
                  id="driver-secure-box-btn"
                  onClick={handleSecureBox}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-5 h-5" />
                  <span>{isProcessing ? 'جاري إغلاق وتأمين الصندوق...' : '🔒 إغلاق وتأمين الصندوق'}</span>
                </button>
              </div>
            )}

            {currentOrder.status === 'SMART_BOX_SECURED' && (
              <div className="pt-2 animate-in fade-in">
                <button
                  id="driver-complete-delivery-btn"
                  onClick={handleCompleteDelivery}
                  disabled={isProcessing || (hardwareSim.weightKg <= 0 && !currentOrder.proofOfDelivery)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-5 h-5" />
                  <span>
                    {isProcessing
                      ? 'جاري التقاط التوثيق المرئي POD...'
                      : 'التقاط صورة 2K POD وإتمام التسليم (COMPLETED)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHASE 5: Delivery Completed & Payout Credited */}
      {currentOrder && (driverStep === 5 || currentOrder.status === 'COMPLETED') && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-5 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/60">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white font-['Cairo']">
              تم تسليم الطرد وتأمين الصندوق الذكي بنجاح!
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              تم إشعار العميل {currentOrder.customerName} والمتجر {currentOrder.merchantName} باكتمال التسليم وحفظ صورة التوثيق المرئي في سجل التدقيق الموثق.
            </p>
          </div>

          {/* Reward Tile */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 max-w-sm mx-auto space-y-1">
            <span className="text-xs text-amber-300 font-semibold block">تم إضافة المكافأة لمحفظتك فورياً:</span>
            <div className="text-2xl font-black font-mono text-amber-400">+45.00 ج.م</div>
            <p className="text-[10px] text-slate-400">إجمالي أرباح اليوم: 420.50 ج.م (19 توصيلة)</p>
          </div>

          {/* POD Photo Preview */}
          <div className="max-w-md mx-auto rounded-xl overflow-hidden border border-slate-800 relative">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
              alt="POD Proof"
              className="w-full aspect-video object-cover"
            />
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-cyan-300 font-mono text-[10px] border border-cyan-800">
              SEC-HASH: #8F2B9D • SHA-256
            </div>
          </div>

          <button
            id="driver-return-to-assigned-btn"
            onClick={handleReturnToAssignedOrders}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            العودة لقائمة الطلبات المسندة
          </button>
        </div>
      )}
    </div>
  );
};
