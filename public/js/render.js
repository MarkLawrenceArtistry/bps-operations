


// ACCOUNTS/AUTHENTICATION
export function renderAccountsTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table')
	table.className = 'accounts table'
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role ID</th>
                <th>Created at</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;
        row.className = 'account-item';

        let roleVal = element.role_id === 1 ? '1' : '2';
        
        // Formatting date if available, otherwise placeholder
        const createdAt = element.created_at ? new Date(element.created_at).toLocaleDateString() : '12/20/2025';

        row.innerHTML = `
            <td>${element.id}</td>
            <td>${element.username}</td>
            <td>${element.email}</td>
            <td>${roleVal}</td>
            <td>${createdAt}</td>
            <td>
                <div class="action-dropdown">
                    <button class='action-btn ripple'>
                        <img src="Icons/Manage User Acc Page/actions_icon.png" alt="Actions" class="action-icon">
                    </button>
                    <div class="dropdown-content">
                        <button class='btn edit-btn'>Edit</button>
                        <button class='btn delete-btn'>Delete</button>
                        <button class='btn disable-btn'>Disable</button>
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
    if(result.length < 1) {
        tbody.innerHTML = `
            <td colspan="6" class="no-data" style="text-align:center;">There is no data here..</td>
        `
    }

    container.appendChild(table)
}


// INVENTORY CATEGORIES
export function renderInventoryCategoriesTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table')
	table.className = 'inventory_categories table'
    table.innerHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;
        row.classname = 'inventory-category-item';

        row.innerHTML = `
            <td>${element.name}</td>
            <td>${element.description}</td>
            <td>
                <div class="action-buttons">
                    <button class='btn delete-btn'>Delete</button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
    if(result.length < 1) {
        tbody.innerHTML = `
            <td colspan="3" class="no-data" style="text-align:center;">There is no data here..</td>
        `
    }

    container.appendChild(table)
}
// INVENTORY
export function renderInventoryTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table')
	table.className = 'inventory table'
    table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Min. Stock Level</th>
                <th>Image</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;
        row.classname = 'inventory-item';

        row.innerHTML = `
            <td>${element.id}</td>
            <td>${element.name}</td>
            <td>${element.category_id}</td>
            <td>${element.quantity}</td>
            <td>${element.min_stock_level}</td>
            <td>
                <img src=${element.image_url} style="height: 100px;">
            </td>
            <td>
                <div class="action-buttons">
                    <button class='btn edit-btn'>Edit</button>
                    <button class='btn delete-btn'>Delete</button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
    if(result.length < 1) {
        tbody.innerHTML = `
            <td colspan="7" class="no-data" style="text-align:center;">There is no data here..</td>
        `
    }

    container.appendChild(table)
}

// DASHBOARD LOW STOCK WIDGET
export function renderLowStockWidget(items, container) {
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<p class="no-data">All items are sufficiently stocked.</p>`;
        return;
    }

    container.innerHTML = '';
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'low-stock-item';

        const isCritical = item.quantity === 0;
        const statusText = isCritical ? 'Critical' : 'Low';
        const badgeClass = isCritical ? 'critical' : 'low';

        itemEl.innerHTML = `
            <div class="item-info">
                <img src="${item.image_url}" alt="${item.name}" class="item-thumb">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>Minimum: ${item.min_stock_level}</p>
                </div>
            </div>
            <div class="item-status">
                <span class="stock-count">${item.quantity} in stock</span>
                <span class="status-badge ${badgeClass}">${statusText}</span>
            </div>
        `;
        container.appendChild(itemEl);
    });
}
