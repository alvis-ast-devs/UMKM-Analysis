import { DiagnosticResult, DiagnosticVariant } from '../types/umkm';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  result: DiagnosticResult;
}

export function StatusBadge({ result }: StatusBadgeProps) {
  const variant = result.variant;

  if (variant === 'PRIMA_HIJAU') {
    return (
      <div className="mt-5 rounded-2xl p-5 border border-emerald-500/30 bg-emerald-50 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">
              Status: Kesehatan Operasional Prima
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
                BISNIS SEHAT & PERTUMBUHAN KUAT
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-200">
          <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Skor Ketahanan
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {result.health_score}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 ml-1">
              Sangat Sehat
            </span>
          </div>
        </div>
      </div>
    );
  }

  // KRITIS_MERAH
  return (
    <div
      className="rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-rose-50/80 border-rose-200 text-rose-950 shadow-glow-coral"
    >
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
            Prediksi Status Operasional
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600">
              [{result.status}]
            </span>
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-200">
              Skor Kesehatan: {result.health_score}/100
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:items-end">
        <span className="text-xs text-slate-600 font-medium">Tingkat Risiko:</span>
        <span className="text-sm font-bold text-rose-600">
          {result.risk_level}
        </span>
      </div>
    </div>
  );
}
