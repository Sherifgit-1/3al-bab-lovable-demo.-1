/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Store,
  PackageCheck,
  MessageSquare,
  User,
} from 'lucide-react';

export const CustomerMobileNav: React.FC = () => {
  const {
    customerView,
    setCustomerView,
    openMerchantChat,
    selectedMerchantId,
    activeConversation,
  } = useApp();

  const navItems = [
    {
      id: 'HOME',
      label: 'الرئيسية',
      icon: Home,
      isActive: customerView === 'HOME',
      onClick: () => setCustomerView('HOME'),
    },
    {
      id: 'MERCHANT_LIST',
      label: 'المتاجر',
      icon: Store,
      isActive: customerView === 'MERCHANT_LIST' || customerView === 'MERCHANT_PROFILE',
      onClick: () => setCustomerView('MERCHANT_LIST'),
    },
    {
      id: 'ORDERS',
      label: 'طلباتي',
      icon: PackageCheck,
      isActive: customerView === 'ORDERS' || customerView === 'ORDER_DETAILS' || customerView === 'TRACKING',
      onClick: () => setCustomerView('ORDERS'),
    },
    {
      id: 'CHAT',
      label: 'الدردشة',
      icon: MessageSquare,
      isActive: customerView === 'CHAT',
      onClick: () => {
        const targetMerchId = selectedMerchantId || activeConversation?.merchantId || 'merch-5';
        openMerchantChat(targetMerchId);
      },
    },
    {
      id: 'ACCOUNT',
      label: 'الحساب',
      icon: User,
      isActive: customerView === 'ACCOUNT' || customerView === 'BOXES',
      onClick: () => setCustomerView('ACCOUNT'),
    },
  ];

  return (
    <nav
      id="customer-mobile-bottom-nav"
      aria-label="التنقل الرئيسي للعميل"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b1320]/95 backdrop-blur-xl border-t border-slate-800/90 shadow-[0_-8px_25px_rgba(0,0,0,0.45)] px-1 py-1.5"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id.toLowerCase()}`}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                item.isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  item.isActive ? 'bg-cyan-950/80 border border-cyan-800/60 scale-110' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
              <span className="text-[11px] font-['Cairo'] mt-0.5 leading-tight">
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute -top-0.5 shadow-sm shadow-cyan-400/80" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
