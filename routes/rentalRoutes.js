const express = require('express');
const router = express.Router();
const {
    getRentals,
    getRentalById,
    getMyRentals,
    createRental,
    updateRental,
    deleteRental,
} = require('../controllers/rentalController'); // Asegúrate de crear este controlador
const { protect } = require('../middleware/authMiddleware'); // Middleware de autenticación
const upload = require('../config/multer'); // Middleware para manejar subida de archivos (asumiendo que está en config/multer.js)

// 🔐 Rutas privadas (¡PONLAS PRIMERO SI SON MÁS ESPECÍFICAS!)
router.get('/my-rentals', protect, getMyRentals);
router.post('/', protect, upload.single('image'), createRental); // Protegida y con subida de imagen
router.put('/:id', protect, upload.single('image'), updateRental);
router.delete('/:id', protect, deleteRental);

// 📦 Rutas públicas (Más generales, van después)
router.get('/', getRentals);
router.get('/:id', getRentalById);

module.exports = router;