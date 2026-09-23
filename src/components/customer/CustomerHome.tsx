/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Box,
  Truck,
  PlusCircle,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  Lock,
  Store,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const CustomerHome: React.FC = () => {
  const {
    activeOrder,
    activeBox,
    setCustomerView,
    merchants,
    setSelectedMerchantId,
  } = useApp();

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'طلبك تم استلامه';
      case 'ACCEPTED':
        return 'تم قبول الطلب';
      case 'PREPARING':
        return 'جاري تجهيز الطلب';
      case 'READY':
        return 'الطلب جاهز';
      case 'ASSIGNED_TO_DRIVER':
        return 'تم إسناد الطلب للمندوب';
      case 'PICKED_UP':
        return 'المندوب استلم الطلب';
      case 'OUT_FOR_DELIVERY':
        return 'المندوب في الطريق';
      case 'DRIVER_ARRIVED':
        return 'المندوب وصل';
      case 'ACCESS_AUTHORIZED':
      case 'OTP_VALIDATED':
      case 'SMART_BOX_OPENED':
        return 'جاري تسليم الطلب للصندوق';
      case 'PACKAGE_DEPOSITED':
        return 'تم إيداع الطلب';
      case 'SMART_BOX_SECURED':
        return 'تم تأمين الصندوق';
      case 'COMPLETED':
        return 'تم التسليم';
      case 'REJECTED':
        return 'تم رفض الطلب';
      case 'CANCELLED':
        return 'تم إلغاء الطلب';
      case 'DELIVERY_FAILED':
        return 'تعذر التسليم';
      default:
        return 'قيد المعالجة';
    }
  };

  const getProgressWidth = (status: string) => {
    if (status === 'COMPLETED') return 'w-full';
    if (status === 'SMART_BOX_SECURED' || status === 'PACKAGE_DEPOSITED') return 'w-5/6';
    if (status === 'SMART_BOX_OPENED' || status === 'OTP_VALIDATED' || status === 'ACCESS_AUTHORIZED' || status === 'DRIVER_ARRIVED') return 'w-3/4';
    if (status === 'OUT_FOR_DELIVERY') return 'w-1/2';
    if (status === 'PICKED_UP' || status === 'ASSIGNED_TO_DRIVER') return 'w-1/3';
    if (status === 'READY' || status === 'PREPARING') return 'w-1/4';
    return 'w-1/6';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Greeting & Main Smart Box Status */}
      <div className="rounded-2xl bg-gradient-to-l from-slate-900 via-slate-900 to-[#12223b] border border-cyan-900/60 p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                حساب موثق بالرقم القومي • Cairo Master
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              مرحباً بك مجدداً، أحمد مصطفى
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              صندوقك الذكي الرئيسي:{' '}
              <span className="text-cyan-300 font-bold">{activeBox.id}</span> • {activeBox.location}
            </p>
          </div>

          {/* Simple Customer-Friendly Smart Box Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-bold">الصندوق الذكي</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">متصل</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">مغلق وآمن</span>
          </div>
        </div>
      </div>

      {/* Active Order Spotlight Banner */}
      {activeOrder && activeOrder.status !== 'CANCELLED' && (
        <div className="rounded-2xl bg-[#0f1d33] border border-cyan-500/50 p-5 shadow-2xl relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-xs font-bold text-cyan-300">طلب نشط قيد التوصيل الآن</span>
                <span className="text-xs font-mono text-slate-400">#{activeOrder.id}</span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {activeOrder.merchantName} ({activeOrder.items[0]?.name})
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  مع المندوب:{' '}
                  <span className="text-cyan-300 font-semibold">{activeOrder.driverName || 'إسلام عامر'}</span>{' '}
                  • {activeOrder.estimatedArrival || 'متوقع بعد دقيقتين'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 ${getProgressWidth(
                      activeOrder.status
                    )}`}
                  />
                </div>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  {getStatusText(activeOrder.status)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center">
              <button
                id="track-active-order-btn"
                onClick={() => setCustomerView('TRACKING')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                <span>تتبع الشحنة والحصول على رمز الفتح</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Quick Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Quick Action 1: Delivery Access Authorization */}
        <button
          id="quick-authorizations-btn"
          onClick={() => setCustomerView('BOXES')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-right group shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <KeyRound className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
            تصاريح وصول الشحنات
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">توليد وإدارة أذونات ورموز الدخول المؤقتة</p>
        </button>

        {/* Quick Action 2: External Order */}
        <button
          id="quick-external-order-btn"
          onClick={() => setCustomerView('EXTERNAL_ORDER')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-right group shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
            تسجيل شحنة خارجية
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">ربط بوالص أمازون، نون، وأرامكس بالصندوق</p>
        </button>

        {/* Quick Action 3: Delegations */}
        <button
          id="quick-delegations-btn"
          onClick={() => setCustomerView('BOXES')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-right group shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-950/80 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <KeyRound className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
            إدارة التفويض والـ OTP
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">إنشاء رموز مؤقتة للضيوف والمناديب المستقلين</p>
        </button>

        {/* Quick Action 4: Security & Camera */}
        <button
          id="quick-security-btn"
          onClick={() => setCustomerView('BOXES')}
          className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-right group shadow-md"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-950/80 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
            الحراسة وكاميرا 2K
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">سجل التوثيق المرئي POD وتنبيهات العبث</p>
        </button>
      </div>

      {/* Featured Merchants that support Tawseel Smart Box Direct Auto-Deposit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">متاجر تدعم الإيداع الآلي المباشر بالصندوق</h3>
          </div>
          <span className="text-xs text-cyan-400">توصيل مجاني 100% لملاك الصناديق</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {merchants.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    جاهز للإيداع
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">★ {m.rating}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{m.name}</h4>
                <p className="text-[11px] text-slate-400">{m.category} • {m.address}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  تجهيز: {m.avgPrepTimeMinutes} د
                </span>
                <button
                  onClick={() => {
                    setSelectedMerchantId(m.id);
                    setCustomerView('STORE');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold border border-cyan-800/80 transition-colors"
                >
                  استعراض والطلب ❯
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
