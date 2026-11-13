const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5500",
    credentials: true
}));

app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.json({
        message: "BlogSpace API is running!"
    });
});

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

// Blog routes
app.use("/api/blogs", require("./routes/blogRoutes"));

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing.");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
