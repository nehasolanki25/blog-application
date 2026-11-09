const express = require("express");
const Blog = require("../models/Blog");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE BLOG
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (
            typeof title !== "string" ||
            typeof content !== "string" ||
            !title.trim() ||
            !content.trim()
        ) {
            return res.status(400).json({
                message: "Title and content are required."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found. Please log in again."
            });
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            category: typeof category === "string" && category.trim()
                ? category.trim()
                : "General",
            author: user._id
        });

        return res.status(201).json({
            message: "Blog created successfully!",
            blog
        });

    } catch (error) {
        console.error("Create blog error:", error);

        return res.status(500).json({
            message: "Could not create blog."
        });
    }
});

// GET ALL BLOGS
router.get("/", async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            blogs
        });

    } catch (error) {
        console.error("Get blogs error:", error);

        return res.status(500).json({
            message: "Could not fetch blogs."
        });
    }
});

// GET SINGLE BLOG
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        const blog = await Blog.findById(id)
            .populate("author", "name");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        return res.status(200).json({
            blog
        });

    } catch (error) {
        console.error("Get single blog error:", error);

        return res.status(500).json({
            message: "Could not fetch blog details."
        });
    }
});

module.exports = router;