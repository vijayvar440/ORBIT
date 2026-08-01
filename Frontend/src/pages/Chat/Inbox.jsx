import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Inbox.css";

function Inbox() {

    const navigate = useNavigate();

    const [chats, setChats] = useState([]);

    const fetchInbox = async () => {

        try {

            const response = await axios.get(
                "http://localhost:3000/api/message/inbox",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setChats(response.data);

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    };

    useEffect(() => {

        fetchInbox();

    }, []);

    return (

        <div className="inbox-container">

            <h2>💬 Messages</h2>

            {
                chats.length === 0 ? (

                    <p>No Chats Yet</p>

                ) : (

                    chats.map((chat) => (

                        <div
                            key={chat.user._id}
                            className="chat-card"
                            onClick={() => navigate(`/chat/${chat.user._id}`)}
                        >

                            <img
                                src={
                                    chat.user.profileImage ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                alt=""
                            />

                            <div className="chat-info">

                                <h3>{chat.user.username}</h3>

                                <p>{chat.lastMessage}</p>

                            </div>

                        </div>

                    ))

                )
            }

        </div>

    );

}

export default Inbox;