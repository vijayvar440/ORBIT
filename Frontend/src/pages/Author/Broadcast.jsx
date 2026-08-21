import { useState } from "react";
import axios from "axios";
import "./Broadcast.css";

function Broadcast() {

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async (e) => {

        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            alert("Please enter title and message");
            return;
        }

        try {

            setLoading(true);

            const response = await axios.post(
                "https://orbit-backend-94nx.onrender.com/api/notification/broadcast",
                {
                    title,
                    message
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            console.log(response.data);

            alert("Broadcast sent successfully 📢");

            setTitle("");
            setMessage("");

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

            alert(
                err.response?.data?.message ||
                "Broadcast failed"
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <div className="broadcast-container">

            <div className="broadcast-card">

                <h1>👑 Author Panel</h1>

                <p className="broadcast-subtitle">
                    📢 Send an update to everyone on ORBIT
                </p>

                <form onSubmit={handleBroadcast}>

                    <label>
                        Notification Title
                    </label>

                    <input
                        type="text"
                        placeholder="Enter notification title"
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                    />

                    <label>
                        Message
                    </label>

                    <textarea
                        placeholder="Write your update..."
                        value={message}
                        onChange={(e) =>
                            setMessage(e.target.value)
                        }
                        rows="6"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "📢 Send to Everyone"}
                    </button>

                </form>

            </div>

        </div>

    );
}

export default Broadcast;1