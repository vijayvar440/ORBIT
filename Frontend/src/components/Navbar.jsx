import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import {
    House,
    Search,
    SquarePlus,
    CircleUserRound,
    MessageCircle,
    Settings,
    Bell
} from "lucide-react";

import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const [keyword, setKeyword] = useState("");
    const [users, setUsers] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);


    // =========================
    // LOGOUT
    // =========================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        navigate("/login");
    };


    // =========================
    // SEARCH USERS
    // =========================

    const searchUser = async (value) => {

        setKeyword(value);

        if (value.trim() === "") {
            setUsers([]);
            return;
        }

        try {

            const response = await axios.get(
                `http://localhost:3000/api/Post/search/${value}`
            );

            setUsers(response.data.users);

        } catch (err) {

            console.log(err);

        }
    };


    // =========================
    // GET UNREAD NOTIFICATIONS
    // =========================

    const fetchUnreadNotifications = async () => {

        try {

            const response = await axios.get(
                "http://localhost:3000/api/notification/unread-count",
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setUnreadCount(response.data.count);

        } catch (err) {

            console.log(
                "Notification Error:",
                err.response?.data || err.message
            );

        }

    };


    // =========================
    // LOAD NOTIFICATION COUNT
    // =========================

    useEffect(() => {

        const token = localStorage.getItem("token");

        if (token) {
            fetchUnreadNotifications();
        }

    }, []);


    return (

        <nav className="navbar">


            {/* LOGO */}

            <div className="logo">
                Orbit<span>.</span>
            </div>


            {/* SEARCH */}

            <div className="search">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search users..."
                    value={keyword}
                    onChange={(e) =>
                        searchUser(e.target.value)
                    }
                />


                {users.length > 0 && (

                    <div className="search-result">

                        {users.map((user) => (

                            <div
                                key={user._id}
                                className="search-user"
                                onClick={() => {

                                    navigate(
                                        `/user/${user._id}`
                                    );

                                    setKeyword("");
                                    setUsers([]);

                                }}
                            >

                                <img
                                    src={
                                        user.profileImage ||
                                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                    }
                                    alt=""
                                />

                                <div>

                                    <h4>
                                        {user.username}
                                    </h4>

                                    <p>
                                        {user.bio}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* NAV MENU */}

            <div className="nav-menu">


                <Link to="/">
                    <House size={22} />
                    <span>Home</span>
                </Link>


                <Link to="/create-post">
                    <SquarePlus size={22} />
                    <span>Create</span>
                </Link>


                <Link to="/messages">
                    <MessageCircle size={22} />
                    <span>Messages</span>
                </Link>


                <Link to="/notifications" className="notification-link">

                    <Bell size={22} />

                    {unreadCount > 0 && (

                        <span className="notification-badge">

                            {unreadCount > 99
                                ? "99+"
                                : unreadCount}

                        </span>

                    )}

                    <span>Notifications</span>

                </Link>


                <Link to="/profile">
                    <CircleUserRound size={22} />
                    <span>Profile</span>
                </Link>


                <Link to="/setting">
                    <Settings size={21} />
                    <span>Settings</span>
                </Link>


            </div>

        </nav>

    );

}

export default Navbar;