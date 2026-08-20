require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const conectDB = require("./src/db/db");

conectDB();

const server = http.createServer(app);

// Health Check Route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is awake 🚀",
        time: new Date().toISOString()
    });
});

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});


const notificationRoutes =
    require("./src/router/notification.routes");

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

            const receiverSocket =
                users[receiver];

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

            const receiverSocket =
                users[receiver];

            if (receiverSocket) {

                io.to(receiverSocket).emit(
                    "stop_typing",
                    sender
                );

            }

        }
    );

socket.on("send_message", (data) => {

    const receiverSocket =
        users[data.receiver];

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
            {
                messageId
            }
        );

    }

});


socket.on("message_seen", ({ messageId, senderId }) => {

    const senderSocket = users[senderId];

    if (senderSocket) {

        io.to(senderSocket).emit(
            "message_seen",
            {
                messageId
            }
        );

    }

});

});


server.listen(3000, () => {

    console.log(
        "🚀 Server is running on port 3000"
    );

});