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
} from 'lucide-react';

export const CustomerOrders: React.FC = () => {
  const {
    orders,
    setActiveOrderId,
    setCustomerView,
    openMerchantChat,
  } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'PAST'>('CURRENT');

  // Customer ID is 'cust-1' or currentUser.id
  const currentCustomerId = currentUser?.id || 'cust-1';

  // Get all orders belonging to this customer, ensuring TW-1001 is included
  const customerOrders = orders.filter((o) => {
    return (
      o.customerId === currentCustomerId ||
      o.customerId === 'cust-1' ||
      o.id === 'TW-1001' ||
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
