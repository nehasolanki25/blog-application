
// ============================================
// BLOGSPACE - MAIN JAVASCRIPT
// ============================================

const API_URL = "http://localhost:5000/api";


// ============================================
// 1. COMMON API FUNCTION
// ============================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}


// ============================================
// 2. AUTHENTICATION HELPERS
// ============================================

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

    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );
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


// ============================================
// 3. MESSAGE HELPER
// ============================================

function showMessage(elementId, message, type = "") {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.className = `status-message ${type}`;
}


// ============================================
// 4. REGISTER USER
// ============================================

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const button = event.submitter;

    showMessage("registerMessage", "");

    if (!name || !email || !password) {
        showMessage(
            "registerMessage",
            "Please fill all fields.",
            "error"
        );
        return;
    }

    if (password.length < 8) {
        showMessage(
            "registerMessage",
            "Password must be at least 8 characters.",
            "error"
        );
        return;
    }

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Creating Account...";
        }

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
        if (button) {
            button.disabled = false;
            button.textContent = "Create Account";
        }
    }
}


// ============================================
// 5. LOGIN USER
// ============================================

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const button = event.submitter;

    showMessage("loginMessage", "");

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Logging in...";
        }

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

        window.location.href = "dashboard.html";

    } catch (error) {
        showMessage(
            "loginMessage",
            error.message,
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}


// ============================================
// 6. LOAD USER PROFILE
// ============================================

async function loadUserProfile() {
    const data = await apiRequest("/auth/me", {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const user = data.user;

    const userData = {
        id: user._id,
        name: user.name,
        email: user.email
    };

    localStorage.setItem(
        "user",
        JSON.stringify(userData)
    );

    const userName = document.getElementById("userName");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    if (userName) userName.textContent = user.name;
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;

    return userData;
}


// ============================================
// 7. CREATE OR UPDATE BLOG
// ============================================

async function handleCreateBlog(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    const category = document.getElementById("category").value;

    const button = document.getElementById("publishButton");

    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    const isEditing = Boolean(blogId);

    showMessage("createBlogMessage", "");

    if (!title || !content) {
        showMessage(
            "createBlogMessage",
            "Title and content are required.",
            "error"
        );
        return;
    }

    try {
        if (button) {
            button.disabled = true;
            button.textContent = isEditing
                ? "Updating..."
                : "Publishing...";
        }

        const endpoint = isEditing
            ? `/blogs/${encodeURIComponent(blogId)}`
            : "/blogs";

        const data = await apiRequest(endpoint, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
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
        if (button) {
            button.disabled = false;
            button.textContent = isEditing
                ? "Update Blog"
                : "Publish Blog";
        }
    }
}


// ============================================
// 8. LOAD BLOG FOR EDITING
// ============================================

async function loadBlogForEditing() {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    if (!blogId) return;

    try {
        const data = await apiRequest(
            `/blogs/${encodeURIComponent(blogId)}`
        );

        const blog = data.blog;

        const user = await loadUserProfile();

        const authorId = blog.author?._id || blog.author;

        if (String(authorId) !== String(user.id || user._id)) {
            alert("You cannot edit another user's blog.");
            window.location.href = "dashboard.html";
            return;
        }

        document.getElementById("title").value = blog.title;
        document.getElementById("content").value = blog.content;
        document.getElementById("category").value =
            blog.category || "General";

        document.getElementById("formHeading").textContent =
            "Edit Your Blog";

        document.getElementById("formDescription").textContent =
            "Update your story and share your latest ideas.";

        document.getElementById("publishButton").textContent =
            "Update Blog";

    } catch (error) {
        showMessage(
            "createBlogMessage",
            error.message,
            "error"
        );
    }
}


// ============================================
// 9. GET ALL BLOGS
// ============================================

async function getAllBlogs(search = "", category = "") {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (category) params.set("category", category);

    const query = params.toString();

    const endpoint = query
        ? `/blogs?${query}`
        : "/blogs";

    const data = await apiRequest(endpoint);

    return data.blogs;
}


// ============================================
// 10. CREATE BLOG CARD
// ============================================

function createBlogCard(blog, showActions = false) {
    const card = document.createElement("article");
    card.className = "blog-card";

    const content = document.createElement("div");
    content.className = "blog-content";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = blog.category || "General";

    const title = document.createElement("h3");
    title.textContent = blog.title;

    const excerpt = document.createElement("p");
    excerpt.className = "blog-excerpt";

    excerpt.textContent =
        blog.content.length > 120
            ? blog.content.substring(0, 120) + "..."
            : blog.content;

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

    if (showActions) {
        const actions = document.createElement("div");
        actions.className = "blog-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "primary-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            window.location.href =
                `create-blog.html?id=${encodeURIComponent(blog._id)}`;
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteBlog(blog._id);
        });

        actions.append(editButton, deleteButton);
        content.appendChild(actions);
    }

    card.appendChild(content);

    return card;
}


// ============================================
// 11. HOME PAGE BLOGS
// ============================================

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
            blogGrid.appendChild(
                createBlogCard(blog)
            );
        });

    } catch (error) {
        message.textContent = error.message;
        message.className = "status-message error";
    }
}


