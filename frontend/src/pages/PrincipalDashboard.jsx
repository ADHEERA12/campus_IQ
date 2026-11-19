import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChat from "../components/AIChat";
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
    Download,
    FileSpreadsheet,
    FileText
} from "lucide-react";

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
            setExportMessage(`Generating school-wide ${type.toUpperCase()} report...`);

            const response = await api.get(`/reports/export/${type}`, {
                responseType: "blob",
            });

            const blob = new Blob([response.data], {
                type: type === "excel" 
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
                    : "application/pdf"
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `school_attendance_report_${new Date().toISOString().split('T')[0]}.${type === "excel" ? "xlsx" : "pdf"}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportMessage(`✓ School-wide ${type.toUpperCase()} Report downloaded successfully!`);
            setTimeout(() => setExportMessage(""), 4000);

        } catch (err) {
            console.error("Export report error:", err);
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
                message: message
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
        if (val >= 85) return { label: "Healthy", badge: "badge-success", color: "#16A34A" };
        if (val >= 75) return { label: "Fair", badge: "badge-warning", color: "var(--primary-orange)" };
        return { label: "Attention Needed", badge: "badge-danger", color: "#DC2626" };
    };

    if (loading && !statistics) {
        return (
            <div className="app-container">
                <Navbar user={user} />
                <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
                    <LoadingSpinner message="Loading Principal Executive Overview..." orange={true} />
                </div>
            </div>
        );
    }

    const overallPercentage = statistics?.overall_attendance_percentage || 0;
    const healthObj = getHealthStatus(overallPercentage);

    return (
        <div className="app-container">
            <Navbar user={user} />

            <main className="dashboard-container animate-fade-in">
                {/* Executive Header */}
                <header className="dashboard-header">
                    <div>
                        <h1>Principal Dashboard 🏫</h1>
                        <p>Executive School Attendance Overview & Export Analytics Reports</p>
                    </div>

                    <button 
                        type="button" 
                        onClick={loadStatistics} 
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={loading ? "spinner-orange" : ""} />
                        <span>{loading ? "Refreshing..." : "Refresh Statistics"}</span>
                    </button>
                </header>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* 3 Executive Metric Cards */}
                <div className="stats-grid">
                    <StatCard
                        title="Total Enrolled Students"
                        value={statistics?.total_students ?? 0}
                        icon={Users}
                        subtext="Active student body count"
                        accentColor="var(--dark-navy)"
                    />

                    <StatCard
                        title="Overall School Attendance"
                        value={`${overallPercentage}%`}
                        icon={TrendingUp}
                        subtext="Weighted average across all classes"
                        statusBadge={<span className={`badge ${healthObj.badge}`}>{healthObj.label}</span>}
                        accentColor="var(--primary-orange)"
                    />

                    <StatCard
                        title="Institutional Health"
                        value={healthObj.label}
                        icon={ShieldCheck}
                        subtext="Benchmark target: 85%+"
                        accentColor={healthObj.color}
                    />
                </div>

                {/* Main Grid */}
                <div className="dashboard-grid">
                    {/* Left Column: School Overview & Export Card */}
                    <div>

                        {/* Export School Reports Card */}
                        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #172033 0%, #0F172A 100%)', color: '#FFFFFF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                                <div>
                                    <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Download size={22} style={{ color: 'var(--primary-orange)' }} />
                                        <span>Export School-Wide Attendance Reports</span>
                                    </h2>
                                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
                                        Export comprehensive attendance audit ledgers for all students across the school.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => downloadReport("excel")}
                                        disabled={exportLoading}
                                        style={{ padding: '10px 16px', fontSize: '0.875rem' }}
                                    >
                                        <FileSpreadsheet size={16} />
                                        <span>Export Excel (.xlsx)</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => downloadReport("pdf")}
                                        disabled={exportLoading}
                                        style={{ padding: '10px 16px', fontSize: '0.875rem' }}
                                    >
                                        <FileText size={16} />
                                        <span>Export PDF (.pdf)</span>
                                    </button>
                                </div>
                            </div>

                            {exportMessage && (
                                <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255, 122, 0, 0.15)', border: '1px solid rgba(255, 122, 0, 0.3)', borderRadius: '8px', color: 'var(--primary-orange)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    {exportMessage}
                                </div>
                            )}
                        </div>

                        {/* School Attendance Summary Gauge Card */}
                        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '28px', padding: '36px' }}>
                            <ProgressRing percentage={overallPercentage} size={190} strokeWidth={16} label="School Total" />

                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-orange-light)', color: 'var(--primary-orange)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '14px' }}>
                                    <Building2 size={14} />
                                    <span>Institution Key Metric</span>
                                </div>
                                <h3 style={{ fontSize: '1.6rem', color: 'var(--dark-navy)', marginBottom: '10px' }}>
                                    School Attendance Summary
                                </h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                                    The institutional attendance average currently stands at <strong>{overallPercentage}%</strong> across a total student body of <strong>{statistics?.total_students ?? 0}</strong> students.
                                </p>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        type="button" 
                                        onClick={loadStatistics} 
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        <RefreshCw size={16} />
                                        <span>Refresh Ledger Data</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Executive AI Query Card */}
                        <div className="dashboard-card">
                            <h2>
                                <Bot size={22} style={{ color: 'var(--primary-orange)' }} />
                                <span>🤖 AI Principal Executive Assistant</span>
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '20px' }}>
                                Ask high-level attendance questions, summary metrics, or policy insights directly from the Gemini AI engine.
                            </p>

                            <form onSubmit={sendMessage}>
                                <div className="form-group">
                                    <textarea
                                        rows="3"
                                        placeholder="Example: What is the overall attendance across all classes?"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={chatLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '12px' }}
                                    disabled={chatLoading || !message.trim()}
                                >
                                    {chatLoading ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="spinner"></span>
                                            <span>Analyzing metrics...</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Send size={16} />
                                            <span>Ask AI Executive Assistant</span>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {chatResponse && (
                                <div 
                                    className="animate-fade-in"
                                    style={{ 
                                        marginTop: '20px', 
                                        padding: '18px', 
                                        background: 'var(--primary-orange-light)', 
                                        border: '1px solid rgba(255, 122, 0, 0.25)', 
                                        borderRadius: 'var(--radius-md)' 
                                    }}
                                >
                                    <div style={{ fontWeight: '700', color: 'var(--dark-navy)', fontSize: '0.95rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Sparkles size={18} style={{ color: 'var(--primary-orange)' }} />
                                        <span>AI Executive Response</span>
                                    </div>
                                    <p style={{ fontSize: '0.925rem', color: 'var(--dark-navy)' }}>{chatResponse}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI Assistant Component */}
                    <div>
                        <AIChat 
                            title="🤖 Institutional AI Assistant"
                            subtitle="Full Gemini AI capability"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default PrincipalDashboard;