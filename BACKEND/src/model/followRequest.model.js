const mongoose = require("mongoose");

const followRequestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "followRequest",
    followRequestSchema
);