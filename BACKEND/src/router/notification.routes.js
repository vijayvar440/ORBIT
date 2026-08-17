const express = require("express");
const router = express.Router();

const authMiddleware =
    require("../middlewares/auth.Middlewares");

const notificationController =
    require("../controller/notification.controller");

router.get(
    "/",
    authMiddleware,
    notificationController.getNotifications
);

router.post(
    "/create",
    authMiddleware,
    notificationController.createNotification
);

router.put(
    "/read/:id",
    authMiddleware,
    notificationController.markAsRead
);

router.put(
    "/read-all",
    authMiddleware,
    notificationController.markAllAsRead
);

router.delete(
    "/:id",
    authMiddleware,
    notificationController.deleteNotification
);
router.post(
    "/broadcast",
    authMiddleware,
    notificationController.broadcastNotification
);
router.get(
    "/unread-count",
    authMiddleware,
    notificationController.getUnreadCount
);

module.exports = router;