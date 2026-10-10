import React from 'react';
import { DiagnosticInput, DiagnosticPreset } from '../types/umkm';
import {
  Info,
  AlertCircle,
  Repeat,
  ShoppingCart,
  Zap,
  Percent,
  Flame,
  SlidersHorizontal,
  Search,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

const PRESETS: DiagnosticPreset[] = [
  {
    label: 'Kritis',
    values: {
      netProfitMargin: -12.4,
      burnRateRatio: 1.35,
      repeatOrderRate: 11.2,
      transactionCount: 45,
      peakHourLatency: 'High',
    },
  },
  {
    label: 'Elite',
    values: {
      netProfitMargin: 24.8,
      burnRateRatio: 0.62,
      repeatOrderRate: 46.5,
      transactionCount: 380,
      peakHourLatency: 'Low',
    },
  },
];

interface DiagnosticFormProps {
  input: DiagnosticInput;
  onInputChange: (next: DiagnosticInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  onPresetSelect: (label: string) => void;
  isLoading: boolean;
}

export function DiagnosticForm({
  input,
  onInputChange,
  onSubmit,
  onReset,
  onPresetSelect,
  isLoading,
}: DiagnosticFormProps) {
  const update = (key: keyof DiagnosticInput, value: number | 'Low' | 'Med' | 'High') => {
    onInputChange({ ...input, [key]: value });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-retro-card p-6 sm:p-7 transition-all">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Input Key Business Metrics
            </h3>
            <p className="text-xs text-slate-500 font-medium">Top High-Impact Operational Factors</p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
          5 Parameter
        </span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="netProfitMargin" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              1. Net Profit Margin
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">Satuan %</span>
          </div>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Percent className="w-4 h-4" />
            </div>
            <input
              id="netProfitMargin"
              type="number"
              step="0.01"
              required
              value={input.netProfitMargin}
              onChange={(e) => update('netProfitMargin', Number(e.target.value))}
              placeholder="Contoh: 15.0 atau -10.5"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-12 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-mono font-medium text-slate-400">
              %
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Rasio laba bersih terhadap omzet penjualan (dapat bernilai negatif).
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="burnRateRatio" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              2. Burn Rate Ratio
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">Pengeluaran / Pemasukan</span>
          </div>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Flame className="w-4 h-4" />
            </div>
            <input
              id="burnRateRatio"
              type="number"
              step="0.01"
              required
              value={input.burnRateRatio}
              onChange={(e) => update('burnRateRatio', Number(e.target.value))}
              placeholder="Contoh: 0.85 atau 1.25"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-12 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-mono font-medium text-slate-400">
              ratio
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Nilai &gt; 1.0 berarti pengeluaran operasional melampaui kas masuk.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="repeatOrderRate" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              3. Repeat Order Rate
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">Customer Retention</span>
          </div>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Repeat className="w-4 h-4" />
            </div>
            <input
              id="repeatOrderRate"
              type="number"
              step="0.1"
              required
              value={input.repeatOrderRate}
              onChange={(e) => update('repeatOrderRate', Number(e.target.value))}
              placeholder="Contoh: 28.5"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-12 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-mono font-medium text-slate-400">
              %
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Persentase pelanggan yang melakukan pembelian ulang dalam 30 hari.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="transactionCount" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              4. Transaction Count
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">Volume / Bulan</span>
          </div>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <input
              id="transactionCount"
              type="number"
              required
              value={input.transactionCount}
              onChange={(e) => update('transactionCount', Number(e.target.value))}
              placeholder="Contoh: 140"
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-12 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-mono font-medium text-slate-400">
              trx
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="peakHourLatency" className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              5. Kecepatan Layanan Jam Sibuk
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">Kecepatan Layanan</span>
          </div>
          <div className="relative rounded-xl shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Zap className="w-4 h-4" />
            </div>
            <select
              id="peakHourLatency"
              value={input.peakHourLatency}
              onChange={(e) => update('peakHourLatency', e.target.value as 'Low' | 'Med' | 'High')}
              className="block w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm font-medium text-slate-900 bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Low">Cepat (&lt; 5 menit pemenuhan pesanan)</option>
              <option value="Med">Sedang (5 - 15 menit pemenuhan pesanan)</option>
              <option value="High">Lama (&gt; 15 menit antrean padat)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Waktu tunggu / kelambatan operasional saat jam sibuk.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-slate-800 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4 text-slate-300" />
            <span className="tracking-wider">Diagnosa Kesehatan Bisnis</span>
          </button>
        </div>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
        <span className="flex items-center gap-1.5 font-sans font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Data Terenkripsi & Rahasia
        </span>
        <span className="text-slate-500 font-sans font-medium">Hasil Rekomendasi Instan</span>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPresetSelect(preset.label)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

