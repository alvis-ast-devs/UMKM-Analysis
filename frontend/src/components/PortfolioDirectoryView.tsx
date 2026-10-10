import React, { useState, useMemo } from 'react';
import { UMKMRecord, GrowthStatus } from '../types/umkm';
import { Search, FileDown, Eye, ArrowUpDown } from 'lucide-react';

interface PortfolioDirectoryViewProps {
  records: UMKMRecord[];
  selectedId: string;
  onSelectRecord: (id: string) => void;
  onExportSinglePDF: (record: UMKMRecord) => void;
}

export const PortfolioDirectoryView: React.FC<PortfolioDirectoryViewProps> = ({
  records,
  selectedId,
  onSelectRecord,
  onExportSinglePDF,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GrowthStatus>('ALL');
  const [sortBy, setSortBy] = useState<'SCORE_DESC' | 'OMZET_DESC' | 'MOM_DESC'>('SCORE_DESC');

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesStatus = statusFilter === 'ALL' || r.analysis.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          r.input.namaUsaha.toLowerCase().includes(q) ||
          r.input.sektor.toLowerCase().includes(q) ||
          r.input.kotaKabupaten.toLowerCase().includes(q) ||
          r.input.id.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'SCORE_DESC') {
          return b.analysis.growthProbabilityScore - a.analysis.growthProbabilityScore;
        }
        if (sortBy === 'OMZET_DESC') {
          return b.input.omzetBulananRataRataJuta - a.input.omzetBulananRataRataJuta;
        }
        return b.input.pertumbuhanOmzetMoMPersen - a.input.pertumbuhanOmzetMoMPersen;
      });
  }, [records, searchQuery, statusFilter, sortBy]);

  const counts = useMemo(() => {
    return {
      total: records.length,
      berkembang: records.filter((r) => r.analysis.status === 'BERKEMBANG').length,
      transisi: records.filter((r) => r.analysis.status === 'TRANSISI').length,
      stagnan: records.filter((r) => r.analysis.status === 'STAGNAN').length,
    };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
               Direktori & Komparasi Portofolio UMKM Teranalisis
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Bandingkan skor probabilitas pertumbuhan, metrik keuangan, dan status hasil klasifikasi model AI di seluruh usaha binaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Total Entitas</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {counts.total} UMKM
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-xs text-slate-500 block">Status Berkembang</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {counts.berkembang} Usaha
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-xs text-slate-500 block">Status Transisi</span>
              <span className="font-mono font-bold text-amber-700 tabular-nums">
                {counts.transisi} Usaha
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <span className="text-xs text-slate-500 block">Status Stagnan</span>
              <span className="font-mono font-bold text-rose-700 tabular-nums">
                {counts.stagnan} Usaha
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5">
          {/* Interactive Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('BERKEMBANG')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'BERKEMBANG'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Berkembang ({counts.berkembang})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('TRANSISI')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'TRANSISI'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transisi ({counts.transisi})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('STAGNAN')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'STAGNAN'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stagnan ({counts.stagnan})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama UMKM, sektor, kota..."
                className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white w-64"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              >
                <option value="SCORE_DESC">Urutkan: Skor AI Tertinggi</option>
                <option value="OMZET_DESC">Urutkan: Omzet Terbesar</option>
                <option value="MOM_DESC">Urutkan: Pertumbuhan MoM</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/60">
                <th className="py-3 pl-4 pr-3">ID & Nama UMKM</th>
                <th className="py-3 px-3">Sektor & Wilayah</th>
                <th className="py-3 px-3 text-right">Omzet / Bln</th>
                <th className="py-3 px-3 text-right">Tren MoM</th>
                <th className="py-3 px-3 text-right">Margin Laba</th>
                <th className="py-3 px-3 text-right">Retensi</th>
                <th className="py-3 px-3 text-right">Indeks AI</th>
                <th className="py-3 px-3">Status Klasifikasi</th>
                <th className="py-3 pl-3 pr-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Tidak ditemukan data UMKM yang sesuai dengan kata kunci atau filter status.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isSelected = item.input.id === selectedId;
                  return (
                    <tr
                      key={item.input.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <div className="font-semibold text-slate-900">
                          {item.input.namaUsaha}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {item.input.id} · {item.input.jumlahKaryawan} Pekerja
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{item.input.sektor}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.input.kotaKabupaten}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                        Rp {item.input.omzetBulananRataRataJuta.toFixed(1)} Jt
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-semibold ${
                          item.input.pertumbuhanOmzetMoMPersen >= 3
                            ? 'text-emerald-700'
                            : item.input.pertumbuhanOmzetMoMPersen < 0
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {item.input.pertumbuhanOmzetMoMPersen > 0 ? '+' : ''}
                        {item.input.pertumbuhanOmzetMoMPersen.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {item.input.marginLabaBersihPersen.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {item.input.tingkatRetensiPelangganPersen}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {item.analysis.growthProbabilityScore}/100
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            item.analysis.status === 'BERKEMBANG'
                              ? 'text-emerald-700'
                              : item.analysis.status === 'TRANSISI'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {item.analysis.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(item.input.id)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Buka Analisis
                          </button>
                          <button
                            type="button"
                            onClick={() => onExportSinglePDF(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            title="Unduh Laporan PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
