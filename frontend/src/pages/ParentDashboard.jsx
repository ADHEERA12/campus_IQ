import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChat from "../components/AIChat";
import { 
    UserCheck, 
    Award, 
    PhoneCall, 
    Target, 
    RefreshCw, 
    AlertCircle, 
    Sparkles, 
    Send,
    Bot,
    MessageSquare,
    CheckCircle2
} from "lucide-react";

function ParentDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Child state
    const [child, setChild] = useState(null);
    const [childLoading, setChildLoading] = useState(true);
    const [childError, setChildError] = useState("");

    // Goal state
    const [targetPercentage, setTargetPercentage] = useState("");
    const [goalResult, setGoalResult] = useState(null);
    const [goalLoading, setGoalLoading] = useState(false);
    const [goalError, setGoalError] = useState("");

    // Escalation state
    const [reason, setReason] = useState("");
    const [escalationResult, setEscalationResult] = useState(null);
    const [escalationLoading, setEscalationLoading] = useState(false);
    const [escalationError, setEscalationError] = useState("");

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

            if (parsedUser.role !== "parent") {
                navigate("/dashboard");
                return;
            }

            loadChildAttendance();
        } catch (err) {
            console.error("Invalid user data:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
        }
    }, [navigate]);

    const loadChildAttendance = async () => {
        try {
            setChildLoading(true);
            setChildError("");

            const response = await api.get("/attendance/child");
            setChild(response.data);
        } catch (err) {
            console.error("Child attendance error:", err);
            setChildError(
                err.response?.data?.detail ||
                "Unable to load child attendance."
            );
        } finally {
            setChildLoading(false);
        }
    };

    const calculateGoal = async (e) => {
        e.preventDefault();
        setGoalError("");
        setGoalResult(null);

        if (!targetPercentage) {
            setGoalError("Please enter a target percentage.");
            return;
        }

        const target = Number(targetPercentage);
        if (!Number.isFinite(target) || target <= 0 || target > 100) {
            setGoalError("Target percentage must be between 1 and 100.");
            return;
        }

        try {
            setGoalLoading(true);

            const response = await api.post("/chat", {
                message: `Calculate how many future classes my attendance needs to reach ${target}% attendance.`
            });

            setGoalResult({
                message: response.data.message,
                data: response.data.data || null,
            });

        } catch (err) {
            console.error("Attendance goal error:", err);
            setGoalError(
                err.response?.data?.detail ||
                "Unable to calculate attendance goal."
            );
        } finally {
            setGoalLoading(false);
        }
    };

    const requestTeacherCall = async (e) => {
        e.preventDefault();
        setEscalationError("");
        setEscalationResult(null);

        if (!reason.trim()) {
            setEscalationError("Please provide a reason.");
            return;
        }

        try {
            setEscalationLoading(true);

            const response = await api.post("/escalation/request", {
                reason: reason.trim(),
            });

            setEscalationResult(response.data);
            setReason("");

        } catch (err) {
            console.error("Escalation error:", err);
            setEscalationError(
                err.response?.data?.detail ||
                "Unable to request teacher call."
            );
        } finally {
            setEscalationLoading(false);
        }
    };

    const getAttendanceStatus = () => {
        if (!child) return { label: "Unknown", badge: "badge-primary" };
        const percentage = Number(child.attendance_percentage) || 0;
        if (percentage >= 85) return { label: "Good Standing", badge: "badge-success" };
        if (percentage >= 75) return { label: "Needs Attention", badge: "badge-warning" };
        return { label: "Low Attendance", badge: "badge-danger" };
    };

    const statusObj = getAttendanceStatus();
    const childPercentage = child?.attendance_percentage || 0;

    return (
        <div className="app-container">
            <Navbar user={user} />

            <main className="dashboard-container animate-fade-in">
                {/* Header Section */}
                <header className="dashboard-header">
                    <div>
                        <h1>Welcome, {user?.name || "Parent"} 👋</h1>
                        <p>Monitor your child's academic attendance and connect with school faculty.</p>
                    </div>

                    <button 
                        type="button" 
                        onClick={loadChildAttendance} 
                        className="btn btn-secondary"
                        disabled={childLoading}
                    >
                        <RefreshCw size={16} className={childLoading ? "spinner-orange" : ""} />
                        <span>{childLoading ? "Loading..." : "Refresh"}</span>
                    </button>
                </header>

                {childError && (
                    <div className="alert alert-error">
                        <AlertCircle size={18} />
                        <span>{childError}</span>
                    </div>
                )}

                {/* Top Metrics Cards */}
                <div className="stats-grid">
                    <StatCard
                        title="Child Name"
                        value={child?.student_name || "Loading..."}
                        icon={UserCheck}
                        subtext={`Student ID: ${child?.student_id || 'N/A'}`}
                        accentColor="var(--dark-navy)"
                    />

                    <StatCard
                        title="Current Attendance"
                        value={`${childPercentage}%`}
                        icon={Award}
                        subtext="Academic term performance"
                        statusBadge={<span className={`badge ${statusObj.badge}`}>{statusObj.label}</span>}
                        accentColor="var(--primary-orange)"
                    />

                    <StatCard
                        title="Attendance Status"
                        value={statusObj.label}
                        icon={CheckCircle2}
                        subtext="School requirement: 85%"
                        accentColor="#16A34A"
                    />
                </div>

                {/* Main Grid */}
                <div className="dashboard-grid">
                    {/* Left Column: Progress ring & forms */}
                    <div>
                        {/* Child Summary Gauge Card */}
                        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', color: 'var(--dark-navy)', marginBottom: '4px' }}>
                                    Child Attendance Summary
                                </h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    Live updates directly from the official school ledger.
                                </p>

                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ background: 'var(--bg-soft-gray)', padding: '10px 16px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student Name</div>
                                        <div style={{ fontWeight: '700', color: 'var(--dark-navy)' }}>{child?.student_name || 'N/A'}</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-soft-gray)', padding: '10px 16px', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student ID</div>
                                        <div style={{ fontWeight: '700', color: 'var(--dark-navy)' }}>{child?.student_id || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <ProgressRing percentage={childPercentage} size={150} strokeWidth={12} label="Child's Rate" />
                        </div>

                        {/* Goal Calculator Card */}
                        <div className="dashboard-card">
                            <h2>
                                <Target size={22} style={{ color: 'var(--primary-orange)' }} />
                                <span>🎯 Attendance Goal Calculator</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '20px' }}>
                                Calculate how many upcoming classes your child needs to attend to reach a targeted percentage.
                            </p>

                            {goalError && (
                                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                    <span>{goalError}</span>
                                </div>
                            )}

                            <form onSubmit={calculateGoal} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label>Target Attendance %</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        step="0.1"
                                        placeholder="Example: 85"
                                        value={targetPercentage}
                                        onChange={(e) => setTargetPercentage(e.target.value)}
                                        disabled={goalLoading}
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
                                        <span>Calculate Goal</span>
                                    )}
                                </button>
                            </form>

                            {goalResult && (
                                <div 
                                    className="animate-fade-in"
                                    style={{ 
                                        background: 'var(--primary-orange-light)', 
                                        border: '1px solid rgba(255, 122, 0, 0.25)', 
                                        borderRadius: 'var(--radius-md)', 
                                        padding: '18px' 
                                    }}
                                >
                                    <h4 style={{ color: 'var(--dark-navy)', fontSize: '1rem', fontWeight: '700', marginBottom: '6px' }}>
                                        🎯 Goal Projection
                                    </h4>
                                    <p style={{ color: 'var(--dark-navy)', fontSize: '0.925rem' }}>{goalResult.message}</p>
                                </div>
                            )}
                        </div>

                        {/* Teacher Escalation Card */}
                        <div className="dashboard-card">
                            <h2>
                                <PhoneCall size={22} style={{ color: 'var(--primary-orange)' }} />
                                <span>📞 Request Teacher Call</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '18px' }}>
                                Submit an official callback request to your child's assigned teacher regarding attendance or academic performance.
                            </p>

                            {escalationError && (
                                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                    <span>{escalationError}</span>
                                </div>
                            )}

                            <form onSubmit={requestTeacherCall}>
                                <div className="form-group">
                                    <label>Reason for Contact</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Explain why you would like to speak with the teacher..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={escalationLoading}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-secondary"
                                    disabled={escalationLoading}
                                    style={{ width: '100%' }}
                                >
                                    {escalationLoading ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="spinner spinner-orange"></span>
                                            <span>Submitting Request...</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <PhoneCall size={16} />
                                            <span>Submit Callback Request</span>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {escalationResult && (
                                <div 
                                    className="animate-fade-in alert alert-success"
                                    style={{ marginTop: '20px', flexDirection: 'column', alignItems: 'flex-start' }}
                                >
                                    <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>✓ Request Confirmed</h4>
                                    <p style={{ fontSize: '0.9rem' }}>{escalationResult.message}</p>
                                    <div style={{ marginTop: '8px', fontSize: '0.825rem', opacity: 0.9 }}>
                                        <strong>Ticket ID:</strong> {escalationResult.ticket_id} | <strong>Status:</strong> {escalationResult.status}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI Parent Assistant */}
                    <div>
                        <AIChat 
                            title="🤖 AI Parent Assistant" 
                            subtitle="Ask questions about your child's attendance and school updates."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ParentDashboard;
