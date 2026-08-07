import { useEffect, useState } from "react";
import axios from "axios";
import "./Setting.css";

function Settings() {

    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

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
        isPrivate: newValue
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


    return (

        <div className="settings-container">

            <div className="settings-card">

                <h1>⚙️ Settings</h1>

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


                {/* SECURITY */}

                <div className="settings-section">

                    <h2>🛡️ Security</h2>

                    <div className="setting-link">
                        🚪 Logout
                    </div>

                </div>

            </div>

        </div>

    );
}

export default Settings;