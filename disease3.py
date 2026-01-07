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

    "Bronchitis": {
    "fever":0.60,"high_fever":0.30,"chills":0.25,"fatigue":0.65,"weakness":0.60,
    "loss_of_appetite":0.45,"weight_loss":0.20,"headache":0.35,
    "body_ache":0.40,"joint_pain":0.20,"muscle_pain":0.35,"abdominal_pain":0.10,
    "nausea":0.20,"vomiting":0.10,"diarrhea":0.05,"constipation":0.05,
    "cough":0.85,"dry_cough":0.65,"sore_throat":0.40,"runny_nose":0.30,
    "shortness_of_breath":0.50,"chest_pain":0.45,
    "rash":0.05,"itching":0.05,"yellowing_skin_eyes":0.00,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.30,"sensitivity_to_light":0.15,"night_sweats":0.30
},

    "Pneumonia": {
    "fever":0.85,"high_fever":0.65,"chills":0.60,"fatigue":0.80,"weakness":0.75,
    "loss_of_appetite":0.60,"weight_loss":0.30,"headache":0.40,
    "body_ache":0.50,"joint_pain":0.25,"muscle_pain":0.45,"abdominal_pain":0.20,
    "nausea":0.30,"vomiting":0.20,"diarrhea":0.15,"constipation":0.05,
    "cough":0.75,"dry_cough":0.50,"sore_throat":0.30,"runny_nose":0.20,
    "shortness_of_breath":0.70,"chest_pain":0.60,
    "rash":0.05,"itching":0.05,"yellowing_skin_eyes":0.00,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.45,"sensitivity_to_light":0.20,"night_sweats":0.55
},


    "Migraine": {
    "fever":0.10,"high_fever":0.05,"chills":0.05,"fatigue":0.70,"weakness":0.60,
    "loss_of_appetite":0.45,"weight_loss":0.10,"headache":0.95,
    "body_ache":0.25,"joint_pain":0.10,"muscle_pain":0.20,"abdominal_pain":0.20,
    "nausea":0.55,"vomiting":0.35,"diarrhea":0.10,"constipation":0.10,
    "cough":0.05,"dry_cough":0.05,"sore_throat":0.05,"runny_nose":0.05,
    "shortness_of_breath":0.05,"chest_pain":0.05,
    "rash":0.05,"itching":0.05,"yellowing_skin_eyes":0.00,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.70,"sensitivity_to_light":0.85,"night_sweats":0.20
},

    "Typhoid": {
    "fever":0.90,"high_fever":0.70,"chills":0.55,"fatigue":0.80,"weakness":0.75,
    "loss_of_appetite":0.70,"weight_loss":0.45,"headache":0.60,
    "body_ache":0.55,"joint_pain":0.30,"muscle_pain":0.45,"abdominal_pain":0.60,
    "nausea":0.45,"vomiting":0.35,"diarrhea":0.40,"constipation":0.35,
    "cough":0.15,"dry_cough":0.15,"sore_throat":0.10,"runny_nose":0.10,
    "shortness_of_breath":0.15,"chest_pain":0.15,
    "rash":0.20,"itching":0.15,"yellowing_skin_eyes":0.10,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.45,"sensitivity_to_light":0.30,"night_sweats":0.50
},

    "Chikungunya": {
    "fever":0.90,"high_fever":0.65,"chills":0.60,"fatigue":0.80,"weakness":0.75,
    "loss_of_appetite":0.60,"weight_loss":0.35,"headache":0.65,
    "body_ache":0.85,"joint_pain":0.95,"muscle_pain":0.75,"abdominal_pain":0.30,
    "nausea":0.40,"vomiting":0.30,"diarrhea":0.20,"constipation":0.05,
    "cough":0.10,"dry_cough":0.10,"sore_throat":0.10,"runny_nose":0.05,
    "shortness_of_breath":0.10,"chest_pain":0.15,
    "rash":0.45,"itching":0.40,"yellowing_skin_eyes":0.05,
    "burning_urination":0.00,"frequent_urination":0.00,
    "dizziness":0.50,"sensitivity_to_light":0.35,"night_sweats":0.45
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

final_df.to_csv("symptom_disease_dataset3.csv", index=False)

print("Dataset generated successfully")
print("Shape:", final_df.shape)
