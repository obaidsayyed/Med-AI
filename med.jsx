import React, { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc
} from "firebase/firestore";

/**
 * MED-AI: PERSONALIZED EDITION (V7.0 - UI Overhaul)
 * - Updated: Complete UI/UX redesign with Glassmorphism, animations, and modern aesthetics.
 * - Logic: Unchanged (Firebase, State, API calls remain exactly as before).
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://med-ai-1-is35.onrender.com";

// --- FIREBASE INIT (SECURE) ---
let firebaseConfig = {};

// 1. Attempt to load from Canvas Environment (Preview)
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  }
} catch (e) {
  // Not in Canvas, ignore
}

// 2. Fallback to Local Environment Variables (Vite/Localhost)
if (!firebaseConfig.apiKey) {
  try {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  } catch (e) {
    console.warn("Local environment variables not loaded.");
  }
}

// Use standard singleton pattern
let app;
let auth;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
}

// Use global env var if available (Canvas env), else default. 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'med-ai-local';

const Icons = {
  Pulse: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
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
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )
};

// --- NEW HISTORY REPORT MODAL ---
const HistoryModal = ({ item, onClose }) => {
  if (!item) return null;
  
  const predictions = item.allPredictions || [item.topMatch];
  const prec = item.precautions || "No detailed precautions archived for this record.";
  const syms = item.symptoms || [];

  return (
    <div className="otp-overlay" onClick={onClose}>
      <div className="glass-card modal-card anim-scale-in" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <div className="icon-circle-sm"><Icons.History /></div>
             <h3 style={{margin:0, fontSize: '1.25rem', fontWeight: 700}}>Assessment Report</h3>
           </div>
           <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="modal-section">
            <div className="modal-label">DATE & TIME</div>
            <div className="modal-value">{item.date} at {item.time}</div>
        </div>

        <div className="modal-section">
             <div className="modal-label">TOP 3 DISEASE INDICATIONS</div>
             <div className="predictions-list">
               {predictions.slice(0,3).map((p, i) => (
                   <div key={i} className="prediction-item">
                      <span className="rank-badge">#{i+1}</span>
                      <strong className="disease-name">{p}</strong>
                   </div>
               ))}
             </div>
        </div>

        <div className="modal-section">
             <div className="modal-label">SYMPTOMS REPORTED</div>
             <div className="tags-container">
                {syms.map((s, i) => (
                    <span key={i} className="symptom-tag-static">{s.replace(/_/g, ' ')}</span>
                ))}
             </div>
        </div>

        <div className="advice-box">
            <div className="modal-label" style={{color: '#F59E0B'}}>MEDICAL PRECAUTIONS & ADVICE</div>
            <p>{prec}</p>
        </div>

        <button className="btn-secondary full-width" onClick={onClose}>Close Report</button>
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [results, setResults] = useState([]);
  const [precautions, setPrecautions] = useState("");
  const [history, setHistory] = useState([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Auth state
  const [isNewUser, setIsNewUser] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: "", age: "", weight: "", height: "", gender: "",
    email: "", phone: "", city: "", state: "", country: "",
    photo: "", password: "" 
  });

  // Password Change State
  const [passwordChange, setPasswordChange] = useState({ current: "", new: "" });

  const fallbackSymptoms = ["itching", "skin_rash", "shivering", "joint_pain", "stomach_pain", "fatigue", "cough", "high_fever"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        await fetchUserData(user.uid, user.email);
        if (screen === 'login' || screen === 'forgot-password') setScreen("home");
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        if (screen !== 'forgot-password') setScreen("login");
      }
    });
      fetch(`${API_BASE}/symptoms`)
  .then(res => res.json())
  .then(data => {
    const validData = data.symptoms || data; 
        
        setSymptoms(Array.isArray(validData) ? validData : fallbackSymptoms);
      })
      .catch(() => setSymptoms(fallbackSymptoms));
    // ---------------------------------------------

    return () => unsubscribe();
  }, []);
  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  

  // --- FIRESTORE HELPERS ---
  const fetchUserData = async (uid, email) => {
    if (!uid) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setUserProfile(prev => ({ ...prev, ...profileSnap.data() }));
      } else {
        const recoveryProfile = {
          name: email ? email.split('@')[0] : "User",
          email: email || "",
          age: "", weight: "", height: "", gender: "",
          phone: "", city: "", state: "", country: "",
          photo: ""
        };
        try {
          await setDoc(profileRef, recoveryProfile);
          setUserProfile(prev => ({ ...prev, ...recoveryProfile }));
        } catch (recoveryError) {
          console.error("Critical: Auto-recovery failed.", recoveryError);
          await signOut(auth);
          setScreen("login");
          setError("Profile synchronization failed. Please login again.");
        }
      }

      const historyRef = doc(db, 'artifacts', appId, 'users', uid, 'data', 'history');
      const historySnap = await getDoc(historyRef);
      
      if (historySnap.exists()) {
        setHistory(historySnap.data().records || []);
      } else {
        await setDoc(historyRef, { records: [] }).catch(() => {});
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      await signOut(auth);
      setScreen("login");
      setError("Connection interrupted. Please login again.");
    }
  };

  const calculateBMI = () => {
    const w = parseFloat(userProfile.weight);
    const h = parseFloat(userProfile.height) / 100;
    if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
    return null;
  };

  const getBMIInfo = (bmi) => {
    if (!bmi) return { label: "N/A", color: "#94A3B8" };
    const val = parseFloat(bmi);
    if (val < 18.5) return { label: "Underweight", color: "#EAB308", class: "bmi-yellow" };
    if (val >= 18.5 && val <= 24.9) return { label: "Normal / Safe", color: "#22C55E", class: "bmi-green" };
    return { label: "Overweight", color: "#EF4444", class: "bmi-red" };
  };

  const bmiValue = calculateBMI();
  const bmiInfo = getBMIInfo(bmiValue);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordChange(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is larger than 1MB (1,048,576 bytes)
      if (file.size > 1000000) {
        setError("Photo is too large. Please upload an image smaller than 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, photo: reader.result }));
        setError(null); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ACTIONS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please check your email and password.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    const safeEmail = userProfile.email ? userProfile.email.trim() : "";
    
    if (!safeEmail || !userProfile.password || userProfile.password.length < 6) {
      setError("Valid email and 6+ char password required.");
      return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, safeEmail, userProfile.password);
        const uid = userCredential.user.uid;
        
        const { password, ...safeProfile } = userProfile;
        const profileToSave = { ...safeProfile, email: safeEmail };
        
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), profileToSave);
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'data', 'history'), { records: [] });
        
        setIsNewUser(false);
        setNotification("Account created! Please log in.");
        setUserProfile(prev => ({...prev, password: ""}));
    } catch (err) {
        console.error(err);
        setError(err.message || "Registration failed");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    if (!currentUser) return;
    try {
      const { password, ...safeProfile } = userProfile;
      await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'main'), safeProfile, { merge: true });
      
      if (currentUser.email !== userProfile.email) {
        try {
          await updateEmail(currentUser, userProfile.email);
        } catch (emailErr) {
          setError("Profile saved, but email update requires recent login.");
          return;
        }
      }
      setNotification("Profile details updated successfully!");
    } catch (err) {
      setError("Failed to update profile: " + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!passwordChange.current || !passwordChange.new) {
      setError("Please enter both current and new passwords.");
      return;
    }

    if (passwordChange.new.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordChange.current);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordChange.new);
      
      setNotification("Password changed successfully!");
      setPasswordChange({ current: "", new: "" });
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      setError("Wrong current password entered."); // <--- Custom Red Message
    } else if (err.code === 'auth/weak-password') {
      setError("Password should be at least 6 characters.");
    } else if (err.code === 'auth/too-many-requests') {
      setError("Too many failed attempts. Please try again later.");
    } else {
      setError("Failed to update password. Please try again.");
    }
    // ----------------------
  }
};

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile({ name: "", age: "", weight: "", height: "", gender: "", email: "", phone: "", city: "", state: "", country: "", photo: "", password: "" });
      setHistory([]);
      setShowProfileMenu(false);
    } catch (err) { console.error(err); }
  };

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev => ({ ...prev, [s]: !prev[s] }));
  };

  async function analyzeSymptoms() {
    setError(null);
    const selected = Object.keys(selectedSymptoms).filter(s => selectedSymptoms[s]);
    if (selected.length === 0) return;
    
    setScreen("loading");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    try {
      const res = await fetch(`${API_BASE}/predict`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          symptoms: selected,
          user_email: currentUser?.email
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const predictions = data.predictions || [];
      const precautionText = data.precaution || "Consult a healthcare professional.";
      
      const newEntry = {
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topMatch: predictions[0] || "Unknown",
        symptoms: selected,
        allPredictions: predictions, 
        precautions: precautionText 
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 10);
      setHistory(updatedHistory);
      
      if (currentUser) {
        const historyRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'data', 'history');
        await setDoc(historyRef, { records: updatedHistory }, { merge: true });
      }

      setResults(predictions);
      setPrecautions(precautionText);
      setScreen("results");
    } catch (err) {
      console.error(err);
      if (err.name === 'AbortError') {
        setError("Analysis timed out. The server took too long.");
      } else {
        setError("Connection failed. Check if backend is running.");
      }
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
Gender:  ${userProfile.gender}
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

GUIDANCE NOTES:
${precautions}

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

  // --- RENDER HELPERS ---

  return (
    <div className="med-ai-root">
      <style>{css}</style>
      
      {/* Background Ambience */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      
      {notification && <div className="notification-toast">{notification}</div>}
      {error && <div className="error-toast">{error}</div>}

      {/* History Details Modal */}
      {viewingHistoryItem && (
        <HistoryModal 
            item={viewingHistoryItem} 
            onClose={() => setViewingHistoryItem(null)} 
        />
      )}

      <nav className="top-nav">
        <div className="nav-container glass-card">
          <div className="brand" onClick={() => setScreen(isLoggedIn ? "home" : "login")}>
            <div className="icon-box pulse-anim"><Icons.Pulse /></div>
            <span className="main-logo">MED<span className="accent-text">AI</span></span>
          </div>
          
          {isLoggedIn && (
            <div className="profile-nav-section">
              <div 
                className={`user-indicator ${showProfileMenu ? 'active' : ''}`} 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {userProfile.photo ? (
                  <img src={userProfile.photo} alt="Profile" className="nav-profile-img" />
                ) : (
                  <div className="nav-profile-placeholder"><Icons.User /></div>
                )}
              </div>

              {showProfileMenu && (
                <div className="profile-dropdown glass-card anim-fade-in-down">
                  <div className="dropdown-header">
                    <div className="header-photo">
                      {userProfile.photo ? (
                        <img src={userProfile.photo} alt="Profile" />
                      ) : (
                        <div className="placeholder-icon"><Icons.User /></div>
                      )}
                    </div>
                    <div className="header-info">
                      <span className="name">{userProfile.name}</span>
                      <span className="email">{userProfile.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="menu-btn" onClick={() => { setScreen("profile"); setShowProfileMenu(false); }}>
                    <Icons.Edit /> Manage Profile
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="main-stage">
        
        {screen === "login" && (
          <div className="login-section glass-card anim-scale-in">
            <div className="form-header">
              <div className="logo-lg"><Icons.Brain size={64}/></div>
              <h2>{isNewUser ? "Join Med-AI" : "Clinical Access"}</h2>
              <p>{isNewUser ? "Register to start your health journey." : "Enter your credentials to access the neural engine."}</p>
            </div>

            {error && <div className="error-bar">{error}</div>}

            {!isNewUser ? (
              <form className="profile-form" onSubmit={handleLogin}>
                <div className="form-row full">
                  <label>Email</label>
                  <input required name="email" value={loginData.email} onChange={handleLoginChange} placeholder="Enter your email" />
                </div>
                <div className="form-row full">
                  <label>Password</label>
                  <input required type="password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder="••••••••" />
                </div>
                <button type="submit" className="primary-button full-width glow-effect">Access Dashboard</button>
                <div className="form-footer" style={{justifyContent: 'center'}}>
                  <span className="footer-text">New here?</span>
                  <button type="button" className="text-link" onClick={() => setIsNewUser(true)}>Create Profile</button>
                </div>
              </form>
            ) : (
              <form className="profile-form" onSubmit={handleRegister}>
                <div className="photo-upload-container">
                  <label className="photo-label">
                    <div className="photo-preview-box">
                      {userProfile.photo ? (
                        <img src={userProfile.photo} alt="Preview" className="photo-preview" />
                      ) : (
                        <div className="photo-placeholder"><Icons.Camera /><span>Upload</span></div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                  </label>
                </div>

                <div className="form-row full">
                  <label>Full Name</label>
                  <input required name="name" value={userProfile.name} onChange={handleProfileChange} placeholder="John Doe" />
                </div>
                <div className="form-group-2">
                  <div className="form-row">
                    <label>Gender</label>
                    <div className="select-wrapper">
                      <select name="gender" value={userProfile.gender} onChange={handleProfileChange} className="select-input">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <label>Clinical Email</label>
                    <input required type="email" name="email" value={userProfile.email} onChange={handleProfileChange} placeholder="Email" />
                  </div>
                </div>
                <div className="form-row full">
                  <label>Set Password</label>
                  <input required type="password" name="password" value={userProfile.password} onChange={handleProfileChange} placeholder="••••••••" />
                  <p className="warning-text">⚠️ Password cannot be recovered if lost.</p>
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
                    <input required type="tel" name="phone" value={userProfile.phone} onChange={handleProfileChange} placeholder="Phone" />
                  </div>
                  <div className="form-row">
                    <label>City</label>
                    <input required name="city" value={userProfile.city} onChange={handleProfileChange} placeholder="City" />
                  </div>
                </div>
                <div className="form-group-2">
                  <div className="form-row">
                    <label>State</label>
                    <input required name="state" value={userProfile.state} onChange={handleProfileChange} placeholder="State" />
                  </div>
                  <div className="form-row">
                    <label>Country</label>
                    <input required name="country" value={userProfile.country} onChange={handleProfileChange} placeholder="Country" />
                  </div>
                </div>
                <button type="submit" className="primary-button full-width glow-effect">Initialize Profile</button>
                <button type="button" className="text-link center" onClick={() => setIsNewUser(false)}>Back to Login</button>
              </form>
            )}
          </div>
        )}

        {/* PROFILE MANAGEMENT SCREEN */}
        {screen === "profile" && (
          <div className="anim-fade-in">
            <div className="section-header">
              <h2>My Profile</h2>
              <p>Manage your clinical identity and security settings.</p>
            </div>

            {error && <div className="error-bar">{error}</div>}

            <div className="profile-grid-layout">
              {/* Left Column: Details Edit */}
              <div className="glass-card padding-lg">
                <h3>Personal Details</h3>
                <form className="profile-form" onSubmit={handleUpdateProfile}>
                  <div className="photo-upload-container">
                    <label className="photo-label">
                      <div className="photo-preview-box">
                        {userProfile.photo ? (
                          <img src={userProfile.photo} alt="Preview" className="photo-preview" />
                        ) : (
                          <div className="photo-placeholder"><Icons.Camera /><span>Update</span></div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                    </label>
                  </div>

                  <div className="form-row full">
                    <label>Full Name</label>
                    <input name="name" value={userProfile.name} onChange={handleProfileChange} />
                  </div>
                  <div className="form-group-2">
                    <div className="form-row">
                      <label>Email (Requires Re-login)</label>
                      <input type="email" name="email" value={userProfile.email} onChange={handleProfileChange} />
                    </div>
                    <div className="form-row">
                      <label>Gender</label>
                      <select name="gender" value={userProfile.gender} onChange={handleProfileChange} className="select-input">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group-3">
                    <div className="form-row">
                      <label>Age</label>
                      <input type="number" name="age" value={userProfile.age} onChange={handleProfileChange} />
                    </div>
                    <div className="form-row">
                      <label>Weight (kg)</label>
                      <input type="number" name="weight" value={userProfile.weight} onChange={handleProfileChange} />
                    </div>
                    <div className="form-row">
                      <label>Height (cm)</label>
                      <input type="number" name="height" value={userProfile.height} onChange={handleProfileChange} />
                    </div>
                  </div>
                  <div className="form-group-2">
                    <div className="form-row">
                      <label>City</label>
                      <input name="city" value={userProfile.city} onChange={handleProfileChange} />
                    </div>
                    <div className="form-row">
                      <label>State</label>
                      <input name="state" value={userProfile.state} onChange={handleProfileChange} />
                    </div>
                  </div>
                  <div className="form-row full">
                    <label>Country</label>
                    <input name="country" value={userProfile.country} onChange={handleProfileChange} />
                  </div>
                  <button type="submit" className="primary-button full-width glow-effect">Save Changes</button>
                </form>
              </div>

              {/* Right Column: Password Change */}
              <div className="glass-card padding-lg h-fit">
                <h3>Security</h3>
                <form className="profile-form" onSubmit={handleChangePassword}>
                  <div className="form-row full">
                    <label>Current Password</label>
                    <input type="password" name="current" value={passwordChange.current} onChange={handlePasswordChangeInput} placeholder="Enter current password" />
                  </div>
                  <div className="form-row full">
                    <label>New Password</label>
                    <input type="password" name="new" value={passwordChange.new} onChange={handlePasswordChangeInput} placeholder="Enter new password" />
                  </div>
                  <button type="submit" className="btn-secondary full-width" style={{marginTop: "10px"}}>Change Password</button>
                </form>

                <div style={{marginTop: "30px", textAlign: 'center'}}>
                  <button type="button" className="text-link" onClick={() => setScreen("home")}>&larr; Back to Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOME SCREEN */}
        {screen === "home" && (
          <div className="screen-home anim-fade-in">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="mini-badge">NEURAL ENGINE V7.0</div>
                <h1>Advanced <br/><span className="gradient-text">Personal Analysis.</span></h1>
                <p>A sophisticated medical pattern identifying engine tailored to your biology. Connected as <strong>{userProfile.name}</strong>.</p>
                
                {bmiValue && (
                  <div className={`bmi-mini-card glass-card ${bmiInfo.class}`}>
                    <div className="icon-circle"><Icons.Scale /></div>
                    <div className="bmi-text">
                        <span className="label">Clinical BMI</span>
                        <span className="value">{bmiValue} <span className="status">({bmiInfo.label})</span></span>
                    </div>
                  </div>
                )}

                <div className="hero-actions">
                  <button 
                    className="primary-button lg glow-effect" 
                    onClick={() => {
                      setSelectedSymptoms({});  // <--- CLEARS OLD SYMPTOMS
                      setResults([]);           // <--- CLEARS OLD RESULTS
                      setScreen("symptoms");    // <--- THEN GOES TO SCREEN
                    }}
                  >
                    Start New Assessment
                  </button>
                </div>
              </div>
              
              <div className="history-sidebar glass-card">
                <div className="sidebar-header"><Icons.History /><span>Recent History</span></div>
                <div className="history-list">
                    {history.length > 0 ? (
                    history.map((item, idx) => (
                        <div key={idx} className="history-item" onClick={() => setViewingHistoryItem(item)}>
                        <div className="history-content">
                            <div className="history-date">{item.date} • {item.time}</div>
                            <div className="history-result">{item.topMatch}</div>
                        </div>
                        <div className="arrow-icon">&rarr;</div>
                        </div>
                    ))
                    ) : (
                    <div className="history-empty">No clinical history recorded yet.</div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYMPTOMS SCREEN */}
        {screen === "symptoms" && (
          <div className="symptoms-section anim-fade-in">
            <div className="header-row">
              <div className="section-title">
                <h2>Select Biomarkers</h2>
                <span className="user-welcome">Analyzing patterns for <strong>{userProfile.name}</strong></span>
              </div>
              <div className="search-wrapper glass-card">
                <Icons.Search />
                <input placeholder="Search symptoms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            
            <div className="biomarker-grid">
              {filteredSymptoms.map(s => (
                <div 
                  key={s} 
                  className={`marker-card glass-card ${selectedSymptoms[s] ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(s)}
                >
                  <div className="check-circle">{selectedSymptoms[s] && <Icons.Check />}</div>
                  <span>{s.replace(/_/g, " ")}</span>
                </div>
              ))}
              
              {/* FIX FOR OVERLAP: Invisible spacer so you can scroll to the very bottom */}
              <div style={{ height: "100px", width: "100%" }}></div> 
            </div>

            {/* THE STATIC ACTION BAR (Placed correctly) */}
            {/* --- NEW LAYOUT: CANCEL | COUNT | ANALYZE --- */}
      {Object.values(selectedSymptoms).filter(Boolean).length > 0 && (
        <div className="action-bar-static" style={{justifyContent: 'space-between'}}>
          
          {/* 1. LEFT: Cancel Button */}
          <button 
            className="btn-secondary" 
            onClick={() => setSelectedSymptoms({})}
            style={{padding: '10px 20px', border: 'none', color: '#94a3b8'}}
          >
            Cancel
          </button>

          {/* 2. CENTER: The Counter */}
          <div className="dock-stats" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <span className="count" style={{fontSize: '1.5rem', fontWeight: '800', lineHeight: '1'}}>
              {Object.values(selectedSymptoms).filter(Boolean).length}
            </span>
            <span className="label" style={{fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7}}>
              Selected
            </span>
          </div>

          {/* 3. RIGHT: Analyze Button */}
          <button 
            className="primary-button btn-compact" 
            onClick={analyzeSymptoms}
          >
            Analyze
          </button>

        </div>
      )}

          </div> 
        )}
        {/* LOADING SCREEN */}
        {screen === "loading" && (
          <div className="loading-state anim-fade-in">
            <div className="neural-spinner-lg">
                <div className="spinner-ring ring-1"></div>
                <div className="spinner-ring ring-2"></div>
                <div className="spinner-core"><Icons.Brain size={40}/></div>
            </div>
            <h3>Cross-referencing neural database...</h3>
            <p>Analyzing symptom correlations against clinical models.</p>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === "results" && (
          <div className="results-section anim-fade-in">
            <div className="results-intro">
              <div className="mini-badge success">SCREENING COMPLETE</div>
              <div className="results-title-row">
                <h2>Analysis Summary</h2>
                <button className="export-btn glass-card" onClick={exportReport}>
                  <Icons.Download />
                  Export Report
                </button>
              </div>
            </div>

            <div className="results-grid">
              <div className="primary-result glass-card glow-border">
                <div className="result-clinical-meta">
                    <span className="tier-tag">PRIMARY INDICATION</span>
                    <span className={`bmi-badge ${bmiInfo.class}`}>BMI: {bmiValue} ({bmiInfo.label})</span>
                </div>
                <h3>{results[0]}</h3>
                <p>Pattern correlation suggests high alignment with clinical signatures for this condition.</p>
                <div className="confidence-bar"><div className="fill" style={{width: '88%'}}></div></div>
              </div>
              
              <div className="side-results">
                {results.slice(1, 3).map((r, i) => (
                  <div key={i} className="mini-result glass-card">
                    <span className="tier-tag">ALTERNATIVE {i + 1}</span>
                    <h4>{r}</h4>
                  </div>
                ))}
              </div>
            </div>

            <div className="precautions-section glass-card">
              <div className="section-icon"><Icons.Lock /></div>
              <div className="content">
                <h3>Guidance Protocols</h3>
                <p>{precautions}</p>
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

:root {
  --bg-dark: #0B1120;
  --glass-bg: rgba(30, 41, 59, 0.4);
  --glass-border: rgba(255, 255, 255, 0.08);
  --primary: #22d3ee;
  --primary-glow: rgba(34, 211, 238, 0.5);
  --secondary: #8b5cf6;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --font-main: 'Outfit', system-ui, sans-serif;
}

body { margin: 0; overflow-x: hidden; background: var(--bg-dark); }

.med-ai-root {
  font-family: var(--font-main);
  background: var(--bg-dark);
  color: var(--text-main);
  min-height: 100vh;
  width: 100vw;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box; /* Added to prevent scrollbar issues */
}

/* --- AMBIENT BACKGROUND --- */
.ambient-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  z-index: 0;
  animation: floatOrb 20s infinite ease-in-out;
}
.orb-1 { top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, var(--secondary), transparent 70%); }
.orb-2 { bottom: -10%; right: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, var(--primary), transparent 70%); animation-delay: -10s; }

@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 50px); }
}
  /* ... existing animations code ... */

/* --- NOTIFICATIONS --- */
.notification-toast { 
  position: fixed; 
  top: 20px; 
  left: 50%; 
  transform: translateX(-50%); 
  background: #10B981; 
  color: white; 
  padding: 12px 24px; 
  border-radius: 50px; 
  z-index: 3000; 
  font-weight: 600; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.5); 
  white-space: nowrap;
}

/* --- PASTE THIS INSIDE YOUR CSS CONSTANT --- */

.error-toast { 
  position: fixed; 
  top: 20px; 
  left: 50%; 
  transform: translateX(-50%); 
  background: #EF4444; /* RED COLOR */
  color: white; 
  padding: 12px 24px; 
  border-radius: 50px; 
  z-index: 9999; 
  font-weight: 600; 
  box-shadow: 0 10px 25px rgba(0,0,0,0.5); 
  white-space: nowrap;
}

/* --- GLASSMORPHISM CARD --- */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
  /* --- UNIVERSAL CENTER POPUP (Fixes Desktop) --- */
.otp-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85); /* Dark background */
  z-index: 10000;
  
  /* This centers the card specifically */
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px); /* Nice blur effect */
}

/* Ensure the card looks good on desktop */
.modal-card {
  position: relative;
  width: 90%;
  max-width: 600px; /* Limits width on big screens */
  max-height: 90vh; /* Prevents it from being too tall */
  overflow-y: auto; /* Scroll inside the card if needed */
  margin: 0 auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* --- NAVIGATION --- */
.top-nav {
  position: fixed; top: 0; width: 100%; z-index: 1000; padding: 20px;
  display: flex; justify-content: center; box-sizing: border-box;
}
.nav-container {
  width: 100%; max-width: 1200px; padding: 12px 24px;
  display: flex; justify-content: space-between; align-items: center;
}
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.icon-box { color: var(--primary); display: flex; filter: drop-shadow(0 0 8px var(--primary-glow)); }
.pulse-anim { animation: pulse 2s infinite; }
.main-logo { font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; }
.accent-text { color: var(--primary); }

.user-indicator {
  width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: 0.3s;
}
.user-indicator:hover, .user-indicator.active { border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); }
.nav-profile-img { width: 100%; height: 100%; object-fit: cover; }

/* --- DROPDOWN (FIXED TRANSPARENCY) --- */
.profile-dropdown {
  position: absolute;
  top: 70px;
  right: 0;
  width: 300px;
  padding: 20px;
  z-index: 1001;
  /* Added solid background so it doesn't merge with the page */
  background: #0B1120; 
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.dropdown-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
.header-photo { width: 50px; height: 50px; border-radius: 12px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.header-info { display: flex; flex-direction: column; }
.header-info .name { font-weight: 700; color: #fff; }
.header-info .email { font-size: 0.8rem; color: var(--text-muted); }
.dropdown-divider { height: 1px; background: var(--glass-border); margin: 15px 0; }
.menu-btn {
  width: 100%; text-align: left; background: none; border: none; color: var(--text-main);
  padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: 500;
  display: flex; align-items: center; gap: 10px;
}
.menu-btn:hover { background: rgba(255,255,255,0.05); color: var(--primary); }
.logout-btn {
  width: 100%; padding: 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444;
  border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s;
}
.logout-btn:hover { background: rgba(239, 68, 68, 0.25); }

/* --- MAIN STAGE --- */
.main-stage {
  max-width: 1200px; margin: 0 auto; padding: 120px 20px 40px;
  position: relative; z-index: 1; box-sizing: border-box;
}

/* --- FORMS & LOGIN --- */
.login-section { max-width: 500px; margin: 40px auto; padding: 40px; text-align: center; }
.form-header .logo-lg { color: var(--primary); margin-bottom: 20px; filter: drop-shadow(0 0 15px var(--primary-glow)); }
.form-header h2 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
.form-header p { color: var(--text-muted); line-height: 1.5; margin-bottom: 30px; }

.profile-form { text-align: left; display: flex; flex-direction: column; gap: 16px; }
.form-row label {
  display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;
}
input, select {
  width: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--glass-border);
  padding: 14px; border-radius: 12px; color: #fff; font-family: var(--font-main);
  font-size: 1rem; transition: 0.3s; box-sizing: border-box;
}
input:focus, select:focus {
  outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.1); background: rgba(15, 23, 42, 0.9);
}
.form-group-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

/* --- BUTTONS --- */
.primary-button {
  background: linear-gradient(135deg, var(--primary), #0891b2); color: #0f172a;
  border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1rem;
  cursor: pointer; transition: 0.3s; position: relative; overflow: hidden; width: 100%;
}
.primary-button.lg { padding: 20px 40px; font-size: 1.1rem; border-radius: 16px; width: auto; }
.glow-effect:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -5px var(--primary-glow); }
.btn-secondary {
  background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted);
  padding: 14px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;
}
.btn-secondary:hover { color: #fff; border-color: #fff; }
.btn-action {
  background: var(--text-main); color: #0f172a; border: none; padding: 14px 28px;
  border-radius: 12px; font-weight: 800; cursor: pointer;
}
.text-link { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; }
.footer-text { color: var(--text-muted); font-size: 0.9rem; margin-right: 8px; }

/* --- COMPACT ACTION CAPSULE (Fixes Wide Desktop) --- */
.action-bar-static {
  /* Sizing & Positioning */
  width: 90%;              /* Fits mobile nicely */
  max-width: 480px;        /* STOPS it from stretching on Desktop */
  margin: 40px auto 60px;  /* Centers it horizontally */
  
  /* Layout */
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 12px;

  /* Glass/Capsule Styling */
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 100px;    /* Makes it fully rounded */
  padding: 10px 14px;      /* Compact padding */
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5); /* Nice floating shadow */
}

/* Cancel Button Hover Effect */
.btn-ghost {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: 0.2s;
  font-weight: 600;
  font-size: 0.9rem;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

/* Stats Counter */
.capsule-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
  
  /* Glass style */
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  padding: 16px 24px;
  border-radius: 50px;
  width: 90%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.dock-btns {
  display: flex !important;
  gap: 15px !important;
  width: auto !important; /* Let buttons determine width */
}

/* This fixes the missing button */
.btn-compact {
  width: auto !important;
  min-width: 150px !important; /* Forces it to have width */
  padding: 12px 24px !important;
  white-space: nowrap !important;
}

/* --- PROFILE GRID --- */
.profile-grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.section-header { margin-bottom: 30px; }

/* --- HERO SCREEN --- */
.hero-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 60px; align-items: center; }
.hero-content h1 { font-size: 4.5rem; line-height: 1; font-weight: 800; margin-bottom: 24px; letter-spacing: -2px; }
.gradient-text { background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.mini-badge {
  display: inline-block; padding: 6px 12px; border-radius: 100px;
  background: rgba(34, 211, 238, 0.1); border: 1px solid rgba(34, 211, 238, 0.2);
  color: var(--primary); font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 20px;
}
.bmi-mini-card { display: inline-flex; align-items: center; gap: 16px; padding: 16px 24px; margin-bottom: 40px; }
.bmi-mini-card .icon-circle { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: var(--text-main); }
.bmi-text { display: flex; flex-direction: column; }
.bmi-text .label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
.bmi-text .value { font-size: 1.2rem; font-weight: 800; color: #fff; }
.bmi-text .status { font-weight: 400; font-size: 1rem; color: var(--text-muted); margin-left: 5px; }
.bmi-yellow .value { color: var(--warning); } .bmi-green .value { color: var(--success); } .bmi-red .value { color: var(--danger); }

/* --- SIDEBAR HISTORY --- */
.history-sidebar { padding: 24px; height: 500px; display: flex; flex-direction: column; }
.sidebar-header { display: flex; align-items: center; gap: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); font-size: 0.85rem; letter-spacing: 1px; margin-bottom: 20px; }
.history-list { overflow-y: auto; flex: 1; padding-right: 5px; }
.history-item { padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.03); margin-bottom: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; border: 1px solid transparent; }
.history-item:hover { background: rgba(255,255,255,0.08); border-color: var(--glass-border); }
.history-date { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
.history-result { font-weight: 700; font-size: 1rem; color: #fff; }
.arrow-icon { color: var(--text-muted); opacity: 0; transition: 0.2s; transform: translateX(-10px); }
.history-item:hover .arrow-icon { opacity: 1; transform: translateX(0); }

/* --- SYMPTOMS SCREEN --- */
.header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
.section-title h2 { font-size: 3rem; margin: 0 0 10px 0; font-weight: 800; }
.user-welcome { color: var(--text-muted); font-size: 1.1rem; }
.search-wrapper { display: flex; align-items: center; gap: 12px; padding: 12px 20px; width: 350px; }
.search-wrapper input { background: transparent; border: none; padding: 0; box-shadow: none; }

.biomarker-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;
  max-height: 60vh; overflow-y: auto; padding-bottom: 100px;
}
.marker-card { padding: 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
.marker-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.07); }
.marker-card.selected { background: rgba(34, 211, 238, 0.15); border-color: var(--primary); }
.check-circle { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; color: var(--primary); transition: 0.2s; }
.marker-card.selected .check-circle { border-color: var(--primary); background: rgba(34,211,238,0.2); }
.marker-card span { font-weight: 600; font-size: 0.95rem; text-transform: capitalize; }

.floating-dock {
  position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
  width: 90%; max-width: 600px; padding: 16px 24px; display: flex; align-items: center;
  justify-content: space-between; z-index: 100;
}
.dock-stats { display: flex; flex-direction: column; }
.dock-stats .count { font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1; }
.dock-stats .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
.dock-btns { display: flex; gap: 12px; }

/* --- LOADING --- */
.loading-state { text-align: center; padding: 100px 0; }
.neural-spinner-lg { position: relative; width: 120px; height: 120px; margin: 0 auto 40px; display: flex; align-items: center; justify-content: center; }
.spinner-ring { position: absolute; border-radius: 50%; border: 2px solid transparent; border-top-color: var(--primary); border-left-color: var(--secondary); }
.ring-1 { width: 100%; height: 100%; animation: spin 2s linear infinite; }
.ring-2 { width: 70%; height: 70%; animation: spin 3s linear infinite reverse; border-top-color: var(--secondary); border-left-color: var(--primary); }
.spinner-core { color: #fff; animation: pulse 1.5s infinite; }

/* --- RESULTS --- */
.results-intro { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }
.results-title-row { display: flex; justify-content: space-between; align-items: flex-end; }
.results-title-row h2 { font-size: 3rem; margin: 0; font-weight: 800; line-height: 1; }
.export-btn { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid var(--glass-border); border-radius: 12px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.export-btn:hover { background: rgba(255,255,255,0.1); }

.results-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 40px; }
.glow-border { border: 1px solid var(--primary); box-shadow: 0 0 20px rgba(34, 211, 238, 0.1); }
.primary-result { padding: 40px; }
.result-clinical-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: 700; font-size: 0.8rem; color: var(--primary); letter-spacing: 1px; }
.primary-result h3 { font-size: 3.5rem; margin: 0 0 20px; font-weight: 800; line-height: 1; }
.primary-result p { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 30px; }
.confidence-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
.confidence-bar .fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); }

.side-results { display: flex; flex-direction: column; gap: 16px; }
.mini-result { padding: 24px; display: flex; flex-direction: column; justify-content: center; height: 100%; transition: 0.2s; }
.mini-result:hover { background: rgba(255,255,255,0.08); }
.mini-result .tier-tag { font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-bottom: 8px; }
.mini-result h4 { margin: 0; font-size: 1.25rem; font-weight: 700; }

.precautions-section { display: flex; gap: 24px; padding: 30px; margin-bottom: 40px; }
.section-icon { width: 50px; height: 50px; background: rgba(245, 158, 11, 0.1); color: var(--warning); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.precautions-section h3 { color: var(--warning); margin: 0 0 10px 0; }
.precautions-section p { margin: 0; color: #cbd5e1; line-height: 1.6; white-space: pre-line; }

.medical-disclaimer { text-align: center; max-width: 600px; margin: 0 auto 60px; }
.disclaimer-header { font-size: 0.75rem; font-weight: 800; color: var(--danger); letter-spacing: 1px; margin-bottom: 10px; }
.medical-disclaimer p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; }
.outline-btn { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 10px 20px; border-radius: 100px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.2s; }
.outline-btn:hover { border-color: var(--text-main); color: var(--text-main); }

/* --- MODAL --- */
.modal-card { width: 90%; max-width: 600px; padding: 32px; max-height: 85vh; overflow-y: auto; }
.icon-circle-sm { width: 32px; height: 32px; background: rgba(34, 211, 238, 0.1); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.close-btn { background: none; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer; }
.modal-section { margin-bottom: 24px; }
.modal-label { font-size: 0.7rem; font-weight: 800; color: var(--primary); letter-spacing: 1px; margin-bottom: 8px; }
.modal-value { font-size: 1.1rem; color: #fff; font-weight: 500; }
.prediction-item { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; margin-bottom: 8px; }
.rank-badge { font-weight: 700; color: var(--text-muted); font-size: 0.9rem; }
.disease-name { color: #fff; }
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.symptom-tag-static { background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 100px; font-size: 0.85rem; color: #cbd5e1; }
.advice-box { background: rgba(245, 158, 11, 0.05); border-left: 3px solid var(--warning); padding: 16px; border-radius: 8px; margin-bottom: 24px; }
.advice-box p { font-size: 0.95rem; line-height: 1.6; color: #e2e8f0; margin: 0; }

/* --- ANIMATIONS --- */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } }
.anim-fade-in { animation: fadeIn 0.6s ease forwards; }
.anim-scale-in { animation: scaleIn 0.4s ease forwards; }
.anim-fade-in-down { animation: fadeInDown 0.3s ease forwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* --- MOBILE RESPONSIVE (IMPROVED) --- */
@media (max-width: 768px) {
  .top-nav { padding: 10px; }
  .nav-container { padding: 10px 15px; }
  .brand .main-logo { font-size: 1.2rem; }
  .user-indicator { width: 36px; height: 36px; }

  .otp-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #0B1120 !important; /* Solid background, hiding the app behind it */
    z-index: 99999 !important;      /* Maximum priority */
    padding: 0 !important;
    display: flex !important;
    align-items: flex-start !important; /* Start from top */
    overflow-y: auto !important;    /* Allow scrolling within the overlay */
  }

  /* 2. Make the card fill that space completely */
  .modal-card {
    width: 100% !important;
    min-height: 100vh !important;   /* Force full height */
    max-width: none !important;
    max-height: none !important;
    border-radius: 0 !important;    /* No corners looks like a full page */
    border: none !important;
    background: transparent !important; /* Background is handled by overlay now */
    box-shadow: none !important;
    margin: 0 !important;
    padding: 20px !important;
  }

  /* 3. Ensure the close button is easily clickable at the top right */
  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.1);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100000 !important;
  }
  
  .main-stage { padding: 90px 15px 120px; }

  /* Stack Grids */
  .hero-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
  .hero-content h1 { font-size: 2.8rem; }
  .hero-actions { justify-content: center; width: 100%; }
  .hero-actions button { width: 100%; }
  
  /* Show history on mobile */
  .history-sidebar { 
    display: flex;           /* CHANGED from block to flex */
    flex-direction: column;  /* Keeps header at top, list below */
    width: 100%; 
    height: 400px;           /* Fixed height ensures scrolling happens inside */
    margin-top: 30px; 
  }
  .history-item { justify-content: space-between; }
  
  /* Profile Page Stacking */
  .profile-grid-layout { grid-template-columns: 1fr; }
  .form-group-2, .form-group-3 { grid-template-columns: 1fr; }
  
  /* Symptoms Screen */
  .header-row { flex-direction: column; align-items: flex-start; gap: 15px; margin-bottom: 20px; }
  .search-wrapper { width: 100%; }
  .biomarker-grid { grid-template-columns: 1fr 1fr; gap: 10px; } /* 2 Columns on mobile */
  
  /* Results Screen */
  .results-title-row { flex-direction: column; align-items: flex-start; gap: 15px; }
  .export-btn { width: 100%; justify-content: center; margin-top: 10px; }
  .results-grid { grid-template-columns: 1fr; }
  .primary-result { padding: 24px; }
  .primary-result h3 { font-size: 2rem; }
  .side-results { display: grid; grid-template-columns: 1fr; gap: 10px; }
  
  .precautions-section { flex-direction: column; padding: 20px; }
  
  /* Floating Dock */
  .floating-dock { bottom: 20px; width: 94%; padding: 12px; flex-wrap: wrap; gap: 10px; justify-content: center; }
  .dock-stats { width: 100%; text-align: center; margin-bottom: 5px; display: flex; align-items: center; justify-content: center; gap: 10px; }
  .dock-btns { width: 100%; display: grid; grid-template-columns: 1fr 1fr; }
}
  .photo-upload-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.photo-label {
  cursor: pointer;
  display: block;
}

.photo-preview-box {
  width: 120px;       /* Fixed width */
  height: 120px;      /* Fixed height */
  border-radius: 50%; /* Makes it a perfect circle */
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;   /* CRITICAL: Cuts off any part of the image outside the circle */
  transition: 0.3s;
}

.photo-preview-box:hover {
  border-color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* CRITICAL: Scales image to fill box without stretching */
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
  gap: 5px;
  font-size: 0.8rem;
}

.hidden-input {
  display: none;
}
action-bar-static {
    width: 98% !important;       
    max-width: none !important;
    padding: 6px 4px !important; /* Almost zero padding on sides */
    gap: 2px !important;         /* Tiny gap between items */
    bottom: 20px !important;     /* Keep it slightly above bottom edge */
  }

  /* 2. Shrink 'Cancel' to bare minimum */
  .btn-ghost {
    padding: 6px 8px !important;
    font-size: 0.75rem !important;
    letter-spacing: 0 !important;
  }

  /* 3. Aggressively shrink 'Analyze' button */
  .primary-button {
    padding: 8px 12px !important;  /* Very tight padding */
    font-size: 0.8rem !important;
    min-width: 0 !important;       /* Allow it to shrink */
    width: auto !important;
    white-space: nowrap !important;
    letter-spacing: 0 !important;
  }
  
  /* 4. Shrink the Counter in the middle */
  .capsule-stats span:first-child {
    font-size: 1rem !important;
  }
  .capsule-stats span:last-child {
    font-size: 0.5rem !important;
    letter-spacing: 0 !important;
  }
}
`;
