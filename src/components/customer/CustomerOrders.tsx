/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types';
import {
  PackageCheck,
  Clock,
  Truck,
  Box,
  ChevronLeft,
  Store,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react';

export const CustomerOrders: React.FC = () => {
  const {
    orders,
    setActiveOrderId,
    setCustomerView,
    openMerchantChat,
    cleanupUnfinishedDemoOrders,
  } = useApp();
  const { currentUser, isDemoMode } = useAuth();

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PAST'>('CURRENT');
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupFeedback, setCleanupFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const handleConfirmCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupUnfinishedDemoOrders();
      setShowCleanupConfirm(false);
      setCleanupFeedback({
        text: res.message,
        isSuccess: res.success,
      });
      setTimeout(() => {
        setCleanupFeedback(null);
      }, 5000);
    } finally {
      setIsCleaning(false);
    }
  };

  // Customer ID is 'cust-1' or currentUser.id
  const currentCustomerId = currentUser?.id || 'cust-1';

  // Get all orders belonging to this customer
  const customerOrders = orders.filter((o) => {
    return (
      o.customerId === currentCustomerId ||
      o.customerId === 'cust-1' ||
      !o.customerId
    );
  });

  // Separate orders into Current and Past
  const pastStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED', 'DELIVERY_FAILED'];

  const currentOrders = customerOrders.filter((o) => !pastStatuses.includes(o.status));
  const pastOrders = customerOrders.filter((o) => pastStatuses.includes(o.status));

  const displayedOrders = activeTab === 'CURRENT' ? currentOrders : pastOrders;

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
        return { text: 'جاري التوصيل', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800 animate-pulse' };
      case 'DRIVER_ARRIVED':
        return { text: 'المندوب وصل أمام الصندوق', bg: 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse' };
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

  const handleTrackOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveOrderId(orderId);
    setCustomerView('TRACKING');
  };

  const handleOpenDetails = (orderId: string) => {
    setActiveOrderId(orderId);
    setCustomerView('ORDER_DETAILS');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              طلباتي
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            متابعة جميع طلباتك الحالية وسجل شحناتك السابقة عبر الصناديق الذكية
          </p>
        </div>

        {/* Tab Buttons: Current vs Past */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0 self-start sm:self-auto">
          <button
            id="tab-current-orders"
            onClick={() => setActiveTab('CURRENT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'CURRENT'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>الطلبات الحالية</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'CURRENT' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {currentOrders.length}
            </span>
          </button>

          <button
            id="tab-past-orders"
            onClick={() => setActiveTab('PAST')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'PAST'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>الطلبات السابقة</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'PAST' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {pastOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* Clearly Visible Demo-only button directly below current/previous orders tabs and above order list */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-200">وضع التجربة (Demo):</span>
          <span>إلغاء وإزالة الطلبات التجريبية العالقة وغير المكتملة</span>
        </div>
        <button
          id="customer-orders-cleanup-btn"
          type="button"
          onClick={() => {
            setCleanupFeedback(null);
            setShowCleanupConfirm(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 hover:text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-950/40 hover:shadow-rose-900/40 active:scale-[0.98] cursor-pointer shrink-0"
          title="تنظيف الطلبات غير المكتملة"
        >
          <span>🗑️ تنظيف الطلبات غير المكتملة</span>
        </button>
      </div>

      {/* Cleanup Result Feedback Banner */}
      {cleanupFeedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition-all shadow-md ${
            cleanupFeedback.isSuccess
              ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-200'
              : 'bg-cyan-950/90 border-cyan-700/80 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5 whitespace-pre-line text-right">
            {cleanupFeedback.isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{cleanupFeedback.text}</span>
          </div>
          <button
            onClick={() => setCleanupFeedback(null)}
            className="p-1 rounded hover:bg-black/20 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Demo Cleanup Confirmation Modal */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl text-right animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Cairo']">
                  تنظيف الطلبات غير المكتملة
                </h3>
                <p className="text-xs text-rose-400/90 font-medium">إجراء خاص بوضع التجربة (Demo Only)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm leading-relaxed mb-5 whitespace-pre-line font-medium text-right">
              {`سيتم إلغاء وإزالة جميع الطلبات غير المكتملة.
الطلبات المكتملة لن تتأثر.
هل تريد المتابعة؟`}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCleanupConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                id="confirm-cleanup-btn"
                type="button"
                onClick={handleConfirmCleanup}
                disabled={isCleaning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                {isCleaning ? (
                  <span>جاري التنظيف...</span>
                ) : (
                  <span>تنظيف الطلبات</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
            <PackageCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-['Cairo']">
              {activeTab === 'CURRENT' ? 'لا توجد طلبات جارية حالياً' : 'لا توجد طلبات سابقة'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeTab === 'CURRENT'
                ? 'يمكنك بدء طلب جديد من المتاجر المعتمدة واستلامه في صندوقك الذكي'
                : 'سجل شحناتك المنتهية والملغاة يظهر هنا'}
            </p>
          </div>
          {activeTab === 'CURRENT' && (
            <button
              onClick={() => setCustomerView('MERCHANT_LIST')}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all inline-flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              <span>استعراض المتاجر والطلب الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {displayedOrders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            const isCompleted = ord.status === 'COMPLETED';

            return (
              <div
                key={ord.id}
                id={`order-card-${ord.id}`}
                onClick={() => handleOpenDetails(ord.id)}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 hover:bg-slate-850/90 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg space-y-3.5 group"
              >
                {/* Header: Order Number, Merchant, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-black text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/50">
                      #{ord.id}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-['Cairo']">
                        {ord.merchantName}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {ord.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>

                {/* Items & Smart Box / Driver Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {/* Items Summary */}
                  <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                    <Store className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block">محتويات الطلب:</span>
                      <p className="font-semibold text-white truncate text-xs">
                        {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(' • ')}
                      </p>
                      <span className="text-[11px] font-mono text-cyan-400">
                        الإجمالي: {ord.total || ord.subtotal} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Smart Box & Driver Status */}
                  <div className="flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                    <Box className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">الصندوق:</span>
                        <strong className="font-mono text-amber-300">{ord.smartBoxId || 'BOX-102'}</strong>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-slate-400">الحجيرة:</span>
                        <strong className="font-mono text-cyan-300">{ord.compartmentId || '01'}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>المندوب: </span>
                        <span className="font-semibold text-white">
                          {ord.driverName || 'إسلام عامر (فان كهربائية)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>انقر لعرض تفاصيل الطلب الكاملة</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Chat with merchant button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMerchantChat(ord.merchantId || 'merch-5', ord.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">المحادثة</span>
                    </button>

                    {/* Track Order Button */}
                    <button
                      type="button"
                      id={`btn-track-order-${ord.id}`}
                      onClick={(e) => handleTrackOrder(ord.id, e)}
                      className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
                    >
                      <span>متابعة الطلب</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
