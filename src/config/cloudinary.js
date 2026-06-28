const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kenyavest_uploads', // Optional: change this to your preferred folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional transformation
  },
});

const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload,
};
