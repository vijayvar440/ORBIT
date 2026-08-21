import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CreatPost.css"; // Ensure filename matches your project

function CreatePost() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [mediaType, setMediaType] = useState("image");
    const [media, setMedia] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Media select karne par preview handle karne ke liye
    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMedia(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title && !description && !media) {
            alert("Please add title, description, or media to create a post.");
            return;
        }

        setLoading(true);
        const formData = new FormData();

        formData.append("title", title);
        formData.append("description", description);
        formData.append("mediaType", mediaType);
        if (media) {
            formData.append("media", media); // 'media' matches Backend Multer field
        }

        try {
            const response = await axios.post(
                "https://orbit-backend-94nx.onrender.com/api/Post/createPost",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("Post Response:", response.data);
            alert("Post Created Successfully ✅");
            navigate("/");

        } catch (err) {
            console.error("Upload error:", err.response?.data || err.message);
            alert(err.response?.data?.message || "Failed to create post ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-container">
            <div className="create-post-card">
                <h1>Create Post</h1>

                <form className="create-post-form" onSubmit={handleSubmit}>
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
                            setPreview(null);
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
                        onChange={handleMediaChange}
                    />

                    {/* Preview Selected File */}
                    {preview && (
                        <div className="media-preview my-3">
                            {mediaType === "image" && (
                                <img src={preview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
                            )}
                            {mediaType === "video" && (
                                <video src={preview} controls style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
                            )}
                            {mediaType === "audio" && (
                                <audio src={preview} controls style={{ width: "100%" }} />
                            )}
                        </div>
                    )}

                    <button
                        className="create-post-btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Uploading..." : "Create Post"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreatePost;