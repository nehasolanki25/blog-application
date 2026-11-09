// API CONFIGURATION

const API_URL = "http://localhost:5000/api";

// COMMON API FUNCTION

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, options);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

// AUTHENTICATION HELPERS

function getToken() {
    return localStorage.getItem("token");
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("user"));
    } catch {
        return null;
    }
}

function saveUserSession(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}

function requireLogin() {
    if (!getToken()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// MESSAGE HELPER

function showMessage(elementId, message, type = "") {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.className = `form-message ${type}`;
}

// REGISTER USER

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const button = event.submitter;

    showMessage("registerMessage", "");

    if (password.length < 8) {
        showMessage(
            "registerMessage",
            "Password must be at least 8 characters.",
            "error"
        );
        return;
    }

    try {
        button.disabled = true;
        button.textContent = "Creating Account...";

        const data = await apiRequest("/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        showMessage(
            "registerMessage",
            data.message,
            "success"
        );

        event.target.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);

    } catch (error) {
        showMessage(
            "registerMessage",
            error.message,
            "error"
        );
    } finally {
        button.disabled = false;
        button.textContent = "Create Account";
    }
}

// LOGIN USER

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const button = event.submitter;

    showMessage("loginMessage", "");

    try {
        button.disabled = true;
        button.textContent = "Logging in...";

        const data = await apiRequest("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        saveUserSession(data);

        showMessage(
            "loginMessage",
            data.message,
            "success"
        );

        window.location.href = "dashboard.html";

    } catch (error) {
        showMessage(
            "loginMessage",
            error.message,
            "error"
        );
    } finally {
        button.disabled = false;
        button.textContent = "Login";
    }
}

// CREATE BLOG

async function handleCreateBlog(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const category = document.getElementById("category").value;

    const button = event.submitter;

    showMessage("createBlogMessage", "");

    try {
        button.disabled = true;
        button.textContent = "Publishing...";

        const data = await apiRequest("/blogs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                title,
                content,
                category
            })
        });

        showMessage(
            "createBlogMessage",
            data.message,
            "success"
        );

        window.location.href =
            `blog-details.html?id=${encodeURIComponent(data.blog._id)}`;

    } catch (error) {
        showMessage(
            "createBlogMessage",
            error.message,
            "error"
        );
    } finally {
        button.disabled = false;
        button.textContent = "Publish Blog";
    }
}

// GET ALL BLOGS

async function getAllBlogs() {
    const data = await apiRequest("/blogs");

    return data.blogs;
}

// CREATE BLOG CARD

function createBlogCard(blog) {
    const card = document.createElement("article");
    card.className = "blog-card";

    const top = document.createElement("div");
    top.className = "blog-card-top";

    const content = document.createElement("div");
    content.className = "blog-content";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = blog.category || "General";

    const title = document.createElement("h3");
    title.textContent = blog.title;

    const excerpt = document.createElement("p");
    excerpt.className = "blog-excerpt";

    const shortContent = blog.content || "";

    excerpt.textContent =
        shortContent.length > 120
            ? shortContent.substring(0, 120) + "..."
            : shortContent;

    const author = document.createElement("p");
    author.className = "author";
    author.textContent =
        `By ${blog.author?.name || "Unknown Author"}`;

    const readMore = document.createElement("a");
    readMore.className = "read-more";
    readMore.textContent = "Read More →";
    readMore.href =
        `blog-details.html?id=${encodeURIComponent(blog._id)}`;

    content.append(
        category,
        title,
        excerpt,
        author,
        readMore
    );

    card.append(top, content);

    return card;
}

// DISPLAY ALL BLOGS ON HOME PAGE

async function loadHomeBlogs() {
    const blogGrid = document.getElementById("blogGrid");
    const message = document.getElementById("homeMessage");

    if (!blogGrid) return;

    try {
        const blogs = await getAllBlogs();

        blogGrid.replaceChildren();

        if (blogs.length === 0) {
            message.textContent = "No blogs published yet.";
            return;
        }

        message.textContent = "";

        blogs.forEach(blog => {
            blogGrid.appendChild(createBlogCard(blog));
        });

    } catch (error) {
        message.textContent = error.message;
        message.className = "status-message error";
    }
}

