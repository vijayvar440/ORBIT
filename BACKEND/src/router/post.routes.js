const express = require("express");
const router = express.Router();

const postController = require("../controller/post.controller");
const authMiddleware = require("../middlewares/auth.Middlewares");
const upload = require("../middlewares/upload.middlewares");
const userContoller = require("../controller/user.controller");




router.post(
    "/createPost",
    authMiddleware,
    upload.single("media"),
    postController.creatPost
);


router.get(
    "/my-posts",
    authMiddleware,
    postController.getPost
);


router.get(
    "/all-posts",
    authMiddleware,
    postController.getAllPost
);


router.put(
    "/update/:id",
    authMiddleware,
    upload.single("media"),
    postController.updatePost
);


router.delete(
    "/delete/:id",
    authMiddleware,
    postController.deletPost
);




router.get(
    "/profile",
    authMiddleware,
    userContoller.getProfile
);


router.put(
    "/update-profile",
    authMiddleware,
    upload.single("profileImage"),
    userContoller.updateProfile
);


router.get(
    "/user/:id",
    userContoller.getUserProfile
);


router.get(
    "/search/:keyword",
    userContoller.searchUser
);



router.put(
    "/follow/:userId",
    authMiddleware,
    userContoller.followUser
);


router.get(
    "/followers/:userId",
    userContoller.getFollowers
);


router.get(
    "/following/:userId",
    userContoller.getFollowing
);




router.put(
    "/account/privacy",
    authMiddleware,
    userContoller.updatePrivacy
);



router.put(
    "/like/:id",
    authMiddleware,
    postController.likePost
);




router.post(
    "/comment/:id",
    authMiddleware,
    postController.addComment
);



router.put(
    "/change-password",
    authMiddleware,
    userContoller.changePassword
);


// Single Post — हमेशा सबसे last
router.get(
    "/:postId",
    postController.getSinglePost
);

module.exports = router;

