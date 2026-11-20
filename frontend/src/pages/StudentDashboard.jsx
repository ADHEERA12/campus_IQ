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
    Sparkles,
    TrendingUp,
    ShieldCheck
} from "lucide-react";

import "./StudentDashboard.css";

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
            return {
                label: "Good Standing",
                type: "badge-success",
                color: "#16A34A",
                description: "You're meeting the attendance requirement."
            };
        }

        if (val >= 75) {
            return {
                label: "Average",
                type: "badge-warning",
                color: "#F59E0B",
                description: "You're close. Keep attending classes regularly."
            };
        }

        return {
            label: "Low Standing",
            type: "badge-danger",
            color: "#DC2626",
            description: "Your attendance needs immediate attention."
        };
    };

    if (loading && !attendance) {
        return (
            <div className="app-container">
                <Navbar user={user} />

                <div className="dashboard-container student-dashboard-loading">
                    <LoadingSpinner
                        message="Loading your student overview..."
                        orange={false}
                    />
                </div>
            </div>
        );
    }

    const percentageVal = Number(
        attendance?.attendance_percentage || 0
    );

    const statusObj = getStatusInfo(percentageVal);

    const classesAttended = attendance?.classes_attended ?? 0;
    const classesMissed = attendance?.classes_missed ?? 0;

    return (
        <div className="app-container student-dashboard-page">
            <Navbar user={user} />

            <main className="dashboard-container student-dashboard animate-fade-in">

                {/* =================================================
                    PAGE HEADER
                ================================================== */}

                <header className="student-page-header">
                    <div className="student-welcome">
                        <div className="student-welcome-label">
                            <span className="student-welcome-dot"></span>
                            STUDENT OVERVIEW
                        </div>

                        <h1>
                            Good morning, {user?.name || "Student"}
                            <span className="student-wave"> 👋</span>
                        </h1>

                        <p>
                            Stay on top of your attendance, track your goals,
                            and get insights from your AI assistant.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadAttendance}
                        className="student-refresh-btn"
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? "student-refresh-spin" : ""}
                        />

                        {loading ? "Refreshing..." : "Refresh data"}
                    </button>
                </header>

                {/* Error message */}

                {error && (
                    <div className="student-alert student-alert-error">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* =================================================
                    STATISTICS
                ================================================== */}

                <section className="student-stats-grid">

                    <StatCard
                        title="Attendance Percentage"
                        value={`${percentageVal}%`}
                        icon={Award}
                        subtext={`Student ID: ${attendance?.student_id ?? "N/A"}`}
                        statusBadge={
                            <span className={`badge ${statusObj.type}`}>
                                {statusObj.label}
                            </span>
                        }
                        accentColor="#38BDF8"
                    />

                    <StatCard
                        title="Classes Attended"
                        value={classesAttended}
                        icon={BookOpen}
                        subtext="Total classes attended"
                        accentColor="#16A34A"
                    />

                    <StatCard
                        title="Classes Missed"
                        value={classesMissed}
                        icon={CalendarX}
                        subtext="Total absences recorded"
                        accentColor="#DC2626"
                    />

                    <StatCard
                        title="Academic Standing"
                        value={statusObj.label}
                        icon={CheckCircle2}
                        subtext="Minimum requirement: 85%"
                        accentColor="#172554"
                    />

                </section>

                {/* =================================================
                    MAIN DASHBOARD GRID
                ================================================== */}

                <section className="student-main-grid">

                    {/* LEFT COLUMN */}

                    <div className="student-main-column">

                        {/* ATTENDANCE OVERVIEW */}

                        <section className="student-panel student-overview-panel">

                            <div className="student-overview-top">
                                <div className="student-section-eyebrow">
                                    <TrendingUp size={15} />
                                    ATTENDANCE INSIGHTS
                                </div>

                                <span className={`badge ${statusObj.type}`}>
                                    {statusObj.label}
                                </span>
                            </div>

                            <div className="student-overview-content">

                                {/* Ring */}

                                <div className="student-ring-wrapper">
                                    <ProgressRing
                                        percentage={percentageVal}
                                        size={175}
                                        strokeWidth={14}
                                        label="Current"
                                    />

                                    <div className="student-ring-caption">
                                        Overall attendance
                                    </div>
                                </div>

                                {/* Content */}

                                <div className="student-overview-details">

                                    <h2>My Attendance Overview</h2>

                                    <p>
                                        {statusObj.description}
                                    </p>

                                    <div className="student-target-info">
                                        <div className="student-target-info-icon">
                                            <Target size={19} />
                                        </div>

                                        <div className="student-target-info-text">
                                            <span>Minimum attendance target</span>
                                            <strong>85%</strong>
                                        </div>
                                    </div>

                                    {/* Progress comparison */}

                                    <div className="student-threshold-section">

                                        <div className="student-threshold-heading">
                                            <span>Your progress</span>
                                            <span>{percentageVal}% / 85%</span>
                                        </div>

                                        <div className="student-threshold-track">
                                            <div
                                                className={`student-threshold-fill ${
                                                    percentageVal >= 85
                                                        ? "student-threshold-achieved"
                                                        : ""
                                                }`}
                                                style={{
                                                    width: `${Math.min(
                                                        (percentageVal / 85) * 100,
                                                        100
                                                    )}%`
                                                }}
                                            />
                                        </div>

                                        <div className="student-threshold-foot">
                                            {percentageVal >= 85 ? (
                                                <span className="student-threshold-good">
                                                    <ShieldCheck size={14} />
                                                    Requirement achieved
                                                </span>
                                            ) : (
                                                <span className="student-threshold-warning">
                                                    {(85 - percentageVal).toFixed(2)}%
                                                    below target
                                                </span>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ATTENDANCE GOAL PLANNER */}

                        <section className="student-panel student-goal-panel">

                            <div className="student-panel-heading">

                                <div className="student-heading-icon student-heading-orange">
                                    <Calculator size={21} />
                                </div>

                                <div>
                                    <h2>Attendance Goal Planner</h2>
                                    <p>
                                        Build a plan to reach your desired attendance.
                                    </p>
                                </div>

                            </div>

                            <form
                                onSubmit={calculateGoal}
                                className="student-goal-form"
                            >

                                <div className="student-goal-input-group">
                                    <label htmlFor="attendance-target">
                                        Target attendance percentage
                                    </label>

                                    <div className="student-target-input-wrapper">
                                        <input
                                            id="attendance-target"
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="0.01"
                                            placeholder="Enter your target"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            required
                                        />

                                        <span className="student-input-suffix">
                                            %
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="student-calculate-btn"
                                    disabled={goalLoading}
                                >
                                    {goalLoading ? (
                                        <>
                                            <span className="student-button-spinner" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Target size={17} />
                                            Calculate goal
                                        </>
                                    )}
                                </button>

                            </form>

                            {/* AI RESULT */}

                            {goalResult && (
                                <div className="student-goal-result animate-fade-in">

                                    <div className="student-result-header">
                                        <div className="student-result-icon">
                                            <Sparkles size={18} />
                                        </div>

                                        <div>
                                            <h3>AI Goal Calculation</h3>
                                            <span>Your personalized attendance plan</span>
                                        </div>
                                    </div>

                                    <p className="student-result-message">
                                        {goalResult.message}
                                    </p>

                                    {goalResult.data && (
                                        <div className="student-result-metrics">

                                            <div className="student-result-metric">
                                                <span>Current attendance</span>
                                                <strong>
                                                    {goalResult.data.current_percentage}%
                                                </strong>
                                            </div>

                                            <div className="student-result-metric">
                                                <span>Target attendance</span>
                                                <strong className="student-result-blue">
                                                    {goalResult.data.target_percentage}%
                                                </strong>
                                            </div>

                                            <div className="student-result-metric">
                                                <span>Classes required</span>
                                                <strong className="student-result-green">
                                                    {goalResult.data.classes_needed}
                                                </strong>
                                            </div>

                                        </div>
                                    )}

                                </div>
                            )}

                        </section>

                        {/* QUICK ATTENDANCE SUMMARY */}

                        <section className="student-panel student-summary-panel">

                            <div className="student-panel-heading">

                                <div className="student-heading-icon student-heading-blue">
                                    <BookOpen size={21} />
                                </div>

                                <div>
                                    <h2>Attendance Summary</h2>
                                    <p>A quick look at your class records.</p>
                                </div>

                            </div>

                            <div className="student-summary-items">

                                <div className="student-summary-item student-summary-present">
                                    <div className="student-summary-icon">
                                        <CheckCircle2 size={19} />
                                    </div>

                                    <div>
                                        <span>Classes attended</span>
                                        <strong>{classesAttended}</strong>
                                    </div>
                                </div>

                                <div className="student-summary-item student-summary-absent">
                                    <div className="student-summary-icon">
                                        <CalendarX size={19} />
                                    </div>

                                    <div>
                                        <span>Classes missed</span>
                                        <strong>{classesMissed}</strong>
                                    </div>
                                </div>

                                <div className="student-summary-item student-summary-total">
                                    <div className="student-summary-icon">
                                        <BookOpen size={19} />
                                    </div>

                                    <div>
                                        <span>Total recorded classes</span>
                                        <strong>{classesAttended + classesMissed}</strong>
                                    </div>
                                </div>

                            </div>

                        </section>

                    </div>

                    {/* RIGHT COLUMN - AI ASSISTANT */}

                    <aside className="student-ai-column">

                        <div className="student-ai-intro">

                            <div className="student-ai-brand">
                                <div className="student-ai-icon">
                                    <Sparkles size={20} />
                                </div>

                                <div>
                                    <span className="student-ai-label">
                                        AI POWERED
                                    </span>

                                    <h2>Campus IQ Assistant</h2>
                                </div>
                            </div>

                            <p>
                                Your personal assistant for attendance questions,
                                academic insights, and planning.
                            </p>

                            <div className="student-ai-status">
                                <span className="student-ai-status-dot"></span>
                                Ready to assist
                            </div>

                        </div>

                        <div className="student-ai-chat-wrapper">
                            <AIChat
                                title="Campus IQ Assistant"
                                subtitle="Ask about attendance, required classes, or academic status."
                            />
                        </div>

                    </aside>

                </section>

            </main>
        </div>
    );
}

export default StudentDashboard;
