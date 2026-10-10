import pickle

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 1. Inisialisasi FastAPI
app = FastAPI(title="UMKM Health AI API", version="1.0")

# Izinkan akses dari Frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Load Model dan Label Encoder yang sudah disimpan (.pkl)
with open("xgboost_umkm_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("label_encoder_y.pkl", "rb") as f:
    le_y = pickle.load(f)


# 3. Definisikan Struktur Data Input dari Frontend (Sesuai kolom dataset)
class UMKMInput(BaseModel):
    Monthly_Revenue: float
    Net_Profit_Margin: float
    Burn_Rate_Ratio: float
    Transaction_Count: int
    Avg_Historical_Rating: float
    Review_Text: str
    Review_Volatility: float
    Business_Tenure_Months: int
    Repeat_Order_Rate: float
    Digital_Adoption_Score: float
    Peak_Hour_Latency: str  # 'Low', 'Med', 'High'
    Location_Competitiveness: int
    Sentiment_Score: float


# 4. Fungsi Pembuat Narasi Lisan (Explainable AI Sederhana)
def generate_narration(status, data: UMKMInput):
    if status == "Critical":
        narasi = "Berdasarkan analisis sistem, bisnis Anda saat ini berada dalam **Status Kritis (Bahaya)**. "
        if data.Burn_Rate_Ratio > 1.0:
            narasi += f"Penyebab utamanya adalah rasio pengeluaran (Burn Rate) yang mencapai {data.Burn_Rate_Ratio}, di mana uang keluar lebih besar daripada pemasukan kas. "
        if data.Net_Profit_Margin < 0:
            narasi += f"Ditambah lagi margin laba bersih tercatat negatif ({data.Net_Profit_Margin}%). "
        narasi += (
            "Sangat disarankan untuk segera memangkas biaya operasional tidak penting."
        )

    elif status == "Struggling":
        narasi = "Bisnis Anda terdeteksi dalam **Status Kurang Stabil (Struggling)**. "
        narasi += f"Meskipun masih berjalan, tingkat *Repeat Order* ({data.Repeat_Order_Rate}%) dan margin laba perlu ditingkatkan agar tidak jatuh ke zona merah."

    elif status == "Growth":
        narasi = "Kabar baik! Bisnis Anda menunjukkan **Tren Pertumbuhan (Growth) yang positif**. "
        narasi += f"Performa operasional dan *Digital Adoption Score* ({data.Digital_Adoption_Score}) sudah berjalan dengan baik. Pertahankan konsistensi ini."

    else:  # Elite
        narasi = "Luar biasa! Bisnis Anda masuk dalam kategori **Elite**. "
        narasi += "Seluruh indikator keuangan, laba, dan retensi pelanggan berada di tingkat kesehatan yang sangat optimal. Bisnis siap untuk tahap ekspansi."

    return narasi


# 5. Endpoint API untuk Prediksi
@app.post("/predict")
def predict_health(data: UMKMInput):
    # Ubah input menjadi DataFrame
    input_df = pd.DataFrame(
        [
            {
                "Monthly_Revenue": data.Monthly_Revenue,
                "Net_Profit_Margin (%)": data.Net_Profit_Margin,
                "Burn_Rate_Ratio": data.Burn_Rate_Ratio,
                "Transaction_Count": data.Transaction_Count,
                "Avg_Historical_Rating": data.Avg_Historical_Rating,
                "Review_Text": data.Review_Text,
                "Review_Volatility": data.Review_Volatility,
                "Business_Tenure_Months": data.Business_Tenure_Months,
                "Repeat_Order_Rate (%)": data.Repeat_Order_Rate,
                "Digital_Adoption_Score": data.Digital_Adoption_Score,
                "Peak_Hour_Latency": 0
                if data.Peak_Hour_Latency == "Low"
                else (1 if data.Peak_Hour_Latency == "Med" else 2),
                "Location_Competitiveness": data.Location_Competitiveness,
                "Sentiment_Score": data.Sentiment_Score,
            }
        ]
    )

    # Prediksi menggunakan model XGBoost
    pred_encoded = model.predict(input_df)[0]
    status_label = le_y.inverse_transform([pred_encoded])[0]

    # Buat penjelasan lisan
    explanation = generate_narration(status_label, data)

    return {
        "status": status_label,
        "narration": explanation,
        "raw_metrics": data.dict(),  # Data mentah tetap dikirim jika user ingin melihat rincian angka
    }


@app.post("/predict-simple")
def predict_minimal(data: UMKMInput):
    # User hanya menginput data penting, sisanya kita isi nilai default/rata-rata
    input_df = pd.DataFrame(
        [
            {
                "ID": 999,  # Dummy ID
                "Monthly_Revenue": 5000000,  # Nilai default aman
                "Net_Profit_Margin (%)": data.Net_Profit_Margin,
                "Burn_Rate_Ratio": data.Burn_Rate_Ratio,
                "Transaction_Count": data.Transaction_Count,
                "Avg_Historical_Rating": 4.0,  # Nilai default standar
                "Review_Text": "Pelayanan standar",  # Teks dummy agar kolom terpenuhi
                "Review_Volatility": 0.3,
                "Business_Tenure_Months": 24,
                "Repeat_Order_Rate (%)": data.Repeat_Order_Rate,
                "Digital_Adoption_Score": 3.0,
                "Peak_Hour_Latency": 0 if data.Peak_Hour_Latency == "Low" else 1,
                "Location_Competitiveness": 8,
                "Sentiment_Score": 0.0,
            }
        ]
    )

    # Prediksi tetap berjalan normal menggunakan model .pkl!
    pred_encoded = model.predict(input_df)[0]
    status_label = le_y.inverse_transform([pred_encoded])[0]

    return {"status": status_label, "message": "Analisis berhasil dengan form ringkas!"}
