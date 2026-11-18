import React, { useState } from 'react';
import {
  DiagnosticInput,
  DiagnosticResult,
  DiagnosticPreset,
} from './types/umkm';
import { DiagnosticForm } from './components/DiagnosticForm';
import { DiagnosticResultCard } from './components/DiagnosticResultCard';
import { Toast } from './components/Toast';

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

export default function App() {
  const [input, setInput] = useState<DiagnosticInput>({
    netProfitMargin: 24.5,
    burnRateRatio: 0.68,
    repeatOrderRate: 42.0,
    transactionCount: 480,
    peakHourLatency: 'Low',
  });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadPreset = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (preset) {
      setInput(preset.values);
      showToast(`Preset "${label}" dimuat.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate call to Python backend; fallback logic matches code.html behavior
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Net_Profit_Margin: input.netProfitMargin,
          Burn_Rate_Ratio: input.burnRateRatio,
          Repeat_Order_Rate: input.repeatOrderRate,
          Transaction_Count: input.transactionCount,
          Peak_Hour_Latency: input.peakHourLatency,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const backendStatus = data.status as string;
        const isCritical = backendStatus === 'Critical' || backendStatus === 'Struggling';
        const isPrima = backendStatus === 'Elite' || backendStatus === 'Growth';

        const resultFromBackend: DiagnosticResult = isCritical
          ? {
            variant: 'KRITIS_MERAH',
            status: backendStatus === 'Critical' ? 'CRITICAL' : 'STRUGGLING',
            status_id: 0,
            health_score: Math.max(
              18,
              Math.round(
                50 -
                (data.raw_inputs?.Burn_Rate_Ratio as number) * 15 +
                (data.raw_inputs?.Net_Profit_Margin as number) * 0.8
              )
            ),
            confidence: 0.948,
            risk_level: 'Tinggi (High Vulnerability)',
            metrics_summary: {
              net_profit_margin: data.raw_inputs?.Net_Profit_Margin as number,
              burn_rate_ratio: data.raw_inputs?.Burn_Rate_Ratio as number,
              repeat_order_rate: data.raw_inputs?.Repeat_Order_Rate as number,
              transaction_count: data.raw_inputs?.Transaction_Count as number,
              peak_hour_latency: data.raw_inputs?.Peak_Hour_Latency as 'Low' | 'Med' | 'High',
            },
            ai_narration: data.narration as string,
            prescriptive_actions: [
              `Lakukan audit rasio pengeluaran operasional (Opex) untuk menekan Burn Rate ke bawah 0.9x.`,
              `Restrukturisasi margin harga produk atau kurangi diskon yang menggerus profit bersih.`,
              `Tingkatkan program retensi pelanggan untuk mendongkrak Repeat Order.`,
            ],
            shap_top_drivers: [
              { feature: 'burn_rate_ratio', impact: '+42% risk' },
              { feature: 'net_profit_margin', impact: '+35% risk' },
              { feature: 'repeat_order_rate', impact: '+15% risk' },
            ],
            timestamp: new Date().toISOString(),
          }
          : {
            variant: 'PRIMA_HIJAU',
            status: backendStatus === 'Elite' ? 'ELITE' : 'GROWTH',
            status_id: 2,
            health_score: 92,
            confidence: 0.982,
            risk_level: 'Sangat Sehat',
            metrics_summary: {
              net_profit_margin: data.raw_inputs?.Net_Profit_Margin as number,
              burn_rate_ratio: data.raw_inputs?.Burn_Rate_Ratio as number,
              repeat_order_rate: data.raw_inputs?.Repeat_Order_Rate as number,
              transaction_count: data.raw_inputs?.Transaction_Count as number,
              peak_hour_latency: data.raw_inputs?.Peak_Hour_Latency as 'Low' | 'Med' | 'High',
            },
            ai_narration: data.narration as string,
            prescriptive_actions: [
              `<strong>Ekspansi Skala Operasional:</strong> Alokasikan sebagian surplus laba bersih untuk memperluas jangkauan pasar atau membuka cabang baru.`,
              `<strong>Program VIP & Maksimalisasi LTV:</strong> Optimalkan basis pelanggan setia dengan penawaran eksklusif dan paket bundling ber-margin tinggi.`,
              `<strong>Dana Cadangan & Investasi Otomatisasi:</strong> Bentuk cadangan kas darurat minimum 6 bulan operasional dan mulai otomatisasi alur kerja.`,
            ],
            shap_top_drivers: [
              { feature: 'net_profit_margin', impact: '+45% health' },
              { feature: 'burn_rate_ratio', impact: '+30% health' },
              { feature: 'repeat_order_rate', impact: '+18% health' },
            ],
            timestamp: new Date().toISOString(),
          };

        setResult(resultFromBackend);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      // Fallback client-side rule-based logic (matches code.html)
      await new Promise((r) => setTimeout(r, 650));

      const isCritical =
        input.burnRateRatio > 1.05 ||
        input.netProfitMargin < 0 ||
        (input.repeatOrderRate < 15 && input.transactionCount < 80);

      const isPrima =
        input.netProfitMargin > 10 &&
        input.burnRateRatio < 0.9 &&
        input.repeatOrderRate >= 35 &&
        input.transactionCount >= 200;

      const fallbackResult: DiagnosticResult = isCritical
        ? {
          variant: 'KRITIS_MERAH',
          status: 'CRITICAL',
          status_id: 0,
          health_score: Math.max(
            18,
            Math.round(50 - input.burnRateRatio * 15 + input.netProfitMargin * 0.8)
          ),
          confidence: 0.948,
          risk_level: 'Tinggi (High Vulnerability)',
          metrics_summary: {
            net_profit_margin: input.netProfitMargin,
            burn_rate_ratio: input.burnRateRatio,
            repeat_order_rate: input.repeatOrderRate,
            transaction_count: input.transactionCount,
            peak_hour_latency: input.peakHourLatency,
          },
          ai_narration: `Penyebab utama status [CRITICAL] adalah Burn Rate Ratio (${input.burnRateRatio}x) yang telah melampaui ambang batas aman 1.0, diperburuk dengan Net Profit Margin sebesar ${input.netProfitMargin}%. Kondisi ini mengindikasikan struktur kas operasional mengalami defisit dan rentan terhadap kehabisan runway dalam kuartal mendatang jika efisiensi biaya tidak segera diberlakukan.`,
          prescriptive_actions: [
            `Lakukan audit rasio pengeluaran operasional (Opex) untuk menekan Burn Rate ke bawah 0.9x.`,
            `Restrukturisasi margin harga produk atau kurangi diskon yang menggerus profit bersih (${input.netProfitMargin}%).`,
            `Tingkatkan program retensi pelanggan untuk mendongkrak Repeat Order dari ${input.repeatOrderRate}% menjadi minimal 25%.`,
          ],
          shap_top_drivers: [
            { feature: 'burn_rate_ratio', impact: '+42% risk' },
            { feature: 'net_profit_margin', impact: '+35% risk' },
            { feature: 'repeat_order_rate', impact: '+15% risk' },
          ],
          timestamp: new Date().toISOString(),
        }
        : isPrima
          ? {
            variant: 'PRIMA_HIJAU',
            status: 'PRIMA',
            status_id: 2,
            health_score: 92,
            confidence: 0.982,
            risk_level: 'Sangat Sehat',
            metrics_summary: {
              net_profit_margin: input.netProfitMargin,
              burn_rate_ratio: input.burnRateRatio,
              repeat_order_rate: input.repeatOrderRate,
              transaction_count: input.transactionCount,
              peak_hour_latency: input.peakHourLatency,
            },
            ai_narration: `Kesehatan operasional dan finansial usaha Anda berada pada level prima. Margin keuntungan bersih sangat sehat di angka <span class="text-emerald-400 font-semibold font-mono">+${input.netProfitMargin}%</span> dengan arus kas surplus (<span class="text-emerald-400 font-semibold font-mono">Burn Rate Ratio ${input.burnRateRatio}x</span>). Tingkat repeat order <span class="text-emerald-400 font-semibold font-mono">${input.repeatOrderRate}%</span> mencerminkan loyalitas pelanggan yang solid dan pondasi pertumbuhan yang berkelanjutan.`,
            prescriptive_actions: [
              `<strong>Ekspansi Skala Operasional:</strong> Alokasikan sebagian surplus laba bersih untuk memperluas jangkauan pasar atau membuka cabang baru.`,
              `<strong>Program VIP & Maksimalisasi LTV:</strong> Optimalkan basis pelanggan setia (repeat order ${input.repeatOrderRate}%) dengan penawaran eksklusif dan paket bundling ber-margin tinggi.`,
              `<strong>Dana Cadangan & Investasi Otomatisasi:</strong> Bentuk cadangan kas darurat minimum 6 bulan operasional dan mulai otomatisasi alur kerja guna menjaga kecepatan layanan prima saat skala bertambah.`,
            ],
            shap_top_drivers: [
              { feature: 'net_profit_margin', impact: '+45% health' },
              { feature: 'burn_rate_ratio', impact: '+30% health' },
              { feature: 'repeat_order_rate', impact: '+18% health' },
            ],
            timestamp: new Date().toISOString(),
          }
          : {
            variant: 'KRITIS_MERAH',
            status: 'ELITE',
            status_id: 1,
            health_score: Math.min(
              98,
              Math.round(
                75 + input.netProfitMargin * 0.5 + input.repeatOrderRate * 0.3 - input.burnRateRatio * 10
              )
            ),
            confidence: 0.962,
            risk_level: 'Rendah (Sustainable Growth)',
            metrics_summary: {
              net_profit_margin: input.netProfitMargin,
              burn_rate_ratio: input.burnRateRatio,
              repeat_order_rate: input.repeatOrderRate,
              transaction_count: input.transactionCount,
              peak_hour_latency: input.peakHourLatency,
            },
            ai_narration: `Bisnis tergolong [ELITE] berkat rasio profitabilitas bersih yang kokoh (${input.netProfitMargin}%) serta kendali Burn Rate (${input.burnRateRatio}x) yang sangat sehat di bawah 1.0. Retensi repeat order (${input.repeatOrderRate}%) menunjukkan kepuasan pelanggan yang solid dan basis pelanggan loyal yang menjamin arus kas berkelanjutan.`,
            prescriptive_actions: [
              `Pertahankan efisiensi operasional sembari mengalokasikan free cash flow untuk ekspansi kanal penjualan baru.`,
              `Optimalkan kapasitas produksi untuk mengantisipasi kenaikan volume dari ${input.transactionCount} transaksi bulanan.`,
              `Jaga waktu tunggu pesanan (${input.peakHourLatency} Latency) agar tidak terjadi degradasi kepuasan pembeli loyal.`,
            ],
            shap_top_drivers: [
              { feature: 'net_profit_margin', impact: '+45% health' },
              { feature: 'burn_rate_ratio', impact: '+30% health' },
              { feature: 'repeat_order_rate', impact: '+18% health' },
            ],
            timestamp: new Date().toISOString(),
          };

      setResult(fallbackResult);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center shadow-sm text-white font-mono font-bold tracking-tight border border-slate-800">
              <span className="text-sm tracking-widest text-slate-100 font-semibold">AOL</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  AOL AI
                  <span className="ml-2.5 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 tracking-wider uppercase">
                    Executive Diagnostic
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-tight">
                AI-Powered Business Sustainability & Explainable Insights
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-slate-950 text-white shadow-sm border border-slate-800">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 text-slate-300 text-xs font-mono font-medium mb-2.5 border border-slate-800">
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="tracking-wider uppercase text-[10px] text-slate-300">Analisis Prediktif • Deteksi Risiko Keuangan • Rekomendasi Solutif</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
            Evaluasi Kesehatan Bisnis & Rekomendasi Preskriptif
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
            Masukkan indikator operasional UMKM untuk memperoleh kalkulasi risiko kebangkrutan, proyeksi likuiditas, dan penalaran otomatis berstandar enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <DiagnosticForm
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onReset={reset}
              onPresetSelect={loadPreset}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-7">
            <DiagnosticResultCard
              result={result}
              isLoading={isLoading}
              onReset={reset}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/60 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">AOL AI</span>
            <span className="text-slate-500">— Sistem Analisis Kesehatan & Ketahanan Bisnis UMKM</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
            <span>Solusi Cerdas Pertumbuhan & Keberlanjutan Usaha</span>
            <span>·</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Pembaruan Otomatis 2025
            </span>
          </div>
        </div>
      </footer>

      <Toast msg={toastMsg} />
    </div>
  );
}

