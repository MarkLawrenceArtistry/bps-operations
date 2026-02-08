const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const AdmZip = require('adm-zip');
const { db } = require('../database');

// Define Paths
const DB_NAME = "bps.db";
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, DB_NAME) 
    : path.resolve(__dirname, '../../', DB_NAME);

const UPLOADS_PATH = path.join(__dirname, '../../public/uploads');

// --- 1. CREATE BACKUP ---
const createBackup = async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `bps_backup_${timestamp}.zip`;

        res.attachment(filename);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', function(err) {
            res.status(500).send({error: err.message});
        });

        archive.pipe(res);

        if (fs.existsSync(DB_PATH)) {
            // Append DB file
            archive.file(DB_PATH, { name: DB_NAME });
        }

        if (fs.existsSync(UPLOADS_PATH)) {
            // Append uploads folder
            archive.directory(UPLOADS_PATH, 'uploads');
        }

        await archive.finalize();

    } catch (error) {
        console.error("Backup Error:", error);
        if(!res.headersSent) res.status(500).json({ success: false, data: "Backup failed." });
    }
};

// --- 2. RESTORE BACKUP ---
const restoreBackup = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, data: "No backup file uploaded." });
        }

        const zipPath = req.file.path;
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();

        // 1. RESTORE IMAGES (Safe to do while running)
        let uploadsRestored = 0;
        zipEntries.forEach(entry => {
            if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
                const fullPath = path.join(__dirname, '../../public/', entry.entryName);
                const dir = path.dirname(fullPath);
                
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(fullPath, entry.getData());
                uploadsRestored++;
            }
        });

        // 2. CHECK FOR DATABASE
        const dbEntry = zipEntries.find(e => e.entryName === DB_NAME);

        if (dbEntry) {
            console.log("Database found in backup. Initiating overwrite sequence...");

            // IMPORTANT: Close DB connection to release file lock on Windows
            db.close((err) => {
                if (err) {
                    console.error("Failed to close DB:", err);
                    return res.status(500).json({ success: false, data: "Database is busy. Cannot restore." });
                }

                try {
                    // Overwrite Database File
                    fs.writeFileSync(DB_PATH, dbEntry.getData());
                    console.log("Database file overwritten successfully.");

                    // Delete the temp zip file
                    fs.unlinkSync(zipPath);

                    // Send success to client BEFORE killing the process
                    res.status(200).json({ 
                        success: true, 
                        data: "System restored! The server is restarting to apply changes..." 
                    });

                    // Force restart node process (Nodemon will restart it)
                    setTimeout(() => {
                        console.log("Triggering Hot Reload...");
                        const triggerFile = path.join(__dirname, '../server.js'); // Points to src/server.js
                        const time = new Date();
                        try {
                            fs.utimesSync(triggerFile, time, time); // Updates the file timestamp
                        } catch (err) {
                            console.error("Hot reload trigger failed, killing process instead:", err);
                            process.exit(1); 
                        }
                    }, 1000);

                } catch (writeError) {
                    console.error("Write Error:", writeError);
                    // Try to respond, though DB is closed now
                    return res.status(500).json({ success: false, data: "File write failed: " + writeError.message });
                }
            });
        } else {
            // No DB in zip, just images
            fs.unlinkSync(zipPath);
            res.status(200).json({ success: true, data: `Restored ${uploadsRestored} images. No database found.` });
        }

    } catch (error) {
        console.error("Restore Error:", error);
        // Clean up zip if it exists
        if(req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, data: "Restore crashed: " + error.message });
    }
};

module.exports = { createBackup, restoreBackup };