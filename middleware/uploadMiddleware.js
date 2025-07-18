// agroapp-backend/middleware/uploadMiddleware.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Importa la instancia de Cloudinary configurada

// Configuración de almacenamiento para Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary, // Usa la instancia de Cloudinary importada
  params: {
    folder: 'agroapp_products', // Nombre de la carpeta en Cloudinary
    format: async (req, file) => 'png', // Formato de la imagen
    // public_id: (req, file) => `product_${Date.now()}_${file.originalname.split('.')[0]}`,
    // Una forma más segura de generar el public_id para evitar conflictos y caracteres especiales
    public_id: (req, file) => `product_${Date.now()}_${file.originalname.replace(/\s+/g, '_').split('.')[0].substring(0, 50)}`,
  },
});

// Filtro para aceptar solo ciertos tipos de archivos de imagen
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Acepta el archivo
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (jpeg, jpg, png, gif, webp).'), false);
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage, // Usa el almacenamiento de Cloudinary
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite de 5 MB por archivo
  },
});

module.exports = upload; // Exporta la instancia de Multer configurada