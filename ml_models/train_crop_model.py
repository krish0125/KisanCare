"""
ml_models/train_crop_model.py
------------------------------
Trains a RandomForestClassifier for crop recommendation and saves it
to ml_models/crop_model.pkl.

Features  (7 inputs):
  N            — Nitrogen content in soil (kg/ha),  range: 0–140
  P            — Phosphorus content (kg/ha),         range: 5–145
  K            — Potassium content (kg/ha),           range: 5–205
  temperature  — Average temperature (°C),            range: 8–44
  humidity     — Relative humidity (%),               range: 14–99
  pH           — Soil pH,                             range: 3.5–9.9
  rainfall     — Monthly rainfall (mm),               range: 20–300

Output (22 crop labels — common Indian/tropical crops):
  rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean,
  blackgram, lentil, pomegranate, banana, mango, grapes, watermelon,
  muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee

Agronomic ranges sourced from:
  - ICAR (Indian Council of Agricultural Research) crop guides
  - FAO crop water requirements data
  - Kaggle "Crop Recommendation Dataset" (Atharva Ingle, 2020)
    — we generate synthetic data with the same statistical properties
    rather than downloading the original file, keeping the project
    self-contained and reproducible.

Run with:
  python ml_models/train_crop_model.py
"""

import os
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

np.random.seed(42)

# ── Agronomic profiles per crop ────────────────────────────────────────────
# Each entry: [N_mean, N_std, P_mean, P_std, K_mean, K_std,
#              temp_mean, temp_std, hum_mean, hum_std,
#              pH_mean, pH_std, rain_mean, rain_std, n_samples]
# Values derived from published ICAR/FAO crop-wise nutrient and climate requirements.

CROP_PROFILES = {
    # crop_name: (N_mu, N_sd, P_mu, P_sd, K_mu, K_sd,
    #             T_mu, T_sd, H_mu, H_sd, pH_mu, pH_sd, R_mu, R_sd, n)
    'rice':        (80,  8, 40,  6, 40,  6, 23,  2, 82,  4, 6.2, 0.4, 200, 30, 100),
    'maize':       (78,  8, 48,  6, 20,  5, 22,  2, 65,  5, 6.0, 0.4, 85,  20, 100),
    'chickpea':    (40,  5, 68,  7, 80,  8, 18,  2, 16,  3, 7.0, 0.3, 50,  12, 100),
    'kidneybeans': (20,  4, 67,  7, 20,  5, 20,  2, 21,  4, 6.0, 0.4, 105, 20, 100),
    'pigeonpeas':  (17,  4, 68,  7, 20,  5, 28,  2, 48,  5, 6.5, 0.4, 150, 25, 100),
    'mothbeans':   (21,  4, 48,  6, 20,  5, 28,  2, 53,  5, 6.8, 0.3, 55,  15, 100),
    'mungbean':    (20,  4, 48,  6, 19,  5, 29,  2, 85,  5, 6.5, 0.3, 45,  12, 100),
    'blackgram':   (40,  5, 68,  7, 19,  5, 30,  2, 65,  5, 7.0, 0.3, 65,  15, 100),
    'lentil':      (18,  4, 68,  7, 19,  5, 19,  2, 65,  5, 7.0, 0.3, 45,  12, 100),
    'pomegranate': (18,  4, 18,  4, 20,  5, 21,  2, 90,  5, 6.0, 0.4, 110, 20, 100),
    'banana':      (100,10, 82,  8, 50,  7, 27,  2, 80,  4, 6.0, 0.4, 105, 20, 100),
    'mango':       (20,  4, 28,  5, 30,  5, 31,  2, 50,  5, 6.0, 0.4, 95,  20, 100),
    'grapes':      (23,  4, 132,10, 200,12, 24,  2, 82,  5, 6.1, 0.4, 70,  15, 100),
    'watermelon':  (99,  9, 17,  4, 50,  7, 25,  2, 85,  4, 6.5, 0.4, 50,  12, 100),
    'muskmelon':   (100,10, 17,  4, 50,  7, 28,  2, 92,  4, 6.5, 0.4, 25,   8, 100),
    'apple':       (21,  4, 134,10, 199,12, 21,  2, 92,  4, 5.7, 0.4, 112, 20, 100),
    'orange':      (20,  4, 10,  3, 10,  4, 22,  2, 92,  4, 7.0, 0.3, 110, 20, 100),
    'papaya':      (50,  6, 59,  7, 50,  7, 34,  2, 92,  4, 6.5, 0.3, 140, 25, 100),
    'coconut':     (22,  4, 16,  4, 30,  5, 27,  2, 94,  3, 5.7, 0.4, 175, 30, 100),
    'cotton':      (118,10, 45,  6, 43,  6, 25,  2, 79,  5, 6.5, 0.4, 80,  20, 100),
    'jute':        (78,  8, 46,  6, 40,  6, 25,  2, 80,  5, 6.5, 0.3, 175, 30, 100),
    'coffee':      (101,10, 28,  5, 29,  5, 25,  2, 58,  5, 6.5, 0.3, 158, 30, 100),
}


def generate_dataset() -> pd.DataFrame:
    """Generate a synthetic but agronomically realistic crop dataset."""
    rows = []
    for crop, (N_mu, N_sd, P_mu, P_sd, K_mu, K_sd,
               T_mu, T_sd, H_mu, H_sd, pH_mu, pH_sd,
               R_mu, R_sd, n) in CROP_PROFILES.items():
        N   = np.clip(np.random.normal(N_mu, N_sd, n),   0,   160)
        P   = np.clip(np.random.normal(P_mu, P_sd, n),   5,   150)
        K   = np.clip(np.random.normal(K_mu, K_sd, n),   5,   210)
        T   = np.clip(np.random.normal(T_mu, T_sd, n),   5,    48)
        H   = np.clip(np.random.normal(H_mu, H_sd, n),  10,   100)
        pH  = np.clip(np.random.normal(pH_mu, pH_sd, n), 3.0, 10.0)
        R   = np.clip(np.random.normal(R_mu, R_sd, n),  15,   310)
        for i in range(n):
            rows.append({
                'N': round(N[i], 1), 'P': round(P[i], 1), 'K': round(K[i], 1),
                'temperature': round(T[i], 1), 'humidity': round(H[i], 1),
                'pH': round(pH[i], 2), 'rainfall': round(R[i], 1),
                'label': crop
            })
    df = pd.DataFrame(rows).sample(frac=1, random_state=42).reset_index(drop=True)
    return df


def train_and_save():
    print("=" * 60)
    print("KisanCare -- Crop Recommendation Model Training")
    print("=" * 60)

    print("\n[1/4] Generating synthetic crop dataset...")
    df = generate_dataset()
    print(f"    Total samples : {len(df)}")
    print(f"    Crops         : {df['label'].nunique()} ({', '.join(sorted(df['label'].unique()))})") 

    X = df[['N', 'P', 'K', 'temperature', 'humidity', 'pH', 'rainfall']]
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n[2/4] Train/test split: {len(X_train)} / {len(X_test)}")

    print("\n[3/4] Training RandomForestClassifier (n_estimators=200)...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n     Test Accuracy : {acc * 100:.1f}%")
    print("\n     Classification Report:")
    print(classification_report(y_test, y_pred))

    # Save model
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, 'crop_model.pkl')
    joblib.dump(model, out_path)
    size_mb = os.path.getsize(out_path) / 1_048_576
    print(f"\n[4/4] Model saved -> {out_path}  ({size_mb:.1f} MB)")
    print("=" * 60)
    return model


if __name__ == '__main__':
    train_and_save()
