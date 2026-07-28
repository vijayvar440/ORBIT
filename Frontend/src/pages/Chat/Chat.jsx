import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket";

function Chat() {

    const { userId } = useParams();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

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

    return (
        <div>

            <h2>Chat</h2>

            {
                messages.map((msg) => (

                    <div key={msg._id}>

                        <p>{msg.message}</p>

                    </div>

                ))
            }

            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type message..."
            />

           <button onClick={sendMessage}>
            Send
          </button>

        </div>
    );

}

export default Chat;