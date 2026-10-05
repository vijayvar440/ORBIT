const webpush = require("web-push");
const PushSubscription = require("../model/pushSubscription.model");

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async ({
    userId,
    title,
    body,
    url = "/messages",
    data = {}
}) => {
    try {
        const subscriptions = await PushSubscription.find({
            user: userId
        });

        if (!subscriptions.length) {
            console.log(
                "⚠️ No push subscription for user:",
                userId
            );
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            url,

            tag:
                data.type === "incoming-call"
                    ? `incoming-call-${userId}`
                    : `message-${userId}`,

            data
        });

        for (const subscription of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,

                        keys: {
                            p256dh:
                                subscription.keys.p256dh,

                            auth:
                                subscription.keys.auth
                        }
                    },
                    payload
                );

                console.log(
                    "✅ Push notification sent"
                );

            } catch (error) {

                console.log(
                    "❌ Push send error:",
                    error.statusCode,
                    error.message
                );

                if (
                    error.statusCode === 404 ||
                    error.statusCode === 410
                ) {
                    await PushSubscription.deleteOne({
                        _id: subscription._id
                    });

                    console.log(
                        "🗑️ Expired push subscription removed"
                    );
                }
            }
        }

    } catch (error) {

        console.log(
            "❌ Push notification system error:",
            error.message
        );
    }
};

module.exports = {
    sendPushNotification
};