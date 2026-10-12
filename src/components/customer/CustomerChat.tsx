/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send,
  ArrowRight,
  Store,
  User,
  CheckCircle2,
  FileText,
  Sparkles,
  Camera,
  Truck,
  Check,
  Package,
  PlusCircle,
  ChevronLeft,
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
    selectedMerchantProfileId,
    setSelectedMerchantProfileId,
    setCustomerView,
    sendChatMessage,
    sendMerchantReply,
    confirmOrderByCustomer,
    confirmOrderByMerchant,
    createOrderForMerchant,
    getMerchantDraft,
    saveMerchantDraft,
    setActiveOrderId,
    openMerchantChat,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [senderMode, setSenderMode] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');

  // Compute active merchant: prioritize selected merchant, then conversation merchant
  const merchant =
    merchants.find((m) => m.id === selectedMerchantId) ||
    merchants.find((m) => m.id === activeConversation?.merchantId) ||
    (selectedMerchantProfileId ? merchants.find((m) => m.id === selectedMerchantProfileId) : undefined);

  // Auto-sync conversation when selected merchant changes
  useEffect(() => {
    if (merchant && activeConversation?.merchantId !== merchant.id) {
      openMerchantChat(merchant.id);
    }
  }, [merchant?.id, activeConversation?.merchantId, openMerchantChat]);

  // Merchant-specific products
  const merchantProducts = merchant ? products.filter((p) => p.merchantId === merchant.id) : [];

  // Linked order: MUST be strictly scoped to customerId + merchantId + orderId.
  // If activeConversation.orderId exists: load ONLY that exact order.
  // If conversation has NO orderId: do NOT select an arbitrary active order.
  const linkedOrder = useMemo(() => {
    if (!activeConversation?.orderId || !merchant) {
      return null;
    }
    const match = orders.find(
      (o) =>
        o.id === activeConversation.orderId &&
        (o.merchantId === merchant.id || (!o.merchantId && !merchant.id))
    );
    if (match) return match;
    const idMatch = orders.find((o) => o.id === activeConversation.orderId);
    if (idMatch && (idMatch.merchantId === merchant.id || activeConversation.merchantId === merchant.id)) {
      return idMatch;
    }
    return null;
  }, [orders, activeConversation?.orderId, activeConversation?.merchantId, merchant?.id]);

  const isOrderCompleted = linkedOrder?.status === 'COMPLETED';
  const hasActiveOrder = Boolean(linkedOrder && !isOrderCompleted);

  // Filter messages to strictly guarantee ONLY the active conversation's messages are displayed
  const activeChatMessages = chatMessages.filter(
    (m) => m.conversationId === activeConversation?.id
  );

  // Restore merchant-specific draft input
  useEffect(() => {
    if (!merchant) return;
    const draft = getMerchantDraft(merchant.id);
    if (draft?.inputText !== undefined) {
      setInputText(draft.inputText);
    } else {
      setInputText('');
    }
  }, [merchant?.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (merchant) {
      saveMerchantDraft(merchant.id, { inputText: text });
    }
  };

  // --- Natural Chat Scrolling (Part 1) ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesCountRef = useRef<number>(activeChatMessages.length);
  const activeConvIdRef = useRef<string | undefined>(activeConversation?.id);

  // Reset scroll state on conversation switch
  useEffect(() => {
    if (activeConversation?.id !== activeConvIdRef.current) {
      activeConvIdRef.current = activeConversation?.id;
      prevMessagesCountRef.current = 0;
      isNearBottomRef.current = true;
    }
  }, [activeConversation?.id]);

  const handleDesktopScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // User is near bottom if within 120px
    isNearBottomRef.current = distanceFromBottom < 120;
  };

  // Track window scroll for mobile natural document scrolling
  useEffect(() => {
    const handleMobileWindowScroll = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const distanceFromBottom = docHeight - (scrollY + windowHeight);
      isNearBottomRef.current = distanceFromBottom < 220;
    };

    window.addEventListener('scroll', handleMobileWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleMobileWindowScroll);
  }, []);

  useEffect(() => {
    const isNew = activeChatMessages.length > prevMessagesCountRef.current;
    const lastMsg = activeChatMessages[activeChatMessages.length - 1];
    const isSentByMe =
      lastMsg &&
      ((senderMode === 'CUSTOMER' && lastMsg.senderRole === 'CUSTOMER') ||
        (senderMode === 'MERCHANT' && lastMsg.senderRole === 'MERCHANT'));

    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    const container = scrollContainerRef.current;

    if (isDesktop && container) {
      if (prevMessagesCountRef.current === 0) {
        // Desktop: opening conversation -> show latest message inside container without jumping the whole page
        container.scrollTop = container.scrollHeight;
      } else if (isNew) {
        // Desktop: new message while near bottom or sent by me -> scroll container smoothly
        if (isNearBottomRef.current || isSentByMe) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
      }
    } else {
      // Mobile: normal document/page scrolling
      if (prevMessagesCountRef.current === 0) {
        // Mobile: opening conversation -> smoothly bring into view the latest message / composer
        const timer = setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }, 50);
        return () => clearTimeout(timer);
      } else if (isNew) {
        // Mobile: new message while near bottom or sent by me -> go to latest
        // If user is reading old messages -> do not force them to bottom
        if (isNearBottomRef.current || isSentByMe) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    prevMessagesCountRef.current = activeChatMessages.length;
  }, [activeChatMessages, senderMode]);

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
    if (merchant) {
      saveMerchantDraft(merchant.id, { inputText: '' });
    }
  };

  if (!merchant) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center rounded-3xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-4 shadow-xl">
        <Store className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white font-['Cairo']">لا يوجد متجر محدد للمحادثة</h3>
        <p className="text-xs text-slate-400">
          يرجى اختيار متجر من قائمة المتاجر المعتمدة لبدء التنسيق والمحادثة المباشرة.
        </p>
      </div>
    );
  }

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
    try {
      let orderToConfirm = linkedOrder;
      if (!orderToConfirm) {
        orderToConfirm = await createOrderForMerchant(merchant.id);
      }
      await confirmOrderByCustomer(orderToConfirm.id, merchant.id);
    } catch (err: any) {
      console.error('Error confirming order by customer:', err);
    }
  };

  const handleMerchantConfirm = async () => {
    try {
      let orderToConfirm = linkedOrder;
      if (!orderToConfirm) {
        orderToConfirm = await createOrderForMerchant(merchant.id);
      }
      await confirmOrderByMerchant(orderToConfirm.id, merchant.id);
    } catch (err: any) {
      console.error('Error confirming order by merchant:', err);
    }
  };

  const handleStartNewOrder = async () => {
    try {
      const newOrd = await createOrderForMerchant(merchant.id);
      await confirmOrderByCustomer(newOrd.id, merchant.id);
    } catch (err: any) {
      console.error('Error starting new order:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => {
            setSelectedMerchantProfileId(merchant.id);
            setCustomerView('MERCHANT_PROFILE');
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لملف {merchant.name}</span>
        </button>

        <button
          onClick={() => setCustomerView('MERCHANT_LIST')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">تغيير المتجر</span>
        </button>
      </div>

      {/* Main Chat Container - Real Mobile Chat Structure (Section 4) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Merchant / Conversation Header */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 sm:w-11 h-10 sm:h-11 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
              <img
                src={
                  merchant.ownerPhoto ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                }
                alt={merchant.businessName}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-500 border-2 border-white" />
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

          {/* Compact Order Status Badges */}
          <div className="flex items-center gap-2 text-xs">
            {linkedOrder ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">طلب #{linkedOrder.id}:</span>
                <span className="text-blue-700 font-bold">
                  {isOrderCompleted
                    ? 'تم التسليم بالصندوق ✓'
                    : linkedOrder.status === 'DRIVER_ARRIVED'
                    ? 'المندوب وصل للصندوق'
                    : linkedOrder.status === 'OUT_FOR_DELIVERY'
                    ? 'في الطريق للتسليم'
                    : linkedOrder.customerConfirmed
                    ? 'مؤكد من العميل'
                    : 'قيد التنسيق'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-xl">
                  لا يوجد طلب مرتبط
                </span>
                <button
                  type="button"
                  onClick={handleStartNewOrder}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  إنشاء طلب جديد
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Merchant Products / Menu Quick-Selection Strip */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-3.5 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>قائمة {merchant.name}:</span>
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
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[11px] font-medium text-slate-700 transition-all shadow-xs cursor-pointer"
                title={`انقر لتجهيز رسالة طلب ${p.name}`}
              >
                <span>{p.name}</span>
                <span className="font-mono font-bold text-blue-600">{p.price} ج.م</span>
              </button>
            ))
          )}
        </div>

        {/* Chat Messages Area - Responsive: Natural mobile page scroll, bounded scroll area on desktop */}
        <div
          ref={scrollContainerRef}
          onScroll={handleDesktopScroll}
          className="p-3.5 sm:p-6 space-y-4 bg-slate-50/50 md:min-h-[280px] md:max-h-[560px] md:overflow-y-auto md:overscroll-contain"
        >
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

          {/* Discreet Completed Order Delivery Summary Pill (Section 10) */}
          {isOrderCompleted && linkedOrder && (
            <div className="flex justify-center my-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ تم التسليم بنجاح — تم إيداع الشحنة وتأمين الصندوق وإكمال عملية التسليم.</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>

        {/* Quick Actions & Quick Replies Area (Section 4, 7, 9) */}
        <div className="p-2.5 sm:p-3 bg-slate-100 border-t border-slate-200 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="text-slate-500 font-semibold text-[11px]">
              إجراءات سريعة لمسار الطلب الميداني:
            </span>
            {/* Interactive Sender Toggle */}
            <div className="flex items-center gap-1 bg-white p-0.5 sm:p-1 rounded-xl border border-slate-200 text-[11px]">
              <span className="text-slate-400 px-1 text-[10px] sm:text-[11px]">المحاكاة:</span>
              <button
                type="button"
                onClick={() => setSenderMode('CUSTOMER')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] sm:text-[11px] cursor-pointer ${
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
                className={`px-2 py-0.5 rounded-lg font-bold transition-all text-[10px] sm:text-[11px] cursor-pointer ${
                  senderMode === 'MERCHANT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                التاجر 🏪
              </button>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
            <button
              onClick={handleSendQuickCustomerPreset}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{quickCustomerPresetLabel}</span>
            </button>

            <button
              onClick={handleSendHandwrittenOrder}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{handwrittenLabel}</span>
            </button>

            <button
              onClick={handleSendMerchantAdjustment}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{merchantAdjustmentLabel}</span>
            </button>

            <button
              onClick={handleSendCustomerAgreement}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{customerAgreementLabel}</span>
            </button>

            {/* Merchant-Specific Quick Action: Active Order Tracking (Section 9) */}
            {hasActiveOrder && linkedOrder && (
              <button
                onClick={() => {
                  setActiveOrderId(linkedOrder.id);
                  setCustomerView('TRACKING');
                }}
                className="shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>تتبع الشحنة بالصندوق #{linkedOrder.id}</span>
              </button>
            )}

            {/* Merchant-Specific Quick Action: Unconfirmed state buttons */}
            {hasActiveOrder && linkedOrder && !linkedOrder.customerConfirmed && (
              <button
                onClick={handleCustomerConfirm}
                className="shrink-0 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>تأكيد الطلب (العميل)</span>
              </button>
            )}

            {hasActiveOrder && linkedOrder && !linkedOrder.merchantConfirmed && (
              <button
                onClick={handleMerchantConfirm}
                className="shrink-0 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>تأكيد الطلب (التاجر)</span>
              </button>
            )}

            {/* Merchant-Specific Quick Action: No Active Order -> "إنشاء طلب جديد" (Section 9) */}
            {!linkedOrder && (
              <button
                onClick={handleCustomerConfirm}
                className="shrink-0 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إنشاء طلب جديد</span>
              </button>
            )}

            {/* Merchant-Specific Quick Action: Completed Order -> "إنشاء طلب جديد" & "عرض تفاصيل التسليم" (Section 9 & 10) */}
            {isOrderCompleted && (
              <>
                <button
                  onClick={handleStartNewOrder}
                  className="shrink-0 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إنشاء طلب جديد</span>
                </button>

                {linkedOrder && (
                  <button
                    onClick={() => {
                      setActiveOrderId(linkedOrder.id);
                      setCustomerView('TRACKING');
                    }}
                    className="shrink-0 px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>عرض تفاصيل التسليم (POD)</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Category-based Quick Replies Strip */}
          <div className="pt-1.5 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs scrollbar-none">
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

        {/* Message Composer (Section 4 & 8) */}
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              senderMode === 'CUSTOMER'
                ? `اكتب رسالتك إلى ${merchant.name}...`
                : `اكتب رد المتجر (${merchant.name}) على العميل...`
            }
            className="flex-1 px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-['Cairo'] text-slate-900"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-xl sm:rounded-2xl text-white font-bold transition-all shadow-md cursor-pointer shrink-0 ${
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
