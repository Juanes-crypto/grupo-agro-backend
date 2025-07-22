// agroapp-backend/config/multer.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // Tu archivo de configuración de Cloudinary

// 1. Configuración para IMÁGENES DE PRODUCTOS
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'agroapp_products', // Carpeta en Cloudinary para productos
        format: async (req, file) => 'png', // Puedes ajustar el formato (ej. 'jpeg', 'webp')
        public_id: (req, file) => `product-${file.fieldname}-${Date.now()}`, // Nombre público basado en el campo y timestamp
    },
});

const uploadProductImage = multer({ storage: productStorage });

// 2. Configuración para FOTOS DE PERFIL DE USUARIO
const profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'agroapp_profile_pictures', // Carpeta específica en Cloudinary para fotos de perfil
        format: async (req, file) => 'png', // Asegúrate de que el formato sea apropiado (ej. 'jpeg', 'webp')
        public_id: (req, file) => {
            // Usa el ID del usuario si está disponible (para actualizaciones de perfil),
            // de lo contrario, usa un timestamp (para registro)
            return `user-${req.user ? req.user._id : Date.now()}-${file.fieldname}`;
        },
    },
});

const uploadProfilePicture = multer({ storage: profilePictureStorage });

// ⭐ Exporta ambas instancias como módulos nombrados ⭐
module.exports = {
    uploadProductImage,     // Usa esta para subir imágenes de productos
    uploadProfilePicture,   // Usa esta para subir fotos de perfil de usuario
};