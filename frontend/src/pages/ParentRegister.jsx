import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { User, Lock, UserCheck, ArrowLeft, GraduationCap, Users, Hash } from "lucide-react";

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

            setMessage(response.data.message || "Parent registration successful!");

            setTimeout(() => {
                navigate("/");
            }, 1500);

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Registration failed. Please verify your child's student ID."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-brand">
                    <div className="auth-brand-logo">
                        <GraduationCap size={26} />
                    </div>
                    <span className="auth-brand-title">XYZ AI Assistant</span>
                </div>

                <div className="auth-hero-content">
                    <h1 className="auth-hero-title">
                        Join as a <span>Parent</span>
                    </h1>
                    <p className="auth-hero-desc">
                        Monitor your child's academic attendance, receive AI insights, and easily request direct communications with teachers.
                    </p>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748B', zIndex: 2 }}>
                    © 2026 XYZ AI Education System
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card-wrapper animate-fade-in">
                    <div className="auth-card-header">
                        <h2>Create Parent Account</h2>
                        <p>Select your role and link your child's student ID</p>
                    </div>

                    <div className="role-selector">
                        <div 
                            className="role-option"
                            onClick={() => navigate("/register/student")}
                        >
                            <div className="role-option-icon">
                                <GraduationCap size={24} style={{ margin: '0 auto' }} />
                            </div>
                            <div className="role-option-title">Student</div>
                            <div className="role-option-desc">Track attendance & goals</div>
                        </div>

                        <div className="role-option active">
                            <div className="role-option-icon">
                                <Users size={24} style={{ margin: '0 auto' }} />
                            </div>
                            <div className="role-option-title">Parent</div>
                            <div className="role-option-desc">Monitor child's progress</div>
                        </div>
                    </div>

                    {message && (
                        <div className="alert alert-success">
                            <span>✓ {message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠ {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Parent Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '42px' }}
                                />
                                <UserCheck 
                                    size={18} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: 'var(--text-muted)' 
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Choose a username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '42px' }}
                                />
                                <User 
                                    size={18} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: 'var(--text-muted)' 
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Choose a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '42px' }}
                                />
                                <Lock 
                                    size={18} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: 'var(--text-muted)' 
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label>Child Student ID</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    name="child_id"
                                    placeholder="Enter child's numerical ID (e.g., 101)"
                                    value={formData.child_id}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '42px' }}
                                />
                                <Hash 
                                    size={18} 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: 'var(--text-muted)' 
                                    }} 
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="spinner"></span>
                                    <span>Registering...</span>
                                </span>
                            ) : (
                                <span>Register as Parent</span>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%', padding: '10px' }}
                            onClick={() => navigate("/")}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Login</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ParentRegister;