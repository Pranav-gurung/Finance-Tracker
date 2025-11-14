// Configuration - Replace with your actual API URL
const API_BASE_URL = 'https://finance-tracker-vqwo.onrender.com';
// State
let accessToken = null;
let refreshToken = null;
let categories = [];
let expenses = [];
let allTags = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
        showApp();
        loadAllData();
    }

    // Event Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('addTagForm').addEventListener('submit', handleAddTag);
    document.getElementById('saveExpenseBtn').addEventListener('click', handleAddExpense);
    document.getElementById('updateExpenseBtn').addEventListener('click', handleUpdateExpense);
});

// ========== AUTHENTICATION ==========

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Login failed');

        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        errorDiv.classList.add('d-none');
        document.getElementById('loginForm').reset();
        showApp();
        loadAllData();
    } catch (error) {
        errorDiv.textContent = 'Invalid username or password';
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        successDiv.textContent = 'Account created successfully! Please login.';
        successDiv.classList.remove('d-none');
        errorDiv.classList.add('d-none');
        document.getElementById('registerForm').reset();
        
        setTimeout(() => {
            document.getElementById('login-tab').click();
            successDiv.classList.add('d-none');
        }, 2000);
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('d-none');
        successDiv.classList.add('d-none');
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    accessToken = null;
    refreshToken = null;
    categories = [];
    expenses = [];
    allTags = {};
    showAuth();
}

function showApp() {
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('appSection').classList.remove('d-none');
}

function showAuth() {
    document.getElementById('authSection').classList.remove('d-none');
    document.getElementById('appSection').classList.add('d-none');
}

// ========== DATA LOADING ==========

async function loadAllData() {
    await loadCategories();
    await loadExpenses();
    await loadAllTags();
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/category`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load categories');
        
        categories = await response.json();
        renderCategories();
        updateCategorySelects();
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = [];
    }
}

async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/expense`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load expenses');
        
        expenses = await response.json();
        renderExpenses();
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

async function loadAllTags() {
    allTags = {};
    
    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE_URL}/category/${category.id}/tag`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (response.ok) {
                allTags[category.id] = await response.json();
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }
    
    renderTags();
    updateTagSelects();
}

// ========== CATEGORIES ==========

async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value;

    try {
        const response = await fetch(`${API_BASE_URL}/category`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) throw new Error('Failed to create category');

        document.getElementById('addCategoryForm').reset();
        await loadCategories();
        await loadAllTags();
    } catch (error) {
        alert('Failed to add category: ' + error.message);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">No categories yet. Add your first category!</p>';
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded">
            <div>
                <i class="bi bi-folder-fill text-primary me-2"></i>
                <strong>${cat.name}</strong>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory('${cat.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? This will also delete all associated tags and expenses.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/category/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to delete category');

        await loadAllData();
    } catch (error) {
        alert('Failed to delete category: ' + error.message);
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
        select.innerHTML = '<option value="">Select a category</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        if (currentValue) select.value = currentValue;
    });
}

// ========== TAGS ==========

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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) throw new Error('Failed to create tag');

        document.getElementById('addTagForm').reset();
        await loadAllTags();
    } catch (error) {
        alert('Failed to add tag: ' + error.message);
    }
}

function renderTags() {
    const container = document.getElementById('tagsList');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-4">Create categories first to add tags.</p>';
        return;
    }

    let html = '';
    let hasAnyTags = false;

    categories.forEach(category => {
        const tags = allTags[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `
                <div class="mb-4">
                    <h6 class="text-primary"><i class="bi bi-folder-fill me-2"></i>${category.name}</h6>
                    <div class="d-flex flex-wrap gap-2">
                        ${tags.map(tag => `
                            <span class="badge bg-secondary p-2">
                                ${tag.name}
                                <button class="btn btn-sm btn-link text-white p-0 ms-1" onclick="deleteTag('${tag.id}')" style="text-decoration: none;">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = hasAnyTags ? html : '<p class="text-muted text-center py-4">No tags yet. Add tags to categories!</p>';
}

async function deleteTag(id) {
    if (!confirm('Delete this tag?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tag/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete tag');
        }

        await loadAllTags();
        await loadExpenses();
    } catch (error) {
        alert('Failed to delete tag: ' + error.message);
    }
}

function updateTagSelects() {
    const addContainer = document.getElementById('expenseTagsContainer');
    const editContainer = document.getElementById('editExpenseTagsContainer');
    
    let html = '';
    let hasAnyTags = false;

    categories.forEach(category => {
        const tags = allTags[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `<div class="mb-2"><strong class="d-block text-muted small">${category.name}</strong>`;
            tags.forEach(tag => {
                html += `
                    <div class="form-check">
                        <input class="form-check-input tag-checkbox" type="checkbox" value="${tag.id}" id="tag-${tag.id}">
                        <label class="form-check-label small" for="tag-${tag.id}">${tag.name}</label>
                    </div>
                `;
            });
            html += '</div>';
        }
    });

    if (!hasAnyTags) {
        html = '<p class="text-muted small mb-0">No tags available</p>';
    }

    addContainer.innerHTML = html;
}

// ========== EXPENSES ==========

async function handleAddExpense() {
    const name = document.getElementById('expenseName').value;
    const price = parseFloat(document.getElementById('expensePrice').value);
    const categoryId = document.getElementById('expenseCategory').value;

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    const selectedTags = Array.from(document.querySelectorAll('#expenseTagsContainer .tag-checkbox:checked'))
        .map(cb => cb.value);

    try {
        // Create expense
        const response = await fetch(`${API_BASE_URL}/expense`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                price,
                category_id: categoryId
            })
        });

        if (!response.ok) throw new Error('Failed to create expense');

        const newExpense = await response.json();

        // Link tags to expense
        for (const tagId of selectedTags) {
            try {
                await fetch(`${API_BASE_URL}/expense/${newExpense.id}/tag/${tagId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
            } catch (error) {
                console.error('Error linking tag:', error);
            }
        }

        bootstrap.Modal.getInstance(document.getElementById('addExpenseModal')).hide();
        document.getElementById('addExpenseForm').reset();
        await loadExpenses();
    } catch (error) {
        alert('Failed to add expense: ' + error.message);
    }
}

