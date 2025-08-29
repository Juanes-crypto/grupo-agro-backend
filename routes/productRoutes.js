// agroapp-backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getUserProducts
} = require('../controllers/productController');

// ⭐ Asegúrate de que esta importación sea correcta ⭐
const { uploadProductImage } = require('../config/multer');

const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, uploadProductImage.single('image'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(protect, uploadProductImage.single('image'), updateProduct)
    .delete(protect, deleteProduct);

router.route('/user/:userId')
    .get(getUserProducts);

module.exports = router;