export type GrowthStatus = 'BERKEMBANG' | 'TRANSISI' | 'STAGNAN';

export interface MonthlyMetric {
  month: string;
  omzetJuta: number;
  biayaOperasionalJuta: number;
  labaBersihJuta: number;
  jumlahTransaksi: number;
  pelangganBaru: number;
  pelangganBerulang: number;
}

export interface FeatureContribution {
  featureKey: string;
  label: string;
  valueFormatted: string;
  weightPercentage: number;
  impactScore: number; // -100 to +100
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  benchmarkComparison: string;
}

export interface DimensionScore {
  dimension: string;
  score: number; // 0 - 100
  sectorBenchmark: number; // 0 - 100
}

export interface ActionRecommendation {
  id: string;
  priority: 'TINGGI' | 'SEDANG' | 'RENDAH';
  category: 'KEUANGAN' | 'PEMASARAN_DIGITAL' | 'OPERASIONAL' | 'RETENSI_PELANGGAN';
  title: string;
  targetMetric: string;
  estimatedImpact: string;
  actionSteps: string[];
}

export interface UMKMInputPayload {
  id: string;
  namaUsaha: string;
  sektor: 'Kuliner (F&B)' | 'Kriya & Fashion' | 'Agribisnis & Olahan' | 'Jasa & Perdagangan' | 'Manufaktur Mikro';
  kotaKabupaten: string;
  lamaBeroperasiTahun: number;
  jumlahKaryawan: number;
  // Financial & Operational features fed to the AI model
  omzetBulananRataRataJuta: number;
  pertumbuhanOmzetMoMPersen: number;
  marginLabaBersihPersen: number;
  rasioArusKasOperasional: number; // > 1.0 healthy
  rasioUtangTerhadapAsetPersen: number;
  // Customer & Market features
  tingkatRetensiPelangganPersen: number;
  pertumbuhanPelangganBaruPersen: number;
  rataRataNilaiTransaksiRibu: number;
  // Digital & Innovation features
  skorAdopsiDigital: number; // 0 - 100 (QRIS, Pencatatan Digital, Marketplace, Social Commerce)
  rasioPenjualanOnlinePersen: number;
  frekuensiInovasiProdukPerTahun: number;
  perputaranPersediaanHari: number;
  // Historical 6-month series
  riwayatBulanan: MonthlyMetric[];
}

export interface AIModelPredictionResult {
  umkmId: string;
  timestamp: string;
  status: GrowthStatus;
  growthProbabilityScore: number; // 0 - 100 (e.g., 82.4% confidence of growing / health index)
  modelConfidencePersen: number;
  ringkasanEksekutif: string;
  indikatorUtama: {
    cagr6BulanPersen: number;
    efisiensiBiayaPersen: number;
    indeksKetahananKasBulan: number;
    produktivitasPerKaryawanJuta: number;
  };
  dimensiSkor: DimensionScore[];
  kontribusiFitur: FeatureContribution[];
  proyeksiOmzet3Bulan: {
    month: string;
    baselineJuta: number;
    optimisJuta: number;
  }[];
  rekomendasiStrategis: ActionRecommendation[];
}

export interface UMKMRecord {
  input: UMKMInputPayload;
  analysis: AIModelPredictionResult;
}

export interface FlaskBackendConfig {
  endpointUrl: string;
  mode: 'SIMULASI_LOKAL' | 'FLASK_API_LIVE';
  apiKeyHeader?: string;
  timeoutMs: number;
  lastTestedAt?: string;
  connectionStatus: 'UNTESTED' | 'CONNECTED' | 'ERROR';
  errorMessage?: string;
}
