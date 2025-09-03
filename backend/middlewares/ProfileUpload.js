const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Upload folder in project root
const uploadDir = path.join(__dirname, "..", "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed image types
const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userFile = path.join(uploadDir, `${req.user.id}`);

    // if file exists, remove it before saving new one
    if (fs.existsSync(userFile)) {
      fs.unlinkSync(userFile);
    }

    cb(null, `${req.user.id}`); // save without extension
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPG, PNG, WEBP allowed."), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

module.exports = upload.single("profileImage");
