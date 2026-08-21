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
                "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/Post/profile",
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
                "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/Post/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            console.log(response.data);

            alert("Profile Updated Successfully ✅");

            navigate("/profile");

        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    return (
        <div>

            <h1>Edit Profile</h1>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <br /><br />

                <textarea
                    placeholder="Bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                />

                <br /><br />

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImage(e.target.files[0])}
                />

                <br /><br />

                <button type="submit">
                    Update Profile
                </button>

            </form>

        </div>
    );
}

export default EditProfile;