import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", (event) => {
    console.log("🔔 PUSH RECEIVED");

    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        data = {
            title: "ORBIT",
            body: event.data
                ? event.data.text()
                : "New message"
        };
    }

    const title = data.title || "ORBIT";

    const options = {
        body: data.body || "New message",
        icon: "/icone/icon-192.png",
        badge: "/icone/icon-192.png",
        data: {
            url: data.url || "/"
        },
        vibrate: [200, 100, 200],
        tag: data.tag || "orbit-message",
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url =
        event.notification?.data?.url || "/";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then((clientList) => {

            for (const client of clientList) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});