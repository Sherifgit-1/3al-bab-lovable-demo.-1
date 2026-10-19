/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cpu,
  Lock,
  Unlock,
  DoorClosed,
  DoorOpen,
  Scale,
  Camera,
  Battery,
  Thermometer,
  AlertTriangle,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  X,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

export const SimulatedBoxWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    hardwareSim,
    triggerHardwareCycle,
    simulateTamperAttack,
    resetTamperStatus,
    toggleEmergencySiren,
    activeOrder,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'LOCKER' | 'CAMERA' | 'SENSORS'>('LOCKER');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0f172a] border border-cyan-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-['Cairo']">
                  محاكي العتاد الذكي للصندوق (Smart Box IoT Simulator)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  بيئة محاكاة فيزيائية
                </span>
              </div>
              <p className="text-xs text-slate-400">
                BOX-102 • التجمع الخامس • Solenoid + Load Cell + 2K Camera + Reed Sensor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulator Status Bar */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            {/* Solenoid state */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">المزلاج الكهرومغناطيسي:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                  hardwareSim.isSolenoidLocked
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                }`}
              >
                {hardwareSim.isSolenoidLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {hardwareSim.isSolenoidLocked ? 'مغلق (ENGAGED)' : 'مفتوح (RELEASED)'}
              </span>
            </div>

            {/* Reed Door switch */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">حساس الباب:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                  hardwareSim.isDoorClosed
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                }`}
              >
                {hardwareSim.isDoorClosed ? <DoorClosed className="w-3 h-3" /> : <DoorOpen className="w-3 h-3" />}
                {hardwareSim.isDoorClosed ? 'محكم الإغلاق (100%)' : 'مفتوح (85°)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-cyan-400">
              <Thermometer className="w-3.5 h-3.5" />
              {hardwareSim.temperature}°C
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Battery className="w-3.5 h-3.5" />
              {hardwareSim.batteryPct}%
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              12.4V DC
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('LOCKER')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'LOCKER'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            مجسم الصندوق والحجيرات
          </button>
          <button
            onClick={() => setActiveTab('CAMERA')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'CAMERA'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            كاميرا التوثيق 2K POD
          </button>
          <button
            onClick={() => setActiveTab('SENSORS')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'SENSORS'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            تشخيص الحساسات اللحظي
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Action Log Banner */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">آخر إشارة عتاد فيزيائية:</span>
            <span className="font-mono text-cyan-300 font-semibold">{hardwareSim.lastActionMessage}</span>
          </div>

          {activeTab === 'LOCKER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visual Model of Box-102 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    هيكل الخزانة الفيزيائي (BOX-102)
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">3al-BaB Master v2.4</span>
                </div>

                {/* 4 Compartment Grid */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                  {/* Compartment 01 (S) */}
                  <div className="h-28 rounded-lg bg-slate-900 border border-slate-700/80 p-2.5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">حجيرة 01 (S)</span>
                      <Lock className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">حرة ومتاحة</div>
                    <div className="text-[10px] font-mono text-slate-400">0.00 كجم</div>
                  </div>

                  {/* Compartment 02 (M - Active Target for Order TW-8921) */}
                  <div
                    className={`h-28 rounded-lg p-2.5 flex flex-col justify-between relative overflow-hidden transition-all border-2 ${
                      !hardwareSim.isSolenoidLocked
                        ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-900/40 animate-pulse'
                        : 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-900/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-300">حجيرة 02 (M) ★</span>
                      {!hardwareSim.isSolenoidLocked ? (
                        <Unlock className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-cyan-400/90 font-medium">
                      {!hardwareSim.isDoorClosed ? 'الباب مفتوح للإيداع' : (activeOrder ? `طلب نشط: #${activeOrder.id}` : 'حجيرة مخصصة')}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-cyan-400" />
                        {hardwareSim.weightKg.toFixed(2)} كجم
                      </span>
                      <span className="text-emerald-400 text-[9px] bg-emerald-950 px-1 rounded">
                        {hardwareSim.weightKg > 0 ? 'طرد مودع' : 'فارغة'}
                      </span>
                    </div>
                  </div>

                  {/* Compartment 03 (L) */}
                  <div className="h-28 rounded-lg bg-slate-900 border border-slate-700/80 p-2.5 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">حجيرة 03 (L)</span>
                      <Lock className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">حرة ومتاحة</div>
                    <div className="text-[10px] font-mono text-slate-400">0.00 كجم</div>
                  </div>

                  {/* Compartment 04 (XL) */}
                  <div className="h-28 rounded-lg bg-slate-900 border border-slate-700/80 p-2.5 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">حجيرة 04 (XL)</span>
                      <Lock className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-slate-500">حرة ومتاحة</div>
                    <div className="text-[10px] font-mono text-slate-400">0.00 كجم</div>
                  </div>
                </div>
              </div>

              {/* Hardware Test Triggers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">محاكاة العمليات الفيزيائية المباشرة</h4>

                <button
                  id="sim-trigger-cycle-btn"
                  onClick={() => triggerHardwareCycle(1.4)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-2.5 text-right">
                    <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 group-hover:bg-cyan-900 transition-colors">
                      <Unlock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-slate-200">محاكاة دورة إيداع طرد كاملة</div>
                      <div className="text-[10px] text-slate-400">
                        فتح السولينويد ← فتح الباب ← إيداع 1.4 كجم ← إغلاق وقفل
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-cyan-400 group-hover:translate-x-[-4px] transition-transform">
                    تنفيذ ❯
                  </span>
                </button>

                <button
                  id="sim-trigger-tamper-btn"
                  onClick={simulateTamperAttack}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/80 text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-2.5 text-right">
                    <div className="p-2 rounded-lg bg-rose-900/80 text-rose-300">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-rose-200">محاكاة محاولة خلع ميكانيكي واهتزاز (4.8G)</div>
                      <div className="text-[10px] text-rose-400/80">
                        إطلاق إنذار أمني وتفعيل صفارة 110dB وتسجيل حدث اختراق
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-rose-400">اختبار الأمان ❯</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleEmergencySiren()}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      hardwareSim.sirenActive
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {hardwareSim.sirenActive ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        إيقاف صفارة 110dB
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        إطلاق صفارة 110dB
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTamperStatus}
                    className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    إعادة ضبط الحساسات
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CAMERA' && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=80"
                  alt="Live 2K Camera Feed"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* AI HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 text-emerald-400 border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      REC 2K • 60 FPS • AI-POD
                    </span>
                    <span className="px-2 py-1 rounded bg-black/60 text-slate-300 font-mono">
                      {new Date().toLocaleTimeString('ar-EG')}
                    </span>
                  </div>

                  {/* Bounding box */}
                  <div className="self-center w-48 h-36 border-2 border-cyan-400/80 rounded-lg flex flex-col justify-between p-1.5 bg-cyan-500/10">
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1 rounded self-start font-mono">
                      PACKAGE #{activeOrder?.id || hardwareSim.compartmentId} (99.2%)
                    </span>
                    <span className="text-[10px] text-emerald-300 bg-black/60 px-1 rounded self-end font-mono">
                      LOAD CELL: +1.43kg MATCHED
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-cyan-300 bg-black/60 px-2 py-1 rounded self-start border border-cyan-800/40">
                    SEC-HASH: #8F2B9D • SHA-256 VERIFIED
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SENSORS' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">مستشعر الوزن الديناميكي</span>
                <div className="text-lg font-bold text-cyan-400 font-mono">
                  {hardwareSim.weightKg.toFixed(2)} kg
                </div>
                <div className="text-[10px] text-emerald-400">معايرة دقيقة (Zero Calibrated)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">حساس الصدمات والاهتزاز</span>
                <div
                  className={`text-lg font-bold font-mono ${
                    hardwareSim.isTamperTriggered ? 'text-rose-400 animate-pulse' : 'text-slate-200'
                  }`}
                >
                  {hardwareSim.isTamperTriggered ? '4.8 G' : '0.05 G'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hardwareSim.isTamperTriggered ? 'تحذير خلع نشط' : 'مستقر وآمن تماماً'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-xs">جهد البطارية الاحتياطية</span>
                <div className="text-lg font-bold text-amber-400 font-mono">12.4 V DC</div>
                <div className="text-[10px] text-slate-400">LiFePO4 8000mAh (99%)</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            طبقة واجهة العتاد: <code className="text-cyan-400">ISmartLockService + ISmartBoxService</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
          >
            إغلاق المحاكي
          </button>
        </div>
      </div>
    </div>
  );
};
