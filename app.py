import streamlit as st
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import confusion_matrix
import google.generativeai as genai
import os
from dotenv import load_dotenv

# -------------------- Phase 1: Gemini Setup --------------------
# Load API key from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("❌ No API key found. Please set GEMINI_API_KEY in your .env file.")

genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# -------------------- Phase 2: Load Dataset and Train Models --------------------
@st.cache_resource  # cache so retraining doesn't happen on every run
def train_model():
    df = pd.read_excel(r"Dataset.xlsx")  # Ensure Dataset.xlsx exists
    df = df.fillna(0)

    X = df.drop(columns=["Disease"])
    y = df["Disease"]

    mlpc = MLPClassifier(
        hidden_layer_sizes=(10, 10),
        max_iter=500,
        alpha=1e-2,
        solver='sgd',
        tol=1e-3,
        random_state=18,
        learning_rate_init=0.001
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=254, stratify=y
    )
    mlpc.fit(X_train, y_train)

    return mlpc, list(X.columns)

mlpc, symptoms_list = train_model()

# -------------------- Phase 3: Streamlit UI --------------------
# Custom CSS for modern medical look
st.markdown("""
    <style>
    body {
        background-color: #f5f9fc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        border-radius: 8px;
        padding: 15px 30px;
        font-size: 20px;
    }
    /* Darker result box for better visibility */
    .result-box {
        background-color: #1e2a38;  /* Dark navy */
        color: #ffffff;             /* White text */
        padding: 20px;
        border-radius: 10px;
        margin-top: 20px;
        font-size: 20px;
    }
    </style>
""", unsafe_allow_html=True)

# Title and description
st.title("🩺 Modern AI Health Assistant")
st.write("Welcome! Get a fast symptom-based disease prediction powered by AI + Gemini.")

# Symptom checklist
st.subheader("📝 Select Your Symptoms")
user_symptoms = {}
for symptom in symptoms_list:
    user_symptoms[symptom] = st.checkbox(symptom, value=False)

if st.button("🚀 Get Prediction"):
    # Convert input into DataFrame
    symptom_vector = [1 if user_symptoms[s] else 0 for s in symptoms_list]
    user_df = pd.DataFrame([symptom_vector], columns=symptoms_list)

    # NN Prediction
    nn_pred = mlpc.predict(user_df)[0]

    # Gemini explanation
    symptom_text = ", ".join([s for s, val in user_symptoms.items() if val])
    prompt = (
        f"Symptoms: {symptom_text if symptom_text else 'No symptoms selected'}\n"
        f"The model predicts: {nn_pred}\n"
        f"Write a short, friendly summary (2-3 lines) explaining what the user may be suffering from "
        f"and reminding them to consult a doctor."
    )
    gemini_response = gemini_model.generate_content(prompt)

    # Display results
    st.markdown(f"""
    <div class="result-box">
        ✅ <b>Prediction:</b> <span style="color: #007bff;">{nn_pred}</span><br><br>
        💡 {gemini_response.text}<br><br>
        ⚠️ <i>This is not medical advice. Please consult a doctor.</i>
    </div>
    """, unsafe_allow_html=True)

#python -m streamlit run app.py
