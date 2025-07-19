// agroapp-backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware'); // Asegúrate de tener tu middleware de autenticación

// Ruta para crear una sesión de Stripe Checkout
// Protegida para asegurar que solo usuarios autenticados puedan iniciar pagos
router.post('/create-checkout-session', protect, createCheckoutSession);

module.exports = router;
