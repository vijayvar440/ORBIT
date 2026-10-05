const messageModel = require("../model/message.model");
const User = require("../model/user.model");

const {
    sendPushNotification
} = require("../utils/pushNotification");


// ===============================
// SEND MESSAGE
// ===============================

const sendMessage = async (req, res) => {

    try {

        const sender = req.user.id;
        const receiver = req.params.userId;

        const { message } = req.body;

        let image = "";
        let video = "";
        let file = "";


        // ===============================
        // HANDLE ATTACHMENT
        // ===============================

        if (req.file) {

            if (req.file.mimetype.startsWith("image")) {

                image = req.file.path;

            } else if (req.file.mimetype.startsWith("video")) {

                video = req.file.path;

            } else {

                file = req.file.path;

            }

        }


        // ===============================
        // CHECK MESSAGE
        // ===============================

        if (!message && !image && !video && !file) {

            return res.status(400).json({
                message: "Message or Attachment is required"
            });

        }


        // ===============================
        // SAVE MESSAGE
        // ===============================

        const newMessage = await messageModel.create({

            sender,
            receiver,
            message,
            image,
            video,
            file

        });


        // ===============================
        // PUSH NOTIFICATION
        // ===============================

        try {

            const senderUser =
                await User.findById(sender)
                    .select("username");

            const senderName =
                senderUser?.username || "Someone";


            let notificationBody =
                message?.trim();


            if (!notificationBody) {

                if (image) {

                    notificationBody = "📷 Sent an image";

                } else if (video) {

                    notificationBody = "🎥 Sent a video";

                } else if (file) {

                    notificationBody = "📎 Sent a file";

                } else {

                    notificationBody = "💬 New message";

                }

            }


            await sendPushNotification({

                userId: receiver,

                title: `💬 ${senderName}`,

                body: notificationBody,

                url: `/chat/${sender}`

            });


        } catch (pushError) {

            console.log(
                "⚠️ PUSH NOTIFICATION ERROR:",
                pushError.message
            );

        }


        // ===============================
        // RESPONSE
        // ===============================

        return res.status(201).json({

            message: "Message Sent Successfully",

            newMessage

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// MARK MESSAGES AS DELIVERED
// ===============================

const markMessagesAsDelivered = async (req, res) => {

    try {

        const receiverId = req.user.id;
        const senderId = req.params.userId;


        await messageModel.updateMany(

            {
                sender: senderId,
                receiver: receiverId,
                status: "sent"
            },

            {
                $set: {
                    status: "delivered"
                }
            }

        );


        return res.status(200).json({

            message: "Messages delivered"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// MARK MESSAGES AS SEEN
// ===============================

const markMessagesAsSeen = async (req, res) => {

    try {

        const receiverId = req.user.id;
        const senderId = req.params.userId;


        await messageModel.updateMany(

            {
                sender: senderId,
                receiver: receiverId,
                status: {
                    $in: [
                        "sent",
                        "delivered"
                    ]
                }
            },

            {
                $set: {
                    status: "seen"
                }
            }

        );


        return res.status(200).json({

            message: "Messages seen"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// GET MESSAGES
// ===============================

const getMessages = async (req, res) => {

    try {

        const sender = req.user.id;
        const receiver = req.params.userId;


        const messages =
            await messageModel.find({

                $or: [

                    {
                        sender,
                        receiver
                    },

                    {
                        sender: receiver,
                        receiver: sender
                    }

                ]

            }).sort({
                createdAt: 1
            });


        return res.status(200).json({

            messages

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// GET INBOX
// ===============================

const getInbox = async (req, res) => {

    try {

        const myId = req.user.id;


        const messages =
            await messageModel.find({

                $or: [

                    {
                        sender: myId
                    },

                    {
                        receiver: myId
                    }

                ]

            }).sort({
                createdAt: -1
            });


        const users = {};


        for (let msg of messages) {

            const otherUser =
                String(msg.sender) === myId

                    ? String(msg.receiver)

                    : String(msg.sender);


            if (!users[otherUser]) {

                const user =
                    await User.findById(otherUser);


                users[otherUser] = {

                    user,

                    lastMessage:
                        msg.message,

                    time:
                        msg.createdAt

                };

            }

        }


        res.json(
            Object.values(users)
        );

    } catch (err) {

        console.log(err);

        res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// DELETE MESSAGE
// ===============================

const deleteMessage = async (req, res) => {

    try {

        const userId = req.user.id;

        const messageId =
            req.params.messageId;

        const { deleteType } =
            req.body;


        const message =
            await messageModel.findById(
                messageId
            );


        if (!message) {

            return res.status(404).json({

                message: "Message not found"

            });

        }


        // ===============================
        // DELETE FOR EVERYONE
        // ===============================

        if (deleteType === "everyone") {


            if (
                String(message.sender) !==
                String(userId)
            ) {

                return res.status(403).json({

                    message:
                        "Only sender can delete message for everyone"

                });

            }


            message.deletedForEveryone = true;

            message.message = "";
            message.image = "";
            message.video = "";
            message.file = "";


            await message.save();


            return res.status(200).json({

                message:
                    "Message deleted for everyone",

                deletedMessage:
                    message

            });

        }


        // ===============================
        // DELETE FOR ME
        // ===============================

        if (deleteType === "me") {


            const alreadyDeleted =
                message.deletedFor.some(

                    id =>
                        String(id) ===
                        String(userId)

                );


            if (!alreadyDeleted) {

                message.deletedFor.push(
                    userId
                );

            }


            await message.save();


            return res.status(200).json({

                message:
                    "Message deleted for you",

                deletedMessage:
                    message

            });

        }


        return res.status(400).json({

            message:
                "Invalid delete type"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message: err.message

        });

    }

};


// ===============================
// EXPORT
// ===============================

module.exports = {

    sendMessage,

    getMessages,

    getInbox,

    deleteMessage,

    markMessagesAsDelivered,

    markMessagesAsSeen

};