// Sections
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

// Add new inputs
const addCategoryBtn = document.getElementById("add-category-btn");
const addTagBtn = document.getElementById("add-tag-btn");
const addExpenseBtn = document.getElementById("add-expense-btn");

// Tag inputs
const newCategoryInput = document.getElementById("new-category");
const newTagInput = document.getElementById("new-tag");
const tagCategoryIdInput = document.getElementById("tag-category-id");

// Expense inputs
const newExpenseNameInput = document.getElementById("new-expense-name");
const newExpensePriceInput = document.getElementById("new-expense-price");

// State
let mode = "login";
let accessToken = "";

// Backend URL (your Render backend)
const baseUrl = "https://finance-tracker-project-m83z.onrender.com";

// Landing buttons
newUserBtn.addEventListener("click", () => {
    mode = "register";
    showAuth("Register", "Get Started");
});
oldUserBtn.addEventListener("click", () => {
    mode = "login";
    showAuth("Login", "Login");
});

// Back button
backBtn.addEventListener("click", () => {
    authSection.classList.add("hidden");
    landing.classList.remove("hidden");
});

// Show Auth
function showAuth(title, buttonText) {
    landing.classList.add("hidden");
    authSection.classList.remove("hidden");
    authTitle.textContent = title;
    authSubmit.textContent = buttonText;
    authMessage.textContent = "";
}

// Auth submit
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const url = mode === "login" ? `${baseUrl}/login` : `${baseUrl}/register`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username, password}),
        });
        const data = await res.json();

        if (!res.ok) {
            authMessage.textContent = data.message || "Error occurred!";
        } else {
            if (data.access_token) accessToken = data.access_token;

            authSection.classList.add("hidden");
            dashboard.classList.remove("hidden");
            userNameSpan.textContent = username;

            fetchDashboardData();
        }
    } catch (err) {
        authMessage.textContent = "Network error!";
        console.error(err);
    }
});

// Fetch dashboard data
async function fetchDashboardData() {
    await fetchData(`${baseUrl}/category`, categoriesList);
    await fetchData(`${baseUrl}/tag`, tagsList);
    await fetchData(`${baseUrl}/expense`, expensesList, true);
}

async function fetchData(url, container, isExpense = false) {
    try {
        const res = await fetch(url, {
            headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
        });
        const items = await res.json();
        container.innerHTML = items
            .map(item => isExpense ? `<li>${item.name} - $${item.price}</li>` : `<li>${item.name}</li>`)
            .join("");
    } catch (err) {
        console.error(`Error fetching ${url}:`, err);
    }
}

// Add category
addCategoryBtn.addEventListener("click", async () => {
    const name = newCategoryInput.value.trim();
    if (!name) return alert("Enter category name");
    await fetch(`${baseUrl}/category`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({name}),
    });
    newCategoryInput.value = "";
    fetchDashboardData();
});

// Add tag
addTagBtn.addEventListener("click", async () => {
    const name = newTagInput.value.trim();
    const category_id = tagCategoryIdInput.value.trim();
    if (!name || !category_id) return alert("Enter tag name and category id");
    await fetch(`${baseUrl}/category/${category_id}/tag`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({name}),
    });
    newTagInput.value = "";
    tagCategoryIdInput.value = "";
    fetchDashboardData();
});

// Add expense
addExpenseBtn.addEventListener("click", async () => {
    const name = newExpenseNameInput.value.trim();
    const price = parseFloat(newExpensePriceInput.value);
    if (!name || isNaN(price)) return alert("Enter expense name and price");
    await fetch(`${baseUrl}/expense`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({name, price}),
    });
    newExpenseNameInput.value = "";
    newExpensePriceInput.value = "";
    fetchDashboardData();
});

