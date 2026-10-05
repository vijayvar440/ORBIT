const {
    sendPushNotification
} = require("../utils/pushNotification");

const User = require("../model/user.model");


const users = {};


function callSocket(io) {

    io.on("connection", (socket) => {

        console.log(
            "📞 Call Socket Connected:",
            socket.id
        );


        // =========================
        // USER JOIN
        // =========================

        socket.on("call:join", (userId) => {

            if (!userId) return;


            users[userId] = socket.id;


            console.log(
                "📞 Call user joined:",
                userId,
                socket.id
            );

        });


        // =========================
        // START CALL
        // =========================

        socket.on("call:start", async (data) => {

            try {

                const {
                    callerId,
                    receiverId,
                    callType
                } = data;


                const receiverSocket =
                    users[receiverId];


                console.log(
                    "📞 Call Start:",
                    {
                        callerId,
                        receiverId,
                        callType
                    }
                );


                // =========================
                // RECEIVER ONLINE
                // =========================

                if (receiverSocket) {

                    io.to(receiverSocket).emit(
                        "call:incoming",
                        {
                            callerId,
                            receiverId,
                            callType
                        }
                    );


                    console.log(
                        "📞 Incoming call sent through socket"
                    );


                    return;
                }


                // =========================
                // RECEIVER OFFLINE
                // =========================

                console.log(
                    "📴 Receiver offline. Sending push notification..."
                );


                let callerName = "Someone";


                try {

                    const caller =
                        await User.findById(
                            callerId
                        ).select("username");


                    if (caller?.username) {

                        callerName =
                            caller.username;

                    }

                } catch (error) {

                    console.log(
                        "⚠️ Caller user lookup error:",
                        error.message
                    );

                }


                const callTitle =
                    callType === "video"
                        ? "📹 Incoming video call"
                        : "📞 Incoming call";


                const callBody =
                    `${callerName} is calling you`;


                await sendPushNotification({

                    userId: receiverId,

                    title: callTitle,

                    body: callBody,

                    url: `/chat/${callerId}`,

                    data: {

                        type: "incoming-call",

                        callerId,

                        receiverId,

                        callType

                    }

                });


                // Tell caller that receiver is offline
                socket.emit(
                    "call:user-offline",
                    {
                        receiverId,
                        pushSent: true
                    }
                );


            } catch (error) {

                console.log(
                    "❌ Call start error:",
                    error.message
                );


                socket.emit(
                    "call:user-offline",
                    {
                        pushSent: false
                    }
                );

            }

        });


        // =========================
        // ACCEPT CALL
        // =========================

        socket.on("call:accept", (data) => {

            const {
                callerId,
                receiverId
            } = data;


            const callerSocket =
                users[callerId];


            if (callerSocket) {

                io.to(callerSocket).emit(
                    "call:accepted",
                    {
                        callerId,
                        receiverId
                    }
                );

            }

        });


        // =========================
        // REJECT CALL
        // =========================

        socket.on("call:reject", (data) => {

            const {
                callerId,
                receiverId
            } = data;


            const callerSocket =
                users[callerId];


            if (callerSocket) {

                io.to(callerSocket).emit(
                    "call:rejected",
                    {
                        callerId,
                        receiverId
                    }
                );

            }

        });


        // =========================
        // END CALL
        // =========================

        socket.on("call:end", (data) => {

            const {
                callerId,
                receiverId
            } = data;


            const otherUserId =
                socket.id === users[callerId]
                    ? receiverId
                    : callerId;


            const otherSocket =
                users[otherUserId];


            if (otherSocket) {

                io.to(otherSocket).emit(
                    "call:ended"
                );

            }

        });


        // =========================
        // WEBRTC OFFER
        // =========================

        socket.on(
            "call:offer",
            ({ receiverId, offer }) => {

                const receiverSocket =
                    users[receiverId];


                if (receiverSocket) {

                    io.to(receiverSocket).emit(
                        "call:offer",
                        {
                            offer,

                            senderId:
                                Object.keys(users).find(
                                    id =>
                                        users[id] ===
                                        socket.id
                                )
                        }
                    );

                }

            }
        );


        // =========================
        // WEBRTC ANSWER
        // =========================

        socket.on(
            "call:answer",
            ({ receiverId, answer }) => {

                const receiverSocket =
                    users[receiverId];


                if (receiverSocket) {

                    io.to(receiverSocket).emit(
                        "call:answer",
                        {
                            answer,

                            senderId:
                                Object.keys(users).find(
                                    id =>
                                        users[id] ===
                                        socket.id
                                )
                        }
                    );

                }

            }
        );


        // =========================
        // WEBRTC ICE CANDIDATE
        // =========================

        socket.on(
            "call:ice-candidate",
            ({ receiverId, candidate }) => {

                const receiverSocket =
                    users[receiverId];


                if (receiverSocket) {

                    io.to(receiverSocket).emit(
                        "call:ice-candidate",
                        {
                            candidate
                        }
                    );

                }

            }
        );


        // =========================
        // DISCONNECT
        // =========================

        socket.on("disconnect", () => {

            for (
                const userId in users
            ) {

                if (
                    users[userId] ===
                    socket.id
                ) {

                    delete users[userId];


                    console.log(
                        "📴 Call user disconnected:",
                        userId
                    );


                    break;

                }

            }

        });

    });

}


module.exports = callSocket;