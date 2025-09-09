const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

// Allowed types
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedVoiceTypes = ["audio/mpeg", "audio/ogg", "audio/webm"];

// Max limits
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4 MB per image
const MAX_TOTAL_IMAGE_SIZE = 40 * 1024 * 1024; // 40 MB total
const MAX_AUDIO_DURATION = 15 * 60; // 15 minutes in seconds

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { conversationId, type } = req.body;
    if (!conversationId) return cb(new Error("conversationId is required"), null);

    const basePath = path.join(__dirname, "..", "uploads", "chat", conversationId);
    const subFolder = type === "image" ? "images" : "voices";
    const finalPath = path.join(basePath, subFolder);

    fs.mkdirSync(finalPath, { recursive: true });
    cb(null, finalPath);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const { type } = req.body;

  if (type === "image" && !allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid image type. Allowed: JPG, PNG, WEBP"), false);
  }

  if (type === "voice" && !allowedVoiceTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid voice type. Allowed: MP3, OGG, WEBM"), false);
  }

  cb(null, true);
};

// Middleware to check total image size
const checkTotalImageSize = (req, res, next) => {
  if (req.body.type !== "image") return next();

  const files = req.files;
  let totalSize = 0;
  for (const file of files) {
    totalSize += file.size;
  }

  if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
    // Delete uploaded files
    files.forEach(f => fs.unlinkSync(f.path));
    return res.status(400).json({ error: "Total image size exceeds 40 MB" });
  }

  next();
};

// Middleware to check audio duration
const checkAudioDuration = (req, res, next) => {
  if (req.body.type !== "voice") return next();

  const file = req.file;
  if (!file) return next();

  ffmpeg.ffprobe(file.path, (err, metadata) => {
    if (err) return next(err);

    const duration = metadata.format.duration;
    if (duration > MAX_AUDIO_DURATION) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: "Audio exceeds maximum duration of 15 minutes" });
    }

    next();
  });
};

// Multer upload setup
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }, // 4 MB per file
});

// Export as middleware
module.exports = {
  uploadMultipleImages: (req, res, next) => {
    const uploader = upload.array("files", 10); // max 10 images per request
    uploader(req, res, err => {
      if (err) return res.status(400).json({ error: err.message });
      checkTotalImageSize(req, res, next);
    });
  },

  uploadSingleAudio: (req, res, next) => {
    const uploader = upload.single("file");
    uploader(req, res, err => {
      if (err) return res.status(400).json({ error: err.message });
      checkAudioDuration(req, res, next);
    });
  },
};

