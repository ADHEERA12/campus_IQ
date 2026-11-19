import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChat from "../components/AIChat";
import { 
    Users, 
    CheckCircle2, 
    XCircle, 
    RefreshCw, 
    UserCheck, 
    Sparkles, 
    AlertCircle,
    BookOpen,
    Send,
    Bot,
    Zap,
    FileSpreadsheet,
    FileText,
    Download,
    Check,
    X
} from "lucide-react";

function TeacherDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Students state
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState("");

    // Single Form state
    const [markingMode, setMarkingMode] = useState("bulk"); // default to bulk mode as requested!
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [status, setStatus] = useState("present");
    const [attendanceResult, setAttendanceResult] = useState(null);
    const [attendanceError, setAttendanceError] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    // Bulk Marking State
    const [bulkMap, setBulkMap] = useState({});
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [bulkError, setBulkError] = useState("");

    // Export State
    const [exportLoading, setExportLoading] = useState(false);
    const [exportMessage, setExportMessage] = useState("");

    // AI Chat state
    const [message, setMessage] = useState("");
    const [chatResponse, setChatResponse] = useState("");
    const [chatTool, setChatTool] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");

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

            if (parsedUser.role !== "teacher") {
                navigate("/dashboard");
                return;
            }

            loadStudents();
        } catch (err) {
            console.error("Invalid user data:", err);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
        }
    }, [navigate]);

    const loadStudents = async () => {
        try {
            setStudentsLoading(true);
            setStudentsError("");

            const response = await api.get("/teacher/students");
            const studentList = response.data.students || [];
            setStudents(studentList);

            // Initialize Bulk Map with all students default as "present"
            initBulkMap(studentList);

        } catch (err) {
            console.error("Load students error:", err);
            setStudentsError(
                err.response?.data?.detail ||
                "Unable to load assigned students."
            );
        } finally {
            setStudentsLoading(false);
        }
    };

    const initBulkMap = (studentList) => {
        const initialMap = {};
        studentList.forEach(s => {
            initialMap[s.id] = "present";
        });
        setBulkMap(initialMap);
    };

    const markAllPresent = () => {
        const updated = {};
        students.forEach(s => {
            updated[s.id] = "present";
        });
        setBulkMap(updated);
    };

    const toggleStudentStatus = (studentId) => {
        setBulkMap(prev => ({
            ...prev,
            [studentId]: prev[studentId] === "present" ? "absent" : "present"
        }));
    };

    const markSingleAttendance = async (e) => {
        e.preventDefault();
        setAttendanceError("");
        setAttendanceResult(null);

        if (!selectedStudentId) {
            setAttendanceError("Please select a student.");
            return;
        }

        try {
            setAttendanceLoading(true);

            const response = await api.post("/attendance/mark", {
                student_id: Number(selectedStudentId),
                status: status,
            });

            setAttendanceResult(response.data);
            await loadStudents();
            setSelectedStudentId("");

        } catch (err) {
            console.error("Mark attendance error:", err);
            setAttendanceError(
                err.response?.data?.detail ||
                "Unable to mark attendance."
            );
        } finally {
            setAttendanceLoading(false);
        }
    };

    const submitBulkAttendance = async (e) => {
        e.preventDefault();
        setBulkError("");
        setBulkResult(null);

        if (students.length === 0) {
            setBulkError("No assigned students to mark.");
            return;
        }

        const records = students.map(s => ({
            student_id: s.id,
            status: bulkMap[s.id] || "present"
        }));

        try {
            setBulkLoading(true);

            const response = await api.post("/attendance/mark-bulk", {
                records: records
            });

            setBulkResult(response.data);
            await loadStudents();

        } catch (err) {
            console.error("Bulk attendance error:", err);
            setBulkError(
                err.response?.data?.detail ||
                "Unable to submit bulk attendance."
            );
        } finally {
            setBulkLoading(false);
        }
    };

    const downloadReport = async (type) => {
        try {
            setExportLoading(true);
            setExportMessage(`Generating ${type.toUpperCase()} report...`);

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
            link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.${type === "excel" ? "xlsx" : "pdf"}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportMessage(`✓ ${type.toUpperCase()} Report downloaded successfully!`);
            setTimeout(() => setExportMessage(""), 4000);

        } catch (err) {
            console.error("Export report error:", err);
            alert("Failed to export report. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    const sendAIChatMessage = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setChatLoading(true);
        setChatResponse("");
        setChatTool(null);
        setChatError("");

        try {
            const response = await api.post("/chat", {
                message: message.trim(),
            });

            setChatResponse(response.data.message || "No response received.");
            setChatTool(response.data.tool_used || null);
            setMessage("");

            await loadStudents();

        } catch (err) {
            console.error("AI chat error:", err);
            setChatError(
                err.response?.data?.detail ||
                "Unable to contact AI assistant."
            );
        } finally {
            setChatLoading(false);
        }
    };

    const totalStudentsCount = students.length;
    const avgAttendance = totalStudentsCount > 0
        ? (students.reduce((acc, s) => acc + (Number(s.attendance_percentage) || 0), 0) / totalStudentsCount).toFixed(1)
        : 0;

    const absenteesCount = Object.values(bulkMap).filter(v => v === "absent").length;
    const presentCount = totalStudentsCount - absenteesCount;

    return (
        <div className="app-container">
            <Navbar user={user} />

            <main className="dashboard-container animate-fade-in">
                {/* Header */}
                <header className="dashboard-header">
                    <div>
                        <h1>Teacher Dashboard 👋</h1>
                        <p>Manage class attendance in bulk, mark exceptions, and export reports.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            type="button" 
                            onClick={loadStudents} 
                            className="btn btn-secondary"
                            disabled={studentsLoading}
                        >
                            <RefreshCw size={16} className={studentsLoading ? "spinner-orange" : ""} />
                            <span>{studentsLoading ? "Loading..." : "Refresh"}</span>
                        </button>
                    </div>
                </header>

                {/* Stat Cards */}
                <div className="stats-grid">
                    <StatCard
                        title="Assigned Students"
                        value={totalStudentsCount}
                        icon={Users}
                        subtext="Class section roster"
                        accentColor="var(--primary-orange)"
                    />

                    <StatCard
                        title="Class Average Attendance"
                        value={`${avgAttendance}%`}
                        icon={BookOpen}
                        subtext="Overall section average"
                        accentColor="#16A34A"
                    />

                    <StatCard
                        title="Faculty Status"
                        value="Authorized"
                        icon={UserCheck}
                        subtext="Bulk Marking Enabled"
                        accentColor="var(--dark-navy)"
                    />
                </div>

                {/* Dashboard Main Grid */}
                <div className="dashboard-grid">
                    {/* Left Column: Bulk Attendance & Reports */}
                    <div>
                        
                        {/* Export Reports Action Card */}
                        <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #172033 0%, #0F172A 100%)', color: '#FFFFFF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                                <div>
                                    <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Download size={22} style={{ color: 'var(--primary-orange)' }} />
                                        <span>Export Class Attendance Reports</span>
                                    </h2>
                                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
                                        Download current attendance roster formatted in Excel spreadsheet or printable PDF.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => downloadReport("excel")}
                                        disabled={exportLoading || students.length === 0}
                                        style={{ padding: '10px 16px', fontSize: '0.875rem' }}
                                    >
                                        <FileSpreadsheet size={16} />
                                        <span>Export Excel (.xlsx)</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => downloadReport("pdf")}
                                        disabled={exportLoading || students.length === 0}
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

                        {/* Mode Switcher Tabs Card */}
                        <div className="dashboard-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                <h2>
                                    <Zap size={22} style={{ color: 'var(--primary-orange)' }} />
                                    <span>Class Attendance Marking</span>
                                </h2>

                                <div style={{ display: 'inline-flex', background: 'var(--bg-soft-gray)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMarkingMode("bulk")}
                                        style={{ 
                                            padding: '6px 14px', 
                                            fontSize: '0.825rem', 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            background: markingMode === "bulk" ? 'var(--primary-orange)' : 'transparent',
                                            color: markingMode === "bulk" ? '#FFFFFF' : 'var(--text-dark)',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ⚡ Bulk Mode (Class All)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMarkingMode("single")}
                                        style={{ 
                                            padding: '6px 14px', 
                                            fontSize: '0.825rem', 
                                            borderRadius: '8px', 
                                            border: 'none', 
                                            background: markingMode === "single" ? 'var(--primary-orange)' : 'transparent',
                                            color: markingMode === "single" ? '#FFFFFF' : 'var(--text-dark)',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Single Student
                                    </button>
                                </div>
                            </div>

                            {/* BULK MODE UI */}
                            {markingMode === "bulk" ? (
                                <form onSubmit={submitBulkAttendance}>
                                    <div style={{ background: 'var(--primary-orange-light)', border: '1px solid rgba(255, 122, 0, 0.25)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: '700', color: 'var(--dark-navy)', fontSize: '0.95rem' }}>
                                                Fast Bulk Action: Class Defaulted to "PRESENT"
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {presentCount} Present | {absenteesCount} Flagged Absent
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={markAllPresent}
                                            style={{ padding: '6px 12px', fontSize: '0.825rem' }}
                                        >
                                            <Check size={14} style={{ color: '#16A34A' }} />
                                            <span>Mark All Present</span>
                                        </button>
                                    </div>

                                    {bulkError && (
                                        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                            <AlertCircle size={18} />
                                            <span>{bulkError}</span>
                                        </div>
                                    )}

                                    {bulkResult && (
                                        <div className="alert alert-success" style={{ marginBottom: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <div style={{ fontWeight: '700' }}>✓ {bulkResult.message}</div>
                                            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                                Total Processed: {bulkResult.processed_count} | Present: {bulkResult.present_count} | Absent: {bulkResult.absent_count}
                                            </div>
                                        </div>
                                    )}

                                    {/* Student Exception Toggle List */}
                                    <div className="table-container" style={{ marginBottom: '20px' }}>
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Student Name</th>
                                                    <th>Attendance %</th>
                                                    <th>Attendance Action (Toggle Exception)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student) => {
                                                    const isPresent = bulkMap[student.id] !== "absent";
                                                    return (
                                                        <tr key={student.id}>
                                                            <td><strong>#{student.id}</strong></td>
                                                            <td style={{ fontWeight: '600', color: 'var(--dark-navy)' }}>{student.name}</td>
                                                            <td>{student.attendance_percentage}%</td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleStudentStatus(student.id)}
                                                                    className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}
                                                                    style={{ cursor: 'pointer', border: '1px solid transparent', padding: '8px 14px', fontSize: '0.85rem' }}
                                                                >
                                                                    {isPresent ? (
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                            <Check size={14} />
                                                                            <span>PRESENT</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                            <X size={14} />
                                                                            <span>ABSENT (Flagged)</span>
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                                        disabled={bulkLoading || students.length === 0}
                                    >
                                        {bulkLoading ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="spinner"></span>
                                                <span>Submitting Bulk Attendance...</span>
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                <Zap size={18} />
                                                <span>Submit Class Attendance ({totalStudentsCount} Students)</span>
                                            </span>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                /* SINGLE STUDENT MODE */
                                <form onSubmit={markSingleAttendance}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Select Student</label>
                                            <select
                                                value={selectedStudentId}
                                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                                disabled={attendanceLoading || studentsLoading}
                                                required
                                            >
                                                <option value="">-- Select Student --</option>
                                                {students.map((student) => (
                                                    <option key={student.id} value={student.id}>
                                                        {student.name} (ID: {student.id}) - {student.attendance_percentage}%
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label>Status</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                disabled={attendanceLoading}
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {attendanceError && (
                                        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                            <AlertCircle size={18} />
                                            <span>{attendanceError}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '12px' }}
                                        disabled={attendanceLoading || students.length === 0}
                                    >
                                        {attendanceLoading ? "Saving..." : "Mark Single Student Attendance"}
                                    </button>

                                    {attendanceResult && (
                                        <div className="alert alert-success" style={{ marginTop: '20px' }}>
                                            ✓ Updated {attendanceResult.student_name}: {attendanceResult.status.toUpperCase()} ({attendanceResult.attendance_percentage}%)
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Roster Overview Table Card */}
                        <div className="dashboard-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2>
                                    <Users size={22} style={{ color: 'var(--dark-navy)' }} />
                                    <span>Class Roster Overview</span>
                                </h2>
                                <span className="badge badge-primary">{students.length} Enrolled</span>
                            </div>

                            {studentsLoading && <LoadingSpinner message="Loading students..." orange={true} />}

                            {!studentsLoading && students.length > 0 && (
                                <div className="table-container">
                                    <table className="custom-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Student Name</th>
                                                <th>Attendance Rate</th>
                                                <th>Standing Badge</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map((student) => {
                                                const perc = Number(student.attendance_percentage) || 0;
                                                return (
                                                    <tr key={student.id}>
                                                        <td><strong>#{student.id}</strong></td>
                                                        <td style={{ fontWeight: '600', color: 'var(--dark-navy)' }}>{student.name}</td>
                                                        <td>
                                                            <strong style={{ color: perc >= 85 ? 'var(--success-green)' : perc >= 75 ? 'var(--primary-orange)' : 'var(--error-red)' }}>
                                                                {perc.toFixed(1)}%
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${perc >= 85 ? 'badge-success' : perc >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                                                                {perc >= 85 ? 'Good' : perc >= 75 ? 'Warning' : 'Low'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI Teaching Assistant */}
                    <div>
                        <div className="dashboard-card">
                            <h2>
                                <Bot size={22} style={{ color: 'var(--primary-orange)' }} />
                                <span>🤖 AI Teaching Assistant</span>
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                Use natural language prompts to mark attendance or query class standing.
                            </p>

                            {students.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                    <button
                                        type="button"
                                        className="chip-btn"
                                        onClick={() => setMessage(`Mark student ${students[0].name} as present`)}
                                    >
                                        Mark {students[0].name} Present
                                    </button>
                                    <button
                                        type="button"
                                        className="chip-btn"
                                        onClick={() => setMessage(`Mark student ${students[0].name} as absent`)}
                                    >
                                        Mark {students[0].name} Absent
                                    </button>
                                </div>
                            )}

                            <form onSubmit={sendAIChatMessage}>
                                <div className="form-group">
                                    <textarea
                                        rows="3"
                                        placeholder="Example: Mark student 5 as present"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={chatLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ width: '100%' }}
                                    disabled={chatLoading || !message.trim()}
                                >
                                    {chatLoading ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="spinner"></span>
                                            <span>AI Thinking...</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            <Send size={16} />
                                            <span>Ask AI</span>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {chatError && (
                                <div className="alert alert-error" style={{ marginTop: '16px' }}>
                                    <span>{chatError}</span>
                                </div>
                            )}

                            {chatResponse && (
                                <div 
                                    className="animate-fade-in"
                                    style={{ 
                                        marginTop: '20px', 
                                        padding: '16px', 
                                        background: 'var(--bg-soft-gray)', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 'var(--radius-md)' 
                                    }}
                                >
                                    <div style={{ fontWeight: '700', color: 'var(--dark-navy)', fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={16} style={{ color: 'var(--primary-orange)' }} />
                                        <span>AI Assistant Response</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>{chatResponse}</p>
                                </div>
                            )}
                        </div>

                        <AIChat 
                            title="🤖 Gemini AI Chat"
                            subtitle="General attendance assistant"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TeacherDashboard;
