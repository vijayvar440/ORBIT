import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Profile from "./pages/Profile/Profile";
import UserProfile from "./pages/Profile/UserProfile";

import CreatePost from "./pages/Post/CreatePost";
import EditProfile from "./pages/Profile/EditProfile";
import EditPost from  "./pages/Post/EditPost";
import SinglePost from "./pages/Post/SinglePost";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./ProtectedRoute";

import Followers from "./pages/Profile/Followers";

import Chat from "./pages/Chat/Chat";
import Inbox from "./pages/Chat/Inbox"; 
import Settings from './pages/setting/Setting'
import Discover from "./pages/Discover/Discover";




function App() {
    return (
        <>
            <Navbar />
            

            <Routes>

                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/post/:id" element={<SinglePost />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/followers/:id"element={<Followers />}/>
              <Route path="/chat/:userId" element={<Chat />} />
             
                <Route
                        path="/messages"
                        element={
                            <ProtectedRoute>
                                <Inbox />
                            </ProtectedRoute>
                        }
                    />

                
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                      path="/users"
                      element={
                          <ProtectedRoute>
                              <Discover />
                          </ProtectedRoute>
                      }
                  />

                {/* Protected Create Post */}
                <Route
                    path="/create-post"
                    element={
                        <ProtectedRoute>
                            <CreatePost />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/edit-post/:id"
                        element={
                      <ProtectedRoute>
                      <EditPost />
                     </ProtectedRoute>
                   }
                />

                {/* Protected Edit Profile */}
                <Route
                    path="/edit-profile"
                    element={
                        <ProtectedRoute>
                            <EditProfile />
                        </ProtectedRoute>
                    }
                />
         <Route
           path="/setting"
           element={
        <ProtectedRoute>
            <Settings />
        </ProtectedRoute>
    }
/>

            </Routes>
        </>
    );
}

export default App;