const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinaryConfig");

const uploadRouter = express.Router();

// Temporary storage in server using diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "temp/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// POST: Upload image to Cloudinary
uploadRouter.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "assets",
    });

    fs.unlinkSync(req.file.path); // clean up temp file

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// GET: Fetch images from 'assets' folder in Cloudinary
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
