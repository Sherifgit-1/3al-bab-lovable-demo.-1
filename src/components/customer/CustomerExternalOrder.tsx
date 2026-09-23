/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PackagePlus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  FileText,
  DollarSign,
  Truck,
  Box,
} from 'lucide-react';

export const CustomerExternalOrder: React.FC = () => {
  const { createExternalOrder, setCustomerView } = useApp();

  const [merchantName, setMerchantName] = useState('أمازون مصر (Amazon EG)');
  const [awbNumber, setAwbNumber] = useState('AMZ-EG-99831244');
  const [description, setDescription] = useState('ساعة ذكية وسماعات رياضية');
  const [value, setValue] = useState(850);
  const [phone, setPhone] = useState('+20 100 998 7766');
  const [date, setDate] = useState('اليوم، بين 2:00 م و 5:00 م');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const popularCouriers = [
    'أمازون مصر (Amazon EG)',
    'نون مصر (Noon EG)',
    'أرامكس (Aramex)',
    'دي إتش إل (DHL Express)',
    'جوميا مصر (Jumia)',
    'بي تك (B.TECH)',
    'متجر إلكتروني آخر',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createExternalOrder({
      merchantName,
      awbNumber,
      description,
      value: Number(value),
      phone,
      date,
    });
    setIsSubmitting(false);
    setCustomerView('HOME');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
      <button
        onClick={() => setCustomerView('HOME')}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للرئيسية</span>
      </button>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
          تسجيل شحنة من متجر خارجي (External Shipment)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          اربط شحنات أمازون أو نون أو أرامكس برقم البوليصة لتوليد تصريح إيداع مؤتمت لصندوقك الذكي.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Merchant / Courier */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              حدد المتجر أو شركة الشحن:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {popularCouriers.slice(0, 6).map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setMerchantName(c)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    merchantName === c
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* AWB Tracking number */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              رقم بوليصة الشحن أو التتبع (AWB Number):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="مثال: AMZ-EG-99831244"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 text-[10px]">
                قارئ الباركود مدعوم
              </span>
            </div>
          </div>

          {/* Description & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                وصف المحتويات:
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: إلكترونيات، ملابس، وثائق"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                القيمة التقريبية (ج.م):
              </label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Courier Phone & Delivery Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                رقم هاتف المندوب (إن توفر):
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                الموعد المتوقع لوصول الشحنة:
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Destination Box Indicator */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">الصندوق المستهدف لاستقبال الشحنة:</span>
            <span className="font-bold text-cyan-400 font-mono">BOX-102 (الفيلا 14 - التجمع الخامس)</span>
          </div>

          {/* Security Features Note */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>الإيداع الآمن للشحنات الخارجية:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              سيتلقى مندوب الشحن رسالة SMS برمز OTP صالح لمرة واحدة فور اقترابه من موقع الصندوق (Geofence)،
              وستوثق الكاميرا إيداع الطرد تلقائياً.
            </p>
          </div>

          {/* Submit CTA */}
          <button
            id="submit-external-order-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <PackagePlus className="w-4 h-4 fill-slate-950" />
            <span>{isSubmitting ? 'جاري التسجيل وتوليد إذن الفتح...' : 'تأكيد تسجيل الشحنة وإصدار إذن الإيداع'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
