/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  ArrowRight,
  Store,
  User,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  Camera,
  Truck,
  ShieldCheck,
  ChevronLeft,
  Check,
  Package,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { MessageType } from '../../types';
import { getQuickRepliesForMerchant } from '../../utils/quickReplies';

export const CustomerChat: React.FC = () => {
  const {
    activeConversation,
    chatMessages,
    merchants,
    orders,
    products,
    selectedMerchantId,
    setSelectedMerchantProfileId,
    setCustomerView,
    sendChatMessage,
    sendMerchantReply,
    confirmOrderByCustomer,
    confirmOrderByMerchant,
    createOrderForMerchant,
    getMerchantDraft,
    saveMerchantDraft,
    authorizations,
    setActiveOrderId,
    openMerchantChat,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [senderMode, setSenderMode] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute active merchant: prioritize selected merchant, then conversation merchant, never hardcoded
  const merchant =
    merchants.find((m) => m.id === selectedMerchantId) ||
    merchants.find((m) => m.id === activeConversation?.merchantId) ||
    merchants[0];

  // Auto-sync conversation when selected merchant changes
  useEffect(() => {
    if (merchant && activeConversation?.merchantId !== merchant.id) {
      openMerchantChat(merchant.id);
    }
  }, [merchant.id, activeConversation?.merchantId, openMerchantChat]);

  // Merchant-specific products
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  // Linked order: MUST be strictly scoped to this merchant. Never leak another merchant's order (e.g. TW-1001) into this chat
  const linkedOrder = orders.find(
    (o) => o.merchantId === merchant.id && (activeConversation?.orderId ? o.id === activeConversation.orderId : true)
  );

  // Filter messages to strictly guarantee ONLY the active conversation's messages are displayed
  const activeChatMessages = chatMessages.filter(
    (m) => m.conversationId === activeConversation?.id
  );

  // Restore merchant-specific draft input
  useEffect(() => {
    const draft = getMerchantDraft(merchant.id);
    if (draft?.inputText !== undefined) {
      setInputText(draft.inputText);
    } else {
      setInputText('');
    }
  }, [merchant.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    saveMerchantDraft(merchant.id, { inputText: text });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    if (senderMode === 'CUSTOMER') {
      await sendChatMessage(textToSend, 'TEXT');
    } else {
      await sendMerchantReply(textToSend, 'TEXT');
    }
    setInputText('');
    saveMerchantDraft(merchant.id, { inputText: '' });
  };

  // Determine merchant category/type for contextual presets
  const isRestaurant =
    merchant.category.includes('مطاعم') ||
    merchant.category.includes('مأكولات') ||
    merchant.id === 'merch-5';

  const isPharmacy =
    merchant.category.includes('صيدليات') ||
    merchant.category.includes('طبية') ||
    merchant.id === 'merch-2';

  const isElectronics =
    merchant.category.includes('إلكترونيات') ||
    merchant.category.includes('أجهزة') ||
    merchant.id === 'merch-1';

  const isSupermarket =
    merchant.category.includes('سوبرماركت') ||
    merchant.category.includes('مؤن') ||
    merchant.id === 'merch-3';

  const isClothing =
    merchant.category.includes('أزياء') ||
    merchant.category.includes('ملابس') ||
    merchant.category.includes('موضة') ||
    merchant.id === 'merch-4';

  const quickReplies = getQuickRepliesForMerchant(merchant);

  // Dynamic context-aware presets
  const quickCustomerPresetLabel = isRestaurant
    ? '🍔 طلب وجبة شاورما وبطاطس'
    : isPharmacy
    ? '💊 طلب مستلزمات طبية وفيتامينات'
    : isClothing
    ? '👗 استفسار عن مقاس وتوفر أزياء'
    : isElectronics
    ? '⚡ طلب شاحن وسماعة بلوتوث'
    : isSupermarket
    ? '🛒 طلب سلة مؤن وبن فاخر'
    : `📦 طلب منتجات من ${merchant.name}`;

  const quickCustomerPresetText = isRestaurant
    ? 'عايز 2 شاورما وواحد بطاطس والتوصيل للصندوق الذكي BOX-102'
    : isPharmacy
    ? 'مرحباً دكتور، أحتاج فيتامين C فوار وجهاز قياس الضغط والتوصيل للصندوق الذكي BOX-102'
    : isClothing
    ? 'مرحباً، هل المقاس واللون متوفران في المتجر والتوصيل للصندوق الذكي BOX-102؟'
    : isElectronics
    ? 'مرحباً، هل متوفر شاحن أنكر 65W وسماعة ساوند كور والتوصيل للصندوق الذكي BOX-102؟'
    : isSupermarket
    ? 'عايز سلة مؤن غذائية أساسية وبن برازيلي مطحون والتوصيل للصندوق الذكي BOX-102'
    : `مرحباً، أرغب بطلب مستلزمات من ${merchant.businessName || merchant.name} والتوصيل للصندوق الذكي BOX-102`;

  const handwrittenLabel = isPharmacy ? '📝 روشتة طبية بخط اليد' : '📝 إرسال طلب بخط اليد';

  const handwrittenText = isRestaurant
    ? '📝 طلب مكتوب بخط اليد:\n- 2 شاورما لحم سوري سوبر\n- 1 بطاطس مقلية كريسبي\n- التوصيل إلى الصندوق الذكي BOX-102 (حجيرة 01)'
    : isPharmacy
    ? '📝 روشتة طبية بخط اليد:\n- فيتامين C + زنك أقراص فوارة\n- جهاز قياس ضغط الدم الرقمي الأوتوماتيكي\n- حقيبة إسعافات أولية منزلية\n- التوصيل إلى الصندوق الذكي BOX-102 (حجيرة 01)'
    : isClothing
    ? '📝 قائمة مقاسات وموديلات:\n- قميص أكسفورد كاجوال كحلي مقاس L\n- بنطلون تشينو بيج مقاس 34\n- التوصيل إلى الصندوق الذكي BOX-102'
    : isElectronics
    ? '📝 قائمة مستلزمات تقنية:\n- شاحن أنكر نانو 65W GaN\n- كابل تايب سي مجدول 2م\n- سماعة Soundcore بلوتوث\n- التوصيل إلى الصندوق الذكي BOX-102'
    : isSupermarket
    ? '📝 قائمة مشتريات تموينية:\n- سلة مؤن غذائية أساسية\n- بن برازيلي فاخر 500 جم\n- التوصيل إلى الصندوق الذكي BOX-102'
    : `📝 طلب أصناف بخط اليد:\n- منتجات ومستلزمات مختارة\n- التوصيل إلى الصندوق الذكي BOX-102`;

  const handwrittenImage = isPharmacy
    ? 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    : isRestaurant
    ? 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80'
    : 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80';

  const merchantAdjustmentLabel = isRestaurant
    ? '🏪 رد المطعم: استبدال بالكول سلو'
    : isPharmacy
    ? '🏥 رد الصيدلية: توفر الأدوية والتعقيم'
    : isClothing
    ? '👗 رد المتجر: تأكيد توفر المقاس'
    : isElectronics
    ? '🔌 رد المتجر: الضمان والجاهزية'
    : isSupermarket
    ? '🏪 رد الهايبرماركت: جاهزية التعبئة'
    : '🏪 رد المتجر: تأكيد توفر الأصناف';

  const merchantAdjustmentText = isRestaurant
    ? 'أهلاً بك يا فندم! البطاطس خلصت، ممكن نستبدلها بكول سلو إضافي؟'
    : isPharmacy
    ? 'أهلاً بك يا فندم! الأدوية والمستلزمات الطبية متوفرة وجاهزة، وتم تعقيم العبوة بالكامل قبل الإيداع بالصندوق.'
    : isClothing
    ? 'أهلاً بك يا فندم! المقاس المطلوب واللون متوفران في المخزون وتم فحص القطعة وتجهيزها للتسليم.'
    : isElectronics
    ? 'أهلاً بك يا فندم! الأجهزة أصلية مع ضمان سنتين معتمد وتم تجهيزها للتسليم للمندوب فوراً.'
    : isSupermarket
    ? 'أهلاً بك! تم تجهيز طلبك وتعبئته بأكياس مخصصة للإيداع الآمن بالصندوق الذكي.'
    : `أهلاً بك يا فندم! الأصناف متوفرة وجاهزة للتجهيز والإيداع بالصندوق فور اعتمادك.`;

  const customerAgreementLabel = '👍 موافقة العميل والتوصيل للصندوق';
  const customerAgreementText = isPharmacy
    ? 'موافق ومعتمد، برجاء إيداع الطرد بالحجيرة المبردة بالصندوق الذكي BOX-102'
    : 'موافق، ومحتاج التوصيل للصندوق الذكي BOX-102';

  const handleSendHandwrittenOrder = async () => {
    await sendChatMessage(handwrittenText, 'HANDWRITTEN_ORDER', handwrittenImage);
  };

  const handleSendQuickCustomerPreset = async () => {
    await sendChatMessage(quickCustomerPresetText, 'TEXT');
  };

  const handleSendMerchantAdjustment = async () => {
    await sendMerchantReply(merchantAdjustmentText, 'TEXT');
  };

  const handleSendCustomerAgreement = async () => {
    await sendChatMessage(customerAgreementText, 'TEXT');
  };

  const handleCustomerConfirm = async () => {
    let orderToConfirm = linkedOrder;
    if (!orderToConfirm) {
      orderToConfirm = await createOrderForMerchant(merchant.id);
    }
    await confirmOrderByCustomer(orderToConfirm.id, merchant.id);
  };

  const handleMerchantConfirm = async () => {
    let orderToConfirm = linkedOrder;
    if (!orderToConfirm) {
      orderToConfirm = await createOrderForMerchant(merchant.id);
    }
    await confirmOrderByMerchant(orderToConfirm.id, merchant.id);
  };

  const bothConfirmed = Boolean(linkedOrder?.customerConfirmed && linkedOrder?.merchantConfirmed);
  const activeAuth = authorizations.find(
    (a) => a.orderId === linkedOrder?.id && a.status === 'ACTIVE'
  );

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeAuth || !activeAuth.expiresAtTimestamp) {
      setRemainingSeconds(0);
      return;
    }
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeAuth.expiresAtTimestamp! - now) / 1000));
      setRemainingSeconds(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeAuth?.expiresAtTimestamp, activeAuth?.status]);

  const formatRemainingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedMerchantProfileId(merchant.id);
            setCustomerView('MERCHANT_PROFILE');
          }}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لملف {merchant.name}</span>
        </button>

        <div className="flex items-center gap-2">
          {linkedOrder && (
            <button
              onClick={() => {
                setActiveOrderId(linkedOrder.id);
                setCustomerView('TRACKING');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>تتبع الشحنة بالصندوق #{linkedOrder.id}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setCustomerView('MERCHANT_LIST')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تغيير المتجر</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
        {/* Chat Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              <img
                src={
                  merchant.ownerPhoto ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                }
                alt={merchant.businessName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 font-['Cairo']">
                  {merchant.businessName || merchant.name}
                </h3>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {merchant.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                المالك: {merchant.ownerName} • {merchant.workingHours}
              </p>
            </div>
          </div>

          {/* Confirmation Status Badges */}
          <div className="flex items-center gap-2 text-xs">
            {linkedOrder ? (
              <>
                <div
                  className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold text-[11px] ${
                    linkedOrder.customerConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {linkedOrder.customerConfirmed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تأكيد العميل ✓</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>بانتظار تأكيد العميل</span>
                    </>
                  )}
                </div>

                <div
                  className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold text-[11px] ${
                    linkedOrder.merchantConfirmed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {linkedOrder.merchantConfirmed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>تأكيد المتجر ✓</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>بانتظار تأكيد المتجر</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <span className="text-[11px] font-medium bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-xl">
                محادثة مباشرة • لا يوجد طلب مرتبط بعد
              </span>
            )}
          </div>
        </div>

        {/* Merchant Products / Menu Quick-Selection Strip */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>منتجات وقائمة {merchant.name}:</span>
          </span>
          {merchantProducts.length === 0 ? (
            <span className="text-[11px] text-slate-400">لا توجد منتجات مسجلة حالياً لهذا المتجر</span>
          ) : (
            merchantProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  const messageText = `أرغب بطلب: ${p.name} (${p.price} ج.م)`;
                  setInputText(messageText);
                  saveMerchantDraft(merchant.id, { inputText: messageText });
                }}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] font-medium text-slate-700 transition-all shadow-xs"
                title={`انقر لتجهيز رسالة طلب ${p.name}`}
              >
                <span>{p.name}</span>
                <span className="font-mono font-bold text-blue-600">{p.price} ج.م</span>
              </button>
            ))
          )}
        </div>

        {/* Error Notification if OTP generation fails */}
        {otpError && (
          <div className="bg-red-50 border-b border-red-200 p-3 px-5 flex items-center justify-between text-red-800 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{otpError}</span>
            </div>
            <button
              onClick={() => setOtpError(null)}
              className="text-red-500 hover:text-red-700 text-xs px-2 py-0.5 rounded font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Active Delivery Authorization Card (Section 4) */}
        {activeAuth && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 px-5 border-b border-blue-600/40 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-300 font-['Cairo']">
                      تم إصدار تصريح التوصيل
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      تصريح نشط (Authorization Active)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    تم إنشاء تصريح فتح الصندوق الذكي وتجهيز قناة التوثيق المشفرة للمندوب.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                    <span>رقم الطلب: <strong className="text-white font-mono">#{linkedOrder?.id}</strong></span>
                    <span>•</span>
                    <span>الصندوق الذكي: <strong className="text-amber-300 font-mono">{activeAuth.smartBoxId}</strong></span>
                    <span>•</span>
                    <span>الحجيرة: <strong className="text-cyan-300 font-mono">{activeAuth.compartmentId}</strong></span>
                    <span>•</span>
                    <span>المندوب: <strong className="text-white">{activeAuth.driverName || 'إسلام عامر'}</strong></span>
                    <span>•</span>
                    <span>صلاحية التصريح: <strong className="text-amber-300">5 دقائق</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60">
                <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-700 text-center">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>الوقت المتبقي</span>
                  </div>
                  <div className="text-base font-mono font-bold text-amber-400">
                    {formatRemainingTime(remainingSeconds)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (linkedOrder) setActiveOrderId(linkedOrder.id);
                    setCustomerView('TRACKING');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>متابعة التوصيل</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Status & Confirmation Banners */}
        {linkedOrder ? (
          <>
            {bothConfirmed && !activeAuth && (
              <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold block">
                      تم تأكيد الطلب #{linkedOrder.id} بنجاح من العميل والمتجر! 🎉
                    </span>
                    <span className="text-emerald-100 text-[11px]">
                      الصندوق: {linkedOrder.smartBoxId || 'BOX-102'} • الحجيرة: {linkedOrder.compartmentId || '01'} • سيصلك إشعار أمني فور وصول المندوب لمنحه إذن الفتح المؤقت.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (linkedOrder) setActiveOrderId(linkedOrder.id);
                    setCustomerView('TRACKING');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>تتبع الشحنة</span>
                </button>
              </div>
            )}

            {!bothConfirmed && !activeAuth && (
              <div className="bg-amber-50/90 border-b border-amber-200/80 p-3 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">طلب #{linkedOrder.id} قيد الاعتماد من الطرفين</span>
                    <span className="text-amber-700 text-[11px] block sm:inline sm:mr-2">
                      (يتطلب تأكيد الطرفين لبدء تجهيز وانطلاق المندوب نحو الصندوق الذكي)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] shrink-0 font-medium">
                  <span className={`px-2 py-0.5 rounded-md ${linkedOrder.customerConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                    {linkedOrder.customerConfirmed ? 'العميل: مؤكد ✓' : 'العميل: غير مؤكد'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md ${linkedOrder.merchantConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                    {linkedOrder.merchantConfirmed ? 'المتجر: مؤكد ✓' : 'المتجر: غير مؤكد'}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-blue-50/90 border-b border-blue-200/80 p-3 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">محادثة طلب مباشر مع {merchant.businessName || merchant.name}</span>
                <span className="text-blue-700 text-[11px] block sm:inline sm:mr-2">
                  (يمكنك تنسيق الطلب مع المتجر مباشرةً ثم النقر على &quot;إنشاء وتأكيد طلب جديد&quot; لحجز الحجيرة)
                </span>
              </div>
            </div>

            <button
              onClick={handleCustomerConfirm}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>إنشاء وتأكيد طلب جديد</span>
            </button>
          </div>
        )}

        {/* Message Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {activeChatMessages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                ابدأ المحادثة مع {merchant.businessName || merchant.name}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isPharmacy
                  ? 'يمكنك إرسال الروشتة الطبية، الاستفسار عن الأدوية والمستلزمات، وطلب التوصيل بالصندوق الذكي.'
                  : isRestaurant
                  ? 'يمكنك كتابة طلبك، إرسال صورة مكتوبة بخط اليد، أو الاستفسار عن المنيو والتوصيل المباشر.'
                  : 'يمكنك كتابة طلبك، الاستفسار عن توفر المنتجات، والتوصيل المباشر إلى صندوقك الذكي.'}
              </p>
            </div>
          ) : (
            activeChatMessages.map((msg) => {
              const isCustomer = msg.senderRole === 'CUSTOMER';
              const isMerchant = msg.senderRole === 'MERCHANT';
              const isDriver = msg.senderRole === 'DRIVER';
              const isSystem = msg.senderRole === 'ADMIN' || msg.messageType === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-medium text-center">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              if (msg.messageType === 'PROOF_OF_DELIVERY') {
                return (
                  <div key={msg.id} className="max-w-md mx-auto my-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 shadow-md space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        إثبات التسليم الميداني (POD) من المندوب
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700">{msg.timestamp}</span>
                    </div>

                    {msg.imageUrl && (
                      <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-emerald-200">
                        <img
                          src={msg.imageUrl}
                          alt="إثبات التسليم POD"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-mono">
                          وزن الطرد: 1.4 كجم • الحجيرة: 01
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                      {msg.text}
                    </p>

                    <div className="p-2 rounded-lg bg-white border border-emerald-200 text-[10px] font-mono text-emerald-800 flex items-center justify-between">
                      <span>التشفير العتادي: SHA-256</span>
                      <span className="text-emerald-600 font-bold">موثق عتادياً بالصندوق الذكي ✓</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${
                    isCustomer ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isCustomer
                        ? 'bg-blue-600 text-white'
                        : isDriver
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isCustomer ? <User className="w-4 h-4" /> : isDriver ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 space-y-2 text-xs shadow-sm ${
                      isCustomer
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75">
                      <span className="font-semibold">
                        {isCustomer ? 'أحمد مصطفى (أنت)' : isDriver ? 'إسلام عامر (المندوب)' : (merchant.businessName || merchant.name)}
                      </span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>

                    {/* Handwritten Order Preview Card */}
                    {msg.messageType === 'HANDWRITTEN_ORDER' && (
                      <div className="p-2.5 rounded-xl bg-slate-900/10 border border-current/20 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isPharmacy ? 'روشتة طبية بخط اليد:' : 'صورة طلب مكتوب بخط اليد:'}</span>
                        </div>
                        {msg.imageUrl && (
                          <div className="rounded-lg overflow-hidden h-32 bg-slate-800">
                            <img
                              src={msg.imageUrl}
                              alt="طلب بخط اليد"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text content */}
                    {msg.text && (
                      <p className="whitespace-pre-line leading-relaxed font-['Cairo']">
                        {msg.text}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Buttons for the Conversation Flow */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">
              إجراءات سريعة لمسار الطلب الميداني:
            </span>
            {/* Interactive Sender Toggle */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px]">
              <span className="text-slate-400 px-1">المحاكاة:</span>
              <button
                type="button"
                onClick={() => setSenderMode('CUSTOMER')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  senderMode === 'CUSTOMER'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                العميل 👤
              </button>
              <button
                type="button"
                onClick={() => setSenderMode('MERCHANT')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  senderMode === 'MERCHANT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التاجر 🏪
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={handleSendQuickCustomerPreset}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <span>{quickCustomerPresetLabel}</span>
            </button>

            <button
              onClick={handleSendHandwrittenOrder}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <span>{handwrittenLabel}</span>
            </button>

            <button
              onClick={handleSendMerchantAdjustment}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <span>{merchantAdjustmentLabel}</span>
            </button>

            <button
              onClick={handleSendCustomerAgreement}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <span>{customerAgreementLabel}</span>
            </button>

            {/* Confirmation Buttons */}
            {(!linkedOrder || !linkedOrder.customerConfirmed) && (
              <button
                onClick={handleCustomerConfirm}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>{linkedOrder ? 'تأكيد الطلب (العميل)' : 'إنشاء وتأكيد طلب جديد'}</span>
              </button>
            )}

            {linkedOrder && !linkedOrder.merchantConfirmed && (
              <button
                onClick={handleMerchantConfirm}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>تأكيد الطلب (التاجر)</span>
              </button>
            )}

            {/* Tracking link if order is confirmed */}
            {bothConfirmed && (
              <button
                onClick={() => {
                  if (linkedOrder) setActiveOrderId(linkedOrder.id);
                  setCustomerView('TRACKING');
                }}
                className="px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>تتبع الشحنة بالصندوق</span>
              </button>
            )}
          </div>

          {/* Category-based Quick Replies */}
          <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-slate-500 font-semibold text-[11px] shrink-0">
              ردود سريعة:
            </span>
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (senderMode === 'CUSTOMER') {
                    sendChatMessage(reply, 'TEXT');
                  } else {
                    sendMerchantReply(reply, 'TEXT');
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 text-[11px] font-medium shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              senderMode === 'CUSTOMER'
                ? `اكتب رسالتك إلى ${merchant.name}...`
                : `اكتب رد المتجر (${merchant.name}) على العميل...`
            }
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-['Cairo']"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-2xl text-white font-bold transition-all shadow-md cursor-pointer ${
              senderMode === 'CUSTOMER'
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300'
            }`}
            title="إرسال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
