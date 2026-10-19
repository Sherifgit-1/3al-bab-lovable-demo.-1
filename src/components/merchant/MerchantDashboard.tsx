/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth, DEMO_MERCHANT_OPTIONS } from '../../context/AuthContext';
import {
  Store,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Printer,
  ChevronLeft,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Radio,
  XCircle,
  Play,
  Check,
  UserCheck,
  MessageSquare,
  Send,
  FileText,
  Camera,
  Sparkles,
} from 'lucide-react';
import { getQuickRepliesForMerchant } from '../../utils/quickReplies';

export const MerchantDashboard: React.FC = () => {
  const {
    orders,
    acceptOrder,
    rejectOrder,
    markOrderPreparing,
    markOrderReady,
    handOverToDriver,
    assignOrderToDriver,
    merchants,
    boxes,
    drivers,
    conversations,
    chatMessages,
    activeConversation,
    setActiveConversation,
    sendMerchantReply,
    confirmOrderByMerchant,
  } = useApp();

  const { currentUser, currentDemoMerchantId, switchDemoMerchant, isDemoMode } = useAuth();
  const currentMerchantId =
    (currentUser?.role === 'MERCHANT' ? currentUser.id : null) || currentDemoMerchantId;
  const currentMerchant = currentMerchantId ? merchants.find((m) => m.id === currentMerchantId) : undefined;
  const currentOption =
    DEMO_MERCHANT_OPTIONS.find((opt) => opt.id === currentMerchantId) || DEMO_MERCHANT_OPTIONS[0];

  const merchantConversations = currentMerchant ? conversations.filter((c) => c.merchantId === currentMerchant.id) : [];
  const convMerchant =
    (activeConversation?.merchantId ? merchants.find((m) => m.id === activeConversation.merchantId) : undefined) ||
    currentMerchant;
  const merchantQuickReplies = convMerchant ? getQuickRepliesForMerchant(convMerchant) : [];

  const [dashboardTab, setDashboardTab] = useState<'PIPELINE' | 'CHATS'>('PIPELINE');
  const [merchantReplyText, setMerchantReplyText] = useState('');
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('عدم توفر الصنف في المخزون حالياً');

  // Automatically keep active conversation within current merchant's scope
  React.useEffect(() => {
    if (currentMerchant && activeConversation && activeConversation.merchantId !== currentMerchant.id) {
      if (merchantConversations.length > 0) {
        setActiveConversation(merchantConversations[0]);
      }
    }
  }, [currentMerchant?.id, activeConversation?.merchantId, merchantConversations, setActiveConversation]);

  if (!currentMerchant) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center rounded-3xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-4 shadow-xl">
        <Store className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white font-['Cairo']">لا يوجد متجر محدد حالياً</h3>
        <p className="text-xs text-slate-400">
          يرجى تسجيل الدخول بحساب تاجر صالح أو اختيار متجر لعرض لوحة العمليات والطلبات.
        </p>
      </div>
    );
  }

  const activeConvMessages = chatMessages.filter(
    (m) => m.conversationId === activeConversation?.id
  );

  // FIX 5: Strictly filter orders for THIS merchant only
  const merchantOrders = orders.filter((o) => o.merchantId === currentMerchant.id);
  const pendingOrders = merchantOrders.filter((o) => o.status === 'PENDING');
  const acceptedOrders = merchantOrders.filter((o) => o.status === 'ACCEPTED');
  const prepOrders = merchantOrders.filter((o) => o.status === 'PREPARING');
  const readyOrders = merchantOrders.filter((o) => o.status === 'READY');
  const inDeliveryOrders = merchantOrders.filter((o) =>
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
  const completedOrders = merchantOrders.filter((o) => o.status === 'COMPLETED');
  const rejectedOrders = merchantOrders.filter(
    (o) => o.status === 'REJECTED' || o.status === 'CANCELLED'
  );

  const handleConfirmReject = async (orderId: string) => {
    await rejectOrder(orderId, rejectReason);
    setRejectingOrderId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* DEMO MERCHANT ACCOUNT SELECTOR — DEMO-ONLY */}
      <div
        id="demo-merchant-selector-card"
        className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 p-4 sm:p-5 shadow-xl space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-['Cairo']">
                  حساب التاجر للتجربة
                </h2>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                  Demo Merchant Simulator
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                تبديل متجر العرض التوضيحي لمحاكاة الطلبات والعمليات بعزل أمني مستقل
              </p>
            </div>
          </div>

          {/* Current Selected Merchant Display */}
          <div
            id="current-demo-merchant-indicator"
            className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-2 rounded-xl border border-emerald-500/30 self-start sm:self-auto shrink-0 shadow-inner"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                حساب التاجر الحالي:
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-['Cairo']">
                {currentOption.shortName}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <label
            htmlFor="demo-merchant-account-select"
            className="text-xs font-bold text-slate-300 shrink-0"
          >
            حساب التاجر للتجربة:
          </label>
          <select
            id="demo-merchant-account-select"
            value={currentMerchantId}
            onChange={(e) => switchDemoMerchant(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 font-medium outline-none transition-all cursor-pointer shadow-sm"
          >
            {DEMO_MERCHANT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-white py-1">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile & Touch-Friendly Quick Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
          {DEMO_MERCHANT_OPTIONS.map((opt) => {
            const isSelected = opt.id === currentMerchantId;
            return (
              <button
                key={opt.id}
                type="button"
                id={`demo-merchant-chip-${opt.id}`}
                onClick={() => switchDemoMerchant(opt.id)}
                className={`p-2.5 rounded-xl text-right transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-950/60 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{opt.id}</span>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-100 truncate">{opt.shortName}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.nameEn}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Merchant Identity & Metrics Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#122b27] border border-emerald-900/60 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                بوابة التاجر • إدارة دورة حياة الطلبات الموحدة
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {orders.length} طلبات مسجلة بالنظام
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              {currentMerchant.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {currentMerchant.address} • متصل مباشرة بمنصة 3al-BaB (عالباب) للإيداع بالصناديق الذكية
            </p>
          </div>

          {/* Quick Metrics Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">طلبات جديدة</span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {pendingOrders.length} طلبات
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">قيد التحضير</span>
              <span className="font-mono text-blue-400 font-bold text-sm">
                {acceptedOrders.length + prepOrders.length} طلبات
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">جاهزة للتسليم</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                {readyOrders.length} طلبات
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-slate-400 text-[10px] block">مكتملة ومودعة</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {completedOrders.length} طلبات
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Operations Pipeline vs Customer Chats */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setDashboardTab('PIPELINE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            dashboardTab === 'PIPELINE'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>طابور عمليات التجهيز والتسليم الميداني</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/20">
            {pendingOrders.length + acceptedOrders.length + prepOrders.length + readyOrders.length}
          </span>
        </button>

        <button
          onClick={() => setDashboardTab('CHATS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            dashboardTab === 'CHATS'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>محادثات العملاء والطلبات المباشرة</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
            {merchantConversations.length} نشطة
          </span>
        </button>
      </div>

      {/* Customer Chats Panel */}
      {dashboardTab === 'CHATS' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                محادثات العملاء وتأكيد الطلبات وبوالص التسليم
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              بوابة التاجر • ربط مباشر بالصندوق الذكي
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
            {/* Conversations List */}
            <div className="border-b md:border-b-0 md:border-l border-slate-800 p-3 space-y-2 bg-slate-950/40">
              <span className="text-[11px] font-bold text-slate-400 block px-1">
                المحادثات النشطة:
              </span>
              {merchantConversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  لا توجد محادثات مسجلة لهذا المتجر حالياً.
                </div>
              ) : (
                merchantConversations.map((c) => {
                  const isSelected = activeConversation?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversation(c)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{c.customerName || 'عميل'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.lastMessageAt}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-1">{c.lastMessage}</p>
                      {c.orderId && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                          طلب #{c.orderId}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Body & Actions */}
            <div className="md:col-span-2 flex flex-col justify-between bg-slate-900/90">
              {/* Header Info */}
              {activeConversation && (
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-white block">
                      {activeConversation.customerName || 'أحمد مصطفى'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      معرّف المحادثة: {activeConversation.id} • الطلب المرتبط:{' '}
                      {activeConversation.orderId ? `#${activeConversation.orderId}` : 'لا يوجد طلب مرتبط'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Merchant Confirm Button - visible only when an order is actually attached */}
                    {activeConversation.orderId && (
                      <button
                        onClick={() => confirmOrderByMerchant(activeConversation.orderId)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تأكيد وقبول الطلب من المتجر</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Container */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[380px]">
                {activeConvMessages.map((m) => {
                  const isMerchant = m.senderRole === 'MERCHANT';
                  const isDriver = m.senderRole === 'DRIVER';
                  const isSystem = m.senderRole === 'ADMIN' || m.messageType === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="text-center my-2">
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium">
                          {m.text}
                        </span>
                      </div>
                    );
                  }

                  if (m.messageType === 'PROOF_OF_DELIVERY') {
                    return (
                      <div key={m.id} className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            توثيق التسليم الميداني (POD) من المندوب
                          </span>
                          <span className="font-mono text-[10px]">{m.timestamp}</span>
                        </div>
                        {m.imageUrl && (
                          <div className="relative h-36 rounded-lg overflow-hidden bg-slate-950 border border-emerald-800">
                            <img src={m.imageUrl} alt="POD" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                              الوزن: 1.4 كجم • الحجيرة: 01
                            </div>
                          </div>
                        )}
                        <p className="text-[11px] leading-relaxed">{m.text}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMerchant ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1.5 ${
                          isMerchant
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : isDriver
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-75">
                          <span>{isMerchant ? 'أنت (التاجر)' : isDriver ? 'المندوب' : 'العميل'}</span>
                          <span className="font-mono">{m.timestamp}</span>
                        </div>

                        {m.messageType === 'HANDWRITTEN_ORDER' && (
                          <div className="p-2 rounded-lg bg-black/20 space-y-1">
                            <span className="font-bold text-[10px] flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              طلب مكتوب بخط اليد:
                            </span>
                            {m.imageUrl && (
                              <img src={m.imageUrl} alt="Handwritten order" className="rounded max-h-28 object-cover" />
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-400 shrink-0">ردود سريعة:</span>
                  {merchantQuickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMerchantReply(reply)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 transition-colors cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={merchantReplyText}
                    onChange={(e) => setMerchantReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && merchantReplyText.trim()) {
                        sendMerchantReply(merchantReplyText.trim());
                        setMerchantReplyText('');
                      }
                    }}
                    placeholder="اكتب رد المتجر على العميل..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-['Cairo']"
                  />
                  <button
                    onClick={() => {
                      if (merchantReplyText.trim()) {
                        sendMerchantReply(merchantReplyText.trim());
                        setMerchantReplyText('');
                      }
                    }}
                    disabled={!merchantReplyText.trim()}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white transition-colors"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4-Column Interactive Operations Pipeline */}
      {dashboardTab === 'PIPELINE' && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              طابور عمليات التجهيز والتسليم الميداني للأسطول
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pendingOrders.length + acceptedOrders.length + prepOrders.length + readyOrders.length} طلبات داخل المتجر
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: New Orders (PENDING) */}
          <div className="space-y-3 p-3 rounded-2xl bg-slate-900/60 border border-amber-900/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                طلبات جديدة (PENDING) ({pendingOrders.length})
              </span>
              <span className="text-[10px] text-amber-300/80">قبول / رفض</span>
            </div>

            <div className="space-y-2.5">
              {pendingOrders.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  لا توجد طلبات جديدة معلقة
                </div>
              ) : (
                pendingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 hover:border-amber-400 transition-all space-y-2.5 text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">#{ord.id}</span>
                      <span className="font-mono text-cyan-400 font-bold">{ord.total} ج.م</span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-slate-200 font-medium line-clamp-1">
                        {ord.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        العميل: <span className="text-white font-semibold">{ord.customerName}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        الصندوق المستهدف:{' '}
                        <span className="text-cyan-300 font-bold">{ord.smartBoxId}</span> (حجيرة{' '}
                        {ord.compartmentSize})
                      </p>
                    </div>

                    {rejectingOrderId === ord.id ? (
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <select
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full p-1.5 rounded-lg bg-slate-900 border border-rose-800 text-[11px] text-rose-200 focus:outline-none"
                        >
                          <option value="عدم توفر الصنف في المخزون حالياً">عدم توفر الصنف في المخزون</option>
                          <option value="ضغط تشغيلي مؤقت بالفرع">ضغط تشغيلي مؤقت بالفرع</option>
                          <option value="تعذر تأكيد الحجيرة المطلوبة">تعذر تأكيد الحجيرة المطلوبة</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmReject(ord.id)}
                            className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                          >
                            تأكيد الرفض
                          </button>
                          <button
                            onClick={() => setRejectingOrderId(null)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                        <button
                          onClick={() => acceptOrder(ord.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>قبول الطلب</span>
                        </button>
                        <button
                          onClick={() => markOrderPreparing(ord.id)}
                          className="py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                          title="استلمت الطلب وبدء التجهيز فوراً"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>استلمت الطلب</span>
                        </button>
                        <button
                          onClick={() => setRejectingOrderId(ord.id)}
                          className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                          title="رفض الطلب"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Preparation (ACCEPTED -> PREPARING) */}
          <div className="space-y-3 p-3 rounded-2xl bg-slate-900/60 border border-blue-900/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                قيد التجهيز والتغليف ({acceptedOrders.length + prepOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">تجهيز / فحص</span>
            </div>

            <div className="space-y-2.5">
              {acceptedOrders.length === 0 && prepOrders.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  لا توجد طلبات قيد التجهيز
                </div>
              ) : (
                <>
                  {/* Accepted but not yet preparing */}
                  {acceptedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-blue-700/60 transition-all space-y-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">#{ord.id}</span>
                        <span className="text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                          تم القبول
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-slate-200 font-medium line-clamp-1">{ord.items[0]?.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          العميل: {ord.customerName} • {ord.smartBoxId}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => markOrderPreparing(ord.id)}
                          className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>استلمت الطلب • بدء التجهيز والتغليف</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Preparing */}
                  {prepOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/60 transition-all space-y-2.5 text-xs shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-mono">#{ord.id}</span>
                        <span className="text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
                          جاري التجهيز
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-slate-200 font-medium line-clamp-1">{ord.items[0]?.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          فحص السيريال نمبر ووضع كود التتبع
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <button
                          onClick={() => markOrderReady(ord.id)}
                          className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اكتمال التجهيز (الطلب جاهز)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Column 3: Ready for Driver (READY -> ASSIGNED_TO_DRIVER) */}
          <div className="space-y-3 p-3 rounded-2xl bg-slate-900/60 border border-cyan-900/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                جاهزة للتسليم للمندوب ({readyOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">إسناد للمندوب</span>
            </div>

            <div className="space-y-2.5">
              {readyOrders.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  لا توجد طلبات بانتظار المندوب
                </div>
              ) : (
                readyOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-2.5 text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">#{ord.id}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        جاهز للتسليم
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-300 line-clamp-1">{ord.items[0]?.name}</p>
                      <p className="text-[10px] text-slate-400">
                        الصندوق:{' '}
                        <span className="text-cyan-300 font-bold">{ord.smartBoxId}</span> • الحجيرة{' '}
                        {ord.compartmentSize}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handOverToDriver(ord.id)}
                        className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>تسليم الشحنة وإسناد للمندوب</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 4: In Transit / Delivered (Live Tracking & Completed) */}
          <div className="space-y-3 p-3 rounded-2xl bg-slate-900/60 border border-emerald-900/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                الميدان والإيداع بالصندوق ({inDeliveryOrders.length + completedOrders.length})
              </span>
              <span className="text-[10px] text-slate-400">تتبع حي</span>
            </div>

            <div className="space-y-2.5">
              {inDeliveryOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">#{ord.id}</span>
                    <span className="text-[10px] text-cyan-300 font-mono font-bold">
                      {ord.driverName || 'إسلام عامر'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    الصندوق: <span className="text-cyan-400 font-bold">{ord.smartBoxId}</span>
                  </p>
                  <p className="text-[10px] text-cyan-400 font-medium">
                    الحالة: {ord.status}
                  </p>
                </div>
              ))}

              {completedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-emerald-800/80 space-y-1.5 text-xs shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">#{ord.id}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      تم الإيداع بنجاح
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    تم التوثيق بالصندوق: {ord.completedAt || ord.actualDeliveryTime || 'مكتمل'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Target Smart Box Compartment Monitor */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              مراقبة الصناديق الذكية المستهدفة وحالة الحجيرات
            </h3>
          </div>
          <span className="text-xs text-slate-400">تحديث فوري عبر بروتوكول MQTT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {boxes.slice(0, 2).map((b) => (
            <div key={b.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{b.id} ({b.area})</span>
                <span className="text-[10px] text-emerald-400 font-mono">متصل 4G</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                {b.compartments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2 rounded-lg border ${
                      c.status === 'RESERVED' || c.status === 'OCCUPIED'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>{c.id} ({c.size})</div>
                    <div className="text-[9px] mt-0.5">{c.status}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
