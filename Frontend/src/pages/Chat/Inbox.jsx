import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Inbox.css";
import socket from "../../socket";

function Inbox() {
    const navigate = useNavigate();

    const [chats, setChats] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const fetchInbox = async () => {
        try {
            const response = await axios.get(
                "http://[https://orbit-backend-94nx.onrender.com](https://orbit-backend-94nx.onrender.com)/api/message/inbox",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setChats(response.data);
        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    useEffect(() => {
        socket.emit("join", localStorage.getItem("userId"));

        socket.on("online-users", (users) => {
            setOnlineUsers(users);
        });

        fetchInbox();

        return () => {
            socket.off("online-users");
        };
    }, []);

    return (
        <div className="inbox-container">

            <h2>💬 Messages</h2>

            {chats.length === 0 ? (
                <p>No Chats Yet</p>
            ) : (
                chats
                    .filter((chat) => chat.user !== null)
                    .map((chat) => (
                        <div
                            key={chat.user._id}
                            className="chat-card"
                            onClick={() =>
                                navigate(`/chat/${chat.user._id}`)
                            }
                        >

                            <img
                                src={
                                    chat.user.profileImage ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                alt="profile"
                            />

                            <div className="chat-info">

                                <h3>
                                    {chat.user.username}
                                </h3>

                                <p
                                    style={{
                                        color: onlineUsers.includes(
                                            chat.user._id
                                        )
                                            ? "green"
                                            : "gray",
                                        fontSize: "13px",
                                    }}
                                >
                                    {onlineUsers.includes(chat.user._id)
                                        ? "🟢 Online"
                                        : "⚫ Offline"}
                                </p>

                                <p>
                                    {chat.lastMessage}
                                </p>

                            </div>

                        </div>
                    ))
            )}

        </div>
    );
}

export default Inbox;