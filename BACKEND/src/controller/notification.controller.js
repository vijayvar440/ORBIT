const notificationModel = require("../model/notification.model");


// ===============================
// CREATE NOTIFICATION
// ===============================

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


// ===============================
// GET MY NOTIFICATIONS
// ===============================

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


// ===============================
// MARK ONE AS READ
// ===============================

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


// ===============================
// MARK ALL AS READ
// ===============================

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


// ===============================
// DELETE NOTIFICATION
// ===============================

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


module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};