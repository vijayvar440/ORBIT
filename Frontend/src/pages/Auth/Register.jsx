
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://orbit-backend-94nx.onrender.com";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        if (!cleanUsername || !cleanEmail || !password) {
            alert("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${BASE_URL}/api/auth/register`,
                {
                    username: cleanUsername,
                    email: cleanEmail,
                    password,
                },
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Register Response:", response.data);

            alert("Account created successfully! Please login.");
            navigate("/login", { replace: true });

        } catch (error) {
            console.error(
                "Registration error:",
                error.response?.status,
                error.response?.data || error.message
            );

            const status = error.response?.status;
            const message = error.response?.data?.message;

            if (!error.response) {
                alert(
                    "Cannot connect to the server. Please check your internet connection and try again."
                );
            } else if (status === 409) {
                alert(message || "Username or email already exists.");
            } else if (status === 400) {
                alert(message || "Please check your registration details.");
            } else {
                alert(message || `Registration failed (${status}).`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-logo">Orbit</div>

                <h1>Create Account</h1>

                <p className="register-subtitle">
                    Join Orbit and connect with the world
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        minLength={3}
                        maxLength={30}
                        required
                        disabled={loading}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        disabled={loading}
                    />

                    <input
                        type="password"
                        placeholder="Password (minimum 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        disabled={loading}
                    />

                    <button
                        className="register-btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="login-link">
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