function renderExpenses() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-receipt fs-1 text-muted"></i>
                        <p class="text-muted mt-3">No expenses yet. Click "Add Expense" to get started!</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const category = categories.find(c => c.id === expense.category_id);
        const tags = expense.tags || [];

        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title mb-0">${expense.name}</h5>
                            <span class="badge bg-success fs-6">$${parseFloat(expense.price).toFixed(2)}</span>
                        </div>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-folder me-1"></i>${category ? category.name : 'No Category'}
                        </p>
                        ${tags.length > 0 ? `
                            <div class="mb-3">
                                ${tags.map(tag => `<span class="badge bg-secondary me-1">${tag.name}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editExpense('${expense.id}')">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deleteExpense('${expense.id}')">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function editExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpensePrice').value = expense.price;
    document.getElementById('editExpenseCategory').value = expense.category_id || '';

    // Render tags with current expense tags
    const container = document.getElementById('editExpenseTagsContainer');
    const expenseTagIds = (expense.tags || []).map(t => t.id);
    
    let html = '';
    let hasAnyTags = false;

    categories.forEach(category => {
        const tags = allTags[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `<div class="mb-2"><strong class="d-block text-muted small">${category.name}</strong>`;
            tags.forEach(tag => {
                const isLinked = expenseTagIds.includes(tag.id);
                html += `
                    <div class="form-check d-flex justify-content-between align-items-center">
                        <div>
                            <input class="form-check-input" type="checkbox" ${isLinked ? 'checked' : ''} 
                                   id="edit-tag-${tag.id}" data-tag-id="${tag.id}" 
                                   onchange="toggleExpenseTag('${expense.id}', '${tag.id}', this.checked)">
                            <label class="form-check-label small" for="edit-tag-${tag.id}">${tag.name}</label>
                        </div>
                        ${isLinked ? '<span class="badge bg-success small">Linked</span>' : ''}
                    </div>
                `;
            });
            html += '</div>';
        }
    });

    if (!hasAnyTags) {
        html = '<p class="text-muted small mb-0">No tags available</p>';
    }

    container.innerHTML = html;

    new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
}

async function toggleExpenseTag(expenseId, tagId, shouldLink) {
    try {
        const url = `${API_BASE_URL}/expense/${expenseId}/tag/${tagId}`;
        const method = shouldLink ? 'POST' : 'DELETE';
        
        const response = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to update tag');

        await loadExpenses();
    } catch (error) {
        console.error('Error toggling tag:', error);
        alert('Failed to update tag: ' + error.message);
    }
}

async function handleUpdateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const name = document.getElementById('editExpenseName').value;
    const price = parseFloat(document.getElementById('editExpensePrice').value);
    const categoryId = document.getElementById('editExpenseCategory').value;

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                price,
                category_id: categoryId
            })
        });

        if (!response.ok) throw new Error('Failed to update expense');

        bootstrap.Modal.getInstance(document.getElementById('editExpenseModal')).hide();
        await loadExpenses();
    } catch (error) {
        alert('Failed to update expense: ' + error.message);
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to delete expense');

        await loadExpenses();
    } catch (error) {
        alert('Failed to delete expense: ' + error.message);
    }
}
