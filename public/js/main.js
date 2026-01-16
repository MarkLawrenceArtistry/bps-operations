import * as api from './api.js'
import * as render from './render.js'

let currentAccount = null;

document.addEventListener('DOMContentLoaded', () => {


    // *********** CONSTANTS *************
    const loginForm = document.querySelector('#login-form');
    const accountForm = document.querySelector('#account-form');
    const inventoryCategoryForm = document.querySelector('#inventory-category-form');
    const inventoryForm = document.querySelector('#inventory-form');

    const logoutBtn = document.querySelector('#logout-button');
    const createAccountBtn = document.querySelector('#create-account-btn');
    const cancelAccountBtn = document.querySelector('#cancel-account-btn');
    const createInventoryCategoryBtn = document.querySelector('#create-inventory-category-btn');
    const cancelInventoryCategoryBtn = document.querySelector('#cancel-inventory-category-btn');
    const createInventoryBtn = document.querySelector('#create-inventory-btn');
    const cancelInventoryBtn = document.querySelector('#cancel-inventory-btn');

    const accountListDiv = document.querySelector('#account-list');
    const inventoryCategoriesListDiv = document.querySelector('#inventory-category-list');
    const inventoryListDiv = document.querySelector('#inventory-list');
    const openCategoryFormBtn = document.querySelector('#open-category-form-btn');
    
    // Form Wrappers
    const inventoryFormWrapper = document.getElementById('inventory-form-wrapper');
    const categoryFormWrapper = document.getElementById('category-form-wrapper');
    const categoryManagementArea = document.getElementById('category-management-area');




    // *********** HELPER FUNCTIONS *************
    async function checkSession() {
        try {
            const token = JSON.parse(localStorage.getItem('token'));
            // kailangan ng token dito para dumaan siya sa verifyToken middleware pero di na siya gagamitin sa controller
			const result = await api.checkSession(token);
            currentAccount = result.user;
            applyRoleBasedUI();
		} catch(err) {
            alert(`Error: ${err.message}`);
			if(err.message === "Invalid or expired token.") {
                localStorage.removeItem('token')
                location.href = 'index.html';
            }
		}
    }
    function applyRoleBasedUI() {
        if (!currentAccount) return;

        if (currentAccount.role_id === 2) {
            const adminLinks = document.querySelectorAll('.admin-nav');
            adminLinks.forEach(link => {
                link.style.display = 'none';
            });
        }
    }



    // *********** RENDERERS *************
    async function loadData(api_method, render_method, div_container) {
        try {
            const token = JSON.parse(localStorage.getItem('token'));
			const result = await api_method(token);
			render_method(result, div_container);
		} catch(err) {
            alert(`Error: ${err.message}`);
			if(err.message === "Invalid or expired token.") {
                localStorage.removeItem('token')
                location.href = 'index.html';
            }
		}
    }
    async function populateCategories() {
        try {
            const token = JSON.parse(localStorage.getItem('token'));
            const categories = await api.getAllInventoryCategories(token);
            const categorySelect = document.querySelector('#inventory-category');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category..</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (err) {
            console.error('Error populating categories:', err);
        }
    }




    // *********** ACCOUNTS/AUTHENTICATION *************
    // (AUTH) LOGIN
    if(loginForm) {
        console.log(loginForm)
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const credentials = {
                email: loginForm.querySelector('#login-email').value.trim(),
                password: loginForm.querySelector('#login-password').value.trim()
            }

            try {
                const data = await api.loginAccount(credentials);
                localStorage.setItem('token', JSON.stringify(data.token));
                
                currentAccount = data.user;
                alert(`User ${data.user.username} successfully logged in.`);

                loginForm.reset();
                location.href = 'dashboard.html';
            } catch(err) {
                alert(`Error: ${err.message}`)
            }
        })
    }
    // (AUTH) LOGOUT
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if(confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                location.reload();
            }
        })
    }
    const formWrapper = document.querySelector('.form-wrapper');

    // (AUTH) CREATE/UPDATE
    if(createAccountBtn) {
        createAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();

            accountForm.reset();
            if (formWrapper) formWrapper.classList.remove('hidden-area');
            if (createAccountBtn) createAccountBtn.classList.add('hidden-area');
            accountForm.querySelector('#form-title').innerText = "Create New Account";
        })
    }
    if(cancelAccountBtn) {
        cancelAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();

            accountForm.reset();
            if (formWrapper) formWrapper.classList.add('hidden-area');
            if (createAccountBtn) createAccountBtn.classList.remove('hidden-area');
        })
    }
    if(accountForm) {
        // Prevent emoji in input tags
        const usernameTextbox = accountForm.querySelector('#account-username');
        if(usernameTextbox) {
            usernameTextbox.addEventListener( "input", event => {
                const target = event.target;
                const regex = /[^\p{L}\p{N}\p{P}\p{Z}\s]/gu; 

                if (regex.test(target.value)) {
                    target.value = target.value.replace(regex, '');
                }
            }, false);
        }

        // CREATE/UPDATE Form
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const data = {
                    username: accountForm.querySelector('#account-username').value.trim() || null,
                    email: accountForm.querySelector('#account-email').value.trim() || null,
                    role_id: accountForm.querySelector('#account-role').value || null,
                    password: accountForm.querySelector('#account-password').value.trim() || null
                }

                const user_id = accountForm.querySelector('#account-id').value;
                const token = JSON.parse(localStorage.getItem('token'));
                if(user_id) {
                    await api.updateAccount(data, token, user_id);
                    alert("Account updated successfully!");
                } else {
                    await api.createAccount(data, token);
                    alert("Account created successfully!");
                }

                location.reload();
                accountForm.reset();
            } catch(err) {
                alert(`Error: ${err.message}`);
            }
        })
    }
    // (AUTH) TABLE EVENT LISTENER (UPDATE/DELETE)
    if(accountListDiv) {
        loadData(api.getAllAccounts, render.renderAccountsTable, accountListDiv);

        accountListDiv.addEventListener('click', async (e) => {
            // Dropdown Toggle Logic
            if (e.target.closest('.action-btn')) {
                e.preventDefault();
                const dropdown = e.target.closest('.action-dropdown').querySelector('.dropdown-content');
                document.querySelectorAll('.dropdown-content').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
                return;
            }

            // Close dropdowns when clicking elsewhere
            if (!e.target.closest('.action-dropdown')) {
                document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
            }

            if (e.target.closest('.btn')) {
                // Keep the row action logic below
            } else {
                return;
            }

            e.preventDefault();

            const row = e.target.closest('tr');
            const account_id = row.dataset.id;
            const token = JSON.parse(localStorage.getItem('token'));

            if(e.target.classList.contains('edit-btn')) {
                accountForm.reset();
                const formWrapper = document.querySelector('.form-wrapper');
                if (formWrapper) formWrapper.style.display = "block";
                if (createAccountBtn) createAccountBtn.style.display = "none";
                accountForm.style.display = "flex"
                cancelAccountBtn.style.display = "block"

                const account = await api.getAccount(account_id, token)
                accountForm.querySelector('#form-title').innerText = "Update Existing Account"

                accountForm.querySelector('#account-username').value = account.username
                accountForm.querySelector('#account-email').value = account.email
                accountForm.querySelector('#account-role').value = account.role === 1 ? "1" : "2"; 
                accountForm.querySelector('#account-password').value = "";
                accountForm.querySelector('#account-id').value = account.id;
            }

            if(e.target.classList.contains('delete-btn')) {
                if(confirm("Are you sure you want to delete this account?")) {
                    try {
                        await api.deleteAccount(account_id, token)
                        location.reload()
                    } catch(err) {
                        alert(`Error: ${err.message}`)
                    }
                }
            }

            if(e.target.classList.contains('disable-btn')) {
                if(confirm("Are you sure you want to disable this account?")) {
                    try {
                        await api.disableAccount(account_id, token)
                        location.reload()
                    } catch(err) {
                        alert(`Error: ${err.message}`)
                    }
                }
            }
        })
    }
    


    // *********** INVENTORY *************
    // (INVENTORY CATEGORIES) CREATE
    // (INVENTORY CATEGORIES) MANAGE/CREATE
    // (INVENTORY) CREATE/UPDATE Forms toggling

    if(createInventoryCategoryBtn) {
        createInventoryCategoryBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Toggle category management area (the table)
            const isHidden = !categoryManagementArea || categoryManagementArea.classList.contains('hidden-area');
            if (categoryManagementArea) {
                if (isHidden) categoryManagementArea.classList.remove('hidden-area');
                else categoryManagementArea.classList.add('hidden-area');
            }
            createInventoryCategoryBtn.classList.toggle('active', isHidden);

            // Hide the category form if it was open
            if (categoryFormWrapper) categoryFormWrapper.classList.add('hidden-area');
        })
    }
    if(cancelInventoryCategoryBtn) {
        cancelInventoryCategoryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (categoryFormWrapper) categoryFormWrapper.classList.add('hidden-area');
        })
    }
    if(openCategoryFormBtn) {
        openCategoryFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            inventoryCategoryForm.reset();
            
            // Mutual exclusion: Hide inventory form if it was open
            if (inventoryFormWrapper) inventoryFormWrapper.classList.add('hidden-area');
            if (createInventoryBtn) createInventoryBtn.classList.remove('hidden-area');

            if (categoryFormWrapper) categoryFormWrapper.classList.remove('hidden-area');
        })
    }

    if(inventoryCategoryForm) {
        inventoryCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const data = {
                    name: inventoryCategoryForm.querySelector('#inventory-category-name').value.trim() || null,
                    description: inventoryCategoryForm.querySelector('#inventory-category-description').value.trim() || null,
                    staff_id: currentAccount.id
                }

                const inventory_category_id = inventoryCategoryForm.querySelector('#inventory-category-id').value;
                const token = JSON.parse(localStorage.getItem('token'));
                if(inventory_category_id) {
                    // await api.updateAccount(data, token, user_id);
                    // alert("Account updated successfully!");
                    return;
                } else {
                    await api.createInventoryCategory(data, token);
                    alert("Inventory category created successfully!");
                }

                location.reload();
                inventoryCategoryForm.reset();
            } catch(err) {
                alert(`Error: ${err.message}`);
            }
        })
    }
    // (INVENTORY CATEGORIES) TABLE EVENT LISTENER (DELETE)
    if(inventoryCategoriesListDiv) {
        // api.getAllInventoryCategories, render.renderInventoryCategoriesTable, inventoryCategoriesListDiv
        loadData(api.getAllInventoryCategories, render.renderInventoryCategoriesTable, inventoryCategoriesListDiv);

        inventoryCategoriesListDiv.addEventListener('click', async (e) => {
            e.preventDefault();

            const row = e.target.closest('tr');
            const inventory_category_id = row.dataset.id;
            const token = JSON.parse(localStorage.getItem('token'));

            if(e.target.classList.contains('delete-btn')) {
                if(confirm("Are you sure you want to delete this inventory category?")) {
                    try {
                        await api.deleteInventoryCategory(inventory_category_id, token)
                        location.reload()
                    } catch(err) {
                        alert(`Error: ${err.message}`)
                    }
                }
            }
        })
    }
    // (INVENTORY) TABLE EVENT LISTENER (UPDATE/DELETE)
    if(inventoryListDiv) {
        loadData(api.getAllInventory, render.renderInventoryTable, inventoryListDiv);

        inventoryListDiv.addEventListener('click', async (e) => {
            e.preventDefault();

            const row = e.target.closest('tr');
            const inventory_id = row.dataset.id;
            const token = JSON.parse(localStorage.getItem('token'));
            console.log(row)

            if(e.target.classList.contains('edit-btn')) {
                if (inventoryFormWrapper) inventoryFormWrapper.classList.remove('hidden-area');
                if (createInventoryBtn) createInventoryBtn.classList.add('hidden-area');
                
                // Hide category form if open
                if (categoryFormWrapper) categoryFormWrapper.classList.add('hidden-area');

                const previewImg = inventoryForm.querySelector('#form-image-preview');
                if (previewImg) previewImg.classList.remove('hidden-area');
                inventoryForm.reset();

                const inventoryItem = await api.getInventory(inventory_id, token)
                inventoryForm.querySelector('#form-title').innerText = "Update Existing Inventory Item"
                
                await populateCategories();

                inventoryForm.querySelector('#inventory-name').value = inventoryItem.name
                inventoryForm.querySelector('#inventory-category').value = inventoryItem.category_id;
                inventoryForm.querySelector('#inventory-quantity').value = inventoryItem.quantity; 
                inventoryForm.querySelector('#inventory-minstock').value = inventoryItem.min_stock_level;
                if (previewImg) previewImg.src = inventoryItem.image_url;
                inventoryForm.querySelector('#inventory-id').value = inventoryItem.id;
            }

            if(e.target.classList.contains('delete-btn')) {
                if(confirm("Are you sure you want to delete this inventory item?")) {
                    try {
                        await api.deleteInventory(inventory_id, token)
                        location.reload()
                    } catch(err) {
                        alert(`Error: ${err.message}`)
                    }
                }
            }
        })
    }
    // (INVENTORY) CREATE
    if(createInventoryBtn) {
        createInventoryBtn.addEventListener('click', (e) => {
            e.preventDefault();

            inventoryForm.reset(); 
            
            const previewImg = inventoryForm.querySelector('#form-image-preview');

            inventoryForm.querySelector('#inventory-id').value = "";
            if (previewImg) {
                previewImg.src = "";
                previewImg.style.display = "none"; 
            }
            inventoryForm.querySelector('#form-title').innerText = "Create New Inventory Item";
            populateCategories();

            // Mutual exclusion: Hide category form if it was open
            if (categoryFormWrapper) categoryFormWrapper.classList.add('hidden-area');

            if (inventoryFormWrapper) inventoryFormWrapper.classList.remove('hidden-area');
            if (createInventoryBtn) createInventoryBtn.classList.add('hidden-area');
        })
    }
    if(cancelInventoryBtn) {
        cancelInventoryBtn.addEventListener('click', (e) => {
            e.preventDefault();

            inventoryForm.reset();
            if (inventoryFormWrapper) inventoryFormWrapper.classList.add('hidden-area');
            if (createInventoryBtn) createInventoryBtn.classList.remove('hidden-area');
            
            const previewImg = inventoryForm.querySelector('#form-image-preview');
            if (previewImg) previewImg.classList.add('hidden-area');
        })
    }
    if(inventoryForm) {
        inventoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                let formData = new FormData();

                const name = inventoryForm.querySelector('#inventory-name').value
                if(name) formData.append('name', name)
                
                const category_id = inventoryForm.querySelector('#inventory-category').value
                if(category_id) formData.append('category_id', category_id)

                const quantity = inventoryForm.querySelector('#inventory-quantity').value
                if (quantity) formData.append('quantity', quantity)
                
                const min_stock_level = inventoryForm.querySelector('#inventory-minstock').value
                if(min_stock_level) formData.append('min_stock_level', min_stock_level) 

                const fileInput = inventoryForm.querySelector('#inventory-image')
                if(fileInput.files[0]) {
                    formData.append('image', fileInput.files[0])
                }

                const staff_id = currentAccount.id
                if(staff_id) formData.append('staff_id', staff_id) 

                const id = inventoryForm.querySelector('#inventory-id').value;
                const token = JSON.parse(localStorage.getItem('token'));

                if(id) {
                    await api.updateInventory(formData, id, token)
                    alert('Inventory item updated successfully!')
                } else {
                    await api.createInventory(formData, token)
                    alert('Inventory item created successfully!')
                }
                

                location.reload();
            } catch(err) {
                alert(`Error: ${err.message}`)
            }
        })
    }



    // (DASHBOARD) INITIALIZATION
    async function initDashboard() {
        const lowStockList = document.querySelector('#low-stock-list');
        const lowStockCountEl = document.querySelector('.card:nth-child(1) .card-value'); // First summary card
        
        if (!lowStockList) return;

        try {
            const token = JSON.parse(localStorage.getItem('token'));
            const inventory = await api.getAllInventory(token);
            
            const lowStockItems = inventory.filter(item => item.quantity <= item.min_stock_level);
            
            // Update summary card value
            if (lowStockCountEl) {
                lowStockCountEl.textContent = lowStockItems.length;
            }

            // Render widget list
            render.renderLowStockWidget(lowStockItems, lowStockList);
        } catch (err) {
            console.error('Error initializing dashboard:', err);
            if (lowStockList) {
                lowStockList.innerHTML = `<p class="no-data">Failed to load stock data.</p>`;
            }
        }
    }

    // (AUTH) GATEKEEPERS
    if(!window.location.pathname.endsWith('index.html')) {
        checkSession();
        
        // Initialize page specific data
        if(window.location.pathname.endsWith('dashboard.html')) {
            initDashboard();
        }

        if(!localStorage.getItem('token')) {
            alert('You must be logged in to view this page. Redirecting..')
            window.location.href = 'index.html'
        }
    }
    if(window.location.pathname.endsWith('index.html') && localStorage.getItem('token')) {
        alert("You have an existing session. Logging in.");
        location.href = 'dashboard.html';
    }
})