// config/multer.js - ARCHIVO CORREGIDO
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// ✅ 1. Configuración para imágenes de perfil
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agroapp_profile_pictures',
    format: async (req, file) => 'png',
    public_id: (req, file) => `profile-${Date.now()}-${file.originalname}`,
  },
});

// ✅ 2. Configuración para imágenes de productos (AÑADE ESTO)
const productImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agroapp_product_images',
    format: async (req, file) => 'png',
    public_id: (req, file) => `product-${Date.now()}-${file.originalname}`,
  },
});

// ✅ 3. Middleware para imágenes de perfil
const uploadProfilePicture = multer({ 
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// ✅ 4. Middleware para imágenes de productos (AÑADE ESTO)
const uploadProductImage = multer({ 
  storage: productImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB para productos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

// ✅ 5. Exportar ambos middlewares
module.exports = {
  uploadProfilePicture,
  uploadProductImage // ✅ Asegúrate de exportar esto
};