import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ================= LOAD DATA =================
df = pd.read_csv(r"C:\Users\User\OneDrive\Desktop\medaidataset\final_medai_dataset.csv")

X = df.drop(columns=["disease"])
y = df["disease"]

# ================= TRAIN TEST SPLIT =================
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.3,
    stratify=y,
    random_state=18
)

# ================= STANDARDIZATION =================
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ================= MODEL =================
mlpc = MLPClassifier(
    hidden_layer_sizes=(128, 64, 32),
    max_iter=1200,
    alpha=1e-3,
    solver='adam',
    tol=1e-5,
    random_state=18,
    learning_rate_init=0.0005
)

# ================= TRAIN =================
mlpc.fit(X_train_scaled, y_train)

# ================= BASIC PREDICTIONS =================
y_pred = mlpc.predict(X_test_scaled)
y_prob = mlpc.predict_proba(X_test_scaled)
classes = mlpc.classes_

print("Top-1 Accuracy (Raw):", accuracy_score(y_test, y_pred))

# ================= TOP-3 ACCURACY =================
top3_indices = np.argsort(y_prob, axis=1)[:, -3:]
top3_accuracy = np.mean([
    y_test.iloc[i] in classes[top3_indices[i]]
    for i in range(len(y_test))
])
print("Top-3 Accuracy:", top3_accuracy)

# ====================================================
# =============== SIBLING DISEASE LOGIC ===============
# ====================================================

SIBLING_GROUPS = [
    {"Common Cold", "Sinusitis"},
    {"Viral Fever", "Influenza"},
    {"Dengue", "Chikungunya"},
    {"Bronchitis", "Pneumonia"},
    {"Gastroenteritis", "Food Poisoning"}
]

def are_siblings(d1, d2):
    return any({d1, d2}.issubset(group) for group in SIBLING_GROUPS)

# ====================================================
# =========== STRONG SYMPTOM TIE-BREAKER ==============
# ====================================================

def apply_strong_symptom_logic(row, probs):
    """
    row   -> unscaled symptom row
    probs -> probability array for that row
    """
    scores = dict(zip(classes, probs))

    # ---- STRONG & UNIQUE SYMPTOMS ----
    if row["yellowing_skin_eyes"] == 1:
        scores["Jaundice"] += 0.15

    if row["burning_urination"] == 1 or row["frequent_urination"] == 1:
        scores["Urinary Tract Infection"] += 0.15

    if row["headache"] == 1 and row["sensitivity_to_light"] == 1:
        scores["Migraine"] += 0.08  # soft boost only

    return scores

# ====================================================
# ===== FINAL ACCURACY (SIBLING + STRONG RULES) =======
# ====================================================

final_correct = []

for i in range(len(y_test)):
    true_disease = y_test.iloc[i]
    row = X_test.iloc[i]
    probs = y_prob[i]

    adjusted_scores = apply_strong_symptom_logic(row, probs)

    ranked = sorted(adjusted_scores.items(), key=lambda x: x[1], reverse=True)
    top1 = ranked[0][0]
    top2 = ranked[1][0]

    if true_disease == top1:
        final_correct.append(True)
    elif are_siblings(true_disease, top1) or are_siblings(true_disease, top2):
        final_correct.append(True)
    else:
        final_correct.append(False)

final_accuracy = np.mean(final_correct)
print("Final Accuracy (Sibling + Strong Symptoms):", final_accuracy)

# ================= PER-DISEASE METRICS =================
report = classification_report(y_test, y_pred, output_dict=True)
report_df = pd.DataFrame(report).transpose()

per_disease = report_df.drop(
    ["accuracy", "macro avg", "weighted avg"],
    errors="ignore"
).rename(columns={
    "precision": "Precision",
    "recall": "Recall",
    "f1-score": "F1_Score",
    "support": "Samples"
})

print("\n=== Per-Disease Performance (Top-1) ===\n")
print(per_disease.sort_values(by="Recall", ascending=False))

# ================= SAVE FOR RESEARCH =================
per_disease.to_csv("per_disease_top1_metrics.csv")

print("\nSaved:")
print("- per_disease_top1_metrics.csv")

# ================= SAVE MODEL =================
joblib.dump({
    "model": mlpc,
    "scaler": scaler
}, "symptom_disease_mlp_model.pkl")

print("Model and scaler saved as symptom_disease_mlp_model.pkl")
