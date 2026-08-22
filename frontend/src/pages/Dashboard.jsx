import { useNavigate } from "react-router-dom";

function Dashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
    };

    return (
        <div>

            <h1>XYZ AI Assistant</h1>

            {user && (
                <div>
                    <h2>
                        Welcome, {user.name}
                    </h2>

                    <p>
                        Role: {user.role}
                    </p>
                </div>
            )}

            <button onClick={logout}>
                Logout
            </button>

        </div>
    );
}

export default Dashboard;