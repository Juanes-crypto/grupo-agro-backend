// agroapp-backend/config/multer.js

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary'); // Asegúrate de que este sea tu archivo de configuración de Cloudinary

// Configuración de almacenamiento de Cloudinary para Multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary, // Tu instancia de Cloudinary
    params: {
        folder: 'agroapp_products', // Carpeta en Cloudinary donde se guardarán las imágenes de productos
        format: async (req, file) => 'png', // Formato de la imagen (puedes ajustarlo)
        public_id: (req, file) => `${file.fieldname}-${Date.now()}`, // Nombre público de la imagen
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
