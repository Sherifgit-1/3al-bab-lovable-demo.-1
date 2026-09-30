/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  Phone,
  Camera,
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  Store,
  MapPin,
  Lock,
  Box,
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const {
    activeOrder,
    orders,
    setActiveOrderId,
    setCustomerView,
    authorizations,
    cancelOrder,
    customerAuthorizeAccess,
    customerRejectAccess,
  } = useApp();

  const [copiedOtp, setCopiedOtp] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [rejectNotice, setRejectNotice] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const auth =
    authorizations.find((a) => a.orderId === activeOrder?.id && a.status === 'ACTIVE') ||
    authorizations.find((a) => a.orderId === activeOrder?.id);

  const isAccessActive =
    auth?.status === 'ACTIVE' &&
    ['ACCESS_AUTHORIZED', 'OTP_VALIDATED', 'SMART_BOX_OPENED', 'PACKAGE_DEPOSITED', 'SMART_BOX_SECURED', 'COMPLETED'].includes(
      activeOrder?.status || ''
    );

  const remainingSeconds = auth?.expiresAtTimestamp
    ? Math.max(0, Math.floor((auth.expiresAtTimestamp - nowMs) / 1000))
    : 0;
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const formattedCountdown = `${timerMinutes}:${timerSecs < 10 ? '0' : ''}${timerSecs}`;

  const handleCopyOtp = () => {
    if (auth?.otp) {
      navigator.clipboard?.writeText(auth.otp);
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    setIsCancelling(true);
    const res = await cancelOrder(activeOrder.id);
    setIsCancelling(false);
    if (!res.success) {
      setCancelMessage(res.message);
    }
  };

  const ALL_TRACKING_STEPS = [
    { status: 'PENDING', label: 'تم إنشاء الطلب', desc: 'تم استلام طلبك من المنصة', icon: Clock },
    { status: 'ACCEPTED', label: 'تم قبول الطلب', desc: 'وافق المتجر على الطلب وجاري التحضير', icon: CheckCircle2 },
    { status: 'PREPARING', label: 'جاري التجهيز', desc: 'المتجر يجهز الأصناف ويقوم بتغليفها', icon: Package },
    { status: 'READY', label: 'الطلب جاهز', desc: 'جاهز للاستلام والتسليم للمندوب', icon: CheckCircle2 },
    { status: 'ASSIGNED_TO_DRIVER', label: 'تم إسناد الطلب للمندوب', desc: 'تم تعيين المندوب الميداني للشحنة', icon: Truck },
    { status: 'PICKED_UP', label: 'تم استلام الشحنة', desc: 'استلم المندوب الطرد وبدأ التحرك', icon: Package },
    { status: 'OUT_FOR_DELIVERY', label: 'جاري التوصيل الميداني', desc: 'المندوب في طريقه نحو موقع الصندوق الذكي', icon: Truck },
    { status: 'DRIVER_ARRIVED', label: 'المندوب وصل أمام الصندوق', desc: 'وصل المندوب للموقع الجغرافي المحدد', icon: MapPin },
    { status: 'ACCESS_AUTHORIZED', label: 'تم إصدار تصريح الوصول', desc: 'تم إنشاء تصريح وتفويض فتح الحجيرة الذكية', icon: KeyRound },
    { status: 'OTP_VALIDATED', label: 'تم التحقق من الرمز (OTP)', desc: 'اجتاز الرمز الفحص المشفر لمرة واحدة', icon: ShieldCheck },
    { status: 'SMART_BOX_OPENED', label: 'تم فتح الحجيرة الذكية', desc: 'تم تحرير القفل المغناطيسي والمزلاج', icon: Box },
    { status: 'PACKAGE_DEPOSITED', label: 'تم إيداع الطرد بالحجيرة', desc: 'تم رصد الوزن وتأكيد استقرار الشحنة', icon: Package },
    { status: 'SMART_BOX_SECURED', label: 'تم تأمين وقفل الصندوق', desc: 'أُغلق الباب وأُحكم القفل الكهرومغناطيسي', icon: Lock },
    { status: 'COMPLETED', label: 'تم التسليم بنجاح', desc: 'اكتملت دورة التوصيل وتوثيق الإثبات POD', icon: CheckCircle2 },
  ];

  const currentStatus = activeOrder?.status || 'PENDING';

  const stateOrder = [
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'ASSIGNED_TO_DRIVER',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DRIVER_ARRIVED',
    'ACCESS_AUTHORIZED',
    'OTP_VALIDATED',
    'SMART_BOX_OPENED',
    'PACKAGE_DEPOSITED',
    'SMART_BOX_SECURED',
    'COMPLETED',
  ];

  const currentIndex = stateOrder.indexOf(currentStatus);
  const reachedSteps =
    currentIndex >= 0
      ? ALL_TRACKING_STEPS.slice(0, currentIndex + 1)
      : ALL_TRACKING_STEPS.slice(0, 1);

  const getFriendlyStatusHeader = () => {
    switch (currentStatus) {
      case 'PENDING':
        return { text: 'طلبك تم استلامه وبانتظار موافقة المتجر', color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'ACCEPTED':
        return { text: 'تم قبول طلبك من المتجر', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'PREPARING':
        return { text: 'جاري تجهيز وتغليف طلبك بعناية', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'READY':
        return { text: 'الطلب جاهز وبانتظار استلام المندوب', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'ASSIGNED_TO_DRIVER':
        return { text: 'تم إسناد الطلب للمندوب', color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
      case 'PICKED_UP':
        return { text: 'المندوب استلم الطلب من المتجر', color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
      case 'OUT_FOR_DELIVERY':
        return { text: 'المندوب في الطريق إلى موقعك', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
      case 'DRIVER_ARRIVED':
        return { text: 'المندوب وصل أمام الصندوق الذكي', color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'ACCESS_AUTHORIZED':
      case 'OTP_VALIDATED':
      case 'SMART_BOX_OPENED':
        return { text: 'جاري تسليم الطلب للصندوق الذكي', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'PACKAGE_DEPOSITED':
        return { text: 'تم إيداع الطلب بالحجيرة بنجاح', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 'SMART_BOX_SECURED':
        return { text: 'تم تأمين الصندوق وإحكام القفل', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 'COMPLETED':
        return { text: 'تم التسليم بنجاح • جاهز للاستلام', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' };
      case 'CANCELLED':
        return { text: 'تم إلغاء هذا الطلب', color: 'text-rose-400 bg-rose-950/80 border-rose-800' };
      case 'REJECTED':
        return { text: 'اعتذر المتجر عن الطلب', color: 'text-rose-400 bg-rose-950/80 border-rose-800' };
      case 'DELIVERY_FAILED':
        return { text: 'تعذر التسليم - جاري المراجعة', color: 'text-rose-400 bg-rose-950/80 border-rose-800' };
      default:
        return { text: 'طلب قيد المتابعة', color: 'text-slate-400 bg-slate-900 border-slate-800' };
    }
  };

  const statusHeader = getFriendlyStatusHeader();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Switcher between customer orders */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomerView('ORDERS')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لطلباتي</span>
          </button>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => setCustomerView('HOME')}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            الرئيسية
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">اختر الطلب:</span>
          {orders
            .filter((o) => o.customerId === 'cust-1' || !o.customerId)
            .slice(0, 5)
            .map((ord) => (
              <button
                key={ord.id}
                onClick={() => setActiveOrderId(ord.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  ord.id === activeOrder?.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                #{ord.id}
              </button>
            ))}
        </div>
      </div>

      {/* Main Delivery Status Stepper Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                طلب رقم: #{activeOrder?.id || 'TW-8921'}
              </span>
              <span className="text-xs text-slate-400">
                • {activeOrder?.createdAt}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-['Cairo']">
              {activeOrder?.merchantName || 'ميدل إيست تيك'}
            </h2>
            <p className="text-xs text-slate-400">
              محتويات الشحنة: {activeOrder?.items.map((i) => `${i.name} (${i.quantity})`).join(' + ')}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${statusHeader.color}`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{statusHeader.text}</span>
            </span>

            {/* Cancel Button if order is still PENDING */}
            {activeOrder?.status === 'PENDING' && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors underline flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isCancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب'}</span>
              </button>
            )}
          </div>
        </div>

        {cancelMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {cancelMessage}
          </div>
        )}

        {/* Timeline of Reached Lifecycle States Only (Section 4) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">مراحل التوصيل المنجزة:</span>
            <span className="text-xs text-cyan-400 font-mono">
              المرحلة {reachedSteps.length} من {ALL_TRACKING_STEPS.length}
            </span>
          </div>

          <div className="space-y-2">
            {reachedSteps.map((step, idx) => {
              const isLatest = idx === reachedSteps.length - 1;
              const isCompleted = activeOrder?.status === 'COMPLETED';
              const StepIcon = step.icon;

              return (
                <div
                  key={step.status}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isLatest && !isCompleted
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400'
                      : 'bg-slate-950/80 border-emerald-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isLatest && !isCompleted
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                      }`}
                    >
                      {isLatest && !isCompleted ? (
                        <span className="flex h-3 w-3 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
                        </span>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate font-['Cairo']">
                          {step.label}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-500">
                          ({step.status})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono ${
                      isLatest && !isCompleted
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {isLatest && !isCompleted ? 'الوضع الحالي' : 'مكتمل ✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Access Pass Card & Courier Details / Delivery Proof */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Temporary Access Pass Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">إذن الوصول وتأكيد الاستلام</h3>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              تصريح إيداع موثق
            </span>
          </div>

          {/* Secure Authorization Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <span>حالة تفويض الوصول للمندوب:</span>
              {isAccessActive && remainingSeconds > 0 && (
                <span className="font-mono text-xs text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-pulse" />
                  متبقي {formattedCountdown}
                </span>
              )}
            </div>

            <div className="py-2 text-center">
              {isAccessActive ? (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    تم تفويض المندوب بفتح الصندوق بنجاح
                  </span>
                  <p className="text-[11px] text-slate-300">
                    تم إرسال إشعار فوري مشفر للمندوب. سيقوم بالضغط على &quot;فتح الصندوق&quot; وإيداع شحنتك فوراً.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  {activeOrder?.status === 'DRIVER_ARRIVED'
                    ? 'المندوب بانتظار موافقتك الرسمية أدناه'
                    : 'يتم تفعيل التصريح فقط بعد وصول المندوب للصندوق وموافقتك'}
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              {isAccessActive
                ? `تصريح رقمي مؤقت صالح لمدة 5 دقائق من لحظة إذنك (${auth?.expiresAt ? `ينتهي ${auth.expiresAt}` : '5 دقائق'})`
                : 'حماية مؤتمتة: لا يمكن فتح الصندوق إلا بعد موافقتك الصريحة'}
            </p>
          </div>

          {/* Security Authorization Dialog at Driver Arrival */}
          {activeOrder?.status === 'DRIVER_ARRIVED' && (!auth || auth.status !== 'ACTIVE') && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/80 text-center space-y-3 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5 animate-pulse text-amber-400" />
                <h4 className="text-sm font-black text-white">المندوب وصل للصندوق — هل تسمح له بفتح صندوقك؟</h4>
              </div>
              <p className="text-[11px] text-slate-300">
                المندوب أمام الصندوق الذكي {activeOrder.smartBoxId} الآن. بالضغط على &quot;السماح بفتح الصندوق&quot;، سيتم إصدار تصريح رقمي للمندوب صالح لمدة 5 دقائق.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="customer-authorize-btn"
                  onClick={() => customerAuthorizeAccess(activeOrder.id)}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>السماح بفتح الصندوق</span>
                </button>
                <button
                  id="customer-reject-btn"
                  onClick={async () => {
                    await customerRejectAccess(activeOrder.id);
                    setRejectNotice('تم رفض السماح بفتح الصندوق');
                  }}
                  className="px-5 py-2.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  رفض
                </button>
              </div>
              {rejectNotice && (
                <div className="text-[10px] text-rose-400 font-bold pt-1">{rejectNotice}</div>
              )}
            </div>
          )}

          {/* Delivery Destination and Smart Box Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">الصندوق المخصص:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {activeOrder?.smartBoxId || 'BOX-102'} • الحجيرة {activeOrder?.compartmentId || '01'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">عنوان الصندوق:</span>
              <span className="text-slate-200 text-right">
                {activeOrder?.deliveryAddress || 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">طريقة الاستلام:</span>
              <span className="text-emerald-400 font-semibold">إيداع آلي آمن ومباشر</span>
            </div>
          </div>
        </div>

        {/* Courier Details & Photo Proof */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">بيانات المندوب والتوصيل</h3>
            </div>
            <span className="text-[11px] text-amber-400 font-mono">
              {activeOrder?.driverName ? 'مندوب معتمد' : 'بانتظار التعيين'}
            </span>
          </div>

          {/* Courier Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white">
                {activeOrder?.driverName || 'إسلام عامر (كود C-4091)'}
              </h4>
              <p className="text-[11px] text-slate-400">
                مركبة: {activeOrder?.driverVehicle || 'فان كهربائية EV-04 (أ ط ص 412)'}
              </p>
              <div className="text-[10px] text-emerald-400 font-mono">
                {activeOrder?.estimatedArrival || 'التوصيل متوقع خلال الدقائق القادمة'}
              </div>
            </div>

            {activeOrder?.driverPhone && (
              <a
                href={`tel:${activeOrder.driverPhone}`}
                className="p-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-400 transition-colors"
                title="اتصال بالمندوب"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Proof of Delivery Photo if available */}
          {activeOrder?.proofOfDelivery ? (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  صورة توثيق الإيداع بالصندوق
                </span>
                <span className="font-mono text-[10px] text-emerald-400">
                  {activeOrder.proofOfDelivery.timestamp}
                </span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border border-emerald-800/50">
                <img
                  src={activeOrder.proofOfDelivery.photoUrl}
                  alt="Proof of delivery"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[10px] text-slate-400 text-center">
                تم إيداع الطرد والتأكد من إغلاق الصندوق بنجاح
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
              <span className="text-slate-400">إرشادات الاستلام:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                بمجرد وصول المندوب وإيداع الطرد بالحجيرة، ستتلقى إشعاراً فورياً مع صورة توثيق الإيداع
                لتتمكن من فتح الصندوق واستلام طلبك في أي وقت يناسبك.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
