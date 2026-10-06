const {
    sendPushNotification
} = require("../utils/pushNotification");
const User = require("../model/user.model");

// userId -> socketId
const users = {};

function callSocket(io) {
    io.on("connection", (socket) => {
        console.log(
            "📞 Call Socket Connected:",
            socket.id
        );

        // =====================================================
        // CALL JOIN
        // =====================================================
        socket.on("call:join", (userId) => {
            if (!userId) return;

            socket.data.userId = String(userId);
            users[String(userId)] = socket.id;

            console.log(
                "📞 Call user joined:",
                String(userId),
                socket.id
            );

            console.log(
                "👥 Active call users:",
                Object.keys(users)
            );
        });

        // =====================================================
        // CALL START
        // =====================================================
        socket.on(
            "call:start",
            async (data) => {
                try {
                    const {
                        callerId,
                        receiverId,
                        callType
                    } = data || {};

                    if (
                        !callerId ||
                        !receiverId
                    ) {
                        socket.emit(
                            "call:user-offline",
                            {
                                pushSent: false,
                                reason:
                                    "INVALID_CALL_DATA"
                            }
                        );
                        return;
                    }

                    const receiverSocket =
                        users[String(receiverId)];

                    console.log(
                        "📞 CALL START:",
                        {
                            callerId,
                            receiverId,
                            callType,
                            receiverSocket:
                                receiverSocket ||
                                null
                        }
                    );

                    // =================================================
                    // RECEIVER ONLINE -> SOCKET CALL
                    // =================================================
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

                    // =================================================
                    // RECEIVER OFFLINE -> WEB PUSH
                    // =================================================
                    console.log(
                        "📴 Receiver socket offline. Sending push notification..."
                    );

                    let callerName =
                        "Someone";

                    try {
                        const caller =
                            await User.findById(
                                callerId
                            ).select(
                                "username"
                            );

                        if (
                            caller?.username
                        ) {
                            callerName =
                                caller.username;
                        }
                    } catch (error) {
                        console.log(
                            "⚠️ Caller user lookup error:",
                            error.message
                        );
                    }

                    const normalizedCallType =
                        callType === "video"
                            ? "video"
                            : "audio";

                    const callTitle =
                        normalizedCallType ===
                        "video"
                            ? "📹 Incoming video call"
                            : "📞 Incoming call";

                    const callBody =
                        `${callerName} is calling you`;

                    const pushResult =
                        await sendPushNotification({
                            userId: receiverId,
                            title: callTitle,
                            body: callBody,
                            url: `/chat/${callerId}`,
                            data: {
                                type:
                                    "incoming-call",
                                callerId,
                                receiverId,
                                callType:
                                    normalizedCallType
                            }
                        });

                    console.log(
                        "🔔 Offline call push result:",
                        pushResult
                    );

                    // IMPORTANT:
                    // Do NOT end the caller's call if push was
                    // successfully delivered. Keep caller screen
                    // alive while receiver opens ORBIT.
                    socket.emit(
                        "call:user-offline",
                        {
                            receiverId,
                            pushSent:
                                Boolean(
                                    pushResult?.sent
                                )
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
                            pushSent: false,
                            reason:
                                "SERVER_ERROR"
                        }
                    );
                }
            }
        );

        // =====================================================
        // CALL ACCEPT
        // =====================================================
        socket.on(
            "call:accept",
            (data) => {
                const {
                    callerId,
                    receiverId
                } = data || {};

                const callerSocket =
                    users[String(callerId)];

                console.log(
                    "✅ CALL ACCEPT:",
                    {
                        callerId,
                        receiverId,
                        callerSocket:
                            callerSocket || null
                    }
                );

                if (callerSocket) {
                    io.to(callerSocket).emit(
                        "call:accepted",
                        {
                            callerId,
                            receiverId
                        }
                    );
                }
            }
        );

        // =====================================================
        // CALL REJECT
        // =====================================================
        socket.on(
            "call:reject",
            (data) => {
                const {
                    callerId,
                    receiverId
                } = data || {};

                const callerSocket =
                    users[String(callerId)];

                if (callerSocket) {
                    io.to(callerSocket).emit(
                        "call:rejected",
                        {
                            callerId,
                            receiverId
                        }
                    );
                }
            }
        );

        // =====================================================
        // CALL END
        // =====================================================
        socket.on(
            "call:end",
            (data) => {
                const {
                    callerId,
                    receiverId
                } = data || {};

                const socketUserId =
                    socket.data.userId;

                const otherUserId =
                    String(socketUserId) ===
                    String(callerId)
                        ? receiverId
                        : callerId;

                const otherSocket =
                    users[String(otherUserId)];

                if (otherSocket) {
                    io.to(otherSocket).emit(
                        "call:ended"
                    );
                }
            }
        );

        // =====================================================
        // WEBRTC OFFER
        // =====================================================
        socket.on(
            "call:offer",
            ({ receiverId, offer }) => {
                const receiverSocket =
                    users[String(receiverId)];

                if (receiverSocket) {
                    io.to(receiverSocket).emit(
                        "call:offer",
                        {
                            offer,
                            senderId:
                                socket.data
                                    .userId
                        }
                    );
                }
            }
        );

        // =====================================================
        // WEBRTC ANSWER
        // =====================================================
        socket.on(
            "call:answer",
            ({ receiverId, answer }) => {
                const receiverSocket =
                    users[String(receiverId)];

                if (receiverSocket) {
                    io.to(receiverSocket).emit(
                        "call:answer",
                        {
                            answer,
                            senderId:
                                socket.data
                                    .userId
                        }
                    );
                }
            }
        );

        // =====================================================
        // ICE CANDIDATE
        // =====================================================
        socket.on(
            "call:ice-candidate",
            ({ receiverId, candidate }) => {
                const receiverSocket =
                    users[String(receiverId)];

                if (receiverSocket) {
                    io.to(receiverSocket).emit(
                        "call:ice-candidate",
                        {
                            candidate,
                            senderId:
                                socket.data
                                    .userId
                        }
                    );
                }
            }
        );

        // =====================================================
        // DISCONNECT
        // =====================================================
        socket.on("disconnect", () => {
            const userId =
                socket.data.userId;

            if (
                userId &&
                users[String(userId)] ===
                    socket.id
            ) {
                delete users[String(userId)];

                console.log(
                    "📴 Call user disconnected:",
                    String(userId)
                );
            }

            console.log(
                "👥 Active call users after disconnect:",
                Object.keys(users)
            );
        });
    });
}

module.exports = callSocket;
