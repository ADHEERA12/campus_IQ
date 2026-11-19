import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChat from "../components/AIChat";
import { 
    Award, 
    BookOpen, 
    CalendarX, 
    Target, 
    RefreshCw, 
    CheckCircle2, 
    AlertTriangle,
    Calculator,
    Sparkles
} from "lucide-react";

function StudentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [target, setTarget] = useState("");
    const [goalResult, setGoalResult] = useState(null);
    const [goalLoading, setGoalLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            navigate("/");
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            if (parsedUser.role !== "student") {
                navigate("/dashboard");
                return;
            }

            loadAttendance();
        } catch (e) {
            console.error(e);
            navigate("/");
        }
    }, [navigate]);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/attendance/my");
            setAttendance(response.data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load attendance"
            );
        } finally {
            setLoading(false);
        }
    };

    const calculateGoal = async (e) => {
        e.preventDefault();

        if (!target) return;

        try {
            setGoalLoading(true);
            setGoalResult(null);
            setError("");

            const response = await api.post("/chat", {
                message: `I want to reach ${target}% attendance. Calculate how many classes I need to attend.`
            });

            setGoalResult(response.data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to calculate attendance goal"
            );
        } finally {
            setGoalLoading(false);
        }
    };

    const getStatusInfo = (percentage) => {
        const val = Number(percentage) || 0;
        if (val >= 85) {
            return { label: "Good Standing", type: "badge-success", color: "var(--success-green)" };
        } else if (val >= 75) {
            return { label: "Average", type: "badge-warning", color: "var(--warning-yellow)" };
        } else {
            return { label: "Low Standing", type: "badge-danger", color: "var(--error-red)" };
        }
    };

    if (loading && !attendance) {
        return (
            <div className="app-container">
                <Navbar user={user} />
                <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
                    <LoadingSpinner message="Loading your student overview..." orange={true} />
                </div>
            </div>
        );
    }

    const percentageVal = attendance?.attendance_percentage || 0;
    const statusObj = getStatusInfo(percentageVal);

    return (
        <div className="app-container">
            <Navbar user={user} />

            <main className="dashboard-container animate-fade-in">
                {/* Header Greeting */}
                <header className="dashboard-header">
                    <div>
                        <h1>Good Morning, {user?.name || "Student"} 👋</h1>
                        <p>Here is your personal attendance breakdown and AI learning assistant.</p>
                    </div>

                    <button 
                        type="button" 
                        onClick={loadAttendance} 
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? "spinner-orange" : ""} />
                        <span>{loading ? "Refreshing..." : "Refresh Stats"}</span>
                    </button>
                </header>

                {error && (
                    <div className="alert alert-error">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Top Statistics Cards */}
                <div className="stats-grid">
                    <StatCard
                        title="Attendance Percentage"
                        value={`${percentageVal}%`}
                        icon={Award}
                        subtext={`Student ID: ${attendance?.student_id || 'N/A'}`}
                        statusBadge={<span className={`badge ${statusObj.type}`}>{statusObj.label}</span>}
                        accentColor="var(--primary-orange)"
                    />
                    
                    <StatCard
                        title="Classes Attended"
                        value={attendance?.classes_attended ?? 42}
                        icon={BookOpen}
                        subtext="Total attended this term"
                        accentColor="#16A34A"
                    />

                    <StatCard
                        title="Classes Missed"
                        value={attendance?.classes_missed ?? 9}
                        icon={CalendarX}
                        subtext="Absent days record"
                        accentColor="#DC2626"
                    />

                    <StatCard
                        title="Academic Standing"
                        value={statusObj.label}
                        icon={CheckCircle2}
                        subtext="Based on school threshold (85%)"
                        accentColor="var(--dark-navy)"
                    />
                </div>

                {/* Main Content Layout */}
                <div className="dashboard-grid">
                    {/* Left Column: Detailed Attendance & Goal Planner */}
                    <div>
                        {/* Attendance Overview Card with Circular Gauge */}
                        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
                            <ProgressRing percentage={percentageVal} size={170} strokeWidth={14} label="Current" />
                            
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-orange-light)', color: 'var(--primary-orange)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '12px' }}>
                                    <Sparkles size={14} />
                                    <span>Target Goal Tracking</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', color: 'var(--dark-navy)', marginBottom: '8px' }}>My Attendance Overview</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Keep your overall percentage above <strong>85%</strong> to maintain good academic standing and qualify for final examinations.
                                </p>
                                <div style={{ background: 'var(--bg-soft-gray)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--dark-navy)' }}>Target Goal</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-orange)' }}>85.0%</span>
                                </div>
                            </div>
                        </div>

                        {/* Goal Calculator Card */}
                        <div className="dashboard-card">
                            <h2>
                                <Calculator size={22} style={{ color: 'var(--primary-orange)' }} />
                                <span>🎯 Attendance Goal Planner</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '20px' }}>
                                Find out how many upcoming classes you need to attend consecutively to achieve your desired target attendance.
                            </p>

                            <form onSubmit={calculateGoal} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label>Target Attendance %</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        step="0.01"
                                        placeholder="Example: 85"
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value)}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={goalLoading}
                                    style={{ height: '45px' }}
                                >
                                    {goalLoading ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="spinner"></span>
                                            <span>Calculating...</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Target size={16} />
                                            <span>Calculate Goal</span>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Result Card */}
                            {goalResult && (
                                <div 
                                    className="animate-fade-in"
                                    style={{ 
                                        background: 'var(--primary-orange-light)', 
                                        border: '1px solid rgba(255, 122, 0, 0.25)', 
                                        borderRadius: 'var(--radius-md)', 
                                        padding: '20px' 
                                    }}
                                >
                                    <h4 style={{ color: 'var(--dark-navy)', fontSize: '1rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Sparkles size={18} style={{ color: 'var(--primary-orange)' }} />
                                        <span>AI Calculation Result</span>
                                    </h4>
                                    <p style={{ color: 'var(--dark-navy)', fontSize: '0.95rem', marginBottom: '14px' }}>
                                        {goalResult.message}
                                    </p>

                                    {goalResult.data && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 122, 0, 0.2)' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current %</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dark-navy)' }}>{goalResult.data.current_percentage}%</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target %</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary-orange)' }}>{goalResult.data.target_percentage}%</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classes Needed</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16A34A' }}>{goalResult.data.classes_needed} classes</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI Assistant Component */}
                    <div>
                        <AIChat 
                            title="🤖 XYZ AI Assistant" 
                            subtitle="Ask about attendance rules, required classes, or academic status." 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default StudentDashboard;