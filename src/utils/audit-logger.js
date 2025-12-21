const { run } = require('../utils/db-async');

const logAudit = async (userId, actionType, tableName, recordId, description, ipAddress) => {
    try {
        await run(`
            INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, actionType, tableName, recordId, description, ipAddress])
    } catch(err) {
        console.error("Failed to write audit log: ", err.message)
    }
}

module.exports = logAudit;