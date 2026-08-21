import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CreatPost.css";

function CreatePost() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [mediaType, setMediaType] = useState("image");
    const [media, setMedia] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append("title", title);
        formData.append("description", description);
        formData.append("mediaType", mediaType);
        formData.append("media", media);

        try {
            const response = await axios.post(
                "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/Post/createPost",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            console.log(response.data);
            alert("Post Created Successfully ✅");

            navigate("/");

        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

   return (
    <div className="create-post-container">

        <div className="create-post-card">

            <h1>Create Post</h1>

            <form
                className="create-post-form"
                onSubmit={handleSubmit}
            >

                <input
                    type="text"
                    placeholder="Enter Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    placeholder="Enter Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <label>Select Media Type</label>

                <select
                    value={mediaType}
                    onChange={(e) => {
                        setMediaType(e.target.value);
                        setMedia(null);
                    }}
                >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                </select>

                <input
                    className="file-input"
                    type="file"
                    accept={
                        mediaType === "image"
                            ? "image/*"
                            : mediaType === "video"
                            ? "video/*"
                            : "audio/*"
                    }
                    onChange={(e) =>
                        setMedia(e.target.files[0])
                    }
                />

                <button
                    className="create-post-btn"
                    type="submit"
                >
                    Create Post
                </button>

            </form>

        </div>

    </div>
);
}

export default CreatePost;