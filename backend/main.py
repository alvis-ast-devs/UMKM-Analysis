import pickle
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# 1. KONFIGURASI
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "xgboost_umkm_model.pkl"
ENCODER_PATH = BASE_DIR / "label_encoder_y.pkl"

print("=" * 60)
print("       AOL AI - UMKM DIAGNOSTIC API")
print("=" * 60)
print("Python version:", sys.version)


# Urutan dan nama kolom harus sesuai dengan proses training.
FEATURE_COLUMNS = [
    "ID",
    "Monthly_Revenue",
    "Net_Profit_Margin (%)",
    "Burn_Rate_Ratio",
    "Transaction_Count",
    "Avg_Historical_Rating",
    "Review_Volatility",
    "Business_Tenure_Months",
    "Repeat_Order_Rate (%)",
    "Digital_Adoption_Score",
    "Peak_Hour_Latency",
    "Location_Competitiveness",
    "Sentiment_Score",
]

LATENCY_MAPPING = {
    "Low": 0,
    "Med": 1,
    "High": 2,
}


# Variabel model akan diisi saat aplikasi mulai.
model = None
le_y = None


# ============================================================
# 2. MEMUAT MODEL DAN LABEL ENCODER
# ============================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, le_y

    try:
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        print("\n[OK] Model berhasil dimuat!")
        print("Model type:", type(model).__name__)

        with open(ENCODER_PATH, "rb") as f:
            le_y = pickle.load(f)

        print("[OK] Label encoder berhasil dimuat!")
        print("Kelas target:", list(le_y.classes_))

        # Periksa apakah model mengenali nama fitur dari training.
        if hasattr(model, "feature_names_in_"):
            expected = list(model.feature_names_in_)

            if expected != FEATURE_COLUMNS:
                raise ValueError(
                    "Nama atau urutan fitur tidak sesuai dengan model.\n"
                    f"Fitur model: {expected}\n"
                    f"Fitur API: {FEATURE_COLUMNS}"
                )

        yield

    except Exception as e:
        print(f"\n[ERROR] Gagal menginisialisasi model: {e}")
        raise

    finally:
        model = None
        le_y = None


# ============================================================
# 3. INISIALISASI FASTAPI
# ============================================================

