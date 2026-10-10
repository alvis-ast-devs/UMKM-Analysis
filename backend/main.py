import pickle

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Inisialisasi FastAPI
app = FastAPI(title="AOL AI - UMKM Diagnostic API", version="1.0")

# Izinkan akses dari Frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load Model dan Label Encoder (.pkl)
with open("xgboost_umkm_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("label_encoder_y.pkl", "rb") as f:
    le_y = pickle.load(f)


# 3. Struktur Input Minimalis (Sesuai form ringkas yang diinginkan)
class MinimalUMKMInput(BaseModel):
    Net_Profit_Margin: float
    Burn_Rate_Ratio: float
    Repeat_Order_Rate: float
    Transaction_Count: int
    Peak_Hour_Latency: str  # 'Low', 'Med', 'High'


# 4. Fungsi Pembuat Narasi Lisan Otomatis
def generate_narration(status, data: MinimalUMKMInput):
    if status == "Critical":
        narasi = "Peringatan! Bisnis Anda terdeteksi dalam **Status Kritis**. "
        if data.Burn_Rate_Ratio > 1.0:
            narasi += f"Penyebab utamanya adalah rasio pengeluaran (Burn Rate) yang mencapai {data.Burn_Rate_Ratio}, di mana pengeluaran melampaui pemasukan kas. "
        if data.Net_Profit_Margin < 0:
            narasi += f"Ditambah lagi margin laba bersih bernilai negatif ({data.Net_Profit_Margin}%). "
        narasi += "Segera lakukan evaluasi keuangan mendesak."

    elif status == "Struggling":
        narasi = "Bisnis Anda berada dalam **Status Kurang Stabil (Struggling)**. "
        narasi += f"Meskipun operasional berjalan, tingkat *Repeat Order* ({data.Repeat_Order_Rate}%) perlu ditingkatkan agar bisnis tidak jatuh ke zona merah."

    elif status == "Growth":
        narasi = "Kabar baik! Bisnis Anda menunjukkan **Tren Pertumbuhan (Growth)** yang positif. "
        narasi += "Performa transaksi dan stabilitas keuangan sudah berjalan cukup baik. Pertahankan konsistensi ini."

    else:  # Elite
        narasi = "Luar biasa! Bisnis Anda masuk dalam kategori **Elite**. "
        narasi += "Seluruh indikator keuangan, laba, dan retensi pelanggan berada di tingkat kesehatan yang sangat optimal. Bisnis siap untuk ekspansi lebih luas."

    return narasi


# 5. Endpoint API Prediksi Ringkas
@app.post("/predict-simple")
def predict_simple(data: MinimalUMKMInput):
    # Mapping Peak_Hour_Latency ke bentuk numerik sesuai model
    latency_map = {"Low": 0, "Med": 1, "High": 2}
    latency_val = latency_map.get(data.Peak_Hour_Latency, 0)

    # Mengisi 13 kolom yang dibutuhkan model (.pkl)
    # di mana 5 kolom diisi input user, sisanya diisi nilai default/rata-rata yang aman
    input_df = pd.DataFrame(
        [
            {
                "ID": 999,
                "Monthly_Revenue": 5000000,
                "Net_Profit_Margin (%)": data.Net_Profit_Margin,
                "Burn_Rate_Ratio": data.Burn_Rate_Ratio,
                "Transaction_Count": data.Transaction_Count,
                "Avg_Historical_Rating": 4.2,
                "Review_Text": "Pelayanan standar",
                "Review_Volatility": 0.3,
                "Business_Tenure_Months": 24,
                "Repeat_Order_Rate (%)": data.Repeat_Order_Rate,
                "Digital_Adoption_Score": 3.0,
                "Peak_Hour_Latency": latency_val,
                "Location_Competitiveness": 8,
                "Sentiment_Score": 0.0,
            }
        ]
    )

    # Lakukan prediksi dengan model XGBoost
    pred_encoded = model.predict(input_df)[0]
    status_label = le_y.inverse_transform([pred_encoded])[0]

    # Buat narasi lisan
    explanation = generate_narration(status_label, data)

    return {"status": status_label, "narration": explanation, "raw_inputs": data.dict()}
