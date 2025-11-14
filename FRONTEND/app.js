// Configuration - Replace with your actual API URL
const API_BASE_URL = 'https://finance-tracker-vqwo.onrender.com';

// ==================== STATE MANAGEMENT ====================
let accessToken = null;
let refreshToken = null;
let currentUser = null;
let categories = [];
let expenses = [];
let tagsByCategory = {}; // { category_id: [tags] }

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    accessToken = localStorage.getItem('accessToken');
    refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
        showApp();
        loadAllData();
    } else {
        showAuth();
    }

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Category form
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    
    // Tag form
    document.getElementById('addTagForm').addEventListener('submit', handleAddTag);
    
    // Expense forms
    document.getElementById('saveExpenseBtn').addEventListener('click', handleAddExpense);
    document.getElementById('updateExpenseBtn').addEventListener('click', handleUpdateExpense);
}

// ==================== AUTHENTICATION ====================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Invalid credentials');
        }

        const data = await response.json();
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        errorDiv.classList.add('d-none');
        document.getElementById('loginForm').reset();
        showApp();
        await loadAllData();
        
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        errorDiv.classList.remove('d-none');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
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

        successDiv.textContent = data.message || 'User created successfully! Please login.';
        successDiv.classList.remove('d-none');
        errorDiv.classList.add('d-none');
        document.getElementById('registerForm').reset();
        
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
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear everything
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    accessToken = null;
    refreshToken = null;
    currentUser = null;
    categories = [];
    expenses = [];
    tagsByCategory = {};
    
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

// ==================== DATA LOADING ====================
async function loadAllData() {
    try {
        await loadCategories();
        await loadExpenses();
        await loadAllTags();
    } catch (error) {
        console.error('Error loading data:', error);
    }
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
        renderCategories();
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
        renderExpenses();
    }
}

async function loadAllTags() {
    tagsByCategory = {};
    
    for (const category of categories) {
        try {
            const response = await fetch(`${API_BASE_URL}/category/${category.id}/tag`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (response.ok) {
                tagsByCategory[category.id] = await response.json();
            } else {
                tagsByCategory[category.id] = [];
            }
        } catch (error) {
            console.error(`Error loading tags for category ${category.id}:`, error);
            tagsByCategory[category.id] = [];
        }
    }
    
    renderTags();
    updateTagSelections();
}

// ==================== CATEGORIES ====================
async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('categoryName').value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/category`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create category');
        }

        document.getElementById('addCategoryForm').reset();
        await loadCategories();
        await loadAllTags();
        showNotification('Category created successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-folder text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">No categories yet. Create your first category!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <div class="d-flex align-items-center">
                <i class="bi bi-folder-fill text-primary me-3 fs-5"></i>
                <div class="flex-grow-1">
                    <strong>${escapeHtml(cat.name)}</strong>
                    <small class="text-muted d-block">
                        ${cat.expense ? cat.expense.length : 0} expenses, 
                        ${cat.tag ? cat.tag.length : 0} tags
                    </small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `).join('');
}

