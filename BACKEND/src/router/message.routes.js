const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.Middlewares");
const messageController = require("../controller/message.controller");

const upload = require("../middlewares/chatUpload");

// Send Text + Image
router.post(
    "/send/:userId",
    authMiddleware,
    upload.single("image"),
    messageController.sendMessage
);

router.get(
    "/inbox",
    authMiddleware,
    messageController.getInbox
);

router.get(
    "/:userId",
    authMiddleware,
    messageController.getMessages
);

module.exports = router;