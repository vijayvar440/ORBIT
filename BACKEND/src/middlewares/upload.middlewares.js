require("dotenv").config(); // 👈 Essential for loading .env variables
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");

// Memory storage setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function with dynamic config check
const uploadToCloudinary = (fileBuffer, mimetype, originalname) => {
    // Dynamic config call ensures process.env is read at runtime
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
        let resourceType = "image";
        if (mimetype.startsWith("video") || mimetype.startsWith("audio")) {
            resourceType = "video";
        }

        const fileName = path.parse(originalname).name;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "social-snap",
                resource_type: resourceType,
                public_id: Date.now() + "-" + fileName
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

module.exports = { upload, uploadToCloudinary, cloudinary };