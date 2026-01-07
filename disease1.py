import numpy as np
import pandas as pd

# ================= CONFIG =================
np.random.seed(42)
SAMPLES_PER_DISEASE = 400
TOLERANCE = 0.10

SYMPTOMS = [
    "fever", "high_fever", "chills", "fatigue", "weakness",
    "loss_of_appetite", "weight_loss", "headache",
    "body_ache", "joint_pain", "muscle_pain", "abdominal_pain",
    "nausea", "vomiting", "diarrhea", "constipation",
    "cough", "dry_cough", "sore_throat", "runny_nose",
    "shortness_of_breath", "chest_pain",
    "rash", "itching", "yellowing_skin_eyes",
    "burning_urination", "frequent_urination",
    "dizziness", "sensitivity_to_light", "night_sweats"
]

# ================= PROBABILITY TABLES =================
DISEASE_PROBS = {

    "Common Cold": {
        "fever":0.40,"high_fever":0.05,"chills":0.05,"fatigue":0.55,"weakness":0.30,
        "loss_of_appetite":0.25,"weight_loss":0.05,"headache":0.45,
        "body_ache":0.35,"joint_pain":0.10,"muscle_pain":0.10,"abdominal_pain":0.05,
        "nausea":0.05,"vomiting":0.03,"diarrhea":0.03,"constipation":0.02,
        "cough":0.70,"dry_cough":0.30,"sore_throat":0.75,"runny_nose":0.90,
        "shortness_of_breath":0.05,"chest_pain":0.03,
        "rash":0.02,"itching":0.02,"yellowing_skin_eyes":0.00,
        "burning_urination":0.00,"frequent_urination":0.00,
        "dizziness":0.15,"sensitivity_to_light":0.05,"night_sweats":0.05
    },

    "Viral Fever": {
        "fever":0.85,"high_fever":0.45,"chills":0.50,"fatigue":0.75,"weakness":0.65,
        "loss_of_appetite":0.55,"weight_loss":0.15,"headache":0.65,
        "body_ache":0.70,"joint_pain":0.35,"muscle_pain":0.55,"abdominal_pain":0.25,
        "nausea":0.30,"vomiting":0.20,"diarrhea":0.20,"constipation":0.05,
        "cough":0.35,"dry_cough":0.30,"sore_throat":0.40,"runny_nose":0.30,
        "shortness_of_breath":0.10,"chest_pain":0.10,
        "rash":0.15,"itching":0.10,"yellowing_skin_eyes":0.00,
        "burning_urination":0.00,"frequent_urination":0.00,
        "dizziness":0.40,"sensitivity_to_light":0.25,"night_sweats":0.35
    },

    "Influenza": {
        "fever":0.85,"high_fever":0.55,"chills":0.60,"fatigue":0.80,"weakness":0.70,
        "loss_of_appetite":0.60,"weight_loss":0.20,"headache":0.70,
        "body_ache":0.75,"joint_pain":0.30,"muscle_pain":0.65,"abdominal_pain":0.20,
        "nausea":0.25,"vomiting":0.15,"diarrhea":0.15,"constipation":0.05,
        "cough":0.55,"dry_cough":0.45,"sore_throat":0.50,"runny_nose":0.40,
        "shortness_of_breath":0.15,"chest_pain":0.15,
        "rash":0.05,"itching":0.05,"yellowing_skin_eyes":0.00,
        "burning_urination":0.00,"frequent_urination":0.00,
        "dizziness":0.35,"sensitivity_to_light":0.30,"night_sweats":0.40
    },

    "Dengue": {
        "fever":0.95,"high_fever":0.85,"chills":0.70,"fatigue":0.80,"weakness":0.75,
        "loss_of_appetite":0.60,"weight_loss":0.30,"headache":0.75,
        "body_ache":0.85,"joint_pain":0.80,"muscle_pain":0.70,"abdominal_pain":0.40,
        "nausea":0.50,"vomiting":0.40,"diarrhea":0.30,"constipation":0.05,
        "cough":0.10,"dry_cough":0.10,"sore_throat":0.10,"runny_nose":0.05,
        "shortness_of_breath":0.10,"chest_pain":0.15,
        "rash":0.60,"itching":0.50,"yellowing_skin_eyes":0.05,
        "burning_urination":0.00,"frequent_urination":0.00,
        "dizziness":0.50,"sensitivity_to_light":0.45,"night_sweats":0.50
    },

    "Malaria": {
        "fever":0.95,"high_fever":0.80,"chills":0.85,"fatigue":0.75,"weakness":0.70,
        "loss_of_appetite":0.55,"weight_loss":0.25,"headache":0.65,
        "body_ache":0.60,"joint_pain":0.35,"muscle_pain":0.55,"abdominal_pain":0.30,
        "nausea":0.35,"vomiting":0.30,"diarrhea":0.20,"constipation":0.05,
        "cough":0.10,"dry_cough":0.10,"sore_throat":0.05,"runny_nose":0.05,
        "shortness_of_breath":0.15,"chest_pain":0.10,
        "rash":0.05,"itching":0.05,"yellowing_skin_eyes":0.10,
        "burning_urination":0.00,"frequent_urination":0.00,
        "dizziness":0.45,"sensitivity_to_light":0.30,"night_sweats":0.65
    }
}

# ================= GENERATION FUNCTION =================
def generate_disease(disease, probs):
    while True:
        rows = []
        for _ in range(SAMPLES_PER_DISEASE):
            row = {}
            for s in SYMPTOMS:
                p = probs.get(s, 0)
                row[s] = int(np.random.rand() < p)

            # Fever hierarchy
            if row["high_fever"] == 1:
                row["fever"] = 1

            row["disease"] = disease
            rows.append(row)

        df = pd.DataFrame(rows)

        # Bounds validation
        valid = True
        for s, p in probs.items():
            obs = df[s].mean()
            if not (max(0,p-TOLERANCE) <= obs <= min(1,p+TOLERANCE)):
                valid = False
                break

        if valid:
            return df

# ================= RUN =================
all_data = []

for disease, probs in DISEASE_PROBS.items():
    print(f"Generating {disease}...")
    all_data.append(generate_disease(disease, probs))

final_df = pd.concat(all_data).sample(frac=1).reset_index(drop=True)

final_df.to_csv("symptom_disease_dataset.csv", index=False)

print("Dataset generated successfully")
print("Shape:", final_df.shape)
