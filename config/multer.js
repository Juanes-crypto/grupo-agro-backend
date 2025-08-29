// agroapp-backend/config/multer.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

// 1. Configuración para IMÁGENES DE PRODUCTOS
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agroapp_products',
    format: async (req, file) => 'png',
    public_id: (req, file) => `product-${file.fieldname}-${Date.now()}`,
  },
});

const uploadProductImage = multer({ storage: productStorage });

// 2. Configuración para FOTOS DE PERFIL DE USUARIOS
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'agroapp_profile_pictures',
    format: async (req, file) => 'png',
    public_id: (req, file) => `user-${Date.now()}-${file.originalname}`,
  },
});

const upload = multer({ 
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Middleware para registro de usuarios
const uploadRegister = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'name', maxCount: 1 },
  { name: 'email', maxCount: 1 },
  { name: 'password', maxCount: 1 },
  { name: 'phoneNumber', maxCount: 1 },
  { name: 'showPhoneNumber', maxCount: 1 },
  { name: 'locationCity', maxCount: 1 },
  { name: 'locationAddress', maxCount: 1 },
  { name: 'locationLongitude', maxCount: 1 },
  { name: 'locationLatitude', maxCount: 1 }
]);

// Middleware para actualización de perfil
const uploadProfileUpdate = upload.single('profilePicture');

module.exports = {
  uploadProductImage,      // Para productos
  uploadRegister,          // Para registro de usuarios
  uploadProfileUpdate      // Para actualización de perfil
};