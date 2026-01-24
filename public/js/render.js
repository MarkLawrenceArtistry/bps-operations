


// ACCOUNTS/AUTHENTICATION
export function renderAccountsTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table')
	table.className = 'accounts table'
    table.innerHTML = `
        <thead>
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;
        row.classname = 'account-item';

        let roleVal = '';
        if(element.role_id == 1) {
            roleVal = 'Admin';
        } else if(element.role_id == 2) {
            roleVal = 'Staff';
        }

        let isActiveVal = '';
        if(element.is_active === 1) {
            isActiveVal = '<span class="status-badge active">Active</span>';
        } else if(element.is_active === 0) {
            isActiveVal = '<span class="status-badge critical">Disabled</span>';
        }

        let toggleBtn = '';
        if(element.is_active === 1) {
            toggleBtn = `<button class='btn disable-btn'>Disable</button>`;
        } else {
            toggleBtn = `<button class='btn enable-btn'>Enable</button>`;
        }

        row.innerHTML = `
            <td>${element.username}</td>
            <td>${element.email}</td>
            <td>${roleVal}</td>
            <td>${isActiveVal}</td>
            <td>
                <div class="action-buttons">
                    <button class='btn edit-btn'>Edit</button>
                    <button class='btn delete-btn'>Delete</button>
                    ${toggleBtn}
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
    if(result.length < 1) {
        tbody.innerHTML = `
            <td colspan="4" class="no-data" style="text-align:center;">There is no data here..</td>
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
                <th>ID</th>
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
            <td>${element.id}</td>
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
            <td colspan="4" class="no-data" style="text-align:center;">There is no data here..</td>
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



// SELLERS TABLE
export function renderSellersTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table');
    table.className = 'seller table'; // Consistent class name
    table.innerHTML = `
        <thead>
            <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Platform</th>
                <th>Contact Info</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;
        
        // Handle image: check if path exists or use a placeholder if needed
        const imgDisplay = element.image_path 
            ? `<img src="${element.image_path}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` 
            : `<span style="font-size:0.8rem; color:#ccc;">No Img</span>`;

        row.innerHTML = `
            <td>${imgDisplay}</td>
            <td><strong>${element.name}</strong></td>
            <td>${element.category}</td>
            <td><span class="status-badge" style="background:#e0f2fe; color:#0369a1;">${element.platform_name}</span></td>
            <td>
                <div style="font-size: 0.85rem;">
                    <div>📞 ${element.contact_num}</div>
                    <div style="color: #6b7280;">✉️ ${element.email}</div>
                </div>
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
            <td colspan="6" class="no-data" style="text-align:center; padding: 2rem;">No sellers found.</td>
        `;
    }

    container.appendChild(table);
}



// RTS (Returned-to-Seller) TABLE
export function renderRTSTable(result, container) {
    container.innerHTML = ``;

    const table = document.createElement('table');
    table.className = 'rts table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Tracking No.</th>
                <th>Seller</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    result.forEach(element => {
        const row = document.createElement('tr');
        row.dataset.id = element.id;

        // Styling status based on text
        let statusColor = element.status === 'pending' ? 'low' : 'active'; // reusing your CSS classes

        row.innerHTML = `
            <td><strong>${element.tracking_no}</strong></td>
            <td>${element.seller_name || 'Unknown ID: ' + element.seller_id}</td>
            <td>
                <div style="font-size: 0.9rem; font-weight: 600;">${element.product_name}</div>
                <div style="font-size: 0.8rem; color: #888;">${element.description || ''}</div>
            </td>
            <td>${element.customer_name}</td>
            <td><span class="status-badge ${statusColor}">${element.status}</span></td>
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
            <td colspan="6" class="no-data" style="text-align:center; padding: 2rem;">No returned items found.</td>
        `;
    }

    container.appendChild(table);
}