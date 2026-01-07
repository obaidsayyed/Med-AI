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

    "Jaundice": {
    "fever":0.40,"high_fever":0.15,"chills":0.20,"fatigue":0.80,"weakness":0.75,
    "loss_of_appetite":0.70,"weight_loss":0.45,"headache":0.30,
    "body_ache":0.35,"joint_pain":0.20,"muscle_pain":0.30,"abdominal_pain":0.55,
    "nausea":0.50,"vomiting":0.35,"diarrhea":0.25,"constipation":0.20,
    "cough":0.05,"dry_cough":0.05,"sore_throat":0.05,"runny_nose":0.05,
    "shortness_of_breath":0.10,"chest_pain":0.10,
    "rash":0.10,"itching":0.65,"yellowing_skin_eyes":0.90,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.40,"sensitivity_to_light":0.20,"night_sweats":0.30
},

    "Gastroenteritis": {
    "fever":0.60,"high_fever":0.25,"chills":0.30,"fatigue":0.65,"weakness":0.60,
    "loss_of_appetite":0.70,"weight_loss":0.25,"headache":0.35,
    "body_ache":0.40,"joint_pain":0.20,"muscle_pain":0.35,"abdominal_pain":0.80,
    "nausea":0.75,"vomiting":0.65,"diarrhea":0.80,"constipation":0.05,
    "cough":0.05,"dry_cough":0.05,"sore_throat":0.05,"runny_nose":0.05,
    "shortness_of_breath":0.10,"chest_pain":0.10,
    "rash":0.10,"itching":0.10,"yellowing_skin_eyes":0.05,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.45,"sensitivity_to_light":0.20,"night_sweats":0.25
},


    "Food Poisoning": {
    "fever":0.55,"high_fever":0.20,"chills":0.25,"fatigue":0.65,"weakness":0.60,
    "loss_of_appetite":0.75,"weight_loss":0.20,"headache":0.30,
    "body_ache":0.35,"joint_pain":0.15,"muscle_pain":0.30,"abdominal_pain":0.85,
    "nausea":0.80,"vomiting":0.75,"diarrhea":0.85,"constipation":0.05,
    "cough":0.05,"dry_cough":0.05,"sore_throat":0.05,"runny_nose":0.05,
    "shortness_of_breath":0.10,"chest_pain":0.10,
    "rash":0.10,"itching":0.10,"yellowing_skin_eyes":0.00,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.50,"sensitivity_to_light":0.20,"night_sweats":0.25
},

    "Urinary Tract Infection": {
    "fever":0.60,"high_fever":0.25,"chills":0.30,"fatigue":0.60,"weakness":0.55,
    "loss_of_appetite":0.45,"weight_loss":0.15,"headache":0.30,
    "body_ache":0.35,"joint_pain":0.20,"muscle_pain":0.30,"abdominal_pain":0.60,
    "nausea":0.30,"vomiting":0.20,"diarrhea":0.10,"constipation":0.15,
    "cough":0.05,"dry_cough":0.05,"sore_throat":0.05,"runny_nose":0.05,
    "shortness_of_breath":0.10,"chest_pain":0.10,
    "rash":0.05,"itching":0.10,"yellowing_skin_eyes":0.00,
    "burning_urination":0.85,"frequent_urination":0.80,
    "dizziness":0.35,"sensitivity_to_light":0.15,"night_sweats":0.30
},

    "Sinusitis": {
    "fever":0.55,"high_fever":0.25,"chills":0.20,"fatigue":0.60,"weakness":0.50,
    "loss_of_appetite":0.40,"weight_loss":0.10,"headache":0.80,
    "body_ache":0.40,"joint_pain":0.20,"muscle_pain":0.35,"abdominal_pain":0.10,
    "nausea":0.20,"vomiting":0.10,"diarrhea":0.05,"constipation":0.05,
    "cough":0.40,"dry_cough":0.35,"sore_throat":0.45,"runny_nose":0.70,
    "shortness_of_breath":0.10,"chest_pain":0.10,
    "rash":0.05,"itching":0.10,"yellowing_skin_eyes":0.00,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.40,"sensitivity_to_light":0.45,"night_sweats":0.25
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

final_df.to_csv("symptom_disease_dataset2.csv", index=False)

print("Dataset generated successfully")
print("Shape:", final_df.shape)
