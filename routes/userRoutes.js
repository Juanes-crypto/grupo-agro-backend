const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe, // ⭐ CAMBIO AQUÍ: Era 'getUserProfile', ahora es 'getMe' ⭐
  updateUserProfile,
  updateUserPremiumStatus,
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");

// 📌 Rutas públicas
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔒 Rutas protegidas
router
  .route("/profile")
  .get(protect, getMe) // ⭐ CAMBIO AQUÍ: Era 'getUserProfile', ahora es 'getMe' ⭐
  .put(protect, updateUserProfile);

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
