const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE BLOG
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "Title and content are required."
            });
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            category: category?.trim() || "General",
            author: req.user.id
        });

        res.status(201).json({
            message: "Blog created successfully!",
            blog
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not create blog."
        });
    }
});

// READ ALL BLOGS + SEARCH + CATEGORY FILTER
router.get("/", async (req, res) => {
    try {
        const { search, category } = req.query;

        const filter = {};

        if (search?.trim()) {
            const safeSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { content: { $regex: safeSearch, $options: "i" } }
            ];
        }

        if (category?.trim()) {
            filter.category = category.trim();
        }

        const blogs = await Blog.find(filter)
            .populate("author", "name")
            .sort({ createdAt: -1 });

        res.json({ blogs });
    } catch (error) {
        res.status(500).json({
            message: "Could not fetch blogs."
        });
    }
});

// READ SINGLE BLOG
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        const blog = await Blog.findById(req.params.id)
            .populate("author", "name");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json({ blog });
    } catch (error) {
        res.status(500).json({
            message: "Could not fetch blog details."
        });
    }
});

// UPDATE BLOG
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { title, content, category } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "Title and content are required."
            });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot edit another user's blog."
            });
        }

        blog.title = title.trim();
        blog.content = content.trim();
        blog.category = category?.trim() || "General";

        await blog.save();

        res.json({
            message: "Blog updated successfully!",
            blog
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not update blog."
        });
    }
});

// DELETE BLOG
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot delete another user's blog."
            });
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.json({
            message: "Blog deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Could not delete blog."
        });
    }
});

module.exports = router;
