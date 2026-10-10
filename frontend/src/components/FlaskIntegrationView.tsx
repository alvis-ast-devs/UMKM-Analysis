import React, { useState } from 'react';
import { FlaskBackendConfig, UMKMInputPayload } from '../types/umkm';
import { Copy, Check, Server, Terminal, RefreshCw } from 'lucide-react';

interface FlaskIntegrationViewProps {
  config: FlaskBackendConfig;
  sampleInput: UMKMInputPayload;
  onUpdateConfig: (newConfig: FlaskBackendConfig) => void;
  onTestConnection: () => void;
}

export const FlaskIntegrationView: React.FC<FlaskIntegrationViewProps> = ({
  config,
  sampleInput,
  onUpdateConfig,
  onTestConnection,
}) => {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const sampleRequestPayload = JSON.stringify(
    {
      umkm_id: sampleInput.id,
      nama_usaha: sampleInput.namaUsaha,
      sektor: sampleInput.sektor,
      features: {
        omzet_bulanan_juta: sampleInput.omzetBulananRataRataJuta,
        pertumbuhan_omzet_mom_persen: sampleInput.pertumbuhanOmzetMoMPersen,
        margin_laba_bersih_persen: sampleInput.marginLabaBersihPersen,
        rasio_arus_kas_operasional: sampleInput.rasioArusKasOperasional,
        rasio_utang_terhadap_aset_persen: sampleInput.rasioUtangTerhadapAsetPersen,
        tingkat_retensi_pelanggan_persen: sampleInput.tingkatRetensiPelangganPersen,
        skor_adopsi_digital: sampleInput.skorAdopsiDigital,
        rasio_penjualan_online_persen: sampleInput.rasioPenjualanOnlinePersen,
        perputaran_persediaan_hari: sampleInput.perputaranPersediaanHari,
      },
    },
    null,
    2
  );

  const flaskBlueprintCode = `from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
# import joblib  # Load model .pkl Anda (mis. model = joblib.load('umkm_model.pkl'))

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/predict-umkm', methods=['POST'])
def predict_umkm_status():
    payload = request.get_json(force=True)
    f = payload.get('features', {})

    vector = np.array([[
        float(f.get('omzet_bulanan_juta', 0)),
        float(f.get('pertumbuhan_omzet_mom_persen', 0)),
        float(f.get('margin_laba_bersih_persen', 0)),
        float(f.get('rasio_arus_kas_operasional', 1.0)),
        float(f.get('tingkat_retensi_pelanggan_persen', 50)),
        float(f.get('skor_adopsi_digital', 50)),
        float(f.get('perputaran_persediaan_hari', 30))
    ]])

    # Contoh skor probabilitas (ganti dengan model.predict_proba(vector))
    growth_score = float(np.clip(
        45 + (vector[0, 1] * 3.5) + ((vector[0, 2] - 15) * 1.2) + ((vector[0, 4] - 50) * 0.4),
        5.0, 99.0
    ))
    status = "BERKEMBANG" if growth_score >= 66 else ("TRANSISI" if growth_score >= 46 else "STAGNAN")

    return jsonify({
        "status": status,
        "growthProbabilityScore": round(growth_score, 1),
        "modelConfidencePersen": 91.4
    }), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)`;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Konfigurasi Koneksi Backend Python Flask API
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Hubungkan antarmuka React ini langsung ke server Flask Python tempat model Machine Learning Anda dijalankan.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => onUpdateConfig({ ...config, mode: 'SIMULASI_LOKAL' })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                config.mode === 'SIMULASI_LOKAL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Simulasi Lokal
            </button>
            <button
              type="button"
              onClick={() => onUpdateConfig({ ...config, mode: 'FLASK_API_LIVE' })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                config.mode === 'FLASK_API_LIVE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode Live Flask Endpoint
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                URL Endpoint Inferensi Flask (POST)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={config.endpointUrl}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, endpointUrl: e.target.value })
                  }
                  placeholder="http://127.0.0.1:5000/api/v1/predict-umkm"
                  className="flex-1 px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={onTestConnection}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Uji Endpoint
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Saat mode Live Flask dipilih, setiap analisis akan mengirim HTTP POST JSON ke URL di atas dengan fallback otomatis ke mesin lokal jika server belum aktif.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Header Otorisasi / API Key (Opsional)
                </label>
                <input
                  type="text"
                  value={config.apiKeyHeader || ''}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, apiKeyHeader: e.target.value })
                  }
                  placeholder="Bearer secret-umkm-token"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Batas Waktu Respons (Timeout ms)
                </label>
                <input
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  value={config.timeoutMs}
                  onChange={(e) =>
                    onUpdateConfig({ ...config, timeoutMs: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Status Diagnostik Endpoint
                </span>
                <Server className="w-4 h-4 text-slate-500" />
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-slate-900">
                  {config.connectionStatus === 'CONNECTED'
                    ? 'Terhubung ke Server Flask'
                    : config.connectionStatus === 'ERROR'
                    ? 'Server Flask Tidak Terjangkau (Fallback Aktif)'
                    : 'Mode Simulasi Lokal Aktif'}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {config.errorMessage ||
                    'Skema JSON kompatibel dengan Scikit-Learn, XGBoost, LightGBM, dan TensorFlow.'}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>POST application/json</span>
              <span>CORS: Enabled</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                Template Kode Backend Python (app.py)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Salin kode ini ke proyek Flask Python Anda untuk langsung menerima data dari dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(flaskBlueprintCode, 'flask')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedBlock === 'flask' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode Python
                </>
              )}
            </button>
          </div>

          <pre className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed flex-1">
            <code>{flaskBlueprintCode}</code>
          </pre>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Kontrak JSON Payload (Data UMKM Aktif)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format body request yang dikirimkan ke Flask saat menekan tombol Analisis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(sampleRequestPayload, 'json')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {copiedBlock === 'json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin JSON
                </>
              )}
            </button>
          </div>

          <pre className="mt-4 p-4 bg-slate-900 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed flex-1">
            <code>{sampleRequestPayload}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
