/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Store,
  Star,
  MapPin,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  ArrowRight,
  Check,
  Package,
  Layers,
  Search,
} from 'lucide-react';

export const CustomerStore: React.FC = () => {
  const {
    merchants,
    products,
    selectedMerchantId,
    setSelectedMerchantId,
    setCustomerView,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const merchant = merchants.find((m) => m.id === selectedMerchantId) || merchants[0];
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  const categories = ['ALL', ...Array.from(new Set(merchantProducts.map((p) => p.category)))];

  const filteredProducts = merchantProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getProductCartQuantity = (productId: string) => {
    const found = cart.find((i) => i.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCustomerView('HOME')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة المتاجر</span>
        </button>

        <div className="flex items-center gap-2">
          {cartItemCount > 0 && (
            <button
              onClick={() => setCustomerView('CHECKOUT')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>سلة الشراء ({cartItemCount})</span>
              <span className="font-mono">{cartTotal} ج.م</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Merchant Header Banner */}
      <div className="rounded-2xl bg-gradient-to-l from-slate-900 via-slate-900 to-[#12223b] border border-cyan-900/60 p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                <Store className="w-3 h-3" />
                متجر معتمد ومتاح للإيداع الذكي
              </span>
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-900/50">
                <Star className="w-3 h-3 fill-current" />
                {merchant.rating}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              {merchant.name}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400">{merchant.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {merchant.address}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                متوسط التجهيز: {merchant.avgPrepTimeMinutes} دقيقة
              </span>
            </p>
          </div>

          {/* Merchant Quick Stats */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 block">المنتجات المتوفرة</span>
              <span className="font-mono text-cyan-300 font-bold text-sm">
                {merchantProducts.length} أصناف
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-[10px] text-slate-400 block">التوصيل للصندوق</span>
              <span className="text-emerald-400 font-bold text-sm">مجاني 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'جميع المنتجات' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في المنتجات..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((p) => {
          const qty = getProductCartQuantity(p.id);

          return (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-lg space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800/60">
                    {p.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    حجيرة: {p.compartmentSize}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {p.specs && (
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 font-mono">
                    {p.specs}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-cyan-400 font-mono">
                    {p.price} ج.م
                  </span>
                </div>

                {/* Add / Modify Quantity Button */}
                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(p, 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة للسلة</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-950 border border-cyan-500/60 rounded-xl p-1">
                    <button
                      onClick={() => updateCartQuantity(p.id, qty - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-xs text-cyan-300 px-1">{qty}</span>
                    <button
                      onClick={() => updateCartQuantity(p.id, qty + 1)}
                      className="w-6 h-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar if items in cart */}
      {cartItemCount > 0 && (
        <div className="sticky bottom-4 z-20">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/60 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-300">سلة الشراء الحالية:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white font-mono">
                    {cartItemCount} منتجات • {cartTotal} ج.م
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    توصيل مجاني للصندوق
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCustomerView('CHECKOUT')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-cyan-500/30"
              >
                <span>المتابعة إلى تأكيد الطلب والدفع</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
