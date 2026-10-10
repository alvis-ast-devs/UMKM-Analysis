/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  INITIAL_UMKM_RECORDS,
  runLocalUMKMInference,
} from './data/umkmDataset';
import {
  UMKMRecord,
  UMKMInputPayload,
  FlaskBackendConfig,
} from './types/umkm';
import { DashboardAnalyticsView } from './components/DashboardAnalyticsView';
import { UMKMInputSimulator } from './components/UMKMInputSimulator';
import { PortfolioDirectoryView } from './components/PortfolioDirectoryView';
import { FlaskIntegrationView } from './components/FlaskIntegrationView';
import { exportUMKMReportToPDF } from './utils/pdfExporter';
import { FileDown, Building2, CheckCircle2 } from 'lucide-react';

type ActiveSection = 'DASHBOARD' | 'SIMULATOR' | 'PORTFOLIO' | 'FLASK_API';

export default function App() {
  const [records, setRecords] = useState<UMKMRecord[]>(INITIAL_UMKM_RECORDS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_UMKM_RECORDS[0].input.id);
  const [activeSection, setActiveSection] = useState<ActiveSection>('DASHBOARD');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const [flaskConfig, setFlaskConfig] = useState<FlaskBackendConfig>({
    endpointUrl: 'http://127.0.0.1:5000/api/v1/predict-umkm',
    mode: 'SIMULASI_LOKAL',
    timeoutMs: 5000,
    connectionStatus: 'UNTESTED',
  });

  const activeRecord =
    records.find((r) => r.input.id === selectedId) || records[0];

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => {
      setToastNotice(null);
    }, 4000);
  };

  const handleRunAnalysis = async (
    updatedInput: UMKMInputPayload,
    createAsNew: boolean
  ) => {
    setIsAnalyzing(true);

    // Compute local deterministic baseline & full chart metrics
    let prediction = runLocalUMKMInference(updatedInput);

    // If user enabled Live Flask Endpoint mode, attempt real HTTP POST to their Flask server
    if (flaskConfig.mode === 'FLASK_API_LIVE' && flaskConfig.endpointUrl) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), flaskConfig.timeoutMs);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (flaskConfig.apiKeyHeader) {
          headers['Authorization'] = flaskConfig.apiKeyHeader;
        }

        const response = await fetch(flaskConfig.endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            umkm_id: updatedInput.id,
            nama_usaha: updatedInput.namaUsaha,
            sektor: updatedInput.sektor,
            features: {
              omzet_bulanan_juta: updatedInput.omzetBulananRataRataJuta,
              pertumbuhan_omzet_mom_persen: updatedInput.pertumbuhanOmzetMoMPersen,
              margin_laba_bersih_persen: updatedInput.marginLabaBersihPersen,
              rasio_arus_kas_operasional: updatedInput.rasioArusKasOperasional,
              rasio_utang_terhadap_aset_persen: updatedInput.rasioUtangTerhadapAsetPersen,
              tingkat_retensi_pelanggan_persen: updatedInput.tingkatRetensiPelangganPersen,
              skor_adopsi_digital: updatedInput.skorAdopsiDigital,
              rasio_penjualan_online_persen: updatedInput.rasioPenjualanOnlinePersen,
              perputaran_persediaan_hari: updatedInput.perputaranPersediaanHari,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          const flaskData = await response.json();
          prediction = {
            ...prediction,
            status: flaskData.status || prediction.status,
            growthProbabilityScore:
              typeof flaskData.growthProbabilityScore === 'number'
                ? flaskData.growthProbabilityScore
                : prediction.growthProbabilityScore,
            modelConfidencePersen:
              typeof flaskData.modelConfidencePersen === 'number'
                ? flaskData.modelConfidencePersen
                : prediction.modelConfidencePersen,
          };
          setFlaskConfig((prev) => ({
            ...prev,
            connectionStatus: 'CONNECTED',
            errorMessage: 'Berhasil menerima hasil inferensi dari server Flask Python.',
          }));
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch {
        setFlaskConfig((prev) => ({
          ...prev,
          connectionStatus: 'ERROR',
          errorMessage:
            'Server Flask lokal belum merespons. Hasil dihitung menggunakan mesin inferensi lokal yang terkalibrasi.',
        }));
      }
    } else {
      await new Promise((r) => setTimeout(r, 320));
    }

    const newRecord: UMKMRecord = {
      input: updatedInput,
      analysis: prediction,
    };

    if (createAsNew) {
      setRecords((prev) => [newRecord, ...prev]);
      setSelectedId(newRecord.input.id);
      triggerToast(`Entitas baru "${updatedInput.namaUsaha}" berhasil dianalisis (${prediction.status}).`);
    } else {
      setRecords((prev) =>
        prev.map((item) => (item.input.id === updatedInput.id ? newRecord : item))
      );
      triggerToast(`Analisis "${updatedInput.namaUsaha}" diperbarui: Status ${prediction.status} (${prediction.growthProbabilityScore}/100).`);
    }

    setIsAnalyzing(false);
    setActiveSection('DASHBOARD');
  };

  const handleTestFlaskConnection = async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), flaskConfig.timeoutMs);

      const response = await fetch(flaskConfig.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umkm_id: activeRecord.input.id,
          features: {
            omzet_bulanan_juta: activeRecord.input.omzetBulananRataRataJuta,
            pertumbuhan_omzet_mom_persen: activeRecord.input.pertumbuhanOmzetMoMPersen,
            margin_laba_bersih_persen: activeRecord.input.marginLabaBersihPersen,
            rasio_arus_kas_operasional: activeRecord.input.rasioArusKasOperasional,
            tingkat_retensi_pelanggan_persen: activeRecord.input.tingkatRetensiPelangganPersen,
            skor_adopsi_digital: activeRecord.input.skorAdopsiDigital,
            perputaran_persediaan_hari: activeRecord.input.perputaranPersediaanHari,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        setFlaskConfig((prev) => ({
          ...prev,
          connectionStatus: 'CONNECTED',
          errorMessage: 'Koneksi ke endpoint Flask Python berhasil diverifikasi (HTTP 200 OK).',
        }));
        triggerToast('Terhubung ke endpoint Flask Python!');
      } else {
        throw new Error(`Status HTTP ${response.status}`);
      }
    } catch {
      setFlaskConfig((prev) => ({
        ...prev,
        connectionStatus: 'ERROR',
        errorMessage:
          'Tidak dapat menjangkau server Flask pada URL tersebut. Pastikan server Flask berjalan & CORS aktif. Mode fallback lokal tetap menjaga aplikasi berjalan penuh.',
      }));
      triggerToast('Endpoint Flask belum aktif — menggunakan mesin inferensi lokal.');
    }
  };

  const handleExportPDF = (recordToExport: UMKMRecord = activeRecord) => {
    exportUMKMReportToPDF(recordToExport);
    triggerToast(`Laporan PDF untuk "${recordToExport.input.namaUsaha}" berhasil diunduh.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('DASHBOARD');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
        >
          KatalisUMKM
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveSection('DASHBOARD')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'DASHBOARD'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard Analisis
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('SIMULATOR')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'SIMULATOR'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Simulasi & Input Data
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('PORTFOLIO')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'PORTFOLIO'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Portofolio UMKM
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('FLASK_API')}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'FLASK_API'
                ? 'text-slate-900 font-semibold underline underline-offset-8 decoration-2 decoration-slate-900'
                : 'hover:text-slate-900'
            }`}
          >
            Integrasi Flask API
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleExportPDF(activeRecord)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Unduh Laporan PDF
          </button>
        </div>
      </header>

      {/* Contextual Workspace Selector Strip */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <label
              htmlFor="umkm-selector"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Entitas UMKM Aktif:
            </label>
            <select
              id="umkm-selector"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 cursor-pointer"
            >
              {records.map((r) => (
                <option key={r.input.id} value={r.input.id}>
                  {r.input.namaUsaha} ({r.input.sektor}) — [{r.analysis.status}:{' '}
                  {r.analysis.growthProbabilityScore}/100]
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Navigation Fallback + Quick Mode Info */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSection('DASHBOARD')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  activeSection === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('SIMULATOR')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  activeSection === 'SIMULATOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Input Data
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('PORTFOLIO')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  activeSection === 'PORTFOLIO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Portofolio
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('FLASK_API')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  activeSection === 'FLASK_API' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Flask API
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span>Mesin Inferensi:</span>
              <button
                type="button"
                onClick={() => setActiveSection('FLASK_API')}
                className="font-mono font-medium text-slate-800 hover:underline cursor-pointer"
              >
                {flaskConfig.mode === 'FLASK_API_LIVE'
                  ? 'Flask Python Endpoint (Live)'
                  : 'Model Terkalibrasi (Siap Integrasi Flask)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner if present */}
      {toastNotice && (
        <div className="max-w-[1360px] w-full mx-auto px-6 pt-4">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotice(null)}
              className="text-slate-400 hover:text-white text-xs ml-4 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6">
        {activeSection === 'DASHBOARD' && (
          <DashboardAnalyticsView
            record={activeRecord}
            onExportPDF={() => handleExportPDF(activeRecord)}
            onOpenSimulator={() => setActiveSection('SIMULATOR')}
          />
        )}

        {activeSection === 'SIMULATOR' && (
          <UMKMInputSimulator
            initialInput={activeRecord.input}
            onRunAnalysis={handleRunAnalysis}
            isLoading={isAnalyzing}
          />
        )}

        {activeSection === 'PORTFOLIO' && (
          <PortfolioDirectoryView
            records={records}
            selectedId={selectedId}
            onSelectRecord={(id) => {
              setSelectedId(id);
              setActiveSection('DASHBOARD');
            }}
            onExportSinglePDF={(rec) => handleExportPDF(rec)}
          />
        )}

        {activeSection === 'FLASK_API' && (
          <FlaskIntegrationView
            config={flaskConfig}
            sampleInput={activeRecord.input}
            onUpdateConfig={setFlaskConfig}
            onTestConnection={handleTestFlaskConnection}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            KatalisUMKM — Platform Visualisasi & Diagnostik Pertumbuhan UMKM Berbasis AI
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('FLASK_API')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Dokumentasi Endpoint Flask
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleExportPDF(activeRecord)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cetak Laporan PDF ({activeRecord.input.id})
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

