// agroapp-backend/routes/productRoutes.js
console.log('🔍 VERIFICACIÓN: Archivo productRoutes.js cargado');
console.log('📁 Directorio actual:', __dirname);
console.log('📄 Ruta completa:', __filename);
const express = require('express');
const router = express.Router();
const {
    getMyProductStats, // 🔥 NUEVO
    getProducts,
    getProduct,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    incrementProductView, // 🔥 NUEVO
    trackProductClick // 🔥 NUEVO
} = require('../controllers/productController');

const { uploadProductImage } = require('../config/multer');
const { protect } = require('../middleware/authMiddleware');

console.log('🔄 Rutas de productos cargadas en este orden:');
console.log('1. /my-stats'); // 🔥 NUEVO
console.log('2. /my-products');
console.log('3. /');
console.log('4. /user/:userId');
console.log('5. /:id/view'); // 🔥 NUEVO
console.log('6. /:id/click'); // 🔥 NUEVO
console.log('7. /:id');

// ✅ ORDEN CORRECTO - Estadísticas primero
router.get('/my-stats', protect, getMyProductStats); // 🔥 NUEVA RUTA
router.get('/my-products', protect, getMyProducts);

router.route('/')
    .get(getProducts)
    .post(protect, uploadProductImage.single('image'), createProduct);


// 🔥 NUEVAS RUTAS PARA ANALYTICS
router.put('/:id/view', incrementProductView); // Pública para tracking
router.put('/:id/click', protect, trackProductClick); // Protegida para clicks de dueño

// ✅ /:id AL FINAL
router.route('/:id')
    .get(getProduct)
    .put(protect, uploadProductImage.single('image'), updateProduct)
    .delete(protect, deleteProduct);

console.log('✅ Todas las rutas de productos configuradas (incluyendo analytics)');

module.exports = router;