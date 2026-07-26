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

io.on("connection", (socket) => {

    console.log("🟢 User Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 User Disconnected:", socket.id);
    });

});

server.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
});