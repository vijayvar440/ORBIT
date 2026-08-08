import { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import { useNavigate, useParams } from "react-router-dom";
import { FiMessageCircle } from "react-icons/fi";

function UserProfile() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [following, setFollowing] = useState(false);
    const [isMyProfile, setIsMyProfile] = useState(false);
    const [canViewPosts, setCanViewPosts] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);

   const fetchUserProfile = async () => {

    try {

        const response = await axios.get(
    `http://localhost:3000/api/Post/user/${id}`,
    {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
    }
);

        setUser(response.data.user);
         setPosts(response.data.posts || []);
         
         setIsPrivate(response.data.isPrivate || false);
         setCanViewPosts(response.data.canViewPosts ?? true);

        const loggedUserId = localStorage.getItem("userId");

        setFollowing(
            response.data.user.followers?.some((item) =>
                String(item) === loggedUserId ||
                String(item._id) === loggedUserId
            )
        );

        setIsMyProfile(response.data.user._id === loggedUserId);

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};


    const handleFollow = async () => {

    try {

        await axios.put(
            `http://localhost:3000/api/Post/follow/${id}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );

        fetchUserProfile();

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};


    useEffect(() => {

        fetchUserProfile();

    }, [id]);

    if (!user) {
        return <h2>Loading...</h2>;
    }

    return (

        <div className="profile-container">

            <button
                className="back-btn"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className="profile-top">

                <img
                    className="profile-avatar"
                    src={
                        user.profileImage
                            ? user.profileImage
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt=""
                />

                <div className="profile-info">

                    <h2>{user.username}</h2>

                    <p>{user.email}</p>

                    <p>{user.bio || "No Bio Available"}</p>

                    <div className="profile-stats">

                        <span>
                            <strong>{posts.length}</strong> Posts
                        </span>



                        <span
                            onClick={() => navigate(`/followers/${id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <strong>{user.followers?.length || 0}</strong> Followers
                        </span>
                        
                        <span
                            onClick={() => navigate(`/following/${id}`)}
                            style={{ cursor: "pointer" }}
                        >
                            <strong>{user.following?.length || 0}</strong> Following
                        </span>




                    </div>

                   
                  {
    isMyProfile ? (

        <button
            className="edit-btn"
            onClick={() => navigate("/edit-profile")}
        >
            Edit Profile
        </button>

    ) : (

        <div className="profile-actions">

            <button
                className="edit-btn"
                onClick={handleFollow}
            >
                {following ? "Following" : "Follow"}
            </button>

            {
                following && (

                    <button
                        className="message-icon-btn"
                        onClick={() => navigate(`/chat/${id}`)}
                    >
                        <FiMessageCircle size={22} />
                    </button>

                )
            }

        </div>

    )
}

                </div>

            </div>

            <hr />

            {canViewPosts ? (

    <div className="posts-grid">

        {posts.length > 0 ? (

            posts.map((post) => (

                <div
                    className="post-card"
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                >

                    {post.mediaType === "image" && (
                        <img
                            src={post.media}
                            alt={post.title}
                        />
                    )}

                    {post.mediaType === "video" && (
                        <video controls>
                            <source
                                src={post.media}
                                type="video/mp4"
                            />
                        </video>
                    )}

                    {post.mediaType === "audio" && (
                        <audio controls>
                            <source
                                src={post.media}
                                type="audio/mpeg"
                            />
                        </audio>
                    )}

                    <h3>{post.title}</h3>

                    <p>{post.description}</p>

                </div>

            ))

        ) : (

            <p>No posts yet.</p>

        )}

    </div>

) : (

    <div className="private-account-message">

        <div className="private-icon">
            🔒
        </div>

        <h2>This Account is Private</h2>

        <p>
            Follow this account to see their posts.
        </p>

        {!following && !isMyProfile && (
            <button
                className="edit-btn"
                onClick={handleFollow}
            >
                Follow
            </button>
        )}

    </div>

)}

            </div>

        

    );

}

export default UserProfile;
        