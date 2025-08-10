const express = require("express");
const router = express.Router();

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

const {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
    updateUserPremiumStatus,
    // ⭐ Importar los middlewares de validación ⭐
    registerValidation,
    loginValidation,
    updateProfileValidation,
} = require("../controllers/userController");

const { uploadProfilePicture } = require('../config/multer'); 

const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");

// 📌 Rutas públicas
// ⭐ Aplicar el middleware de validación a la ruta de registro ⭐
router.post("/register", uploadProfilePicture.single('profilePicture'), registerValidation, registerUser);
// ⭐ Aplicar el middleware de validación a la ruta de login ⭐
router.post("/login", loginValidation, loginUser);

// 🔒 Rutas protegidas
router
    .route("/profile")
    .get(protect, getMe)
    // ⭐ Aplicar el middleware de validación a la ruta de actualización de perfil ⭐
    .put(protect, uploadProfilePicture.single('profilePicture'), updateProfileValidation, updateUserProfile);

// 🛡️ Actualizar estado premium (usando roles, si aplica)
router.put(
    "/:id/premium",
    protect,
    authorize("administrador"),
    updateUserPremiumStatus
);

// 🧪 Activar cuenta premium (solo para pruebas temporales)
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

module.exports = router;