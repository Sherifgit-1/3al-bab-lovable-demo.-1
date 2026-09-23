/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Camera,
  Volume2,
  Lock,
  ArrowRight,
  Eye,
  Radio,
  CheckCircle2,
  BellRing,
  Activity,
} from 'lucide-react';

export const AdminSecurityCenter: React.FC = () => {
  const { securityEvents, setAdminView } = useApp();

  const [sirenActive, setSirenActive] = useState(false);
  const [lockdownActive, setLockdownActive] = useState(false);

  const handleToggleSiren = () => {
    setSirenActive((prev) => !prev);
  };

  const handleToggleLockdown = () => {
    setLockdownActive((prev) => !prev);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setAdminView('CONTROL_TOWER')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لبرج العمليات</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Cairo']">
            مركز الأمان والتحقيق الجنائي والعبث (Security Operations Center)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            مراقبة تنبيهات العبث، حساسات الاهتزاز 4.8G، والتحليل المرئي الآلي لكاميرات 2K المدمجة.
          </p>
        </div>

        {/* Emergency Actions */}
        <div className="flex items-center gap-2">
          <button
            id="emergency-siren-btn"
            onClick={handleToggleSiren}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              sirenActive
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-900/50'
                : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{sirenActive ? 'صفارة الإنذار 110dB تعمل الآن!' : 'إطلاق صفارة الإنذار 110dB'}</span>
          </button>

          <button
            id="emergency-lockdown-btn"
            onClick={handleToggleLockdown}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
              lockdownActive
                ? 'bg-amber-600 text-slate-950 font-black shadow-amber-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{lockdownActive ? 'تم تفعيل الإغلاق التام!' : 'قفل أمني شامل (Lockdown)'}</span>
          </button>
        </div>
      </div>

      {/* Grid: 2K Video Analysis Feed + Active Incident Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 2K Forensic Live Stream Simulation */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">
                بث التحقيق المرئي الذكي 2K (Forensic Stream • BOX-408)
              </h3>
            </div>
            <span className="text-[10px] text-rose-400 font-mono bg-rose-950 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              TAMPER_EVENT_TRIGGERED
            </span>
          </div>

          {/* Video Container with Overlays */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col justify-between p-4">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80"
              alt="Security footage"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />

            {/* AI Bounding Boxes Overlays */}
            <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
              <span className="bg-black/70 text-rose-400 px-2 py-1 rounded border border-rose-800">
                LIVE REC: 2048x1536 @ 30fps
              </span>
              <span className="bg-black/70 text-cyan-300 px-2 py-1 rounded border border-cyan-800">
                AI CONFIDENCE: 94.8%
              </span>
            </div>

            {/* Detection Bounding Box on image */}
            <div className="relative z-10 self-center border-2 border-dashed border-rose-500 bg-rose-500/10 p-4 rounded-lg text-center backdrop-blur-xs">
              <div className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded inline-block">
                [ALERT: MECHANICAL_SHOCK 4.8G DETECTED]
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-300 font-mono bg-black/60 p-2 rounded-lg">
              <span>BOX-408 • الشيخ زايد (كمبوند بيفرلي هيلز)</span>
              <span>SHA-256: 7f8a9e1d2c3b4a5f</span>
            </div>
          </div>
        </div>

        {/* Right Column: Security Incidents Queue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">طابور الحوادث الأمنية النشطة</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{securityEvents.length} حوادث</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {securityEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{evt.smartBoxId}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : evt.severity === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {evt.severity}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">{evt.title}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{evt.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{evt.timestamp}</span>
                  <span className="text-emerald-400">{evt.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
