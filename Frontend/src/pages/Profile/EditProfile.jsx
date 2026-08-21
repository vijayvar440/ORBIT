import "./EditProfile.css"; // 👈 Sahi Path
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function EditProfile() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(
                "https://orbit-backend-94nx.onrender.com/api/Post/profile",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setUsername(response.data.user.username || "");
            setBio(response.data.user.bio || "");

        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("username", username);
        formData.append("bio", bio);

        if (profileImage) {
            formData.append("profileImage", profileImage);
        }

        try {
            const response = await axios.put(
                "https://orbit-backend-94nx.onrender.com/api/Post/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            alert("Profile Updated Successfully ✅");
            navigate("/profile");

        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    return (
        <div className="edit-profile-container">
            <div className="edit-profile-card">
                <h2>Edit Profile</h2>

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Bio</label>
                        <textarea
                            placeholder="Write a short bio..."
                            value={bio}
                            rows="3"
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Profile Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProfileImage(e.target.files[0])}
                        />
                    </div>

                    <div className="button-group">
                        <button type="button" className="cancel-btn" onClick={() => navigate("/profile")}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Update Profile
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default EditProfile;