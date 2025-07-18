// agroapp-backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require('../controllers/cartController'); // Importa las funciones del controlador del carrito
const { protect } = require('../middleware/authMiddleware'); // Necesitamos 'protect' para todas las rutas del carrito

// Todas las rutas del carrito son privadas (requieren autenticación)
// No necesitamos 'authorizeRoles' aquí porque el carrito es específico del usuario autenticado.

// @route   GET /api/cart
// @desc    Obtener el carrito del usuario autenticado
// @access  Private
router.get('/', protect, getCart);

// @route   POST /api/cart
// @desc    Añadir un producto al carrito o actualizar su cantidad
// @access  Private
router.post('/', protect, addItemToCart);

// @route   PUT /api/cart/:productId
// @desc    Actualizar la cantidad de un producto específico en el carrito
// @access  Private
router.put('/:productId', protect, updateCartItem);

// @route   DELETE /api/cart/:productId
// @desc    Eliminar un producto específico del carrito
// @access  Private
router.delete('/:productId', protect, removeCartItem);

// @route   DELETE /api/cart
// @desc    Vaciar todo el carrito del usuario
// @access  Private
router.delete('/', protect, clearCart);

module.exports = router;