// DASHBOARD

async function loadDashboard() {
    if (!requireLogin()) return;

    const user = getCurrentUser();

    const userName = document.getElementById("userName");
    const myBlogs = document.getElementById("myBlogs");
    const message = document.getElementById("dashboardMessage");

    if (userName) {
        userName.textContent = user?.name || "Writer";
    }

    try {
        const blogs = await getAllBlogs();

        const userBlogs = blogs.filter(blog => {
            const authorId =
                typeof blog.author === "object"
                    ? blog.author?._id
                    : blog.author;

            return authorId === user?.id;
        });

        myBlogs.replaceChildren();

        if (userBlogs.length === 0) {
            message.textContent =
                "You haven't published any blogs yet. Create your first blog!";

            return;
        }

        message.textContent = "";

        userBlogs.forEach(blog => {
            myBlogs.appendChild(createBlogCard(blog));
        });

    } catch (error) {
        message.textContent = error.message;
        message.className = "status-message error";
    }
}

// SINGLE BLOG DETAILS

async function loadBlogDetails() {
    const title = document.getElementById("detailTitle");
    const category = document.getElementById("detailCategory");
    const author = document.getElementById("detailAuthor");
    const date = document.getElementById("detailDate");
    const content = document.getElementById("detailContent");
    const message = document.getElementById("detailsMessage");

    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    if (!blogId) {
        title.textContent = "Blog ID is missing.";
        return;
    }

    try {
        const data = await apiRequest(
            `/blogs/${encodeURIComponent(blogId)}`
        );

        const blog = data.blog;

        title.textContent = blog.title;
        category.textContent = blog.category || "General";

        author.textContent =
            `Written by ${blog.author?.name || "Unknown Author"}`;

        date.textContent = blog.createdAt
            ? new Date(blog.createdAt).toLocaleDateString()
            : "";

        content.textContent = blog.content;

        document.title = `${blog.title} | BlogSpace`;

    } catch (error) {
        title.textContent = "Unable to load blog.";
        message.textContent = error.message;
        message.className = "status-message error";
    }
}

// NAVBAR AUTHENTICATION

function updateNavbar() {
    const loggedIn = Boolean(getToken());

    const loginNav = document.getElementById("loginNav");
    const registerNav = document.getElementById("registerNav");
    const dashboardNav = document.getElementById("dashboardNav");
    const writeBlogLink = document.getElementById("writeBlogLink");
    const logoutButton = document.getElementById("logoutButton");

    if (loginNav) loginNav.hidden = loggedIn;
    if (registerNav) registerNav.hidden = loggedIn;
    if (dashboardNav) dashboardNav.hidden = !loggedIn;
    if (logoutButton) logoutButton.hidden = !loggedIn;

    if (writeBlogLink && !loggedIn) {
        writeBlogLink.href = "login.html";
    }
}

// INITIALIZE APPLICATION

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    updateNavbar();

    // Logout button
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // Register page
    if (page === "register") {
        const form = document.getElementById("registerForm");

        form.addEventListener("submit", handleRegister);
    }

    // Login page
    if (page === "login") {
        const form = document.getElementById("loginForm");

        form.addEventListener("submit", handleLogin);
    }

    // Create blog page
    if (page === "create-blog") {
        if (!requireLogin()) return;

        const form = document.getElementById("createBlogForm");

        form.addEventListener("submit", handleCreateBlog);
    }

    // Home page
    if (page === "home") {
        loadHomeBlogs();
    }

    // Dashboard page
    if (page === "dashboard") {
        loadDashboard();
    }

    // Blog details page
    if (page === "blog-details") {
        loadBlogDetails();
    }
});