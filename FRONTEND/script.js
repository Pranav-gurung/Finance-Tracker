// Configuration - Replace with your actual API URL
const API_BASE_URL = 'https://finance-tracker-project-m83z.onrender.com';

// State Management
let authToken = null;
let expenses = [];
let categories = [];
let tags = [];
let deleteModalCallback = null;

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const addExpenseForm = document.getElementById('addExpenseForm');
const editExpenseForm = document.getElementById('editExpenseForm');
const addCategoryForm = document.getElementById('addCategoryForm');
const addTagForm = document.getElementById('addTagForm');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        showDashboard();
        loadAllData();
    }

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('saveExpenseBtn').addEventListener('click', handleAddExpense);
    document.getElementById('updateExpenseBtn').addEventListener('click', handleUpdateExpense);
    addCategoryForm.addEventListener('submit', handleAddCategory);
    addTagForm.addEventListener('submit', handleAddTag);
    
    // Color picker sync
    document.getElementById('categoryColor').addEventListener('input', function(e) {
        document.getElementById('categoryColorText').value = e.target.value;
    });
    document.getElementById('categoryColorText').addEventListener('input', function(e) {
        document.getElementById('categoryColor').value = e.target.value;
    });

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
});

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/authentication`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        authToken = data.token || data.access_token || data.authToken;
        localStorage.setItem('authToken', authToken);
        
        showDashboard();
        loadAllData();
        loginForm.reset();
        errorDiv.classList.add('d-none');
    } catch (error) {
        errorDiv.textContent = 'Invalid credentials. Please try again.';
        errorDiv.classList.remove('d-none');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        authToken = data.token || data.access_token || data.authToken;
        
        if (authToken) {
            localStorage.setItem('authToken', authToken);
            showDashboard();
            loadAllData();
            registerForm.reset();
            errorDiv.classList.add('d-none');
        } else {
            // Switch to login tab
            document.getElementById('login-tab').click();
            alert('Registration successful! Please login.');
        }
    } catch (error) {
        errorDiv.textContent = 'Registration failed. Please try again.';
        errorDiv.classList.remove('d-none');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('authToken');
        authToken = null;
        expenses = [];
        categories = [];
        tags = [];
        showAuth();
    }
}

// UI Functions
function showDashboard() {
    authSection.classList.add('d-none');
    dashboardSection.classList.remove('d-none');
}

function showAuth() {
    authSection.classList.remove('d-none');
    dashboardSection.classList.add('d-none');
}

// Data Loading Functions
async function loadAllData() {
    await Promise.all([
        loadExpenses(),
        loadCategories(),
        loadTags()
    ]);
    updateStats();
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        expenses = data.expenses || data || [];
        renderExpenses();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        categories = data.categories || data || [];
        renderCategories();
        updateCategorySelects();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadTags() {
    try {
        const response = await fetch(`${API_BASE_URL}/tags`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const data = await response.json();
        tags = data.tags || data || [];
        renderTags();
        updateTagCheckboxes();
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

// Render Functions
function renderExpenses() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body empty-state">
                    <i class="bi bi-receipt"></i>
                    <p>No expenses yet. Click "Add Expense" to get started.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const category = categories.find(c => c.id === expense.category_id);
        const expenseTags = (expense.tag_ids || []).map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag ? tag.name : '';
        }).filter(Boolean);

        return `
            <div class="expense-item fade-in">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <h6 class="mb-0">${expense.description}</h6>
                            <span class="badge bg-secondary">${category ? category.name : 'Uncategorized'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-3 text-muted small">
                            <span><i class="bi bi-calendar3 me-1"></i>${new Date(expense.date).toLocaleDateString()}</span>
                            ${expenseTags.length > 0 ? `
                                <div class="d-flex gap-1">
                                    ${expenseTags.map(tag => `<span class="badge bg-light text-dark border">${tag}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <div class="expense-amount">$${parseFloat(expense.amount).toFixed(2)}</div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editExpense('${expense.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense('${expense.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    document.getElementById('categoryCount').textContent = categories.length;
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No categories yet</p>';
        return;
    }

    container.innerHTML = categories.map(category => `
        <div class="category-item fade-in">
            <div class="d-flex align-items-center">
                <span class="category-color" style="background-color: ${category.color || '#3b82f6'}"></span>
                <span>${category.name}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${category.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
}

function renderTags() {
    const container = document.getElementById('tagsList');
    document.getElementById('tagCount').textContent = tags.length;
    
    if (tags.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No tags yet</p>';
        return;
    }

    container.innerHTML = `
        <div class="d-flex flex-wrap gap-2">
            ${tags.map(tag => `
                <span class="tag-badge">
                    <i class="bi bi-tag me-1"></i>${tag.name}
                </span>
            `).join('')}
        </div>
    `;
}

function updateCategorySelects() {
    const selects = [
        document.getElementById('expenseCategory'),
        document.getElementById('editExpenseCategory')
    ];

    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select a category</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function updateTagCheckboxes() {
    const containers = [
        document.getElementById('expenseTagsCheckboxes'),
        document.getElementById('editExpenseTagsCheckboxes')
    ];

    containers.forEach(container => {
        if (tags.length === 0) {
            container.innerHTML = '<p class="text-muted text-center small mb-0">No tags available</p>';
            return;
        }

        container.innerHTML = tags.map(tag => `
            <div class="form-check">
                <input class="form-check-input tag-checkbox" type="checkbox" value="${tag.id}" id="tag-${tag.id}">
                <label class="form-check-label" for="tag-${tag.id}">${tag.name}</label>
            </div>
        `).join('');
    });
}

function updateStats() {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    document.getElementById('totalExpenses').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalCategories').textContent = categories.length;
    document.getElementById('totalTags').textContent = tags.length;
}

// Expense CRUD
async function handleAddExpense() {
    const description = document.getElementById('expenseDescription').value;
    const amount = document.getElementById('expenseAmount').value;
    const date = document.getElementById('expenseDate').value;
    const categoryId = document.getElementById('expenseCategory').value;
    const selectedTags = Array.from(document.querySelectorAll('#expenseTagsCheckboxes .tag-checkbox:checked'))
        .map(cb => cb.value);

    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description,
                amount: parseFloat(amount),
                date,
                category_id: categoryId || undefined,
                tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
            }),
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
            addExpenseForm.reset();
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            await loadExpenses();
            updateStats();
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseDescription').value = expense.description;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseDate').value = expense.date.split('T')[0];
    document.getElementById('editExpenseCategory').value = expense.category_id || '';

    // Set tag checkboxes
    const tagCheckboxes = document.querySelectorAll('#editExpenseTagsCheckboxes .tag-checkbox');
    tagCheckboxes.forEach(cb => {
        cb.checked = (expense.tag_ids || []).includes(cb.value);
    });

    new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
}

async function handleUpdateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const description = document.getElementById('editExpenseDescription').value;
    const amount = document.getElementById('editExpenseAmount').value;
    const date = document.getElementById('editExpenseDate').value;
    const categoryId = document.getElementById('editExpenseCategory').value;
    const selectedTags = Array.from(document.querySelectorAll('#editExpenseTagsCheckboxes .tag-checkbox:checked'))
        .map(cb => cb.value);

    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description,
                amount: parseFloat(amount),
                date,
                category_id: categoryId || undefined,
                tag_ids: selectedTags.length > 0 ? selectedTags : undefined,
            }),
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
            await loadExpenses();
            updateStats();
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Failed to update expense. Please try again.');
    }
}

function deleteExpense(id) {
    showDeleteModal('Delete Expense', 'Are you sure you want to delete this expense?', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                await loadExpenses();
                updateStats();
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense. Please try again.');
        }
    });
}

// Category CRUD
async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value;
    const color = document.getElementById('categoryColor').value;

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, color }),
        });

        if (response.ok) {
            addCategoryForm.reset();
            document.getElementById('categoryColor').value = '#3b82f6';
            document.getElementById('categoryColorText').value = '#3b82f6';
            await loadCategories();
            updateStats();
        }
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category. Please try again.');
    }
}

function deleteCategory(id) {
    showDeleteModal('Delete Category', 'Are you sure you want to delete this category?', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                await loadCategories();
                updateStats();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Failed to delete category. Please try again.');
        }
    });
}

// Tag CRUD
async function handleAddTag(e) {
    e.preventDefault();
    const name = document.getElementById('tagName').value;

    try {
        const response = await fetch(`${API_BASE_URL}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (response.ok) {
            addTagForm.reset();
            await loadTags();
            updateStats();
        }
    } catch (error) {
        console.error('Error adding tag:', error);
        alert('Failed to add tag. Please try again.');
    }
}

// Delete Modal Helper
function showDeleteModal(title, message, callback) {
    document.getElementById('deleteModalTitle').textContent = title;
    document.getElementById('deleteModalBody').textContent = message;
    deleteModalCallback = callback;
    
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
    
    document.getElementById('confirmDeleteBtn').onclick = async function() {
        if (deleteModalCallback) {
            await deleteModalCallback();
            deleteModalCallback = null;
        }
        modal.hide();
    };
}
