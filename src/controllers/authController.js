const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { all, get, run } = require('../utils/db-async');

const login = async (req, res) => {
    try {

        // Get the credentials
        const { username, password } = req.body;

        // 1. VALIDATE
        if(!username || !password) {
            return res.status(400).json({success:false,data:"Username and password are required."});
        }

        // 2. CHECK IF USER EXISTS
        const user = await get("SELECT * FROM users WHERE username = ?", [username]);

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

        // 6. RECORD IN AUDTO LOG
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

module.exports = { login }