import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", (event) => {
    console.log("🔔 ORBIT PUSH RECEIVED");

    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        data = {
            title: "ORBIT",
            body: event.data
                ? event.data.text()
                : "New notification"
        };
    }

    const isIncomingCall =
        data?.data?.type === "incoming-call";

    if (isIncomingCall) {
        const callType =
            data?.data?.callType === "video"
                ? "video"
                : "audio";

        const callerId =
            data?.data?.callerId;

        const receiverId =
            data?.data?.receiverId;

        const title =
            data.title ||
            (callType === "video"
                ? "📹 Incoming video call"
                : "📞 Incoming call");

        const body =
            data.body ||
            "Someone is calling you";

        const options = {
            body,
            icon: "/icone/icon-192.png",
            badge: "/icone/icon-192.png",
            requireInteraction: true,
            renotify: true,
            tag: `incoming-call-${callerId}`,
            vibrate: [
                800,
                300,
                800,
                300,
                800,
                300,
                800,
                300,
                800
            ],
            data: {
                type: "incoming-call",
                callerId,
                receiverId,
                callType
            }
        };

        event.waitUntil(
            self.registration.showNotification(
                title,
                options
            )
        );

        return;
    }

    const title =
        data.title || "ORBIT";

    const options = {
        body:
            data.body ||
            "New message",
        icon: "/icone/icon-192.png",
        badge: "/icone/icon-192.png",
        data: {
            url:
                data.url ||
                "/messages",
            type:
                data?.data?.type ||
                "message"
        },
        tag:
            data.tag ||
            "orbit-message",
        renotify: true,
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});

self.addEventListener(
    "notificationclick",
    (event) => {
        event.notification.close();

        const notificationData =
            event.notification?.data || {};

        let url =
            notificationData.url ||
            "/messages";

        // IMPORTANT:
        // Incoming call notification must open the exact chat
        // with information required to restore the call UI.
        if (
            notificationData.type ===
                "incoming-call" &&
            notificationData.callerId
        ) {
            const params =
                new URLSearchParams({
                    incomingCall: "1",
                    callerId:
                        notificationData.callerId,
                    callType:
                        notificationData.callType ===
                        "video"
                            ? "video"
                            : "audio"
                });

            url =
                `/chat/${notificationData.callerId}?${params.toString()}`;
        }

        event.waitUntil(
            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (
                            "focus" in client
                        ) {
                            return client
                                .navigate(url)
                                .then(() =>
                                    client.focus()
                                );
                        }
                    }

                    if (clients.openWindow) {
                        return clients.openWindow(
                            url
                        );
                    }
                })
        );
    }
);
