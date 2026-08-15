const express = require("express");
const router = express.Router();
const upload = require("../middlewares/chatUpload");
const authMiddleware = require("../middlewares/auth.Middlewares");
const messageController = require("../controller/message.controller");



// Send Text + Image
router.post(
    "/send/:userId",
    authMiddleware,
    upload.single("file"),
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
router.delete(
    "/delete/:messageId",
    authMiddleware,
    messageController.deleteMessage
);

module.exports = router;