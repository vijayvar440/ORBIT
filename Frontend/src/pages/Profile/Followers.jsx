import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./Followers.css";

function Followers() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [followers, setFollowers] = useState([]);

    const fetchFollowers = async () => {

        try {

            const response = await axios.get(
                `http://localhost:3000/api/Post/followers/${id}`
            );

            setFollowers(response.data.followers);

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    };

    useEffect(() => {

        fetchFollowers();

    }, [id]);

    return (

        <div className="followers-container">

            <button
                className="back-btn"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <h2>Followers</h2>

            {
                followers.length === 0 ?

                    <p>No Followers Yet</p>

                    :

                    followers.map((user) => (

                        <div
                            key={user._id}
                            className="follow-card"
                            onClick={() => navigate(`/user/${user._id}`)}
                        >

                            <img
                                src={
                                    user.profileImage ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                alt=""
                            />

                            <div>

                                <h3>{user.username}</h3>

                            </div>

                        </div>

                    ))
            }

        </div>

    );
h
}

export default Followers;