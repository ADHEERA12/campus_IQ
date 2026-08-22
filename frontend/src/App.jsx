import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import StudentRegister from "./pages/StudentRegister";
import ParentRegister from "./pages/ParentRegister";

import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import PrincipalDashboard from "./pages/PrincipalDashboard";


function App() {

    const token = localStorage.getItem("token");
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );


    const getDashboard = () => {

        if (!token || !user) {
            return <Navigate to="/" replace />;
        }

        switch (user.role) {

            case "student":
                return <StudentDashboard />;

            case "parent":
                return <ParentDashboard />;

            case "teacher":
                return <TeacherDashboard />;

            case "principal":
                return <PrincipalDashboard />;

            default:
                return <Navigate to="/" replace />;
        }
    };


    return (

        <Routes>

            {/* =========================
                LOGIN
            ========================== */}
            <Route
    path="/principal-dashboard"
    element={<PrincipalDashboard />}
/>

            <Route
                path="/"
                element={<Login />}
            />


            {/* =========================
                STUDENT REGISTRATION
            ========================== */}

            <Route
                path="/register/student"
                element={<StudentRegister />}
            />


            {/* =========================
                PARENT REGISTRATION
            ========================== */}

            <Route
                path="/register/parent"
                element={<ParentRegister />}
            />


            {/* =========================
                COMMON DASHBOARD
            ========================== */}

            <Route
                path="/dashboard"
                element={getDashboard()}
            />


            {/* =========================
                STUDENT
            ========================== */}

            <Route
                path="/student"
                element={
                    token && user?.role === "student"
                        ? <StudentDashboard />
                        : <Navigate to="/" replace />
                }
            />


            {/* =========================
                PARENT
            ========================== */}

            <Route
                path="/parent"
                element={
                    token && user?.role === "parent"
                        ? <ParentDashboard />
                        : <Navigate to="/" replace />
                }
            />


            {/* =========================
                TEACHER
            ========================== */}

            <Route
                path="/teacher"
                element={
                    token && user?.role === "teacher"
                        ? <TeacherDashboard />
                        : <Navigate to="/" replace />
                }
            />


            {/* =========================
                PRINCIPAL
            ========================== */}

            <Route
                path="/principal"
                element={
                    token && user?.role === "principal"
                        ? <PrincipalDashboard />
                        : <Navigate to="/" replace />
                }
            />


            {/* =========================
                INVALID URL
            ========================== */}

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />

        </Routes>

    );
}

export default App;