import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);


// ========================================
// PUSH NOTIFICATION
// ========================================

self.addEventListener("push", (event) => {

    console.log("🔔 ORBIT PUSH RECEIVED");

    let data = {};

    try {

        data = event.data
            ? event.data.json()
            : {};

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


    // ========================================
    // INCOMING CALL
    // ========================================

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
            (
                callType === "video"
                    ? "📹 Incoming video call"
                    : "📞 Incoming call"
            );


        const body =
            data.body ||
            "Someone is calling you";


        const options = {

            body,

            icon: "/icone/icon-192.png",

            badge: "/icone/icon-192.png",


            // Important call data
            data: {

                url:
                    data.url ||
                    `/chat/${callerId}`,

                type: "incoming-call",

                callerId,

                receiverId,

                callType

            },


            tag:
                `incoming-call-${callerId}`,

            renotify: true,

            requireInteraction: true,

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
                     ]

        };


        event.waitUntil(

            self.registration.showNotification(
                title,
                options
            )

        );


        return;
    }


    // ========================================
    // NORMAL MESSAGE NOTIFICATION
    // ========================================

    const title =
        data.title ||
        "ORBIT";


    const options = {

        body:
            data.body ||
            "New message",

        icon:
            "/icone/icon-192.png",

        badge:
            "/icone/icon-192.png",


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

        vibrate: [
            200,
            100,
            200
        ]

    };


    event.waitUntil(

        self.registration.showNotification(
            title,
            options
        )

    );

});


// ========================================
// NOTIFICATION CLICK
// ========================================

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();


        const notificationData =
            event.notification?.data ||
            {};


        const url =
            notificationData.url ||
            "/messages";


        event.waitUntil(

            clients.matchAll({

                type: "window",

                includeUncontrolled: true

            }).then((clientList) => {


                // ========================================
                // EXISTING ORBIT WINDOW
                // ========================================

                for (
                    const client of clientList
                ) {

                    if (
                        "focus" in client
                    ) {

                        client.navigate(url);

                        return client.focus();

                    }

                }


                // ========================================
                // OPEN ORBIT
                // ========================================

                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        url
                    );

                }

            })

        );

    }
);