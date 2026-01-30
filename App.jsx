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
 * MED-AI: PERSONALIZED EDITION (V6.5 - Secure Config)
 * - Updated: Replaced hardcoded credentials with Environment Variables.
 * - Logic/UI: Unchanged from your V5.9 version.
 */

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
// This enables you to use a .env file locally while keeping secrets hidden on GitHub
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

// Use standard singleton pattern to prevent 'configuration-not-found' errors on reload
let app;
let auth;
let db;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  // This prevents the white screen by logging the error instead of crashing entirely,
  // though auth features will obviously not work without valid config.
}

// Use global env var if available (Canvas env), else default. 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'med-ai-local';

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
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  )
};

// --- NEW HISTORY REPORT MODAL ---
const HistoryModal = ({ item, onClose }) => {
  if (!item) return null;
  
  // Handle legacy data that might not have these fields
  const predictions = item.allPredictions || [item.topMatch];
  const prec = item.precautions || "No detailed precautions archived for this record.";
  const syms = item.symptoms || [];

  return (
    <div className="otp-overlay" onClick={onClose}>
      <div className="otp-card anim-fade" style={{maxWidth: '600px', textAlign: 'left', maxHeight: '80vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
           <h3 style={{margin:0, fontSize: '1.5rem'}}>Assessment Report</h3>
           <button onClick={onClose} style={{background:'none', border:'none', color:'#94A3B8', fontSize:'24px', cursor:'pointer', lineHeight: 1}}>&times;</button>
        </div>
        
        <div style={{marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px'}}>
            <div style={{color: '#2DD4BF', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px'}}>DATE & TIME</div>
            <div style={{color: '#E2E8F0', fontSize: '14px'}}>{item.date} at {item.time}</div>
        </div>

        <div style={{marginBottom: '25px'}}>
             <div style={{color: '#2DD4BF', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom:'12px'}}>TOP 3 DISEASE INDICATIONS</div>
             {predictions.slice(0,3).map((p, i) => (
                 <div key={i} style={{marginBottom:'8px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '8px', borderRadius: '8px'}}>
                    <span style={{color: '#64748B', fontWeight: 'bold'}}>#{i+1}</span>
                    <strong style={{color: '#F8FAFC'}}>{p}</strong>
                 </div>
             ))}
        </div>

        <div style={{marginBottom: '25px'}}>
             <div style={{color: '#2DD4BF', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom:'12px'}}>SYMPTOMS REPORTED</div>
             <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                {syms.map((s, i) => (
                    <span key={i} style={{background:'rgba(45, 212, 191, 0.1)', color:'#2DD4BF', padding:'6px 12px', borderRadius:'100px', fontSize:'12px', fontWeight: '600'}}>{s.replace(/_/g, ' ')}</span>
                ))}
             </div>
        </div>

        <div style={{marginBottom: '25px', background: 'rgba(245, 158, 11, 0.1)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #F59E0B'}}>
            <div style={{color: '#F59E0B', fontSize: '11px', fontWeight: '800', letterSpacing: '1px', marginBottom:'8px'}}>MEDICAL PRECAUTIONS & ADVICE</div>
            <p style={{fontSize:'14px', color:'#E2E8F0', lineHeight:'1.6', margin: 0, whiteSpace: 'pre-line'}}>{prec}</p>
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
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null); // State for modal
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

    fetch("http://127.0.0.1:8000/symptoms")
      .then(res => res.json())
      .then(data => setSymptoms(data.symptoms || fallbackSymptoms))
      .catch(() => setSymptoms(fallbackSymptoms));

    return () => unsubscribe();
  }, [screen]);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- FIRESTORE HELPERS ---
  const fetchUserData = async (uid, email) => {
    if (!uid) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setUserProfile(prev => ({ ...prev, ...profileSnap.data() }));
      } else {
        console.log("Profile missing, attempting auto-recovery...");
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
    return { label: "Overweight", color: "#000000", class: "bmi-black" };
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
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(prev => ({ ...prev, photo: reader.result }));
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
        // Create user directly in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, safeEmail, userProfile.password);
        const uid = userCredential.user.uid;
        
        // Create DB docs
        const { password, ...safeProfile } = userProfile;
        const profileToSave = { ...safeProfile, email: safeEmail };
        
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main'), profileToSave);
        await setDoc(doc(db, 'artifacts', appId, 'users', uid, 'data', 'history'), { records: [] });
        
        setIsNewUser(false);
        setNotification("Account created! Please log in.");
        // Clear password from profile state for security
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
      if (err.code === 'auth/wrong-password') {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to change password: " + err.message);
      }
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
      const res = await fetch("http://127.0.0.1:8000/predict", {
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
        allPredictions: predictions, // STORED FOR HISTORY DETAILS
        precautions: precautionText // STORED FOR HISTORY DETAILS
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
      
      {notification && <div className="notification-toast">{notification}</div>}

      {/* History Details Modal */}
      {viewingHistoryItem && (
        <HistoryModal 
            item={viewingHistoryItem} 
            onClose={() => setViewingHistoryItem(null)} 
        />
      )}

      <nav className="top-nav">
        <div className="nav-container">
          <div className="brand" onClick={() => setScreen(isLoggedIn ? "home" : "login")}>
            <div className="icon-box"><Icons.Pulse /></div>
            <span className="main-logo">MED-AI</span>
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
                <div className="profile-dropdown anim-fade">
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
          <div className="login-section anim-fade">
            <div className="form-header">
              <h2>{isNewUser ? "Join Med-AI" : "Clinical Access"}</h2>
              <p>{isNewUser ? "Register to start." : "Enter credentials."}</p>
            </div>

            {error && <div className="error-bar">{error}</div>}

            {!isNewUser ? (
              <form className="profile-form" onSubmit={handleLogin}>
                <div className="form-row full">
                  <label>Email</label>
                  <input required name="email" value={loginData.email} onChange={handleLoginChange} placeholder="Email" />
                </div>
                <div className="form-row full">
                  <label>Password</label>
                  <input required type="password" name="password" value={loginData.password} onChange={handleLoginChange} placeholder="••••••••" />
                </div>
                <button type="submit" className="primary-button full-width">Login</button>
                <div className="form-footer" style={{justifyContent: 'center'}}>
                  <button type="button" className="text-link" onClick={() => setIsNewUser(true)}>New Profile</button>
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
                        <div className="photo-placeholder"><Icons.Camera /><span>Upload Photo</span></div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                  </label>
                </div>

                <div className="form-row full">
                  <label>Full Name</label>
                  <input required name="name" value={userProfile.name} onChange={handleProfileChange} placeholder="Name" />
                </div>
                <div className="form-group-2">
                  <div className="form-row">
                    <label>Gender</label>
                    <select name="gender" value={userProfile.gender} onChange={handleProfileChange} className="select-input">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Clinical Email</label>
                    <input required type="email" name="email" value={userProfile.email} onChange={handleProfileChange} placeholder="Email" />
                  </div>
                </div>
                <div className="form-row full">
                  <label>Set Password</label>
                  <input required type="password" name="password" value={userProfile.password} onChange={handleProfileChange} placeholder="••••••••" />
                  <p style={{fontSize: '11px', color: '#F59E0B', marginTop: '5px', fontWeight: 'bold'}}>
                      ⚠️ Please remember your password; you cannot recover it later.
                  </p>
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
                <button type="submit" className="primary-button full-width">Initialize Profile</button>
                <button type="button" className="text-link center" onClick={() => setIsNewUser(false)}>Back to Login</button>
              </form>
            )}
          </div>
        )}

        {/* PROFILE MANAGEMENT SCREEN */}
        {screen === "profile" && (
          <div className="login-section anim-fade" style={{maxWidth: "800px"}}>
            <div className="form-header">
              <h2>My Profile</h2>
              <p>Manage your clinical identity and security settings.</p>
            </div>

            {error && <div className="error-bar">{error}</div>}

            <div className="profile-grid-layout">
              {/* Left Column: Details Edit */}
              <div className="profile-edit-column">
                <h3>Personal Details</h3>
                <form className="profile-form" onSubmit={handleUpdateProfile}>
                  <div className="photo-upload-container">
                    <label className="photo-label">
                      <div className="photo-preview-box">
                        {userProfile.photo ? (
                          <img src={userProfile.photo} alt="Preview" className="photo-preview" />
                        ) : (
                          <div className="photo-placeholder"><Icons.Camera /><span>Update Photo</span></div>
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
                  <button type="submit" className="primary-button full-width">Save Changes</button>
                </form>
              </div>

              {/* Right Column: Password Change */}
              <div className="password-change-column">
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

                <div style={{marginTop: "30px"}}>
                  <button type="button" className="text-link" onClick={() => setScreen("home")}>&larr; Back to Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOME SCREEN */}
        {screen === "home" && (
          <div className="screen-home anim-fade">
            <div className="hero-grid">
              <div className="hero-content">
                <div className="mini-badge">NEURAL VERSION 5.7</div>
                <h1>Advanced <br/>Personal Analysis<span>.</span></h1>
                <p>Personalized medical pattern identifying engine. Connected as <strong>{userProfile.name}</strong>.</p>
                
                {bmiValue && (
                  <div className={`bmi-mini-card ${bmiInfo.class}`}>
                    <Icons.Scale />
                    <span>Your Clinical BMI: <strong>{bmiValue}</strong> ({bmiInfo.label})</span>
                  </div>
                )}

                <div className="hero-actions">
                  <button className="primary-button" onClick={() => setScreen("symptoms")}>Start New Assessment</button>
                </div>
              </div>
              
              <div className="history-sidebar">
                <div className="sidebar-header"><Icons.History /><span>Assessment History</span></div>
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <div key={idx} className="history-item" onClick={() => setViewingHistoryItem(item)} style={{cursor: 'pointer'}}>
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

            <div className="precautions-section">
              <h3>General Precautions & Guidance</h3>
              <p>{precautions}</p>
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
.med-ai-root { all: unset; display: block; background: #0F172A; color: #F8FAFC; min-height: 100vh; width: 100vw; font-family: 'Inter', system-ui, sans-serif; overflow-x: hidden; position: relative; box-sizing: border-box; }
.med-ai-root * { box-sizing: border-box; }
.top-nav { position: fixed; top: 0; width: 100%; z-index: 1000; display: flex; justify-content: center; padding: 20px; }
.nav-container { width: 100%; max-width: 1200px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; position: relative; }
.brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.icon-box { background: #2DD4BF; padding: 8px; border-radius: 10px; color: #0F172A; display: flex; }
.main-logo { font-weight: 900; font-size: 1.2rem; letter-spacing: -1px; }
.profile-nav-section { position: relative; }
.user-indicator { width: 40px; height: 40px; border-radius: 12px; border: 2px solid rgba(45, 212, 191, 0.2); cursor: pointer; overflow: hidden; transition: 0.3s; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); }
.user-indicator:hover, .user-indicator.active { border-color: #2DD4BF; background: rgba(45, 212, 191, 0.1); }
.nav-profile-img { width: 100%; height: 100%; object-fit: cover; }
.nav-profile-placeholder { color: #94A3B8; }
.profile-dropdown { position: absolute; top: 60px; right: 0; width: 320px; background: #1E293B; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); padding: 24px; z-index: 1001; }
.dropdown-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.header-photo { width: 60px; height: 60px; border-radius: 16px; overflow: hidden; background: #0F172A; border: 1px solid rgba(45, 212, 191, 0.3); }
.header-photo img { width: 100%; height: 100%; object-fit: cover; }
.placeholder-icon { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #64748B; }
.header-info { display: flex; flex-direction: column; gap: 4px; }
.header-info .name { font-weight: 800; font-size: 1.1rem; color: #FFF; }
.header-info .email { font-size: 12px; color: #94A3B8; }
.dropdown-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0 -24px 20px -24px; }
.dropdown-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-item .label { font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; }
.stat-item .value { font-weight: 900; font-size: 14px; }
.dropdown-details { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.detail-row { font-size: 13px; color: #CBD5E1; }
.detail-row span { color: #64748B; font-weight: 700; width: 80px; display: inline-block; }
.logout-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; background: rgba(239, 68, 68, 0.1); color: #EF4444; font-weight: 800; font-size: 13px; cursor: pointer; transition: 0.3s; }
.logout-btn:hover { background: rgba(239, 68, 68, 0.2); }
.menu-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; background: transparent; color: #FFF; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; justify-content: center; }
.menu-btn:hover { background: rgba(255,255,255,0.05); }
.main-stage { max-width: 1200px; margin: 0 auto; padding: 120px 24px 60px 24px; }
.login-section { max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 40px; }
.form-header { margin-bottom: 30px; text-align: center; }
.form-header h2 { font-size: 2.5rem; font-weight: 900; margin-bottom: 8px; }
.form-header p { color: #64748B; font-weight: 500; }
.error-bar { background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; color: #EF4444; padding: 12px; border-radius: 12px; font-size: 12px; font-weight: 700; margin-bottom: 20px; text-align: center; }
.form-footer { display: flex; justify-content: space-between; margin-top: 15px; }
.text-link { background: none; border: none; color: #94A3B8; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: underline; }
.text-link:hover { color: #2DD4BF; }
.text-link.center { width: 100%; text-align: center; margin-top: 20px; }
.photo-upload-container { display: flex; justify-content: center; margin-bottom: 30px; }
.photo-label { cursor: pointer; }
.photo-preview-box { width: 100px; height: 100px; border-radius: 50%; border: 2px dashed rgba(45, 212, 191, 0.5); overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.5); transition: 0.3s; }
.photo-preview-box:hover { border-color: #2DD4BF; background: rgba(45, 212, 191, 0.05); }
.photo-preview { width: 100%; height: 100%; object-fit: cover; }
.photo-placeholder { display: flex; flex-direction: column; align-items: center; color: #94A3B8; font-size: 10px; font-weight: 700; gap: 5px; }
.hidden-input { display: none; }
.profile-form { display: flex; flex-direction: column; gap: 20px; }
.form-row { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.form-row label { font-size: 11px; font-weight: 800; color: #2DD4BF; text-transform: uppercase; letter-spacing: 1px; }
.form-row input, .select-input { background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #FFF; font-weight: 600; font-size: 14px; width: 100%; }
.form-row input:focus, .select-input:focus { outline: none; border-color: #2DD4BF; box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1); }
.form-group-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 100%; }
.form-group-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; width: 100%; }
.full-width { width: 100%; margin-top: 10px; }
.hero-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
h1 { font-size: 5rem; font-weight: 900; line-height: 0.95; margin: 0 0 20px 0; }
h1 span { color: #2DD4BF; }
.mini-badge { display: inline-block; padding: 4px 12px; background: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.2); border-radius: 100px; color: #2DD4BF; font-size: 10px; font-weight: 800; margin-bottom: 20px; }
.hero-content p { color: #94A3B8; font-size: 1.2rem; margin-bottom: 30px; }
.bmi-mini-card { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 12px; margin-bottom: 30px; width: fit-content; font-size: 14px; font-weight: 600; }
.bmi-yellow { background: rgba(234, 179, 8, 0.1); border: 2px solid #EAB308; color: #EAB308; }
.bmi-green { background: rgba(34, 197, 94, 0.1); border: 2px solid #22C55E; color: #22C55E; }
.bmi-black { background: rgba(0, 0, 0, 0.4); border: 2px solid #FFF; color: #FFF; }
.bmi-badge { padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.history-sidebar { background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 30px; padding: 30px; }
.sidebar-header { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 0.9rem; color: #2DD4BF; text-transform: uppercase; margin-bottom: 20px; }
.history-item { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.history-date { font-size: 10px; color: #64748B; margin-bottom: 4px; }
.history-result { font-weight: 700; color: #F8FAFC; }
.primary-button { background: #FFF; color: #0F172A; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 800; cursor: pointer; transition: 0.3s; }
.primary-button:hover { background: #2DD4BF; transform: translateY(-2px); }
.biomarker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 60vh; overflow-y: auto; padding-right: 10px; padding-bottom: 20px; }
.marker-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 12px; }
.marker-card.selected { background: #2DD4BF; color: #0F172A; }
.btn-action { background: linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%); color: #0F172A; padding: 14px 28px; border-radius: 14px; border: none; font-weight: 900; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(45, 212, 191, 0.3); }
.outline-btn { background: #334155; color: #F8FAFC; border: none; padding: 14px 28px; border-radius: 14px; cursor: pointer; margin-top: 20px; font-weight: 800; transition: 0.3s; }
.floating-dock { margin: 30px auto 0 auto; background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(10px); padding: 16px 24px; border-radius: 20px; border: 1px solid rgba(45, 212, 191, 0.2); display: flex; align-items: center; gap: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 100; width: 100%; max-width: 500px; justify-content: space-between; }
.dock-stats { display: flex; flex-direction: column; }
.count { font-size: 24px; font-weight: 900; color: #FFF; line-height: 1; }
.label { font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 700; }
.dock-btns { display: flex; gap: 10px; }
.btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #94A3B8; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-secondary:hover { border-color: #2DD4BF; color: #FFF; }
.results-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin: 40px 0; }
.primary-result { background: rgba(30, 41, 59, 0.5); border: 2px solid #2DD4BF; padding: 40px; border-radius: 40px; }
.result-clinical-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.primary-result h3 { font-size: 4rem; font-weight: 900; margin: 0 0 20px 0; font-style: italic; text-transform: uppercase; }
.precautions-section { background: rgba(255, 255, 255, 0.05); border-left: 4px solid #F59E0B; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
.precautions-section h3 { color: #F59E0B; margin: 0 0 10px 0; font-size: 1.2rem; }
.precautions-section p { color: #E2E8F0; margin: 0; line-height: 1.5; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.anim-fade { animation: fadeIn 0.4s ease forwards; }
.neural-spinner { position: relative; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; color: #2DD4BF; margin-bottom: 24px; }
.ring { position: absolute; width: 100%; height: 100%; border: 3px solid rgba(45, 212, 191, 0.1); border-top-color: #2DD4BF; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.otp-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.otp-card { background: #1E293B; padding: 40px; border-radius: 24px; text-align: center; border: 1px solid #2DD4BF; width: 90%; max-width: 400px; }
.otp-input { font-size: 24px; letter-spacing: 5px; text-align: center; width: 100%; margin: 20px 0; }
.notification-toast { position: fixed; top: 20px; right: 20px; background: #2DD4BF; color: #000; padding: 15px 25px; border-radius: 10px; font-weight: bold; z-index: 3000; animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.profile-grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
.password-change-column { background: rgba(0,0,0,0.2); padding: 30px; border-radius: 30px; height: fit-content; }
`;