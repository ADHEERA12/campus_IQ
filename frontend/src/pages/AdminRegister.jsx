
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    GraduationCap,
    ShieldCheck,
    User,
    UserPlus,
    Lock,
    ArrowLeft,
    Eye,
    EyeOff,
    Users,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
} from "lucide-react";
import "./AdminRegister.css";

function AdminRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        role: "teacher",
        class_id: "",
        teacher_id: "",
        child_id: "",
    });

    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    classResponse,
                    teacherResponse,
                    studentResponse,
                ] = await Promise.all([
                    api.get("/admin/classes"),
                    api.get("/admin/teachers"),
                    api.get("/admin/students"),
                ]);

                setClasses(classResponse.data);
                setTeachers(teacherResponse.data);
                setStudents(studentResponse.data);
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "Failed to load registration data."
                );
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setMessage("");
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        const payload = {
            name: formData.name.trim(),
            username: formData.username.trim(),
            password: formData.password,
            role: formData.role,
        };

        if (formData.role === "student") {
            payload.class_id = Number(formData.class_id);
            payload.teacher_id = Number(formData.teacher_id);
        }

        if (formData.role === "parent") {
            payload.child_id = Number(formData.child_id);
        }

        try {
            const response = await api.post(
                "/admin/create-user",
                payload
            );

            setMessage(
                response.data.message ||
                "User registered successfully!"
            );

            setFormData({
                name: "",
                username: "",
                password: "",
                role: formData.role,
                class_id: "",
                teacher_id: "",
                child_id: "",
            });
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { value: "teacher", label: "Teacher" },
        { value: "student", label: "Student" },
        { value: "parent", label: "Parent" },
        { value: "principal", label: "Principal" },
        { value: "admin", label: "Admin" },
    ];

    return (
        <div className="ar-page">

            {/* LEFT BRAND PANEL */}
            <aside className="ar-sidebar">

                <div className="ar-brand">
                    <div className="ar-brand-icon">
                        <GraduationCap size={27} />
                    </div>

                    <div>
                        <h2>Campus IQ</h2>
                        <span>Intelligent Campus Platform</span>
                    </div>
                </div>

                <div className="ar-sidebar-content">

                    <div className="ar-sidebar-tag">
                        <ShieldCheck size={15} />
                        ADMIN CONTROL CENTER
                    </div>

                    <h1>
                        Build your
                        <span>campus community.</span>
                    </h1>

                    <p>
                        Create and manage secure accounts for everyone
                        in your educational ecosystem.
                    </p>

                    <div className="ar-feature-list">

                        <div className="ar-feature">
                            <div className="ar-feature-icon">
                                <Users size={19} />
                            </div>

                            <div>
                                <strong>Role-based access</strong>
                                <span>
                                    Assign the right permissions
                                </span>
                            </div>
                        </div>

                        <div className="ar-feature">
                            <div className="ar-feature-icon">
                                <BookOpen size={19} />
                            </div>

                            <div>
                                <strong>Academic connections</strong>
                                <span>
                                    Link students, classes and teachers
                                </span>
                            </div>
                        </div>

                        <div className="ar-feature">
                            <div className="ar-feature-icon">
                                <ShieldCheck size={19} />
                            </div>

                            <div>
                                <strong>Secure registration</strong>
                                <span>
                                    Centralized account administration
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="ar-sidebar-footer">
                    <div className="ar-footer-shield">
                        <ShieldCheck size={16} />
                    </div>

                    <span>
                        Admin-only account management
                    </span>
                </div>

                <div className="ar-decoration ar-decoration-one" />
                <div className="ar-decoration ar-decoration-two" />

            </aside>


            {/* RIGHT FORM PANEL */}
            <main className="ar-main">

                <div className="ar-form-container">

                    {/* TOP NAVIGATION */}
                    <div className="ar-topbar">

                        <button
                            type="button"
                            className="ar-back-button"
                            onClick={() => navigate("/dashboard")}
                        >
                            <ArrowLeft size={17} />
                            Dashboard
                        </button>

                        <div className="ar-secure-label">
                            <ShieldCheck size={15} />
                            Secure registration
                        </div>

                    </div>


                    {/* FORM HEADING */}
                    <div className="ar-heading">

                        <div className="ar-heading-icon">
                            <UserPlus size={23} />
                        </div>

                        <div className="ar-heading-eyebrow">
                            USER MANAGEMENT
                        </div>

                        <h2>Create a new account</h2>

                        <p>
                            Enter the details below to create a Campus IQ account.
                        </p>

                    </div>


                    {/* FEEDBACK */}
                    {message && (
                        <div className="ar-alert ar-success">
                            <CheckCircle2 size={19} />
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="ar-alert ar-error">
                            <AlertCircle size={19} />
                            <span>{error}</span>
                        </div>
                    )}


                    {/* FORM */}
                    <form
                        className="ar-form"
                        onSubmit={handleSubmit}
                    >

                        {/* ROLE */}
                        <div className="ar-field">

                            <label htmlFor="ar-role">
                                Account role
                            </label>

                            <div className="ar-input-wrapper">
                                <ShieldCheck
                                    className="ar-input-icon"
                                    size={18}
                                />

                                <select
                                    id="ar-role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    {roles.map((role) => (
                                        <option
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown
                                    className="ar-select-icon"
                                    size={17}
                                />
                            </div>

                            <span className="ar-field-hint">
                                Select the access level for this account.
                            </span>

                        </div>


                        {/* NAME */}
                        <div className="ar-field">

                            <label htmlFor="ar-name">
                                Full name
                            </label>

                            <div className="ar-input-wrapper">
                                <User
                                    className="ar-input-icon"
                                    size={18}
                                />

                                <input
                                    id="ar-name"
                                    type="text"
                                    name="name"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                        </div>


                        {/* USERNAME */}
                        <div className="ar-field">

                            <label htmlFor="ar-username">
                                Username
                            </label>

                            <div className="ar-input-wrapper">
                                <UserPlus
                                    className="ar-input-icon"
                                    size={18}
                                />

                                <input
                                    id="ar-username"
                                    type="text"
                                    name="username"
                                    placeholder="Choose a username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>

                        </div>


                        {/* PASSWORD */}
                        <div className="ar-field">

                            <label htmlFor="ar-password">
                                Password
                            </label>

                            <div className="ar-input-wrapper">
                                <Lock
                                    className="ar-input-icon"
                                    size={18}
                                />

                                <input
                                    id="ar-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />

                                <button
                                    type="button"
                                    className="ar-password-toggle"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>

                            <span className="ar-field-hint">
                                Minimum 6 characters.
                            </span>

                        </div>


                        {/* STUDENT EXTRA FIELDS */}
                        {formData.role === "student" && (
                            <div className="ar-dependent-fields">

                                <div className="ar-dependent-heading">
                                    <BookOpen size={17} />
                                    Student academic details
                                </div>

                                <div className="ar-field">

                                    <label htmlFor="ar-class">
                                        Class & section
                                    </label>

                                    <div className="ar-input-wrapper">
                                        <GraduationCap
                                            className="ar-input-icon"
                                            size={18}
                                        />

                                        <select
                                            id="ar-class"
                                            name="class_id"
                                            value={formData.class_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Select class
                                            </option>

                                            {classes.map((c) => (
                                                <option
                                                    key={c.id}
                                                    value={c.id}
                                                >
                                                    {c.name}-{c.section}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            className="ar-select-icon"
                                            size={17}
                                        />
                                    </div>

                                </div>

                                <div className="ar-field">

                                    <label htmlFor="ar-teacher">
                                        Assign teacher
                                    </label>

                                    <div className="ar-input-wrapper">
                                        <Users
                                            className="ar-input-icon"
                                            size={18}
                                        />

                                        <select
                                            id="ar-teacher"
                                            name="teacher_id"
                                            value={formData.teacher_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Select teacher
                                            </option>

                                            {teachers.map((t) => (
                                                <option
                                                    key={t.id}
                                                    value={t.id}
                                                >
                                                    {t.name} (ID: {t.id})
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            className="ar-select-icon"
                                            size={17}
                                        />
                                    </div>

                                </div>

                            </div>
                        )}


                        {/* PARENT EXTRA FIELD */}
                        {formData.role === "parent" && (
                            <div className="ar-dependent-fields">

                                <div className="ar-dependent-heading">
                                    <Users size={17} />
                                    Parent-child connection
                                </div>

                                <div className="ar-field">

                                    <label htmlFor="ar-child">
                                        Link to student
                                    </label>

                                    <div className="ar-input-wrapper">
                                        <GraduationCap
                                            className="ar-input-icon"
                                            size={18}
                                        />

                                        <select
                                            id="ar-child"
                                            name="child_id"
                                            value={formData.child_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Select student
                                            </option>

                                            {students.map((s) => (
                                                <option
                                                    key={s.id}
                                                    value={s.id}
                                                >
                                                    {s.name} (ID: {s.id})
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            className="ar-select-icon"
                                            size={17}
                                        />
                                    </div>

                                </div>

                            </div>
                        )}


                        {/* SUBMIT */}
                        <button
                            type="submit"
                            className="ar-submit-button"
                            disabled={loading || dataLoading}
                        >
                            {loading ? (
                                <>
                                    <span className="ar-spinner" />
                                    Creating account...
                                </>
                            ) : dataLoading ? (
                                "Loading registration data..."
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Create {formData.role.charAt(0).toUpperCase() +
                                        formData.role.slice(1)} Account
                                </>
                            )}
                        </button>

                    </form>


                    {/* BOTTOM */}
                    <div className="ar-bottom-note">
                        <ShieldCheck size={15} />
                        Accounts are created securely by the administrator.
                    </div>

                </div>

            </main>

        </div>
    );
}

export default AdminRegister;
