import { DiagnosticVariant } from '../types/umkm';
import { ShieldCheck, CheckCircle2, Bot } from 'lucide-react';

interface AiNarrationProps {
  narration: string;
  prescriptiveActions: string[];
  variant: DiagnosticVariant;
}

export function AiNarration({ narration, prescriptiveActions, variant }: AiNarrationProps) {
  if (variant === 'PRIMA_HIJAU') {
    return (
      <div className="mt-5 bg-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-300 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Analisis & Rekomendasi Eksekutif
              </h5>
              <p className="text-[11px] text-slate-400 font-normal">
                Executive Diagnostic Summary
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium bg-slate-900 text-emerald-400 px-2.5 py-1 rounded border border-slate-800 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Kondisi Prima
          </span>
        </div>
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800/80 mb-4">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-normal">
            {narration}
          </p>
        </div>
        <div className="pt-3 border-t border-slate-800/90">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>3 Langkah Strategi Ekspansi (Prioritas):</span>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300 font-normal">
            {prescriptiveActions.map((action, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px]">
                  {index + 1}
                </span>
                <div>{action}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // KRITIS_MERAH
  return (
    <div className="bg-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between mb-3.5 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-300 border border-slate-800">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Executive Narration
            </h5>
            <p className="text-[11px] text-slate-400 font-normal">
              AI Prescriptive Diagnostic Summary
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800 tracking-wider uppercase">
          Natural Language
        </span>
      </div>
      <div className="relative z-10 bg-slate-900/90 rounded-xl p-4 border border-slate-800/80">
        <p className="text-xs sm:text-sm leading-relaxed text-slate-200 font-normal">
          {narration}
        </p>
      </div>
      <div className="mt-4 pt-3.5 border-t border-slate-800 relative z-10">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Langkah Preskriptif Strategis:
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300 font-normal list-disc pl-4">
          {prescriptiveActions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
