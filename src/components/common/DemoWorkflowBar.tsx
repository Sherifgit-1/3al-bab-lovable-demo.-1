/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

const STEPS = [
  { num: 1, label: 'طلب العميل', actor: 'العميل' },
  { num: 2, label: 'استلام المتجر', actor: 'التاجر' },
  { num: 3, label: 'قبول المتجر', actor: 'التاجر' },
  { num: 4, label: 'تجهيز الطلب', actor: 'التاجر' },
  { num: 5, label: 'جاهز وإسناد للمندوب', actor: 'التاجر' },
  { num: 6, label: 'في الطريق بالمركبة', actor: 'المندوب' },
  { num: 7, label: 'وصلت للصندوق', actor: 'المندوب' },
  { num: 8, label: 'موافقة العميل على فتح الصندوق', actor: 'العميل' },
  { num: 9, label: 'إشعار المندوب واعتماد التصريح', actor: 'المندوب' },
  { num: 10, label: 'فتح الصندوق وبدء جلسة الوصول', actor: 'المندوب' },
  { num: 11, label: 'إيداع الطرد + تحسس الوزن', actor: 'المندوب' },
  { num: 12, label: 'تأمين وإغلاق الصندوق', actor: 'المندوب' },
  { num: 13, label: 'اكتمال التسليم (COMPLETED)', actor: 'المندوب' },
  { num: 14, label: 'إشعار العميل والتتبع', actor: 'العميل' },
  { num: 15, label: 'سجل التدقيق والأمان', actor: 'الإدارة' },
];

export const DemoWorkflowBar: React.FC = () => {
  const { demoStep, advanceDemoWorkflow, resetDemoWorkflow, jumpToDemoStep, cleanupUnfinishedDemoOrders } = useApp();
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupFeedback, setCleanupFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const current = STEPS.find((s) => s.num === demoStep) || STEPS[0];

  const handleConfirmCleanup = async () => {
    setIsCleaning(true);
    try {
      const res = await cleanupUnfinishedDemoOrders();
      setShowCleanupConfirm(false);
      setCleanupFeedback({
        text: res.message,
        isSuccess: res.success,
      });
      setTimeout(() => {
        setCleanupFeedback(null);
      }, 5000);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-2 sm:px-6 py-1.5 sm:py-2.5 backdrop-blur-sm relative">
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="demo-advance-btn"
              onClick={advanceDemoWorkflow}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-[11px] sm:text-xs transition-all shadow-md shadow-cyan-900/20"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>الخطوة ({demoStep < 15 ? demoStep + 1 : 1})</span>
              <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              id="demo-reset-btn"
              onClick={resetDemoWorkflow}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="إعادة بدء السيناريو من البداية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Clearly Labeled Demo-only Cleanup Action */}
            <button
              id="demo-cleanup-btn"
              onClick={() => {
                setCleanupFeedback(null);
                setShowCleanupConfirm(true);
              }}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-rose-100 font-semibold text-[11px] sm:text-xs transition-all shadow-sm"
              title="تنظيف الطلبات غير المكتملة"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span className="hidden sm:inline">تنظيف الطلبات غير المكتملة</span>
              <span className="sm:hidden text-[10px]">تنظيف</span>
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

      {/* Demo Cleanup Confirmation Modal */}
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl text-right animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Cairo']">
                  تنظيف الطلبات غير المكتملة
                </h3>
                <p className="text-xs text-rose-400/90 font-medium">إجراء خاص بوضع التجربة (Demo Only)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm leading-relaxed mb-5 whitespace-pre-line font-medium text-right">
              {`سيتم إلغاء وإزالة جميع الطلبات غير المكتملة.
الطلبات المكتملة لن تتأثر.
هل تريد المتابعة؟`}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                id="cancel-cleanup-btn"
                type="button"
                onClick={() => setShowCleanupConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>
              <button
                id="confirm-cleanup-btn"
                type="button"
                onClick={handleConfirmCleanup}
                disabled={isCleaning}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                {isCleaning ? (
                  <span>جاري التنظيف...</span>
                ) : (
                  <span>تنظيف الطلبات</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Result Feedback Banner */}
      {cleanupFeedback && (
        <div className="max-w-7xl mx-auto mt-2 px-1">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold transition-all shadow-md ${
              cleanupFeedback.isSuccess
                ? 'bg-emerald-950/90 border-emerald-600/80 text-emerald-200'
                : 'bg-cyan-950/90 border-cyan-700/80 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2.5 whitespace-pre-line text-right">
              {cleanupFeedback.isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span>{cleanupFeedback.text}</span>
            </div>
            <button
              onClick={() => setCleanupFeedback(null)}
              className="p-1 rounded hover:bg-black/20 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
