/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Star,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Camera,
  Layers,
  ChevronLeft,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const CustomerMerchantProfile: React.FC = () => {
  const {
    merchants,
    selectedMerchantProfileId,
    setCustomerView,
    setSelectedMerchantId,
    openMerchantChat,
  } = useApp();

  const merchant =
    merchants.find((m) => m.id === selectedMerchantProfileId) ||
    merchants[0];

  const [activePhotoTab, setActivePhotoTab] = useState<
    'STORE' | 'SHELVES' | 'FEATURES' | 'MENU' | 'OWNER'
  >('STORE');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  const handleStartChat = async () => {
    await openMerchantChat(merchant.id);
  };

  const handleOpenStore = () => {
    setSelectedMerchantId(merchant.id);
    setCustomerView('STORE');
  };

  const photoTabs = [
    {
      id: 'STORE' as const,
      label: 'واجهة وفروع المتجر',
      count: merchant.storePhotos?.length || 0,
      photos: merchant.storePhotos || [],
    },
    {
      id: 'SHELVES' as const,
      label: 'الأرفف والمخزون',
      count: merchant.shelfPhotos?.length || 0,
      photos: merchant.shelfPhotos || [],
    },
    {
      id: 'FEATURES' as const,
      label: 'المميزات والشهادات',
      count: merchant.featurePhotos?.length || 0,
      photos: merchant.featurePhotos || [],
    },
    {
      id: 'MENU' as const,
      label: 'قائمة الأسعار والمنيو',
      count: merchant.menuPhotos?.length || 0,
      photos: merchant.menuPhotos || [],
    },
    {
      id: 'OWNER' as const,
      label: 'صاحب المتجر',
      count: merchant.ownerPhoto ? 1 : 0,
      photos: merchant.ownerPhoto ? [merchant.ownerPhoto] : [],
    },
  ];

  const currentTabPhotos = photoTabs.find((t) => t.id === activePhotoTab)?.photos || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCustomerView('MERCHANT_LIST')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة المتاجر المعتمدة</span>
        </button>

        <span className="text-xs text-slate-400 font-mono">
          معرّف التاجر: #{merchant.id}
        </span>
      </div>

      {/* Main Merchant Cover & Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Photo Banner */}
        <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-slate-900">
          <img
            src={
              merchant.storePhotos?.[0] ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
            }
            alt={merchant.businessName}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

          {/* Badges on Cover */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900 shadow-md">
              {merchant.category}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-1 ${
                merchant.isOpen ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {merchant.isOpen ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مفتوح الآن
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  مغلق مؤقتاً
                </>
              )}
            </span>
            {merchant.deliveryAvailable && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md">
                توصيل بالصندوق الذكي ✓
              </span>
            )}
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 relative z-10">
            {/* Owner Photo & Titles */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={
                    merchant.ownerPhoto ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={merchant.ownerName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-['Cairo']">
                    {merchant.businessName || merchant.name}
                  </h1>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold font-mono">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                    {merchant.rating}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    المالك / المدير: {merchant.ownerName}
                  </span>
                  <span>•</span>
                  <span>{merchant.category}</span>
                </p>
              </div>
            </div>

            {/* Action Buttons: Chat & Store */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                id="start-merchant-chat-btn"
                onClick={handleStartChat}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>بدء محادثة وطلب جديد</span>
              </button>

              <button
                onClick={handleOpenStore}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>تصفح القائمة والطلب المباشر</span>
              </button>
            </div>
          </div>

          {/* Quick Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">العنوان والفروع</span>
                <span className="text-slate-600 mt-0.5 block">{merchant.address}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">أوقات العمل</span>
                <span className="text-slate-600 mt-0.5 block">{merchant.workingHours}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
              <Phone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">أرقام التواصل</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {merchant.phoneNumbers?.map((p, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Galleries Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              معرض الصور الموثقة للمتجر
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            صور عالية الدقة للفروع والرفوف والمنيو معتمدة لدى منصة 3al-BaB (عالباب)
          </span>
        </div>

        {/* Photo Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {photoTabs.map((tab) => {
            const isSelected = activePhotoTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePhotoTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentTabPhotos.map((photoUrl, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPhotoModal(photoUrl)}
              className="group relative h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={photoUrl}
                alt={`${merchant.businessName} - صورة ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-md">
                  تكبير الصورة 🔍
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Photo Modal Preview */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="p-2 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedPhotoModal}
              alt="معاينة الصورة"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
