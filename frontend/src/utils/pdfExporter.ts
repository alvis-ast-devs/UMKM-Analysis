import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UMKMRecord } from '../types/umkm';

export function exportUMKMReportToPDF(record: UMKMRecord): void {
  const { input, analysis } = record;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KATALIS UMKM — LAPORAN DIAGNOSTIK PERTUMBUHAN AI', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const formattedDate = new Date(analysis.timestamp).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`ID Evaluasi: ${input.id}  |  Tanggal Cetak: ${formattedDate} WIB`, margin, 24);

  // Business Profile & Classification Status Box
  let currentY = 44;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(input.namaUsaha, margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Sektor: ${input.sektor}  ·  Lokasi: ${input.kotaKabupaten}  ·  Usia Usaha: ${input.lamaBeroperasiTahun} Tahun  ·  Tenaga Kerja: ${input.jumlahKaryawan} Orang`,
    margin,
    currentY
  );

  // Status Summary Box on the Right
  const statusBoxWidth = 68;
  const statusBoxX = pageWidth - margin - statusBoxWidth;
  if (analysis.status === 'BERKEMBANG') {
    doc.setFillColor(220, 252, 231); // Emerald 100
    doc.setDrawColor(22, 163, 74);
  } else if (analysis.status === 'TRANSISI') {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.setDrawColor(217, 119, 6);
  } else {
    doc.setFillColor(254, 226, 226); // Red 100
    doc.setDrawColor(220, 38, 38);
  }
  doc.roundedRect(statusBoxX, 38, statusBoxWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('STATUS PREDIKSI MODEL AI', statusBoxX + 4, 44);

  doc.setFontSize(12);
  if (analysis.status === 'BERKEMBANG') {
    doc.setTextColor(21, 128, 61);
  } else if (analysis.status === 'TRANSISI') {
    doc.setTextColor(180, 83, 9);
  } else {
    doc.setTextColor(185, 28, 28);
  }
  doc.text(
    `${analysis.status} (${analysis.growthProbabilityScore}/100)`,
    statusBoxX + 4,
    51
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Keyakinan Model: ${analysis.modelConfidencePersen}%`, statusBoxX + 4, 55.5);

  currentY += 12;

  // Executive Summary Section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('01. Ringkasan Diagnostik Eksekutif', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const splitSummary = doc.splitTextToSize(analysis.ringkasanEksekutif, pageWidth - margin * 2 - 8);
  doc.text(splitSummary, margin + 4, currentY + 12);

  currentY += 31;

  // Table 1: Key Financial & Operational Metrics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('02. Matriks Indikator Kinerja Utama & Bobot Fitur AI', margin, currentY);

  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Variabel Analisis', 'Nilai Aktual', 'Bobot Model', 'Skor Dampak', 'Evaluasi Benchmark Sektor']],
    body: analysis.kontribusiFitur.map((f) => [
      f.label,
      f.valueFormatted,
      `${f.weightPercentage}%`,
      `${f.impactScore > 0 ? '+' : ''}${f.impactScore}`,
      f.benchmarkComparison,
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // @ts-expect-error jspdf-autotable injects lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // Table 2: 6-Month Historical Performance
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('03. Riwayat Kinerja Keuangan & Pelanggan (6 Bulan Terakhir)', margin, currentY);

  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Bulan', 'Omzet (Rp Juta)', 'Biaya Operasional (Rp Juta)', 'Laba Bersih (Rp Juta)', 'Total Transaksi', 'Pelanggan Berulang']],
    body: input.riwayatBulanan.map((m) => [
      m.month,
      `Rp ${m.omzetJuta.toFixed(1)} Jt`,
      `Rp ${m.biayaOperasionalJuta.toFixed(1)} Jt`,
      `Rp ${m.labaBersihJuta.toFixed(1)} Jt`,
      m.jumlahTransaksi.toLocaleString('id-ID'),
      `${m.pelangganBerulang.toLocaleString('id-ID')} (${Math.round((m.pelangganBerulang / Math.max(1, m.pelangganBaru + m.pelangganBerulang)) * 100)}%)`,
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  // @ts-expect-error jspdf-autotable injects lastAutoTable
  currentY = doc.lastAutoTable.finalY + 8;

  // Table 3: Strategic Action Plan
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('04. Rekomendasi Intervensi Strategis & Proyeksi Dampak', margin, currentY);

  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Prioritas', 'Rekomendasi Strategis', 'Target Metrik', 'Estimasi Dampak', 'Langkah Eksekusi Utama']],
    body: analysis.rekomendasiStrategis.map((rec) => [
      rec.priority,
      rec.title,
      rec.targetMetric,
      rec.estimatedImpact,
      rec.actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n'),
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 60 },
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen ini dihasilkan secara otomatis oleh Sistem Analitik KatalisUMKM (Integrasi Flask AI Model). Halaman ${i} dari ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const safeFilename = input.namaUsaha.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save(`Laporan_Analisis_UMKM_${safeFilename}_${input.id}.pdf`);
}
