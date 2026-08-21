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
        // Allow requests with no origin (mobile apps, postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Fail safely without throwing uncaught backend errors
            callback(null, false);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// 1. Preflight OPTIONS handling (Sabse pehle)
app.options("*", cors(corsOptions));

// 2. Global CORS Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// 3. API Routes
app.use("/api/auth", authRouter);
app.use("/api/post", postRouter);
app.use("/api/message", massageRouter);

module.exports = app;