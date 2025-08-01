const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middleware/auth");
const Post = require("../models/post");
const Comment = require("../models/comment");
const Like = require("../models/like");

const postRouter = express.Router();

// POST: create a post
postRouter.post("/post/create", userAuth, async (req, res) => {
  try {
    const { message, imageUrl } = req.body;
    const user = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required." });
    }

    const post = new Post({
      imageUrl,
      fromUserId: user._id,
      message,
      likes: [],
      comments: [],
    });

    const savedPost = await post.save();
    return res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Failed to create post." });
  }
});

// POST: add a comment
postRouter.post("/post/comment", userAuth, async (req, res) => {
  try {
    const { postId, text, parentCommentId } = req.body;
    const user = req.user;

    if (!postId || !text || text.trim() === "") {
      return res.status(400).json({ error: "postId and text are required." });
    }

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Valid postId is required" });
    }

    // Optional: Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found." });

    // Optional: Check if parent comment exists (for replies)
    if (parentCommentId) {
      const parent = await Comment.findById(parentCommentId);
      if (!parent)
        return res.status(404).json({ error: "Parent comment not found." });
    }

    const comment = new Comment({
      postId,
      userId: user._id,
      text,
      parentCommentId: parentCommentId || null,
    });

    const savedComment = await comment.save();
    const populatedComment = await savedComment.populate(
      "userId",
      "firstName lastName age skills about gender photoUrl isPremium"
    );

    // Optional: Add comment reference to Post model
    post.comments.push(savedComment._id);
    await post.save();

    return res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// POST: Add a like
postRouter.post("/post/like", userAuth, async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.user._id;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Valid postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const existingLike = await Like.findOne({ postId, likerId: userId });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      post.likes = post.likes.filter(
        (id) => id.toString() !== existingLike._id.toString()
      );
      await post.save();
      return res.status(200).json({ message: "Post unliked" });
    } else {
      // Like
      const newLike = new Like({ postId, likerId: userId });
      const savedLike = await newLike.save();
      const populatedLike = await savedLike.populate(
        "likerId",
        "firstName lastName age skills about gender photoUrl isPremium"
      );

      post.likes.push(newLike._id);
      await post.save();

      return res.status(201).json({ message: "Post liked", populatedLike });
    }
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET: fetch post
postRouter.get("/post/fetch", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("fromUserId", "firstName lastName photoUrl isPremium")
      .populate({
        path: "likes",
        populate: {
          path: "likerId",
          select: "firstName lastName photoUrl isPremium",
        },
      })
      .populate({
        path: "comments",
        populate: {
          path: "userId",
          select: "firstName lastName photoUrl isPremium",
        },
      })
      .sort({ createdAt: -1 });

    res.json({ message: "Fetched posts successfully", data: posts });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// GET: fetch parent comments
postRouter.get("/post/fetchParentComment/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({
      parentCommentId: null,
      postId: postId,
    })
      .populate("userId", "firstName lastName photoUrl isPremium")
      .sort({ createdAt: -1 });

    res.json({ message: "Fetched posts successfully", data: comments });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// GET: child comments of a parent
postRouter.get("/post/fetchChildComment/:parentCommentId", async (req, res) => {
  try {
    const commentId = req.params.parentCommentId;
    const comments = await Comment.find({
      parentCommentId: commentId,
    })
      .populate("userId", "firstName lastName photoUrl isPremium")
      .sort({ createdAt: -1 });

    res.json({ message: "Fetched posts successfully", data: comments });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// GET: Fetch likes
postRouter.get("/post/getLike/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const likes = await Like.find({ postId }).populate(
      "likerId",
      "firstName lastName photoUrl isPremium"
    );
    res.json({ message: "Liker fetched succesfully", data: likes });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = postRouter;
