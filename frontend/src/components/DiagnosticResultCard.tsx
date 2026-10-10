import { DiagnosticResult } from '../types/umkm';
import { StatusBadge } from './StatusBadge';
import { MetricCards } from './MetricCards';
import { AiNarration } from './AiNarration';
import { RawJsonAccordion } from './RawJsonAccordion';
import { RotateCcw } from 'lucide-react';

interface DiagnosticResultCardProps {
  result: DiagnosticResult | null;
  isLoading: boolean;
  onReset: () => void;
}

export function DiagnosticResultCard({ result, isLoading, onReset }: DiagnosticResultCardProps) {
  const isPrima = result?.variant === 'PRIMA_HIJAU';
  const headerTitle = isPrima ? 'Hasil Evaluasi Kesehatan Bisnis' : 'Diagnostic Result & Insights';
  const footerBtnLabel = isPrima ? 'Diagnosa Ulang / Perbarui Data' : 'Bersihkan & Uji Ulang';
  const accentColor = isPrima ? 'bg-emerald-500' : 'bg-brand-500';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-retro-card p-6 sm:p-8 min-h-[580px] flex flex-col justify-between transition-all duration-300">
      {result ? (
        <div className="flex-col h-full space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className={accentColor} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                {headerTitle}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500 font-medium">Tingkat Akurasi Evaluasi:</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <StatusBadge result={result} />
          <MetricCards metrics={result.metrics_summary} variant={result.variant} />
          <AiNarration narration={result.ai_narration} prescriptiveActions={result.prescriptive_actions} variant={result.variant} />
          <RawJsonAccordion payload={result.metrics_summary} response={result} />

          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              {footerBtnLabel}
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="my-auto py-16 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-brand-600 animate-spin flex items-center justify-center" />
            <div className="absolute inset-0 flex items-center justify-center text-brand-600">
              <Brain className="w-7 h-7 animate-pulse" />
            </div>
          </div>
          <h4 className="text-lg font-bold text-slate-900 tracking-tight mb-1">AI sedang menganalisis data...</h4>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm">
            Mengevaluasi parameter keuangan, menghitung skor likuiditas, dan mengonstruksi penalaran naratif preskriptif...
          </p>
          <div className="mt-6 flex items-center gap-2 font-mono text-xs text-indigo-600 bg-indigo-50/80 px-4 py-1.5 rounded-full border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
            <span className="">Running SHAP Tree Explainer...</span>
          </div>
        </div>
      ) : (
        <div className="my-auto py-12 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
              <Cpu className="w-10 h-10 stroke-[1.5] text-slate-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-brand-600 shadow">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-800 tracking-tight mb-2">Menunggu Data Usaha</h4>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6 font-medium">
            Masukkan data operasional bisnis Anda di formulir sebelah kiri untuk memulai analisa.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-sans font-medium text-slate-700">Siap menganalisis kesehatan keuangan usaha Anda</span>
          </div>
        </div>
      )}
    </div>
  );
}

import { Brain, Sparkles, Cpu } from 'lucide-react';
