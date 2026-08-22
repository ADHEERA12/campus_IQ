    import { useEffect, useState } from "react";
    import { useNavigate } from "react-router-dom";
    import api from "../services/api";

    function PrincipalDashboard() {
        const navigate = useNavigate();

        const [statistics, setStatistics] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState("");
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

            if (user.role !== "principal") {
                navigate("/dashboard");
                return;
            }

            loadStatistics();
        }, [navigate]);

        const loadStatistics = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/attendance/overall"
                );

                setStatistics(response.data);

            } catch (error) {
                setError(
                    error.response?.data?.detail ||
                    "Unable to load attendance statistics"
                );
            } finally {
                setLoading(false);
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
                    <h2>
                        Loading Principal Dashboard...
                    </h2>
                </div>
            );
        }

        return (
    <div className="dashboard-container">

        <header className="dashboard-header">

            <div>
                <h1>Principal Dashboard</h1>
                <p>School Attendance Overview</p>
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

        {statistics && (
            <>

                {/* Total Students */}
                <section className="dashboard-card">

                    <h2>Total Students</h2>

                    <h1>
                        {statistics.total_students}
                    </h1>

                </section>


                {/* Overall Attendance */}
                <section className="dashboard-card">

                    <h2>Overall Attendance</h2>

                    <h1>
                        {statistics.overall_attendance_percentage}%
                    </h1>

                    <p>
                        Average attendance across all students.
                    </p>

                </section>


                {/* Attendance Summary */}
                <section className="dashboard-card">

                    <h2>Attendance Summary</h2>

                    <p>
                        Total Students:{" "}
                        {statistics.total_students}
                    </p>

                    <p>
                        Overall Attendance:{" "}
                        {statistics.overall_attendance_percentage}%
                    </p>

                    <button onClick={loadStatistics}>
                        Refresh Statistics
                    </button>

                </section>


                {/* AI Principal Assistant */}
                <section className="dashboard-card">

                    <h2>🤖 AI Principal Assistant</h2>

                    <p>
                        Ask the AI assistant about school attendance.
                    </p>

                    <form onSubmit={sendMessage}>

                        <textarea
                            rows="4"
                            placeholder="Example: What is the overall attendance?"
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

                            <p>
                                {chatResponse}
                            </p>

                        </div>
                    )}

                </section>

            </>
        )}

    </div>
);
    }

    export default PrincipalDashboard;