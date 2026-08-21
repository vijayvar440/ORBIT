require("dotenv").config();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (fileBuffer, mimetype, originalname) => {
    // 🔍 Debugging log (Render ke logs mein dikhega)
    console.log("Cloud Name Check:", process.env.CLOUDINARY_CLOUD_NAME);

    // Hard fallback check
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName) {
        return Promise.reject(new Error("CLOUDINARY_CLOUD_NAME is missing in environment variables!"));
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
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