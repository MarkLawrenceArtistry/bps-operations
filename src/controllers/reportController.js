const PDFDocument = require('pdfkit-table');
const { all } = require('../utils/db-async');

// --- NEW: API to get JSON data for Frontend Chart/Table Preview ---
const getReportPreview = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        if (type === 'sales') {
            let query = `SELECT id, week_start_date, week_end_date, total_amount, notes FROM weekly_sales`;
            const params = [];

            if (startDate && endDate) {
                query += ` WHERE week_start_date >= ? AND week_end_date <= ?`;
                params.push(startDate, endDate);
            }
            query += ` ORDER BY week_start_date ASC`; // ASC for Chart time progression

            const rows = await all(query, params);
            
            // Format for Chart.js
            const labels = rows.map(r => r.week_start_date);
            const data = rows.map(r => r.total_amount);

            return res.status(200).json({ 
                success: true, 
                data: { rows, chart: { labels, data } } 
            });

        } else if (type === 'inventory') {
            // Inventory snapshot (Current state, so dates don't apply as much, but we keep structure)
            const rows = await all(`
                SELECT i.name, ic.name as category, i.quantity, i.min_stock_level 
                FROM inventory i
                LEFT JOIN inventory_categories ic ON i.category_id = ic.id
                ORDER BY i.quantity ASC
            `);

            return res.status(200).json({ 
                success: true, 
                data: { rows, chart: null } // No chart for inventory preview in this wireframe
            });
        }

        res.status(400).json({ success: false, data: "Invalid report type" });

    } catch (err) {
        res.status(500).json({ success: false, data: err.message });
    }
};

// --- EXISTING: PDF Generation (Updated to match filters) ---
const generateReport = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        const filename = `${type}_report_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('Bicodo Postal Services', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text('Operations System Report', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(`Report Category: ${type.toUpperCase()}`);
        doc.text(`Generated: ${new Date().toLocaleString()}`);
        if(startDate && endDate) doc.text(`Range: ${startDate} to ${endDate}`);
        doc.moveDown();

        if (type === 'inventory') {
            const rows = await all(`
                SELECT i.name, ic.name as category, i.quantity, i.min_stock_level 
                FROM inventory i
                LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            `);

            const table = {
                title: "Inventory Status",
                headers: ["Item", "Category", "Qty", "Min", "Status"],
                rows: rows.map(r => [
                    r.name, 
                    r.category || 'None', 
                    r.quantity, 
                    r.min_stock_level,
                    r.quantity <= r.min_stock_level ? 'LOW' : 'OK'
                ])
            };
            await doc.table(table);

        } else if (type === 'sales') {
            let query = `SELECT week_start_date, week_end_date, total_amount, notes FROM weekly_sales`;
            const params = [];

            if(startDate && endDate) {
                query += ` WHERE week_start_date >= ? AND week_end_date <= ?`;
                params.push(startDate, endDate);
            }
            query += ` ORDER BY week_start_date DESC`;

            const rows = await all(query, params);
            const total = rows.reduce((sum, r) => sum + r.total_amount, 0);

            const table = {
                title: "Sales Records",
                headers: ["Start", "End", "Amount (PHP)", "Notes"],
                rows: rows.map(r => [
                    r.week_start_date,
                    r.week_end_date,
                    r.total_amount.toLocaleString('en-PH', {minimumFractionDigits: 2}),
                    r.notes || ''
                ])
            };
            await doc.table(table);
            doc.moveDown().font('Helvetica-Bold').text(`Total Revenue: PHP ${total.toLocaleString('en-PH', {minimumFractionDigits: 2})}`);
        }

        doc.end();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

module.exports = { generateReport, getReportPreview };