const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "follow",
                "message"
            ],
            required: true
        },

        message: {
            type: String,
            required: true
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        },
        type: {
    type: String,
   type: {
    type: String,
    enum: [
        "like",
        "comment",
        "follow",
        "message",
        "broadcast"
    ],
    required: true
},
    },
    
        timestamps: true
    }
);

module.exports = mongoose.model(
    "notification",
    notificationSchema
);