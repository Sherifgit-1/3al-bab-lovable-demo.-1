/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Search,
  Star,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Utensils,
  Pill,
  Laptop,
  Shirt,
} from 'lucide-react';

export const CustomerMerchantList: React.FC = () => {
  const { merchants, setSelectedMerchantProfileId, setCustomerView, openMerchantChat } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'كافة المتاجر', icon: Store },
    { id: 'مطاعم ومأكولات', label: 'مطاعم', icon: Utensils },
    { id: 'سوبرماركت ومؤن', label: 'سوبرماركت', icon: ShoppingBag },
    { id: 'صيدليات ومستلزمات طبية', label: 'صيدليات', icon: Pill },
    { id: 'أجهزة وإلكترونيات', label: 'إلكترونيات', icon: Laptop },
    { id: 'أزياء وملابس', label: 'أزياء', icon: Shirt },
  ];

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.businessName && m.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectMerchant = (merchantId: string) => {
    setSelectedMerchantProfileId(merchantId);
    setCustomerView('MERCHANT_PROFILE');
  };

  const handleDirectChat = async (e: React.MouseEvent, merchantId: string) => {
    e.stopPropagation();
    await openMerchantChat(merchantId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => setCustomerView('HOME')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {filteredMerchants.length} متاجر ومطاعم متاحة للتوصيل المباشر
          </span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>طلب مباشر عبر المحادثة أو القائمة مع الإيداع بالصندوق الذكي</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Cairo'] tracking-tight">
            المتاجر والمطاعم المعتمدة
          </h1>
          <p className="text-xs sm:text-sm text-blue-100">
            تصفح ملفات المتاجر، شاهد صور الفروع والرفوف والمنيو، وابدأ محادثة مباشرة وأرسل طلبك بخط اليد أو كتابياً.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن متجر، مطعم، صيدلية، أو منطقة..."
            className="w-full pr-11 pl-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Merchants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMerchants.map((merchant) => {
          const coverPhoto =
            merchant.storePhotos?.[0] ||
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

          return (
            <div
              key={merchant.id}
              onClick={() => handleSelectMerchant(merchant.id)}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={coverPhoto}
                    alt={merchant.businessName || merchant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                      {merchant.category}
                    </span>
                    {merchant.deliveryAvailable && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                        توصيل متاح ✓
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={
                          merchant.ownerPhoto ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
                        }
                        alt={merchant.ownerName}
                        className="w-7 h-7 rounded-full border border-white object-cover"
                      />
                      <span className="text-xs font-semibold drop-shadow">{merchant.ownerName}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold font-mono">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{merchant.rating || 4.8}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    {merchant.businessName || merchant.name}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{merchant.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{merchant.workingHours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => handleSelectMerchant(merchant.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>عرض الملف والصور</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDirectChat(e, merchant.id)}
                  className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  title="بدء محادثة وطلب جديد"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>محادثة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
