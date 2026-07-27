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

        await axios.post(
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

        setText("");

        fetchMessages();

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};
 useEffect(() => {

    socket.on("connect", () => {

        console.log("✅ Connected:", socket.id);

    });

    return () => {

        socket.off("connect");

    };

}, []);

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