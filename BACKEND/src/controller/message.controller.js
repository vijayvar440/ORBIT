
const messageModel = require("../model/message.model");

console.log("Message Model =>", messageModel);
console.log("Type =>", typeof messageModel);
console.log("Find =>", messageModel.find);



const sendMessage = async (req, res) => {

    try {

        const sender = req.user.id;
        const receiver = req.params.userId;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                message: "Message is required"
            });
        }

        const newMessage = await messageModel.create({
            sender,
            receiver,
            message
        });

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
const getMessages = async (req, res) => {

    try {

        const sender = req.user.id;
        const receiver = req.params.userId;

        const messages = await messageModel.find({

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

        }).sort({ createdAt: 1 });

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
module.exports = {
    sendMessage,
    getMessages
};