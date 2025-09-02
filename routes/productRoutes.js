// agroapp-backend/routes/productRoutes.js
console.log('🔍 VERIFICACIÓN: Archivo productRoutes.js cargado');
console.log('📁 Directorio actual:', __dirname);
console.log('📄 Ruta completa:', __filename);
const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getUserProducts
} = require('../controllers/productController');

const { uploadProductImage } = require('../config/multer');
const { protect } = require('../middleware/authMiddleware');
console.log('🔄 Rutas de productos cargadas en este orden:');
console.log('1. /my-products');
console.log('2. /');
console.log('3. /user/:userId');
console.log('4. /:id');

// ✅ ORDEN CORRECTO - my-products PRIMERO
router.get('/my-products', protect, getMyProducts);

router.route('/')
    .get(getProducts)
    .post(protect, uploadProductImage.single('image'), createProduct);

router.route('/user/:userId')
    .get(getUserProducts);

// ✅ /:id AL FINAL
router.route('/:id')
    .get(getProduct)
    .put(protect, uploadProductImage.single('image'), updateProduct)
    .delete(protect, deleteProduct);


console.log('✅ Todas las rutas de productos configuradas');

module.exports = router;