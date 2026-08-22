import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import axios from "axios";

function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/login",
      null,
      {
        params: {
          username: username,
          password: password,
        },
      }
    );

    const token =
      response.data.access_token;

    const user =
      response.data.user;

    localStorage.setItem(
      "token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    if (user.role === "student") {
      window.location.href = "/student";
    } 
    else if (user.role === "parent") {
      window.location.href = "/parent";
    } 
    else if (user.role === "teacher") {
      window.location.href = "/teacher";
    } 
    else if (user.role === "principal") {
      window.location.href = "/principal";
    } 
    else {
      alert("Unknown user role");
    }

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    alert(
      error.response?.data?.detail ||
      "Login failed"
    );
  }
};

    return (
        <div className="auth-container">

            <div className="auth-card">

                <h1>XYZ AI Assistant</h1>

                <h2>Login</h2>

                <form onSubmit={handleLogin}>

                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <div className="register-links">

                    <p>Don't have an account?</p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register/student")
                        }
                    >
                        Register as Student
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register/parent")
                        }
                    >
                        Register as Parent
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Login;