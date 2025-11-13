// Configuration - Replace with your actual API URL
const API_BASE_URL = 'https://finance-tracker-vqwo.onrender.com';

// State Management
let accessToken = null;
let refreshToken = null;
let expenses = [];
let categories = [];
let allTags = {}; // Organized by category

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
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
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
});

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
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
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Show success message and switch to login
        successDiv.textContent = data.message || 'User created successfully! Please login.';
        successDiv.classList.remove('d-none');
        errorDiv.classList.add('d-none');
        registerForm.reset();
        
        // Switch to login tab after 2 seconds
        setTimeout(() => {
            document.getElementById('login-tab').click();
            successDiv.classList.add('d-none');
        }, 2000);
        
    } catch (error) {
        errorDiv.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.classList.remove('d-none');
        successDiv.classList.add('d-none');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        accessToken = null;
        refreshToken = null;
        expenses = [];
        categories = [];
        allTags = {};
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
    await loadCategories(); // Load categories first
    await loadExpenses();
    await loadAllTags(); // Load tags for all categories
    updateStats();
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/expense`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) throw new Error('Failed to load expenses');
        
        expenses = await response.json();
        renderExpenses();
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
        renderExpenses();
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/category`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        if (!response.ok) throw new Error('Failed to load categories');
        
        categories = await response.json();
        renderCategories();
        updateCategorySelects();
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
        renderCategories();
    }
}

