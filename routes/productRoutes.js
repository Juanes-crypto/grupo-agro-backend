// agroapp-backend/routes/productRoutes.js

const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getMyProducts,
    createProduct,
    updateProduct, // ✨ Este ya lo estamos usando para publicar/despublicar
    deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// 🔐 Rutas privadas (¡PONLAS PRIMERO SI SON MÁS ESPECÍFICAS!)
router.get('/my-products', protect, getMyProducts);
router.post('/', protect, upload.single('image'), createProduct);
// La ruta PUT para actualizar un producto, incluyendo isPublished, ya existe
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

// 📦 Rutas públicas (Más generales, van después)
router.get('/', getProducts);
router.get('/:id', getProductById);


module.exports = router;