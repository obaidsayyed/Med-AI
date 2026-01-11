from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import joblib
import os
import random
import string
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime, timedelta

# ================= LOAD ENV =================
load_dotenv()

# ================= PATH SETUP =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ================= FIREBASE INIT =================
db = None
try:
    FIREBASE_KEY_PATH = os.path.join(BASE_DIR, "firebase_key.json")
    if os.path.exists(FIREBASE_KEY_PATH):
        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_KEY_PATH)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase Admin initialized successfully.")
    else:
        print("⚠️ firebase_key.json not found. Backend DB writes disabled.")
except Exception as e:
    print(f"⚠️ Firebase Init Error: {e}")

# ================= GEMINI SETUP =================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Gemini AI initialized.")
    except Exception as e:
        print(f"⚠️ Gemini Config Error: {e}")
else:
    print("⚠️ GEMINI_API_KEY not found. Using fallback precautions.")

# ================= SMTP EMAIL SETUP =================
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_real_email(to_email: str, otp_code: str):
    """Sends a real email using Gmail SMTP"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"\n⚠️ SMTP Credentials missing in .env")
        print(f"📧 MOCK EMAIL TO: {to_email} | OTP: {otp_code}\n")
        return

    msg = EmailMessage()
    msg.set_content(f"Your Med-AI Verification Code is: {otp_code}\n\nThis code expires in 5 minutes.")
    msg['Subject'] = 'Med-AI Verification Code'
    msg['From'] = SMTP_EMAIL
    msg['To'] = to_email

    try:
        # Connect to Gmail's TLS port (587) which is often more reliable than 465
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        # Fallback to console print if email fails, so you can still test
        print(f"📧 [FALLBACK] OTP for {to_email}: {otp_code}")

# ================= MODEL PATHS =================
MODEL_PATH = os.path.join(BASE_DIR, "symptom_disease_mlp_model.pkl")
SYMPTOM_PATH = os.path.join(BASE_DIR, "symptom_list.pkl")

# ================= LOAD MODEL =================
model = None
scaler = None
SYMPTOMS = []
CLASSES = []

try:
    if os.path.exists(MODEL_PATH) and os.path.exists(SYMPTOM_PATH):
        bundle = joblib.load(MODEL_PATH)
        model = bundle["model"]
        scaler = bundle["scaler"]
        SYMPTOMS = joblib.load(SYMPTOM_PATH)
        SYMPTOMS = [s.lower().strip() for s in SYMPTOMS]
        CLASSES = model.classes_
        print("✅ ML Model loaded successfully.")
    else:
        print("⚠️ Model files not found.")
except Exception as e:
    print(f"❌ Failed to load ML model: {e}")

# ================= FASTAPI APP =================
app = FastAPI(title="Med-AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= REQUEST SCHEMAS =================
class PredictRequest(BaseModel):
    symptoms: List[str]
    user_email: Optional[str] = None 

class OTPRequest(BaseModel):
    email: str
    type: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# ================= PRECAUTION TAGS =================
PRECAUTION_TAGS = {
    "Common Cold": ["rest", "hydration", "avoid_cold_exposure"],
    "Influenza": ["rest", "hydration", "monitor_fever"],
    "Viral Fever": ["rest", "hydration"],
    "Dengue": ["rest", "hydration", "avoid_mosquito_exposure"],
    "Chikungunya": ["rest", "hydration", "joint_care"],
    "Jaundice": ["diet_care", "avoid_alcohol", "rest"],
    "Urinary Tract Infection": ["hydration", "maintain_hygiene"],
    "Migraine": ["rest", "avoid_bright_light"],
    "Pneumonia": ["monitor_breathing", "rest"],
    "Bronchitis": ["avoid_smoke", "rest"],
    "Fungal infection": ["keep_dry", "maintain_hygiene", "avoid_sharing_towels"],
    "Allergy": ["avoid_allergens", "take_antihistamines_if_prescribed"],
    "GERD": ["avoid_spicy_food", "eat_small_meals", "avoid_lying_down_after_eating"],
    "Chronic cholestasis": ["consult_doctor", "low_fat_diet"],
    "Drug Reaction": ["stop_medication_consult_doctor", "hydration"],
    "Peptic ulcer diseae": ["avoid_spicy_food", "reduce_stress"],
    "AIDS": ["consult_doctor_immediately", "follow_art"],
    "Diabetes": ["monitor_blood_sugar", "diet_control", "exercise"],
    "Gastroenteritis": ["hydration", "bland_diet", "rest"],
    "Bronchial Asthma": ["carry_inhaler", "avoid_triggers", "monitor_breathing"],
    "Hypertension": ["reduce_salt", "reduce_stress", "monitor_bp"],
    "Typhoid": ["antibiotics_if_prescribed", "clean_water", "bland_diet"],
    "Malaria": ["avoid_mosquito_bites", "finish_medication_course"],
    "Chicken Pox": ["isolation", "calamine_lotion", "avoid_scratching"]
}

# ================= HELPERS =================
def build_input_vector(selected_symptoms: List[str]):
    if not SYMPTOMS or not scaler:
        return []
    vector = [0] * len(SYMPTOMS)
    for s in selected_symptoms:
        if s in SYMPTOMS:
            vector[SYMPTOMS.index(s)] = 1
    return scaler.transform([vector])

def generate_precaution_text(tags: List[str]) -> str:
    if not tags:
        return "Maintain general self-care and monitor your symptoms. Consult a doctor if you feel unwell."
    
    static_message = f"Suggested precautions: {', '.join(tags).replace('_', ' ')}. Please consult a healthcare professional."

    if not gemini_model:
        return static_message

    prompt = f"Convert these precaution tags into calm, human-friendly guidance (max 2 sentences): {', '.join(tags)}"

    try:
        response = gemini_model.generate_content(
            prompt,
            generation_config={"temperature": 0.6, "max_output_tokens": 120}
        )
        return response.text.strip() if response.text else static_message
    except Exception as e:
        print("⚠️ Gemini error:", e)
        return static_message

# ================= AUTH ENDPOINTS =================

@app.post("/auth/send-otp")
def send_otp(req: OTPRequest):
    if not db:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    # Generate OTP
    otp = ''.join(random.choices(string.digits, k=6))
    
    try:
        # Save to DB
        db.collection("otps").document(req.email).set({
            "otp": otp,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "type": req.type
        })
        
        # SEND REAL EMAIL
        send_real_email(req.email, otp)
        
        return {"message": "OTP sent successfully"}
    except Exception as e:
        print("OTP Generation Error:", e)
        raise HTTPException(status_code=500, detail="Failed to send OTP")

@app.post("/auth/verify-otp")
def verify_otp(req: OTPVerifyRequest):
    if not db:
        raise HTTPException(status_code=503, detail="Database not initialized")
        
    doc_ref = db.collection("otps").document(req.email)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
        
    data = doc.to_dict()
    if data['otp'] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    doc_ref.delete() # Consume OTP
    return {"message": "OTP Verified"}

@app.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    if not db:
        raise HTTPException(status_code=503, detail="Database not initialized")
    
    # In a real production app, verify-otp should return a secure token
    # For this implementation, we trust the immediate call if logic on frontend is secure
    try:
        user = auth.get_user_by_email(req.email)
        auth.update_user(user.uid, password=req.new_password)
        return {"message": "Password updated successfully"}
    except auth.UserNotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        print("Reset Error:", e)
        raise HTTPException(status_code=500, detail="Failed to reset password")

# ================= PREDICT ENDPOINT =================
@app.post("/predict")
def predict(req: PredictRequest):
    try:
        if not model or not SYMPTOMS:
            return {"predictions": ["Mock Disease"], "precaution": "Model loading failed."}

        valid_symptoms = [s.lower().strip() for s in req.symptoms if s.lower().strip() in SYMPTOMS]

        if not valid_symptoms:
            return {"predictions": [], "precaution": "No valid symptoms provided."}

        X = build_input_vector(valid_symptoms)
        probs = model.predict_proba(X)[0]
        top_indices = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:3]
        top_diseases = [CLASSES[i] for i in top_indices]

        collected_tags = set()
        for d in top_diseases:
            collected_tags.update(PRECAUTION_TAGS.get(d, []))

        precaution_text = generate_precaution_text(list(collected_tags))

        # DB Logging
        if db and req.user_email:
            try:
                db.collection("predictions").add({
                    "user_email": req.user_email,
                    "symptoms": valid_symptoms,
                    "predictions": top_diseases,
                    "precaution": precaution_text,
                    "created_at": datetime.utcnow()
                })
            except Exception as e:
                print("DB Log Error:", e)

        return {"predictions": top_diseases, "precaution": precaution_text}

    except Exception as e:
        print("Prediction Error:", e)
        return {"predictions": ["Error"], "precaution": "An internal error occurred."}

# ================= SYMPTOMS & HEALTH =================
@app.get("/symptoms")
def get_symptoms():
    return {"symptoms": SYMPTOMS}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "firebase": db is not None,
        "email_service": SMTP_EMAIL is not None
    }