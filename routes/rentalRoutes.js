// agroapp-backend/routes/rentalRoutes.js

const express = require('express');
const router = express.Router();
const {
    getRentals,
    getRentalById,
    createRental,
    updateRental,
    deleteRental,
    getMyRentals,
} = require('../controllers/rentalController');
const { protect } = require('../middleware/authMiddleware');
// ⭐ Importa la instancia específica para productos/imágenes generales ⭐
const { uploadProductImage } = require('../config/multer'); 

// Rutas protegidas
router.get('/my-rentals', protect, getMyRentals);
// ⭐ Usamos uploadProductImage para la subida de imagen de renta ⭐
router.post('/', protect, uploadProductImage.single('image'), createRental); 
// ⭐ Usamos uploadProductImage para la subida de imagen de renta ⭐
router.put('/:id', protect, uploadProductImage.single('image'), updateRental);
router.delete('/:id', protect, deleteRental);

// Rutas públicas
router.get('/', getRentals);
router.get('/:id', getRentalById);

module.exports = router;