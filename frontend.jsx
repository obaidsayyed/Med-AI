import { useState, useEffect } from "react";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [results, setResults] = useState([]);

  /* FETCH SYMPTOMS */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/symptoms")
      .then(res => res.json())
      .then(data => setSymptoms(data.symptoms || []))
      .catch(console.error);
  }, []);

  /* SEND SYMPTOMS TO BACKEND */
  async function analyzeSymptoms() {
    setScreen("loading");

    // Filter to get only the active keys (which match dataset column names)
    const selected = Object.keys(selectedSymptoms).filter(
      s => selectedSymptoms[s]
    );

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selected })
      });

      const data = await res.json();

      // Expecting a fixed schema: { predictions: ["Disease Name 1", "Disease Name 2", ...] }
      // We take the raw list of names directly.
      setResults(data.predictions || []);
      setScreen("results");

    } catch (err) {
      console.error(err);
      // alert("Prediction failed"); // Removed alert to keep flow smoother, can uncomment if needed
      setScreen("symptoms");
    }
  }

  // Helper labels for the ranked output
  const rankLabels = ["Most likely", "Also possible", "Other consideration"];

  return (
    <>
      <style>{css}</style>

      <div className="app">
        <header className="topbar">
          <h1>Med-AI</h1>
        </header>

        <main className="main">
          {screen === "home" && (
            <section className="card hero">
              <div>
                <h2>Not feeling your best?</h2>
                <p>AI-powered symptom analysis.</p>
                <button className="primary" onClick={() => setScreen("symptoms")}>
                  Start Symptom Check
                </button>
              </div>
              <div className="brain">🧠</div>
            </section>
          )}

          {screen === "symptoms" && (
            <section className="card">
              <h2>Add Symptoms</h2>

              <div className="symptom-grid">
                {symptoms.map(s => (
                  <label
                    key={s}
                    className={`symptom-card ${selectedSymptoms[s] ? "active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedSymptoms[s]}
                      onChange={() =>
                        setSelectedSymptoms(prev => ({
                          ...prev,
                          [s]: !prev[s]
                        }))
                      }
                    />
                    {/* Display human-readable text, but we store/send the exact key 's' */}
                    <span>{s.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>

              <div className="actions">
                <button className="secondary" onClick={() => setScreen("home")}>
                  Back
                </button>
                <button className="primary" onClick={analyzeSymptoms}>
                  Analyze Symptoms
                </button>
              </div>
            </section>
          )}

          {screen === "loading" && (
            <section className="card loading">
              <div className="loader">🧠</div>
              <h2>Running ML model…</h2>
            </section>
          )}

          {screen === "results" && (
            <section className="card">
              <h2>Analysis Results</h2>

              <div className="results-list">
                {results.length > 0 ? (
                  results.slice(0, 3).map((diseaseName, i) => (
                    <div key={i} className="result-card">
                      <div className="rank-label">{rankLabels[i] || "Alternative"}</div>
                      <strong className="disease-name">{diseaseName}</strong>
                    </div>
                  ))
                ) : (
                  <p>No specific matching conditions found.</p>
                )}
              </div>

              <div className="disclaimer-box">
                <p className="warning">
                  <strong>⚠️ Medical Disclaimer:</strong> This tool is for informational and screening purposes only. 
                  It does not provide medical advice, diagnosis, or treatment. 
                  Always seek the advice of your physician or other qualified health provider.
                </p>
                <button className="secondary small" onClick={() => setScreen("symptoms")}>
                  Start Over
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

/* ================= CSS ================= */
const css = `
.app {
  width: 100vw;
  min-height: 100vh;
  background: linear-gradient(135deg, #2563eb, #dc2626);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}

.topbar {
  padding: 20px;
  color: white;
  text-align: center;
}

.main {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  margin-bottom: 20px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero h2 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.brain {
  font-size: 80px;
}

h2 {
  margin-top: 0;
}

/* Buttons */
button {
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.1s;
}

button:active {
  transform: scale(0.98);
}

button.primary {
  background: #2563eb;
  color: white;
}

button.secondary {
  background: #f3f4f6;
  color: #374151;
}

button.small {
  padding: 8px 16px;
  font-size: 0.9rem;
}

/* Symptoms */
.symptom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.symptom-card {
  border: 1px solid #e5e7eb;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  user-select: none;
}

.symptom-card:hover {
  border-color: #2563eb;
}

.symptom-card.active {
  background: #eff6ff;
  border-color: #2563eb;
  color: #1e40af;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

/* Loading */
.loading {
  text-align: center;
  padding: 60px;
}

.loader {
  font-size: 80px;
  animation: pulse 1.2s infinite;
  margin-bottom: 20px;
}

@keyframes pulse {
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* Results */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.result-card {
  background: #f8fafc;
  border-left: 5px solid #2563eb;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.result-card:nth-child(2) {
  border-left-color: #60a5fa;
}

.result-card:nth-child(3) {
  border-left-color: #93c5fd;
}

.rank-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 5px;
}

.disease-name {
  font-size: 1.25rem;
  color: #0f172a;
}

.disclaimer-box {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.warning {
  background: #ffffb1;
  color: #854d0e;
  padding: 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 15px;
  text-align: left;
}
`;
