# Med-AI

Project Summary Report: AI Health Assistant with Gemini

Project Overview:
This project is an AI-powered health assistant that predicts possible diseases based on user-input symptoms. It integrates a Neural Network (MLPClassifier) for disease prediction and Google Gemini for generating friendly, informative summaries of predictions.

Key Features:

Symptom-based disease prediction using a trained Neural Network.

Dynamic, interactive user interface built with Streamlit.

Gemini AI integration to generate human-friendly explanations.

Real-time feedback with a visually appealing UI (modern medical look).

Handles missing dataset values automatically.

Dataset:

Format: Excel (Dataset.xlsx)

Features: 15 symptoms as input features

Target: Disease labels (Malaria, Dengue, Food Poisoning, Jaundice)

Preprocessing: Missing values filled with 0

Model Details:

Model: MLPClassifier (Neural Network)

Architecture: 2 hidden layers, 10 nodes each

Max iterations: 500

Solver: SGD, Learning rate: 0.001

Training/Test split: 70/30

Performance:

Training Accuracy: High (dependent on dataset quality)

Test Accuracy: Validated using confusion matrix

User Interaction:

Users select symptoms via checkboxes in the Streamlit app.

NN predicts disease based on selected symptoms.

Gemini generates a 2–3 line friendly explanation and advice to consult a doctor.

Real-time display with clear visual formatting (dark result box for visibility).

Security:

Gemini API key is stored in a .env file to avoid exposing credentials on GitHub.

.env is added to .gitignore to prevent accidental sharing.

Impact and Benefits:

Provides rapid preliminary disease assessment based on symptoms.

Improves accessibility to AI-assisted health advice.

Educates users while emphasizing consultation with medical professionals.

Modular design allows easy extension to more diseases or integration with other AI models.

Tools & Technologies:

Python, pandas, scikit-learn, Streamlit

Google Gemini API

.env for secure API key management

Conclusion:
This project demonstrates a practical integration of classical ML techniques with modern generative AI to provide a safe, interactive, and user-friendly health assistant. It emphasizes data security, model accuracy, and clear communication with the user.
