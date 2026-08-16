const userModel = require("../model/user.model");
const postModel = require("../model/post.model");
const notificationModel = require("../model/notification.model");

const followRequestModel = require("../model/followRequest.model");

async function getProfile(req, res) {
    try {
        const userId = req.user.id;

        const user = await userModel
            .findById(userId)
            .select("-password");

        const posts = await postModel.find({
            uploadedBy: userId
        });

        return res.status(200).json({
            message: "Profile fetched successfully",
            user,
            posts
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}



async function updateProfile(req, res) {
    try {

        const { username, bio } = req.body;
        const userId = req.user.id;

        // Update object
        const updateData = {
            username,
            bio
        };

        // Agar image upload hui hai
        if (req.file) {
            updateData.profileImage = req.file.path;
        }

        // User update
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true
            }
        ).select("-password");

        return res.status(200).json({
            message: "Profile Updated Successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}
async function searchUser(req, res) {
    try {

        const keyword = req.params.keyword;

        const users = await userModel
            .find({
                username: {
                    $regex: keyword,
                    $options: "i"
                }
            })
            .select("username profileImage bio");

        return res.status(200).json({
            message: "Users fetched successfully",
            users
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}
async function getUserProfile(req, res) {
    try {

        const userId = req.params.id;
        const loggedUserId = req.user?.id;

        const user = await userModel
            .findById(userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        
        const isOwner =
            loggedUserId &&
            loggedUserId.toString() === userId.toString();

        
        const isFollower =
            loggedUserId &&
            user.followers.some(
                id => id.toString() === loggedUserId.toString()
            );

        

        if (user.isPrivate && !isOwner && !isFollower) {

            return res.status(200).json({
                user,
                posts: [],
                isPrivate: true,
                canViewPosts: false,
                message: "This account is private"
            });
        }

       

        const posts = await postModel.find({
            uploadedBy: userId
        });

        return res.status(200).json({
            user,
            posts,
            isPrivate: user.isPrivate,
            canViewPosts: true
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}

async function followUser(req, res) {
    try {

        const loggedUserId = req.user.id;
        const targetUserId = req.params.userId;

        if (loggedUserId === targetUserId) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const loggedUser = await userModel.findById(loggedUserId);
        const targetUser = await userModel.findById(targetUserId);

        if (!loggedUser || !targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

    
        const alreadyFollowing = loggedUser.following.some(
            id => id.toString() === targetUserId
        );

        if (alreadyFollowing) {

            
            loggedUser.following = loggedUser.following.filter(
                id => id.toString() !== targetUserId
            );

            targetUser.followers = targetUser.followers.filter(
                id => id.toString() !== loggedUserId
            );

            await loggedUser.save();
            await targetUser.save();

            return res.status(200).json({
                message: "User Unfollowed Successfully"
            });

       } else {

    loggedUser.following.push(targetUserId);
    targetUser.followers.push(loggedUserId);

    await loggedUser.save();
    await targetUser.save();

    // 🔔 Notification
    await notificationModel.create({
        receiver: targetUserId,
        sender: loggedUserId,
        type: "follow",
        message: "started following you"
    });

    return res.status(200).json({
        message: "User Followed Successfully"
    });
}

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });
    }
}
async function getFollowers(req, res) {
    try {

        const user = await userModel.findById(req.params.userId)
            .populate("followers", "username profileImage");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            followers: user.followers
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: err.message
        });
    }
}

async function getFollowing(req, res) {
    try {

        const user = await userModel.findById(req.params.userId)
            .populate("following", "username profileImage");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            following: user.following
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            message: err.message
        });
    }
}
async function getDiscoverUsers(req, res) {
    try {
        const loggedUserId = req.user.id;

        const loggedUser = await userModel.findById(loggedUserId);

        if (!loggedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const users = await userModel
            .find({
                _id: {
                    $ne: loggedUserId
                }
            })
            .select("username profileImage bio followers following isPrivate");

        return res.status(200).json({
            message: "Discover users fetched successfully",
            users
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });
    }
}
async function updatePrivacy(req, res) {
    try {

        const userId = req.user.id;
        const { isPrivate } = req.body;

        if (typeof isPrivate !== "boolean") {
            return res.status(400).json({
                message: "isPrivate must be true or false"
            });
        }

        const updatedUser = await userModel
            .findByIdAndUpdate(
                userId,
                { isPrivate },
                { new: true }
            )
            .select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: isPrivate
                ? "Account is now private"
                : "Account is now public",
            user: updatedUser
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });
    }
}
async function changePassword(req, res) {
    try {

        const userId = req.user.id;

        const { oldPassword, newPassword } = req.body;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Old password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        await user.save();

        return res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}
// ===============================
// ACCEPT FOLLOW REQUEST
// ===============================

async function acceptFollowRequest(req, res) {

    try {

        const receiverId = req.user.id;
        const requestId = req.params.requestId;

        const request =
            await followRequestModel.findById(requestId);

        if (!request) {
            return res.status(404).json({
                message: "Follow request not found"
            });
        }


        if (
            request.receiver.toString() !==
            receiverId.toString()
        ) {
            return res.status(403).json({
                message: "You cannot accept this request"
            });
        }


        if (request.status !== "pending") {
            return res.status(400).json({
                message: "Request already processed"
            });
        }


        const sender = await userModel.findById(
            request.sender
        );

        const receiver = await userModel.findById(
            request.receiver
        );


        if (!sender || !receiver) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // Add follower/following
        if (
            !receiver.followers.some(
                id =>
                    id.toString() ===
                    sender._id.toString()
            )
        ) {
            receiver.followers.push(sender._id);
        }


        if (
            !sender.following.some(
                id =>
                    id.toString() ===
                    receiver._id.toString()
            )
        ) {
            sender.following.push(receiver._id);
        }


        request.status = "accepted";


        await sender.save();
        await receiver.save();
        await request.save();


        return res.status(200).json({
            message: "Follow request accepted",
            status: "following"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}
// ===============================
// SEND FOLLOW REQUEST
// ===============================

async function sendFollowRequest(req, res) {

    try {

        const senderId = req.user.id;
        const receiverId = req.params.userId;

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const sender = await userModel.findById(senderId);
        const receiver = await userModel.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({
                message: "User not found"
            });
        }


        // Already following?
        const alreadyFollowing = sender.following.some(
            id => id.toString() === receiverId.toString()
        );

        if (alreadyFollowing) {
            return res.status(400).json({
                message: "Already following this user"
            });
        }


        // Check existing request
        const existingRequest =
            await followRequestModel.findOne({
                sender: senderId,
                receiver: receiverId,
                status: "pending"
            });

        if (existingRequest) {
            return res.status(400).json({
                message: "Follow request already sent"
            });
        }


        // PUBLIC ACCOUNT
        if (!receiver.isPrivate) {

            sender.following.push(receiverId);
            receiver.followers.push(senderId);

            await sender.save();
            await receiver.save();

            return res.status(200).json({
                message: "User followed successfully",
                status: "following"
            });
        }


        // PRIVATE ACCOUNT
        const request = await followRequestModel.create({
            sender: senderId,
            receiver: receiverId
        });


        return res.status(201).json({
            message: "Follow request sent",
            status: "requested",
            request
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}
// ===============================
// REJECT FOLLOW REQUEST
// ===============================

async function rejectFollowRequest(req, res) {

    try {

        const receiverId = req.user.id;
        const requestId = req.params.requestId;

        const request =
            await followRequestModel.findById(requestId);

        if (!request) {
            return res.status(404).json({
                message: "Follow request not found"
            });
        }


        if (
            request.receiver.toString() !==
            receiverId.toString()
        ) {
            return res.status(403).json({
                message: "You cannot reject this request"
            });
        }


        request.status = "rejected";

        await request.save();


        return res.status(200).json({
            message: "Follow request rejected",
            status: "rejected"
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: err.message
        });

    }
}


module.exports = {
    getProfile,
    updateProfile,
    searchUser,
    getUserProfile,
    followUser,
    getFollowers,
    getFollowing,
    getDiscoverUsers,
    updatePrivacy,
    changePassword,

    sendFollowRequest,
    acceptFollowRequest,
    rejectFollowRequest
};