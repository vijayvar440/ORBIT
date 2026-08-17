import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";

function Notifications() {

    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    const fetchNotifications = async () => {

        try {

            const response = await axios.get(
                "http://localhost:3000/api/notification",
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setNotifications(response.data.notifications);

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        }

    };


    useEffect(() => {

        fetchNotifications();

    }, []);


    const markAllAsRead = async () => {

        try {

            await axios.put(
                "http://localhost:3000/api/notification/read-all",
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    isRead: true
                }))
            );

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        }

    };


    const openNotification = async (notification) => {

        try {

            if (!notification.isRead) {

                await axios.put(
                    `http://localhost:3000/api/notification/read/${notification._id}`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

            }

            setNotifications(prev =>
                prev.map(item =>
                    item._id === notification._id
                        ? { ...item, isRead: true }
                        : item
                )
            );


            // Post notification
            if (notification.post?._id) {

                navigate(
                    `/post/${notification.post._id}`
                );

            }

        } catch (err) {

            console.log(
                err.response?.data || err.message
            );

        }

    };

const getIcon = (type) => {

    if (type === "like") return "❤️";

    if (type === "comment") return "💬";

    if (type === "follow") return "👤";

    if (type === "message") return "✉️";

    if (type === "broadcast") return "📢";

    return "🔔";
};

    return (

        <div className="notifications-container">

            <div className="notifications-header">

                <h2>🔔 Notifications</h2>

                <button onClick={markAllAsRead}>
                    Mark all as read
                </button>

            </div>


            {notifications.length === 0 ? (

                <div className="no-notifications">
                    <h3>No notifications yet</h3>
                    <p>You're all caught up 🎉</p>
                </div>

            ) : (

                <div className="notifications-list">

                    {notifications.map(notification => (

                        <div
                            key={notification._id}
                            className={
                                notification.isRead
                                    ? "notification-item"
                                    : "notification-item unread"
                            }
                            onClick={() =>
                                openNotification(notification)
                            }
                        >

                            <img
                                src={
                                    notification.sender?.profileImage ||
                                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                }
                                alt=""
                            />


                            <div className="notification-content">

                                <p>

                                    <strong>
                                        {notification.type === "broadcast"
                                            ? "ORBIT"
                                            : notification.sender?.username}
                                    </strong>{" "}

                                    {getIcon(notification.type)}{" "}

                                    {notification.message}

                                </p>

                                <span>
                                    {new Date(
                                        notification.createdAt
                                    ).toLocaleString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </span>

                            </div>


                            {!notification.isRead && (
                                <div className="unread-dot"></div>
                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}

export default Notifications;