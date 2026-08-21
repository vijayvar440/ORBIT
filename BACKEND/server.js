require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const { Server } = require("socket.io");

// App router with configured CORS imported here
const app = require("./src/app");
const conectDB = require("./src/db/db");

conectDB();

// Static uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const notificationRoutes = require("./src/router/notification.routes");
app.use("/api/notification", notificationRoutes);

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is awake 🚀",
        time: new Date().toISOString()
    });
});

const server = http.createServer(app);

// Socket.io Config (Matches origins strictly for Credentials/WSS)
const io = new Server(server, {
    cors: {
        origin: [
            "https://orbit-one-inky.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ["websocket", "polling"]
});

const users = {};

io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);

    socket.on("join", (userId) => {
        if (userId) {
            users[userId] = socket.id;
            io.emit("online-users", Object.keys(users));
        }
    });

    socket.on("disconnect", () => {
        for (let id in users) {
            if (users[id] === socket.id) {
                delete users[id];
                break;
            }
        }
        io.emit("online-users", Object.keys(users));
        console.log("🔴 User Disconnected:", socket.id);
    });

    socket.on("typing", ({ sender, receiver }) => {
        const receiverSocket = users[receiver];
        if (receiverSocket) {
            io.to(receiverSocket).emit("typing", sender);
        }
    });

    socket.on("stop_typing", ({ sender, receiver }) => {
        const receiverSocket = users[receiver];
        if (receiverSocket) {
            io.to(receiverSocket).emit("stop_typing", sender);
        }
    });

    socket.on("send_message", (data) => {
        const receiverId = data.receiver || data.receiverId;
        const receiverSocket = users[receiverId];

        if (receiverSocket) {
            io.to(receiverSocket).emit("receive_message", data);
        }
    });

    socket.on("message_delivered", ({ messageId, senderId }) => {
        const senderSocket = users[senderId];
        if (senderSocket) {
            io.to(senderSocket).emit("message_delivered", { messageId });
        }
    });

    socket.on("message_seen", ({ messageId, senderId }) => {
        const senderSocket = users[senderId];
        if (senderSocket) {
            io.to(senderSocket).emit("message_seen", { messageId });
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});