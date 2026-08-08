const userModel = require("../model/user.model");
const postModel = require("../model/post.model");

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


module.exports = {
    getProfile,
    updateProfile,
    searchUser,
    getUserProfile,
    followUser,
    getFollowers,
    getFollowing,
    updatePrivacy,
    changePassword
};
