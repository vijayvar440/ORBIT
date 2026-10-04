const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middlewares/auth.Middlewares");

const pushController =
    require("../controller/push.controller");

console.log("========== PUSH DEBUG ==========");
console.log("authMiddleware:", typeof authMiddleware);
console.log("pushController:", pushController);
console.log("getVapidPublicKey:", typeof pushController.getVapidPublicKey);
console.log("savePushSubscription:", typeof pushController.savePushSubscription);
console.log("deletePushSubscription:", typeof pushController.deletePushSubscription);
console.log("================================");

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