import { UMKMInputPayload, AIModelPredictionResult, FeatureContribution, DimensionScore, ActionRecommendation, GrowthStatus, UMKMRecord } from '../types/umkm';

/**
 * Deterministic AI Inference Engine that replicates a Python Flask Scikit-Learn / XGBoost
 * classification + SHAP feature attribution model for UMKM Growth vs Stagnation detection.
 */
export function runLocalUMKMInference(input: UMKMInputPayload): AIModelPredictionResult {
  // 1. Compute normalized sub-scores (0 to 100) across 6 core dimensions
  const finGrowthScore = Math.max(0, Math.min(100, 50 + input.pertumbuhanOmzetMoMPersen * 4.2));
  const profitHealthScore = Math.max(0, Math.min(100, (input.marginLabaBersihPersen / 28) * 100));
  const cashflowScore = Math.max(
    0,
    Math.min(
      100,
      input.rasioArusKasOperasional * 55 - input.rasioUtangTerhadapAsetPersen * 0.45
    )
  );

  const retentionScore = Math.max(
    0,
    Math.min(
      100,
      input.tingkatRetensiPelangganPersen * 0.85 + input.pertumbuhanPelangganBaruPersen * 1.8
    )
  );

  const digitalScore = Math.max(
    0,
    Math.min(
      100,
      input.skorAdopsiDigital * 0.65 + input.rasioPenjualanOnlinePersen * 0.55
    )
  );

  const operationalScore = Math.max(
    0,
    Math.min(
      100,
      85 - Math.max(0, input.perputaranPersediaanHari - 14) * 1.1 + input.frekuensiInovasiProdukPerTahun * 5.5
    )
  );

  // Weighted composite probability score (0 - 100)
  const compositeRaw =
    finGrowthScore * 0.24 +
    profitHealthScore * 0.18 +
    cashflowScore * 0.16 +
    retentionScore * 0.18 +
    digitalScore * 0.14 +
    operationalScore * 0.10;

  const growthProbabilityScore = Number(Math.max(8, Math.min(98, compositeRaw)).toFixed(1));

  let status: GrowthStatus = 'STAGNAN';
  if (growthProbabilityScore >= 66) {
    status = 'BERKEMBANG';
  } else if (growthProbabilityScore >= 46) {
    status = 'TRANSISI';
  } else {
    status = 'STAGNAN';
  }

  // Calculate model confidence based on distance from decision boundaries (46 and 66)
  const distFromBoundary =
    status === 'BERKEMBANG'
      ? Math.min(30, growthProbabilityScore - 66)
      : status === 'STAGNAN'
      ? Math.min(30, 46 - growthProbabilityScore)
      : 10 - Math.abs(56 - growthProbabilityScore) * 0.5;

  const modelConfidencePersen = Number(Math.min(97.8, Math.max(74.5, 78 + distFromBoundary * 0.65)).toFixed(1));

  // 2. Dimension Scores vs Sector Benchmarks
  const dimensiSkor: DimensionScore[] = [
    {
      dimension: 'Tren Pendapatan',
      score: Math.round(finGrowthScore),
      sectorBenchmark: 65,
    },
    {
      dimension: 'Profitabilitas',
      score: Math.round(profitHealthScore),
      sectorBenchmark: 62,
    },
    {
      dimension: 'Ketahanan Kas',
      score: Math.round(cashflowScore),
      sectorBenchmark: 68,
    },
    {
      dimension: 'Retensi Pelanggan',
      score: Math.round(retentionScore),
      sectorBenchmark: 64,
    },
    {
      dimension: 'Maturitas Digital',
      score: Math.round(digitalScore),
      sectorBenchmark: 60,
    },
    {
      dimension: 'Efisiensi Operasional',
      score: Math.round(operationalScore),
      sectorBenchmark: 63,
    },
  ];

  // 3. Feature Contribution (SHAP-like impact values)
  const momImpact = Number(((input.pertumbuhanOmzetMoMPersen - 2.5) * 4.8).toFixed(1));
  const retentionImpact = Number(((input.tingkatRetensiPelangganPersen - 48) * 0.95).toFixed(1));
  const marginImpact = Number(((input.marginLabaBersihPersen - 15) * 1.75).toFixed(1));
  const digitalImpact = Number(((input.skorAdopsiDigital - 55) * 0.65).toFixed(1));
  const cashImpact = Number(((input.rasioArusKasOperasional - 1.15) * 32).toFixed(1));
  const inventoryImpact = Number(((28 - input.perputaranPersediaanHari) * 0.85).toFixed(1));

  const kontribusiFitur: FeatureContribution[] = [
    {
      featureKey: 'mom_revenue_growth',
      label: 'Pertumbuhan Omzet Bulanan (MoM)',
      valueFormatted: `${input.pertumbuhanOmzetMoMPersen > 0 ? '+' : ''}${input.pertumbuhanOmzetMoMPersen.toFixed(1)}%`,
      weightPercentage: 24,
      impactScore: Math.max(-45, Math.min(45, momImpact)),
      direction: momImpact >= 2 ? 'POSITIVE' : momImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.pertumbuhanOmzetMoMPersen >= 4 ? 'Di atas rata-rata sektor (+3.5%/bln)' : 'Di bawah median pertumbuhan sektor',
    },
    {
      featureKey: 'customer_retention_rate',
      label: 'Tingkat Retensi Pelanggan',
      valueFormatted: `${input.tingkatRetensiPelangganPersen.toFixed(0)}%`,
      weightPercentage: 18,
      impactScore: Math.max(-40, Math.min(40, retentionImpact)),
      direction: retentionImpact >= 2 ? 'POSITIVE' : retentionImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.tingkatRetensiPelangganPersen >= 55 ? 'Loyalitas pelanggan kuat (>55%)' : 'Tingkat churn pelanggan tinggi',
    },
    {
      featureKey: 'net_profit_margin',
      label: 'Margin Laba Bersih',
      valueFormatted: `${input.marginLabaBersihPersen.toFixed(1)}%`,
      weightPercentage: 18,
      impactScore: Math.max(-40, Math.min(40, marginImpact)),
      direction: marginImpact >= 2 ? 'POSITIVE' : marginImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.marginLabaBersihPersen >= 16 ? 'Margin sehat untuk ekspansi modal' : 'Tertekan beban HPP & operasional',
    },
    {
      featureKey: 'operating_cashflow_ratio',
      label: 'Rasio Arus Kas Operasional',
      valueFormatted: `${input.rasioArusKasOperasional.toFixed(2)}x`,
      weightPercentage: 16,
      impactScore: Math.max(-38, Math.min(38, cashImpact)),
      direction: cashImpact >= 2 ? 'POSITIVE' : cashImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.rasioArusKasOperasional >= 1.2 ? 'Likuiditas operasional sangat aman' : 'Arus kas ketat terhadap kewajiban',
    },
    {
      featureKey: 'digital_adoption_score',
      label: 'Skor Adopsi & Kanal Digital',
      valueFormatted: `${input.skorAdopsiDigital}/100 (${input.rasioPenjualanOnlinePersen}% Online)`,
      weightPercentage: 14,
      impactScore: Math.max(-35, Math.min(35, digitalImpact)),
      direction: digitalImpact >= 2 ? 'POSITIVE' : digitalImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.skorAdopsiDigital >= 65 ? 'Omnichannel & pencatatan terintegrasi' : 'Ketergantungan tinggi pada transaksi offline',
    },
    {
      featureKey: 'inventory_turnover_days',
      label: 'Siklus Perputaran Persediaan',
      valueFormatted: `${input.perputaranPersediaanHari} Hari`,
      weightPercentage: 10,
      impactScore: Math.max(-30, Math.min(30, inventoryImpact)),
      direction: inventoryImpact >= 2 ? 'POSITIVE' : inventoryImpact <= -2 ? 'NEGATIVE' : 'NEUTRAL',
      benchmarkComparison: input.perputaranPersediaanHari <= 25 ? 'Perputaran modal kerja cepat' : 'Modal tertahan pada stok lambat terjual',
    },
  ].sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore));

  // 4. Key Indicators Calculation
  const firstMonthOmzet = input.riwayatBulanan[0]?.omzetJuta || input.omzetBulananRataRataJuta;
  const lastMonthOmzet = input.riwayatBulanan[input.riwayatBulanan.length - 1]?.omzetJuta || input.omzetBulananRataRataJuta;
  const cagr6BulanPersen = Number((((lastMonthOmzet - firstMonthOmzet) / Math.max(1, firstMonthOmzet)) * 100).toFixed(1));
  const efisiensiBiayaPersen = Number((100 - input.marginLabaBersihPersen).toFixed(1));
  const indeksKetahananKasBulan = Number(Math.max(0.8, (input.rasioArusKasOperasional * 2.4) - (input.rasioUtangTerhadapAsetPersen / 40)).toFixed(1));
  const produktivitasPerKaryawanJuta = Number((input.omzetBulananRataRataJuta / Math.max(1, input.jumlahKaryawan)).toFixed(1));

  // 5. 3-Month Forward Projection
  const monthlyRate = input.pertumbuhanOmzetMoMPersen / 100;
  const optimisticRate = Math.max(0.045, monthlyRate + 0.04);
  const proyeksiOmzet3Bulan = [1, 2, 3].map((step) => {
    const baseline = Number((lastMonthOmzet * Math.pow(1 + monthlyRate, step)).toFixed(1));
    const optimis = Number((lastMonthOmzet * Math.pow(1 + optimisticRate, step)).toFixed(1));
    return {
      month: `Bulan +${step}`,
      baselineJuta: Math.max(5, baseline),
      optimisJuta: Math.max(baseline + 2, optimis),
    };
  });

  // 6. Tailored Recommendations
  const rekomendasiStrategis: ActionRecommendation[] = [];

  if (input.pertumbuhanOmzetMoMPersen < 2.5 || input.rasioPenjualanOnlinePersen < 25) {
    rekomendasiStrategis.push({
      id: 'rec-digital-channel',
      priority: 'TINGGI',
      category: 'PEMASARAN_DIGITAL',
      title: 'Ekspansi Kanal Penjualan Digital & Optimasi Katalog Marketplace',
      targetMetric: 'Rasio Penjualan Online (+15% dalam 90 hari)',
      estimatedImpact: '+Rp 12,5 Jt – Rp 24,0 Jt Omzet/Bulan',
      actionSteps: [
        'Integrasikan katalog produk utama ke social commerce dan e-commerce lokal dengan fitur pengiriman instan.',
        'Terapkan bundling produk dengan margin tinggi untuk meningkatkan rata-rata nilai transaksi (AOV).',
        'Gunakan pencatatan POS digital untuk memetakan jam transaksi puncak dan produk terlaris.',
      ],
    });
  }

  if (input.tingkatRetensiPelangganPersen < 52) {
    rekomendasiStrategis.push({
      id: 'rec-retention-crm',
      priority: 'TINGGI',
      category: 'RETENSI_PELANGGAN',
      title: 'Program Retensi Pelanggan Berulang & Basis Data WhatsApp CRM',
      targetMetric: 'Retensi Pelanggan (>60%)',
      estimatedImpact: 'Penurunan biaya akuisisi pelanggan hingga 22%',
      actionSteps: [
        'Bangun sistem keanggotaan sederhana berbasis nomor telepon pada saat pembayaran QRIS/Kasir.',
        'Kirimkan penawaran otomatis bagi pelanggan yang belum bertransaksi kembali setelah 21 hari.',
        'Evaluasi umpan balik kualitas produk pada kelompok pelanggan transaksi pertama.',
      ],
    });
  }

  if (input.marginLabaBersihPersen < 16 || input.perputaranPersediaanHari > 28) {
    rekomendasiStrategis.push({
      id: 'rec-cost-inventory',
      priority: 'TINGGI',
      category: 'OPERASIONAL',
      title: 'Restrukturisasi HPP & Percepatan Siklus Perputaran Stok',
      targetMetric: 'Margin Laba Bersih (+4.5%) & Siklus Stok (<21 Hari)',
      estimatedImpact: 'Peningkatan arus kas bebas Rp 8,0 Jt/Bulan',
      actionSteps: [
        'Audit 20% SKU yang menyumbang perputaran paling lambat dan lakukan diskon likuidasi bertahap.',
        'Negosiasi ulang kontrak pemasok bahan baku utama dengan skema pembelian terjadwal.',
        'Pisahkan rekening operasional usaha dari pengeluaran non-operasional secara ketat.',
      ],
    });
  }

  if (input.rasioArusKasOperasional < 1.2 || input.rasioUtangTerhadapAsetPersen > 35) {
    rekomendasiStrategis.push({
      id: 'rec-cashflow-buffer',
      priority: 'SEDANG',
      category: 'KEUANGAN',
      title: 'Penguatan Likuiditas Kas & Penataan Kewajiban Jangka Pendek',
      targetMetric: 'Rasio Arus Kas Operasional (>1.35x)',
      estimatedImpact: 'Ketahanan cadangan kas operasional >3.5 bulan',
      actionSteps: [
        'Percepat termin penagihan piutang pelanggan B2B/reseller menjadi maksimal H+7.',
        'Alokasikan minimal 8% dari laba bersih bulanan ke dana cadangan likuiditas darurat.',
      ],
    });
  }

  // Ensure at least 3 recommendations even for strong businesses
  if (rekomendasiStrategis.length < 3) {
    rekomendasiStrategis.push({
      id: 'rec-scale-up',
      priority: 'SEDANG',
      category: 'OPERASIONAL',
      title: 'Standardisasi SOP Produksi & Persiapan Ekspansi Kapasitas Cabang/Reseller',
      targetMetric: 'Produktivitas Karyawan (+18%)',
      estimatedImpact: 'Kesiapan replikasi model bisnis dengan risiko operasional rendah',
      actionSteps: [
        'Dokumentasikan standar kualitas produksi dan layanan pelanggan untuk mendelegasikan operasional harian.',
        'Uji coba peluncuran lini produk komplementer pada segmen pelanggan setia (top 20% spender).',
      ],
    });
  }

  // Executive Summary narrative
  const ringkasanEksekutif =
    status === 'BERKEMBANG'
      ? `Model AI mengklasifikasikan ${input.namaUsaha} dalam status BERKEMBANG (Skor Indeks Pertumbuhan ${growthProbabilityScore}/100, tingkat keyakinan model ${modelConfidencePersen}%). Pertumbuhan omzet bulanan sebesar ${input.pertumbuhanOmzetMoMPersen > 0 ? '+' : ''}${input.pertumbuhanOmzetMoMPersen}% MoM ditopang oleh retensi pelanggan (${input.tingkatRetensiPelangganPersen}%) dan maturitas kanal digital (${input.skorAdopsiDigital}/100) yang berada di atas rata-rata sektor ${input.sektor}. Fokus utama selanjutnya adalah menjaga efisiensi modal kerja seiring peningkatan volume pesanan.`
      : status === 'TRANSISI'
      ? `Model AI mengklasifikasikan ${input.namaUsaha} dalam fase TRANSISI / KONSOLIDASI (Skor Indeks Pertumbuhan ${growthProbabilityScore}/100, tingkat keyakinan model ${modelConfidencePersen}%). Usaha memiliki fondasi transaksi yang cukup stabil namun tertahan oleh efisiensi margin (${input.marginLabaBersihPersen}%) atau optimalisasi kanal akuisisi pelanggan baru. Intervensi terukur pada perputaran persediaan dan penguatan kanal digital dapat mendorong usaha masuk ke kuadran Berkembang dalam 1–2 kuartal.`
      : `Model AI mendeteksi indikasi STAGNAN pada ${input.namaUsaha} (Skor Indeks Pertumbuhan ${growthProbabilityScore}/100, tingkat keyakinan model ${modelConfidencePersen}%). Tekanan utama berasal dari tren pertumbuhan omzet bulanan (${input.pertumbuhanOmzetMoMPersen}% MoM), siklus perputaran persediaan (${input.perputaranPersediaanHari} hari), serta rendahnya kontribusi kanal digital dan retensi pelanggan. Diperlukan efisiensi struktur biaya segera dan aktivasi program retensi pelanggan untuk memulihkan momentum kas.`;

  return {
    umkmId: input.id,
    timestamp: new Date().toISOString(),
    status,
    growthProbabilityScore,
    modelConfidencePersen,
    ringkasanEksekutif,
    indikatorUtama: {
      cagr6BulanPersen,
      efisiensiBiayaPersen,
      indeksKetahananKasBulan,
      produktivitasPerKaryawanJuta,
    },
    dimensiSkor,
    kontribusiFitur,
    proyeksiOmzet3Bulan,
    rekomendasiStrategis,
  };
}

