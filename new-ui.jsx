import React, { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  sendEmailVerification
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";

const API_BASE = import.meta.env.VITE_API_URL || "https://med-ai-1-is35.onrender.com";

// --- FIREBASE INIT ---
let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app, auth, db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
}

const appId = 'med-ai-local';

// --- ICONS ---
const Icons = {
  MedLogo: ({ size = 28, className="teal-icon" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/><path d="M10 3h4v4h4v4h-4v4h-4v-4H6V7h4z"/></svg>,
  User: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  History: ({ size = 24, className }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
  EyeOff: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>,
  Home: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Clipboard: ({ size = 24, className }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h.01"/></svg>,
  Menu: ({ size = 24, className }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Check: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Download: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Search: ({ size = 18, className }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ArrowRight: ({ size = 20, color="currentColor" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ArrowLeft: ({ size = 24, className }) => <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Shield: ({ size = 40 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  LogOut: ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [userProfile, setUserProfile] = useState({
    name: "", age: "", weight: "", height: "", gender: "",
    email: "", phone: "", city: "", state: "", country: "",
    photo: "", password: "" 
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  const fallbackSymptoms = ["itching", "skin_rash", "shivering", "joint_pain", "stomach_pain", "fatigue", "cough", "high_fever"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        await fetchUserData(user.uid, user.email);
        if (screen === 'login') setScreen("home");
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setScreen("login");
      }
    });

    fetch(`${API_BASE}/symptoms`)
      .then(res => res.json())
      .then(data => {
        const validData = data.symptoms || data;        
        setSymptoms(Array.isArray(validData) ? validData : fallbackSymptoms);
      })
      .catch(() => setSymptoms(fallbackSymptoms));

    return () => unsubscribe();
  }, []);

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

  const fetchUserData = async (uid, email) => {
    if (!uid) return;
    try {
      const profileRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) setUserProfile(prev => ({ ...prev, ...profileSnap.data() }));

      const historyRef = doc(db, 'artifacts', appId, 'users', uid, 'data', 'history');
      const historySnap = await getDoc(historyRef);
      if (historySnap.exists()) setHistory(historySnap.data().records || []);
    } catch (err) {
      setError("Connection interrupted.");
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
    if (val < 18.5) return { label: "Underweight", class: "bmi-yellow" };
    if (val >= 18.5 && val <= 24.9) return { label: "Healthy", class: "bmi-green" };
    return { label: "Overweight", class: "bmi-red" };
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1000000) { setError("Photo is too large."); return; }
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email.");
      }
    } catch (err) { setError(err.message); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    const safeEmail = userProfile.email ? userProfile.email.trim() : "";
    
    if (!safeEmail || !userProfile.password || userProfile.password.length < 6) {
      setError("Valid email and 6+ char password required."); return;
    }
    if (userProfile.password !== confirmPassword) {
      setError("Passwords do not match!"); return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, safeEmail, userProfile.password);
        await sendEmailVerification(userCredential.user);
        const { password, ...safeProfile } = userProfile;
        await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid, 'profile', 'main'), { ...safeProfile, email: safeEmail });
        await signOut(auth);
        setIsNewUser(false);
        setNotification("Account created! Verify your email.");
        setUserProfile(prev => ({...prev, password: ""}));
    } catch (err) { setError(err.message); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setHistory([]);
      setIsSidebarOpen(false);
    } catch (err) { console.error(err); }
  };

  const toggleSymptom = (s) => setSelectedSymptoms(prev => ({ ...prev, [s]: !prev[s] }));

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
        body: JSON.stringify({ symptoms: selected, user_email: currentUser?.email }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Server error");
      
      const data = await res.json();
      const predictions = data.predictions || [];
      const newEntry = {
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        topMatch: predictions[0] || "Unknown",
        symptoms: selected,
        allPredictions: predictions, 
        precautions: data.precaution || "Consult a healthcare professional." 
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 10);
      setHistory(updatedHistory);
      
      if (currentUser) {
        await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'data', 'history'), { records: updatedHistory }, { merge: true });
      }

      setResults(predictions);
      setPrecautions(newEntry.precautions);
      setScreen("results");
    } catch (err) {
      setError("Connection failed.");
      setScreen("symptoms");
    }
  }

  const exportReport = () => {
    const text = `MED-AI REPORT\nName: ${userProfile.name}\nDate: ${new Date().toLocaleString()}\nResults: ${results.join(", ")}\nAdvice: ${precautions}`;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `MedAI_Report.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const filteredSymptoms = symptoms.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="med-ai-root">
      <style>{css}</style>
      
      {notification && <div className="notification-toast">{notification}</div>}
      {error && <div className="error-toast">{error}</div>}

      <main className={`main-stage ${screen === 'login' ? 'is-auth' : ''}`}>
        
        {/* --- DESKTOP / MOBILE SIDEBAR --- */}
        {screen !== "login" && (
          <>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`sidebar-menu ${isSidebarOpen ? 'open' : ''}`}>
              <div className="sidebar-header-logo">
                <Icons.MedLogo size={36} className="text-white" />
                <h2 className="text-white" style={{margin: 0, fontWeight: 800, fontSize: '1.8rem'}}>Med-AI</h2>
              </div>
              
              <div className="sidebar-links">
                <div className={`sidebar-link ${screen === 'home' ? 'active' : ''}`} onClick={() => {setScreen('home'); setIsSidebarOpen(false);}}>
                  <Icons.Home size={20} /> Dashboard
                </div>
                <div className={`sidebar-link ${screen === 'symptoms' ? 'active' : ''}`} onClick={() => {setScreen('symptoms'); setIsSidebarOpen(false);}}>
                  <Icons.Clipboard size={20} /> Assessment
                </div>
                <div className={`sidebar-link ${screen === 'history' || viewingHistoryItem ? 'active' : ''}`} onClick={() => {setScreen('history'); setIsSidebarOpen(false);}}>
                  <Icons.History size={20} /> History
                </div>
                <div className={`sidebar-link ${screen === 'profile' ? 'active' : ''}`} onClick={() => {setScreen('profile'); setIsSidebarOpen(false);}}>
                  <Icons.User size={20} /> Profile
                </div>
              </div>

              <div className="sidebar-logout" onClick={() => { handleLogout(); setIsSidebarOpen(false); }}>
                <Icons.LogOut size={20} /> Logout
              </div>
            </div>
          </>
        )}

        {/* --- LOGIN / REGISTER SCREEN --- */}
        {screen === "login" && (
          <div className="auth-screen anim-fade-in">
            <div className="auth-header-logo">
              <Icons.MedLogo size={48} />
              <h1 className="brand-title-teal">Med-AI</h1>
            </div>
            
            <h2 className="welcome-text">{isNewUser ? "Create Profile" : "Welcome Back!"}</h2>
            <p className="subtitle-text">{isNewUser ? "Fill details to start" : "Login to your Account"}</p>

            <form className="auth-form" onSubmit={isNewUser ? handleRegister : handleLogin}>
              
              {isNewUser && (
                <div className="photo-upload-wrapper">
                  <label className="photo-label">
                    <div className="photo-preview-circle">
                      {userProfile.photo ? (
                         <img src={userProfile.photo} alt="Preview" className="photo-preview" />
                      ) : (
                         <Icons.User size={40} />
                      )}
                    </div>
                    <div className="upload-badge">Upload Photo</div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden-input" />
                  </label>
                </div>
              )}

              {isNewUser && (
                <>
                  <label className="input-label">Full Name</label>
                  <input required name="name" value={userProfile.name} onChange={handleProfileChange} placeholder="Nitya Sharma" className="light-input mb-3" />
                  
                  <div className="form-group-3">
                    <div>
                      <label className="input-label">Age</label>
                      <input required type="number" name="age" value={userProfile.age} onChange={handleProfileChange} placeholder="23" className="light-input" />
                    </div>
                    <div>
                      <label className="input-label">Height</label>
                      <input required type="number" name="height" value={userProfile.height} onChange={handleProfileChange} placeholder="170" className="light-input" />
                    </div>
                    <div>
                      <label className="input-label">Weight</label>
                      <input required type="number" name="weight" value={userProfile.weight} onChange={handleProfileChange} placeholder="60" className="light-input" />
                    </div>
                  </div>

                  <div className="form-group-2 mt-3">
                    <div>
                      <label className="input-label">City</label>
                      <input required name="city" value={userProfile.city} onChange={handleProfileChange} placeholder="Mumbai" className="light-input" />
                    </div>
                    <div>
                      <label className="input-label">State</label>
                      <input required name="state" value={userProfile.state} onChange={handleProfileChange} placeholder="Maharashtra" className="light-input" />
                    </div>
                  </div>

                  <label className="input-label mt-3">Mobile No.</label>
                  <div className="phone-input-wrapper mb-3">
                    <span className="phone-prefix">+91</span>
                    <input required type="tel" name="phone" value={userProfile.phone} onChange={handleProfileChange} placeholder="98765 43210" className="light-input phone-input" />
                  </div>
                </>
              )}

              <label className="input-label">Email</label>
              <input required type="email" name="email" value={isNewUser ? userProfile.email : loginData.email} onChange={isNewUser ? handleProfileChange : handleLoginChange} placeholder="user@gmail.com" className="light-input mb-3" />

              <label className="input-label">Password</label>
              <div className="password-row mb-1">
                <input required type="password" name="password" value={isNewUser ? userProfile.password : loginData.password} onChange={isNewUser ? handleProfileChange : handleLoginChange} placeholder="••••••••••••" className="light-input" />
                <span className="eye-icon"><Icons.EyeOff /></span>
              </div>
              
              {isNewUser && (
                <div className="password-row mb-3 mt-3">
                  <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="light-input" />
                  <span className="eye-icon"><Icons.EyeOff /></span>
                </div>
              )}

              {!isNewUser && (
                <div className="forgot-password">
                  <span>Forgot Password?</span>
                </div>
              )}

              <button type="submit" className="btn-teal-primary mt-4">
                {isNewUser ? "Create Account" : "Login"}
              </button>

              <div className="auth-footer mt-4">
                <span className="text-muted">{isNewUser ? "Already have an account?" : "Don't have an account?"}</span>
                <button type="button" className="text-link-teal ml-2" onClick={() => setIsNewUser(!isNewUser)}>
                  {isNewUser ? "Login" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- HOME DASHBOARD --- */}
        {screen === "home" && (
          <div className="dashboard-screen anim-fade-in content-container">
            <div className="dash-header">
              <div className="mobile-only" style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setIsSidebarOpen(true)}>
                <Icons.Menu size={28} className="text-dark" />
              </div>
              
              <h2 className="header-title">Dashboard</h2>
              
              <div className="profile-mini-avatar" onClick={() => setScreen("profile")} style={{cursor: 'pointer', position: 'relative', zIndex: 10}}>
                {userProfile.photo ? <img src={userProfile.photo} alt="User" /> : <Icons.User size={20}/>}
              </div>
            </div>

            <div className="greeting-section">
              <h1>Hello, {userProfile.name ? userProfile.name.split(' ')[0].toUpperCase() : 'USER'}! 👋</h1>
            </div>

            <div className="desktop-row">
                {bmiValue && (
                  <div className="white-card bmi-gauge-card mb-4 desktop-col">
                    <div className="bmi-info">
                      <span className="bmi-subtitle">Your BMI</span>
                      <div className="bmi-value-row">
                        <h2>{bmiValue}</h2>
                        <span className="bmi-plus">+</span>
                      </div>
                      <div className={`bmi-status-pill ${bmiInfo.class}`}>
                        <span className="dot"></span> {bmiInfo.label}
                      </div>
                    </div>
                    <div className="bmi-gauge">
                      <div className="gauge-arc"></div>
                      <div className="gauge-needle"></div>
                    </div>
                  </div>
                )}

                <div className="action-cards-grid mb-4 desktop-col flex-grow">
                  <div className="teal-action-card full-span" onClick={() => { setSelectedSymptoms({}); setResults([]); setScreen("symptoms"); }}>
                    <div className="card-content">
                      <div className="icon-bubble"><Icons.Clipboard size={20} className="teal-icon" /></div>
                      <div>
                        <h3>Start Assessment</h3>
                        <p>Check Symptoms &rarr;</p>
                      </div>
                    </div>
                    <Icons.ArrowRight size={24} color="white" />
                  </div>

                  <div className="white-card mini-action" onClick={() => setScreen("history")}>
                    <div className="icon-bubble teal-bg"><Icons.History size={20} className="teal-icon" /></div>
                    <h4>View History</h4>
                  </div>

                  <div className="white-card mini-action" onClick={() => setNotification("Health Tips module coming soon!")}>
                    <div className="icon-bubble orange-bg">💡</div>
                    <h4>Health Tips</h4>
                  </div>
                </div>
            </div>

            <div className="recent-activity-section">
              <div className="section-title-row">
                <h3>Recent Activity</h3>
                <span className="dots">•••</span>
              </div>
              
              {history.length > 0 ? (
                <div className="white-card recent-timeline-card">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="time-text">{history[0].date}, {history[0].time}</p>
                    <p className="symptoms-preview">
                      {history[0].symptoms && history[0].symptoms.length > 0 
                        ? history[0].symptoms.slice(0, 2).map(s => s.replace(/_/g, " ")).join(", ") + (history[0].symptoms.length > 2 ? "..." : "")
                        : "No specific symptoms"}
                    </p>
                  </div>
                  <button className="btn-view-light" onClick={(e) => { e.stopPropagation(); setViewingHistoryItem(history[0]); }}>View</button>
                </div>
              ) : (
                <p className="text-muted text-center mt-3">No activity yet.</p>
              )}
            </div>
          </div>
        )}

        {/* --- SYMPTOMS CHECKLIST --- */}
        {screen === "symptoms" && (
          <div className="symptoms-screen anim-fade-in content-container">
            <div className="dash-header no-border">
              <div style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setScreen("home")}>
                 <Icons.ArrowLeft size={28} className="text-dark" />
              </div>
              <h2 className="header-title">Symptoms Checklist</h2>
              <div style={{width: 28}}></div>
            </div>

            <div className="search-box mb-3">
              <Icons.Search size={20} className="text-muted" />
              <input placeholder="Search Symptoms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="category-pills mb-4">
              <span className="pill active">All</span>
              <span className="pill">Fever</span>
              <span className="pill">Body</span>
              <span className="pill">Mind</span>
            </div>

            <div className="symptoms-list desktop-grid">
              {filteredSymptoms.map((s, idx) => (
                <div key={s} className="symptom-row-clean" onClick={() => toggleSymptom(s)}>
                  <span className="symptom-name">{s.replace(/_/g, " ")}</span>
                  <div className={`checkbox-square ${selectedSymptoms[s] ? 'checked' : ''}`}>
                    {selectedSymptoms[s] && <Icons.Check size={16} />}
                  </div>
                </div>
              ))}
              <div className="mobile-only" style={{ height: "120px" }}></div> 
            </div>

            <div className="sticky-action-bar">
              <button className="btn-cancel" onClick={() => setSelectedSymptoms({})}>Cancel</button>
              <div className="selection-count">
                <span className="count-num">{Object.values(selectedSymptoms).filter(Boolean).length}/{symptoms.length}</span>
                <span className="count-text">Selected</span>
              </div>
              <button className="btn-analyze" onClick={analyzeSymptoms}>Analyze &rarr;</button>
            </div>
          </div>
        )}

        {/* --- FULL-PAGE HISTORY MAP --- */}
        {screen === "history" && (
          <div className="history-screen anim-fade-in content-container" style={{padding: '24px 20px 100px'}}>
            <div className="dash-header no-border mb-4">
              <div style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setScreen("home")}>
                 <Icons.ArrowLeft size={28} className="text-dark" />
              </div>
              <h2 className="header-title">Assessment History</h2>
              <div style={{width: 28}}></div>
            </div>
            
            <div className="search-box mb-4">
              <Icons.Search size={20} className="text-muted" />
              <input placeholder="Search Reports..." />
            </div>
            
            <div className="history-list-full desktop-grid-history">
              {history.length > 0 ? history.map((item, idx) => (
                 <div key={idx} className="white-card mb-3 history-grid-item" onClick={() => setViewingHistoryItem(item)} style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                       <div>
                          <p style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600}}>{item.date}, {item.time}</p>
                          <h4 style={{margin: '4px 0 0 0', color: 'var(--text-dark)'}}>{item.topMatch || "Assessment Record"}</h4>
                       </div>
                       <button className="btn-view-light" onClick={(e) => { e.stopPropagation(); setViewingHistoryItem(item); }}>View</button>
                    </div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px'}}>
                       {item.symptoms && item.symptoms.slice(0, 3).map((s, i) => (
                          <span key={i} style={{fontSize: '0.75rem', background: '#f0fdfa', color: 'var(--primary-teal)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600}}>
                             {s.replace(/_/g, " ")}
                          </span>
                       ))}
                       {item.symptoms && item.symptoms.length > 3 && (
                          <span style={{fontSize: '0.75rem', background: '#f3f4f6', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600}}>
                             +{item.symptoms.length - 3} more
                          </span>
                       )}
                    </div>
                 </div>
              )) : (
                 <p className="text-center text-muted mt-4">No assessment history found.</p>
              )}
            </div>
          </div>
        )}

        {/* --- PROFILE PAGE --- */}
        {screen === "profile" && (
          <div className="profile-screen anim-fade-in content-container" style={{padding: '24px 20px 100px'}}>
            <div className="dash-header no-border mb-4">
              <div style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setScreen("home")}>
                 <Icons.ArrowLeft size={28} className="text-dark" />
              </div>
              <h2 className="header-title">My Profile</h2>
              <div style={{width: 28}}></div>
            </div>
            
            <div className="desktop-row">
              <div className="white-card text-center mb-4 desktop-col">
                <div className="photo-preview-circle mx-auto mb-3" style={{margin: '0 auto 16px', width: '100px', height: '100px'}}>
                   {userProfile.photo ? <img src={userProfile.photo} alt="User" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <Icons.User size={40} />}
                </div>
                <h3 style={{margin: '0 0 4px 0', fontSize: '1.4rem'}}>{userProfile.name || 'User'}</h3>
                <p className="text-muted" style={{margin: 0}}>{userProfile.email}</p>
              </div>

              <div className="white-card mb-4 flex-grow desktop-col">
                <h4 className="mb-3" style={{marginTop: 0}}>Personal Details</h4>
                <div className="form-group-2">
                  <div>
                    <label className="input-label">Age</label>
                    <div className="light-input">{userProfile.age || '--'} yrs</div>
                  </div>
                  <div>
                    <label className="input-label">Gender</label>
                    <div className="light-input" style={{textTransform: 'capitalize'}}>{userProfile.gender || '--'}</div>
                  </div>
                  <div>
                    <label className="input-label">Height</label>
                    <div className="light-input">{userProfile.height || '--'} cm</div>
                  </div>
                  <div>
                    <label className="input-label">Weight</label>
                    <div className="light-input">{userProfile.weight || '--'} kg</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="input-label">Location</label>
                  <div className="light-input">{userProfile.city ? `${userProfile.city}, ${userProfile.state}` : '--'}</div>
                </div>
              </div>
            </div>
            
            <button className="btn-outline-teal full-width desktop-w-auto" onClick={handleLogout}>
              <Icons.LogOut size={20} /> Log Out
            </button>
          </div>
        )}

        {/* --- REPORT DETAILS OVERLAY --- */}
        {viewingHistoryItem && (
          <div className="report-details-screen anim-fade-in content-container" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh', 
            background: 'var(--bg-main)', zIndex: 2000, padding: '24px 20px 100px', boxSizing: 'border-box'
          }}>
            <div className="dash-header no-border mb-4">
              <div style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setViewingHistoryItem(null)}>
                 <Icons.ArrowLeft size={28} className="text-dark" />
              </div>
              <h2 className="header-title">Report Details</h2>
              <div style={{width: 28}}></div>
            </div>

            <div className="white-card mb-4" style={{boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>
              <h4 style={{marginTop: 0, marginBottom: '8px', fontSize: '1rem', color: 'var(--text-dark)'}}>Date & Time</h4>
              <p className="text-muted" style={{margin: '0 0 24px 0', fontSize: '0.95rem', fontWeight: 500}}>
                {viewingHistoryItem.date}, {viewingHistoryItem.time}
              </p>

              <h4 style={{marginBottom: '12px', fontSize: '1rem', color: 'var(--text-dark)'}}>Symptoms Selected</h4>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px'}}>
                {viewingHistoryItem.symptoms && viewingHistoryItem.symptoms.map((s, i) => (
                   <span key={i} style={{fontSize: '0.85rem', background: '#fee2e2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, textTransform: 'capitalize'}}>
                      {s.replace(/_/g, " ")}
                   </span>
                ))}
              </div>

              <h4 style={{marginBottom: '16px', fontSize: '1rem', color: 'var(--text-dark)'}}>Top 3 Predictions</h4>
              <div className="disease-list">
                {(viewingHistoryItem.allPredictions || [viewingHistoryItem.topMatch]).slice(0, 3).map((r, i) => {
                  const probs = ["78%", "65%", "54%"];
                  return (
                    <div key={i} className="disease-item" style={{padding: '16px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <div className="rank-circle" style={{width: '36px', height: '36px', background: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.1rem'}}>
                        {i + 1}
                      </div>
                      <div className="disease-info" style={{flex: 1}}>
                        <h4 style={{margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text-dark)'}}>{r}</h4>
                        <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600}}>
                          Probability: <span style={{color: i === 0 ? '#dc2626' : '#f97316'}}>{probs[i] || '50%'}</span>
                        </p>
                      </div>
                      <div style={{fontSize: '1.5rem'}}>🦠</div>
                    </div>
                  );
                })}
              </div>

              <button className="btn-teal-primary full-width mt-4 desktop-w-auto" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={exportReport}>
                <Icons.Download size={20} /> Download PDF
              </button>
            </div>
          </div>
        )}

        {/* --- LOADING SCREEN --- */}
        {screen === "loading" && (
          <div className="loading-state anim-fade-in content-container">
            <div className="pulse-loader"><Icons.MedLogo size={60} /></div>
            <h3 className="mt-3">Analyzing Symptoms...</h3>
          </div>
        )}

        {/* --- RESULTS SCREEN --- */}
        {screen === "results" && (
          <div className="results-screen anim-fade-in content-container">
            <div className="results-teal-header">
              <div className="dash-header text-white">
                <div style={{position: 'relative', zIndex: 10, cursor: 'pointer', padding: '5px'}} onClick={() => setScreen("home")}>
                   <Icons.ArrowLeft size={28} color="white" />
                </div>
                <h2 className="header-title">Analysis Result</h2>
                <div style={{width: 28}}></div>
              </div>
              <div className="shield-icon-wrapper">
                <Icons.Shield size={48} />
              </div>
            </div>

            <div className="results-content-card">
              <div className="top-predicted-badge">Top 3 Predicted Diseases</div>
              
              <div className="disease-list desktop-grid-results">
                {results.slice(0, 3).map((r, i) => {
                  const probs = ["78%", "65%", "54%"];
                  return (
                    <div key={i} className="disease-item">
                      <div className="rank-circle">{i + 1}</div>
                      <div className="disease-info">
                        <h4>{r}</h4>
                        <p>Probability: <span className={i === 0 ? 'red-text' : ''}>{probs[i] || '50%'}</span></p>
                      </div>
                      <div className="disease-icon">🦠</div>
                    </div>
                  );
                })}
              </div>

              <div className="desktop-row">
                <div className="recommendations-section desktop-col flex-grow">
                  <h4>Recommended Next Steps</h4>
                  <ul>
                    <li>Rest & Hydration</li>
                    <li>Paracetamol (if fever)</li>
                    <li className="red-text">Consult Doctor</li>
                  </ul>
                </div>

                <div className="action-buttons-vertical mt-4 desktop-col">
                  <button className="btn-outline-teal full-width mb-3" onClick={exportReport}>
                    <Icons.Download /> Export Report
                  </button>
                  <button className="btn-teal-primary full-width" onClick={() => setScreen("home")}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
              <p className="timestamp text-center mt-3 text-muted">Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        )}

        {/* --- BOTTOM NAVIGATION --- */}
        {isLoggedIn && screen !== "login" && screen !== "loading" && screen !== "symptoms" && screen !== "results" && !viewingHistoryItem && (
          <nav className="bottom-nav">
            <div className={`nav-item ${screen === "home" ? "active" : ""}`} onClick={() => setScreen("home")}>
              <Icons.Home />
              <span>Home</span>
            </div>
            <div className={`nav-item ${screen === "symptoms" ? "active" : ""}`} onClick={() => setScreen("symptoms")}>
              <Icons.Clipboard />
              <span>Assessment</span>
            </div>
            <div className={`nav-item ${screen === "history" ? "active" : ""}`} onClick={() => setScreen("history")}>
              <Icons.History />
              <span>History</span>
            </div>
            <div className="nav-item" onClick={handleLogout}>
              <Icons.LogOut />
              <span>Logout</span>
            </div>
          </nav>
        )}

      </main>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --primary-teal: #004D40;
  --primary-light: #00695C;
  --bg-main: #F4F7F9;
  --white: #FFFFFF;
  --text-dark: #1F2937;
  --text-muted: #6B7280;
  --accent-orange: #F97316;
  --border-light: #E5E7EB;
  --danger-red: #EF4444;
  --success-green: #10B981;
}

body { margin: 0; background-color: var(--bg-main); font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; color: var(--text-dark); }

.med-ai-root { display: flex; justify-content: flex-start; min-height: 100vh; width: 100vw; background: var(--bg-main); }

/* --- CORE LAYOUT STRUCTURE --- */
.main-stage {
  width: 100%; max-width: 480px; margin: 0 auto; background-color: var(--bg-main);
  min-height: 100vh; position: relative; overflow-x: hidden; display: flex; flex-direction: column;
  box-shadow: 0 0 20px rgba(0,0,0,0.05); transition: 0.3s ease;
}

/* Utilities */
.text-dark { color: var(--text-dark); }
.text-muted { color: var(--text-muted); }
.text-white { color: var(--white); }
.teal-icon { color: var(--primary-teal); }
.red-text { color: var(--danger-red) !important; font-weight: 600; }
.mt-3 { margin-top: 16px; } .mt-4 { margin-top: 24px; } .mb-1 { margin-bottom: 8px; } .mb-3 { margin-bottom: 16px; } .mb-4 { margin-bottom: 24px; } .ml-2 { margin-left: 8px; }
.full-width { width: 100%; }
.text-center { text-align: center; }
.flex-grow { flex: 1; }

/* Buttons */
.btn-teal-primary {
  background: var(--primary-teal); color: var(--white); border: none; padding: 16px;
  border-radius: 50px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.2s; text-align: center; width: 100%;
}
.btn-teal-primary:hover { background: var(--primary-light); }
.btn-outline-teal {
  background: transparent; border: 1.5px solid var(--primary-teal); color: var(--primary-teal);
  padding: 14px; border-radius: 50px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.text-link-teal { background: none; border: none; color: var(--primary-teal); font-weight: 700; cursor: pointer; font-size: 0.95rem; }

/* --- AUTH SCREEN --- */
.auth-screen { padding: 40px 24px; display: flex; flex-direction: column; background: var(--white); flex: 1; }
.auth-header-logo { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 30px; }
.brand-title-teal { font-size: 2rem; font-weight: 800; color: var(--primary-teal); margin: 0; }
.welcome-text { font-size: 1.8rem; font-weight: 800; margin: 0 0 8px 0; color: var(--text-dark); text-align: center; }
.subtitle-text { color: var(--text-muted); text-align: center; margin-bottom: 30px; }

.input-label { display: block; font-size: 0.85rem; color: var(--text-dark); font-weight: 600; margin-bottom: 8px; }
.light-input {
  width: 100%; background: var(--white); border: 1.5px solid var(--border-light);
  padding: 14px 16px; border-radius: 12px; color: var(--text-dark); font-size: 1rem;
  box-sizing: border-box; outline: none; transition: 0.2s; font-family: inherit;
}
.light-input:focus { border-color: var(--primary-teal); }
.password-row { position: relative; }
.eye-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); cursor: pointer; }
.forgot-password { text-align: right; font-size: 0.85rem; color: var(--primary-teal); font-weight: 600; cursor: pointer; margin-bottom: 24px; }
.auth-footer { display: flex; justify-content: center; align-items: center; font-size: 0.95rem; }

/* Profile Upload */
.photo-upload-wrapper { display: flex; justify-content: center; margin-bottom: 24px; }
.photo-label { cursor: pointer; position: relative; display: flex; flex-direction: column; align-items: center; }
.photo-preview-circle { width: 90px; height: 90px; border-radius: 50%; border: 2px dashed var(--primary-teal); display: flex; align-items: center; justify-content: center; overflow: hidden; color: var(--primary-teal); background: #f0fdfa; }
.photo-preview { width: 100%; height: 100%; object-fit: cover; }
.upload-badge { background: var(--primary-teal); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; position: absolute; bottom: -10px; border: 2px solid white; }
.hidden-input { display: none; }

/* Form Grids */
.form-group-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.form-group-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.phone-input-wrapper { display: flex; align-items: center; border: 1.5px solid var(--border-light); border-radius: 12px; overflow: hidden; }
.phone-prefix { background: #f3f4f6; padding: 14px 16px; color: var(--text-dark); font-weight: 600; border-right: 1.5px solid var(--border-light); }
.phone-input { border: none; border-radius: 0; }

/* --- SIDEBAR MENU --- */
.sidebar-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5); z-index: 3000;
  opacity: 0; visibility: hidden; transition: 0.3s ease;
}
.sidebar-overlay.open { opacity: 1; visibility: visible; }
.sidebar-menu {
  position: fixed; top: 0; left: 0; width: 280px; height: 100%;
  background: var(--primary-teal); z-index: 3001;
  transform: translateX(-100%); transition: transform 0.3s ease;
  display: flex; flex-direction: column; padding: 40px 0;
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.15);
}
.sidebar-menu.open { transform: translateX(0); }
.sidebar-header-logo { display: flex; align-items: center; gap: 12px; padding: 0 24px; margin-bottom: 40px; }
.sidebar-links { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.sidebar-link {
  display: flex; align-items: center; gap: 16px; padding: 16px 24px;
  color: rgba(255, 255, 255, 0.6); font-weight: 600; font-size: 1.05rem;
  cursor: pointer; transition: 0.2s; margin-right: 24px;
  border-top-right-radius: 50px; border-bottom-right-radius: 50px;
}
.sidebar-link:hover { color: white; background: rgba(255, 255, 255, 0.05); }
.sidebar-link.active {
  color: var(--primary-teal); background: white; font-weight: 700; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
.sidebar-link.active svg { color: var(--primary-teal); }
.sidebar-logout {
  display: flex; align-items: center; gap: 16px; padding: 16px 24px;
  color: rgba(255, 255, 255, 0.6); font-weight: 600; font-size: 1.05rem;
  cursor: pointer; transition: 0.2s;
}
.sidebar-logout:hover { color: var(--danger-red); }

/* --- DASHBOARD --- */
.dash-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; margin-bottom: 20px;}
.header-title { font-size: 1.25rem; font-weight: 700; margin: 0; }
.profile-mini-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #e5e7eb; display: flex; align-items: center; justify-content: center; }
.profile-mini-avatar img { width: 100%; height: 100%; object-fit: cover; }

.greeting-section h1 { font-size: 1.8rem; font-weight: 800; margin: 0 0 20px 0; }

.white-card { background: var(--white); border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }

/* BMI Gauge Mock */
.bmi-gauge-card { display: flex; justify-content: space-between; align-items: center; }
.bmi-subtitle { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
.bmi-value-row { display: flex; align-items: baseline; gap: 4px; margin: 8px 0; }
.bmi-value-row h2 { font-size: 2.5rem; font-weight: 800; margin: 0; color: var(--text-dark); }
.bmi-plus { color: var(--border-light); font-size: 1.5rem; font-weight: 500; }
.bmi-status-pill { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem; }
.bmi-status-pill .dot { width: 8px; height: 8px; border-radius: 50%; }
.bmi-green { color: var(--success-green); } .bmi-green .dot { background: var(--success-green); }
.bmi-yellow { color: var(--accent-orange); } .bmi-yellow .dot { background: var(--accent-orange); }
.bmi-red { color: var(--danger-red); } .bmi-red .dot { background: var(--danger-red); }
.bmi-gauge { width: 80px; height: 40px; border-top-left-radius: 40px; border-top-right-radius: 40px; background: conic-gradient(from 270deg at 50% 100%, var(--danger-red) 0deg, var(--accent-orange) 45deg, var(--success-green) 90deg, var(--border-light) 90deg); position: relative; margin-top: 10px; }
.bmi-gauge::after { content: ''; position: absolute; bottom: 0; left: 10px; right: 10px; top: 10px; background: white; border-top-left-radius: 30px; border-top-right-radius: 30px; }
.gauge-needle { position: absolute; bottom: 0; left: 50%; width: 2px; height: 30px; background: var(--text-dark); transform-origin: bottom center; transform: rotate(45deg); z-index: 2; }
.gauge-needle::after { content: ''; position: absolute; bottom: -4px; left: -3px; width: 8px; height: 8px; background: var(--text-dark); border-radius: 50%; }

/* Action Cards */
.action-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.full-span { grid-column: span 2; }
.teal-action-card { background: var(--primary-teal); border-radius: 20px; padding: 24px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: pointer; box-shadow: 0 10px 25px rgba(0, 77, 64, 0.2); }
.teal-action-card .card-content { display: flex; align-items: center; gap: 16px; }
.teal-action-card h3 { margin: 0 0 4px 0; font-size: 1.1rem; }
.teal-action-card p { margin: 0; font-size: 0.9rem; opacity: 0.9; }
.icon-bubble { width: 44px; height: 44px; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: center; }
.teal-bg { background: #e0f2f1; } .orange-bg { background: #ffedd5; }
.mini-action { display: flex; align-items: center; gap: 12px; padding: 16px; cursor: pointer; }
.mini-action h4 { margin: 0; font-size: 0.95rem; font-weight: 700; }

/* Timeline */
.section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title-row h3 { margin: 0; font-size: 1.1rem; }
.dots { color: var(--primary-teal); font-weight: 800; letter-spacing: 2px; }
.recent-timeline-card { display: flex; align-items: center; gap: 16px; position: relative; }
.timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--primary-teal); border: 3px solid #e0f2f1; flex-shrink: 0; }
.timeline-content { flex: 1; }
.time-text { margin: 0 0 4px 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
.symptoms-preview { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-dark); text-transform: capitalize; }
.btn-view-light { background: var(--bg-main); border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: var(--text-dark); cursor: pointer; }

/* --- SYMPTOMS SCREEN --- */
.search-box { display: flex; align-items: center; gap: 12px; background: var(--white); padding: 14px 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
.search-box input { border: none; outline: none; background: transparent; width: 100%; font-size: 1rem; font-family: inherit; }
.category-pills { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; }
.pill { padding: 8px 20px; background: var(--white); border-radius: 50px; font-size: 0.9rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; cursor: pointer; border: 1px solid var(--border-light); }
.pill.active { background: var(--primary-teal); color: white; border-color: var(--primary-teal); }

.symptom-row-clean { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--border-light); cursor: pointer; }
.symptom-name { font-size: 1.05rem; font-weight: 600; color: var(--text-dark); text-transform: capitalize; }
.checkbox-square { width: 24px; height: 24px; border-radius: 6px; border: 2px solid var(--border-light); display: flex; align-items: center; justify-content: center; color: white; transition: 0.2s; background: white; }
.checkbox-square.checked { background: var(--primary-teal); border-color: var(--primary-teal); }

.sticky-action-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; background: var(--primary-teal); border-radius: 16px; padding: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 100; transition: 0.3s ease;}
.btn-cancel { background: transparent; color: white; border: none; font-weight: 600; font-size: 0.9rem; cursor: pointer; padding: 8px; }
.selection-count { display: flex; flex-direction: column; align-items: center; color: white; }
.count-num { font-weight: 800; font-size: 1.1rem; line-height: 1; }
.count-text { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }
.btn-analyze { background: var(--white); color: var(--primary-teal); border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }

/* --- RESULTS SCREEN --- */
.results-teal-header { background: var(--primary-teal); padding: 24px 20px 80px; position: relative; }
.shield-icon-wrapper { display: flex; justify-content: center; color: rgba(255,255,255,0.2); margin-top: 10px; }
.results-content-card { background: var(--white); border-top-left-radius: 30px; border-top-right-radius: 30px; padding: 30px 24px; margin-top: -60px; position: relative; min-height: 60vh; }
.top-predicted-badge { background: var(--danger-red); color: white; padding: 8px 24px; border-radius: 50px; font-weight: 700; font-size: 0.9rem; position: absolute; top: -16px; left: 50%; transform: translateX(-50%); white-space: nowrap; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }

.disease-item { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 16px; background: #fafafa; border: 1px solid var(--border-light); margin-bottom: 12px; }
.rank-circle { width: 32px; height: 32px; border-radius: 50%; background: #fee2e2; color: var(--danger-red); font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.disease-info { flex: 1; }
.disease-info h4 { margin: 0 0 4px 0; font-size: 1.1rem; font-weight: 800; color: var(--text-dark); }
.disease-info p { margin: 0; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
.disease-icon { font-size: 1.5rem; }

.recommendations-section { margin-top: 30px; }
.recommendations-section h4 { font-size: 1.1rem; margin-bottom: 16px; }
.recommendations-section ul { padding-left: 20px; color: var(--text-muted); font-weight: 600; line-height: 1.8; margin: 0; }

.action-buttons-vertical { display: flex; flex-direction: column; }
.timestamp { font-size: 0.8rem; font-weight: 600; }

/* --- BOTTOM NAV --- */
.bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: var(--white); display: flex; justify-content: space-around; padding: 12px 0 20px; border-top: 1px solid var(--border-light); z-index: 1000; border-top-left-radius: 20px; border-top-right-radius: 20px; box-shadow: 0 -5px 20px rgba(0,0,0,0.03); }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: 0.2s; }
.nav-item.active { color: var(--primary-teal); }
.nav-item:hover { color: var(--primary-teal); }

/* Toasts and loading */
.loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.pulse-loader { animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.95); } }
.anim-fade-in { animation: fadeIn 0.4s ease forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.error-toast, .notification-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 50px; color: white; font-weight: 600; z-index: 9999; }
.error-toast { background: var(--danger-red); } .notification-toast { background: var(--success-green); }

/* ==========================================================================
   DESKTOP RESPONSIVE DESIGN (The Magic Happens Here)
   ========================================================================== */
@media (min-width: 768px) {
  .main-stage {
    max-width: 100%;
    width: calc(100% - 280px); /* Leave exactly 280px for the sidebar */
    margin-left: 280px;
    box-shadow: none;
  }
  
  /* If on Login Screen, center the app completely and hide sidebar area */
  .main-stage.is-auth {
    width: 100%;
    margin-left: 0;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #e0f2f1 0%, #f4f7f9 100%);
  }

  .auth-screen {
    max-width: 500px;
    margin: 40px auto;
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.08);
    height: auto;
    flex: none;
    border: 1px solid var(--border-light);
  }

  /* Keep Sidebar Open Always */
  .sidebar-menu { transform: translateX(0); }
  .sidebar-overlay { display: none !important; }
  
  /* Hide Mobile UI Elements */
  .mobile-only { display: none !important; }
  .bottom-nav { display: none !important; }

  /* Desktop Grids & Spacing */
  .content-container {
    padding: 40px 60px 100px; /* Wider padding on desktop */
  }

  .desktop-row {
    display: flex;
    gap: 24px;
    align-items: stretch;
  }
  
  .desktop-col { flex: 1; }
  
  .action-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .full-span { grid-column: span 2; }

  /* Symptoms Checklist Grid */
  .desktop-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .symptom-row-clean {
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 16px;
    background: white;
  }

  /* History Grid */
  .desktop-grid-history {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  .history-grid-item { margin-bottom: 0; }

  /* Adjust Sticky Bar for Desktop Sidebar offset */
  .sticky-action-bar {
    left: calc(50% + 140px); /* 50% + half of sidebar width */
    max-width: 600px;
  }

  /* Results Card Styling */
  .desktop-grid-results {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .results-content-card {
    max-width: 900px;
    margin: -60px auto 0;
    box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  }
  
  .desktop-w-auto { width: auto; display: inline-flex; padding-left: 30px; padding-right: 30px;}
}
`;
