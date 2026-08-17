import { useEffect, useState } from "react";
import axios from "axios";
import "./Discover.css";

function Discover() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {

            const response = await axios.get(
                "http://localhost:3000/api/Post/discover",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const currentUserId = localStorage.getItem("userId");

            const updatedUsers = response.data.users.map((user) => ({
                ...user,
                isFollowing: user.followers?.some(
                    id => String(id) === String(currentUserId)
                )
            }));

            setUsers(updatedUsers);

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        } finally {

            setLoading(false);

        }
    };


    // FOLLOW / UNFOLLOW
    const handleFollow = async (userId) => {

        try {

            const response = await axios.put(
                `http://localhost:3000/api/Post/follow/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            localStorage.setItem("orbitHasFollowed", "true");

            console.log(response.data);


            // Button state update
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user._id === userId
                        ? {
                            ...user,
                            isFollowing: !user.isFollowing
                        }
                        : user
                )
            );

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        }
    };


    useEffect(() => {
        fetchUsers();
    }, []);


    if (loading) {

        return (
            <div className="discover-container">
                <h2>Finding people...</h2>
            </div>
        );

    }


    return (

        <div className="discover-container">

            <div className="discover-card">

                <h1>👥 Discover People</h1>

                <p className="discover-subtitle">
                    Find people and follow them to see their posts.
                </p>


                <div className="users-list">

                    {users.length === 0 ? (

                        <p className="no-users">
                            No people found.
                        </p>

                    ) : (

                        users.map((user) => (

                            <div
                                className="discover-user"
                                key={user._id}
                            >

                                <img
                                    src={
                                        user.profileImage ||
                                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                    }
                                    alt=""
                                />


                                <div className="discover-user-info">

                                    <h3>
                                        {user.username}
                                    </h3>

                                    <p>
                                        {user.bio ||
                                            "Welcome to ORBIT"}
                                    </p>

                                </div>


                                <button
                                    className={
                                        user.isFollowing
                                            ? "following-btn"
                                            : ""
                                    }
                                    onClick={() =>
                                        handleFollow(user._id)
                                    }
                                >

                                    {user.isFollowing
                                        ? "Following"
                                        : "Follow"}

                                </button>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </div>

    );
}

export default Discover;