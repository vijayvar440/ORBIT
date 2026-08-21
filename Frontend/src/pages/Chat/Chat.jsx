import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";
import "./Chat.css";

function Chat() {
    const { userId } = useParams();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);

    const [user, setUser] = useState(null);
    const [online, setOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [menuMessageId, setMenuMessageId] = useState(null);

    const currentUserId = localStorage.getItem("userId");

    const fetchUser = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/Post/user/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            setUser(response.data.user);
        } catch (err) {
            console.log("FETCH USER ERROR:", err.response?.data || err.message);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(
                `https://orbit-backend-94nx.onrender.com/api/message/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            setMessages(response.data.messages || []);
        } catch (err) {
            console.log("FETCH MESSAGES ERROR:", err.response?.data || err.message);
        }
    };

    const sendMessage = async () => {
        if (!text.trim() && !selectedFile) return;

        try {
            const formData = new FormData();
            formData.append("message", text);

            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            const response = await axios.post(
                `https://orbit-backend-94nx.onrender.com/api/message/send/${userId}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const sentMsg = response.data.newMessage;

            socket.emit("send_message", {
                ...sentMsg,
                receiver: userId
            });

            setMessages((prev) => [...prev, sentMsg]);
            setText("");
            setSelectedFile(null);
            setPreview("");

            clearTimeout(typingTimeout.current);
            socket.emit("stop_typing", {
                sender: currentUserId,
                receiver: userId
            });
        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    const formatLastSeen = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    useEffect(() => {
        if (!currentUserId) return;

        socket.emit("join", currentUserId);

        fetchUser();
        fetchMessages();

        // Mark messages as seen initially
        axios.put(
            `https://orbit-backend-94nx.onrender.com/api/message/seen/${userId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        ).catch((err) => console.log("SEEN ERROR:", err.response?.data || err.message));

        const handleReceiveMessage = async (newMessage) => {
            if (String(newMessage.sender) === String(userId)) {
                setMessages((prev) => [...prev, newMessage]);

                socket.emit("message_delivered", {
                    messageId: newMessage._id,
                    senderId: newMessage.sender
                });

                try {
                    await axios.put(
                        `https://orbit-backend-94nx.onrender.com/api/message/seen/${newMessage.sender}`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`
                            }
                        }
                    );

                    socket.emit("message_seen", {
                        messageId: newMessage._id,
                        senderId: newMessage.sender
                    });
                } catch (err) {
                    console.log("MESSAGE SEEN ERROR:", err.response?.data || err.message);
                }
            }
        };

        const handleMessageDelivered = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, status: "delivered" } : msg
                )
            );
        };

        const handleMessageSeen = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, status: "seen" } : msg
                )
            );
        };

        const handleOnlineUsers = (users) => {
            setOnline(users.includes(userId));
        };

        const handleTyping = (senderId) => {
            if (String(senderId) === String(userId)) {
                setIsTyping(true);
            }
        };

        const handleStopTyping = (senderId) => {
            if (String(senderId) === String(userId)) {
                setIsTyping(false);
            }
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("message_delivered", handleMessageDelivered);
        socket.on("message_seen", handleMessageSeen);
        socket.on("online-users", handleOnlineUsers);
        socket.on("typing", handleTyping);
        socket.on("stop_typing", handleStopTyping);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("message_delivered", handleMessageDelivered);
            socket.off("message_seen", handleMessageSeen);
            socket.off("online-users", handleOnlineUsers);
            socket.off("typing", handleTyping);
            socket.off("stop_typing", handleStopTyping);
        };
    }, [userId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        return () => {
            clearTimeout(typingTimeout.current);
        };
    }, []);

    const deleteMessage = async (messageId, deleteType) => {
        try {
            await axios.delete(
                `https://orbit-backend-94nx.onrender.com/api/message/delete/${messageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    data: { deleteType }
                }
            );

            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg._id !== messageId) return msg;

                    if (deleteType === "everyone") {
                        return {
                            ...msg,
                            deletedForEveryone: true,
                            message: "",
                            image: "",
                            video: "",
                            file: ""
                        };
                    }

                    return {
                        ...msg,
                        deletedFor: [...(msg.deletedFor || []), currentUserId]
                    };
                })
            );

            setMenuMessageId(null);
        } catch (err) {
            console.log(err.response?.data || err.message);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <img
                    src={
                        user?.profileImage ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt=""
                    className="chat-avatar"
                />
                <div>
                    <h3>{user?.username}</h3>
                    <p className={online ? "online" : "offline"}>
                        {online
                            ? "🟢 Online"
                            : `Last seen ${formatLastSeen(user?.lastSeen)}`}
                    </p>
                </div>
            </div>

            <div className="chat-body">
                {messages.map((msg) => {
                    const isMyMessage = String(msg.sender) === String(currentUserId);
                    const isDeletedForMe = msg.deletedFor?.some(
                        (id) => String(id) === String(currentUserId)
                    );

                    if (isDeletedForMe) return null;

                    return (
                        <div
                            key={msg._id}
                            className={isMyMessage ? "my-message" : "other-message"}
                        >
                            <div className="message-box">
                                <button
                                    className="message-menu-btn"
                                    onClick={() =>
                                        setMenuMessageId(
                                            menuMessageId === msg._id ? null : msg._id
                                        )
                                    }
                                >
                                    ⋮
                                </button>

                                {menuMessageId === msg._id && (
                                    <div className="message-menu">
                                        <button onClick={() => deleteMessage(msg._id, "me")}>
                                            🗑️ Delete for me
                                        </button>
                                        {isMyMessage && !msg.deletedForEveryone && (
                                            <button onClick={() => deleteMessage(msg._id, "everyone")}>
                                                🗑️ Delete for everyone
                                            </button>
                                        )}
                                    </div>
                                )}

                                {msg.deletedForEveryone ? (
                                    <p className="deleted-message">
                                        🚫 This message was deleted
                                    </p>
                                ) : (
                                    <>
                                        {msg.image && (
                                            <img
                                                src={msg.image}
                                                alt="chat"
                                                className="chat-image"
                                            />
                                        )}

                                        {msg.video && (
                                            <video controls className="chat-video">
                                                <source src={msg.video} />
                                            </video>
                                        )}

                                        {msg.file && (
                                            <a
                                                href={msg.file}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                📄 Download File
                                            </a>
                                        )}

                                        {msg.message && <p>{msg.message}</p>}
                                    </>
                                )}

                                <span className="message-time">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </span>

                                {isMyMessage && (
                                    <span className="message-status">
                                        {msg.status === "seen"
                                            ? "✓✓✓"
                                            : msg.status === "delivered"
                                            ? "✓✓"
                                            : "✓"}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="typing-text">
                        ✍️ {user?.username} is typing...
                    </div>
                )}

                <div ref={messagesEndRef}></div>
            </div>

            <div className="chat-footer">
                <input
                    type="file"
                    id="file"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files[0];
                        setSelectedFile(file);
                        if (file) setPreview(URL.createObjectURL(file));
                    }}
                />

                <label htmlFor="file" className="file-btn">
                    📎
                </label>

                <input
                    type="text"
                    value={text}
                    onChange={(e) => {
                        const value = e.target.value;
                        setText(value);

                        if (value.trim() === "") {
                            clearTimeout(typingTimeout.current);
                            socket.emit("stop_typing", {
                                sender: currentUserId,
                                receiver: userId
                            });
                            return;
                        }

                        socket.emit("typing", {
                            sender: currentUserId,
                            receiver: userId
                        });

                        clearTimeout(typingTimeout.current);
                        typingTimeout.current = setTimeout(() => {
                            socket.emit("stop_typing", {
                                sender: currentUserId,
                                receiver: userId
                            });
                        }, 1000);
                    }}
                    placeholder="Type message..."
                    onKeyDown={(e) => {
                        if (e.key === "Enter") sendMessage();
                    }}
                />

                <button onClick={sendMessage}>➤</button>
            </div>
        </div>
    );
}

export default Chat;