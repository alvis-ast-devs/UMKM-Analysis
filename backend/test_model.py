import pickle
import sys

print("Python version:", sys.version)
print("Loading model...")

try:
    with open("xgboost_umkm_model.pkl", "rb") as f:
        model = pickle.load(f)
    print("Model loaded successfully!")
    print("Model type:", type(model))
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

try:
    with open("label_encoder_y.pkl", "rb") as f:
        le = pickle.load(f)
    print("Label encoder loaded successfully!")
    print("Label encoder classes:", le.classes_)
except Exception as e:
    print(f"Error loading label encoder: {e}")
    sys.exit(1)

print("\nAll models loaded successfully!")
