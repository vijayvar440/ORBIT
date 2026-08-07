import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import {
    House,
    Search,
    SquarePlus,
    CircleUserRound,
    MessageCircle,
    LogOut
} from "lucide-react";

import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();
    const [keyword, setKeyword] = useState("");
     const [users, setUsers] = useState([]);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login");
    };
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

    return (

        <nav className="navbar">

        <div className="logo">
    Orbit<span>.</span>
</div>

            
<div className="search">

    <Search size={18} />

    <input
        type="text"
        placeholder="Search users..."
        value={keyword}
        onChange={(e) => searchUser(e.target.value)}
    />

    {/* YE DIV INPUT KE ANDAR NAHI, LEKIN SEARCH DIV KE ANDAR HOGA */}
    {users.length > 0 && (

        <div className="search-result">

            {users.map((user) => (
                     <div
                        key={user._id}
                        className="search-user"
                       onClick={() => {
                         navigate(`/user/${user._id}`);
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
                        <h4>{user.username}</h4>
                        <p>{user.bio}</p>
                    </div>

                </div>

            ))}

        </div>

    )}

</div>


            <div className="nav-menu">

    <Link to="/">
        <House size={22}/>
        <span>Home</span>
    </Link>

    <Link to="/create-post">
        <SquarePlus size={22}/>
        <span>Create</span>
    </Link>

    <Link to="/messages">
        <MessageCircle size={22}/>
        <span>Messages</span>
    </Link>

    <Link to="/profile">
        <CircleUserRound size={22}/>
        <span>Profile</span>
    </Link>

    <button onClick={logout}>
        <LogOut size={20}/>
        Logout
    </button>
    <Link to="/setting">
    ⚙️ Settings
</Link>

</div>

        </nav>

    );

}

export default Navbar;