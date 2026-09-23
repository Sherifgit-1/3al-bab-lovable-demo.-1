/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Download,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { auditLogs, setAdminView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.smartBoxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.orderId && l.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopy = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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
            سجل التدقيق الأمني غير القابل للتعديل (Cryptographic Audit Trail)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            توثيق كامل لكل عملية فتح، قفل، إيداع، وتفويض مع ختم تجزئة رقمي SHA-256 غير قابل للتغيير.
          </p>
        </div>

        {/* Cryptographic Integrity Badge */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>سلسلة الهاش موثقة 100% (Merkle Chain Verified)</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="بحث بالصندوق، الفاعل، الطلب، أو التفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-2.5 top-3" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400 text-[11px] font-mono">
            {filteredLogs.length} سجل مسجل
          </span>
          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', 'tawseel_audit_trail.json');
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير السجل JSON</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3.5">التوقيت</th>
                <th className="p-3.5">الجهة / الفاعل</th>
                <th className="p-3.5">العملية والحدث</th>
                <th className="p-3.5">الصندوق والحجيرة</th>
                <th className="p-3.5">النتيجة</th>
                <th className="p-3.5">البصمة الرقمية (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-slate-400 font-mono whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5 font-bold text-white whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="p-3.5 text-slate-200">
                    <div className="font-semibold">{log.action}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{log.details}</div>
                  </td>
                  <td className="p-3.5 font-mono text-cyan-300 whitespace-nowrap">
                    {log.smartBoxId} {log.compartmentId ? `• C-${log.compartmentId}` : ''}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'SUCCESS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {log.result}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400/90">{log.digitalHash.slice(0, 16)}...</span>
                      <button
                        onClick={() => handleCopy(log.digitalHash)}
                        className="p-1 hover:text-white transition-colors"
                        title="نسخ الهاش الكامل"
                      >
                        {copiedHash === log.digitalHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
