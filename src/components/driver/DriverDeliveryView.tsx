/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';

export const DriverDeliveryView: React.FC = () => {
  const {
    orders,
    activeOrder,
    setActiveOrderId,
    driverStep,
    setDriverStep,
    driverPickupOrder,
    driverStartDelivery,
    driverArriveAtBox,
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

  // Orders visible to the driver: either assigned to drv-1 or active in delivery
  const driverOrders = orders.filter(
    (o) =>
      o.driverId === 'drv-1' ||
      [
        'ASSIGNED_TO_DRIVER',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DRIVER_ARRIVED',
        'ACCESS_AUTHORIZED',
        'OTP_VALIDATED',
        'SMART_BOX_OPENED',
        'PACKAGE_DEPOSITED',
        'SMART_BOX_SECURED',
      ].includes(o.status)
  );

  const currentOrder =
    driverOrders.find((o) => o.id === activeOrder?.id) || driverOrders[0] || activeOrder;

  const activeAuth = authorizations.find(
    (a) => a.orderId === currentOrder?.id && a.status === 'ACTIVE'
  );

  // Countdown timer for active driver authorization (5 minutes window)
  React.useEffect(() => {
    if (!activeAuth) {
      setRemainingAuthSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const expiresAt = activeAuth.expiresAtTimestamp || (Date.now() + 5 * 60 * 1000);
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemainingAuthSeconds(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeAuth]);

  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState<number>(300);

  // Check if box is currently open in active access session
  const isAccessSessionActive =
    Boolean(currentOrder) &&
    (currentOrder.status === 'SMART_BOX_OPENED' || currentOrder.status === 'PACKAGE_DEPOSITED') &&
    accessSession?.status === 'ACTIVE' &&
    accessSession?.orderId === currentOrder?.id;

  const isAccessSessionExpired =
    Boolean(currentOrder) &&
    accessSession?.status === 'EXPIRED' &&
    accessSession?.orderId === currentOrder?.id;

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
    if (currentOrder.status === 'DRIVER_ARRIVED' && !activeAuth && driverStep < 2) {
      setDriverStep(2);
    } else if (
      (currentOrder.status === 'ACCESS_AUTHORIZED' || currentOrder.status === 'OTP_VALIDATED' || (currentOrder.status === 'DRIVER_ARRIVED' && activeAuth)) &&
      driverStep < 3
    ) {
      setDriverStep(3);
    } else if (
      ['SMART_BOX_OPENED', 'PACKAGE_DEPOSITED', 'SMART_BOX_SECURED'].includes(currentOrder.status) &&
      driverStep < 4
    ) {
      setDriverStep(4);
    } else if (currentOrder.status === 'COMPLETED' && driverStep < 5) {
      setDriverStep(5);
    }
  }, [currentOrder?.status, activeAuth]);

  // Lifecycle Actions
  const handlePickup = async () => {
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
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const res = await driverSubmitOTP(currentOrder.id, otpInput);
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

  const handleOpenBox = async () => {
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
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverDepositPackage(currentOrder.id, 1.4);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل إيداع الشحنة في الحجيرة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSecureBox = async () => {
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
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await driverCompleteDelivery(currentOrder.id);
      setDriverStep(5);
    } catch (err: any) {
      setErrorMessage(err?.message || 'فشل توثيق وإتمام عملية التسليم');
    } finally {
      setIsProcessing(false);
    }
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
              توصيل شحنة للصندوق الذكي #{currentOrder?.id}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              الوجهة: <span className="text-amber-300 font-bold">{currentOrder?.smartBoxId}</span> •{' '}
              {currentOrder?.deliveryAddress || 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 font-bold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              مكافأة التسليم: +45.00 ج.م
            </span>
            <div className="text-[11px] text-cyan-300 font-mono">
              حالة الطلب الحالية: <span className="font-bold underline">{currentOrder?.status}</span>
            </div>
          </div>
        </div>

        {/* Assigned Orders Selector for Driver */}
        {driverOrders.length > 1 && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-800/80 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 whitespace-nowrap">الطلبات المسندة إليك:</span>
            {driverOrders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => setActiveOrderId(ord.id)}
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
        <div className="grid grid-cols-5 gap-2 pt-4 mt-4 border-t border-slate-800/80 text-center text-xs">
          {[
            { step: 1, label: 'الملاحة بالخريطة' },
            { step: 2, label: 'الوصول والسياج' },
            { step: 3, label: 'تصريح فتح الصندوق' },
            { step: 4, label: 'إيداع الطرد والوزن' },
            { step: 5, label: 'توثيق POD والمكافأة' },
          ].map((s) => {
            const isActive = driverStep === s.step;
            const isDone = driverStep > s.step;
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
      </div>

      {/* PHASE 0: If Order is ASSIGNED_TO_DRIVER or PICKED_UP */}
      {currentOrder?.status === 'ASSIGNED_TO_DRIVER' && (
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
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد استلام الطرد من المتجر (PICKED_UP)</span>
          </button>
        </div>
      )}

      {currentOrder?.status === 'PICKED_UP' && (
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
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>بدء خط السير والملاحة نحو الصندوق الذكي (OUT_FOR_DELIVERY)</span>
          </button>
        </div>
      )}

      {/* PHASE 1: In-transit Navigation */}
      {driverStep === 1 && currentOrder?.status !== 'ASSIGNED_TO_DRIVER' && currentOrder?.status !== 'PICKED_UP' && (
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

      {/* PHASE 2: Arrival at Box & Geofence Verified */}
      {driverStep === 2 && (
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

          {activeAuth ? (
            <div className="space-y-3 max-w-md mx-auto text-right">
              {/* In-App Push Notification Simulation */}
              <div
                onClick={() => setDriverStep(3)}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-cyan-950/90 border-2 border-cyan-400/80 shadow-xl cursor-pointer hover:border-cyan-300 transition-all space-y-2.5 animate-in zoom-in-95"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>🔐 تصريح فتح الصندوق</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 animate-pulse">
                    إشعار فوري جديد
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed">
                  العميل سمح لك بفتح Smart Box. التصريح صالح لمدة 5 دقائق.
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                  <span>الطلب: #{currentOrder.id}</span>
                  <span>المندوب: {currentOrder.driverName || 'إسلام عامر'}</span>
                  <span>الصندوق: {currentOrder.smartBoxId}</span>
                  <span>الحجيرة: {currentOrder.compartmentId || '01'}</span>
                </div>
              </div>

              <button
                onClick={() => setDriverStep(3)}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>عرض بطاقة تصريح فتح الصندوق</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm">
                <Clock className="w-4 h-4 animate-spin text-amber-400" />
                <span>تم الوصول — في انتظار موافقة العميل</span>
              </div>
              <p className="text-xs text-slate-300">
                تم إشعار العميل بوصولك أمام الصندوق الذكي. لا يمكنك فتح الصندوق إلا بعد موافقة العميل الرسمية.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: Driver Authorization Card */}
      {driverStep === 3 && (
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
                  تم اعتماد التفويض المباشر لفتح مزلاج الحجيرة. اضغط أدناه لفتح الصندوق وبدء جلسة الإيداع.
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
                  {activeAuth?.status === 'ACTIVE' ? 'نشط (SINGLE-USE)' : 'نشط ومصرح'}
                </span>
              </div>
            </div>

            {/* Remaining Authorization Time */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-900/60 flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                الوقت المتبقي لصلاحية التصريح:
              </span>
              <span className="font-mono text-sm sm:text-base text-amber-400 bg-amber-950/90 px-3 py-0.5 rounded-lg border border-amber-800 font-black">
                {formatTimer(remainingAuthSeconds)}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ONE PRIMARY ACTION: Open Box */}
          <button
            id="driver-open-box-btn"
            onClick={handleOpenBox}
            disabled={isProcessing || !activeAuth || activeAuth.status !== 'ACTIVE' || remainingAuthSeconds <= 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Unlock className="w-5 h-5" />
            <span>{isProcessing ? 'جاري التحقق من التصريح وفتح القفل...' : 'فتح الصندوق'}</span>
          </button>
        </div>
      )}

      {/* PHASE 4: Deposit & Sensors Diagnosis */}
      {driverStep === 4 && (
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

          {/* Expiration Card when Access Session reaches 00:00 */}
          {isAccessSessionExpired && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/80 via-slate-950 to-amber-950/60 border-2 border-rose-500 space-y-3 text-center shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-base">
                <Clock className="w-5 h-5 text-rose-400" />
                <span>⏱️ انتهت مهلة الإيداع</span>
              </div>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تم تأمين الصندوق</span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs font-bold text-slate-300 pt-1">
                <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الباب مغلق</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الصندوق مقفول</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                انتهت مهلة الـ 5 دقائق وتم قفل الصندوق آلياً. لا يمكن إعادة فتح الصندوق بنفس التصريح.
              </p>
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
            {currentOrder.status === 'SMART_BOX_OPENED' && !isAccessSessionExpired && (
              <button
                onClick={handleDepositPackage}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>إيداع الطرد بالحجيرة (تحسس الوزن +1.4 كجم)</span>
              </button>
            )}

            {currentOrder.status === 'PACKAGE_DEPOSITED' && !isAccessSessionExpired && (
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
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
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
      {driverStep === 5 && (
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
            onClick={() => setDriverStep(1)}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            العودة لقائمة الطلبات المسندة
          </button>
        </div>
      )}
    </div>
  );
};
