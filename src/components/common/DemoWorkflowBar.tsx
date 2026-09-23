/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  RotateCcw,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  Truck,
  Store,
  Box,
  ShieldCheck,
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'طلب العميل', actor: 'العميل' },
  { num: 2, label: 'استلام المتجر', actor: 'التاجر' },
  { num: 3, label: 'قبول المتجر', actor: 'التاجر' },
  { num: 4, label: 'تجهيز وتغليف', actor: 'التاجر' },
  { num: 5, label: 'إسناد للمندوب', actor: 'التاجر' },
  { num: 6, label: 'في الطريق', actor: 'المندوب' },
  { num: 7, label: 'وصول للصندوق', actor: 'المندوب' },
  { num: 8, label: 'إدخال رمز OTP', actor: 'المندوب' },
  { num: 9, label: 'فتح مزلاج الصندوق', actor: 'العتاد الذكي' },
  { num: 10, label: 'إيداع الطرد + وزن', actor: 'المندوب' },
  { num: 11, label: 'إغلاق وقفل آمن', actor: 'العتاد الذكي' },
  { num: 12, label: 'توثيق 2K POD ومكافأة', actor: 'المندوب' },
  { num: 13, label: 'إشعار العميل والتتبع', actor: 'العميل' },
  { num: 14, label: 'استلام العميل من الصندوق', actor: 'العميل' },
  { num: 15, label: 'سجل التدقيق والأمان', actor: 'الإدارة' },
];

export const DemoWorkflowBar: React.FC = () => {
  const { demoStep, advanceDemoWorkflow, resetDemoWorkflow, jumpToDemoStep } = useApp();

  const current = STEPS.find((s) => s.num === demoStep) || STEPS[0];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Step Info & Advance Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/40">
              {demoStep}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400">سيناريو العرض الكامل:</span>
              <span className="text-white font-bold">{current.label}</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">
                {current.actor}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="demo-advance-btn"
              onClick={advanceDemoWorkflow}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-900/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>الخطوة التالية ({demoStep < 15 ? demoStep + 1 : 1})</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              id="demo-reset-btn"
              onClick={resetDemoWorkflow}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="إعادة بدء السيناريو من البداية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Chips (Horizontal Scrollable) */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {STEPS.map((s) => {
            const isDone = s.num < demoStep;
            const isCurrent = s.num === demoStep;
            return (
              <button
                key={s.num}
                onClick={() => jumpToDemoStep(s.num)}
                className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : isDone
                    ? 'bg-slate-800 text-cyan-400/90 hover:bg-slate-700'
                    : 'bg-slate-900/60 text-slate-500 hover:text-slate-400'
                }`}
              >
                {s.num}. {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
