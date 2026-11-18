import pickle
import sys

import pandas as pd
from IPython.display import display

MODEL_PATH = "xgboost_umkm_model.pkl"
ENCODER_PATH = "label_encoder_y.pkl"

DATA_MODE = "sample"

print("=" * 60)
print("       UMKM XGBOOST PREDICTION TESTER")
print("=" * 60)

print("\nPython version:", sys.version)

# ============================================================
# 2. MEMUAT MODEL DAN LABEL ENCODER
# ============================================================

try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

    print("\n[OK] Model berhasil dimuat!")
    print("Model type:", type(model).__name__)

except Exception as e:
    raise RuntimeError(f"Gagal memuat model dari {MODEL_PATH}: {e}") from e

try:
    with open(ENCODER_PATH, "rb") as f:
        le_y = pickle.load(f)

    print("[OK] Label encoder berhasil dimuat!")
    print("Kelas target:", list(le_y.classes_))

except Exception as e:
    raise RuntimeError(f"Gagal memuat label encoder dari {ENCODER_PATH}: {e}") from e

# ============================================================
# 3. MENYIAPKAN DATA UMKM
# ============================================================

# Contoh data buatan untuk pengujian.
# Kamu dapat mengubah nilainya untuk menguji skenario lain.

sample_data = {
    "ID": 150001,
    "Monthly_Revenue": 8500000,
    "Net_Profit_Margin (%)": 25.0,
    "Burn_Rate_Ratio": 0.65,
    "Transaction_Count": 220,
    "Avg_Historical_Rating": 4.7,
    "Review_Volatility": 0.20,
    "Business_Tenure_Months": 48,
    "Repeat_Order_Rate (%)": 65.0,
    "Digital_Adoption_Score": 8.5,
    "Peak_Hour_Latency": "Low",
    "Location_Competitiveness": 8,
    "Sentiment_Score": 0.75,
}

# Ubah nilai-nilai berikut jika ingin menguji data sendiri.
manual_data = {
    "ID": 150002,
    "Monthly_Revenue": 4200000,
    "Net_Profit_Margin (%)": 8.0,
    "Burn_Rate_Ratio": 1.05,
    "Transaction_Count": 90,
    "Avg_Historical_Rating": 3.5,
    "Review_Volatility": 0.60,
    "Business_Tenure_Months": 18,
    "Repeat_Order_Rate (%)": 25.0,
    "Digital_Adoption_Score": 3.0,
    "Peak_Hour_Latency": "High",
    "Location_Competitiveness": 5,
    "Sentiment_Score": -0.20,
}

if DATA_MODE == "sample":
    input_data = sample_data.copy()
elif DATA_MODE == "manual":
    input_data = manual_data.copy()
else:
    raise ValueError("DATA_MODE harus berupa 'sample' atau 'manual'.")

# ============================================================
# 4. PREPROCESSING DATA INPUT
# ============================================================

# Urutan dan nama fitur harus sesuai dengan saat training.
feature_columns = [
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

# Pastikan seluruh fitur tersedia.
missing_columns = [col for col in feature_columns if col not in input_data]

if missing_columns:
    raise ValueError(f"Data input belum memiliki fitur: {missing_columns}")

# Bentuk DataFrame dengan satu baris data.
X_input = pd.DataFrame([input_data], columns=feature_columns)

# Encoding latency harus sama dengan preprocessing training.
latency_mapping = {"Low": 0, "Med": 1, "High": 2}

X_input["Peak_Hour_Latency"] = (
    X_input["Peak_Hour_Latency"].astype(str).str.strip().map(latency_mapping)
)

if X_input.isna().any().any():
    invalid_columns = X_input.columns[X_input.isna().any()].tolist()

    raise ValueError(
        f"Ada nilai kosong atau kategori tidak valid pada: {invalid_columns}"
    )

# Periksa kecocokan nama fitur jika tersedia pada model.
if hasattr(model, "feature_names_in_"):
    expected_features = list(model.feature_names_in_)

    if expected_features != feature_columns:
        raise ValueError(
            "Fitur input tidak sesuai dengan model.\n"
            f"Fitur model: {expected_features}\n"
            f"Fitur input: {feature_columns}"
        )

# ============================================================
# 5. MELAKUKAN PREDIKSI
# ============================================================

print("\n" + "=" * 60)
print("DATA UMKM YANG DIUJI")
print("=" * 60)

display(X_input)

print("\nMemproses prediksi...")

prediction_encoded = model.predict(X_input)
prediction_label = le_y.inverse_transform(prediction_encoded.astype(int))

predicted_class = prediction_label[0]

print("\n" + "=" * 60)
print("HASIL PREDIKSI")
print("=" * 60)

print("Predicted class:", predicted_class)

# ============================================================
# 6. MENAMPILKAN PROBABILITAS SETIAP KELAS
# ============================================================

if hasattr(model, "predict_proba"):
    probabilities = model.predict_proba(X_input)[0]

    print("\nProbabilitas setiap kelas:")

    probability_df = pd.DataFrame(
        {
            "Class": le_y.inverse_transform(model.classes_.astype(int)),
            "Probability (%)": probabilities * 100,
        }
    )

    probability_df = probability_df.sort_values(
        "Probability (%)", ascending=False
    ).reset_index(drop=True)

    probability_df["Probability (%)"] = probability_df["Probability (%)"].round(2)

    display(probability_df)

print("\nPengujian selesai!")
