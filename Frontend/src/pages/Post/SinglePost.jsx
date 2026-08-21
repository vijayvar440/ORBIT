import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate} from "react-router-dom";
import "./SinglePost.css";


function SinglePost() {

    const { id } = useParams();

    const [post, setPost] = useState(null);
    const navigate = useNavigate();

    const fetchPost = async () => {
        try {

            const response = await axios.get(
            `https://orbit-backend-94nx.onrender.com/api/Post/${id}`
                );
                    
            setPost(response.data.post);

        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchPost();
    }, []);


    if (!post) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
}

    return (
        <div className="single-post-container">



            <div className="single-post-card">
                  <button
            className="back-btn"
            onClick={() => navigate(-1)}
        >
            ← Back
        </button>

                {/* Header */}

                <div className="single-post-header">

                    <div className="user-info">

                        <div className="avatar">

                            {post.uploadedBy?.profileImage ? (

                          <img
                               src={post.uploadedBy.profileImage}
                               alt="profile"
                               className="single-profile-img"
                           />

                            ) : (

                                post.uploadedBy?.username
                                    ?.charAt(0)
                                    .toUpperCase()

                            )}

                        </div>

                        <div className="user-details">

                            <h3>{post.uploadedBy?.username}</h3>

                            <span>
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>

                        </div>

                    </div>

                </div>

                {/* Title */}

                <h2 className="post-title">
                    {post.title}
                </h2>

                {/* Description */}

                <p className="post-description">
                    {post.description}
                </p>

                {/* Media */}

                {post.mediaType === "image" && (
                    <img
                        src={post.media}
                        alt={post.title}
                        className="single-post-image"
                    />
                )}

                {post.mediaType === "video" && (
                    <video
                        controls
                        className="single-post-video"
                    >
                        <source
                            src={post.media}
                            type="video/mp4"
                        />
                    </video>
                )}

                {post.mediaType === "audio" && (
                    <audio
                        controls
                        className="single-post-audio"
                    >
                        <source
                            src={post.media}
                            type="audio/mpeg"
                        />
                    </audio>
                )}

                {/* Likes */}

                <div className="post-stats">

                    ❤️ {post.likes.length} Likes

                </div>

                {/* Comments */}

                <h3 className="comment-heading">
                    Comments ({post.comments.length})
                </h3>

                <div className="comment-section">

                    {post.comments.length === 0 ? (

                        <p>No Comments Yet</p>

                    ) : (

                        post.comments.map((comment) => (

                            <div
                                key={comment._id}
                                className="comment-card"
                            >

                                <strong>
                                    {comment.user?.username}
                                </strong>

                                <p>
                                    {comment.text}
                                </p>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </div>
    );
}

export default SinglePost;