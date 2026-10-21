/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  ShieldCheck,
  Box,
  MapPin,
  Phone,
  Mail,
  PackageCheck,
  KeyRound,
  FilePlus2,
  LogOut,
  ChevronLeft,
  Store,
  CreditCard,
  Settings,
} from 'lucide-react';

export const CustomerAccount: React.FC = () => {
  const { setCustomerView, activeBox } = useApp();
  const { currentUser, logout } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-l from-slate-900 via-slate-900 to-[#12223b] border border-cyan-900/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              {currentUser?.name?.slice(0, 1) || 'ع'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
                  {currentUser?.name || 'العميل'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>موثق بالرقم القومي</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser?.email || 'لا يوجد بريد مسجل'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-all text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Contact info pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-mono">{currentUser?.phone || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">{currentUser?.details || 'التجمع الخامس، القاهرة الجديدة'}</span>
          </div>
        </div>
      </div>

      {/* Primary Smart Box Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Cairo']">صندوقك الذكي المعتمد</h3>
              <p className="text-[11px] text-slate-400">مزود بقفل مغناطيسي ومستشعرات أوزان وكاميرات 2K</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            متصل أونلاين ✓
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">معرّف الصندوق:</span>
            <span className="font-mono text-cyan-400 font-bold">{activeBox?.id || 'BOX-102'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">عدد الحجيرات:</span>
            <span className="text-white font-bold">{activeBox?.compartments?.length || 4} حجيرات ذكية</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block">حالة القفل:</span>
            <span className="text-emerald-400 font-bold">مغلق ومؤمّن عتادياً</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 px-1">روابط سريعة:</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="account-link-orders"
            onClick={() => setCustomerView('ORDERS')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-right flex items-center justify-between group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  سجل طلباتي
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">متابعة الشحنات الحالية وسجل الطلبات السابقة</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>

          <button
            id="account-link-boxes"
            onClick={() => setCustomerView('BOXES')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-right flex items-center justify-between group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                  الصناديق وتفويض الوصول
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">إدارة أذونات الفتح للزوار ومندوبي التوصيل</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>

          <button
            id="account-link-external-order"
            onClick={() => setCustomerView('EXTERNAL_ORDER')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-right flex items-center justify-between group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FilePlus2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  تسجيل شحنة خارجية
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">إيداع شحنات أمازون ونون وشركات الشحن بالصندوق</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>

          <button
            id="account-link-merchants"
            onClick={() => setCustomerView('MERCHANT_LIST')}
            className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 transition-all text-right flex items-center justify-between group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  المتاجر المعتمدة
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">طلب الطعام والإلكترونيات والمنتجات اليومية</p>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
