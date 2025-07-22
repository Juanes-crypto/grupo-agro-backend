const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
    updateUserPremiumStatus,
} = require("../controllers/userController");

// ⭐ Importar la nueva instancia de Multer para fotos de perfil ⭐
const { uploadProfilePicture } = require('../config/multer'); 

const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");

// 📌 Rutas públicas
// ⭐ La ruta de registro ahora usa Multer para manejar una sola imagen llamada 'profilePicture' ⭐
router.post("/register", uploadProfilePicture.single('profilePicture'), registerUser);
router.post("/login", loginUser);

// 🔒 Rutas protegidas
router
    .route("/profile")
    .get(protect, getMe)
    // ⭐ La ruta de actualización de perfil ahora usa Multer para una nueva foto ⭐
    // El middleware 'protect' va antes de Multer si Multer necesita req.user para nombrar el archivo.
    .put(protect, uploadProfilePicture.single('profilePicture'), updateUserProfile);

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