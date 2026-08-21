const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./router/auth.routes");
const postRouter = require("./router/post.routes");
const massageRouter = require("./router/message.routes");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://orbit-one-inky.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// 1. Global CORS Middleware (Ye Preflight OPTIONS requests auto-handle kar leta hai)
app.use(cors(corsOptions));

// 2. Parsers
app.use(express.json());
app.use(cookieParser());

// 3. API Routes
app.use("/api/auth", authRouter);
app.use("/api/post", postRouter);
app.use("/api/message", massageRouter);

module.exports = app;