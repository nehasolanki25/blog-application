const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Temporary storage for practice.
// Data disappears when the server restarts.
const users = [];
const blogs = [];

let nextUserId = 1;
let nextBlogId = 1;

// Check that the server is running.
app.get("/", (req, res) => {
    res.json({
        message: "Blog Application API is running!"
    });
});

// Middleware: verify login token.
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token."
        });
    }
}

// 1. USER REGISTRATION
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = users.find(
            user => user.email === normalizedEmail
        );

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: nextUserId++,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        };

        users.push(newUser);

        res.status(201).json({
            message: "Registration successful!",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Registration failed."
        });
    }
});

// 2. USER LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = users.find(
            user => user.email === normalizedEmail
        );

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed."
        });
    }
});

// 3. CREATE BLOG (login required)
app.post("/api/blogs", authenticateToken, (req, res) => {
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

    const user = users.find(
        user => user.id === req.user.id
    );

    if (!user) {
        return res.status(401).json({
            message: "User not found. Please log in again."
        });
    }

    const newBlog = {
        id: nextBlogId++,
        title: title.trim(),
        content: content.trim(),
        category: typeof category === "string"
            ? category.trim()
            : "General",
        author: user.name,
        userId: user.id,
        createdAt: new Date().toISOString()
    };

    blogs.push(newBlog);

    res.status(201).json({
        message: "Blog created successfully!",
        blog: newBlog
    });
});

// 4. GET ALL BLOGS
app.get("/api/blogs", (req, res) => {
    res.json({
        blogs: blogs
    });
});

// Start server.
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from the .env file.");
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
