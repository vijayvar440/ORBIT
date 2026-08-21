const postModel = require("../model/post.model");
const userModel = require("../model/user.model");
const notificationModel = require("../model/notification.model");
const { uploadToCloudinary } = require("../middlewares/upload.middlewares");

async function creatPost(req, res) {
    try {
        const { title, description, mediaType } = req.body;
        const userId = req.user.id;

        let media = "";

        // ✅ Upload file buffer to Cloudinary
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            );
            media = cloudinaryResult.secure_url;
        }

        const post = await postModel.create({
            title,
            description,
            media,
            mediaType,
            uploadedBy: userId
        });

        await userModel.findByIdAndUpdate(userId, {
            hasCreatedFirstPost: true
        });

        return res.status(201).json({
            message: "Post Created Successfully",
            post
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function getPost(req, res) {
    try {
        const userId = req.user.id;

        const posts = await postModel.find({
            uploadedBy: userId
        });

        return res.status(200).json({
            message: "My Posts Fetched Successfully",
            totalPosts: posts.length,
            posts
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

async function getAllPost(req, res) {
    try {
        const loggedUserId = req.user.id;

        const loggedUser = await userModel.findById(loggedUserId);

        if (!loggedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const followingIds = loggedUser.following.map(
            id => id.toString()
        );

        followingIds.push(loggedUserId.toString());

        const posts = await postModel
            .find()
            .populate(
                "uploadedBy",
                "username profileImage isPrivate followers"
            )
            .sort({ createdAt: -1 });

        const visiblePosts = posts.filter(post => {
            const owner = post.uploadedBy;

            if (!owner) {
                return false;
            }

            const ownerId = owner._id.toString();

            if (ownerId === loggedUserId.toString()) {
                return true;
            }

            if (followingIds.includes(ownerId)) {
                if (!owner.isPrivate) {
                    return true;
                }

                const isFollower = owner.followers?.some(
                    followerId =>
                        followerId.toString() ===
                        loggedUserId.toString()
                );

                return isFollower;
            }

            return false;
        });

        return res.status(200).json({
            message: "Posts fetched successfully",
            totalPosts: visiblePosts.length,
            posts: visiblePosts,
            following: loggedUser.following,
            loggedUserId,
            hasFollowedFirstUser: loggedUser.hasFollowedFirstUser,
            hasCreatedFirstPost: loggedUser.hasCreatedFirstPost
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function likePost(req, res) {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const alreadyLiked = post.likes.includes(userId);

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                (id) => id.toString() !== userId
            );

            await post.save();

            return res.status(200).json({
                message: "Post Unliked",
                likes: post.likes.length
            });

        } else {
            post.likes.push(userId);

            await post.save();

            return res.status(200).json({
                message: "Post Liked",
                likes: post.likes.length
            });
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function deletPost(req, res) {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post Not Found"
            });
        }

        if (post.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                message: "You can delete only your own post"
            });
        }

        await postModel.findByIdAndDelete(postId);

        return res.status(200).json({
            message: "Post Deleted Successfully"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function addComment(req, res) {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { text } = req.body;

        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Post Not Found"
            });
        }

        post.comments.push({
            user: userId,
            text: text
        });

        await post.save();

        if (String(post.uploadedBy) !== String(userId)) {
            await notificationModel.create({
                receiver: post.uploadedBy,
                sender: userId,
                type: "comment",
                message: "commented on your post",
                post: postId
            });
        }

        return res.status(200).json({
            message: "Comment Added Successfully",
            comments: post.comments
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function updatePost(req, res) {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const { title, description } = req.body;

        const post = await postModel.findById(postId);

        if (!post) {
            return res.status(400).json({
                message: "post not found"
            });
        }

        if (post.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                message: "You can update only your own post"
            });
        }

        post.title = title || post.title;
        post.description = description || post.description;

        // ✅ Upload updated file buffer to Cloudinary
        if (req.file) {
            const cloudinaryResult = await uploadToCloudinary(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            );
            post.media = cloudinaryResult.secure_url;
        }

        await post.save();

        return res.status(200).json({
            message: "Post update successful",
            post
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

async function getSinglePost(req, res) {
    try {
        const postId = req.params.postId;
        const loggedUserId = req.user?.id;

        const post = await postModel
            .findById(postId)
            .populate("uploadedBy", "username profileImage isPrivate followers")
            .populate("comments.user", "username profileImage");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const owner = post.uploadedBy;

        const isOwner =
            loggedUserId &&
            owner._id.toString() === loggedUserId.toString();

        const isFollower =
            loggedUserId &&
            owner.followers?.some(
                id => id.toString() === loggedUserId.toString()
            );

        if (owner.isPrivate && !isOwner && !isFollower) {
            return res.status(403).json({
                message: "This account is private"
            });
        }

        return res.status(200).json({
            message: "Post fetched successfully",
            post
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: err.message
        });
    }
}

module.exports = {
    creatPost,
    getPost,
    getAllPost,
    likePost,
    deletPost,
    addComment,
    updatePost,
    getSinglePost
};