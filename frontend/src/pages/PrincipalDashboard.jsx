
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import LoadingSpinner from "../components/LoadingSpinner";

import {
    Users,
    TrendingUp,
    ShieldCheck,
    RefreshCw,
    AlertCircle,
    Sparkles,
    Building2,
    Send,
    Bot,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
} from "lucide-react";

import "./PrincipalDashboard.css";

function PrincipalDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [exportLoading, setExportLoading] = useState(false);
    const [exportMessage, setExportMessage] = useState("");

    const [message, setMessage] = useState("");
    const [chatResponse, setChatResponse] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

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

            if (parsedUser.role !== "principal") {
                navigate("/dashboard");
                return;
            }

            loadStatistics();
        } catch (err) {
            console.error(err);
            navigate("/");
        }
    }, [navigate]);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/attendance/overall");
            setStatistics(response.data);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load attendance statistics"
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async (type) => {
        try {
            setExportLoading(true);
            setExportMessage(
                `Generating school-wide ${type.toUpperCase()} report...`
            );

            const response = await api.get(`/reports/export/${type}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], {
                type:
                    type === "excel"
                        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        : "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.setAttribute(
                "download",
                `school_attendance_report_${new Date()
                    .toISOString()
                    .split("T")[0]}.${
                    type === "excel" ? "xlsx" : "pdf"
                }`
            );

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            setExportMessage(
                `School-wide ${type.toUpperCase()} report downloaded successfully!`
            );

            setTimeout(() => setExportMessage(""), 4000);
        } catch (err) {
            console.error("Export report error:", err);
            setExportMessage("");
            alert("Failed to export report. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            setChatLoading(true);
            setChatResponse("");

            const response = await api.post("/chat", {
                message: message,
            });

            setChatResponse(response.data.message);
            setMessage("");
        } catch (err) {
            setChatResponse(
                err.response?.data?.detail ||
                "Unable to contact AI assistant"
            );
        } finally {
            setChatLoading(false);
        }
    };

    const getHealthStatus = (percentage) => {
        const val = Number(percentage) || 0;

        if (val >= 85) {
            return {
                label: "Healthy",
                badge: "health-good",
                color: "#16A34A",
                description: "Attendance is meeting the institutional target.",
            };
        }

        if (val >= 75) {
            return {
                label: "Fair",
                badge: "health-fair",
                color: "#F59E0B",
                description: "Attendance needs closer monitoring.",
            };
        }

        return {
            label: "Attention Needed",
            badge: "health-low",
            color: "#DC2626",
            description: "Attendance is below the expected benchmark.",
        };
    };

    if (loading && !statistics) {
        return (
            <div className="app-container">
                <Navbar user={user} />

                <div className="dashboard-container principal-loading">
                    <LoadingSpinner
                        message="Loading Principal Executive Overview..."
                        orange={true}
                    />
                </div>
            </div>
        );
    }

    const overallPercentage =
        Number(statistics?.overall_attendance_percentage) || 0;

    const healthObj = getHealthStatus(overallPercentage);

    return (
        <div className="app-container principal-app">
            <Navbar user={user} />

            <main className="dashboard-container principal-dashboard animate-fade-in">

                {/* Executive Header */}
                <header className="principal-header">

                    <div className="principal-header-info">
                        <div className="principal-eyebrow">
                            <span className="principal-eyebrow-dot" />
                            EXECUTIVE OVERVIEW
                        </div>

                        <h1>
                            Welcome back, {user?.name || "Principal"}
                        </h1>

                        <p>
                            Monitor institutional attendance,
                            review performance and access school-wide reports.
                        </p>
                    </div>

                    <div className="principal-header-actions">

                        <div className="principal-export-actions">
                            <button
                                type="button"
                                className="principal-export-excel"
                                onClick={() => downloadReport("excel")}
                                disabled={exportLoading}
                            >
                                <FileSpreadsheet size={17} />

                                <span>
                                    {exportLoading
                                        ? "Generating..."
                                        : "Export Excel"}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="principal-export-pdf"
                                onClick={() => downloadReport("pdf")}
                                disabled={exportLoading}
                            >
                                <FileText size={17} />

                                <span>
                                    {exportLoading
                                        ? "Generating..."
                                        : "Export PDF"}
                                </span>
                            </button>
                        </div>

                        <button
                            type="button"
                            className="principal-refresh-button"
                            onClick={loadStatistics}
                            disabled={loading}
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "principal-spinning" : ""}
                            />

                            <span>
                                {loading
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </span>
                        </button>
                    </div>

                    {exportMessage && (
                        <div className="principal-export-message">
                            <CheckCircle2 size={16} />
                            <span>{exportMessage}</span>
                        </div>
                    )}
                </header>

                {/* Error Message */}
                {error && (
                    <div className="principal-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={loadStatistics}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Executive Statistics */}
                <section className="principal-stats-grid">

                    <StatCard
                        title="Total Enrolled Students"
                        value={statistics?.total_students ?? 0}
                        icon={Users}
                        subtext="Active student body"
                        accentColor="#172554"
                    />

                    <StatCard
                        title="Overall Attendance"
                        value={`${overallPercentage}%`}
                        icon={TrendingUp}
                        subtext="School-wide attendance average"
                        statusBadge={
                            <span
                                className={`principal-health-badge ${healthObj.badge}`}
                            >
                                {healthObj.label}
                            </span>
                        }
                        accentColor="#F97316"
                    />

                    <StatCard
                        title="Institutional Health"
                        value={healthObj.label}
                        icon={ShieldCheck}
                        subtext="Target benchmark: 85%"
                        accentColor={healthObj.color}
                    />
                </section>

                {/* Main Dashboard Content */}
                <section className="principal-content-grid">

                    {/* Left Column */}
                    <div className="principal-main-column">

                        {/* Attendance Overview */}
                        <section className="principal-overview-card">

                            <div className="principal-card-heading">
                                <div>
                                    <div className="principal-section-label">
                                        SCHOOL PERFORMANCE
                                    </div>

                                    <h2>Attendance Overview</h2>

                                    <p>
                                        Institutional attendance performance
                                        across all enrolled students.
                                    </p>
                                </div>

                                <div className="principal-heading-icon">
                                    <Building2 size={21} />
                                </div>
                            </div>

                            <div className="principal-overview-body">

                                <div className="principal-ring-container">
                                    <ProgressRing
                                        percentage={overallPercentage}
                                        size={190}
                                        strokeWidth={16}
                                        label="School Total"
                                    />
                                </div>

                                <div className="principal-overview-details">

                                    <div
                                        className={`principal-status-panel ${healthObj.badge}`}
                                    >
                                        <div className="principal-status-indicator" />

                                        <div>
                                            <span className="principal-status-label">
                                                Current Status
                                            </span>

                                            <strong>
                                                {healthObj.label}
                                            </strong>
                                        </div>
                                    </div>

                                    <p className="principal-overview-description">
                                        Overall attendance currently stands at{" "}
                                        <strong>
                                            {overallPercentage}%
                                        </strong>{" "}
                                        across{" "}
                                        <strong>
                                            {statistics?.total_students ?? 0}
                                        </strong>{" "}
                                        enrolled students.
                                    </p>

                                    <div className="principal-benchmark">
                                        <div className="principal-benchmark-header">
                                            <span>
                                                Attendance benchmark
                                            </span>

                                            <strong>85%</strong>
                                        </div>

                                        <div className="principal-benchmark-track">
                                            <div
                                                className="principal-benchmark-fill"
                                                style={{
                                                    width: `${Math.min(
                                                        overallPercentage,
                                                        100
                                                    )}%`,
                                                    background:
                                                        healthObj.color,
                                                }}
                                            />
                                        </div>

                                        <span className="principal-benchmark-caption">
                                            {overallPercentage >= 85
                                                ? "Institutional target achieved"
                                                : `${85 - overallPercentage}% below target`}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="principal-overview-refresh"
                                        onClick={loadStatistics}
                                        disabled={loading}
                                    >
                                        <RefreshCw
                                            size={16}
                                            className={
                                                loading
                                                    ? "principal-spinning"
                                                    : ""
                                            }
                                        />

                                        {loading
                                            ? "Updating..."
                                            : "Update Statistics"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* AI Executive Assistant */}
                        <section className="principal-ai-card">

                            <div className="principal-ai-header">
                                <div className="principal-ai-icon">
                                    <Bot size={23} />
                                </div>

                                <div>
                                    <div className="principal-section-label">
                                        AI-POWERED INSIGHTS
                                    </div>

                                    <h2>Principal AI Assistant</h2>

                                    <p>
                                        Ask questions about school attendance
                                        and institutional performance.
                                    </p>
                                </div>

                                <div className="principal-ai-sparkle">
                                    <Sparkles size={20} />
                                </div>
                            </div>

                            <form
                                className="principal-ai-form"
                                onSubmit={sendMessage}
                            >
                                <textarea
                                    rows="3"
                                    className="principal-ai-input"
                                    placeholder="Ask something like: What is the overall attendance across all classes?"
                                    value={message}
                                    onChange={(e) =>
                                        setMessage(e.target.value)
                                    }
                                    disabled={chatLoading}
                                />

                                <button
                                    type="submit"
                                    className="principal-ai-submit"
                                    disabled={
                                        chatLoading || !message.trim()
                                    }
                                >
                                    {chatLoading ? (
                                        <>
                                            <span className="principal-chat-spinner" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={17} />
                                            Ask AI Assistant
                                        </>
                                    )}
                                </button>
                            </form>

                            {chatResponse && (
                                <div className="principal-ai-response animate-fade-in">

                                    <div className="principal-response-heading">
                                        <div className="principal-response-icon">
                                            <Sparkles size={17} />
                                        </div>

                                        <span>
                                            AI Executive Response
                                        </span>
                                    </div>

                                    <div className="principal-response-content">
                                        {chatResponse}
                                    </div>
                                </div>
                            )}

                            <div className="principal-ai-suggestions">
                                <span>Try asking</span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMessage(
                                            "What is the overall attendance across all classes?"
                                        )
                                    }
                                >
                                    Overall attendance
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMessage(
                                            "Give me an overview of school attendance performance."
                                        )
                                    }
                                >
                                    School performance
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <aside className="principal-side-column">

                        {/* Institutional Health */}
                        <section className="principal-health-card">

                            <div className="principal-health-card-top">
                                <div className="principal-health-icon">
                                    <ShieldCheck size={22} />
                                </div>

                                <span className="principal-health-overline">
                                    INSTITUTIONAL HEALTH
                                </span>
                            </div>

                            <h3>{healthObj.label}</h3>

                            <p>{healthObj.description}</p>

                            <div className="principal-health-score">
                                <span>Attendance Score</span>

                                <strong>
                                    {overallPercentage}%
                                </strong>
                            </div>

                            <div className="principal-health-track">
                                <div
                                    className="principal-health-fill"
                                    style={{
                                        width: `${Math.min(
                                            overallPercentage,
                                            100
                                        )}%`,
                                        background: healthObj.color,
                                    }}
                                />
                            </div>

                            <div className="principal-health-footer">
                                <span>0%</span>
                                <span>Target 85%</span>
                                <span>100%</span>
                            </div>
                        </section>

                        {/* Report Information */}
                        <section className="principal-report-info-card">

                            <div className="principal-report-icon">
                                <FileSpreadsheet size={21} />
                            </div>

                            <h3>School Reports</h3>

                            <p>
                                Download consolidated attendance records
                                for institutional review and audit.
                            </p>

                            <div className="principal-report-option">
                                <FileSpreadsheet size={17} />
                                <div>
                                    <strong>Excel Workbook</strong>
                                    <span>Spreadsheet format</span>
                                </div>
                            </div>

                            <div className="principal-report-option">
                                <FileText size={17} />
                                <div>
                                    <strong>PDF Report</strong>
                                    <span>Printable document</span>
                                </div>
                            </div>

                            <p className="principal-report-footer">
                                Use the export buttons above to generate
                                your reports.
                            </p>
                        </section>

                        {/* Benchmark Info */}
                        <section className="principal-benchmark-info">

                            <div className="principal-benchmark-info-icon">
                                <TrendingUp size={19} />
                            </div>

                            <div>
                                <h4>85% Attendance Benchmark</h4>

                                <p>
                                    Maintaining attendance at or above
                                    85% is the institutional target.
                                    Monitor the overall score regularly.
                                </p>
                            </div>
                        </section>
                    </aside>
                </section>
            </main>
        </div>
    );
}

export default PrincipalDashboard;
