import { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { Link } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();


    useEffect(()=> {
        const token = localStorage.getItem("token");
        if(token){
            navigate("/")
        }
    },[])

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/auth/loginuser",
                {
                    email,
                    password
                },
                {
                    withCredentials:true
                }
            );

                console.log("Login Response:", response.data);

                 localStorage.setItem("token", response.data.token);
                 localStorage.setItem("userId", response.data.user.id);

                console.log("Saved UserId:", localStorage.getItem("userId"));

                navigate("/");


      } catch (error) {
    console.log(error.response?.data || error.message);

    setError(
        error.response?.data?.message || "Something went wrong"
    );
      }
    }

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
                />

                <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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