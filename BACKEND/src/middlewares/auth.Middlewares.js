const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers?.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        if (!token) {
            token = req.cookies?.token;
        }

        // 🟢 FIX: Checking string "null", "undefined", or empty token
        if (
            !token || 
            token === "null" || 
            token === "undefined" || 
            token.trim() === ""
        ) {
            return res.status(401).json({
                message: "Unauthorized: Token missing"
            });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decodedToken;

        next();

    } catch (err) {
        console.log("AUTH ERROR:", err.message);

        return res.status(401).json({
            message: "Invalid token"
        });
    }
};

module.exports = authMiddleware;