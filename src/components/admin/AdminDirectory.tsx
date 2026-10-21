/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Store,
  Truck,
  Package,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminDirectory: React.FC = () => {
  const { setAdminView, orders, merchants, drivers, boxes } = useApp();
  const { customAccounts } = useAuth();
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'MERCHANTS' | 'DRIVERS' | 'ORDERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived customers list combining mock customers and real registered custom accounts
  const baseCustomers = [
    {
      id: 'cust-1',
      name: 'أحمد مصطفى',
      phone: '+20 100 123 4567',
      address: 'الفيلا 14 - جنوب الأكاديمية، التجمع الخامس',
      primaryBoxId: 'BOX-102',
      registeredDate: '2025-11-10',
      status: 'VERIFIED',
      totalOrders: 28,
    },
    {
      id: 'cust-2',
      name: 'سارة عبد الرحمن',
      phone: '+20 101 987 6543',
      address: 'عمارة 8، شارع 9، المعادي',
      primaryBoxId: 'BOX-219',
      registeredDate: '2026-01-15',
      status: 'VERIFIED',
      totalOrders: 14,
    },
    {
      id: 'cust-3',
      name: 'م. طارق العوضي',
      phone: '+20 109 444 3322',
      address: 'الكمبوند السكني، بيفرلي هيلز، الشيخ زايد',
      primaryBoxId: 'BOX-408',
      registeredDate: '2026-03-02',
      status: 'VERIFIED',
      totalOrders: 9,
    },
  ];

  const registeredCustomers = customAccounts
    .filter((a) => a.role === 'CUSTOMER')
    .map((a) => ({
      id: a.user?.id || a.email,
      name: a.user?.name || a.email,
      phone: a.user?.phone || a.phone || '+20 100 000 0000',
      address: a.address || a.user?.details || 'التجمع الخامس، القاهرة',
      primaryBoxId: 'BOX-102',
      registeredDate: a.updatedAt ? a.updatedAt.slice(0, 10) : '2026-10-20',
      status: 'VERIFIED',
      totalOrders: orders.filter((o) => o.customerId === (a.user?.id || a.email)).length,
    }));

  const customers = [...registeredCustomers, ...baseCustomers];

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(searchQuery) || c.phone.includes(searchQuery) || c.primaryBoxId.includes(searchQuery)
  );

  const filteredMerchants = merchants.filter(
    (m) => m.name.includes(searchQuery) || m.category.includes(searchQuery) || m.address.includes(searchQuery)
  );

  const filteredDrivers = drivers.filter(
    (d) => d.name.includes(searchQuery) || d.code.includes(searchQuery) || d.vehicle.includes(searchQuery)
  );

  const filteredOrders = orders.filter(
    (o) => o.id.includes(searchQuery) || o.customerName.includes(searchQuery) || (o.merchantName && o.merchantName.includes(searchQuery))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setAdminView('CONTROL_TOWER')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لبرج العمليات المركزية</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
            دليل العملاء، المتاجر، المناديب والطلبات (Directory & Records)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة صلاحيات وبيانات مستخدمي النظام وسجلات العمليات الموحدة لجميع الأطراف.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'CUSTOMERS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>العملاء ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('MERCHANTS')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'MERCHANTS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>المتاجر ({merchants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'DRIVERS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>المناديب ({drivers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ORDERS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>الطلبات ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`بحث في سجل ${
            activeTab === 'CUSTOMERS'
              ? 'العملاء بالاسم أو الهاتف أو الصندوق...'
              : activeTab === 'MERCHANTS'
              ? 'المتاجر بالاسم أو التصنيف...'
              : activeTab === 'DRIVERS'
              ? 'المناديب بالكود أو المركبة...'
              : 'الطلبات برقم الشحنة أو العميل...'
          }`}
          className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-white">
            مسح
          </button>
        )}
      </div>

      {/* Tab 1: Customers */}
      {activeTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => (
            <div key={cust.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{cust.name}</h4>
                  <p className="text-xs font-mono text-cyan-400 mt-0.5">{cust.phone}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-[10px] font-bold text-emerald-400">
                  {cust.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{cust.address}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                  <span>الصندوق الرئيسي:</span>
                  <span className="font-mono text-cyan-300 font-bold">{cust.primaryBoxId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>إجمالي الطلبات المستلمة:</span>
                  <span className="font-mono text-emerald-400 font-bold">{cust.totalOrders} شحنة</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Merchants */}
      {activeTab === 'MERCHANTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMerchants.map((m) => (
            <div key={m.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{m.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{m.category}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                  ★ {m.rating}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">مبيعات اليوم</span>
                  <span className="font-mono text-emerald-400 font-bold">{(m.todaySales || 0).toLocaleString()} ج.م</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">طلبات اليوم</span>
                  <span className="font-mono text-cyan-400 font-bold">{m.todayCompletedOrders}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">استجابة Webhook</span>
                  <span className="font-mono text-amber-400 font-bold">{m.webhookLatencyMs}ms</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                <span>{m.address}</span>
                <span className="font-mono text-slate-500">{m.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Drivers */}
      {activeTab === 'DRIVERS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredDrivers.map((d) => (
            <div key={d.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{d.name}</h4>
                  <p className="text-xs font-mono text-cyan-400 mt-0.5">كود: {d.code}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-[10px] font-bold text-emerald-400">
                  {d.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>المركبة:</span>
                  <span className="text-slate-200">{d.vehicle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>الموقع الميداني:</span>
                  <span className="text-slate-300 truncate max-w-[160px]">{d.currentLocation.description}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>أرباح اليوم:</span>
                  <span className="font-mono text-emerald-400 font-bold">{d.todayEarnings} ج.م</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Orders */}
      {activeTab === 'ORDERS' && (
        <div className="overflow-x-auto rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3.5">رقم التتبع</th>
                <th className="p-3.5">العميل</th>
                <th className="p-3.5">المتجر / الشاحن</th>
                <th className="p-3.5">الصندوق والحجيرة</th>
                <th className="p-3.5">الوزن</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-bold text-cyan-400">{o.id}</td>
                  <td className="p-3.5 font-sans font-semibold text-white">{o.customerName}</td>
                  <td className="p-3.5 font-sans text-slate-300">{o.merchantName}</td>
                  <td className="p-3.5 text-slate-300">{o.smartBoxId} (حجيرة {o.compartmentId})</td>
                  <td className="p-3.5 text-amber-300">{o.proofOfDelivery?.weightKg || 1.4} كجم</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-400 font-bold">{o.total} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
