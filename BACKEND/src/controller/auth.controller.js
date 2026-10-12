
const userModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// REGISTER USER
async function registerUser(req, res) {
    try {
        let { username, email, password } = req.body || {};

        // 1. Required fields validation
        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Username, email and password are required."
            });
        }

        // 2. Trim and normalize input
        username = username.trim();
        email = email.trim().toLowerCase();

        // 3. Username validation
        if (!username || username.length < 3 || username.length > 30) {
            return res.status(400).json({
                message: "Username must be between 3 and 30 characters."
            });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({
                message: "Username can contain only letters, numbers and underscores."
            });
        }

        // 4. Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // 5. Password validation
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        if (password.length > 72) {
            return res.status(400).json({
                message: "Password must not exceed 72 characters."
            });
        }

        // 6. Check existing user
        const userExist = await userModel.findOne({
            $or: [{ email }, { username }]
        });

        if (userExist) {
            return res.status(409).json({
                message: "Username or email already exists."
            });
        }

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Never accept role directly from public registration input
        const user = await userModel.create({
            username,
            email,
            password: hashedPassword,
            role: "user"
        });

        // 8. Create JWT
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // 9. Set authentication cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.status(201).json({
            message: "User registered successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Register Error:", err);

        return res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
}

// LOGIN USER
async function logingUser(req, res) {
    try {
        const { email, password } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.status(200).json({
            message: "User login successful.",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login Error:", err);

        return res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
}

// LOGOUT USER
async function logOutUser(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "User logout successful."
        });
    } catch (err) {
        console.error("Logout Error:", err);

        return res.status(500).json({
            message: "Logout failed."
        });
    }
}

module.exports = {
    registerUser,
    logingUser,
    logOutUser
};
