
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ParentDashboard() {
    const navigate = useNavigate();

    // ==================================================
    // USER
    // ==================================================

    const [user, setUser] = useState(null);

    // ==================================================
    // CHILD ATTENDANCE
    // ==================================================

    const [child, setChild] = useState(null);
    const [childLoading, setChildLoading] =
        useState(true);
    const [childError, setChildError] =
        useState("");

    // ==================================================
    // ATTENDANCE GOAL
    // ==================================================

    const [targetPercentage, setTargetPercentage] =
        useState("");

    const [goalResult, setGoalResult] =
        useState(null);

    const [goalLoading, setGoalLoading] =
        useState(false);

    const [goalError, setGoalError] =
        useState("");

    // ==================================================
    // ESCALATION
    // ==================================================

    const [reason, setReason] = useState("");

    const [escalationResult, setEscalationResult] =
        useState(null);

    const [escalationLoading, setEscalationLoading] =
        useState(false);

    const [escalationError, setEscalationError] =
        useState("");

    // ==================================================
    // AI CHAT
    // ==================================================

    const [message, setMessage] = useState("");
    const [chatResponse, setChatResponse] =
        useState("");
    const [chatTool, setChatTool] =
        useState(null);
    const [chatLoading, setChatLoading] =
        useState(false);
    const [chatError, setChatError] =
        useState("");

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

            if (parsedUser.role !== "parent") {
                navigate("/dashboard");
                return;
            }

            loadChildAttendance();

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
    // LOAD CHILD ATTENDANCE
    // ==================================================

    const loadChildAttendance = async () => {
        try {
            setChildLoading(true);
            setChildError("");

            const response = await api.get(
                "/attendance/child"
            );

            setChild(response.data);

        } catch (error) {
            console.error(
                "Child attendance error:",
                error
            );

            setChildError(
                error.response?.data?.detail ||
                "Unable to load child attendance."
            );
        } finally {
            setChildLoading(false);
        }
    };

    // ==================================================
    // CALCULATE ATTENDANCE GOAL
    // ==================================================

    const calculateGoal = async (e) => {
        e.preventDefault();

        setGoalError("");
        setGoalResult(null);

        if (!targetPercentage) {
            setGoalError(
                "Please enter a target percentage."
            );
            return;
        }

        const target = Number(
            targetPercentage
        );

        if (
            !Number.isFinite(target) ||
            target <= 0 ||
            target > 100
        ) {
            setGoalError(
                "Target percentage must be between 1 and 100."
            );
            return;
        }

        /*
         * The current backend exposes this
         * calculation through the AI /chat
         * tool rather than a dedicated REST
         * endpoint.
         *
         * Therefore we ask the AI assistant
         * using the natural-language request.
         */

        try {
            setGoalLoading(true);

            const response = await api.post(
                "/chat",
                {
                    message:
                        `Calculate how many future classes my attendance needs to reach ${target}% attendance.`
                }
            );

            setGoalResult({
                message:
                    response.data.message,
                data:
                    response.data.data || null,
            });

        } catch (error) {
            console.error(
                "Attendance goal error:",
                error
            );

            setGoalError(
                error.response?.data?.detail ||
                "Unable to calculate attendance goal."
            );
        } finally {
            setGoalLoading(false);
        }
    };

    // ==================================================
    // REQUEST TEACHER CALL
    // ==================================================

    const requestTeacherCall = async (e) => {
        e.preventDefault();

        setEscalationError("");
        setEscalationResult(null);

        if (!reason.trim()) {
            setEscalationError(
                "Please provide a reason."
            );
            return;
        }

        try {
            setEscalationLoading(true);

            const response = await api.post(
                "/escalation/request",
                {
                    reason: reason.trim(),
                }
            );

            setEscalationResult(
                response.data
            );

            setReason("");

        } catch (error) {
            console.error(
                "Escalation error:",
                error
            );

            setEscalationError(
                error.response?.data?.detail ||
                "Unable to request teacher call."
            );
        } finally {
            setEscalationLoading(false);
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
                response.data.message ||
                "No response received."
            );

            setChatTool(
                response.data.tool_used || null
            );

            setMessage("");

            // Refresh attendance in case
            // the AI response depends on it.
            await loadChildAttendance();

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
    // ATTENDANCE STATUS
    // ==================================================

    const getAttendanceStatus = () => {
        if (!child) {
            return "";
        }

        const percentage =
            Number(
                child.attendance_percentage
            );

        if (percentage >= 85) {
            return "Good";
        }

        if (percentage >= 75) {
            return "Needs Attention";
        }

        return "Low Attendance";
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
                        Parent Dashboard
                    </h1>

                    <p>
                        Welcome
                        {user?.name
                            ? `, ${user.name}`
                            : ""}
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
                CHILD ATTENDANCE
            ========================================== */}

            <section className="dashboard-card">

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                    }}
                >

                    <div>

                        <h2>
                            Child Attendance
                        </h2>

                        <p>
                            Current attendance
                            information
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={
                            loadChildAttendance
                        }
                        disabled={
                            childLoading
                        }
                    >
                        {childLoading
                            ? "Loading..."
                            : "Refresh"}
                    </button>

                </div>


                {childError && (
                    <div className="error">
                        {childError}
                    </div>
                )}


                {childLoading && (
                    <p>
                        Loading child information...
                    </p>
                )}


                {child && (
                    <div className="attendance-summary">

                        <h3>
                            {child.student_name}
                        </h3>

                        <p>
                            Student ID:{" "}
                            {child.student_id}
                        </p>

                        <div
                            style={{
                                marginTop: "20px",
                            }}
                        >

                            <h1>
                                {
                                    child.attendance_percentage
                                }%
                            </h1>

                            <p>
                                Attendance
                            </p>

                            <strong>
                                Status:{" "}
                                {
                                    getAttendanceStatus()
                                }
                            </strong>

                        </div>

                    </div>
                )}

            </section>


            {/* ==========================================
                ATTENDANCE GOAL
            ========================================== */}

            <section className="dashboard-card">

                <h2>
                    🎯 Attendance Goal
                </h2>

                <p>
                    Find out how many future classes
                    are needed to reach a target
                    attendance percentage.
                </p>


                {goalError && (
                    <div className="error">
                        {goalError}
                    </div>
                )}


                <form
                    onSubmit={calculateGoal}
                >

                    <div className="form-group">

                        <label>
                            Target Attendance %
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.1"
                            placeholder="Example: 85"
                            value={
                                targetPercentage
                            }
                            onChange={(e) =>
                                setTargetPercentage(
                                    e.target.value
                                )
                            }
                            disabled={
                                goalLoading
                            }
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={
                            goalLoading
                        }
                    >
                        {goalLoading
                            ? "Calculating..."
                            : "Calculate Goal"}
                    </button>

                </form>


                {goalResult && (
                    <div className="success">

                        <h3>
                            Attendance Goal
                        </h3>

                        <p>
                            {goalResult.message}
                        </p>

                        {goalResult.data && (
                            <>
                                <p>
                                    Current:{" "}
                                    {
                                        goalResult
                                            .data
                                            .current_percentage
                                    }%
                                </p>

                                <p>
                                    Target:{" "}
                                    {
                                        goalResult
                                            .data
                                            .target_percentage
                                    }%
                                </p>

                                <p>
                                    Classes needed:{" "}
                                    {
                                        goalResult
                                            .data
                                            .classes_needed
                                    }
                                </p>

                                <p>
                                    Final projected
                                    attendance:{" "}
                                    {
                                        goalResult
                                            .data
                                            .final_percentage
                                    }%
                                </p>
                            </>
                        )}

                    </div>
                )}

            </section>


            {/* ==========================================
                TEACHER ESCALATION
            ========================================== */}

            <section className="dashboard-card">

                <h2>
                    📞 Request Teacher Call
                </h2>

                <p>
                    Contact your child's assigned
                    teacher regarding an attendance
                    or academic concern.
                </p>


                {escalationError && (
                    <div className="error">
                        {escalationError}
                    </div>
                )}


                <form
                    onSubmit={
                        requestTeacherCall
                    }
                >

                    <div className="form-group">

                        <label>
                            Reason
                        </label>

                        <textarea
                            rows="4"
                            placeholder={
                                "Explain why you want to contact the teacher..."
                            }
                            value={reason}
                            onChange={(e) =>
                                setReason(
                                    e.target.value
                                )
                            }
                            disabled={
                                escalationLoading
                            }
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        disabled={
                            escalationLoading
                        }
                    >
                        {escalationLoading
                            ? "Submitting..."
                            : "Request Teacher Call"}
                    </button>

                </form>


                {escalationResult && (
                    <div className="success">

                        <h3>
                            Request Confirmed
                        </h3>

                        <p>
                            {
                                escalationResult
                                    .message
                            }
                        </p>

                        <p>
                            <strong>
                                Ticket ID:
                            </strong>{" "}
                            {
                                escalationResult
                                    .ticket_id
                            }
                        </p>

                        <p>
                            <strong>
                                Status:
                            </strong>{" "}
                            {
                                escalationResult
                                    .status
                            }
                        </p>

                    </div>
                )}

            </section>


            {/* ==========================================
                AI ASSISTANT
            ========================================== */}

            <section className="dashboard-card">

                <h2>
                    🤖 AI Parent Assistant
                </h2>

                <p>
                    Ask questions about your child's
                    attendance.
                </p>


                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "15px",
                    }}
                >

                    <button
                        type="button"
                        onClick={() =>
                            askQuickQuestion(
                                "What is my child's attendance?"
                            )
                        }
                    >
                        Check Attendance
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            askQuickQuestion(
                                "Is my child's attendance good?"
                            )
                        }
                    >
                        Check Status
                    </button>

                </div>


                <form
                    onSubmit={sendMessage}
                >

                    <textarea
                        rows="4"
                        placeholder={
                            "Example: What is my child's attendance?"
                        }
                        value={message}
                        onChange={(e) =>
                            setMessage(
                                e.target.value
                            )
                        }
                        disabled={
                            chatLoading
                        }
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


                {chatError && (
                    <div className="error">
                        {chatError}
                    </div>
                )}


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

export default ParentDashboard;

