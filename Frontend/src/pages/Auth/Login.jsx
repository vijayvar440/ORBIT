import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous error

        try {
            // ✅ Clean Environment Variable with Safe Fallback
            const BASE_URL = import.meta.env.VITE_API_URL || "https://orbit-backend-94nx.onrender.com";

            const response = await axios.post(
                `${BASE_URL}/api/auth/loginuser`,
                {
                    email,
                    password
                },
                {
                    withCredentials: true
                }
            );

            console.log("Login Response:", response.data);

            // Save token and userId safely
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }
            if (response.data.user?.id || response.data.user?._id) {
                localStorage.setItem("userId", response.data.user.id || response.data.user._id);
            }

            console.log("Saved UserId:", localStorage.getItem("userId"));

            // Redirect to Home
            navigate("/");

        } catch (error) {
            console.log("Login Error:", error.response?.data || error.message);

            setError(
                error.response?.data?.message || "Something went wrong"
            );
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <p className="login-error">
                            {error}
                        </p>
                    )}

                    <button className="login-btn" type="submit">
                        Login
                    </button>
                </form>

                <div className="register-link">
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;