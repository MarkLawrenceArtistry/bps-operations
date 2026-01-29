const PDFDocument = require('pdfkit-table');
const { all } = require('../utils/db-async');

const generateReport = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        const filename = `${type}_report_${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(18).text('Bicodo Postal Services (BPS)', { align: 'center' });
        doc.fontSize(12).text('Records Management System Report', { align: 'center' });
        doc.moveDown();

        doc.fontSize(10).text(`Report Type: ${type.toUpperCase()}`);
        doc.text(`Generated Date: ${new Date().toLocaleString()}`);
        if(startDate && endDate) {
            doc.text(`Period: ${startDate} to ${endDate}`);
        }
        doc.moveDown();

        if (type === 'inventory') {
            const rows = await all(`
                SELECT i.name, ic.name as category, i.quantity, i.min_stock_level 
                FROM inventory i
                LEFT JOIN inventory_categories ic ON i.category_id = ic.id
            `);

            const table = {
                title: "Current Inventory Status",
                headers: ["Item Name", "Category", "Qty", "Min Level", "Status"],
                rows: rows.map(r => [
                    r.name, 
                    r.category || 'N/A', 
                    r.quantity, 
                    r.min_stock_level,
                    r.quantity < r.min_stock_level ? 'LOW STOCK' : 'OK'
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
            const totalRevenue = rows.reduce((sum, r) => sum + r.total_amount, 0);

            const table = {
                title: "Sales Performance",
                headers: ["Start Date", "End Date", "Amount (PHP)", "Notes"],
                rows: rows.map(r => [
                    r.week_start_date,
                    r.week_end_date,
                    r.total_amount.toLocaleString('en-PH', {style:'currency', currency:'PHP'}),
                    r.notes || '-'
                ])
            };
            await doc.table(table);
            
            doc.moveDown();
            doc.fontSize(12).font('Helvetica-Bold').text(`Total Revenue: PHP ${totalRevenue.toLocaleString()}`);
        }

        doc.end();

    } catch (err) {
        console.error(err);
        if (!res.headersSent) res.status(500).send("Error generating PDF");
    }
};

module.exports = { generateReport };