// agroapp-backend/config/cloudinary.js

const cloudinary = require('cloudinary').v2;

// Configura Cloudinary con tus credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Asegura que las URLs generadas sean HTTPS
});

// Exporta solo la instancia de Cloudinary configurada
module.exports = cloudinary;