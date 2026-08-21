require("dotenv").config();

const http = require("http");
const path = require("path"); // 👈 1. Path module import karein
const express = require("express"); // 👈 2. Express import karein
const { Server } = require("socket.io");

const app = require("./src/app");
const conectDB = require("./src/db/db");

conectDB();

// 👈 3. CRITICAL FIX: Uploads folder ko publicly accessible banayein
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const server = http.createServer(app);

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is awake 🚀",
        time: new Date().toISOString()
    });
});

// ✅ FIX: Allow all origins (*) or production domain for CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

const notificationRoutes = require("./src/router/notification.routes");

app.use(
    "/api/notification",
    notificationRoutes
);

const users = {};

io.on("connection", (socket) => {

    console.log("🟢 User Connected:", socket.id);

    socket.on("join", (userId) => {
        users[userId] = socket.id;

        io.emit(
            "online-users",
            Object.keys(users)
        );
    });

    socket.on("disconnect", () => {
        for (let id in users) {
            if (users[id] === socket.id) {
                delete users[id];
                break;
            }
        }

        io.emit(
            "online-users",
            Object.keys(users)
        );

        console.log(
            "🔴 User Disconnected:",
            socket.id
        );
    });

    socket.on(
        "typing",
        ({ sender, receiver }) => {
            const receiverSocket = users[receiver];
            if (receiverSocket) {
                io.to(receiverSocket).emit(
                    "typing",
                    sender
                );
            }
        }
    );

    socket.on(
        "stop_typing",
        ({ sender, receiver }) => {
            const receiverSocket = users[receiver];
            if (receiverSocket) {
                io.to(receiverSocket).emit(
                    "stop_typing",
                    sender
                );
            }
        }
    );

    socket.on("send_message", (data) => {
        const receiverSocket = users[receiver]; // Fixed variable reference if needed
        if (receiverSocket) {
            io.to(receiverSocket).emit(
                "receive_message",
                data
            );
        }
    });

    socket.on("message_delivered", ({ messageId, senderId }) => {
        const senderSocket = users[senderId];
        if (senderSocket) {
            io.to(senderSocket).emit(
                "message_delivered",
                { messageId }
            );
        }
    });

    socket.on("message_seen", ({ messageId, senderId }) => {
        const senderSocket = users[senderId];
        if (senderSocket) {
            io.to(senderSocket).emit(
                "message_seen",
                { messageId }
            );
        }
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});