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

      let parsedResults = [];

      // ✅ Case 1: { top_3: [ { disease, probability } ] }
      if (Array.isArray(data.top_3)) {
        parsedResults = data.top_3;
      }

      // ✅ Case 2: { predictions: [ ["Disease", prob], ... ] }
      else if (Array.isArray(data.predictions)) {
        parsedResults = data.predictions.map(p => ({
          disease: p[0],
          probability: p[1]
        }));
      }

      // ✅ Case 3: { result: { Disease: prob, ... } }
      else if (typeof data.result === "object") {
        parsedResults = Object.entries(data.result).map(
          ([disease, probability]) => ({
            disease,
            probability
          })
        );
      }

      setResults(parsedResults);
      setScreen("results");

    } catch (err) {
      console.error(err);
      alert("Prediction failed");
      setScreen("symptoms");
    }
  }

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
              <h2>Prediction Results</h2>

              {results.map((r, i) => (
                <div key={i} className="result-card">
                  <strong>{r.disease}</strong>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{ width: `${Math.round(r.probability * 100)}%` }}
                    />
                  </div>
                  <small>{Math.round(r.probability * 100)}% confidence</small>
                </div>
              ))}

              <p className="warning">
                ⚠️ Informational only. Consult a doctor.
              </p>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

/* ================= CSS (UNCHANGED) ================= */
const css = `
.app {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg,#2563eb,#dc2626);
}

.card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,.15);
}

.symptom-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 15px;
}

.symptom-card {
  border: 1px solid #ddd;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  color: #111;
}

.symptom-card.active {
  background: #2563eb;
  color: white;
}

.bar {
  height: 8px;
  background: #eee;
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg,#2563eb,#dc2626);
}

.loader {
  font-size: 120px;
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  50% { transform: scale(1.15); }
}
`;
