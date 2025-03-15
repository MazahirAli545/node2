import multer from "multer";
import path from "path";
import fs from "fs";

// Determine upload directory
const uploadDir =
  process.env.NODE_ENV === "production"
    ? "/tmp/uploads"
    : path.join(process.cwd(), "src", "uploads");

// Debug logs
console.log("Current working directory:", process.cwd());
console.log("Upload directory path:", uploadDir);

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Uploads directory created successfully.");
  } catch (error) {
    console.error("Error creating uploads directory:", error);
  }
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

// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Determine the upload directory dynamically
// const uploadDir =
//   process.env.NODE_ENV === "production"
//     ? "/tmp/uploads"
//     : path.join(process.cwd(), "src", "uploads");

// // Debugging logs
// console.log("Current working directory:", process.cwd());
// console.log("Upload directory path:", uploadDir);

// // Ensure the uploads directory exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
//   console.log("Uploads directory created successfully.");
// }

// // Configure storage for multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// // File filter function (fixing typo)
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only JPEG, PNG, JPG formats are allowed"), false);
//   }
// };

// // Final multer configuration
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
// });

// export default upload;