async function loadAllTags() {
    allTags = {};
    let totalTagCount = 0;
    
    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE_URL}/category/${category.id}/tag`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            
            if (response.ok) {
                const tags = await response.json();
                allTags[category.id] = tags;
                totalTagCount += tags.length;
            }
        } catch (error) {
            console.error(`Error loading tags for category ${category.id}:`, error);
        }
    }
    
    document.getElementById('totalTags').textContent = totalTagCount;
    renderTags();
    updateTagCheckboxes();
}

// Render Functions
function renderExpenses() {
    const container = document.getElementById('expensesList');
    
    if (!expenses || expenses.length === 0) {
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
        const expenseTags = expense.tags || [];

        return `
            <div class="expense-item fade-in">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <h6 class="mb-0">${expense.name}</h6>
                            <span class="badge bg-secondary">${category ? category.name : 'Uncategorized'}</span>
                        </div>
                        ${expenseTags.length > 0 ? `
                            <div class="d-flex gap-1">
                                ${expenseTags.map(tag => `<span class="badge bg-light text-dark border"><i class="bi bi-tag-fill me-1"></i>${tag.name}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <div class="expense-amount">$${parseFloat(expense.price).toFixed(2)}</div>
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
                <i class="bi bi-folder-fill text-primary me-2"></i>
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
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Create a category first to add tags</p>';
        return;
    }

    let hasAnyTags = false;
    let html = '';

    for (const category of categories) {
        const tags = allTags[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `
                <div class="mb-3">
                    <h6 class="mb-2"><i class="bi bi-folder-fill text-primary me-2"></i>${category.name}</h6>
                    <div class="d-flex flex-wrap gap-2">
                        ${tags.map(tag => `
                            <span class="tag-badge">
                                <i class="bi bi-tag me-1"></i>${tag.name}
                                <button class="btn btn-sm btn-link text-danger p-0 ms-2" onclick="deleteTag('${tag.id}')" style="text-decoration: none;">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    if (!hasAnyTags) {
        container.innerHTML = '<p class="text-muted text-center py-4">No tags yet</p>';
    } else {
        container.innerHTML = html;
    }
}

function updateCategorySelects() {
    const selects = [
        document.getElementById('expenseCategory'),
        document.getElementById('editExpenseCategory'),
        document.getElementById('tagCategory')
    ];

    selects.forEach(select => {
        const currentValue = select.value;
        const isTagCategory = select.id === 'tagCategory';
        
        select.innerHTML = `<option value="">Select a category</option>` +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function updateTagCheckboxes() {
    const containers = [
        { elem: document.getElementById('expenseTagsCheckboxes'), prefix: 'add' },
        { elem: document.getElementById('editExpenseTagsCheckboxes'), prefix: 'edit' }
    ];

    containers.forEach(({ elem, prefix }) => {
        let hasAnyTags = false;
        let html = '';

        for (const category of categories) {
            const tags = allTags[category.id] || [];
            if (tags.length > 0) {
                hasAnyTags = true;
                html += `
                    <div class="mb-2">
                        <strong class="d-block mb-1 text-muted small">${category.name}</strong>
                        ${tags.map(tag => `
                            <div class="form-check">
                                <input class="form-check-input tag-checkbox" type="checkbox" value="${tag.id}" id="${prefix}-tag-${tag.id}">
                                <label class="form-check-label" for="${prefix}-tag-${tag.id}">${tag.name}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }

        if (!hasAnyTags) {
            elem.innerHTML = '<p class="text-muted text-center small mb-0">No tags available</p>';
        } else {
            elem.innerHTML = html;
        }
    });
}

function updateStats() {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.price || 0), 0);
    document.getElementById('totalExpenses').textContent = `$${total.toFixed(2)}`;
    document.getElementById('totalCategories').textContent = categories.length;
}

// Expense CRUD
async function handleAddExpense() {
    const name = document.getElementById('expenseName').value;
    const price = document.getElementById('expensePrice').value;
    const categoryId = document.getElementById('expenseCategory').value;
    const selectedTagIds = Array.from(document.querySelectorAll('#expenseTagsCheckboxes .tag-checkbox:checked'))
        .map(cb => cb.value);

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    try {
        // Create expense
        const response = await fetch(`${API_BASE_URL}/expense`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                price: parseFloat(price),
                category_id: categoryId,
            }),
        });

        if (!response.ok) throw new Error('Failed to create expense');

        const newExpense = await response.json();

        // Link tags to expense
        for (const tagId of selectedTagIds) {
            try {
                await fetch(`${API_BASE_URL}/expense/${newExpense.id}/tag/${tagId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });
            } catch (error) {
                console.error('Error linking tag:', error);
            }
        }

        bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
        addExpenseForm.reset();
        await loadExpenses();
        updateStats();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpensePrice').value = expense.price;
    document.getElementById('editExpenseCategory').value = expense.category_id || '';

    // Set tag checkboxes
    const expenseTagIds = (expense.tags || []).map(t => t.id);
    const tagCheckboxes = document.querySelectorAll('#editExpenseTagsCheckboxes .tag-checkbox');
    tagCheckboxes.forEach(cb => {
        cb.checked = expenseTagIds.includes(cb.value);
    });

    new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
}

async function handleUpdateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const name = document.getElementById('editExpenseName').value;
    const price = document.getElementById('editExpensePrice').value;
    const categoryId = document.getElementById('editExpenseCategory').value;
    const selectedTagIds = Array.from(document.querySelectorAll('#editExpenseTagsCheckboxes .tag-checkbox:checked'))
        .map(cb => cb.value);

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    try {
        // Update expense
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                price: parseFloat(price),
                category_id: categoryId,
            }),
        });

        if (!response.ok) throw new Error('Failed to update expense');

        // Get current tags
        const expense = expenses.find(e => e.id === id);
        const currentTagIds = (expense.tags || []).map(t => t.id);

        // Remove unselected tags
        for (const tagId of currentTagIds) {
            if (!selectedTagIds.includes(tagId)) {
                try {
                    await fetch(`${API_BASE_URL}/expense/${id}/tag/${tagId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });
                } catch (error) {
                    console.error('Error removing tag:', error);
                }
            }
        }

        // Add new tags
        for (const tagId of selectedTagIds) {
            if (!currentTagIds.includes(tagId)) {
                try {
                    await fetch(`${API_BASE_URL}/expense/${id}/tag/${tagId}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    });
                } catch (error) {
                    console.error('Error adding tag:', error);
                }
            }
        }

        bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
        await loadExpenses();
        updateStats();
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Failed to update expense. Please try again.');
    }
}

function deleteExpense(id) {
    showDeleteModal('Delete Expense', 'Are you sure you want to delete this expense?', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
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

    try {
        const response = await fetch(`${API_BASE_URL}/category`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to add category');
        }

        addCategoryForm.reset();
        await loadCategories();
        await loadAllTags();
        updateStats();
    } catch (error) {
        console.error('Error adding category:', error);
        alert(error.message || 'Failed to add category. Please try again.');
    }
}

function deleteCategory(id) {
    showDeleteModal('Delete Category', 'Are you sure you want to delete this category? This will also delete all associated tags and expenses.', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/category/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                await loadCategories();
                await loadAllTags();
                await loadExpenses();
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
    const categoryId = document.getElementById('tagCategory').value;
    const name = document.getElementById('tagName').value;

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/category/${categoryId}/tag`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to add tag');
        }

        addTagForm.reset();
        await loadAllTags();
    } catch (error) {
        console.error('Error adding tag:', error);
        alert(error.message || 'Failed to add tag. Please try again.');
    }
}

function deleteTag(id) {
    showDeleteModal('Delete Tag', 'Are you sure you want to delete this tag?', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tag/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete tag');
            }

            await loadAllTags();
            await loadExpenses(); // Refresh expenses to show updated tags
        } catch (error) {
            console.error('Error deleting tag:', error);
            alert(error.message || 'Failed to delete tag. Make sure it is not associated with any expenses.');
        }
    });
}

// Delete Modal Helper
let deleteModalCallback = null;

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

