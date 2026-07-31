const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.Middlewares");
const messageController = require("../controller/message.controller");

router.post(
    "/send/:userId",
    authMiddleware,
    messageController.sendMessage
);

router.get(
    "/:userId",
    authMiddleware,
    messageController.getMessages
);
router.get(
    "/inbox",
    authMiddleware,
    messageController.getInbox
);

module.exports = router;