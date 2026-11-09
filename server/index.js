
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Import environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Blog Application API is running!"
    });
});

// Authentication Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Blog Routes
app.use("/api/blogs", require("./routes/blogRoutes"));

// Server Port
const PORT = process.env.PORT || 5000;

// Connect MongoDB and Start Server
async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env file");
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        // Start Express Server
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

// Start Application
startServer();
