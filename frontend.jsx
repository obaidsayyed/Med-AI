import React, { useState, useEffect } from "react";

/**
 * MED-AI: ZERO-CONFLICT VERSION
 * * WHY THIS WORKS:
 * 1. Fixed SVG Sizes: Prevents icons from becoming "huge".
 * 2. Scoped CSS: The styles only apply to this app, ignoring your local index.css.
 * 3. CSS Reset: Resets margins and paddings that usually break local layouts.
 */

const Icons = {
  Pulse: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  Brain: ({ size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5V10"/><path d="M14.5 2a2.5 2.5 0 0 0-2.5 2.5V10"/><path d="M20 9.5A2.5 2.5 0 0 0 17.5 7H17V4.5A2.5 2.5 0 0 0 14.5 2h-5A2.5 2.5 0 0 0 7 4.5V7h-.5A2.5 2.5 0 0 0 4 9.5v5A2.5 2.5 0 0 0 6.5 17H7v2.5A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5V17h.5a2.5 2.5 0 0 0 2.5-2.5v-5z"/><path d="M12 10v4"/><path d="M8 14h8"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  )
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const fallbackSymptoms = ["itching", "skin_rash", "shivering", "joint_pain", "stomach_pain", "fatigue", "cough", "high_fever"];

  useEffect(() => {
    fetch("http://127.0.0.1:8000/symptoms")
      .then(res => res.json())
      .then(data => setSymptoms(data.symptoms || fallbackSymptoms))
      .catch(() => setSymptoms(fallbackSymptoms));
  }, []);

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev => ({ ...prev, [s]: !prev[s] }));
  };

  async function analyzeSymptoms() {
    setError(null);
    const selected = Object.keys(selectedSymptoms).filter(s => selectedSymptoms[s]);
    if (selected.length === 0) return;
    setScreen("loading");
    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selected })
      });
      const data = await res.json();
      setResults(data.predictions || []);
      setScreen("results");
    } catch (err) {
      setError("Engine connection failed.");
      setScreen("symptoms");
    }
  }

  const filteredSymptoms = symptoms.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedCount = Object.values(selectedSymptoms).filter(Boolean).length;

  return (
    <div className="med-ai-root">
      <style>{css}</style>
      
      <div className="bg-glow-1"></div>
      <div className="bg-glow-2"></div>

      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand" onClick={() => setScreen("home")}>
            <div className="icon-box"><Icons.Pulse /></div>
            <div className="brand-text">
              <span className="main-logo">MED-AI</span>
              <span className="sub-logo">NEURAL LINK</span>
            </div>
          </div>
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>LINK ACTIVE</span>
          </div>
        </div>
      </nav>

      <main className="main-stage">
        {screen === "home" && (
          <div className="hero-section anim-slide-up">
            <div className="hero-content">
              <div className="mini-badge">SECURE CLINICAL NODE</div>
              <h1>Beyond <br/>Diagnosis<span className="accent">.</span></h1>
              <p>Identify medical patterns with precision using our advanced neural correlation engine.</p>
              <button className="primary-button" onClick={() => setScreen("symptoms")}>
                Start Assessment
              </button>
            </div>
            <div className="hero-graphic">
              <div className="brain-shield">
                <Icons.Brain size={160} />
              </div>
            </div>
          </div>
        )}

        {screen === "symptoms" && (
          <div className="symptoms-section anim-fade">
            <div className="header-row">
              <h2>Select Markers</h2>
              <div className="search-wrapper">
                <Icons.Search />
                <input 
                  placeholder="Filter biomarkers..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="biomarker-grid">
              {filteredSymptoms.map(s => (
                <div 
                  key={s} 
                  className={`marker-card ${selectedSymptoms[s] ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(s)}
                >
                  <div className="dot"></div>
                  <span>{s.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>

            <div className="floating-dock">
              <div className="dock-stats">
                <span className="count">{selectedCount}</span>
                <span className="label">Markers</span>
              </div>
              <div className="dock-btns">
                <button className="btn-secondary" onClick={() => setScreen("home")}>Discard</button>
                <button className="btn-action" onClick={analyzeSymptoms} disabled={selectedCount === 0}>
                  Analyze Data
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "loading" && (
          <div className="loading-state anim-fade">
            <div className="neural-spinner">
              <div className="ring"></div>
              <Icons.Pulse />
            </div>
            <h3>Cross-referencing database...</h3>
          </div>
        )}

        {screen === "results" && (
          <div className="results-section anim-slide-up">
            <div className="results-intro">
              <div className="mini-badge">ANALYSIS COMPLETE</div>
              <h2>Screening Report</h2>
            </div>

            <div className="results-grid">
              <div className="primary-result">
                <span className="tier-tag">PRIMARY INDICATION</span>
                <h3>{results[0] || "Undetermined"}</h3>
                <div className="divider"></div>
                <p>Pattern correlation suggests high alignment with clinical signatures for this condition.</p>
              </div>
              
              <div className="side-results">
                {results.slice(1, 3).map((r, i) => (
                  <div key={i} className="mini-result">
                    <span className="tier-tag">ALTERNATIVE {i + 1}</span>
                    <h4>{r}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="medical-disclaimer">
              <div className="disclaimer-header">⚠️ MEDICAL SAFETY PROTOCOL</div>
              <p>Informational screening only. Not a medical diagnosis. For emergencies, contact local health services immediately.</p>
              <button className="outline-btn" onClick={() => setScreen("symptoms")}>New Check</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const css = `
/* CSS RESET FOR THIS APP */
.med-ai-root {
  all: unset;
  display: block;
  background: #0F172A;
  color: #F8FAFC;
  min-height: 100vh;
  width: 100vw;
  font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden;
  position: relative;
  box-sizing: border-box;
}

.med-ai-root * { box-sizing: border-box; }

/* Background Glimmer */
.bg-glow-1 { position: fixed; top: -10%; left: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%); pointer-events: none; }
.bg-glow-2 { position: fixed; bottom: -10%; right: -10%; width: 50%; height: 50%; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%); pointer-events: none; }

/* Navbar */
.top-nav { position: fixed; top: 20px; width: 100%; z-index: 1000; display: flex; justify-content: center; }
.nav-container { width: 90%; max-width: 1000px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.icon-box { background: #2DD4BF; padding: 8px; border-radius: 10px; color: #0F172A; display: flex; }
.brand-text { display: flex; flex-direction: column; line-height: 1; }
.main-logo { font-weight: 900; font-size: 1.2rem; }
.sub-logo { font-size: 9px; font-weight: 800; color: #2DD4BF; letter-spacing: 2px; }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; color: #94A3B8; }
.pulse-dot { width: 6px; height: 6px; background: #2DD4BF; border-radius: 50%; animation: pulse 2s infinite; }

/* Content Area */
.main-stage { max-width: 1000px; margin: 0 auto; padding: 120px 24px 60px 24px; }

/* Hero Section */
.hero-section { display: flex; align-items: center; gap: 40px; padding: 40px 0; }
.hero-content { flex: 1.2; }
.mini-badge { display: inline-block; padding: 4px 12px; background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 100px; color: #2DD4BF; font-size: 10px; font-weight: 800; margin-bottom: 20px; }
h1 { font-size: clamp(3rem, 8vw, 5rem); font-weight: 900; line-height: 0.95; margin: 0 0 20px 0; }
.accent { color: #2DD4BF; }
.hero-content p { color: #94A3B8; font-size: 1.2rem; margin: 0 0 40px 0; max-width: 440px; }
.hero-graphic { flex: 0.8; display: flex; justify-content: center; }
.brain-shield { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.05); padding: 50px; border-radius: 50px; transform: rotate(5deg); animation: float 6s ease-in-out infinite; color: #2DD4BF; }

/* Buttons */
.primary-button { background: #FFF; color: #0F172A; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; }
.primary-button:hover { background: #2DD4BF; transform: translateY(-3px); }

/* Symptoms Grid */
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
h2 { font-size: 2rem; font-weight: 900; text-transform: uppercase; margin: 0; font-style: italic; }
.search-wrapper { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 14px; display: flex; align-items: center; gap: 12px; width: 300px; }
.search-wrapper input { background: transparent; border: none; color: #FFF; outline: none; width: 100%; font-weight: 600; }

.biomarker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 50vh; overflow-y: auto; padding-right: 10px; }
.marker-card { background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 18px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; }
.marker-card:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }
.marker-card.selected { background: #2DD4BF; color: #0F172A; border-color: #2DD4BF; }
.marker-card .dot { width: 8px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 50%; }
.marker-card.selected .dot { background: #0F172A; }
.marker-card span { font-weight: 800; text-transform: capitalize; font-size: 0.9rem; }

/* Floating Dock */
.floating-dock { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 800px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); padding: 16px 32px; border-radius: 30px; display: flex; justify-content: space-between; align-items: center; z-index: 1001; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.dock-stats { display: flex; align-items: baseline; gap: 10px; }
.dock-stats .count { font-size: 1.8rem; font-weight: 900; color: #2DD4BF; }
.dock-stats .label { font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }
.dock-btns { display: flex; gap: 12px; }
.btn-secondary { background: transparent; border: none; color: #94A3B8; font-weight: 700; cursor: pointer; }
.btn-action { background: #2DD4BF; color: #0F172A; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 900; cursor: pointer; }

/* Results */
.results-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin: 40px 0; }
.primary-result { background: rgba(30, 41, 59, 0.5); border: 2px solid #2DD4BF; padding: 40px; border-radius: 40px; }
.tier-tag { font-size: 10px; font-weight: 800; color: #2DD4BF; letter-spacing: 2px; margin-bottom: 15px; display: block; }
.primary-result h3 { font-size: 3.5rem; font-weight: 900; line-height: 1; margin: 0 0 25px 0; text-transform: uppercase; font-style: italic; }
.divider { height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 25px; }
.mini-result { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 24px; margin-bottom: 12px; }
.mini-result h4 { font-size: 1.2rem; font-weight: 900; text-transform: uppercase; margin: 0; }

.medical-disclaimer { background: #000; border: 1px solid rgba(251, 113, 133, 0.3); padding: 40px; border-radius: 30px; margin-top: 40px; }
.disclaimer-header { font-weight: 900; color: #FB7185; margin-bottom: 10px; }
.outline-btn { background: transparent; border: 1px solid #94A3B8; color: #94A3B8; padding: 10px 20px; border-radius: 10px; margin-top: 20px; cursor: pointer; }

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; }
.neural-spinner { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; color: #2DD4BF; margin-bottom: 24px; }
.ring { position: absolute; width: 100%; height: 100%; border: 3px solid rgba(45, 212, 191, 0.1); border-top-color: #2DD4BF; border-radius: 50%; animation: spin 1s linear infinite; }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes float { 0%, 100% { transform: translateY(0) rotate(5deg); } 50% { transform: translateY(-15px) rotate(8deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.anim-fade { animation: fadeIn 0.6s ease; }
.anim-slide-up { animation: slideUp 0.6s ease; }

.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
`;
