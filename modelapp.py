import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ====================================================
# ========== PRECAUTION TAG MAPPING ==================
# ====================================================
# These are GENERAL, NON-MEDICAL precaution categories.
# They are NOT treatments or diagnoses.

PRECAUTION_TAGS = {
    "Common Cold": [
        "rest",
        "hydration",
        "avoid_cold_exposure"
    ],
    "Influenza": [
        "rest",
        "hydration",
        "monitor_fever",
        "avoid_contact"
    ],
    "Viral Fever": [
        "rest",
        "hydration",
        "monitor_temperature"
    ],
    "Dengue": [
        "rest",
        "hydration",
        "avoid_mosquito_exposure",
        "monitor_fever"
    ],
    "Chikungunya": [
        "rest",
        "hydration",
        "joint_care",
        "avoid_mosquito_exposure"
    ],
    "Jaundice": [
        "diet_care",
        "rest",
        "avoid_alcohol",
        "monitor_symptoms"
    ],
    "Food Poisoning": [
        "hydration",
        "diet_care",
        "rest"
    ],
    "Gastroenteritis": [
        "hydration",
        "diet_care",
        "rest"
    ],
    "Urinary Tract Infection": [
        "hydration",
        "maintain_hygiene",
        "monitor_symptoms"
    ],
    "Migraine": [
        "rest",
        "avoid_bright_light",
        "stress_management"
    ],
    "Bronchitis": [
        "rest",
        "avoid_smoke",
        "monitor_breathing"
    ],
    "Pneumonia": [
        "rest",
        "monitor_breathing",
        "avoid_cold_exposure"
    ],
    "Typhoid": [
        "rest",
        "hydration",
        "diet_care"
    ],
    "Diabetes": [
        "diet_control",
        "regular_monitoring",
        "healthy_lifestyle"
    ],
    "Hypertension": [
        "stress_management",
        "diet_control",
        "regular_monitoring"
    ],
    "Anemia": [
        "balanced_diet",
        "rest",
        "monitor_energy_levels"
    ],
    "Asthma": [
        "avoid_triggers",
        "monitor_breathing",
        "rest"
    ],
    "Sinusitis": [
        "rest",
        "avoid_cold_exposure",
        "hydration"
    ],
    "Allergic Rhinitis": [
        "avoid_allergens",
        "maintain_hygiene"
    ]
}

# ====================================================
# ===== COLLECT PRECAUTIONS FROM TOP-3 DISEASES ======
# ====================================================

def get_precaution_tags(top_diseases):
    """
    top_diseases -> list of disease names (Top-3 predictions)

    Returns:
        A unique list of precaution tags relevant to all predictions
    """
    collected_tags = set()

    for disease in top_diseases:
        if disease in PRECAUTION_TAGS:
            for tag in PRECAUTION_TAGS[disease]:
                collected_tags.add(tag)

    return list(collected_tags)

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
    top3 = ranked[2][0]
    
    # ====================================================
    # ===== ATTACH PRECAUTION TAGS TO TOP-3 RESULTS ======
    # ====================================================

    top_diseases = [top1, top2, top3]

    precaution_tags = get_precaution_tags(top_diseases)
    

    # ====================================================
    # ===== STORE PRECAUTION TEXT FOR LATER EXPOSURE =====
    # ====================================================

    # Example: collect precaution texts if needed for API / logging
    # (does NOT affect training or evaluation)

    
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
