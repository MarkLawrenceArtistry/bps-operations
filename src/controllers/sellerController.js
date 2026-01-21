const logAudit = require('../utils/audit-logger');
const { all, get, run } = require('../utils/db-async');


const createSeller = async (req, res) => {
    try {
        const { name, category, contact_num, email, platform_name, staff_id } = req.body;

        if(!req.file) {
            return res.status(400).json({success:false,data:"No image file uploaded for seller."});
        }

        if(!name || !category || !contact_num || !email || !platform_name || !staff_id) {
            return res.status(400).json({success:false,data:{
                message: `All fields are required.`,
                var: [name, category, contact_num, email, platform_name, staff_id]
            }});
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const query = `
            INSERT INTO seller (name, category, contact_num, email, image_path, platform_name, staff_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [name, category, contact_num, email, imageUrl, platform_name, staff_id];

        const result = await run(query, params);
        await logAudit(req.user.id, 'CREATE', 'seller', result.lastID, `Created seller profile ${name}`, req.ip);

        res.status(200).json({
            success:true,
            data:"Inventory item successfully created.",
            id:result.lastID
        });
    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`});
    }

}
const getAllSeller = async (req, res) => {
    try {
        const rows = await all(`
            SELECT id, name, category, contact_num, email, image_path, platform_name, created_at FROM seller    
        `);

        res.status(200).json({success:true,data:rows});
    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`});
    }
}
const getSeller = async (req, res) => {
    try {
        const { id } = req.params;

        const row = await get(`
            SELECT id, name, category, contact_num, email, image_path, platform_name, created_at FROM seller
            WHERE id = ?   
        `, [id]);

        if(!row) {
            return res.status(404).json({success:false,data:"Seller profile not found."});
        }

        res.status(200).json({success:true,data:row});
    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`});
    }
}
const updateSeller = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, contact_num, email, platform_name, staff_id } = req.body;

        if(!id) {
            return res.status(400).json({success:false,data:"ID is required"});
        }

        let imageUrl;
        if(!req.file) {
            imageUrl = null;
        } else {
            imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const result = await run(`
            UPDATE seller
            SET
                name = COALESCE(?, name),
                category = COALESCE(?, category),
                contact_num = COALESCE(?, contact_num),
                email = COALESCE(?, email),
                image_path = COALESCE(?, image_path),
                platform_name = COALESCE(?, platform_name),
                staff_id = COALESCE(?, staff_id)
            WHERE id = ?
        `, [name, category, contact_num, email, imageUrl, platform_name, staff_id, id]);

        res.status(200).json({
            success:true,
            data:"Seller profile successfully updated.",
            id:result.lastID
        });

    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`});
    }
}
const deleteSeller = async (req, res) => {
    try{
        const { id } = req.params;

        if(!id) {
            return res.status(400).json({success:false,data:"ID is required."});
        }

        const result = await run(`
            DELETE FROM seller WHERE id = ?    
        `, [id]);

        await logAudit(req.user.id, 'DELETE', 'seller', result.lastID, `Delete seller profile no.${id}`, req.ip);
            
        res.status(200).json({success:true,data:"Deleted seller profile successfully.",id:result.id});
    } catch(err) {
        res.status(500).json({success:false,data:`Internal Server Error: ${err.message}`});
    }
}


module.exports = {
    createSeller,
    getAllSeller,
    getSeller,
    updateSeller,
    deleteSeller
}