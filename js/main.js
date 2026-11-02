
const API_URL = "http://localhost:5000/api";

// Register a new user
async function registerUser(name, email, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
    }

    return data;
}

// Login user
async function loginUser(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Login failed.");
    }

    // Demo only: localStorage is not safe for
    // sensitive authentication tokens in production.
    localStorage.setItem("token", data.token);

    return data;
}

// Create a blog after login
async function createBlog(title, content, category) {
    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("Please log in first.");
    }

    const response = await fetch(`${API_URL}/blogs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Could not create blog.");
    }

    return data;
}

// Fetch all blogs
async function getAllBlogs() {
    const response = await fetch(`${API_URL}/blogs`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Could not load blogs.");
    }

    return data.blogs;
}
