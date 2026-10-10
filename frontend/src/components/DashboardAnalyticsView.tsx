import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  Legend,
} from 'recharts';
import { UMKMRecord } from '../types/umkm';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardAnalyticsViewProps {
  record: UMKMRecord;
  onExportPDF: () => void;
  onOpenSimulator: () => void;
}

export const DashboardAnalyticsView: React.FC<DashboardAnalyticsViewProps> = ({
  record,
  onExportPDF,
  onOpenSimulator,
}) => {
  const { input, analysis } = record;

  // Combine 6-month history with 3-month projection for seamless chart visualization
  const combinedTimelineData = [
    ...input.riwayatBulanan.map((m) => ({
      name: m.month,
      omzetAktual: m.omzetJuta,
      labaBersih: m.labaBersihJuta,
      proyeksiBaseline: null as number | null,
      proyeksiOptimis: null as number | null,
    })),
    ...analysis.proyeksiOmzet3Bulan.map((p) => ({
      name: p.month,
      omzetAktual: null as number | null,
      labaBersih: null as number | null,
      proyeksiBaseline: p.baselineJuta,
      proyeksiOptimis: p.optimisJuta,
    })),
  ];

  // Bridge the last historical point to the first projection point
  if (input.riwayatBulanan.length > 0 && combinedTimelineData.length > input.riwayatBulanan.length) {
    const lastIdx = input.riwayatBulanan.length - 1;
    combinedTimelineData[lastIdx].proyeksiBaseline = input.riwayatBulanan[lastIdx].omzetJuta;
    combinedTimelineData[lastIdx].proyeksiOptimis = input.riwayatBulanan[lastIdx].omzetJuta;
  }

  const getStatusTheme = () => {
    if (analysis.status === 'BERKEMBANG') {
      return {
        label: 'STATUS: BERKEMBANG',
        subLabel: 'Pertumbuhan Positif & Fundamental Sehat',
        border: 'border-emerald-600/30',
        bg: 'bg-emerald-50/70',
        textPrimary: 'text-emerald-900',
        textAccent: 'text-emerald-700',
        barColor: 'bg-emerald-600',
        Icon: CheckCircle2,
      };
    }
    if (analysis.status === 'TRANSISI') {
      return {
        label: 'STATUS: TRANSISI / KONSOLIDASI',
        subLabel: 'Pertumbuhan Moderat dengan Ruang Optimasi',
        border: 'border-amber-600/30',
        bg: 'bg-amber-50/70',
        textPrimary: 'text-amber-900',
        textAccent: 'text-amber-700',
        barColor: 'bg-amber-600',
        Icon: AlertTriangle,
      };
    }
    return {
      label: 'STATUS: STAGNAN (PERLU INTERVENSI)',
      subLabel: 'Tekanan Omzet, Retensi & Efisiensi Modal Kerja',
      border: 'border-rose-600/30',
      bg: 'bg-rose-50/70',
      textPrimary: 'text-rose-900',
      textAccent: 'text-rose-700',
      barColor: 'bg-rose-600',
      Icon: TrendingDown,
    };
  };

  const theme = getStatusTheme();
  const StatusIcon = theme.Icon;

  return (
    <div className="space-y-6">
      {/* Primary Focal Anchor: AI Classification & Executive Summary Banner */}
      <div className={`bg-white border ${theme.border} rounded-xl p-6`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-medium text-slate-700">{input.id}</span>
              <span aria-hidden="true">·</span>
              <span>{input.sektor}</span>
              <span aria-hidden="true">·</span>
              <span>{input.kotaKabupaten}</span>
              <span aria-hidden="true">·</span>
              <span>Beroperasi {input.lamaBeroperasiTahun} Tahun</span>
              <span aria-hidden="true">·</span>
              <span>{input.jumlahKaryawan} Tenaga Kerja</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {input.namaUsaha}
            </h1>

            <p className="text-sm text-slate-700 leading-relaxed pt-1">
              {analysis.ringkasanEksekutif}
            </p>
          </div>

          {/* Right Classification Score Block */}
          <div className={`${theme.bg} border ${theme.border} rounded-lg p-4 lg:w-80 shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${theme.textAccent}`} />
                <span className={`text-xs font-bold tracking-tight ${theme.textPrimary}`}>
                  {theme.label}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                Conf: {analysis.modelConfidencePersen}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-600">Indeks Pertumbuhan AI</div>
                <div className={`text-3xl font-bold font-mono tabular-nums ${theme.textPrimary}`}>
                  {analysis.growthProbabilityScore}
                  <span className="text-sm font-normal text-slate-500"> / 100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-600">Tren MoM</div>
                <div
                  className={`text-sm font-semibold font-mono tabular-nums flex items-center justify-end gap-0.5 ${
                    input.pertumbuhanOmzetMoMPersen >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {input.pertumbuhanOmzetMoMPersen >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {input.pertumbuhanOmzetMoMPersen > 0 ? '+' : ''}
                  {input.pertumbuhanOmzetMoMPersen}%
                </div>
              </div>
            </div>

            <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden mt-3 border border-slate-200/60">
              <div
                className={`h-full ${theme.barColor} transition-all duration-300`}
                style={{ width: `${analysis.growthProbabilityScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>0 (Stagnan &lt;46)</span>
              <span>Transisi (46–65)</span>
              <span>Berkembang (&ge;66)</span>
            </div>
          </div>
        </div>

        {/* 4 Key Quantitative Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          <div>
            <div className="text-xs text-slate-500">Omzet Bulanan Rata-Rata</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              Rp {input.omzetBulananRataRataJuta.toFixed(1)} Jt
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
              Pertumbuhan 6 Bln: {analysis.indikatorUtama.cagr6BulanPersen > 0 ? '+' : ''}
              {analysis.indikatorUtama.cagr6BulanPersen}%
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <div className="text-xs text-slate-500">Margin Laba Bersih & Arus Kas</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {input.marginLabaBersihPersen.toFixed(1)}%
              <span className="text-sm font-normal text-slate-500">
                {' '}
                · {input.rasioArusKasOperasional.toFixed(2)}x Kas
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
              Ketahanan Kas: ~{analysis.indikatorUtama.indeksKetahananKasBulan} Bulan
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <div className="text-xs text-slate-500">Retensi Pelanggan & AOV</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {input.tingkatRetensiPelangganPersen}%
              <span className="text-sm font-normal text-slate-500">
                {' '}
                · Rp {input.rataRataNilaiTransaksiRibu}rb
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
              Akuisisi Pelanggan Baru: +{input.pertumbuhanPelangganBaruPersen}%/bln
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <div className="text-xs text-slate-500">Maturitas Digital & Stok</div>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {input.skorAdopsiDigital}/100
              <span className="text-sm font-normal text-slate-500">
                {' '}
                · {input.rasioPenjualanOnlinePersen}% Online
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1 font-mono tabular-nums">
              Perputaran Persediaan: {input.perputaranPersediaanHari} Hari
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Historical & Projected Revenue Chart + Multi-Dimensional Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month History + 3-Month AI Projection */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Tren Realisasi Omzet (6 Bulan) & Proyeksi AI (3 Bulan Ke Depan)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan realisasi pendapatan historis dengan proyeksi baseline vs skenario intervensi optimal (Rp Juta)
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSimulator}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Ubah Parameter
            </button>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedTimelineData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOptimis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `Rp${v}Jt`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(value: unknown, name: string) => {
                    if (value === null || value === undefined) return ['-', name];
                    return [`Rp ${Number(value).toFixed(1)} Jt`, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="omzetAktual"
                  name="Omzet Aktual"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOmzet)"
                />
                <Area
                  type="monotone"
                  dataKey="labaBersih"
                  name="Laba Bersih Aktual"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="proyeksiBaseline"
                  name="Proyeksi Baseline AI"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="proyeksiOptimis"
                  name="Proyeksi Skenario Intervensi"
                  stroke="#16A34A"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorOptimis)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Dimension Radar Comparison vs Sector Benchmark */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              02. Pemetaan 6 Dimensi Kesehatan UMKM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Skor aktual usaha dibandingkan median sektor {input.sektor}
            </p>
          </div>

          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={analysis.dimensiSkor}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                />
                <Radar
                  name={input.namaUsaha}
                  dataKey="score"
                  stroke="#0F172A"
                  strokeWidth={2}
                  fill="#0F172A"
                  fillOpacity={0.25}
                />
                <Radar
                  name="Benchmark Sektor"
                  dataKey="sectorBenchmark"
                  stroke="#0284C7"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="#0284C7"
                  fillOpacity={0.08}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Feature Attribution (Explainable AI / SHAP Impact) + Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Contribution Bar Chart & Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="pb-4 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">
              03. Kontribusi Variabel Penentu Status (Explainable AI Attribution)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mengukur seberapa kuat masing-masing variabel mendorong status menuju Berkembang (+) atau menahan di zona Stagnan (-)
            </p>
          </div>

          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={analysis.kontribusiFitur}
                margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[-45, 45]}
                  tick={{ fontSize: 11, fill: '#475569', fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={185}
                  tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 500 }}
                />
                <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                  }}
                  formatter={(value: unknown) => [
                    `${Number(value) > 0 ? '+' : ''}${value} Poin Kontribusi`,
                    'Dampak Fitur AI',
                  ]}
                />
                <Bar dataKey="impactScore" radius={[4, 4, 4, 4]} barSize={18}>
                  {analysis.kontribusiFitur.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.impactScore >= 2
                          ? '#16A34A'
                          : entry.impactScore <= -2
                          ? '#DC2626'
                          : '#D97706'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* High-Density Feature Attribution Table */}
          <div className="mt-4 pt-4 border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="py-2 pr-3">Variabel Diagnostik</th>
                  <th className="py-2 px-3 text-right">Nilai Aktual</th>
                  <th className="py-2 px-3 text-right">Bobot Model</th>
                  <th className="py-2 px-3 text-right">Skor Dampak</th>
                  <th className="py-2 pl-3">Evaluasi Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {analysis.kontribusiFitur.map((item) => (
                  <tr key={item.featureKey} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-medium text-slate-900">{item.label}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                      {item.valueFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                      {item.weightPercentage}%
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-semibold tabular-nums ${
                        item.impactScore >= 2
                          ? 'text-emerald-700'
                          : item.impactScore <= -2
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {item.impactScore > 0 ? '+' : ''}
                      {item.impactScore}
                    </td>
                    <td className="py-2.5 pl-3 text-slate-600">{item.benchmarkComparison}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Recommendations & Action Plan */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  04. Rekomendasi Preskriptif AI
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rencana intervensi terukur berdasarkan titik lemah fitur
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div className="divide-y divide-slate-200 mt-2">
              {analysis.rekomendasiStrategis.map((rec, idx) => (
                <div key={rec.id} className="py-4 first:pt-2 last:pb-0">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-slate-800">
                      0{idx + 1} · Prioritas {rec.priority}
                    </span>
                    <span className="font-mono text-emerald-700 font-medium">
                      {rec.estimatedImpact}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{rec.title}</h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Target Indikator: <strong className="text-slate-800">{rec.targetMetric}</strong>
                  </div>
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                    {rec.actionSteps.map((step, sIdx) => (
                      <li key={sIdx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Seluruh grafik, matriks fitur, dan rekomendasi di atas siap diunduh dalam dokumen PDF resmi.
            </div>
            <button
              type="button"
              onClick={onExportPDF}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
            >
              <FileDown className="w-4 h-4" />
              Ekspor PDF Lengkap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
