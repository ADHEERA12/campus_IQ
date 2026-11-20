
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import AIChat from "../components/AIChat";
import "./TeacherDashboard.css";
import { CheckCircle2 } from "lucide-react";
import {XCircle} from "lucide-react";

import {
    Users,
    BookOpen,
    UserCheck,
    RefreshCw,
    Download,
    FileSpreadsheet,
    FileText,
    Zap,
    Check,
    X,
    AlertCircle,
    Send,
    Bot,
    Sparkles,
    ClipboardCheck,
    TrendingUp,
    CalendarCheck,
} from "lucide-react";

function TeacherDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState("");

    const [markingMode, setMarkingMode] = useState("bulk");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [status, setStatus] = useState("present");
    const [attendanceResult, setAttendanceResult] = useState(null);
    const [attendanceError, setAttendanceError] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    const [bulkMap, setBulkMap] = useState({});
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [bulkError, setBulkError] = useState("");

    const [exportLoading, setExportLoading] = useState(false);
    const [exportMessage, setExportMessage] = useState("");

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
        studentList.forEach((student) => {
            initialMap[student.id] = "present";
        });
        setBulkMap(initialMap);
    };

    const markAllPresent = () => {
        const updated = {};
        students.forEach((student) => {
            updated[student.id] = "present";
        });
        setBulkMap(updated);
    };

    const toggleStudentStatus = (studentId) => {
        setBulkMap((prev) => ({
            ...prev,
            [studentId]:
                prev[studentId] === "present" ? "absent" : "present",
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
                status,
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

        const records = students.map((student) => ({
            student_id: student.id,
            status: bulkMap[student.id] || "present",
        }));

        try {
            setBulkLoading(true);

            const response = await api.post("/attendance/mark-bulk", {
                records,
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
                `attendance_report_${new Date().toISOString().split("T")[0]}.${
                    type === "excel" ? "xlsx" : "pdf"
                }`
            );

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportMessage(
                `${type.toUpperCase()} report downloaded successfully!`
            );

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

    const avgAttendance =
        totalStudentsCount > 0
            ? (
                  students.reduce(
                      (acc, student) =>
                          acc +
                          (Number(student.attendance_percentage) || 0),
                      0
                  ) / totalStudentsCount
              ).toFixed(1)
            : "0.0";

    const absenteesCount = Object.values(bulkMap).filter(
        (value) => value === "absent"
    ).length;

    const presentCount = totalStudentsCount - absenteesCount;

    const getAttendanceStatus = (percentage) => {
        const value = Number(percentage) || 0;

        if (value >= 85) {
            return { label: "Good Standing", className: "td-status-good" };
        }

        if (value >= 75) {
            return { label: "Needs Attention", className: "td-status-warning" };
        }

        return { label: "Low Attendance", className: "td-status-low" };
    };

    return (
        <div className="app-container teacher-page">
            <Navbar user={user} />

            <main className="dashboard-container td-container">
                {/* Header */}
                <header className="td-page-header">
                    <div>
                        <div className="td-eyebrow">
                            <span className="td-eyebrow-dot" />
                            FACULTY PORTAL
                        </div>

                        <h1>
                            Welcome back, {user?.name || "Teacher"}
                        </h1>

                        <p>
                            Manage attendance, monitor your students and
                            generate class reports.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="td-refresh-button"
                        onClick={loadStudents}
                        disabled={studentsLoading}
                    >
                        <RefreshCw
                            size={17}
                            className={studentsLoading ? "td-spinning" : ""}
                        />
                        {studentsLoading ? "Refreshing..." : "Refresh data"}
                    </button>
                </header>

                {studentsError && (
                    <div className="td-alert td-alert-error">
                        <AlertCircle size={18} />
                        <span>{studentsError}</span>
                    </div>
                )}

                {/* Statistics */}
                <section className="td-stats-grid">
                    <StatCard
                        title="Assigned Students"
                        value={totalStudentsCount}
                        icon={Users}
                        subtext="Students in your class"
                        accentColor="#38BDF8"
                    />

                    <StatCard
                        title="Class Average"
                        value={`${avgAttendance}%`}
                        icon={TrendingUp}
                        subtext="Average attendance rate"
                        accentColor="#16A34A"
                    />

                    <StatCard
                        title="Attendance Session"
                        value="Active"
                        icon={ClipboardCheck}
                        subtext="Attendance marking available"
                        accentColor="#F97316"
                    />

                    <StatCard
                        title="Faculty Access"
                        value="Authorized"
                        icon={UserCheck}
                        subtext="Teacher account verified"
                        accentColor="#172554"
                    />
                </section>

                {/* Main layout */}
                <section className="td-main-grid">
                    <div className="td-main-column">
                        {/* Attendance marking */}
                        <section className="td-panel">
                            <div className="td-panel-header">
                                <div className="td-heading-icon td-heading-orange">
                                    <ClipboardCheck size={20} />
                                </div>

                                <div>
                                    <h2>Attendance Management</h2>
                                    <p>
                                        Record and manage your students'
                                        attendance.
                                    </p>
                                </div>
                            </div>

                            <div className="td-mode-switch">
                                <button
                                    type="button"
                                    className={
                                        markingMode === "bulk"
                                            ? "td-mode-active"
                                            : ""
                                    }
                                    onClick={() => setMarkingMode("bulk")}
                                >
                                    <Users size={16} />
                                    Bulk attendance
                                </button>

                                <button
                                    type="button"
                                    className={
                                        markingMode === "single"
                                            ? "td-mode-active"
                                            : ""
                                    }
                                    onClick={() => setMarkingMode("single")}
                                >
                                    <UserCheck size={16} />
                                    Individual student
                                </button>
                            </div>

                            {/* Bulk mode */}
                            {markingMode === "bulk" && (
                                <form onSubmit={submitBulkAttendance}>
                                    <div className="td-bulk-summary">
                                        <div>
                                            <h3>Today's attendance list</h3>
                                            <p>
                                                Students are marked present by
                                                default. Toggle absent students.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="td-reset-button"
                                            onClick={markAllPresent}
                                        >
                                            <Check size={15} />
                                            Reset all present
                                        </button>
                                    </div>

                                    <div className="td-counts">
                                        <div className="td-count-present">
                                            <CheckCircle2 size={17} />
                                            <strong>{presentCount}</strong>
                                            <span>Present</span>
                                        </div>

                                        <div className="td-count-absent">
                                            <XCircle size={17} />
                                            <strong>{absenteesCount}</strong>
                                            <span>Absent</span>
                                        </div>

                                        <div className="td-count-total">
                                            <Users size={17} />
                                            <strong>{totalStudentsCount}</strong>
                                            <span>Total</span>
                                        </div>
                                    </div>

                                    {bulkError && (
                                        <div className="td-alert td-alert-error">
                                            <AlertCircle size={18} />
                                            {bulkError}
                                        </div>
                                    )}

                                    {bulkResult && (
                                        <div className="td-alert td-alert-success">
                                            <CheckCircle2 size={18} />
                                            <div>
                                                <strong>{bulkResult.message}</strong>
                                                <p>
                                                    Processed: {bulkResult.processed_count}
                                                    {" · "}
                                                    Present: {bulkResult.present_count}
                                                    {" · "}
                                                    Absent: {bulkResult.absent_count}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {studentsLoading ? (
                                        <LoadingSpinner
                                            message="Loading student roster..."
                                        />
                                    ) : students.length === 0 ? (
                                        <div className="td-empty-state">
                                            <Users size={32} />
                                            <h3>No students assigned</h3>
                                            <p>
                                                Students assigned to your class
                                                will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="td-student-list">
                                            {students.map((student, index) => {
                                                const isPresent =
                                                    bulkMap[student.id] !==
                                                    "absent";

                                                return (
                                                    <div
                                                        className="td-student-row"
                                                        key={student.id}
                                                    >
                                                        <div className="td-student-identity">
                                                            <div className="td-avatar">
                                                                {student.name
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase() ||
                                                                    "S"}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {student.name}
                                                                </strong>
                                                                <span>
                                                                    Student ID:{" "}
                                                                    {student.id}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="td-student-attendance">
                                                            <span>
                                                                Attendance
                                                            </span>
                                                            <strong
                                                                className={
                                                                    Number(
                                                                        student.attendance_percentage
                                                                    ) >= 85
                                                                        ? "td-green-text"
                                                                        : Number(
                                                                              student.attendance_percentage
                                                                          ) >= 75
                                                                        ? "td-orange-text"
                                                                        : "td-red-text"
                                                                }
                                                            >
                                                                {student.attendance_percentage}%
                                                            </strong>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleStudentStatus(
                                                                    student.id
                                                                )
                                                            }
                                                            className={
                                                                isPresent
                                                                    ? "td-attendance-toggle td-present"
                                                                    : "td-attendance-toggle td-absent"
                                                            }
                                                        >
                                                            {isPresent ? (
                                                                <>
                                                                    <Check
                                                                        size={15}
                                                                    />
                                                                    Present
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <X
                                                                        size={15}
                                                                    />
                                                                    Absent
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="td-submit-button"
                                        disabled={
                                            bulkLoading ||
                                            students.length === 0
                                        }
                                    >
                                        {bulkLoading ? (
                                            <>
                                                <span className="td-button-spinner" />
                                                Submitting attendance...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={18} />
                                                Submit attendance for{" "}
                                                {totalStudentsCount} students
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* Single mode */}
                            {markingMode === "single" && (
                                <form
                                    onSubmit={markSingleAttendance}
                                    className="td-single-form"
                                >
                                    <div className="td-form-grid">
                                        <div className="td-form-field">
                                            <label>Select student</label>
                                            <select
                                                value={selectedStudentId}
                                                onChange={(e) =>
                                                    setSelectedStudentId(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    attendanceLoading ||
                                                    studentsLoading
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Choose a student...
                                                </option>

                                                {students.map((student) => (
                                                    <option
                                                        key={student.id}
                                                        value={student.id}
                                                    >
                                                        {student.name} (ID:{" "}
                                                        {student.id}) -{" "}
                                                        {student.attendance_percentage}%
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="td-form-field">
                                            <label>Attendance status</label>
                                            <select
                                                value={status}
                                                onChange={(e) =>
                                                    setStatus(e.target.value)
                                                }
                                                disabled={attendanceLoading}
                                            >
                                                <option value="present">
                                                    Present
                                                </option>
                                                <option value="absent">
                                                    Absent
                                                </option>
                                            </select>
                                        </div>
                                    </div>

                                    {attendanceError && (
                                        <div className="td-alert td-alert-error">
                                            <AlertCircle size={18} />
                                            {attendanceError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="td-submit-button"
                                        disabled={
                                            attendanceLoading ||
                                            students.length === 0
                                        }
                                    >
                                        {attendanceLoading
                                            ? "Saving attendance..."
                                            : "Save student attendance"}
                                    </button>

                                    {attendanceResult && (
                                        <div className="td-alert td-alert-success">
                                            <CheckCircle2 size={18} />
                                            <span>
                                                Updated{" "}
                                                {attendanceResult.student_name}:{" "}
                                                {attendanceResult.status.toUpperCase()}
                                                {" · "}
                                                {attendanceResult.attendance_percentage}%
                                            </span>
                                        </div>
                                    )}
                                </form>
                            )}
                        </section>

                        {/* Student roster */}
                        <section className="td-panel">
                            <div className="td-panel-header td-roster-header">
                                <div className="td-heading-icon td-heading-blue">
                                    <BookOpen size={20} />
                                </div>

                                <div>
                                    <h2>Class roster</h2>
                                    <p>
                                        Overview of students and attendance
                                        performance.
                                    </p>
                                </div>

                                <span className="td-enrolled-badge">
                                    {students.length} enrolled
                                </span>
                            </div>

                            {studentsLoading ? (
                                <LoadingSpinner message="Loading roster..." />
                            ) : students.length === 0 ? (
                                <div className="td-empty-state">
                                    <Users size={30} />
                                    <p>No student records available.</p>
                                </div>
                            ) : (
                                <div className="td-roster-table-wrap">
                                    <table className="td-roster-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Attendance</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {students.map((student) => {
                                                const percentage =
                                                    Number(
                                                        student.attendance_percentage
                                                    ) || 0;

                                                const statusInfo =
                                                    getAttendanceStatus(
                                                        percentage
                                                    );

                                                return (
                                                    <tr key={student.id}>
                                                        <td>
                                                            <div className="td-table-student">
                                                                <div className="td-avatar td-avatar-small">
                                                                    {student.name
                                                                        ?.charAt(0)
                                                                        ?.toUpperCase() ||
                                                                        "S"}
                                                                </div>

                                                                <div>
                                                                    <strong>
                                                                        {student.name}
                                                                    </strong>
                                                                    <span>
                                                                        ID #{student.id}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <div className="td-progress-cell">
                                                                <div className="td-progress-track">
                                                                    <div
                                                                        className={
                                                                            percentage >= 85
                                                                                ? "td-progress-fill td-progress-green"
                                                                                : percentage >= 75
                                                                                ? "td-progress-fill td-progress-orange"
                                                                                : "td-progress-fill td-progress-red"
                                                                        }
                                                                        style={{
                                                                            width: `${Math.min(
                                                                                Math.max(
                                                                                    percentage,
                                                                                    0
                                                                                ),
                                                                                100
                                                                            )}%`,
                                                                        }}
                                                                    />
                                                                </div>

                                                                <strong>
                                                                    {percentage.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </strong>
                                                            </div>
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`td-status-badge ${statusInfo.className}`}
                                                            >
                                                                {statusInfo.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* Report export */}
                        <section className="td-report-panel">
                            <div className="td-report-content">
                                <div className="td-report-icon">
                                    <Download size={23} />
                                </div>

                                <div>
                                    <h2>Attendance reports</h2>
                                    <p>
                                        Download attendance data for analysis,
                                        records or printing.
                                    </p>
                                </div>
                            </div>

                            <div className="td-report-actions">
                                <button
                                    type="button"
                                    className="td-excel-button"
                                    onClick={() => downloadReport("excel")}
                                    disabled={
                                        exportLoading ||
                                        students.length === 0
                                    }
                                >
                                    <FileSpreadsheet size={17} />
                                    Export Excel
                                </button>

                                <button
                                    type="button"
                                    className="td-pdf-button"
                                    onClick={() => downloadReport("pdf")}
                                    disabled={
                                        exportLoading ||
                                        students.length === 0
                                    }
                                >
                                    <FileText size={17} />
                                    Export PDF
                                </button>
                            </div>

                            {exportMessage && (
                                <div className="td-export-message">
                                    <CheckCircle2 size={16} />
                                    {exportMessage}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right column */}
                    <aside className="td-side-column">
                        {/* AI Assistant */}
                        <section className="td-ai-panel">
                            <div className="td-ai-header">
                                <div className="td-ai-icon">
                                    <Bot size={21} />
                                </div>

                                <div>
                                    <h2>AI Teaching Assistant</h2>
                                    <p>
                                        Attendance actions powered by AI
                                    </p>
                                </div>

                                <span className="td-ai-online">
                                    <span />
                                    Online
                                </span>
                            </div>

                            <div className="td-ai-body">
                                <div className="td-ai-intro">
                                    <Sparkles size={20} />
                                    <h3>How can I help you?</h3>
                                    <p>
                                        Ask me to mark attendance or check
                                        student attendance status.
                                    </p>
                                </div>

                                {students.length > 0 && (
                                    <div className="td-quick-prompts">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMessage(
                                                    `Mark student ${students[0].name} as present`
                                                )
                                            }
                                        >
                                            Mark {students[0].name} present
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMessage(
                                                    `Mark student ${students[0].name} as absent`
                                                )
                                            }
                                        >
                                            Mark {students[0].name} absent
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMessage(
                                                    "Show students with low attendance"
                                                )
                                            }
                                        >
                                            Find low attendance students
                                        </button>
                                    </div>
                                )}

                                <form
                                    onSubmit={sendAIChatMessage}
                                    className="td-ai-form"
                                >
                                    <textarea
                                        rows={3}
                                        placeholder="Type an attendance command..."
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        disabled={chatLoading}
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            chatLoading || !message.trim()
                                        }
                                    >
                                        {chatLoading ? (
                                            <>
                                                <span className="td-button-spinner" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send to AI
                                            </>
                                        )}
                                    </button>
                                </form>

                                {chatError && (
                                    <div className="td-alert td-alert-error">
                                        <AlertCircle size={17} />
                                        {chatError}
                                    </div>
                                )}

                                {chatResponse && (
                                    <div className="td-ai-response">
                                        <div className="td-ai-response-title">
                                            <Sparkles size={16} />
                                            AI Response
                                        </div>

                                        <p>{chatResponse}</p>

                                        {chatTool && (
                                            <span className="td-tool-label">
                                                Tool used: {chatTool}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        

                        {/* Info card */}
                        <section className="td-tip-card">
                            <div className="td-tip-icon">
                                <CalendarCheck size={19} />
                            </div>

                            <div>
                                <h3>Attendance tip</h3>
                                <p>
                                    Review students below 85% attendance
                                    regularly to help them improve before
                                    examination eligibility is affected.
                                </p>
                            </div>
                        </section>
                    </aside>
                </section>
            </main>
        </div>
    );
}

export default TeacherDashboard;
