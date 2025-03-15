// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination: (req, res, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const FileFilter = (req, res, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only JPEG, PNG, JPG FORMATS ARE ALLOWED"), false);
//   }
// };

// const upload = multer({ storage, FileFilter });

// export default upload;

import multer from "multer";
import path from "path";
import fs from "fs";
// import uploads from "../uploads"

// Ensure the uploads directory exists
const uploadDir = "src/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, JPG formats are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
