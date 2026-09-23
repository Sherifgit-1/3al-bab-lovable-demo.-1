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
} from 'lucide-react';

export const CustomerTracking: React.FC = () => {
  const {
    activeOrder,
    orders,
    setActiveOrderId,
    setCustomerView,
    authorizations,
    cancelOrder,
  } = useApp();

  const [copiedOtp, setCopiedOtp] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const auth = authorizations.find((a) => a.orderId === activeOrder?.id) || authorizations[0];

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

  // The 10 user-facing lifecycle milestones requested
  const milestones = [
    {
      id: 'PENDING_ACCEPTED',
      label: 'طلبك تم استلامه',
      statuses: ['PENDING', 'ACCEPTED', 'CREATED'],
    },
    {
      id: 'PREPARING',
      label: 'جاري تجهيز الطلب',
      statuses: ['PREPARING'],
    },
    {
      id: 'READY',
      label: 'الطلب جاهز',
      statuses: ['READY', 'READY_FOR_PICKUP', 'ASSIGNED_TO_DRIVER'],
    },
    {
      id: 'PICKED_UP',
      label: 'المندوب استلم الطلب',
      statuses: ['PICKED_UP'],
    },
    {
      id: 'OUT_FOR_DELIVERY',
      label: 'المندوب في الطريق',
      statuses: ['OUT_FOR_DELIVERY', 'IN_TRANSIT'],
    },
    {
      id: 'DRIVER_ARRIVED',
      label: 'المندوب وصل',
      statuses: ['DRIVER_ARRIVED', 'ARRIVED_AT_BOX'],
    },
    {
      id: 'DEPOSITING',
      label: 'جاري تسليم الطلب للصندوق',
      statuses: ['ACCESS_AUTHORIZED', 'OTP_VALIDATED', 'SMART_BOX_OPENED'],
    },
    {
      id: 'PACKAGE_DEPOSITED',
      label: 'تم إيداع الطلب',
      statuses: ['PACKAGE_DEPOSITED', 'DEPOSITED'],
    },
    {
      id: 'SMART_BOX_SECURED',
      label: 'تم تأمين الصندوق',
      statuses: ['SMART_BOX_SECURED'],
    },
    {
      id: 'COMPLETED',
      label: 'تم التسليم',
      statuses: ['COMPLETED'],
    },
  ];

  const getMilestoneIndex = (status: string) => {
    return milestones.findIndex((m) => m.statuses.includes(status));
  };

  const currentStatus = activeOrder?.status || 'PENDING';
  const currentMilestoneIndex = getMilestoneIndex(currentStatus);

  const getMilestoneState = (index: number) => {
    if (currentStatus === 'COMPLETED') return 'DONE';
    if (currentStatus === 'CANCELLED' || currentStatus === 'REJECTED' || currentStatus === 'DELIVERY_FAILED') {
      return 'FAILED';
    }
    if (index < currentMilestoneIndex) return 'DONE';
    if (index === currentMilestoneIndex) return 'CURRENT';
    return 'UPCOMING';
  };

  const getFriendlyStatusHeader = () => {
    switch (currentStatus) {
      case 'PENDING':
        return { text: 'طلبك تم استلامه وبانتظار موافقة المتجر', color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'ACCEPTED':
        return { text: 'تم قبول طلبك من المتجر', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'PREPARING':
        return { text: 'جاري تجهيز وتغليف طلبك بعناية', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'READY':
      case 'READY_FOR_PICKUP':
        return { text: 'الطلب جاهز وبانتظار استلام المندوب', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'ASSIGNED_TO_DRIVER':
        return { text: 'تم إسناد الطلب للمندوب', color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
      case 'PICKED_UP':
        return { text: 'المندوب استلم الطلب من المتجر', color: 'text-blue-400 bg-blue-950/80 border-blue-800' };
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
        return { text: 'المندوب في الطريق إلى موقعك', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' };
      case 'DRIVER_ARRIVED':
      case 'ARRIVED_AT_BOX':
        return { text: 'المندوب وصل أمام الصندوق الذكي', color: 'text-amber-400 bg-amber-950/80 border-amber-800' };
      case 'ACCESS_AUTHORIZED':
      case 'OTP_VALIDATED':
      case 'SMART_BOX_OPENED':
        return { text: 'جاري تسليم الطلب للصندوق الذكي', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' };
      case 'PACKAGE_DEPOSITED':
      case 'DEPOSITED':
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
        <button
          onClick={() => setCustomerView('HOME')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 whitespace-nowrap">اختر الطلب:</span>
          {orders
            .filter((o) => o.customerId === 'cust-1' || !o.customerId)
            .slice(0, 4)
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
            {(activeOrder?.status === 'PENDING' || activeOrder?.status === 'CREATED') && (
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

        {/* 10-Milestone Customer Status Stepper */}
        <div>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-300">مراحل التوصيل:</span>
            <span className="text-xs text-cyan-400 font-mono">
              المرحلة {Math.min(currentMilestoneIndex + 1, 10)} من 10
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {milestones.map((m, idx) => {
              const state = getMilestoneState(idx);

              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    state === 'CURRENT'
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400'
                      : state === 'DONE'
                      ? 'bg-slate-950/80 border-emerald-700/60 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex justify-center mb-1.5">
                    {state === 'DONE' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : state === 'CURRENT' ? (
                      <span className="flex h-3 w-3 relative my-0.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                      </span>
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-slate-700" />
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-white leading-tight">{m.label}</div>
                  <div className="text-[9px] font-mono text-slate-400 mt-1">
                    {idx + 1}
                  </div>
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

          {/* Clean 6-digit OTP Display */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs text-slate-400">رمز فتح الحجيرة للمندوب (OTP):</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-cyan-400">
                {auth?.otp || '129385'}
              </span>
              <button
                onClick={handleCopyOtp}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="نسخ الرمز"
              >
                {copiedOtp ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              يُستخدم لمرة واحدة فقط لفتح الحجيرة وتأمين الطرد
            </p>
          </div>

          {/* Delivery Destination and Smart Box Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">الصندوق المخصص:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {activeOrder?.smartBoxId || 'BOX-102'} • الحجيرة {activeOrder?.compartmentId || '02'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">عنوان الصندوق:</span>
              <span className="text-slate-200 text-right">
                {activeOrder?.deliveryAddress || 'الفيلا 14 - التجمع الخامس'}
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
