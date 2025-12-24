const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logAudit = require('../utils/audit-logger')
const { all, get, run } = require('../utils/db-async');

const login = async (req, res) => {
    try {

        // Get the credentials
        const { username, password } = req.body;

        // 1. VALIDATE
        if(!username && !req.body.email) {
            return res.status(400).json({success:false,data:"Username or email is required."});
        }
        if(!password) {
            return res.status(400).json({success:false,data:"Password is required."});
        }

        const identifier = username || req.body.email;

        // 2. CHECK IF USER EXISTS (Username or Email)
        const user = await get("SELECT * FROM users WHERE username = ? OR email = ?", [identifier, identifier]);

        if(!user) {
            return res.status(401).json({success:false,data:"Invalid username or password."});
        }

        // 3. CHECK IF ACCOUNT IS ACTIVE
        if(user.is_active === 0) {
            return res.status(403).json({success:false,data:"Account is currently disabled. Contact admin."});
        }

        // 4. COMPARE PASSWORDS
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if(!isMatch) {
            return res.status(401).json({success:false,data:"Invalid username or password."})
        }

        // 5. GENERATE JWT TOKEN
        const token = jwt.sign(
            {id: user.id, username: user.username, role_id: user.role_id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        )

        // 6. RECORD IN AUDIT LOG
        await run(`
            INSERT INTO audit_logs (user_id, action_type, table_name, description, ip_address)
            VALUES (?, ?, ?, ?, ?)    
        `, [user.id, "LOGIN", "users", "User logged in successfully", req.ip])

        // 7. RESPONSE
        res.status(200).json({
            success:true,
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role_id: user.role_id
            }
        })

    } catch(error) {
        console.error("LOGIN ERROR: ", error);
        res.status(500).json({success:false,data:"Internal Server Error"})
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await all(`
            SELECT * FROM users    
        `)

        res.status(200).json({success:true,data:users})
    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`})
    }
}

const createUser = async (req, res) => {
    try {
        const { username, email, password, role_id } = req.body;

        if(!username || !email || !password || !role_id) {
            return res.status(400).json({success:false,data:"All fields are required."})
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const result = await run(`
            INSERT INTO users (username, email, password_hash, role_id, is_active)
            VALUES (?, ?, ?, ?, 1)
        `, [username, email, hash, role_id])

        await logAudit(req.user.id, 'CREATE', 'users', result.lastID, `Created user ${username}`, req.ip);

        res.status(201).json({success:true,data:"User created successfully", id: result.lastID})
    } catch(err) {
        return res.status(500).json({success:false,data:err.message})
    }
}

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        let { username, password, email, role_id, is_active } = req.body;

        // 1. Fetch current user data
        const currentUser = await get("SELECT * FROM users WHERE id = ?", [id]);
        if (!currentUser) return res.status(404).json({ success: false, data: "User not found" });

        // 2. Prepare dynamic fields
        const fields = [];
        const params = [];

        if (username && username !== currentUser.username) {
            fields.push("username = ?");
            params.push(username);
        }

        if (email && email !== currentUser.email) {
            // Check if email is already taken
            const existing = await get("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
            if (existing) return res.status(400).json({ success: false, data: "Email already in use by another user" });
            fields.push("email = ?");
            params.push(email);
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            fields.push("password_hash = ?");
            params.push(hash);
        }

        if (role_id !== undefined && role_id !== null) {
            const rid = parseInt(role_id);
            if (!isNaN(rid)) {
                fields.push("role_id = ?");
                params.push(rid);
            }
        }

        if (is_active !== undefined && is_active !== null) {
            const activeStatus = parseInt(is_active);
            if (!isNaN(activeStatus)) {
                fields.push("is_active = ?");
                params.push(activeStatus);
            }
        }

        // 3. Update if there are changes
        if (fields.length > 0) {
            params.push(id);
            await run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
            await logAudit(req.user.id, 'UPDATE', 'users', id, `Updated user ${id}: ${fields.join(', ')}`, req.ip);
        }

        return res.status(200).json({ success: true, data: "User updated successfully!" })
    } catch (err) {
        console.error("UPDATE USER ERROR: ", err);
        return res.status(500).json({ success: false, data: err.message })
    }
}

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Toggle is_active status
        const user = await get(`SELECT is_active FROM users WHERE id = ?`, [id]);
        if (!user) return res.status(404).json({success:false,data:"User not found"});

        const newStatus = user.is_active ? 0 : 1;
        await run(`UPDATE users SET is_active = ? WHERE id = ?`, [newStatus, id]);
        
        await logAudit(req.user.id, 'UPDATE_STATUS', 'users', id, `${newStatus ? 'Activated' : 'Deactivated'} user ID:${id}`, req.ip);
        
        return res.status(200).json({success:true,data:`User ${newStatus ? 'activated' : 'deactivated'} successfully!`})
    } catch(err) {
        return res.status(500).json({success:false,data:err.message})
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Perform hard delete
        const result = await run(`DELETE FROM users WHERE id = ?`, [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ success: false, data: "User not found" });
        }

        await logAudit(req.user.id, 'DELETE', 'users', id, `Permanently deleted user ID:${id}`, req.ip);
        
        return res.status(200).json({ success: true, data: "User permanently deleted successfully!" });
    } catch (err) {
        return res.status(500).json({ success: false, data: err.message });
    }
}

module.exports = { login, getAllUsers, createUser, updateUser, toggleUserStatus, deleteUser }