import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    GraduationCap, 
    User, 
    Lock, 
    ArrowRight, 
    Eye, 
    EyeOff, 
    Sparkles, 
    CheckCircle2, 
    Users, 
    ShieldCheck,
    KeyRound
} from "lucide-react";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e?.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/login",
                null,
                {
                    params: {
                        username: username,
                        password: password,
                    },
                }
            );

            const token = response.data.access_token;
            const user = response.data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "student") {
                window.location.href = "/student";
            } else if (user.role === "parent") {
                window.location.href = "/parent";
            } else if (user.role === "teacher") {
                window.location.href = "/teacher";
            } else if (user.role === "principal") {
                window.location.href = "/principal";
            } else {
                alert("Unknown user role");
            }

        } catch (err) {
            console.error("Login error:", err);
            setError(
                err.response?.data?.detail ||
                "Invalid credentials. Please verify your username and password."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (demoUser, demoPass) => {
        setUsername(demoUser);
        setPassword(demoPass);
    };

    return (
        <div className="auth-page-bg">
            {/* Background Ambient Glow Circles */}
            <div className="ambient-glow-1"></div>
            <div className="ambient-glow-2"></div>

            {/* Central Modern Glass Container */}
            <div className="auth-modern-container animate-fade-in">
                
                {/* Left Side: Hero Presentation Panel */}
                <div className="auth-hero-panel">
                    <div className="hero-brand-header">
                        <div className="hero-brand-badge">
                            <div className="hero-logo-box">
                                <GraduationCap size={24} />
                            </div>
                            <span className="hero-brand-text">
                                XYZ <span>AI</span>
                            </span>
                        </div>

                        <div className="hero-chip-tag">
                            <Sparkles size={14} style={{ color: 'var(--primary-orange)' }} />
                            <span>Smart Education Platform</span>
                        </div>
                    </div>

                    {/* Hero Illustration & Floating Badges */}
                    <div className="hero-illustration-wrapper">
                        <div className="floating-stat-badge badge-top-left">
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.2)', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>AI Attendance</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF' }}>Real-time Tracking</div>
                            </div>
                        </div>

                        <img 
                            src="/ai_hero.png" 
                            alt="AI Education Platform" 
                            className="hero-img-banner"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />

                        <div className="floating-stat-badge badge-bottom-right">
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255, 122, 0, 0.2)', color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Gemini AI Engine</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF' }}>Target Goal Calculations</div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Text */}
                    <div className="hero-text-block">
                        <h1 className="hero-main-heading">
                            Smart Attendance.<br />
                            <span>Smarter Education.</span>
                        </h1>
                        <p className="hero-sub-text">
                            An AI-powered school attendance and communication assistant connecting students, parents, teachers and administrators seamlessly.
                        </p>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} />
                        <span>Secure JWT Encrypted Authentication</span>
                    </div>
                </div>

                {/* Right Side: Form Card Panel */}
                <div className="auth-form-panel">
                    <div className="form-header-title">Welcome Back 👋</div>
                    <div className="form-header-subtitle">Sign in to access your XYZ AI Assistant Dashboard</div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Quick Demo Fill Pill Bar (Helpful during presentation/testing) */}
                    <div className="demo-credentials-bar">
                        <div className="demo-title">
                            <KeyRound size={14} />
                            <span>Quick Demo Auto-Fill</span>
                        </div>
                        <div className="demo-chips-grid">
                            <button 
                                type="button" 
                                className="demo-chip-btn"
                                onClick={() => handleQuickFill("student1", "pass123")}
                            >
                                🎓 Student
                            </button>
                            <button 
                                type="button" 
                                className="demo-chip-btn"
                                onClick={() => handleQuickFill("parent1", "pass123")}
                            >
                                👨‍👩‍👧 Parent
                            </button>
                            <button 
                                type="button" 
                                className="demo-chip-btn"
                                onClick={() => handleQuickFill("teacher1", "pass123")}
                            >
                                👩‍🏫 Teacher
                            </button>
                            <button 
                                type="button" 
                                className="demo-chip-btn"
                                onClick={() => handleQuickFill("principal1", "pass123")}
                            >
                                🏫 Principal
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>Username</label>
                            <div className="input-with-icon">
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <User size={18} className="input-icon-left" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '28px' }}>
                            <label>Password</label>
                            <div className="input-with-icon">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Lock size={18} className="input-icon-left" />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-submit-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="register-section-wrapper">
                        <div className="register-section-title">Don't have an account? Register below:</div>
                        <div className="register-options-grid">
                            <button
                                type="button"
                                className="reg-card-btn"
                                onClick={() => navigate("/register/student")}
                            >
                                <GraduationCap size={18} style={{ color: 'var(--primary-orange)' }} />
                                <span>Student</span>
                            </button>

                            <button
                                type="button"
                                className="reg-card-btn"
                                onClick={() => navigate("/register/parent")}
                            >
                                <Users size={18} style={{ color: 'var(--primary-orange)' }} />
                                <span>Parent</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;