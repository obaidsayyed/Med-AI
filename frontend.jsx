import React, { useState, useEffect } from "react";

/**
 * MED-AI: PERSONALIZED EDITION (V4.2)
 * - Added: Integrated BMI Calculator with color-coded status
 * - Added: Profile Photo Support
 * - Enhanced: Vibrant Button Styling
 * - Added: Clinical Profile Persistence
 */

const Icons = {
  Pulse: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Brain: ({ size = 120 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2a2.5 2.5 0 0 1 2.5 2.5V10"/><path d="M14.5 2a2.5 2.5 0 0 0-2.5 2.5V10"/><path d="M20 9.5A2.5 2.5 0 0 0 17.5 7H17V4.5A2.5 2.5 0 0 0 14.5 2h-5A2.5 2.5 0 0 0 7 4.5V7h-.5A2.5 2.5 0 0 0 4 9.5v5A2.5 2.5 0 0 0 6.5 17H7v2.5A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5V17h.5a2.5 2.5 0 0 0 2.5-2.5v-5z"/><path d="M12 10v4"/><path d="M8 14h8"/></svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
  ),
  Download: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
  ),
  Scale: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16c0 1.1-1.1 2-2.5 2s-2.5-0.9-2.5-2 1.1-2 2.5-2 2.5 0.9 2.5 2z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7l2 2"/><path d="M19 9l2-2"/><path d="M3 7c0 6 4.5 11 9 11s9-5 9-11"/></svg>
  )
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: "", age: "", weight: "", height: "",
    email: "", phone: "", city: "", state: "", country: "",
    photo: ""
  });

  const fallbackSymptoms = ["itching", "skin_rash", "shivering", "joint_pain", "stomach_pain", "fatigue", "cough", "high_fever"];

  useEffect(() => {
    const savedHistory = localStorage.getItem("med_ai_history");
    const savedProfile = localStorage.getItem("med_ai_profile");
    
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    fetch("http://127.0.0.1:8000/symptoms")
      .then(res => res.json())
      .then(data => setSymptoms(data.symptoms || fallbackSymptoms))
      .catch(() => setSymptoms(fallbackSymptoms));
  }, []);

  // BMI Calculation Logic
  const calculateBMI = () => {
    const w = parseFloat(userProfile.weight);
    const h = parseFloat(userProfile.height) / 100; // Convert cm to meters
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return null;
  };

  const getBMIInfo = (bmi) => {
    if (!bmi) return { label: "N/A", color: "#94A3B8" };
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: "Underweight", color: "#EAB308", class: "bmi-yellow" };
    if (val >= 18.5 && val <= 24.9) return { label: "Normal / Safe", color: "#22C55E", class: "bmi-green" };
    return { label: "Overweight", color: "#000000", class: "bmi-black" };
  };

  const bmiValue = calculateBMI();
  const bmiInfo = getBMIInfo(bmiValue);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem("med_ai_profile", JSON.stringify(userProfile));
    setScreen("symptoms");
  };

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev => ({ ...prev, [s]: !prev[s] }));
  };

  const startAssessment = () => {
    if (!userProfile.name) {
      setScreen("login");
    } else {
      setScreen("symptoms");
    }
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
      const predictions = data.predictions || [];
      
      const newEntry = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topMatch: predictions[0],
        symptoms: selected
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("med_ai_history", JSON.stringify(updatedHistory));

      setResults(predictions);
      setScreen("results");
    } catch (err) {
      setError("Engine connection failed.");
      setScreen("symptoms");
    }
  }

  const exportReport = () => {
    const text = `
MED-AI CLINICAL SCREENING REPORT
================================
DATE: ${new Date().toLocaleString()}

PATIENT PROFILE:
----------------
Name:    ${userProfile.name}
Age:     ${userProfile.age} yrs
Weight:  ${userProfile.weight} kg
Height:  ${userProfile.height} cm
BMI:     ${bmiValue} (${bmiInfo.label})
Email:   ${userProfile.email}
Phone:   ${userProfile.phone}
Address: ${userProfile.city}, ${userProfile.state}, ${userProfile.country}

ANALYSIS RESULTS:
-----------------
Primary Indication: ${results[0]}
Secondary Marker:   ${results[1] || 'None identified'}
Further Correlation: ${results[2] || 'None identified'}

SYMPTOMS ANALYZED:
${Object.keys(selectedSymptoms).filter(s => selectedSymptoms[s]).map(s => `- ${s.replace(/_/g, " ")}`).join("\n")}

DISCLAIMER: 
This report is informational and generated by a machine learning model. 
It is not a medical diagnosis. Consult a healthcare professional immediately.
================================
    `;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `MedAI_Report_${userProfile.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const filteredSymptoms = symptoms.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="med-ai-root">
      <style>{css}</style>
      
      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand" onClick={() => setScreen("home")}>
            <div className="icon-box"><Icons.Pulse /></div>
            <span className="main-logo">MED-AI</span>
          </div>
          <div className="user-indicator" onClick={() => setScreen("login")}>
            {userProfile.photo ? (
              <img src={userProfile.photo} alt="Profile" className="nav-profile-img" />
            ) : (
              <Icons.User />
            )}
            <span>{userProfile.name || "Guest Mode"}</span>
          </div>
        </div>
      </nav>

      <main className="main-stage">
        
        {/* HOME SCREEN */}
        {screen === "home" && (
          <div className="screen-home anim-fade">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="mini-badge">NEURAL VERSION 4.2</div>
                <h1>Advanced <br/>Personal Analysis<span>.</span></h1>
                <p>Personalized medical pattern identifying engine. Enter your profile to begin clinical correlation.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={startAssessment}>
                    {userProfile.name ? "Start New Assessment" : "Setup Profile to Start"}
                  </button>
                </div>
              </div>
              
              <div className="history-sidebar">
                <div className="sidebar-header"><Icons.History /><span>Assessment History</span></div>
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <div key={idx} className="history-item">
                      <div className="history-date">{item.date} • {item.time}</div>
                      <div className="history-result">{item.topMatch}</div>
                    </div>
                  ))
                ) : (
                  <div className="history-empty">No clinical history recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOGIN / PROFILE SCREEN */}
        {screen === "login" && (
          <div className="login-section anim-fade">
            <div className="form-header">
              <h2>Clinical Profile</h2>
              <p>Please provide your basic information to personalize your screening.</p>
            </div>
            <form className="profile-form" onSubmit={saveProfile}>
              <div className="photo-upload-container">
                <label className="photo-label">
                  <div className="photo-preview-box">
                    {userProfile.photo ? (
                      <img src={userProfile.photo} alt="Preview" className="photo-preview" />
                    ) : (
                      <div className="photo-placeholder">
                        <Icons.Camera />
                        <span>Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                </label>
              </div>

              {/* BMI Live Preview Box */}
              {bmiValue && (
                <div className={`bmi-preview-box ${bmiInfo.class}`}>
                  <div className="bmi-header">
                    <Icons.Scale />
                    <span>Calculated BMI</span>
                  </div>
                  <div className="bmi-stats">
                    <span className="bmi-num">{bmiValue}</span>
                    <span className="bmi-status">{bmiInfo.label}</span>
                  </div>
                </div>
              )}

              <div className="form-row full">
                <label>Full Name</label>
                <input required name="name" value={userProfile.name} onChange={handleProfileChange} placeholder="John Doe" />
              </div>
              <div className="form-row full">
                <label>Email Address</label>
                <input required type="email" name="email" value={userProfile.email} onChange={handleProfileChange} placeholder="john@example.com" />
              </div>
              <div className="form-group-3">
                <div className="form-row">
                  <label>Age</label>
                  <input required type="number" name="age" value={userProfile.age} onChange={handleProfileChange} placeholder="Yrs" />
                </div>
                <div className="form-row">
                  <label>Weight (kg)</label>
                  <input required type="number" name="weight" value={userProfile.weight} onChange={handleProfileChange} placeholder="Kg" />
                </div>
                <div className="form-row">
                  <label>Height (cm)</label>
                  <input required type="number" name="height" value={userProfile.height} onChange={handleProfileChange} placeholder="Cm" />
                </div>
              </div>
              <div className="form-group-2">
                <div className="form-row">
                  <label>Phone Number</label>
                  <input required type="tel" name="phone" value={userProfile.phone} onChange={handleProfileChange} placeholder="+1..." />
                </div>
                <div className="form-row">
                  <label>City</label>
                  <input required name="city" value={userProfile.city} onChange={handleProfileChange} placeholder="City" />
                </div>
              </div>
              <div className="form-group-2">
                <div className="form-row">
                  <label>State / Province</label>
                  <input required name="state" value={userProfile.state} onChange={handleProfileChange} placeholder="State" />
                </div>
                <div className="form-row">
                  <label>Country</label>
                  <input required name="country" value={userProfile.country} onChange={handleProfileChange} placeholder="Country" />
                </div>
              </div>
              <button type="submit" className="primary-button full-width">Save & Continue</button>
            </form>
          </div>
        )}

        {/* SYMPTOMS SCREEN */}
        {screen === "symptoms" && (
          <div className="symptoms-section anim-fade">
            <div className="header-row">
              <div className="section-title">
                <h2>Select Biomarkers</h2>
                <span className="user-welcome">Analyzing for <strong>{userProfile.name}</strong></span>
              </div>
              <div className="search-wrapper">
                <input placeholder="Filter biomarkers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
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
                <span className="count">{Object.values(selectedSymptoms).filter(Boolean).length}</span>
                <span className="label">Markers Selected</span>
              </div>
              <div className="dock-btns">
                <button className="btn-secondary" onClick={() => setScreen("home")}>Cancel</button>
                <button className="btn-action" onClick={analyzeSymptoms}>Analyze Patterns</button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING SCREEN */}
        {screen === "loading" && (
          <div className="loading-state anim-fade">
            <div className="neural-spinner"><div className="ring"></div><Icons.Pulse /></div>
            <h3>Cross-referencing database...</h3>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === "results" && (
          <div className="results-section anim-fade">
            <div className="results-intro">
              <div className="mini-badge">SCREENING COMPLETE</div>
              <div className="results-title-row">
                <h2>Analysis Summary</h2>
                <button className="export-btn" onClick={exportReport}>
                  <Icons.Download />
                  Export Full Clinical Report
                </button>
              </div>
            </div>

            <div className="results-grid">
              <div className="primary-result">
                <div className="result-clinical-meta">
                   <span className="tier-tag">PRIMARY INDICATION</span>
                   <span className={`bmi-badge ${bmiInfo.class}`}>BMI: {bmiValue} ({bmiInfo.label})</span>
                </div>
                <h3>{results[0]}</h3>
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
              <p>This report is clinical-data driven but does not constitute a legal diagnosis. Always consult your primary care physician.</p>
              <button className="outline-btn" onClick={() => setScreen("home")}>Return to Dashboard</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const css = `
.med-ai-root {
  all: unset; display: block; background: #0F172A; color: #F8FAFC; 
  min-height: 100vh; width: 100vw; font-family: 'Inter', system-ui, sans-serif;
  overflow-x: hidden; position: relative; box-sizing: border-box;
}
.med-ai-root * { box-sizing: border-box; }

.top-nav { position: fixed; top: 0; width: 100%; z-index: 1000; display: flex; justify-content: center; padding: 20px; }
.nav-container { width: 100%; max-width: 1200px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.icon-box { background: #2DD4BF; padding: 8px; border-radius: 10px; color: #0F172A; display: flex; }
.main-logo { font-weight: 900; font-size: 1.2rem; letter-spacing: -1px; }

.user-indicator { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; color: #94A3B8; cursor: pointer; background: rgba(255,255,255,0.05); padding: 8px 16px; border-radius: 12px; }
.user-indicator:hover { color: #FFF; background: rgba(255,255,255,0.1); }
.nav-profile-img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid #2DD4BF; }

.main-stage { max-width: 1200px; margin: 0 auto; padding: 120px 24px 60px 24px; }

/* Home Hero */
.hero-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
.mini-badge { display: inline-block; padding: 4px 12px; background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 100px; color: #2DD4BF; font-size: 10px; font-weight: 800; margin-bottom: 20px; }
h1 { font-size: 5rem; font-weight: 900; line-height: 0.95; margin: 0 0 20px 0; }
h1 span { color: #2DD4BF; }
.hero-content p { color: #94A3B8; font-size: 1.2rem; margin-bottom: 40px; }

.history-sidebar { background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 30px; padding: 30px; }
.sidebar-header { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 0.9rem; color: #2DD4BF; text-transform: uppercase; margin-bottom: 20px; }
.history-item { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.history-date { font-size: 10px; color: #64748B; margin-bottom: 4px; }
.history-result { font-weight: 700; color: #F8FAFC; }

/* BMI Preview Styles */
.bmi-preview-box { padding: 20px; border-radius: 20px; margin-bottom: 30px; transition: 0.3s; }
.bmi-yellow { background: rgba(234, 179, 8, 0.1); border: 2px solid #EAB308; color: #EAB308; }
.bmi-green { background: rgba(34, 197, 94, 0.1); border: 2px solid #22C55E; color: #22C55E; }
.bmi-black { background: rgba(0, 0, 0, 0.4); border: 2px solid #FFF; color: #FFF; box-shadow: 0 0 20px rgba(255,255,255,0.1); }
.bmi-header { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; opacity: 0.8; }
.bmi-stats { display: flex; align-items: baseline; gap: 15px; }
.bmi-num { font-size: 2.5rem; font-weight: 900; }
.bmi-status { font-size: 1rem; font-weight: 700; }

.bmi-badge { padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }

/* Form Styles */
.login-section { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 40px; }
.form-header { margin-bottom: 30px; text-align: center; }
.form-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 8px; }
.form-header p { color: #64748B; font-weight: 500; }

.photo-upload-container { display: flex; justify-content: center; margin-bottom: 30px; }
.photo-label { cursor: pointer; }
.photo-preview-box { width: 100px; height: 100px; border-radius: 50%; border: 2px dashed rgba(45, 212, 191, 0.5); overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.5); transition: 0.3s; }
.photo-preview-box:hover { border-color: #2DD4BF; background: rgba(45, 212, 191, 0.05); }
.photo-preview { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { display: flex; flex-direction: column; align-items: center; color: #94A3B8; font-size: 10px; font-weight: 700; gap: 5px; }
.hidden-input { display: none; }

.profile-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; flex-direction: column; gap: 8px; }
.form-row label { font-size: 11px; font-weight: 800; color: #2DD4BF; text-transform: uppercase; letter-spacing: 1px; }
.form-row input { background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #FFF; font-weight: 600; font-size: 14px; width: 100%; min-width: 0; }
.form-row input:focus { outline: none; border-color: #2DD4BF; box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1); }

.form-group-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 100%; }
.form-group-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; width: 100%; }
.full-width { width: 100%; margin-top: 10px; }

/* Biomarker Selection */
.header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px; }
.user-welcome { font-size: 12px; color: #64748B; margin-top: 5px; display: block; }
.biomarker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 50vh; overflow-y: auto; padding-right: 10px; }
.marker-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; }
.marker-card.selected { background: #2DD4BF; color: #0F172A; }

.primary-button { background: #FFF; color: #0F172A; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; }
.primary-button:hover { background: #2DD4BF; transform: translateY(-2px); }

/* Buttons Enhancement */
.btn-action { background: linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%); color: #0F172A; padding: 14px 28px; border-radius: 14px; border: none; font-weight: 900; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(45, 212, 191, 0.3); }
.btn-action:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45, 212, 191, 0.4); }

.outline-btn { background: #334155; color: #F8FAFC; border: none; padding: 14px 28px; border-radius: 14px; cursor: pointer; margin-top: 20px; font-weight: 800; transition: 0.3s; }
.outline-btn:hover { background: #475569; transform: scale(1.02); }

/* Results */
.results-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin: 40px 0; }
.primary-result { background: rgba(30, 41, 59, 0.5); border: 2px solid #2DD4BF; padding: 40px; border-radius: 40px; }
.result-clinical-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.primary-result h3 { font-size: 4rem; font-weight: 900; margin: 0 0 20px 0; font-style: italic; text-transform: uppercase; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.anim-fade { animation: fadeIn 0.6s ease forwards; }

.neural-spinner { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; color: #2DD4BF; margin-bottom: 24px; }
.ring { position: absolute; width: 100%; height: 100%; border: 3px solid rgba(45, 212, 191, 0.1); border-top-color: #2DD4BF; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;
