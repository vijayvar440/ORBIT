const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    profileImage: {
        type: String,
        default: ""
    },

    bio: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        default: "user"
    },

    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    lastSeen: {
    type: Date,
    default: Date.now
     },
     isPrivate: {
         type: Boolean,
         default: false
     }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);