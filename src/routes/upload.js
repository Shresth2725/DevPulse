const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinaryConfig");

const uploadRouter = express.Router();

// Multer setup: store file temporarily in /temp folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "temp/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// POST: Upload to Cloudinary
uploadRouter.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "assets", // optional: your Cloudinary folder name
    });

    fs.unlinkSync(req.file.path); // remove file from server

    res.json({ url: result.secure_url }); // send Cloudinary URL
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// GET: Fetch images from Cloudinary folder
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
