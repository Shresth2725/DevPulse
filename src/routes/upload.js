const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinaryConfig");

const uploadRouter = express.Router();

// Ensure temp folder exists
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Multer storage + size limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST: Upload image to Cloudinary
uploadRouter.post(
  "/upload",
  (req, res, next) => {
    upload.single("image")(req, res, function (err) {
      if (err?.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large. Max 5MB allowed." });
      }
      if (err) return res.status(500).json({ message: "Unexpected error" });
      next();
    });
  },
  async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "assets",
      });
      fs.unlinkSync(req.file.path); // delete temp file
      res.json({ url: result.secure_url });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Cloudinary upload failed" });
    }
  }
);

// Optional: GET recent images from Cloudinary
uploadRouter.get("/images", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:assets")
      .sort_by("created_at", "desc")
      .max_results(30)
      .execute();

    const urls = result.resources.map((file) => file.secure_url);
    res.json(urls);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch images" });
  }
});

module.exports = uploadRouter;
