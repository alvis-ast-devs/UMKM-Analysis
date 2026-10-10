import { DiagnosticVariant } from '../types/umkm';

interface MetricCardsProps {
  metrics: {
    net_profit_margin: number;
    burn_rate_ratio: number;
    repeat_order_rate: number;
    transaction_count: number;
    peak_hour_latency: 'Low' | 'Med' | 'High';
  };
  variant: DiagnosticVariant;
}

export function MetricCards({ metrics, variant }: MetricCardsProps) {
  if (variant === 'PRIMA_HIJAU') {
    return (
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Net Profit Margin</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Prima
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1.5">
            +{metrics.net_profit_margin}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
            Margin operasional sehat dan sangat menguntungkan.
          </p>
        </div>
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Burn Rate Ratio</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Aman
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1.5">
            {metrics.burn_rate_ratio}x
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
            Pengeluaran terkendali di bawah arus kas masuk.
          </p>
        </div>
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>Repeat Order</span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              Unggul
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1.5">
            {metrics.repeat_order_rate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
            Retensi pelanggan di atas rata-rata industri.
          </p>
        </div>
      </div>
    );
  }

  // KRITIS_MERAH
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
        <div className="text-[11px] font-medium text-slate-600">Profit Margin</div>
        <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
          {metrics.net_profit_margin}%
        </div>
        <div
          className={`text-[10px] font-semibold mt-0.5 ${
            metrics.net_profit_margin < 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {metrics.net_profit_margin < 0 ? 'Defisit Akut' : 'Margin Positif'}
        </div>
      </div>
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
        <div className="text-[11px] font-medium text-slate-600">Burn Ratio</div>
        <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
          {metrics.burn_rate_ratio}x
        </div>
        <div
          className={`text-[10px] font-semibold mt-0.5 ${
            metrics.burn_rate_ratio > 1.0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {metrics.burn_rate_ratio > 1.0 ? 'Over-budget' : 'Burn Sehat'}
        </div>
      </div>
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
        <div className="text-[11px] font-medium text-slate-600">Repeat Order</div>
        <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">
          {metrics.repeat_order_rate}%
        </div>
        <div
          className={`text-[10px] font-semibold mt-0.5 ${
            metrics.repeat_order_rate < 20 ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {metrics.repeat_order_rate < 20 ? 'Retensi Rendah' : 'Retensi Kuat'}
        </div>
      </div>
    </div>
  );
}
