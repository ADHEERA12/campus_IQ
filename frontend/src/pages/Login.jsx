
import { useState } from "react";
import api from "../services/api";
import {
    User,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    AlertCircle,
} from "lucide-react";

import "./Login.css";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
           const response = await api.post(
    "/login",
    null,
    {
        params: {
            username,
            password,
        },
    }
);

            const token = response.data.access_token;
            const user = response.data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            if (user.role === "student") {
                window.location.href = "/student";
            } else if (user.role === "parent") {
                window.location.href = "/parent";
            } else if (user.role === "teacher") {
                window.location.href = "/teacher";
            } else if (user.role === "principal") {
                window.location.href = "/principal";
            } else if (user.role === "admin") {
                window.location.href = "/admin/register";
            } else {
                alert("Unknown user role");
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Invalid username or password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-shell">

                {/* Left Branding Panel */}
                <section className="login-brand-panel">

                    <div className="brand-placeholder">
                        {/* Your logo will be added here */}
                        <div className="brand-name">
                            Campus <span>IQ</span>
                        </div>
                    </div>

                    <div className="brand-content">
                        <span className="brand-eyebrow">
                            EDUCATION INTELLIGENCE
                        </span>

                        <h1>
                            Smarter campus.
                            <br />
                            <span>Better insights.</span>
                        </h1>

                        <p>
                            A connected platform for attendance,
                            insights, communication, and intelligent
                            campus management.
                        </p>
                    </div>

                    <div className="brand-bottom">
                        <div className="brand-accent-line"></div>
                        <span>Intelligence that connects your campus.</span>
                    </div>

                    {/* Decorative elements */}
                    <div className="brand-decoration brand-decoration-one"></div>
                    <div className="brand-decoration brand-decoration-two"></div>
                    <div className="brand-decoration brand-decoration-three"></div>

                </section>

                {/* Right Login Panel */}
                <section className="login-form-panel">

                    <div className="login-form-container">

                        <div className="login-heading">
                            <span className="login-welcome-label">
                                WELCOME BACK
                            </span>

                            <h2>Sign in to your account</h2>

                            <p>
                                Enter your credentials to access
                                your Campus IQ workspace.
                            </p>
                        </div>

                        {error && (
                            <div className="login-error">
                                <AlertCircle size={17} />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>

                            {/* Username */}
                            <div className="login-field">
                                <label htmlFor="login-username">
                                    Username
                                </label>

                                <div className="login-input-wrapper">
                                    <User
                                        size={18}
                                        className="login-input-icon"
                                    />

                                    <input
                                        id="login-username"
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="login-field">
                                <label htmlFor="login-password">
                                    Password
                                </label>

                                <div className="login-input-wrapper">
                                    <Lock
                                        size={18}
                                        className="login-input-icon"
                                    />

                                    <input
                                        id="login-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="login-password-toggle"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="login-spinner"></span>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                        </form>

                        <div className="login-security-note">
                            <span className="security-dot"></span>
                            Secure access to your campus workspace
                        </div>

                    </div>

                    <div className="login-copyright">
                        © {new Date().getFullYear()} Campus IQ
                    </div>

                </section>

            </div>
        </div>
    );
}

export default Login;
