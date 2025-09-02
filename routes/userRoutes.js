const express = require("express");
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Importar controladores y middlewares - VERSIÓN CORREGIDA
const {
  registerUser,
  loginUser,
  getMe,
  getUserProfile,  // ← ¡IMPORTACIÓN AGREGADA!
  updateUserProfile,
  updateUserPremiumStatus,
  verifyRecaptcha,
  registerValidation,
  loginValidation,
  updateProfileValidation
} = require('../controllers/userController');

const processLocation = require('../middleware/processLocation');
const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");

// Configuración de Multer con Cloudinary
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

// 📌 Ruta de registro - CON reCAPTCHA
router.post("/register", 
  (req, res, next) => {
    console.log('=== 📨 PETICIÓN RECIBIDA EN /REGISTER ===');
    console.log('Headers Content-Type:', req.headers['content-type']);
    next();
  },
  
  // Middleware de Multer para procesar todos los campos
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'name', maxCount: 1 },
    { name: 'email', maxCount: 1 },
    { name: 'password', maxCount: 1 },
    { name: 'phoneNumber', maxCount: 1 },
    { name: 'showPhoneNumber', maxCount: 1 },
    { name: 'locationCity', maxCount: 1 },
    { name: 'locationAddress', maxCount: 1 },
    { name: 'locationLongitude', maxCount: 1 },
    { name: 'locationLatitude', maxCount: 1 },
    { name: 'recaptchaToken', maxCount: 1 }
  ]),
  
  (req, res, next) => {
    console.log('✅ Después de Multer - req.body:', req.body);
    console.log('✅ req.files:', req.files);
    next();
  },
  
  processLocation,
  
  (req, res, next) => {
    console.log('✅ Después de processLocation - req.body:', req.body);
    console.log('✅ Location object:', req.body.location);
    next();
  },
  
  registerValidation,
  verifyRecaptcha,
  registerUser
);

// 📌 Ruta de login - CON reCAPTCHA
router.post("/login", 
  (req, res, next) => {
    console.log('=== 🔐 PETICIÓN RECIBIDA EN /LOGIN ===');
    next();
  },
  loginValidation,
  loginUser
);

// 🔒 Rutas protegidas - Perfil de usuario
router
  .route("/profile")
  .get(protect, getMe)
  .put(protect, upload.single('profilePicture'), updateProfileValidation, updateUserProfile);

// 🆕 Ruta adicional para obtener perfil completo
router.get('/profile', protect, getUserProfile);

// 🛡️ Actualizar estado premium (solo admin)
router.put(
  "/:id/premium",
  protect,
  authorize("admin"),
  updateUserPremiumStatus
);

// 🧪 Ruta de prueba para activar cuenta premium
router.put("/:id/force-premium", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isPremium: true },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({
      message: "Usuario actualizado a premium para pruebas",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error al forzar estado premium:", err);
    res.status(500).json({ message: "No se pudo actualizar el usuario" });
  }
});

// Ruta de información de la API
router.get('/', (req, res) => {
  res.json({ 
    message: "API de Usuarios funcionando",
    endpoints: {
      register: "POST /api/users/register",
      login: "POST /api/users/login",
      profile: "GET/PUT /api/users/profile"
    }
  });
});

module.exports = router;