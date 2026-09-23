/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Box,
  KeyRound,
  ShieldCheck,
  Plus,
  Battery,
  Wifi,
  Thermometer,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  Clock,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const CustomerBoxes: React.FC = () => {
  const {
    boxes,
    authorizations,
    createDelegation,
    setCustomerView,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [delegationName, setDelegationName] = useState('');
  const [delegationType, setDelegationType] = useState<'DELIVERY' | 'FAMILY' | 'VISITOR'>('DELIVERY');
  const [compartmentId, setCompartmentId] = useState('02');
  const [durationMins, setDurationMins] = useState(60);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationName) return;
    await createDelegation({
      name: delegationName,
      type: delegationType,
      compartmentId,
      expiresInMins: durationMins,
    });
    setDelegationName('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCustomerView('HOME')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
            إدارة وتفويض الصناديق الذكية (Smart Box & Access Control)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            تشفير كامل 256-bit • إدارة أذونات فتح الصناديق لشركات الشحن والضيوف وأفراد العائلة.
          </p>
        </div>

        <button
          id="add-delegation-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء تصريح دخول مؤقت</span>
        </button>
      </div>

      {/* Boxes Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boxes.slice(0, 2).map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{b.id}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {b.id === 'BOX-102' ? 'الصندوق الرئيسي' : 'المكتب التجاري'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{b.location}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>متصل 4G</span>
              </div>
            </div>

            {/* Customer Status Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">الحالة التشغيلية</span>
                <span className="font-semibold text-emerald-400">جاهز للاستلام</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">حالة الاتصال</span>
                <span className="font-semibold text-cyan-400">متصل</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] block">الأمان والمزلاج</span>
                <span className="font-semibold text-emerald-400">مغلق وآمن</span>
              </div>
            </div>

            {/* Compartment Status Pills */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300">سعة الحجيرات المتاحة:</span>
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
                {b.compartments.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-1.5 rounded-lg border ${
                      comp.status === 'RESERVED' || comp.status === 'OCCUPIED'
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 font-bold'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>{comp.id} ({comp.size})</div>
                    <div className="text-[9px] opacity-75">
                      {comp.status === 'AVAILABLE' ? 'متاح' : 'محجوز'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Guard Settings Section */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950/20 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">إعدادات الحراسة الذكية (Smart Guard Protocols)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <input type="checkbox" defaultChecked className="mt-1 accent-cyan-500 rounded" />
            <div>
              <h4 className="font-bold text-white">حارس النطاق الجغرافي (Geofence Guard)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                حظر فتح الحجيرة إلا عند وجود هاتف المندوب على بعد أقل من 20 متراً من الصندوق.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <input type="checkbox" defaultChecked className="mt-1 accent-cyan-500 rounded" />
            <div>
              <h4 className="font-bold text-white">التوثيق المرئي الآلي 2K POD</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                التقاط صورة مشفرة وتوليد ختم رقمي فور وضع الطرد وإغلاق باب الحجيرة.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <input type="checkbox" defaultChecked className="mt-1 accent-cyan-500 rounded" />
            <div>
              <h4 className="font-bold text-white">إنذار حساس الوزن الديناميكي</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                إطلاق إنذار لحظي في حال سحب أو استبدال الطرد بدون إذن فتح نظامي معتمد.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Delegations Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">قائمة التصاريح ورموز الدخول النشطة (OTP)</h3>
          </div>
          <span className="text-xs text-slate-400">{authorizations.length} تصاريح مسجلة</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {authorizations.map((auth) => (
            <div
              key={auth.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {auth.driverName || auth.customerName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      auth.delegationType === 'FAMILY'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : auth.delegationType === 'VISITOR'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {auth.delegationType === 'FAMILY'
                      ? 'عائلة (دائم)'
                      : auth.delegationType === 'VISITOR'
                      ? 'زائر / ضيف'
                      : 'توصيل شحنة'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  الصندوق: {auth.smartBoxId} • الحجيرة: {auth.compartmentId} • ينتهي في: {auth.expiresAt}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">رمز المرور (OTP)</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm tracking-wider">
                    {auth.otp}
                  </span>
                </div>

                <span
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    auth.status === 'ACTIVE'
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : 'text-slate-400 bg-slate-800'
                  }`}
                >
                  {auth.status === 'ACTIVE' ? 'نشط' : auth.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Delegation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white pb-2 border-b border-slate-800">
              إنشاء تصريح دخول مؤقت للصندوق الذكي
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  اسم الشخص المفوض أو شركة التوصيل:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مندوب أرامكس أو سارة منصور"
                  value={delegationName}
                  onChange={(e) => setDelegationName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">نوع التفويض:</label>
                  <select
                    value={delegationType}
                    onChange={(e: any) => setDelegationType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DELIVERY">توصيل شحنة</option>
                    <option value="VISITOR">زائر / ضيف</option>
                    <option value="FAMILY">أفراد العائلة</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">الحجيرة المستهدفة:</label>
                  <select
                    value={compartmentId}
                    onChange={(e) => setCompartmentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="01">حجيرة 01 (S)</option>
                    <option value="02">حجيرة 02 (M)</option>
                    <option value="03">حجيرة 03 (L)</option>
                    <option value="04">حجيرة 04 (XL)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  مدة الصلاحية (بالدقائق):
                </label>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={30}>30 دقيقة</option>
                  <option value={60}>ساعة واحدة (60 دقيقة)</option>
                  <option value={180}>3 ساعات</option>
                  <option value={1440}>24 ساعة (يوم كامل)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
                >
                  توليد كود الـ OTP
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
