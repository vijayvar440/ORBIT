const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },

    message: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""
    },

    video: {
        type: String,
        default: ""
    },

    file: {
        type: String,
        default: ""
    },
    deletedForEveryone: {
    type: Boolean,
    default: false
},

deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
}],

status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
}

},
{
    timestamps: true
});

module.exports = mongoose.model("message", messageSchema);