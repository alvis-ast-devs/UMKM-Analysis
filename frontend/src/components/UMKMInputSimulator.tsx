import React, { useState } from 'react';
import { UMKMInputPayload, MonthlyMetric } from '../types/umkm';
import { Calculator, RotateCcw, Play } from 'lucide-react';

interface UMKMInputFormModalProps {
  initialInput: UMKMInputPayload;
  onRunAnalysis: (updatedInput: UMKMInputPayload, createAsNew: boolean) => void;
  isLoading: boolean;
}

export const UMKMInputSimulator: React.FC<UMKMInputFormModalProps> = ({
  initialInput,
  onRunAnalysis,
  isLoading,
}) => {
  const [formData, setFormData] = useState<UMKMInputPayload>(initialInput);
  const [saveMode, setSaveMode] = useState<'UPDATE' | 'NEW'>('UPDATE');

  // Sync when selected UMKM changes in parent
  React.useEffect(() => {
    setFormData(initialInput);
  }, [initialInput]);

  const handleNumberChange = (field: keyof UMKMInputPayload, value: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Dynamically recalculate 6-month historical series so charts stay coherent with input sliders
      if (
        field === 'omzetBulananRataRataJuta' ||
        field === 'pertumbuhanOmzetMoMPersen' ||
        field === 'marginLabaBersihPersen' ||
        field === 'tingkatRetensiPelangganPersen'
      ) {
        const months = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
        const baseOmzet = updated.omzetBulananRataRataJuta;
        const momRate = updated.pertumbuhanOmzetMoMPersen / 100;
        const marginRate = updated.marginLabaBersihPersen / 100;
        const retentionRate = updated.tingkatRetensiPelangganPersen / 100;

        const newHistory: MonthlyMetric[] = months.map((m, idx) => {
          const offsetFromMid = idx - 2.5;
          const monthOmzet = Number(
            Math.max(8, baseOmzet * Math.pow(1 + momRate, offsetFromMid)).toFixed(1)
          );
          const monthLaba = Number((monthOmzet * marginRate).toFixed(1));
          const monthBiaya = Number((monthOmzet - monthLaba).toFixed(1));
          const txCount = Math.max(
            50,
            Math.round((monthOmzet * 1000) / Math.max(15, updated.rataRataNilaiTransaksiRibu))
          );
          const repeatCust = Math.round(txCount * 0.45 * retentionRate);
          const newCust = Math.max(10, Math.round(txCount * 0.22));
          return {
            month: m,
            omzetJuta: monthOmzet,
            biayaOperasionalJuta: monthBiaya,
            labaBersihJuta: monthLaba,
            jumlahTransaksi: txCount,
            pelangganBaru: newCust,
            pelangganBerulang: repeatCust,
          };
        });
        updated.riwayatBulanan = newHistory;
      }

      return updated;
    });
  };

  const handlePresetLoad = (presetType: 'BERKEMBANG' | 'STAGNAN' | 'TRANSISI') => {
    if (presetType === 'BERKEMBANG') {
      handleNumberChange('pertumbuhanOmzetMoMPersen', 7.5);
      setFormData((prev) => ({
        ...prev,
        pertumbuhanOmzetMoMPersen: 7.5,
        marginLabaBersihPersen: 23.5,
        rasioArusKasOperasional: 1.58,
        rasioUtangTerhadapAsetPersen: 16.0,
        tingkatRetensiPelangganPersen: 71,
        skorAdopsiDigital: 86,
        rasioPenjualanOnlinePersen: 52,
        perputaranPersediaanHari: 14,
      }));
    } else if (presetType === 'STAGNAN') {
      setFormData((prev) => ({
        ...prev,
        pertumbuhanOmzetMoMPersen: -2.4,
        marginLabaBersihPersen: 9.8,
        rasioArusKasOperasional: 0.88,
        rasioUtangTerhadapAsetPersen: 46.0,
        tingkatRetensiPelangganPersen: 32,
        skorAdopsiDigital: 34,
        rasioPenjualanOnlinePersen: 10,
        perputaranPersediaanHari: 58,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        pertumbuhanOmzetMoMPersen: 1.8,
        marginLabaBersihPersen: 15.2,
        rasioArusKasOperasional: 1.18,
        rasioUtangTerhadapAsetPersen: 29.0,
        tingkatRetensiPelangganPersen: 49,
        skorAdopsiDigital: 58,
        rasioPenjualanOnlinePersen: 26,
        perputaranPersediaanHari: 29,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload =
      saveMode === 'NEW'
        ? {
            ...formData,
            id: `UMKM-2026-00${Math.floor(10 + Math.random() * 89)}`,
          }
        : formData;
    onRunAnalysis(payload, saveMode === 'NEW');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Input Parameter & Simulasi Inferensi Model AI
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Masukkan variabel keuangan, retensi pelanggan, dan maturitas digital untuk menguji klasifikasi status UMKM secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Muat Skenario Cepat:</span>
          <button
            type="button"
            onClick={() => handlePresetLoad('BERKEMBANG')}
            className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Profil Berkembang Pesat
          </button>
          <button
            type="button"
            onClick={() => handlePresetLoad('TRANSISI')}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Profil Transisi
          </button>
          <button
            type="button"
            onClick={() => handlePresetLoad('STAGNAN')}
            className="px-3 py-1.5 text-xs font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Profil Stagnan Kritis
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Section 1: Identitas Usaha */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            01. Identitas & Skala Operasional UMKM
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nama Entitas UMKM
              </label>
              <input
                type="text"
                required
                value={formData.namaUsaha}
                onChange={(e) => setFormData({ ...formData, namaUsaha: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Sektor Industri
              </label>
              <select
                value={formData.sektor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sektor: e.target.value as UMKMInputPayload['sektor'],
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
              >
                <option value="Kuliner (F&B)">Kuliner (F&B)</option>
                <option value="Kriya & Fashion">Kriya & Fashion</option>
                <option value="Agribisnis & Olahan">Agribisnis & Olahan</option>
                <option value="Jasa & Perdagangan">Jasa & Perdagangan</option>
                <option value="Manufaktur Mikro">Manufaktur Mikro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                required
                value={formData.kotaKabupaten}
                onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Usia (Tahun)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.lamaBeroperasiTahun}
                  onChange={(e) =>
                    handleNumberChange('lamaBeroperasiTahun', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Tenaga Kerja
                </label>
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={formData.jumlahKaryawan}
                  onChange={(e) =>
                    handleNumberChange('jumlahKaryawan', Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fitur Finansial & Arus Kas */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            02. Variabel Kinerja Keuangan & Likuiditas (Fitur Utama Model)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Omzet Bulanan Rata-Rata</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  Rp {formData.omzetBulananRataRataJuta} Jt
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={500}
                step={2.5}
                value={formData.omzetBulananRataRataJuta}
                onChange={(e) =>
                  handleNumberChange('omzetBulananRataRataJuta', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>Rp 15 Jt</span>
                <span>Rp 500 Jt</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Pertumbuhan Omzet (MoM)</span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    formData.pertumbuhanOmzetMoMPersen >= 3
                      ? 'text-emerald-700'
                      : formData.pertumbuhanOmzetMoMPersen < 0
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  {formData.pertumbuhanOmzetMoMPersen > 0 ? '+' : ''}
                  {formData.pertumbuhanOmzetMoMPersen}%
                </span>
              </div>
              <input
                type="range"
                min={-12}
                max={20}
                step={0.2}
                value={formData.pertumbuhanOmzetMoMPersen}
                onChange={(e) =>
                  handleNumberChange('pertumbuhanOmzetMoMPersen', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>-12.0% (Kontraksi)</span>
                <span>+20.0% (Akselerasi)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Margin Laba Bersih</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.marginLabaBersihPersen}%
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                step={0.5}
                value={formData.marginLabaBersihPersen}
                onChange={(e) =>
                  handleNumberChange('marginLabaBersihPersen', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>2% (Tipis)</span>
                <span>40% (Tinggi)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Rasio Arus Kas Operasional</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.rasioArusKasOperasional.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.02}
                value={formData.rasioArusKasOperasional}
                onChange={(e) =>
                  handleNumberChange('rasioArusKasOperasional', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>0.50x (Defisit)</span>
                <span>2.50x (Surplus Kuat)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Pelanggan, Digitalisasi & Operasional */}
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            03. Retensi Pelanggan, Adopsi Digital & Perputaran Stok
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Tingkat Retensi Pelanggan</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.tingkatRetensiPelangganPersen}%
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={1}
                value={formData.tingkatRetensiPelangganPersen}
                onChange={(e) =>
                  handleNumberChange('tingkatRetensiPelangganPersen', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>15% (Churn Tinggi)</span>
                <span>90% (Sangat Loyal)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Skor Maturitas Digital</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.skorAdopsiDigital}/100
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={formData.skorAdopsiDigital}
                onChange={(e) =>
                  handleNumberChange('skorAdopsiDigital', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>10 (Manual)</span>
                <span>100 (Omnichannel)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Kontribusi Penjualan Online</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.rasioPenjualanOnlinePersen}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                step={1}
                value={formData.rasioPenjualanOnlinePersen}
                onChange={(e) =>
                  handleNumberChange('rasioPenjualanOnlinePersen', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>0% (100% Offline)</span>
                <span>95% (Digital Native)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Siklus Perputaran Stok</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {formData.perputaranPersediaanHari} Hari
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                step={1}
                value={formData.perputaranPersediaanHari}
                onChange={(e) =>
                  handleNumberChange('perputaranPersediaanHari', Number(e.target.value))
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>5 Hari (Cepat)</span>
                <span>90 Hari (Tertahan)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === 'UPDATE'}
                onChange={() => setSaveMode('UPDATE')}
                className="accent-slate-900"
              />
              Perbarui UMKM Saat Ini ({formData.id})
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                checked={saveMode === 'NEW'}
                onChange={() => setSaveMode('NEW')}
                className="accent-slate-900"
              />
              Simpan Sebagai Entitas UMKM Baru
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormData(initialInput)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Nilai
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Calculator className="w-4 h-4 animate-spin" />
                  Menjalankan Model Prediksi...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Jalankan Analisis Model AI
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
