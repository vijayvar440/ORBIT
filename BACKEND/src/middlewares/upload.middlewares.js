const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,

    params: async (req, file) => {

        let resourceType = "image";

        if (file.mimetype.startsWith("video")) {
            resourceType = "video";
        }

        if (file.mimetype.startsWith("audio")) {
            resourceType = "video";
        }

        const fileName = path.parse(file.originalname).name;

        return {
            folder: "social-snap",
            resource_type: resourceType,
            public_id: Date.now() + "-" + fileName
        };
    }
});

const upload = multer({ storage });

module.exports = upload;