const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage use karein (Render par crash nahi hoga)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Direct Cloudinary Upload Helper Function
const uploadToCloudinary = (fileBuffer, mimetype, originalname) => {
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