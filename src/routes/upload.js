const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinaryConfig");

const uploadRouter = express.Router();

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Upload route
uploadRouter.post(
  "/upload",
  (req, res, next) => {
    upload.single("image")(req, res, function (err) {
      if (err?.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "File too large. Max 5MB allowed." });
      }
      if (err) {
        console.error("Multer error:", err);
        return res.status(500).json({ message: "Upload error" });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file received." });
      }

      console.log("File from phone:", req.file);

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "assets",
      });

      fs.unlinkSync(req.file.path);
      res.json({ url: result.secure_url });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// Optional: fetch all images
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
    console.error("Image fetch failed:", err);
    res.status(500).json({ message: "Fetch failed" });
  }
});

module.exports = uploadRouter;
