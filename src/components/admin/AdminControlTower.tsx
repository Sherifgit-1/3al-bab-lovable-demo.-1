/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Cpu,
  Radio,
  Wifi,
  AlertTriangle,
  FileText,
  MapPin,
  TrendingUp,
  Box,
  Truck,
  Layers,
  Activity,
  Zap,
  Globe,
} from 'lucide-react';

export const AdminControlTower: React.FC = () => {
  const { adminView, setAdminView, securityEvents, auditLogs } = useApp();

  const [selectedCluster, setSelectedCluster] = useState<string>('التجمع الخامس');

  const clusters = [
    { name: 'التجمع الخامس (Cairo East)', boxes: 480, onlinePct: 99.2, latency: '8ms', activeDeliveries: 342 },
    { name: 'الشيخ زايد و 6 أكتوبر', boxes: 390, onlinePct: 97.4, latency: '12ms', activeDeliveries: 215 },
    { name: 'المعادي ودجلة', boxes: 275, onlinePct: 98.8, latency: '9ms', activeDeliveries: 160 },
    { name: 'مصر الجديدة ومدينة نصر', boxes: 283, onlinePct: 98.1, latency: '11ms', activeDeliveries: 125 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Admin Header & Nav Tabs */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#10243d] border border-blue-900/60 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800/60">
                برج المراقبة والتحكم المركزي • Enterprise Ops
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                MQTT Broker Cluster: Cairo-01 (100% Operational)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Cairo'] tracking-tight">
              لوحة القيادة المركزية ومراقبة العمليات (Control Tower)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              إدارة أسطول الصناديق الذكية، مراقبة الشبكة، وتتبع أمان الطرود في نطاق جمهورية مصر العربية.
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setAdminView('CONTROL_TOWER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminView === 'CONTROL_TOWER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              العمليات المركزية
            </button>
            <button
              onClick={() => setAdminView('FLEET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminView === 'FLEET'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              أسطول الصناديق والعتاد
            </button>
            <button
              onClick={() => setAdminView('SECURITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                adminView === 'SECURITY'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>مركز الأمان</span>
            </button>
            <button
              onClick={() => setAdminView('AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminView === 'AUDIT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              سجل التدقيق المشفر
            </button>
            <button
              onClick={() => setAdminView('DIRECTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                adminView === 'DIRECTORY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              العملاء والمتاجر والمناديب
            </button>
          </div>
        </div>
      </div>

      {/* 5 Key Fleet Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الصناديق الذكية المتصلة</span>
            <Box className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">1,428</div>
          <p className="text-[10px] text-emerald-400 font-mono">98.4% Online (4G/FTTH)</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الشحنات اليوم</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">4,890</div>
          <p className="text-[10px] text-emerald-400 font-mono">+18.2% عن الأسبوع الماضي</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>شحنات خارجية نشطة</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">842</div>
          <p className="text-[10px] text-blue-400">Amazon • Noon • Aramex</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>حوادث أمنية تحت التحقيق</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">03</div>
          <p className="text-[10px] text-rose-300">تم احتواء 2 • جاري فحص 1</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>المناديب النشطين</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">218</div>
          <p className="text-[10px] text-slate-400">زمن الاستجابة: 8.5 د</p>
        </div>
      </div>

      {/* Cairo IoT Cluster Interactive Node Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                خريطة قطاعات شبكة الصناديق الذكية (Cairo IoT Grid)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">MQTT Heartbeat: 1000ms</span>
          </div>

          {/* Interactive Cairo Map Simulation Canvas */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-72 flex flex-col justify-between p-4">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Simulated Cairo Nodes */}
            <div className="relative z-10 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[10px]">REGION: CAIRO_METRO_V3</span>
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                4 CLUSTERS CONNECTED
              </span>
            </div>

            {/* Clusters Interactive Pins */}
            <div className="relative z-10 grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
              {clusters.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setSelectedCluster(c.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedCluster === c.name
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{c.onlinePct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>{c.boxes} صندوق</span>
                    <span className="text-cyan-400">{c.latency}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 text-center text-[10px] text-slate-500 font-mono">
              تشفير اتصالات الأجهزة: TLS 1.3 • Private APN • Zero-Trust Token Auth
            </div>
          </div>
        </div>

        {/* Live MQTT Event Feed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">بث أحداث الحساسات والشبكة</h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE MQTT</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto divide-y divide-slate-800/60">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="pt-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 font-mono text-[11px]">{log.smartBoxId}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-1">{log.details}</p>
                <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between">
                  <span>{log.actor}</span>
                  <span className="text-emerald-400">{log.digitalHash.slice(0, 16)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
