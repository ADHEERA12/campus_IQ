
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
    CheckCircle2,
    TrendingUp,
    Sparkles,
    CalendarCheck,
    ArrowRight,
} from "lucide-react";

import "./ParentDashboard.css";

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
                message: `Calculate how many future classes my attendance needs to reach ${target}% attendance.`,
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
        if (!child) {
            return {
                label: "Unknown",
                badge: "parent-status-unknown",
                color: "#64748B",
                description: "Attendance data is not available yet.",
            };
        }

        const percentage = Number(child.attendance_percentage) || 0;

        if (percentage >= 85) {
            return {
                label: "Good Standing",
                badge: "parent-status-good",
                color: "#16A34A",
                description: "Your child is meeting the attendance requirement.",
            };
        }

        if (percentage >= 75) {
            return {
                label: "Needs Attention",
                badge: "parent-status-warning",
                color: "#F59E0B",
                description: "Attendance needs improvement to reach the target.",
            };
        }

        return {
            label: "Low Attendance",
            badge: "parent-status-low",
            color: "#DC2626",
            description: "Attendance is below the recommended level.",
        };
    };

    const statusObj = getAttendanceStatus();
    const childPercentage = Number(child?.attendance_percentage) || 0;

    if (childLoading && !child) {
        return (
            <div className="app-container">
                <Navbar user={user} />

                <div className="dashboard-container parent-loading">
                    <LoadingSpinner
                        message="Loading your child's attendance..."
                        orange={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-container parent-app">
            <Navbar user={user} />

            <main className="dashboard-container parent-dashboard animate-fade-in">

                {/* Header */}
                <header className="parent-header">

                    <div className="parent-header-info">
                        <div className="parent-eyebrow">
                            <span className="parent-eyebrow-dot" />
                            FAMILY PORTAL
                        </div>

                        <h1>
                            Welcome back, {user?.name || "Parent"}
                        </h1>

                        <p>
                            Stay connected with your child's attendance
                            and school progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="parent-refresh-button"
                        onClick={loadChildAttendance}
                        disabled={childLoading}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                childLoading ? "parent-spinning" : ""
                            }
                        />

                        {childLoading ? "Refreshing..." : "Refresh"}
                    </button>
                </header>

                {/* Error */}
                {childError && (
                    <div className="parent-error">
                        <AlertCircle size={18} />
                        <span>{childError}</span>

                        <button
                            type="button"
                            onClick={loadChildAttendance}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Student identity banner */}
                <section className="parent-child-banner">

                    <div className="parent-child-avatar">
                        <UserCheck size={27} />
                    </div>

                    <div className="parent-child-info">
                        <span className="parent-child-overline">
                            YOUR CHILD
                        </span>

                        <h2>{child?.student_name || "Student"}</h2>

                        <p>
                            Student ID: {child?.student_id || "N/A"}
                        </p>
                    </div>

                    <div className={`parent-child-status ${statusObj.badge}`}>
                        <span className="parent-status-dot" />
                        {statusObj.label}
                    </div>
                </section>

                {/* Metrics */}
                <section className="parent-stats-grid">

                    <StatCard
                        title="Student Name"
                        value={child?.student_name || "N/A"}
                        icon={UserCheck}
                        subtext="Linked student account"
                        accentColor="#172554"
                    />

                    <StatCard
                        title="Current Attendance"
                        value={`${childPercentage}%`}
                        icon={Award}
                        subtext="Attendance this academic term"
                        statusBadge={
                            <span className={`parent-stat-badge ${statusObj.badge}`}>
                                {statusObj.label}
                            </span>
                        }
                        accentColor="#F97316"
                    />

                    <StatCard
                        title="Attendance Target"
                        value="85%"
                        icon={Target}
                        subtext="Recommended minimum"
                        accentColor="#0284C7"
                    />
                </section>

                {/* Main Content */}
                <section className="parent-content-grid">

                    {/* Left Column */}
                    <div className="parent-main-column">

                        {/* Attendance Summary */}
                        <section className="parent-attendance-card">

                            <div className="parent-card-heading">
                                <div>
                                    <div className="parent-section-label">
                                        ATTENDANCE PERFORMANCE
                                    </div>

                                    <h2>Attendance Summary</h2>

                                    <p>
                                        Live attendance data from the
                                        school's official ledger.
                                    </p>
                                </div>

                                <div className="parent-heading-icon">
                                    <CalendarCheck size={21} />
                                </div>
                            </div>

                            <div className="parent-attendance-body">

                                <div className="parent-ring-container">
                                    <ProgressRing
                                        percentage={childPercentage}
                                        size={170}
                                        strokeWidth={14}
                                        label="Attendance"
                                    />
                                </div>

                                <div className="parent-attendance-details">

                                    <div className={`parent-status-panel ${statusObj.badge}`}>
                                        <span className="parent-status-dot" />

                                        <div>
                                            <span className="parent-status-caption">
                                                Current standing
                                            </span>

                                            <strong>
                                                {statusObj.label}
                                            </strong>
                                        </div>
                                    </div>

                                    <p className="parent-attendance-description">
                                        Your child's attendance is currently{" "}
                                        <strong>{childPercentage}%</strong>.
                                        The recommended school attendance
                                        target is <strong>85%</strong>.
                                    </p>

                                    <div className="parent-progress-section">

                                        <div className="parent-progress-heading">
                                            <span>Attendance progress</span>
                                            <strong>{childPercentage}%</strong>
                                        </div>

                                        <div className="parent-progress-track">
                                            <div
                                                className="parent-progress-fill"
                                                style={{
                                                    width: `${Math.min(
                                                        childPercentage,
                                                        100
                                                    )}%`,
                                                    background: statusObj.color,
                                                }}
                                            />
                                        </div>

                                        <div className="parent-progress-caption">
                                            {childPercentage >= 85
                                                ? "Your child has reached the attendance target."
                                                : `${85 - childPercentage}% below the target.`}
                                        </div>
                                    </div>

                                    <div className="parent-student-details">

                                        <div className="parent-detail-item">
                                            <span>Student</span>
                                            <strong>
                                                {child?.student_name || "N/A"}
                                            </strong>
                                        </div>

                                        <div className="parent-detail-item">
                                            <span>Student ID</span>
                                            <strong>
                                                {child?.student_id || "N/A"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Attendance Goal Calculator */}
                        <section className="parent-goal-card">

                            <div className="parent-card-heading">
                                <div>
                                    <div className="parent-section-label">
                                        PLAN AHEAD
                                    </div>

                                    <h2>Attendance Goal Calculator</h2>

                                    <p>
                                        Find out how many upcoming classes
                                        are needed to reach your goal.
                                    </p>
                                </div>

                                <div className="parent-heading-icon parent-target-icon">
                                    <Target size={21} />
                                </div>
                            </div>

                            {goalError && (
                                <div className="parent-inline-error">
                                    <AlertCircle size={16} />
                                    {goalError}
                                </div>
                            )}

                            <form
                                className="parent-goal-form"
                                onSubmit={calculateGoal}
                            >
                                <div className="parent-goal-input-group">
                                    <label htmlFor="parent-target">
                                        Target Attendance
                                    </label>

                                    <div className="parent-percentage-input">
                                        <input
                                            id="parent-target"
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="0.1"
                                            placeholder="85"
                                            value={targetPercentage}
                                            onChange={(e) =>
                                                setTargetPercentage(e.target.value)
                                            }
                                            disabled={goalLoading}
                                            required
                                        />

                                        <span>%</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="parent-goal-button"
                                    disabled={goalLoading}
                                >
                                    {goalLoading ? (
                                        <>
                                            <span className="parent-chat-spinner" />
                                            Calculating
                                        </>
                                    ) : (
                                        <>
                                            Calculate Goal
                                            <ArrowRight size={17} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {goalResult && (
                                <div className="parent-goal-result animate-fade-in">

                                    <div className="parent-result-icon">
                                        <Sparkles size={19} />
                                    </div>

                                    <div className="parent-result-content">
                                        <h4>Goal Projection</h4>
                                        <p>{goalResult.message}</p>
                                    </div>
                                </div>
                            )}

                            <div className="parent-goal-note">
                                <Sparkles size={15} />
                                AI-powered attendance projection
                            </div>
                        </section>

                        {/* Teacher Callback */}
                        <section className="parent-callback-card">

                            <div className="parent-card-heading">
                                <div>
                                    <div className="parent-section-label">
                                        SCHOOL COMMUNICATION
                                    </div>

                                    <h2>Request a Teacher Call</h2>

                                    <p>
                                        Request a callback from your child's
                                        assigned teacher.
                                    </p>
                                </div>

                                <div className="parent-heading-icon parent-phone-icon">
                                    <PhoneCall size={21} />
                                </div>
                            </div>

                            {escalationError && (
                                <div className="parent-inline-error">
                                    <AlertCircle size={16} />
                                    {escalationError}
                                </div>
                            )}

                            <form
                                className="parent-callback-form"
                                onSubmit={requestTeacherCall}
                            >
                                <label htmlFor="parent-callback-reason">
                                    Reason for Contact
                                </label>

                                <textarea
                                    id="parent-callback-reason"
                                    rows="4"
                                    placeholder="Explain why you would like to speak with the teacher..."
                                    value={reason}
                                    onChange={(e) =>
                                        setReason(e.target.value)
                                    }
                                    disabled={escalationLoading}
                                    required
                                />

                                <button
                                    type="submit"
                                    className="parent-callback-button"
                                    disabled={escalationLoading}
                                >
                                    {escalationLoading ? (
                                        <>
                                            <span className="parent-chat-spinner" />
                                            Submitting Request...
                                        </>
                                    ) : (
                                        <>
                                            <PhoneCall size={17} />
                                            Submit Callback Request
                                        </>
                                    )}
                                </button>
                            </form>

                            {escalationResult && (
                                <div className="parent-callback-success animate-fade-in">

                                    <div className="parent-callback-success-icon">
                                        <CheckCircle2 size={21} />
                                    </div>

                                    <div className="parent-callback-success-content">
                                        <h4>Request Confirmed</h4>

                                        <p>
                                            {escalationResult.message}
                                        </p>

                                        <div className="parent-ticket-details">
                                            <span>
                                                Ticket ID
                                                <strong>
                                                    {escalationResult.ticket_id}
                                                </strong>
                                            </span>

                                            <span>
                                                Status
                                                <strong>
                                                    {escalationResult.status}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column */}
                    <aside className="parent-side-column">

                        {/* Status Card */}
                        <section className="parent-status-card">

                            <div className="parent-status-card-top">
                                <div className="parent-status-card-icon">
                                    <Award size={22} />
                                </div>

                                <span>ATTENDANCE STATUS</span>
                            </div>

                            <h3>{statusObj.label}</h3>

                            <p>{statusObj.description}</p>

                            <div className="parent-status-score">
                                <span>Current attendance</span>
                                <strong>{childPercentage}%</strong>
                            </div>

                            <div className="parent-status-track">
                                <div
                                    className="parent-status-fill"
                                    style={{
                                        width: `${Math.min(
                                            childPercentage,
                                            100
                                        )}%`,
                                        background: statusObj.color,
                                    }}
                                />
                            </div>

                            <div className="parent-status-footer">
                                <span>0%</span>
                                <span>Target 85%</span>
                                <span>100%</span>
                            </div>
                        </section>

                        {/* AI Assistant */}
                        <section className="parent-ai-wrapper">
                            <AIChat
                                title="AI Parent Assistant"
                                subtitle="Ask questions about your child's attendance and school information."
                            />
                        </section>

                        {/* Attendance guidance */}
                        <section className="parent-guidance-card">

                            <div className="parent-guidance-icon">
                                <TrendingUp size={20} />
                            </div>

                            <div>
                                <h4>Why 85% Matters</h4>

                                <p>
                                    Regular attendance helps students
                                    maintain academic progress. Keep track
                                    of attendance and communicate with
                                    teachers whenever needed.
                                </p>
                            </div>
                        </section>
                    </aside>
                </section>
            </main>
        </div>
    );
}

export default ParentDashboard;
