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
    hasStarted: {
    type: Boolean,
    default: false
},

    password: {
        type: String,
        required: true
    },

    // USER ROLE
    role: {
        type: String,
        enum: ["user", "author"],
        default: "user"
    },

    profileImage: {
        type: String,
        default: ""
    },

    bio: {
        type: String,
        default: ""
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
    },
   hasFollowedFirstUser: {
    type: Boolean,
    default: false
},

hasCreatedFirstPost: {
    type: Boolean,
    default: false
},
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);