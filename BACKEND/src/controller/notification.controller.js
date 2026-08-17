const notificationModel = require("../model/notification.model");
const User = require("../model/user.model");


// CREATE NORMAL NOTIFICATION
async function createNotification(req, res) {

    try {

        const {
            receiver,
            sender,
            type,
            message,
            post
        } = req.body;

        const notification = await notificationModel.create({
            receiver,
            sender,
            type,
            message,
            post: post || null
        });

        return res.status(201).json({
            message: "Notification Created",
            notification
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


// BROADCAST NOTIFICATION
async function broadcastNotification(req, res) {

    try {

        // Only author can broadcast
        if (req.user.role !== "author") {

            return res.status(403).json({
                message: "Only author can send broadcast notifications"
            });

        }

        const { title, message } = req.body;

        if (!title || !title.trim()) {

            return res.status(400).json({
                message: "Title is required"
            });

        }

        if (!message || !message.trim()) {

            return res.status(400).json({
                message: "Message is required"
            });

        }

        const sender = req.user.id;

        // Get all users except author
        const users = await User.find(
            {
                _id: { $ne: sender }
            },
            "_id"
        );

        if (users.length === 0) {

            return res.status(400).json({
                message: "No users found"
            });

        }

        const notifications = users.map((user) => ({

            receiver: user._id,

            sender: sender,

            type: "broadcast",

            message: `${title.trim()}: ${message.trim()}`,

            post: null,

            isRead: false

        }));

        await notificationModel.insertMany(
            notifications
        );

        return res.status(201).json({

            message: "Broadcast notification sent successfully",

            totalUsers: users.length

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


// GET NOTIFICATIONS
async function getNotifications(req, res) {

    try {

        const userId = req.user.id;

        const notifications = await notificationModel
            .find({
                receiver: userId
            })
            .populate(
                "sender",
                "username profileImage"
            )
            .populate(
                "post",
                "title media"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            notifications
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


// MARK AS READ
async function markAsRead(req, res) {

    try {

        const notificationId = req.params.id;

        const notification =
            await notificationModel.findByIdAndUpdate(
                notificationId,
                {
                    isRead: true
                },
                {
                    new: true
                }
            );

        if (!notification) {

            return res.status(404).json({
                message: "Notification not found"
            });

        }

        return res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


// MARK ALL AS READ
async function markAllAsRead(req, res) {

    try {

        const userId = req.user.id;

        await notificationModel.updateMany(
            {
                receiver: userId,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


// DELETE NOTIFICATION
async function deleteNotification(req, res) {

    try {

        const notificationId = req.params.id;

        await notificationModel.findByIdAndDelete(
            notificationId
        );

        return res.status(200).json({
            message: "Notification deleted"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}
async function getUnreadCount(req, res) {

    try {

        const userId = req.user.id;

        const count = await notificationModel.countDocuments({
            receiver: userId,
            isRead: false
        });

        return res.status(200).json({
            count
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


module.exports = {
    createNotification,
    broadcastNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
};