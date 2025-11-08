// ----------------------
// Sections
// ----------------------
const landing = document.getElementById("landing");
const authSection = document.getElementById("auth-section");
const dashboard = document.getElementById("dashboard");

// Buttons
const newUserBtn = document.getElementById("new-user-btn");
const oldUserBtn = document.getElementById("old-user-btn");
const backBtn = document.getElementById("back-btn");

// Auth form
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");

// Dashboard
const userNameSpan = document.getElementById("user-name");
const categoriesList = document.getElementById("categories-list");
const tagsList = document.getElementById("tags-list");
const expensesList = document.getElementById("expenses-list");

// State
let mode = "login"; // login or register
let accessToken = "";

// Backend URL
const baseUrl = "https://finance-tracker-project-m83z.onrender.com";

// ----------------------
// Landing button events
// ----------------------
newUserBtn.addEventListener("click", () => {
    mode = "register";
    showAuth("Register", "Get Started");
});

oldUserBtn.addEventListener("click", () => {
    mode = "login";
    showAuth("Login", "Login");
});

// ----------------------
// Back button
// ----------------------
backBtn.addEventListener("click", () => {
    authSection.classList.add("hidden");
    landing.classList.remove("hidden");
});

// ----------------------
// Show Auth section
// ----------------------
function showAuth(title, buttonText) {
    landing.classList.add("hidden");
    authSection.classList.remove("hidden");
    authTitle.textContent = title;
    authSubmit.textContent = buttonText;
    authMessage.textContent = "";
}

// ----------------------
// Handle auth submission
// ----------------------
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const url = mode === "login" ? `${baseUrl}/login` : `${baseUrl}/register`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            authMessage.textContent = data.message || "Error occurred!";
        } else {
            if (data.access_token) accessToken = data.access_token;

            authSection.classList.add("hidden");
            dashboard.classList.remove("hidden");
            userNameSpan.textContent = username;

            // Load dashboard data
            fetchDashboardData();
        }
    } catch (err) {
        authMessage.textContent = "Network error!";
        console.error(err);
    }
});

// ----------------------
// Fetch dashboard data
// ----------------------
async function fetchDashboardData() {
    // Categories
    try {
        const res = await fetch(`${baseUrl}/category`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const categories = await res.json();
        categoriesList.innerHTML = categories.map(cat => `<li>${cat.name}</li>`).join("");
    } catch (err) {
        console.error("Error fetching categories:", err);
    }

    // Tags
    try {
        const res = await fetch(`${baseUrl}/tag`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const tags = await res.json();
        tagsList.innerHTML = tags.map(tag => `<li>${tag.name}</li>`).join("");
    } catch (err) {
        console.error("Error fetching tags:", err);
    }

    // Expenses
    try {
        const res = await fetch(`${baseUrl}/expense`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const expenses = await res.json();
        expensesList.innerHTML = expenses.map(exp => `<li>${exp.name} - $${exp.price}</li>`).join("");
    } catch (err) {
        console.error("Error fetching expenses:", err);
    }
}

// ----------------------
// Optional: Add new category
// ----------------------
async function addCategory(name) {
    try {
        const res = await fetch(`${baseUrl}/category`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        fetchDashboardData();
        return data;
    } catch (err) {
        console.error("Error adding category:", err);
    }
}

// ----------------------
// Optional: Add new tag
// ----------------------
async function addTag(category_id, name) {
    try {
        const res = await fetch(`${baseUrl}/category/${category_id}/tag`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name }),
        });
        const data = await res.json();
        fetchDashboardData();
        return data;
    } catch (err) {
        console.error("Error adding tag:", err);
    }
}

// ----------------------
// Optional: Add new expense
// ----------------------
async function addExpense(name, price) {
    try {
        const res = await fetch(`${baseUrl}/expense`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ name, price }),
        });
        const data = await res.json();
        fetchDashboardData();
        return data;
    } catch (err) {
        console.error("Error adding expense:", err);
    }
}
