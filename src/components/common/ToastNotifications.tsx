/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Truck, CheckCircle2, Bell, ShieldAlert } from 'lucide-react';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/NotificationService';

interface ToastItem extends NotificationItem {
  isCritical: boolean;
  receivedAt: number;
}

/**
 * Determines whether a notification is security-critical (tampering, unauthorized access, critical alerts).
 * Security-critical notifications remain visible until manually dismissed by the user.
 */
const isSecurityCritical = (notif: NotificationItem): boolean => {
  if (notif.type === 'SECURITY') return true;
  const text = `${notif.title} ${notif.message}`.toLowerCase();
  return (
    text.includes('أمني') ||
    text.includes('اهتزاز') ||
    text.includes('خلع') ||
    text.includes('غير مصرح') ||
    text.includes('اختراق') ||
    text.includes('tampering') ||
    text.includes('unauthorized') ||
    text.includes('security') ||
    text.includes('critical') ||
    text.includes('إنذار')
  );
};

export const ToastNotifications: React.FC = () => {
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  // Manual or automatic dismissal (ONLY removes from toast UI, no business records affected)
  const dismissToast = (id: string) => {
    // Clear timer if active
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
    dismissedIdsRef.current.add(id);
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (notif: NotificationItem) => {
    if (!notif || !notif.id) return;
    if (dismissedIdsRef.current.has(notif.id)) return;

    const isCritical = isSecurityCritical(notif);

    setVisibleToasts((prev) => {
      // 12. Prevent duplicate notifications for the same event
      if (prev.some((t) => t.id === notif.id)) return prev;
      if (
        prev.some(
          (t) =>
            t.title === notif.title &&
            t.message === notif.message &&
            Math.abs(t.receivedAt - Date.now()) < 5000
        )
      ) {
        return prev;
      }

      const toastItem: ToastItem = {
        ...notif,
        isCritical,
        receivedAt: Date.now(),
      };

      let updated = [...prev];

      // 4 & 5. Maximum 3 normal notifications. If a 4th arrives, remove oldest normal notification.
      if (!isCritical) {
        const normalToasts = updated.filter((t) => !t.isCritical);
        if (normalToasts.length >= 3) {
          const oldestNormal = normalToasts[0];
          if (timersRef.current.has(oldestNormal.id)) {
            clearTimeout(timersRef.current.get(oldestNormal.id));
            timersRef.current.delete(oldestNormal.id);
          }
          dismissedIdsRef.current.add(oldestNormal.id);
          updated = updated.filter((t) => t.id !== oldestNormal.id);
        }

        // 2 & 10. Normal notifications automatically disappear after 6 seconds
        const timer = setTimeout(() => {
          dismissToast(toastItem.id);
        }, 6000);
        timersRef.current.set(toastItem.id, timer);
      }

      return [...updated, toastItem];
    });
  };

  useEffect(() => {
    // On mount, load initial notifications with proper auto-dismiss/security rules
    if (!initializedRef.current) {
      initializedRef.current = true;
      notificationService.getNotifications().then((initialList) => {
        if (initialList && initialList.length > 0) {
          // Take the top 3 and add them
          const initialSlice = initialList.slice(0, 3).reverse();
          initialSlice.forEach((item) => addToast(item));
        }
      });
    }

    // Subscribe to real-time notification events
    const unsubscribe = notificationService.subscribe((allNotifs) => {
      if (allNotifs && allNotifs.length > 0) {
        const latest = allNotifs[0];
        if (latest && !dismissedIdsRef.current.has(latest.id)) {
          addToast(latest);
        }
      }
    });

    // 7. Cleanup active timers on unmount to avoid memory leaks
    return () => {
      unsubscribe();
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-40 max-w-[calc(100vw-1.5rem)] sm:max-w-sm w-auto sm:w-full flex flex-col gap-2.5 pointer-events-none font-['Cairo'] select-none"
      aria-live="polite"
      aria-label="التنبيهات اللحظية"
    >
      {visibleToasts.map((notif) => {
        const isSecurity = notif.isCritical;

        return (
          <div
            key={notif.id}
            role="alert"
            className={`relative p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 pointer-events-auto text-xs overflow-hidden ${
              isSecurity
                ? 'bg-rose-950/95 border-rose-600/80 text-rose-100 ring-1 ring-rose-500/30'
                : notif.type === 'DELIVERY'
                ? 'bg-cyan-950/95 border-cyan-600/80 text-cyan-100 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/95 border-slate-700/80 text-slate-100 ring-1 ring-slate-600/30'
            }`}
          >
            {/* Header: Icon + Title + Timestamp + Close Button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isSecurity ? (
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                ) : notif.type === 'DELIVERY' ? (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
                <span className="font-bold truncate text-xs text-white">
                  {notif.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono opacity-70 text-slate-300">
                  {notif.timestamp}
                </span>

                {/* 1 & 3. Visible X / Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissToast(notif.id);
                  }}
                  aria-label="إغلاق التنبيه"
                  title="إغلاق التنبيه"
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <p className="text-[11px] opacity-90 mt-1.5 leading-relaxed break-words text-slate-200">
              {notif.message}
            </p>

            {/* Security Alert Footer Notice */}
            {isSecurity && (
              <div className="mt-2 pt-1.5 border-t border-rose-800/60 flex items-center justify-between text-[10px] text-rose-300">
                <span className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>تنبيه أمني هام • يتطلب مراجعة</span>
                </span>
                <button
                  type="button"
                  onClick={() => dismissToast(notif.id)}
                  className="text-rose-200 hover:text-white underline font-bold cursor-pointer"
                >
                  إغلاق التنبيه
                </button>
              </div>
            )}

            {/* 2 & 10. Auto-dismiss indicator for normal notifications (6 seconds) */}
            {!isSecurity && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cyan-400/70"
                  style={{
                    animation: 'toastProgress 6s linear forwards',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
