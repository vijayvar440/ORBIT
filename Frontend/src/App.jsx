import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Profile from "./pages/Profile/Profile";
import UserProfile from "./pages/Profile/UserProfile";

import CreatePost from "./pages/Post/CreatePost";
import EditProfile from "./pages/Profile/EditProfile";
import EditPost from "./pages/Post/EditPost";
import SinglePost from "./pages/Post/SinglePost";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./ProtectedRoute";

import Followers from "./pages/Profile/Followers";

import Chat from "./pages/Chat/Chat";
import Inbox from "./pages/Chat/Inbox";

import Settings from "./pages/setting/Setting";
import Discover from "./pages/Discover/Discover";

import Notifications from "./pages/Notifications/Notifications";
import Broadcast from "./pages/Author/Broadcast";


// =====================================================
// VAPID BASE64 → UINT8ARRAY
// =====================================================

const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat(
        (4 - (base64String.length % 4)) % 4
    );

    const base64 = (
        base64String + padding
    )
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);

    return Uint8Array.from(
        [...rawData].map((char) =>
            char.charCodeAt(0)
        )
    );
};


// =====================================================
// APP
// =====================================================

function App() {

    // =================================================
    // PUSH NOTIFICATION SETUP
    // =================================================

    useEffect(() => {

        const setupPushNotifications = async () => {

            try {

                // Browser support check
                if (
                    !("Notification" in window) ||
                    !("serviceWorker" in navigator) ||
                    !("PushManager" in window)
                ) {
                    console.log(
                        "❌ Push notifications are not supported"
                    );

                    return;
                }


                // User login check
                const token =
                    localStorage.getItem("token");

                if (!token) {

                    console.log(
                        "⚠️ User not logged in. Push setup skipped."
                    );

                    return;
                }


                // =================================================
                // NOTIFICATION PERMISSION
                // =================================================

                let permission =
                    Notification.permission;


                if (permission === "default") {

                    permission =
                        await Notification.requestPermission();
                }


                console.log(
                    "🔔 Notification permission:",
                    permission
                );


                if (permission !== "granted") {

                    console.log(
                        "❌ Notification permission not granted"
                    );

                    return;
                }


                // =================================================
                // SERVICE WORKER
                // =================================================

                const registration =
                    await navigator.serviceWorker.ready;


                console.log(
                    "✅ Service Worker ready"
                );


                // =================================================
                // GET EXISTING SUBSCRIPTION
                // =================================================

                let subscription =
                    await registration.pushManager.getSubscription();


                // =================================================
                // CREATE NEW SUBSCRIPTION
                // =================================================

                if (!subscription) {

                    console.log(
                        "🔄 Creating Push Subscription..."
                    );


                    // Get VAPID public key
                    const vapidResponse =
                        await fetch(
                            "https://orbit-backend-94nx.onrender.com/api/push/vapid-public-key",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    if (!vapidResponse.ok) {

                        const errorText =
                            await vapidResponse.text();

                        console.log(
                            "❌ VAPID API ERROR:",
                            errorText
                        );

                        throw new Error(
                            "Unable to get VAPID public key"
                        );
                    }


                    const vapidData =
                        await vapidResponse.json();


                    if (!vapidData.publicKey) {

                        throw new Error(
                            "VAPID public key missing"
                        );
                    }


                    // Subscribe browser
                    subscription =
                        await registration.pushManager.subscribe({

                            userVisibleOnly: true,

                            applicationServerKey:
                                urlBase64ToUint8Array(
                                    vapidData.publicKey
                                )
                        });


                    console.log(
                        "✅ New Push Subscription Created"
                    );

                } else {

                    console.log(
                        "✅ Existing Push Subscription Found"
                    );
                }


                // =================================================
                // SAVE SUBSCRIPTION TO BACKEND
                // =================================================

                const saveResponse =
                    await fetch(
                        "https://orbit-backend-94nx.onrender.com/api/push/subscribe",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify(
                                subscription
                            )
                        }
                    );


                const saveData =
                    await saveResponse.json();


                if (!saveResponse.ok) {

                    throw new Error(
                        saveData.message ||
                        "Push subscription save failed"
                    );
                }


                console.log(
                    "✅ Push subscription saved:",
                    saveData.message
                );


            } catch (error) {

                console.log(
                    "❌ PUSH SETUP ERROR:",
                    error
                );
            }
        };


        setupPushNotifications();

    }, []);


    // =================================================
    // ROUTES
    // =================================================

    return (
        <>
            <Navbar />

            <Routes>

                {/* ================= PUBLIC ================= */}

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/post/:id"
                    element={<SinglePost />}
                />

                <Route
                    path="/user/:id"
                    element={<UserProfile />}
                />

                <Route
                    path="/followers/:id"
                    element={<Followers />}
                />

                <Route
                    path="/chat/:userId"
                    element={<Chat />}
                />


                {/* ================= MESSAGES ================= */}

                <Route
                    path="/messages"
                    element={
                        <ProtectedRoute>
                            <Inbox />
                        </ProtectedRoute>
                    }
                />


                {/* ================= PROFILE ================= */}

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />


                {/* ================= USERS ================= */}

                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <Discover />
                        </ProtectedRoute>
                    }
                />


                {/* ================= CREATE POST ================= */}

                <Route
                    path="/create-post"
                    element={
                        <ProtectedRoute>
                            <CreatePost />
                        </ProtectedRoute>
                    }
                />


                {/* ================= EDIT POST ================= */}

                <Route
                    path="/edit-post/:id"
                    element={
                        <ProtectedRoute>
                            <EditPost />
                        </ProtectedRoute>
                    }
                />


                {/* ================= EDIT PROFILE ================= */}

                <Route
                    path="/edit-profile"
                    element={
                        <ProtectedRoute>
                            <EditProfile />
                        </ProtectedRoute>
                    }
                />


                {/* ================= SETTINGS ================= */}

                <Route
                    path="/setting"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />


                {/* ================= NOTIFICATIONS ================= */}

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />


                {/* ================= AUTHOR ================= */}

                <Route
                    path="/author/broadcast"
                    element={
                        <Broadcast />
                    }
                />

            </Routes>
        </>
    );
}

export default App;