export const INITIAL_UMKM_INPUTS: UMKMInputPayload[] = [
  {
    id: 'UMKM-2026-001',
    namaUsaha: 'Roastery & Kopi Nusantara Senja',
    sektor: 'Kuliner (F&B)',
    kotaKabupaten: 'Kota Bandung',
    lamaBeroperasiTahun: 4,
    jumlahKaryawan: 9,
    omzetBulananRataRataJuta: 118.5,
    pertumbuhanOmzetMoMPersen: 6.8,
    marginLabaBersihPersen: 22.4,
    rasioArusKasOperasional: 1.52,
    rasioUtangTerhadapAsetPersen: 18.0,
    tingkatRetensiPelangganPersen: 68,
    pertumbuhanPelangganBaruPersen: 9.4,
    rataRataNilaiTransaksiRibu: 64,
    skorAdopsiDigital: 84,
    rasioPenjualanOnlinePersen: 46,
    frekuensiInovasiProdukPerTahun: 5,
    perputaranPersediaanHari: 16,
    riwayatBulanan: [
      { month: 'Mei', omzetJuta: 88.0, biayaOperasionalJuta: 70.4, labaBersihJuta: 17.6, jumlahTransaksi: 1420, pelangganBaru: 210, pelangganBerulang: 480 },
      { month: 'Jun', omzetJuta: 94.5, biayaOperasionalJuta: 74.6, labaBersihJuta: 19.9, jumlahTransaksi: 1510, pelangganBaru: 235, pelangganBerulang: 525 },
      { month: 'Jul', omzetJuta: 102.0, biayaOperasionalJuta: 79.5, labaBersihJuta: 22.5, jumlahTransaksi: 1615, pelangganBaru: 260, pelangganBerulang: 580 },
      { month: 'Agu', omzetJuta: 108.4, biayaOperasionalJuta: 84.5, labaBersihJuta: 23.9, jumlahTransaksi: 1690, pelangganBaru: 270, pelangganBerulang: 620 },
      { month: 'Sep', omzetJuta: 116.2, biayaOperasionalJuta: 89.8, labaBersihJuta: 26.4, jumlahTransaksi: 1810, pelangganBaru: 295, pelangganBerulang: 675 },
      { month: 'Okt', omzetJuta: 124.8, biayaOperasionalJuta: 96.8, labaBersihJuta: 28.0, jumlahTransaksi: 1950, pelangganBaru: 320, pelangganBerulang: 740 },
    ],
  },
  {
    id: 'UMKM-2026-002',
    namaUsaha: 'Tenun & Wastra Kirana Lestari',
    sektor: 'Kriya & Fashion',
    kotaKabupaten: 'Kab. Sleman, Yogyakarta',
    lamaBeroperasiTahun: 6,
    jumlahKaryawan: 12,
    omzetBulananRataRataJuta: 64.2,
    pertumbuhanOmzetMoMPersen: -1.8,
    marginLabaBersihPersen: 11.2,
    rasioArusKasOperasional: 0.94,
    rasioUtangTerhadapAsetPersen: 42.5,
    tingkatRetensiPelangganPersen: 34,
    pertumbuhanPelangganBaruPersen: 1.5,
    rataRataNilaiTransaksiRibu: 285,
    skorAdopsiDigital: 38,
    rasioPenjualanOnlinePersen: 14,
    frekuensiInovasiProdukPerTahun: 1,
    perputaranPersediaanHari: 54,
    riwayatBulanan: [
      { month: 'Mei', omzetJuta: 69.5, biayaOperasionalJuta: 60.5, labaBersihJuta: 9.0, jumlahTransaksi: 245, pelangganBaru: 48, pelangganBerulang: 85 },
      { month: 'Jun', omzetJuta: 67.8, biayaOperasionalJuta: 59.6, labaBersihJuta: 8.2, jumlahTransaksi: 238, pelangganBaru: 42, pelangganBerulang: 80 },
      { month: 'Jul', omzetJuta: 65.0, biayaOperasionalJuta: 57.8, labaBersihJuta: 7.2, jumlahTransaksi: 228, pelangganBaru: 39, pelangganBerulang: 76 },
      { month: 'Agu', omzetJuta: 63.4, biayaOperasionalJuta: 56.4, labaBersihJuta: 7.0, jumlahTransaksi: 222, pelangganBaru: 36, pelangganBerulang: 74 },
      { month: 'Sep', omzetJuta: 61.0, biayaOperasionalJuta: 54.4, labaBersihJuta: 6.6, jumlahTransaksi: 214, pelangganBaru: 34, pelangganBerulang: 71 },
      { month: 'Okt', omzetJuta: 59.8, biayaOperasionalJuta: 53.1, labaBersihJuta: 6.7, jumlahTransaksi: 209, pelangganBaru: 31, pelangganBerulang: 69 },
    ],
  },
  {
    id: 'UMKM-2026-003',
    namaUsaha: 'Agro Lestari Olahan Singkong & Keripik',
    sektor: 'Agribisnis & Olahan',
    kotaKabupaten: 'Kota Malang',
    lamaBeroperasiTahun: 3,
    jumlahKaryawan: 7,
    omzetBulananRataRataJuta: 78.0,
    pertumbuhanOmzetMoMPersen: 2.1,
    marginLabaBersihPersen: 16.5,
    rasioArusKasOperasional: 1.21,
    rasioUtangTerhadapAsetPersen: 26.0,
    tingkatRetensiPelangganPersen: 51,
    pertumbuhanPelangganBaruPersen: 4.2,
    rataRataNilaiTransaksiRibu: 110,
    skorAdopsiDigital: 62,
    rasioPenjualanOnlinePersen: 28,
    frekuensiInovasiProdukPerTahun: 3,
    perputaranPersediaanHari: 27,
    riwayatBulanan: [
      { month: 'Mei', omzetJuta: 73.0, biayaOperasionalJuta: 61.3, labaBersihJuta: 11.7, jumlahTransaksi: 660, pelangganBaru: 115, pelangganBerulang: 210 },
      { month: 'Jun', omzetJuta: 75.2, biayaOperasionalJuta: 62.9, labaBersihJuta: 12.3, jumlahTransaksi: 682, pelangganBaru: 120, pelangganBerulang: 222 },
      { month: 'Jul', omzetJuta: 74.8, biayaOperasionalJuta: 62.5, labaBersihJuta: 12.3, jumlahTransaksi: 678, pelangganBaru: 118, pelangganBerulang: 225 },
      { month: 'Agu', omzetJuta: 78.5, biayaOperasionalJuta: 65.4, labaBersihJuta: 13.1, jumlahTransaksi: 712, pelangganBaru: 128, pelangganBerulang: 240 },
      { month: 'Sep', omzetJuta: 80.1, biayaOperasionalJuta: 66.8, labaBersihJuta: 13.3, jumlahTransaksi: 728, pelangganBaru: 134, pelangganBerulang: 248 },
      { month: 'Okt', omzetJuta: 82.4, biayaOperasionalJuta: 68.8, labaBersihJuta: 13.6, jumlahTransaksi: 748, pelangganBaru: 140, pelangganBerulang: 258 },
    ],
  },
  {
    id: 'UMKM-2026-004',
    namaUsaha: 'Bengkel & Suku Cadang Presisi Motor',
    sektor: 'Jasa & Perdagangan',
    kotaKabupaten: 'Kota Semarang',
    lamaBeroperasiTahun: 5,
    jumlahKaryawan: 6,
    omzetBulananRataRataJuta: 92.0,
    pertumbuhanOmzetMoMPersen: -0.6,
    marginLabaBersihPersen: 13.8,
    rasioArusKasOperasional: 1.05,
    rasioUtangTerhadapAsetPersen: 34.0,
    tingkatRetensiPelangganPersen: 44,
    pertumbuhanPelangganBaruPersen: 2.0,
    rataRataNilaiTransaksiRibu: 175,
    skorAdopsiDigital: 42,
    rasioPenjualanOnlinePersen: 12,
    frekuensiInovasiProdukPerTahun: 1,
    perputaranPersediaanHari: 46,
    riwayatBulanan: [
      { month: 'Mei', omzetJuta: 94.0, biayaOperasionalJuta: 80.8, labaBersihJuta: 13.2, jumlahTransaksi: 535, pelangganBaru: 85, pelangganBerulang: 190 },
      { month: 'Jun', omzetJuta: 93.2, biayaOperasionalJuta: 80.2, labaBersihJuta: 13.0, jumlahTransaksi: 530, pelangganBaru: 82, pelangganBerulang: 188 },
      { month: 'Jul', omzetJuta: 92.5, biayaOperasionalJuta: 79.7, labaBersihJuta: 12.8, jumlahTransaksi: 528, pelangganBaru: 80, pelangganBerulang: 185 },
      { month: 'Agu', omzetJuta: 91.0, biayaOperasionalJuta: 78.5, labaBersihJuta: 12.5, jumlahTransaksi: 520, pelangganBaru: 76, pelangganBerulang: 182 },
      { month: 'Sep', omzetJuta: 91.4, biayaOperasionalJuta: 78.8, labaBersihJuta: 12.6, jumlahTransaksi: 522, pelangganBaru: 78, pelangganBerulang: 184 },
      { month: 'Okt', omzetJuta: 90.2, biayaOperasionalJuta: 77.7, labaBersihJuta: 12.5, jumlahTransaksi: 515, pelangganBaru: 74, pelangganBerulang: 180 },
    ],
  },
  {
    id: 'UMKM-2026-005',
    namaUsaha: 'Dapur Bumbu Rempah Kemasan Bunda',
    sektor: 'Kuliner (F&B)',
    kotaKabupaten: 'Kota Surabaya',
    lamaBeroperasiTahun: 2,
    jumlahKaryawan: 8,
    omzetBulananRataRataJuta: 145.0,
    pertumbuhanOmzetMoMPersen: 9.2,
    marginLabaBersihPersen: 25.0,
    rasioArusKasOperasional: 1.68,
    rasioUtangTerhadapAsetPersen: 14.5,
    tingkatRetensiPelangganPersen: 74,
    pertumbuhanPelangganBaruPersen: 12.5,
    rataRataNilaiTransaksiRibu: 85,
    skorAdopsiDigital: 91,
    rasioPenjualanOnlinePersen: 68,
    frekuensiInovasiProdukPerTahun: 6,
    perputaranPersediaanHari: 12,
    riwayatBulanan: [
      { month: 'Mei', omzetJuta: 102.0, biayaOperasionalJuta: 78.5, labaBersihJuta: 23.5, jumlahTransaksi: 1200, pelangganBaru: 310, pelangganBerulang: 620 },
      { month: 'Jun', omzetJuta: 114.0, biayaOperasionalJuta: 86.6, labaBersihJuta: 27.4, jumlahTransaksi: 1340, pelangganBaru: 345, pelangganBerulang: 710 },
      { month: 'Jul', omzetJuta: 126.5, biayaOperasionalJuta: 95.5, labaBersihJuta: 31.0, jumlahTransaksi: 1488, pelangganBaru: 390, pelangganBerulang: 795 },
      { month: 'Agu', omzetJuta: 139.0, biayaOperasionalJuta: 104.2, labaBersihJuta: 34.8, jumlahTransaksi: 1635, pelangganBaru: 425, pelangganBerulang: 880 },
      { month: 'Sep', omzetJuta: 152.4, biayaOperasionalJuta: 114.3, labaBersihJuta: 38.1, jumlahTransaksi: 1790, pelangganBaru: 465, pelangganBerulang: 970 },
      { month: 'Okt', omzetJuta: 168.0, biayaOperasionalJuta: 126.0, labaBersihJuta: 42.0, jumlahTransaksi: 1975, pelangganBaru: 520, pelangganBerulang: 1080 },
    ],
  },
];

export const INITIAL_UMKM_RECORDS: UMKMRecord[] = INITIAL_UMKM_INPUTS.map((input) => ({
  input,
  analysis: runLocalUMKMInference(input),
}));
