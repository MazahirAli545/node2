import multer from "multer";
import dotenv from "dotenv";
import pkg from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

const { v2: cloudinary } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "contact_forms", // Folder name in Cloudinary
    allowedFormats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = multer({ storage });

export { cloudinary, upload };
