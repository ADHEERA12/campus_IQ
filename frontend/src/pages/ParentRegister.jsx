import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ParentRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        child_id: "",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await api.post(
                "/register/parent",
                {
                    name: formData.name,
                    username: formData.username,
                    password: formData.password,
                    child_id: Number(formData.child_id),
                }
            );

            setMessage(response.data.message);

            setTimeout(() => {
                navigate("/");
            }, 1500);

        } catch (error) {
            setError(
                error.response?.data?.detail ||
                "Registration failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-card">

                <h1>Parent Registration</h1>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="name"
                        placeholder="Parent Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="child_id"
                        placeholder="Child Student ID"
                        value={formData.child_id}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>

                </form>

                {message && (
                    <p className="success">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <p>
                    Already have an account?
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/")}
                >
                    Go to Login
                </button>

            </div>

        </div>
    );
}

export default ParentRegister;