// ============================================
// 12. DASHBOARD BLOGS
// ============================================

let dashboardBlogs = [];

function renderDashboardBlogs() {
    const myBlogs = document.getElementById("myBlogs");
    const message = document.getElementById("dashboardMessage");

    if (!myBlogs || !message) return;

    const searchValue =
        document.getElementById("searchBlogs")
            ?.value.trim().toLowerCase() || "";

    const selectedCategory =
        document.getElementById("filterCategory")?.value || "";

    const filteredBlogs = dashboardBlogs.filter(blog => {
        const matchesSearch =
            blog.title.toLowerCase().includes(searchValue) ||
            blog.content.toLowerCase().includes(searchValue);

        const matchesCategory =
            !selectedCategory ||
            blog.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    myBlogs.replaceChildren();

    if (filteredBlogs.length === 0) {
        message.textContent = dashboardBlogs.length === 0
            ? "You haven't published any blogs yet."
            : "No blogs match your search or category.";

        return;
    }

    message.textContent = "";

    filteredBlogs.forEach(blog => {
        myBlogs.appendChild(
            createBlogCard(blog, true)
        );
    });
}


async function loadDashboard() {
    if (!requireLogin()) return;

    const message = document.getElementById("dashboardMessage");

    try {
        await loadUserProfile();

        const data = await apiRequest("/blogs/mine", {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        dashboardBlogs = data.blogs;

        renderDashboardBlogs();

    } catch (error) {
        message.textContent = error.message;
        message.className = "status-message error";

        if (
            error.message.toLowerCase().includes("token") ||
            error.message.toLowerCase().includes("log in")
        ) {
            logout();
        }
    }
}


// ============================================
// 13. DELETE BLOG
// ============================================

async function deleteBlog(blogId) {
    const confirmed = confirm(
        "Are you sure you want to delete this blog?"
    );

    if (!confirmed) return;

    try {
        const data = await apiRequest(
            `/blogs/${encodeURIComponent(blogId)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        alert(data.message);

        if (document.body.dataset.page === "dashboard") {
            dashboardBlogs = dashboardBlogs.filter(
                blog => blog._id !== blogId
            );

            renderDashboardBlogs();
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {
        alert(error.message);
    }
}


// ============================================
// 14. SINGLE BLOG DETAILS
// ============================================

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

        const user = getCurrentUser();
        const authorId = blog.author?._id || blog.author;

        if (
            user?.id &&
            String(authorId) === String(user.id)
        ) {
            const actions = document.getElementById("blogActions");

            if (actions) {
                actions.hidden = false;
            }

            document.getElementById("editBlogButton")
                ?.addEventListener("click", () => {
                    window.location.href =
                        `create-blog.html?id=${encodeURIComponent(blog._id)}`;
                });

            document.getElementById("deleteBlogButton")
                ?.addEventListener("click", () => {
                    deleteBlog(blog._id);
                });
        }

    } catch (error) {
        title.textContent = "Unable to load blog.";
        message.textContent = error.message;
        message.className = "status-message error";
    }
}


// ============================================
// 15. NAVBAR
// ============================================

function updateNavbar() {
    const loggedIn = Boolean(getToken());

    const loginNav = document.getElementById("loginNav");
    const registerNav = document.getElementById("registerNav");
    const dashboardNav = document.getElementById("dashboardNav");
    const logoutButton = document.getElementById("logoutButton");
    const writeBlogLink = document.getElementById("writeBlogLink");

    if (loginNav) loginNav.hidden = loggedIn;
    if (registerNav) registerNav.hidden = loggedIn;
    if (dashboardNav) dashboardNav.hidden = !loggedIn;
    if (logoutButton) logoutButton.hidden = !loggedIn;

    if (writeBlogLink && !loggedIn) {
        writeBlogLink.href = "login.html";
    }
}


// ============================================
// 16. INITIALIZE APPLICATION
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    updateNavbar();

    document.getElementById("logoutButton")
        ?.addEventListener("click", logout);

    document.getElementById("profileLogoutButton")
        ?.addEventListener("click", logout);


    // REGISTER PAGE
    if (page === "register") {
        document.getElementById("registerForm")
            ?.addEventListener("submit", handleRegister);
    }


    // LOGIN PAGE
    if (page === "login") {
        document.getElementById("loginForm")
            ?.addEventListener("submit", handleLogin);
    }


    // HOME PAGE
    if (page === "home") {
        loadHomeBlogs();
    }


    // DASHBOARD PAGE
    if (page === "dashboard") {
        if (!requireLogin()) return;

        loadDashboard();

        document.getElementById("searchBlogs")
            ?.addEventListener("input", renderDashboardBlogs);

        document.getElementById("filterCategory")
            ?.addEventListener("change", renderDashboardBlogs);
    }


    // CREATE / EDIT BLOG PAGE
    if (page === "create-blog") {
        if (!requireLogin()) return;

        document.getElementById("createBlogForm")
            ?.addEventListener("submit", handleCreateBlog);

        loadBlogForEditing();
    }


    // BLOG DETAILS PAGE
    if (page === "blog-details") {
        loadBlogDetails();
    }
});
