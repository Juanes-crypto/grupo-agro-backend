// agroapp-backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
// ⭐ Importa la instancia específica para productos ⭐
const { uploadProductImage } = require('../config/multer'); 

// 🔐 Rutas privadas (¡PONLAS PRIMERO SI SON MÁS ESPECÍFICAS!)
router.get('/my-products', protect, getMyProducts);
// ⭐ Usamos uploadProductImage para la subida de imágenes de productos ⭐
router.post('/', protect, uploadProductImage.single('image'), createProduct);
// ⭐ Usamos uploadProductImage para la subida de imágenes de productos ⭐
router.put('/:id', protect, uploadProductImage.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

// 📦 Rutas públicas (Más generales, van después)
router.get('/', getProducts);
router.get('/:id', getProductById);


module.exports = router;