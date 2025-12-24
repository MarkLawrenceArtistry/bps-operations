/* Dashboard Scripts */

/**
 * Dark Mode Toggle Functionality
 */
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/**
 * Initialize Dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check Admin Visibility immediately
    checkAdminVisibility();

    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleDarkMode);
    }

    // Update User Info from Auth
    updateUserInfo();

    // Setup Logout
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Setup form validation
    setupFormValidation();

    // Load initial data if on accounts page
    if (document.getElementById('users-table-body')) {
        loadUsersTable();
    }
});

/**
 * Fetch and Render Users Table
 */
async function loadUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;

    // Show loading state if needed (optional)
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading users...</td></tr>';

    const result = await Auth.getUsers();
    
    if (result.success) {
        const users = result.data;
        tableBody.innerHTML = ''; // Clear loading

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            row.setAttribute('data-role-id', user.role_id);
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role_id === 1 ? 'admin' : 'staff'}">${user.role_id === 1 ? 'Admin' : 'Staff'}</span></td>
                <td><span class="status-indicator ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Active' : 'Disabled'}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-menu">
                        <button class="btn btn-ghost" style="padding: 4px;"
                            onclick="toggleActionMenu(event, 'menu-${user.id}')">
                            <span class="material-icons-round">more_horiz</span>
                        </button>
                        <div id="menu-${user.id}" class="action-dropdown">
                            <button class="action-item" onclick="editUser('${user.id}')">
                                <span class="material-icons-round">edit</span>
                                Edit
                            </button>
                            <div style="height: 1px; background-color: var(--border-color); margin: 4px 0;"></div>
                            <button class="action-item" onclick="toggleUserStatus('${user.id}')">
                                <span class="material-icons-round">${user.is_active ? 'block' : 'check_circle'}</span>
                                ${user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <div style="height: 1px; background-color: var(--border-color); margin: 4px 0;"></div>
                            <button class="action-item delete" onclick="deleteUser('${user.id}')">
                                <span class="material-icons-round">delete_forever</span>
                                Delete User
                            </button>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--accent-red);">Error: ${result.data}</td></tr>`;
    }
}

/**
 * Update Dashboard User Info
 */
