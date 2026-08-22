import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function TeacherDashboard() {
    const navigate = useNavigate();

    // ==================================================
    // USER
    // ==================================================

    const [user, setUser] = useState(null);

    // ==================================================
    // STUDENTS
    // ==================================================

    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] =
        useState(true);
    const [studentsError, setStudentsError] =
        useState("");

    const [selectedStudentId, setSelectedStudentId] =
        useState("");

    const [status, setStatus] =
        useState("present");

    const [attendanceResult, setAttendanceResult] =
        useState(null);

    const [attendanceError, setAttendanceError] =
        useState("");

    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    // ==================================================
    // AI CHAT
    // ==================================================

    const [message, setMessage] = useState("");
    const [chatResponse, setChatResponse] = useState("");
    const [chatTool, setChatTool] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState("");

    // ==================================================
    // AUTHENTICATION
    // ==================================================

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

        } catch (error) {
            console.error(
                "Invalid user data:",
                error
            );

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/");
        }
    }, [navigate]);

    // ==================================================
    // LOAD ASSIGNED STUDENTS
    // ==================================================

    const loadStudents = async () => {
        try {
            setStudentsLoading(true);
            setStudentsError("");

            const response = await api.get(
                "/teacher/students"
            );

            setStudents(
                response.data.students || []
            );

        } catch (error) {
            console.error(
                "Load students error:",
                error
            );

            setStudentsError(
                error.response?.data?.detail ||
                "Unable to load assigned students."
            );
        } finally {
            setStudentsLoading(false);
        }
    };

    // ==================================================
    // MARK ATTENDANCE
    // ==================================================

    const markAttendance = async (e) => {
        e.preventDefault();

        setAttendanceError("");
        setAttendanceResult(null);

        if (!selectedStudentId) {
            setAttendanceError(
                "Please select a student."
            );
            return;
        }

        try {
            setAttendanceLoading(true);

            const response = await api.post(
                "/attendance/mark",
                {
                    student_id:
                        Number(selectedStudentId),
                    status: status,
                }
            );

            setAttendanceResult(
                response.data
            );

            // Refresh student attendance
            await loadStudents();

            // Clear selected student
            setSelectedStudentId("");

        } catch (error) {
            console.error(
                "Mark attendance error:",
                error
            );

            setAttendanceError(
                error.response?.data?.detail ||
                "Unable to mark attendance."
            );
        } finally {
            setAttendanceLoading(false);
        }
    };

    // ==================================================
    // AI CHAT
    // ==================================================

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            return;
        }

        setChatLoading(true);
        setChatResponse("");
        setChatTool(null);
        setChatError("");

        try {
            const response = await api.post(
                "/chat",
                {
                    message: message.trim(),
                }
            );

            setChatResponse(
                response.data.message || "No response received."
            );

            setChatTool(
                response.data.tool_used || null
            );

            setMessage("");

            // Refresh students in case
            // AI marked attendance.
            await loadStudents();

        } catch (error) {
            console.error(
                "AI chat error:",
                error
            );

            setChatError(
                error.response?.data?.detail ||
                "Unable to contact AI assistant."
            );
        } finally {
            setChatLoading(false);
        }
    };

    // ==================================================
    // QUICK QUESTIONS
    // ==================================================

    const askQuickQuestion = (question) => {
        setMessage(question);
    };

    // ==================================================
    // LOGOUT
    // ==================================================

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
    };

    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="dashboard-container">

            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="dashboard-header">

                <div>
                    <h1>
                        Teacher Dashboard
                    </h1>

                    <p>
                        Welcome{user?.name ? ", " + user.name : ""}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={logout}
                >
                    Logout
                </button>

            </header>


            {/* ==========================================
                ASSIGNED STUDENTS
            ========================================== */}

            <section className="dashboard-card">

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                    }}
                >

                    <div>
                        <h2>
                            My Students
                        </h2>

                        <p>
                            Students assigned to you
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadStudents}
                        disabled={
                            studentsLoading
                        }
                    >
                        {studentsLoading
                            ? "Loading..."
                            : "Refresh"}
                    </button>

                </div>


                {/* ======================================
                    STUDENT ERROR
                ====================================== */}

                {studentsError && (
                    <div className="error">
                        {studentsError}
                    </div>
                )}


                {/* ======================================
                    LOADING
                ====================================== */}

                {studentsLoading && (
                    <p>
                        Loading assigned students...
                    </p>
                )}


                {/* ======================================
                    NO STUDENTS
                ====================================== */}

                {!studentsLoading &&
                    !studentsError &&
                    students.length === 0 && (
                        <div className="empty-state">

                            <h3>
                                No students assigned
                            </h3>

                            <p>
                                Students assigned to
                                this teacher will
                                appear here.
                            </p>

                        </div>
                    )}


                {/* ======================================
                    STUDENT LIST
                ====================================== */}

                {!studentsLoading &&
                    students.length > 0 && (

                        <div className="student-list">

                            {students.map((student) => (

                                <div
                                    className="student-card"
                                    key={student.id}
                                >

                                    <div>

                                        <h3>
                                            {
                                                student.name
                                            }
                                        </h3>

                                        <p>
                                            Student ID:{" "}
                                            {
                                                student.id
                                            }
                                        </p>

                                    </div>

                                    <div>

                                        <strong>
                                            {
                                                student
                                                    .attendance_percentage
                                            }%
                                        </strong>

                                        <p>
                                            Attendance
                                        </p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

            </section>


            {/* ==========================================
                MARK ATTENDANCE
            ========================================== */}

            <section className="dashboard-card">

                <h2>
                    Mark Attendance
                </h2>

                <p>
                    Select an assigned student and
                    mark their attendance.
                </p>


                {attendanceError && (
                    <div className="error">
                        {attendanceError}
                    </div>
                )}


                <form
                    onSubmit={markAttendance}
                >

                    <div className="form-group">

                        <label>
                            Select Student
                        </label>

                        <select
                            value={
                                selectedStudentId
                            }
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
                                -- Select Student --
                            </option>

                            {students.map(
                                (student) => (

                                    <option
                                        key={
                                            student.id
                                        }
                                        value={
                                            student.id
                                        }
                                    >
                                        {student.name}
                                        {" "}
                                        (ID:{" "}
                                        {student.id}
                                        )
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    <div className="form-group">

                        <label>
                            Attendance Status
                        </label>

                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value
                                )
                            }
                            disabled={
                                attendanceLoading
                            }
                        >

                            <option value="present">
                                Present
                            </option>

                            <option value="absent">
                                Absent
                            </option>

                        </select>

                    </div>


                    <button
                        type="submit"
                        disabled={
                            attendanceLoading ||
                            students.length === 0
                        }
                    >
                        {attendanceLoading
                            ? "Saving..."
                            : "Mark Attendance"}
                    </button>

                </form>


                {/* ======================================
                    SUCCESS
                ====================================== */}

                {attendanceResult && (
                    <div className="success">

                        <h3>
                            Attendance Updated
                            Successfully
                        </h3>

                        <p>
                            <strong>
                                Student:
                            </strong>{" "}
                            {
                                attendanceResult
                                    .student_name
                            }
                        </p>

                        <p>
                            <strong>
                                Date:
                            </strong>{" "}
                            {
                                attendanceResult.date
                            }
                        </p>

                        <p>
                            <strong>
                                Status:
                            </strong>{" "}
                            {
                                attendanceResult.status
                            }
                        </p>

                        <p>
                            <strong>
                                Attendance:
                            </strong>{" "}
                            {
                                attendanceResult
                                    .attendance_percentage
                            }%
                        </p>

                    </div>
                )}

            </section>


            {/* ==========================================
                AI ASSISTANT
            ========================================== */}

            <section className="dashboard-card">

                <h2>
                    🤖 AI Teaching Assistant
                </h2>

                <p>
                    Ask the AI assistant to perform
                    attendance-related tasks.
                </p>


                {/* QUICK QUESTIONS */}

                <div
                    className="quick-questions"
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "15px",
                    }}
                >

                    {students.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    askQuickQuestion(
                                        `Mark student ${students[0].name} as present`
                                    )
                                }
                            >
                                Mark First Student Present
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    askQuickQuestion(
                                        `Mark student ${students[0].name} as absent`
                                    )
                                }
                            >
                                Mark First Student Absent
                            </button>
                        </>
                    )}

                </div>


                {/* CHAT */}

                <form
                    onSubmit={sendMessage}
                >

                    <textarea
                        rows="4"
                        placeholder={
                            "Example: Mark Pavitra as present"
                        }
                        value={message}
                        onChange={(e) =>
                            setMessage(
                                e.target.value
                            )
                        }
                        disabled={chatLoading}
                    />

                    <button
                        type="submit"
                        disabled={
                            chatLoading ||
                            !message.trim()
                        }
                    >
                        {chatLoading
                            ? "Thinking..."
                            : "Ask AI"}
                    </button>

                </form>


                {/* AI ERROR */}

                {chatError && (
                    <div className="error">
                        {chatError}
                    </div>
                )}


                {/* AI RESPONSE */}

                {chatResponse && (
                    <div className="ai-response">

                        <h3>
                            🤖 AI Assistant
                        </h3>

                        <p>
                            {chatResponse}
                        </p>

                        {chatTool && (
                            <small>
                                Tool used:{" "}
                                {chatTool}
                            </small>
                        )}

                    </div>
                )}

            </section>

        </div>
    );
}

export default TeacherDashboard;

