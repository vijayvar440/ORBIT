import { useEffect, useState } from "react";
import axios from "axios";
import "./Setting.css";
import { useTheme } from "../../ThemeContext";
import { useNavigate } from "react-router-dom";

function Settings() {

    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const fetchPrivacy = async () => {

        try {

            const response = await axios.get(
                "http://localhost:3000/api/Post/profile",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setIsPrivate(response.data.user.isPrivate);
            setUser(response.data.user);

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    };

    useEffect(() => {
        fetchPrivacy();
    }, []);


    const handlePrivacy = async () => {

        try {

            setLoading(true);

            const newPrivacy = !isPrivate;

           await axios.put(
    "http://localhost:3000/api/Post/account/privacy",
    {
        isPrivate: newPrivacy
    },
    {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
    }
);

            setIsPrivate(newPrivacy);

        } catch (err) {

            console.log(err.response?.data || err.message);

        } finally {

            setLoading(false);

        }

    };
    const handleLogout = async () => {
    try {

        await axios.post(
            "http://localhost:3000/api/auth/logoutUser",
            {},
            {
                withCredentials: true
            }
        );

    } catch (err) {
        console.log(err.response?.data || err.message);
    } finally {

        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        navigate("/login");
    }
};


    return (

        <div className="settings-container">

            <div className="settings-card">

                <h1>⚙️</h1>

                <p className="settings-subtitle">
                    Manage your account and privacy
                </p>


                {/* PRIVACY */}

                <div className="settings-section">

                    <h2>🔒 Privacy</h2>

                    <div className="setting-item">

                        <div className="setting-info">

                            <h3>Private Account</h3>

                            <p>
                                {isPrivate
                                    ? "Only your followers can see your posts."
                                    : "Anyone can see your posts."
                                }
                            </p>

                        </div>


                        <button
                            className={`privacy-toggle ${
                                isPrivate ? "active" : ""
                            }`}
                            onClick={handlePrivacy}
                            disabled={loading}
                        >

                            <span></span>

                        </button>

                    </div>

                </div>


                {/* ACCOUNT */}

                <div className="settings-section">

                    <h2>👤 Account</h2>

                    <div className="setting-link">
                        ✏️ Edit Profile
                    </div>

                    <div className="setting-link">
                        🔑 Change Password
                    </div>

                </div>
                {user?.role === "author" && (

    <div className="settings-section">

        <h2>👑 Author</h2>

        <div
            className="setting-link"
            onClick={() => navigate("/author/broadcast")}
        >
            📢 Broadcast Notification
        </div>

    </div>

)}



            <div className="settings-section">

                <h2>🎨 Appearance</h2>

                <div className="setting-item">

                    <div className="setting-info">

                        <h3>Theme</h3>

                        <p>
                            {theme === "dark"
                                ? "Dark theme is enabled."
                                : "Light theme is enabled."
                            }
                        </p>

                    </div>

                    <button
                    className="theme-btn"
                    onClick={toggleTheme}
                >
                    {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
                </button>

                </div>

            </div>

                <div className="settings-section">

                    <h2>🛡️ Security</h2>

                   <button
                     className="setting-link logout-link"
                     onClick={handleLogout}
                 >
                     🚪 Logout
                 </button>
                </div>

            </div>

        </div>

    );
}

export default Settings;