function updateUserInfo() {
    const profile = typeof Auth !== 'undefined' ? Auth.getUserProfile() : null;
    if (profile) {
        const usernameEl = document.querySelector('.user-info .username');
        const roleEl = document.querySelector('.user-info .role');
        const welcomeTitle = document.querySelector('.welcome-section h2');

        if (usernameEl) usernameEl.textContent = profile.username || 'User';
        if (roleEl) {
            // Map role_id to string if needed, or use as is
            const roles = { 1: 'Admin', 2: 'Staff' };
            roleEl.textContent = roles[profile.role_id] || 'User';
        }
        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome Back, ${profile.username || 'User'}!`;
        }
    }
}

/**
 * Handle Logout
 */
function handleLogout() {
    if (typeof Auth !== 'undefined') {
        Auth.removeToken();
        window.location.href = '../../Login/pages/login_screen.html';
    }
}

/**
 * Modal Management
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
    }
}

function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility_off';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility';
        }
    }
}

/**
 * Action Menu Functionality
 */
function toggleActionMenu(event, menuId) {
    event.stopPropagation();

    // Close all other open menus first
    document.querySelectorAll('.action-dropdown').forEach(dropdown => {
        if (dropdown.id !== menuId) {
            dropdown.classList.remove('show');
        }
    });

    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Handle action menu clicks
function viewUserDetails(userId) {
    console.log('Viewing details for user:', userId);
    alert('Viewing details for user ID: ' + userId);
}

/**
 * Edit User - Fill modal and open
 */
async function editUser(userId) {
    const result = await Auth.getUsers(); // Get fresh list
    if (result.success) {
        const user = result.data.find(u => String(u.id) === String(userId));
        if (user) {
            document.getElementById('edit-user-id').value = user.id;
            document.getElementById('edit-username').value = user.username;
            document.getElementById('edit-email').value = user.email;
            document.getElementById('edit-role').value = user.role_id;
            document.getElementById('edit-status').value = user.is_active ? '1' : '0';
            document.getElementById('edit-password').value = ''; // Don't show old password
            
            openModal('editAccountModal');
        }
    } else {
        alert('Failed to fetch user details: ' + result.data);
    }
}

/**
 * Toggle User Status (Deactivate/Activate)
 * @param {string} userId 
 */
async function toggleUserStatus(userId) {
    // We don't really need confirmation for simple toggle, but good to have
    const action = document.querySelector(`[onclick="toggleUserStatus('${userId}')"]`).textContent.trim();
    if(confirm(`Are you sure you want to ${action.toLowerCase()} this user?`)) {
        const result = await Auth.toggleUserStatus(userId);
        if(result.success) {
            alert(result.data);
            loadUsersTable();
        } else {
            alert(`Error: ${result.data}`);
        }
    }
}

/**
 * Permanent Delete User
 * @param {string} userId 
 */
async function deleteUser(userId) {
    if(confirm('WARNING: Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) {
        const result = await Auth.deleteUser(userId);
        if(result.success) {
            alert('User deleted permanently.');
            loadUsersTable();
        } else {
            alert(`Error: ${result.data}`);
        }
    }
}

// Close menus when clicking outside
window.addEventListener('click', (event) => {
    if (!event.target.closest('.action-menu')) {
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // Close on overlay click
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = '';
    }
});

/**
 * Table Filtering & Search
 */
function filterByRole(roleId) {
    const table = document.querySelector('.data-table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    const staffBtn = document.getElementById('filter-staffs');
    const adminBtn = document.getElementById('filter-admin');

    // Toggle logic: if clicking active, show all
    let targetRole = roleId;

    const isStaffActive = staffBtn && staffBtn.classList.contains('active-filter');
    const isAdminActive = adminBtn && adminBtn.classList.contains('active-filter');

    if ((roleId === '2' && isStaffActive) || (roleId === '1' && isAdminActive)) {
        targetRole = 'all';
    }

    // Update button states
    if (staffBtn && adminBtn) {
        staffBtn.classList.remove('active-filter');
        adminBtn.classList.remove('active-filter');
        staffBtn.style.opacity = '0.7';
        adminBtn.style.opacity = '0.7';

        if (targetRole === '2') {
            staffBtn.classList.add('active-filter');
            staffBtn.style.opacity = '1';
        } else if (targetRole === '1') {
            adminBtn.classList.add('active-filter');
            adminBtn.style.opacity = '1';
        } else {
            staffBtn.style.opacity = '1';
            adminBtn.style.opacity = '1';
        }
    }

    rows.forEach(row => {
        const rowRoleId = row.getAttribute('data-role-id');
        if (targetRole === 'all' || rowRoleId === targetRole) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function searchAccounts(query) {
    const table = document.querySelector('.data-table');
    const tableContainer = document.querySelector('.table-container');
    const emptyState = document.getElementById('search-empty-state');
    const pagination = document.querySelector('.pagination');

    if (!table || !emptyState) return;

    const rows = table.querySelectorAll('tbody tr');
    const lowerQuery = query.toLowerCase().trim();
    let visibleCount = 0;

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(lowerQuery)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Toggle empty state and table visibility
    if (visibleCount === 0) {
        tableContainer.style.display = 'none';
        if (pagination) pagination.style.display = 'none';
        emptyState.classList.add('show');
    } else {
        tableContainer.style.display = 'block';
        if (pagination) pagination.style.display = 'flex';
        emptyState.classList.remove('show');
    }
}

/**
 * Form Validation Logic
 */
function setupFormValidation() {
    // Add Account Submit
    const addSubmitBtn = document.getElementById('add-account-submit');
    if (addSubmitBtn) {
        addSubmitBtn.addEventListener('click', async () => {
            if (validateForm('addAccountModal')) {
                const userData = {
                    username: document.getElementById('add-username').value,
                    email: document.getElementById('add-email').value,
                    role_id: parseInt(document.getElementById('add-role').value),
                    password: document.getElementById('add-password').value
                };
                
                const result = await Auth.createUser(userData);
                if (result.success) {
                    alert('User created successfully!');
                    closeModal('addAccountModal');
                    loadUsersTable();
                    // Clear form
                    document.getElementById('add-username').value = '';
                    document.getElementById('add-email').value = '';
                    document.getElementById('add-role').value = '';
                    document.getElementById('add-password').value = '';
                } else {
                    alert('Error: ' + result.data);
                }
            }
        });
    }

    // Edit Account Submit
    const editSubmitBtn = document.getElementById('edit-account-submit');
    if (editSubmitBtn) {
        editSubmitBtn.addEventListener('click', async () => {
            const userId = document.getElementById('edit-user-id').value;
            const userData = {
                username: document.getElementById('edit-username').value,
                email: document.getElementById('edit-email').value,
                role_id: parseInt(document.getElementById('edit-role').value),
                is_active: parseInt(document.getElementById('edit-status').value)
            };
            
            const password = document.getElementById('edit-password').value;
            if (password) userData.password = password;

            const result = await Auth.updateUser(userId, userData);
            if (result.success) {
                alert('User updated successfully!');
                closeModal('editAccountModal');
                loadUsersTable();
            } else {
                alert('Error: ' + result.data);
            }
        });
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toggleError(input, isValid) {
    const group = input.closest('.form-group');
    if (!group) return;
    
    if (isValid) {
        group.classList.remove('error');
    } else {
        group.classList.add('error');
    }
}

function validateForm(modalId) {
    let isValid = true;
    
    if (modalId === 'addAccountModal') {
        const username = document.getElementById('add-username');
        const email = document.getElementById('add-email');
        const role = document.getElementById('add-role');
        const password = document.getElementById('add-password');

        if (!username.value.trim()) {
            toggleError(username, false);
            isValid = false;
        } else {
            toggleError(username, true);
        }

        if (!validateEmail(email.value)) {
            toggleError(email, false);
            isValid = false;
        } else {
            toggleError(email, true);
        }

        if (!role.value) {
            toggleError(role, false);
            isValid = false;
        } else {
            toggleError(role, true);
        }

        if (password.value.length < 8) {
            toggleError(password, false);
            isValid = false;
        } else {
            toggleError(password, true);
        }
    }
    
    return isValid;
}

/**
 * Check user role and toggle visibility of Admin functions
 */
function checkAdminVisibility() {
    const user = Auth.getUserProfile();
    // If user is not logged in, Auth.js handles redirect, so we just return
    if (!user) return;

    if (user.role_id !== 1) { // 1 is Admin
        // Hide Admin Sidebar Group
        const adminNav = document.getElementById('admin-nav-group');
        if (adminNav) {
            adminNav.style.display = 'none';
        }

        // Restrict Access to User Accounts Page
        if (window.location.href.includes('user_accounts.html')) {
            alert('Access Denied: You do not have permission to view this page.');
            window.location.href = 'dashboard.html';
        }
    }
}
