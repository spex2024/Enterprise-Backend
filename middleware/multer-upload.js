// middlewares/uploadMiddleware.js
import multer from 'multer';

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default upload;
