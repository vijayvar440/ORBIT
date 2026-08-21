const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./router/auth.routes");
const postRouter = require("./router/post.routes");
const massageRouter = require("./router/message.routes");

const app = express();

// Allowed Origins (Local + Live Vercel App)
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://orbit-one-inky.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/post", postRouter);
app.use("/api/message", massageRouter);

module.exports = app;