app = FastAPI(
    title="AOL AI - UMKM Diagnostic API",
    version="2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 4. STRUKTUR INPUT DARI FRONTEND
# ============================================================


class UMKMInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    ID: int = Field(alias="ID", ge=0)
    Monthly_Revenue: float = Field(alias="Monthly_Revenue", ge=0)
    Net_Profit_Margin: float = Field(alias="Net_Profit_Margin (%)")
    Burn_Rate_Ratio: float = Field(alias="Burn_Rate_Ratio", ge=0)
    Transaction_Count: int = Field(alias="Transaction_Count", ge=0)
    Avg_Historical_Rating: float = Field(alias="Avg_Historical_Rating", ge=0, le=5)
    Review_Volatility: float = Field(alias="Review_Volatility", ge=0)
    Business_Tenure_Months: int = Field(alias="Business_Tenure_Months", ge=0)
    Repeat_Order_Rate: float = Field(alias="Repeat_Order_Rate (%)", ge=0, le=100)
    Digital_Adoption_Score: float = Field(alias="Digital_Adoption_Score", ge=0, le=10)
    Peak_Hour_Latency: Literal["Low", "Med", "High"] = Field(alias="Peak_Hour_Latency")
    Location_Competitiveness: float = Field(
        alias="Location_Competitiveness", ge=0, le=10
    )
    Sentiment_Score: float = Field(alias="Sentiment_Score", ge=-1, le=1)


# ============================================================
# 5. MEMBUAT DATAFRAME UNTUK MODEL
# ============================================================


def prepare_input(data: UMKMInput) -> pd.DataFrame:
    # Ambil data dari request API.
    input_data = {
        "ID": data.ID,
        "Monthly_Revenue": data.Monthly_Revenue,
        "Net_Profit_Margin (%)": data.Net_Profit_Margin,
        "Burn_Rate_Ratio": data.Burn_Rate_Ratio,
        "Transaction_Count": data.Transaction_Count,
        "Avg_Historical_Rating": data.Avg_Historical_Rating,
        "Review_Volatility": data.Review_Volatility,
        "Business_Tenure_Months": data.Business_Tenure_Months,
        "Repeat_Order_Rate (%)": data.Repeat_Order_Rate,
        "Digital_Adoption_Score": data.Digital_Adoption_Score,
        "Peak_Hour_Latency": data.Peak_Hour_Latency,
        "Location_Competitiveness": data.Location_Competitiveness,
        "Sentiment_Score": data.Sentiment_Score,
    }

    # Susun menjadi satu baris DataFrame dengan urutan fitur training.
    X_input = pd.DataFrame(
        [input_data],
        columns=FEATURE_COLUMNS,
    )

    # Encoding kategori harus konsisten dengan training.
    X_input["Peak_Hour_Latency"] = X_input["Peak_Hour_Latency"].map(LATENCY_MAPPING)

    if X_input.isna().any().any():
        invalid_columns = X_input.columns[X_input.isna().any()].tolist()

        raise ValueError(f"Nilai kosong atau kategori tidak valid: {invalid_columns}")

    return X_input


# ============================================================
# 6. MEMBUAT NARASI BERDASARKAN HASIL PREDIKSI
# ============================================================


def generate_narration(status: str, data: UMKMInput) -> str:
    status_normalized = status.strip().lower()

    if status_normalized == "critical":
        narration = "Peringatan! Model mendeteksi bisnis dalam status Critical. "

        if data.Burn_Rate_Ratio > 1.0:
            narration += (
                f"Burn Rate Ratio mencapai {data.Burn_Rate_Ratio}, "
                "yang perlu diperiksa karena pengeluaran kas mungkin "
                "melampaui pemasukan kas. "
            )

        if data.Net_Profit_Margin < 0:
            narration += (
                f"Net Profit Margin bernilai negatif ({data.Net_Profit_Margin}%). "
            )

        narration += "Evaluasi arus kas dan kondisi keuangan bisnis."

    elif status_normalized == "struggling":
        narration = (
            "Model mendeteksi bisnis dalam status Struggling. "
            f"Repeat Order Rate saat ini {data.Repeat_Order_Rate}%. "
            "Evaluasi retensi pelanggan dan faktor operasional lainnya."
        )

    elif status_normalized == "growth":
        narration = (
            "Model mengklasifikasikan bisnis dalam status Growth. "
            "Periksa perkembangan pendapatan, laba, dan transaksi "
            "secara berkala untuk menjaga pertumbuhan."
        )

    elif status_normalized == "elite":
        narration = (
            "Model mengklasifikasikan bisnis dalam status Elite. "
            "Pertahankan kinerja bisnis dan tetap pantau indikator "
            "keuangan serta pelanggan."
        )

    else:
        narration = (
            f"Model mengklasifikasikan bisnis ke dalam kelas "
            f"{status}. Tinjau indikator bisnis untuk memahami "
            "kondisi yang mendasari klasifikasi tersebut."
        )

    return narration


# ============================================================
# 7. ENDPOINT UTAMA: PREDIKSI UMKM
# ============================================================


@app.post("/predict")
def predict(data: UMKMInput):
    if model is None or le_y is None:
        raise HTTPException(
            status_code=503,
            detail="Model belum siap digunakan.",
        )

    try:
        # A. Persiapkan data.
        X_input = prepare_input(data)

        print("\n" + "=" * 60)
        print("DATA INPUT PREDIKSI")
        print("=" * 60)
        print(X_input.to_string(index=False))

        # B. Prediksi kelas menggunakan model XGBoost.
        prediction_encoded = model.predict(X_input)
        encoded_value = prediction_encoded[0]

        # Model pada kode training menggunakan LabelEncoder.
        predicted_class = le_y.inverse_transform([int(encoded_value)])[0]

        predicted_class = str(predicted_class)

        print("\nPredicted class:", predicted_class)

        # C. Probabilitas masing-masing kelas jika tersedia.
        probabilities_result = None

        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(X_input)[0]

            # Ambil urutan kelas dari model agar cocok dengan
            # urutan probabilitas yang dihasilkan predict_proba().
            model_classes = getattr(model, "classes_", None)

            if model_classes is not None:
                class_labels = le_y.inverse_transform(model_classes.astype(int))
            else:
                class_labels = le_y.classes_

            probabilities_result = [
                {
                    "class": str(class_label),
                    "probability": round(float(probability) * 100, 2),
                }
                for class_label, probability in zip(class_labels, probabilities)
            ]

            # Urutkan dari probabilitas tertinggi.
            probabilities_result.sort(
                key=lambda item: item["probability"],
                reverse=True,
            )

        # D. Buat narasi dari kelas hasil prediksi model.
        narration = generate_narration(
            predicted_class,
            data,
        )

        # E. Kembalikan hasil kepada frontend.
        return {
            "status": predicted_class,
            "narration": narration,
            "probabilities": probabilities_result,
            "raw_inputs": data.model_dump(by_alias=True),
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"[ERROR] Prediksi gagal: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Prediksi gagal: {e!s}",
        ) from e


# ============================================================
# 8. ENDPOINT UNTUK MEMERIKSA API
# ============================================================


@app.get("/")
def home():
    return {
        "message": "AOL AI - UMKM Diagnostic API aktif",
        "model_loaded": model is not None,
        "prediction_endpoint": "/predict",
        "documentation": "/docs",
    }


# ============================================================
# 9. MENJALANKAN SERVER
# ============================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )
