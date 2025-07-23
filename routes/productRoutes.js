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
    getProductsByUser,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProductImage } = require('../config/multer'); 

// 🔐 Rutas privadas (¡PONLAS PRIMERO SI SON MÁS ESPECÍFICAS!)
// Estas rutas son específicas y no deben ser "atrapadas" por :id
router.get('/my-products', protect, getMyProducts);
router.get('/user/:userId', getProductsByUser); 
router.post('/', protect, uploadProductImage.single('image'), createProduct);
router.put('/:id', protect, uploadProductImage.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

// 📦 Rutas públicas (Más generales, van después de las específicas)
// La ruta '/' es más específica que '/:id'
router.get('/', getProducts);

// ⭐ ESTA RUTA DINÁMICA DEBE IR SIEMPRE AL FINAL DE LAS RUTAS QUE EMPIEZAN CON /api/products/ ⭐
// Esto es crucial para que no intercepte 'my-products' o 'user/:userId'
router.get('/:id', getProductById);


module.exports = router;