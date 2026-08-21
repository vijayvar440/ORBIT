import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            navigate("/");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // ✅ Clean & Corrected URL
            const BASE_URL = import.meta.env.VITE_API_URL || "https://orbit-backend-94nx.onrender.com";

            const response = await axios.post(
                `${BASE_URL}/api/auth/register`,
                {
                    username,
                    email,
                    password
                },
                {
                    withCredentials: true
                }
            );

            console.log("Register Response:", response.data);
            alert("Account created successfully!");
            navigate("/login");

        } catch (error) {
            console.log(
                error.response?.data || error.message
            );
            alert(error.response?.data?.message || "Registration failed!");
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-logo">
                    Orbit
                </div>

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
                        required
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        className="register-btn"
                        type="submit"
                    >
                        Create Account
                    </button>
                </form>

                <div className="login-link">
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Register;