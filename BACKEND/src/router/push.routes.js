const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middlewares/auth.Middlewares");

const pushController =
    require("../controller/push.controller");



router.get(
    "/vapid-public-key",
    pushController.getVapidPublicKey
);

router.post(
    "/subscribe",
    authMiddleware,
    pushController.savePushSubscription
);

router.delete(
    "/unsubscribe",
    authMiddleware,
    pushController.deletePushSubscription
);

module.exports = router;