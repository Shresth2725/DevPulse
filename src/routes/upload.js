const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinaryConfig");

const uploadRouter = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "assets",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// POST: Upload image
uploadRouter.post("/upload", upload.single("image"), (req, res) => {
  res.json({ url: req.file.path });
});

// GET: Get all images in the 'assets' folder
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
    console.error("Cloudinary fetch error:", err);
    res.status(500).json({ message: "Failed to fetch images" });
  }
});

module.exports = uploadRouter;