async function deleteCategory(id) {
    if (!confirm('Delete this category? All associated expenses and tags will also be deleted.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/category/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to delete category');

        await loadAllData();
        showNotification('Category deleted successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
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
        const options = categories.map(cat => 
            `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Choose a category...</option>' + options;
        
        if (currentValue && categories.find(c => c.id == currentValue)) {
            select.value = currentValue;
        }
    });
}

// ==================== TAGS ====================
async function handleAddTag(e) {
    e.preventDefault();
    const categoryId = document.getElementById('tagCategory').value;
    const name = document.getElementById('tagName').value.trim();

    if (!categoryId) {
        showNotification('Please select a category', 'warning');
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

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create tag');
        }

        document.getElementById('addTagForm').reset();
        await loadAllTags();
        showNotification('Tag created successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

function renderTags() {
    const container = document.getElementById('tagsList');
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-tags text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">Create categories first to add tags.</p>
            </div>
        `;
        return;
    }

    let hasAnyTags = false;
    let html = '';

    categories.forEach(category => {
        const tags = tagsByCategory[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `
                <div class="mb-4">
                    <h6 class="text-primary mb-3">
                        <i class="bi bi-folder-fill me-2"></i>${escapeHtml(category.name)}
                    </h6>
                    <div class="d-flex flex-wrap gap-2">
                        ${tags.map(tag => `
                            <span class="tag-badge">
                                <i class="bi bi-tag-fill me-1"></i>${escapeHtml(tag.name)}
                                <button class="btn-tag-delete" onclick="deleteTag('${tag.id}')" 
                                        title="Delete tag">
                                    <i class="bi bi-x-circle-fill"></i>
                                </button>
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    if (!hasAnyTags) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-tags text-muted" style="font-size: 3rem;"></i>
                <p class="text-muted mt-3">No tags yet. Add tags to your categories!</p>
            </div>
        `;
    } else {
        container.innerHTML = html;
    }
}

async function deleteTag(id) {
    if (!confirm('Delete this tag? It will be removed from all expenses.')) return;

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
        showNotification('Tag deleted successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

function updateTagSelections() {
    updateTagsForExpense('addExpenseTagsList', []);
}

function updateTagsForExpense(containerId, currentTagIds = []) {
    const container = document.getElementById(containerId);
    
    let hasAnyTags = false;
    let html = '';

    categories.forEach(category => {
        const tags = tagsByCategory[category.id] || [];
        if (tags.length > 0) {
            hasAnyTags = true;
            html += `
                <div class="mb-3">
                    <strong class="d-block text-muted mb-2">${escapeHtml(category.name)}</strong>
                    ${tags.map(tag => {
                        const isChecked = currentTagIds.includes(tag.id);
                        const checkboxId = `${containerId}-tag-${tag.id}`;
                        return `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" 
                                       value="${tag.id}" id="${checkboxId}" 
                                       ${isChecked ? 'checked' : ''}>
                                <label class="form-check-label" for="${checkboxId}">
                                    ${escapeHtml(tag.name)}
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    });

    if (!hasAnyTags) {
        container.innerHTML = '<p class="text-muted small mb-0">No tags available. Create tags in the Tags section.</p>';
    } else {
        container.innerHTML = html;
    }
}

// ==================== EXPENSES ====================
async function handleAddExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const price = parseFloat(document.getElementById('expensePrice').value);
    const categoryId = document.getElementById('expenseCategory').value;

    if (!categoryId) {
        showNotification('Please select a category', 'warning');
        return;
    }

    if (isNaN(price) || price < 0) {
        showNotification('Please enter a valid price', 'warning');
        return;
    }

    const selectedTagIds = Array.from(
        document.querySelectorAll('#addExpenseTagsList input[type="checkbox"]:checked')
    ).map(cb => cb.value);

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
                category_id: parseInt(categoryId)
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create expense');
        }

        const newExpense = await response.json();

        // Link tags to expense
        for (const tagId of selectedTagIds) {
            try {
                await fetch(`${API_BASE_URL}/expense/${newExpense.id}/tag/${tagId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
            } catch (error) {
                console.error('Error linking tag:', error);
            }
        }

        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
        modal.hide();
        document.getElementById('addExpenseForm').reset();
        
        await loadExpenses();
        showNotification('Expense added successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

function renderExpenses() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="bi bi-receipt-cutoff text-muted" style="font-size: 4rem;"></i>
                    <p class="text-muted mt-3 mb-0">No expenses yet. Click "Add Expense" to get started!</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = expenses.map(expense => {
        const category = categories.find(c => String(c.id) === String(expense.category_id));
        const tags = expense.tag || [];

        return `
            <div class="col-md-6 col-lg-4">
                <div class="expense-card">
                    <div class="expense-header">
                        <h5 class="expense-title">${escapeHtml(expense.name)}</h5>
                        <span class="expense-price">$${parseFloat(expense.price).toFixed(2)}</span>
                    </div>

                    <div class="expense-category">
                        <i class="bi bi-folder-fill me-2"></i>
                        ${category ? escapeHtml(category.name) : 'No Category'}
                    </div>

                    <div class="mt-2">
                        ${
                            tags.length > 0
                            ? tags.map(t => `<span class="badge bg-secondary me-1">${escapeHtml(t.name)}</span>`).join("")
                            : "<small class='text-muted'>No tags</small>"
                        }
                    </div>

                    <div class="expense-actions">
                        <button class="btn btn-sm btn-outline-info" onclick="viewExpense('${expense.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editExpense('${expense.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense('${expense.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


async function viewExpense(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load expense');
        
        const expense = await response.json();
        const category = categories.find(c => c.id == expense.category_id);
        const tags = expense.tag || [];
        
        const detailsHtml = `
            <div class="expense-details">
                <div class="detail-row">
                    <strong>Name:</strong>
                    <span>${escapeHtml(expense.name)}</span>
                </div>
                <div class="detail-row">
                    <strong>Price:</strong>
                    <span class="text-success fs-5">$${parseFloat(expense.price).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <strong>Category:</strong>
                    <span><i class="bi bi-folder-fill text-primary me-2"></i>${category ? escapeHtml(category.name) : 'No Category'}</span>
                </div>
                ${tags.length > 0 ? `
                    <div class="detail-row">
                        <strong>Tags:</strong>
                        <div class="mt-2">
                            ${tags.map(tag => `
                                <span class="badge bg-secondary me-1">
                                    <i class="bi bi-tag-fill me-1"></i>${escapeHtml(tag.name)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('expenseDetails').innerHTML = detailsHtml;
        new bootstrap.Modal(document.getElementById('viewExpenseModal')).show();
        
    } catch (error) {
        showNotification('Failed to load expense details', 'danger');
    }
}

function editExpense(id) {
    const expense = expenses.find(e => e.id == id);
    if (!expense) return;

    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('editExpenseName').value = expense.name;
    document.getElementById('editExpensePrice').value = expense.price;
    document.getElementById('editExpenseCategory').value = expense.category_id || '';

    const currentTagIds = (expense.tag || []).map(t => t.id);
    updateTagsForExpense('editExpenseTagsList', currentTagIds);

    new bootstrap.Modal(document.getElementById('editExpenseModal')).show();
}

async function handleUpdateExpense() {
    const id = document.getElementById('editExpenseId').value;
    const name = document.getElementById('editExpenseName').value.trim();
    const price = parseFloat(document.getElementById('editExpensePrice').value);
    const categoryId = document.getElementById('editExpenseCategory').value;

    if (!categoryId) {
        showNotification('Please select a category', 'warning');
        return;
    }

    if (isNaN(price) || price < 0) {
        showNotification('Please enter a valid price', 'warning');
        return;
    }

    const selectedTagIds = Array.from(
        document.querySelectorAll('#editExpenseTagsList input[type="checkbox"]:checked')
    ).map(cb => cb.value);

    try {
        // Update expense
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                price,
                category_id: parseInt(categoryId)
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update expense');
        }

        // Manage tags
        const expense = expenses.find(e => e.id == id);
        const currentTagIds = (expense.tag || []).map(t => String(t.id));

        // Remove tags that were unchecked
        for (const tagId of currentTagIds) {
            if (!selectedTagIds.includes(tagId)) {
                try {
                    await fetch(`${API_BASE_URL}/expense/${id}/tag/${tagId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${accessToken}` }
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
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                } catch (error) {
                    console.error('Error adding tag:', error);
                }
            }
        }

        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('editExpenseModal'));
        modal.hide();
        
        await loadExpenses();
        showNotification('Expense updated successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to delete expense');

        await loadExpenses();
        showNotification('Expense deleted successfully!', 'success');
        
    } catch (error) {
        showNotification(error.message, 'danger');
    }
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
