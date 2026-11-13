const express = require("express");
const mongoose = require("mongoose");

const Blog = require("../models/Blog");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================
// 1. CREATE BLOG
// POST /api/blogs
// ============================================

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

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            category:
                typeof category === "string" && category.trim()
                    ? category.trim()
                    : "General",
            author: req.user.id
        });

        await blog.populate("author", "name email");

        res.status(201).json({
            message: "Blog created successfully!",
            blog
        });

    } catch (error) {
        console.error("Create blog error:", error);

        res.status(500).json({
            message: "Could not create blog."
        });
    }
});


// ============================================
// 2. GET ALL BLOGS
// GET /api/blogs
// Supports Search and Category Filter
// ============================================

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
                {
                    title: {
                        $regex: safeSearch,
                        $options: "i"
                    }
                },
                {
                    content: {
                        $regex: safeSearch,
                        $options: "i"
                    }
                }
            ];
        }

        if (category?.trim()) {
            filter.category = category.trim();
        }

        const blogs = await Blog.find(filter)
            .populate("author", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: blogs.length,
            blogs
        });

    } catch (error) {
        console.error("Get all blogs error:", error);

        res.status(500).json({
            message: "Could not fetch blogs."
        });
    }
});


// ============================================
// 3. GET LOGGED-IN USER'S BLOGS
// GET /api/blogs/mine
// ============================================

router.get("/mine", authenticateToken, async (req, res) => {
    try {
        const blogs = await Blog.find({
            author: req.user.id
        })
            .populate("author", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: blogs.length,
            blogs
        });

    } catch (error) {
        console.error("Get my blogs error:", error);

        res.status(500).json({
            message: "Could not fetch your blogs."
        });
    }
});


// ============================================
// 4. GET SINGLE BLOG
// GET /api/blogs/:id
// ============================================

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        const blog = await Blog.findById(id)
            .populate("author", "name email");

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.status(200).json({
            blog
        });

    } catch (error) {
        console.error("Get single blog error:", error);

        res.status(500).json({
            message: "Could not fetch blog details."
        });
    }
});


// ============================================
// 5. UPDATE BLOG
// PUT /api/blogs/:id
// Only blog owner can update
// ============================================

router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

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

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        // Check blog ownership
        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot edit another user's blog."
            });
        }

        blog.title = title.trim();
        blog.content = content.trim();

        blog.category =
            typeof category === "string" && category.trim()
                ? category.trim()
                : "General";

        await blog.save();

        await blog.populate("author", "name email");

        res.status(200).json({
            message: "Blog updated successfully!",
            blog
        });

    } catch (error) {
        console.error("Update blog error:", error);

        res.status(500).json({
            message: "Could not update blog."
        });
    }
});


// ============================================
// 6. DELETE BLOG
// DELETE /api/blogs/:id
// Only blog owner can delete
// ============================================

router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid blog ID."
            });
        }

        const blog = await Blog.findById(id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        // Check blog ownership
        if (blog.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You cannot delete another user's blog."
            });
        }

        await Blog.findByIdAndDelete(id);

        res.status(200).json({
            message: "Blog deleted successfully!"
        });

    } catch (error) {
        console.error("Delete blog error:", error);

        res.status(500).json({
            message: "Could not delete blog."
        });
    }
});


module.exports = router;
