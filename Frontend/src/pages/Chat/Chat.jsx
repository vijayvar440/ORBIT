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
     const typingTimeout = useRef(null);
    
    const [user, setUser] = useState(null);
    const [online, setOnline] = useState(false);
    const [typing, setTyping] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    

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

    if (!text.trim() && !selectedFile) return;

    try {

       const formData = new FormData();

         formData.append("message", text);
         
         if (selectedFile) {
             formData.append("file", selectedFile);
         }
         
         const response = await axios.post(
             `http://localhost:3000/api/message/send/${userId}`,
             formData,
             {
                 headers: {
                     Authorization: `Bearer ${localStorage.getItem("token")}`,
                 }
             }
         );

        socket.emit("send_message", {

            ...response.data.newMessage,

            receiver: userId

        });

        setMessages((prev) => [...prev, response.data.newMessage]);
      
       
       

       setText("");
setSelectedFile(null);
setPreview("");

clearTimeout(typingTimeout.current);

socket.emit("stop_typing", {
    sender: localStorage.getItem("userId"),
    receiver: userId,
});


    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};
const fetchUser = async () => {

    try {

        const response = await axios.get(
            `http://localhost:3000/api/Post/user/${userId}`
        );

        setUser(response.data.user);

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
        minute: "2-digit",
    });

};
useEffect(() => {

    socket.emit("join", localStorage.getItem("userId"));

    socket.on("connect", () => {
        console.log("Connected");
    });

    socket.on("receive_message", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
    });

    socket.on("online-users", (users) => {

        setOnline(users.includes(userId));
        fetchUser();

    });

    socket.on("typing", () => {
        setTyping(true);
    });

    socket.on("stop_typing", () => {
        setTyping(false);
    });

    fetchMessages();
    fetchUser();

    return () => {

        socket.off("receive_message");
        socket.off("online-users");
        socket.off("typing");
        socket.off("stop_typing");
        socket.off("connect");

    };

}, [userId]);


useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
    });

}, [messages]);

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

    {msg.message && (
        <p>{msg.message}</p>
    )}

    <span className="message-time">
        {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })}
    </span>

</div>

        </div>

    ))}

    {typing && (
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

        if(file){
            setPreview(URL.createObjectURL(file));
        }

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

    if (value === "") {

    socket.emit("stop_typing", {
        sender: localStorage.getItem("userId"),
        receiver: userId,
    });

    clearTimeout(typingTimeout.current);

    return;
}

    socket.emit("typing", {
        sender: localStorage.getItem("userId"),
        receiver: userId,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {

        socket.emit("stop_typing", {
            sender: localStorage.getItem("userId"),
            receiver: userId,
        });

    }, 1000);

}}
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