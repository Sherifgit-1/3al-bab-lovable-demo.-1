/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cpu,
  Battery,
  Wifi,
  Thermometer,
  RotateCw,
  Sliders,
  Radio,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const AdminFleetTelematics: React.FC = () => {
  const { boxes, setAdminView, triggerHardwareCycle } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [calibratingBox, setCalibratingBox] = useState<string | null>(null);

  const filteredBoxes = boxes.filter(
    (b) =>
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCalibrate = (boxId: string) => {
    setCalibratingBox(boxId);
    setTimeout(() => {
      setCalibratingBox(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
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
            أسطول الصناديق الذكية والمقاييس العتادية (Fleet Hardware Telematics)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            مراقبة الحالة الكهروميكانيكية، البطاريات الاحتياطية، وحساسات الوزن لـ 1,428 وحدة منتشرة.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="بحث بكود الصندوق أو المنطقة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-3" />
        </div>
      </div>

      {/* Box Telematics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBoxes.map((b) => (
          <div
            key={b.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl"
          >
            {/* Box Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white">{b.id}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {b.area}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{b.location}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>4G LTE (RSSI -68dBm)</span>
                </span>
              </div>
            </div>

            {/* Hardware Telemetry Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">البطارية</span>
                <span className="font-mono text-cyan-400 font-bold">{b.batteryLevel}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">الحرارة</span>
                <span className="font-mono text-amber-400 font-bold">{b.temperature}°C</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">استجابة القفل</span>
                <span className="font-mono text-emerald-400 font-bold">28ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">MCU State</span>
                <span className="font-mono text-white font-bold">ACTIVE</span>
              </div>
            </div>

            {/* 4 Compartments Status Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">سعة وتشخيص الحجيرات (Locker Cells):</span>
                <span className="text-[10px] text-slate-500 font-mono">Load Cells Calibrated</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                {b.compartments.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-2 rounded-lg border ${
                      comp.status === 'RESERVED' || comp.status === 'OCCUPIED'
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>حجيرة {comp.id}</div>
                    <div className="text-[9px] opacity-75">{comp.size} • {comp.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MCU Action Controls */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => handleCalibrate(b.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {calibratingBox === b.id ? 'جاري ضبط الحساسات...' : 'معايرة حساس الوزن (Zero)'}
                </span>
              </button>

              <button
                onClick={() => triggerHardwareCycle(1.4)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-semibold transition-colors"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>اختبار القفل الكهرومغناطيسي</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
