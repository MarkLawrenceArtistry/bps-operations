const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;

        // CHECK: Are we on Railway with a Volume?
        if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
            // Use the Volume path (e.g., /data/uploads)
            uploadPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'uploads');
        } else {
            // Local Development: Use absolute path to project/public/uploads
            // __dirname is 'src/middleware', so we go up two levels
            uploadPath = path.join(__dirname, '../../public/uploads');
        }

        // Create the directory if it doesn't exist
        if (!fs.existsSync(uploadPath)){
            console.log(`Creating upload directory at: ${uploadPath}`);
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|zip|x-zip-compressed|pdf/; // Added PDF here explicitly
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (path.extname(file.originalname).toLowerCase() === '.zip' || mimetype || extname) {
            return cb(null, true);
        } else {
            cb('Error: Images, PDFs or Zips Only!');
        }
    }
});

module.exports = upload;

function checkFileType(file, cb) {
    // ALLOW ZIP FILES
    const filetypes = /jpeg|jpg|png|gif|zip|x-zip-compressed/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    // ZIP mimetypes can vary, so we rely mostly on extension for zip
    if (path.extname(file.originalname).toLowerCase() === '.zip') {
        return cb(null, true);
    }

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images or Zip Only!');
    }
}

module.exports = upload;