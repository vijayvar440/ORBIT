const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },


    media: {
        type: String,
        default: ""
    },

    // ✅ Fix: mediaType ko bhi optional banaya
    mediaType: {
        type: String,
        enum: ["image", "video", "audio", "none"],
        default: "none"
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, 
{
    timestamps: true
});

module.exports = mongoose.model("post", postSchema);