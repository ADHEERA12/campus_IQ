
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    ArrowRight,
    LogOut,
    ShieldCheck,
    Users,
    BookOpen,
    UserRound,
    Sparkles,
    LayoutDashboard,
} from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user") || "null");

    const role = user?.role?.toLowerCase() || "user";

    const roleInfo = {
        admin: {
    label: "Administrator",
    icon: ShieldCheck,
    description: "Manage accounts, users and platform operations.",
    path: "/admin/register",
},
       
        teacher: {
            label: "Teacher",
            icon: BookOpen,
            description: "Manage your classes, attendance and student progress.",
            path: "/teacher",
        },
        student: {
            label: "Student",
            icon: GraduationCap,
            description: "Track your attendance and academic progress.",
            path: "/student",
        },
        parent: {
            label: "Parent",
            icon: Users,
            description: "Monitor your child's attendance and progress.",
            path: "/parent",
        },
        principal: {
            label: "Principal",
            icon: ShieldCheck,
            description: "Monitor school performance and attendance insights.",
            path: "/principal",
        },
    };

    const currentRole = roleInfo[role] || {
        label: role,
        icon: UserRound,
        description: "Welcome to your Campus IQ account.",
        path: "/",
    };

    const RoleIcon = currentRole.icon;

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="welcome-page">

            {/* NAVBAR */}
            <nav className="welcome-navbar">
                <div className="welcome-brand">
                    <div className="welcome-brand-icon">
                        <GraduationCap size={25} />
                    </div>

                    <div className="welcome-brand-text">
                        <h2>Campus IQ</h2>
                        <span>Intelligent Campus Platform</span>
                    </div>
                </div>

                <button
                    className="welcome-logout"
                    onClick={logout}
                >
                    <LogOut size={17} />
                    Logout
                </button>
            </nav>


            {/* MAIN CONTENT */}
            <main className="welcome-main">

                {/* HERO */}
                <section className="welcome-hero">

                    <div className="welcome-hero-content">

                        <div className="welcome-eyebrow">
                            <Sparkles size={15} />
                            YOUR CAMPUS, INTELLIGENTLY CONNECTED
                        </div>

                        <h1>
                            Welcome back,
                            <span>{user?.name || "User"}!</span>
                        </h1>

                        <p>
                            Everything you need to stay connected,
                            informed and productive — all in one place.
                        </p>

                        <button
                            className="welcome-primary-button"
                            onClick={() => navigate(currentRole.path)}
                        >
                            Go to Dashboard
                            <ArrowRight size={18} />
                        </button>

                    </div>

                    <div className="welcome-hero-visual">
                        <div className="welcome-visual-circle">
                            <GraduationCap size={92} strokeWidth={1.4} />
                        </div>

                        <div className="welcome-floating-card">
                            <div className="welcome-floating-icon">
                                <LayoutDashboard size={18} />
                            </div>

                            <div>
                                <strong>Campus IQ</strong>
                                <span>Smart Campus Experience</span>
                            </div>
                        </div>
                    </div>

                </section>


                {/* USER PROFILE */}
                <section className="welcome-profile-section">

                    <div className="welcome-section-heading">
                        <div>
                            <span className="welcome-section-label">
                                YOUR ACCOUNT
                            </span>

                            <h2>Account Overview</h2>
                        </div>
                    </div>


                    <div className="welcome-profile-card">

                        <div className="welcome-profile-avatar">
                            <RoleIcon size={28} />
                        </div>

                        <div className="welcome-profile-details">
                            <span className="welcome-profile-label">
                                Signed in as
                            </span>

                            <h3>{user?.name || "User"}</h3>

                            <span className="welcome-role-badge">
                                <RoleIcon size={14} />
                                {currentRole.label}
                            </span>
                        </div>

                        <div className="welcome-profile-description">
                            {currentRole.description}
                        </div>

                        <button
                            className="welcome-profile-action"
                            onClick={() => navigate(currentRole.path)}
                            aria-label="Open dashboard"
                        >
                            <ArrowRight size={20} />
                        </button>

                    </div>

                </section>


                {/* QUICK ACCESS */}
                <section className="welcome-quick-section">

                    <div className="welcome-section-heading">
                        <div>
                            <span className="welcome-section-label">
                                QUICK ACCESS
                            </span>

                            <h2>Ready to get started?</h2>
                        </div>
                    </div>

                    <div className="welcome-quick-card">

                        <div className="welcome-quick-icon">
                            <LayoutDashboard size={23} />
                        </div>

                        <div className="welcome-quick-content">
                            <h3>{currentRole.label} Dashboard</h3>

                            <p>
                                {currentRole.description}
                            </p>
                        </div>

                        <button
                            className="welcome-quick-button"
                            onClick={() => navigate(currentRole.path)}
                        >
                            Open
                            <ArrowRight size={17} />
                        </button>

                    </div>

                </section>


                {/* FOOTER */}
                <footer className="welcome-footer">
                    <div className="welcome-footer-brand">
                        <GraduationCap size={17} />
                        Campus IQ
                    </div>

                    <span>
                        Intelligent tools for smarter education.
                    </span>
                </footer>

            </main>
        </div>
    );
}

export default Dashboard;
