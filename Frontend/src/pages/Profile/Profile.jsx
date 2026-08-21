import { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  

  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/Post/profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setUser(response.data.user);
      setPosts(response.data.posts);
    } catch (err) {
      console.log(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!user) return <h2>Loading...</h2>;

  return (
    <div className="profile-container">

      <div className="profile-top">

       <img
                 className="profile-avatar"
                 src={
                   user.profileImage
                     ? user.profileImage
                     : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                 }
                 alt="Profile"
               />

        <div className="profile-info">

          <h2>{user.username}</h2>

          <p>{user.email}</p>

          <p>{user.bio || "No Bio Available"}</p>


            <div className="profile-stats">
               
                   <span>
                       <strong>{posts.length}</strong> Posts
                   </span>
               
                   <span>
                       <strong>{user.followers?.length || 0}</strong> Followers
                   </span>
               
                   <span>
                       <strong>{user.following?.length || 0}</strong> Following
                   </span>
               
               </div>


           <button
            className="edit-btn"
            onClick={() => navigate("/edit-profile")}
              >
                Edit Profile
              </button>

        </div>

      </div>

      <hr />

      <div className="posts-grid">

        {posts.map((post) => (
          
          <div
              className="post-card"
              key={post._id}
              onClick={() => navigate(`/post/${post._id}`)}
          >

            {post.mediaType === "image" && (
              <img src={post.media} alt={post.title} />
              
            )}
            

            {post.mediaType === "video" && (
              <video controls>
                <source src={post.media} type="video/mp4" />
              </video>
            )}

            {post.mediaType === "audio" && (
              <audio controls>
                <source src={post.media} type="audio/mpeg" />
              </audio>
            )}

            <h3>{post.title}</h3>

            <p>{post.description}</p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Profile;