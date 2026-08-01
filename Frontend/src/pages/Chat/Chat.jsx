import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";
import { useRef } from "react";
import "./Chat.css";


function Chat() {

    const { userId } = useParams();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {

        try {

            const response = await axios.get(
                `http://localhost:3000/api/message/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setMessages(response.data.messages);

        } catch (err) {

            console.log(err.response?.data || err.message);

        }

    };
   const sendMessage = async () => {

    if (!text.trim()) return;

    try {

        const response = await axios.post(
            `http://localhost:3000/api/message/send/${userId}`,
            {
                message: text
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        socket.emit("send_message", {

            ...response.data.newMessage,

            receiver: userId

        });

        setMessages((prev) => [...prev, response.data.newMessage]);

        setText("");

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};
useEffect(() => {

    socket.emit("join", localStorage.getItem("userId"));

    socket.on("connect", () => {
        console.log("✅ Connected:", socket.id);
    });

    socket.on("receive_message", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
    });

    fetchMessages();

    return () => {
        socket.off("receive_message");
        socket.off("connect");
    };

}, [userId]);


useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
        behavior: "smooth"
    });

}, [messages]);

return (
    <div className="chat-container">

        <div className="chat-header">
            <h2>💬 Chat</h2>
        </div>

        <div className="chat-body">

            {messages.map((msg) => (

                <div
                    key={msg._id}
                    className={
                        String(msg.sender) === localStorage.getItem("userId")
                            ? "my-message"
                            : "other-message"
                    }
                >

                    <div className="message-box">
                        {msg.message}
                    </div>

                </div>

            ))}

            <div ref={messagesEndRef}></div>

        </div>

        <div className="chat-footer">

            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type message..."
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        sendMessage();
                    }
                }}
            />

            <button onClick={sendMessage}>
                ➤
            </button>

        </div>

    </div>
);

}

export default Chat;