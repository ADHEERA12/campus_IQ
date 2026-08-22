import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function StudentDashboard() {
    const navigate = useNavigate();

    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [target, setTarget] = useState("");
    const [goalResult, setGoalResult] = useState(null);
    const [goalLoading, setGoalLoading] = useState(false);

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

        const user = JSON.parse(userData);

        if (user.role !== "student") {
            navigate("/dashboard");
            return;
        }

        loadAttendance();
    }, [navigate]);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/attendance/my");

            setAttendance(response.data);
        } catch (error) {
            setError(
                error.response?.data?.detail ||
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
        } catch (error) {
            setError(
                error.response?.data?.detail ||
                "Unable to calculate attendance goal"
            );
        } finally {
            setGoalLoading(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim()) return;

        try {
            setChatLoading(true);
            setChatResponse("");

            const response = await api.post("/chat", {
                message
            });

            setChatResponse(response.data.message);
            setMessage("");
        } catch (error) {
            setChatResponse(
                error.response?.data?.detail ||
                "Unable to contact AI assistant"
            );
        } finally {
            setChatLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <h2>Loading Student Dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            <header className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>XYZ AI School Assistant</p>
                </div>

                <button onClick={logout}>
                    Logout
                </button>
            </header>

            {error && (
                <div className="error">
                    {error}
                </div>
            )}

            {attendance && (
                <section className="dashboard-card">
                    <h2>My Attendance</h2>

                    <h1>
                        {attendance.attendance_percentage}%
                    </h1>

                    <p>
                        Student: {attendance.student_name}
                    </p>

                    <p>
                        Student ID: {attendance.student_id}
                    </p>

                    <button onClick={loadAttendance}>
                        Refresh Attendance
                    </button>
                </section>
            )}

            <section className="dashboard-card">
                <h2>Attendance Goal</h2>

                <form onSubmit={calculateGoal}>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        step="0.01"
                        placeholder="Target percentage"
                        value={target}
                        onChange={(e) =>
                            setTarget(e.target.value)
                        }
                        required
                    />

                    <button
                        type="submit"
                        disabled={goalLoading}
                    >
                        {goalLoading
                            ? "Calculating..."
                            : "Calculate Goal"}
                    </button>
                </form>

                {goalResult && (
                    <div className="goal-result">
                        <h3>AI Result</h3>

                        <p>
                            {goalResult.message}
                        </p>

                        {goalResult.data && (
                            <>
                                <p>
                                    Current:
                                    {" "}
                                    {goalResult.data.current_percentage}%
                                </p>

                                <p>
                                    Target:
                                    {" "}
                                    {goalResult.data.target_percentage}%
                                </p>

                                <p>
                                    Classes needed:
                                    {" "}
                                    {goalResult.data.classes_needed}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </section>

            <section className="dashboard-card">
                <h2>🤖 XYZ AI Assistant</h2>

                <form onSubmit={sendMessage}>
                    <textarea
                        rows="4"
                        placeholder="Ask about your attendance..."
                        value={message}
                        onChange={(e) =>
                            setMessage(e.target.value)
                        }
                    />

                    <button
                        type="submit"
                        disabled={chatLoading}
                    >
                        {chatLoading
                            ? "Thinking..."
                            : "Ask AI"}
                    </button>
                </form>

                {chatResponse && (
                    <div className="ai-response">
                        <h3>AI Assistant</h3>
                        <p>{chatResponse}</p>
                    </div>
                )}
            </section>

        </div>
    );
}

export default StudentDashboard;