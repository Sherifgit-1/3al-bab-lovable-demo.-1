/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CompartmentSize } from '../../types';
import {
  Box,
  Store,
  Check,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  MapPin,
  Tag,
  FileText,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';

export const CustomerCheckout: React.FC = () => {
  const {
    placeNewOrder,
    setCustomerView,
    boxes,
    cart,
    merchants,
    products,
    selectedMerchantId,
  } = useApp();

  const [selectedBoxId, setSelectedBoxId] = useState<string>('BOX-102');
  const [selectedSize, setSelectedSize] = useState<CompartmentSize>('M');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس، القاهرة'
  );
  const [deliveryNotes, setDeliveryNotes] = useState<string>(
    'يرجى إيداع الطرد بالحجيرة المحددة وإغلاق الباب بإحكام.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const merchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  // If cart is not empty, use cart items; otherwise use merchant's own products
  const items =
    cart.length > 0
      ? cart.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          specs: i.product.specs || i.product.category,
          quantity: i.quantity,
          price: i.product.price,
        }))
      : merchantProducts.length > 0
      ? merchantProducts.slice(0, 2).map((p) => ({
          id: p.id,
          name: p.name,
          specs: p.specs || p.category,
          quantity: 1,
          price: p.price,
        }))
      : [
          {
            id: `item-${merchant.id}-1`,
            name: `طلب معتمد من ${merchant.businessName || merchant.name}`,
            specs: merchant.category,
            quantity: 1,
            price: 150,
          },
        ];

  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const deliveryFee = 45;
  const promoDiscount = 45;
  const total = subtotal;

  const compartmentSizes: {
    id: CompartmentSize;
    name: string;
    dimensions: string;
    suitableFor: string;
    recommended?: boolean;
  }[] = [
    {
      id: 'S',
      name: 'صغيرة (S)',
      dimensions: '15 × 30 × 40 سم',
      suitableFor: 'مستندات، إلكترونيات مدمجة، أدوية',
    },
    {
      id: 'M',
      name: 'متوسطة (M)',
      dimensions: '25 × 40 × 40 سم',
      suitableFor: 'شواحن، هواتف، أجهزة لوحية، عطور',
      recommended: true,
    },
    {
      id: 'L',
      name: 'كبيرة (L)',
      dimensions: '40 × 45 × 50 سم',
      suitableFor: 'أجهزة لابتوب، أجهزة منزلية، ملابس',
    },
    {
      id: 'XL',
      name: 'كبيرة جداً (XL)',
      dimensions: '60 × 50 × 60 سم',
      suitableFor: 'طرود متعددة وشاشات مدمجة',
    },
  ];

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await placeNewOrder({
        items,
        compartmentSize: selectedSize,
        merchantId: merchant.id,
        deliveryAddress,
        deliveryNotes,
        smartBoxId: selectedBoxId,
      });
      setCustomerView('TRACKING');
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء حجز الحجيرة وتأكيد الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCustomerView(cart.length > 0 ? 'STORE' : 'HOME')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{cart.length > 0 ? 'العودة لمتجر التاجر' : 'العودة للرئيسية'}</span>
        </button>

        <span className="text-xs text-cyan-400 font-semibold bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/60">
          خطوة 2 من 2: تأكيد الطلب وحجز الحجيرة
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
          حجز الحجيرة الذكية وتأكيد الطلب
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          سيتم إرسال الطلب للمتجر وتوليد إذن فتح مؤقت للصندوق الذكي فور اعتماده.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items, Compartment Selection & Delivery Address */}
        <div className="lg:col-span-2 space-y-5">
          {/* Merchant & Order Items */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">{merchant.name}</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                إيداع آلي مباشر بالصندوق
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-800 text-cyan-300 text-[10px] font-bold flex items-center justify-center font-mono">
                        {item.quantity}×
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                    </div>
                    {item.specs && <p className="text-[10px] text-slate-400 mr-7">{item.specs}</p>}
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {(item.price * item.quantity).toLocaleString()} ج.م
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Delivery Address & Notes */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                تأكيد عنوان التوصيل والملاحظات
              </span>
              <span className="text-[11px] text-cyan-400">عنوان الصندوق المسجل</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عنوان التسليم:</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ملاحظات للمندوب والتوصيل:</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="أي تعليمات إضافية للمندوب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Target Smart Box Selector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-cyan-400" />
                حدد الصندوق الذكي المستهدف للإيداع
              </span>
              <span className="text-[11px] text-slate-400">صناديقك المعتمدة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {boxes.slice(0, 2).map((b) => {
                const isSelected = selectedBoxId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBoxId(b.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{b.id}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{b.location}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-emerald-400 font-mono">
                      <span>● متصل وآمن</span>
                      <span>• بطارية {b.batteryLevel}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compartment Size Selector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                حجم الحجيرة المطلوبة للطرد
              </span>
              <span className="text-[11px] text-slate-400">فحص تلقائي للأبعاد</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {compartmentSizes.map((comp) => {
                const isSelected = selectedSize === comp.id;
                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedSize(comp.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {comp.recommended && (
                      <span className="absolute -top-2 left-3 text-[10px] bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                        موصى به
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{comp.name}</span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                        {comp.dimensions}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {comp.suitableFor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Invoice and Confirmation */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
              ملخص الفاتورة والحجز
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>قيمة المشتريات ({items.length} أصناف)</span>
                <span className="font-mono text-slate-200">{subtotal.toLocaleString()} ج.م</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>رسوم التوصيل المباشر</span>
                <span className="font-mono line-through text-slate-500">{deliveryFee}.00 ج.م</span>
              </div>

              <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/60">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  خصم TAWSEEL_BOX (100%)
                </span>
                <span className="font-mono font-bold">-{promoDiscount}.00 ج.م</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm font-bold">
                <span className="text-white">الإجمالي النهائي</span>
                <span className="font-mono text-cyan-400 text-base">{total.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* Smart Box Guarantee note */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                حماية أمان متكاملة. لن يُفتح باب الحجيرة إلا بعد وصول المندوب المعتمد ومطابقة رمز التحقق
                OTP وفحص الوزن.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-[11px] text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="confirm-checkout-btn"
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{isSubmitting ? 'جاري حجز الحجيرة وإرسال الطلب...' : 'تأكيد وإرسال الطلب فورياً'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
