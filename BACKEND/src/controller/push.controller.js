const webpush = require("web-push");
const PushSubscription = require("../model/pushSubscription.model");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// VAPID_SUBJECT preferred, VAPID_EMAIL fallback
const VAPID_SUBJECT =
    process.env.VAPID_SUBJECT ||
    process.env.VAPID_EMAIL;

console.log(
    "VAPID_SUBJECT:",
    VAPID_SUBJECT ? VAPID_SUBJECT : "NOT FOUND"
);

console.log(
    "VAPID_PUBLIC_KEY:",
    VAPID_PUBLIC_KEY ? "LOADED" : "NOT FOUND"
);

console.log(
    "VAPID_PRIVATE_KEY:",
    VAPID_PRIVATE_KEY ? "LOADED" : "NOT FOUND"
);

if (
    !VAPID_SUBJECT ||
    !VAPID_PUBLIC_KEY ||
    !VAPID_PRIVATE_KEY
) {
    throw new Error(
        "VAPID configuration missing. Check VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env"
    );
}

webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);


// GET PUBLIC VAPID KEY
const getVapidPublicKey = async (req, res) => {
    try {
        return res.status(200).json({
            publicKey: VAPID_PUBLIC_KEY
        });
    } catch (err) {
        console.log("VAPID Public Key Error:", err);

        return res.status(500).json({
            message: err.message
        });
    }
};


// SAVE PUSH SUBSCRIPTION
const savePushSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscription = req.body;

        if (
            !subscription ||
            !subscription.endpoint ||
            !subscription.keys?.p256dh ||
            !subscription.keys?.auth
        ) {
            return res.status(400).json({
                message: "Invalid push subscription"
            });
        }

        const savedSubscription =
            await PushSubscription.findOneAndUpdate(
                {
                    endpoint: subscription.endpoint
                },
                {
                    user: userId,
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth
                    }
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

        return res.status(201).json({
            message: "Push subscription saved successfully",
            subscription: savedSubscription
        });

    } catch (err) {
        console.log(
            "Save Push Subscription Error:",
            err
        );

        return res.status(500).json({
            message: err.message
        });
    }
};


// DELETE PUSH SUBSCRIPTION
const deletePushSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                message: "Endpoint is required"
            });
        }

        await PushSubscription.deleteOne({
            user: userId,
            endpoint
        });

        return res.status(200).json({
            message: "Push subscription removed"
        });

    } catch (err) {
        console.log(
            "Delete Push Subscription Error:",
            err
        );

        return res.status(500).json({
            message: err.message
        });
    }
};


module.exports = {
    getVapidPublicKey,
    savePushSubscription,
    deletePushSubscription
};