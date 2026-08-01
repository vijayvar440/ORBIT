require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const conectDB = require("./src/db/db");

conectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const users = {};

io.on("connection", (socket) => {

    console.log("🟢 User Connected:", socket.id);

    socket.on("join", (userId) => {

        users[userId] = socket.id;

        io.emit("online-users", Object.keys(users));

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

});

server.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
});