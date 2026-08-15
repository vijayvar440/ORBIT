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

            setUsers(response.data.users);

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        } finally {
            setLoading(false);
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

                                    <h3>{user.username}</h3>

                                    <p>
                                        {user.bio ||
                                            "Welcome to ORBIT"}
                                    </p>

                                </div>

                                <button>
                                    Follow
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