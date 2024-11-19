const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Add this import

// Set storage options for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use uuid to generate unique filename
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

// Set file filter to accept only images
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Error: Images Only!'), false);
  }
};

// Configure Multer to handle multiple files
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file size limit per image
  fileFilter: fileFilter
}).array('images', 10); // Allow up to 10 images

module.exports = upload;
