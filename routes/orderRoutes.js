// agroapp-backend/routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    updateOrderToDelivered,
    getOrders,
} = require('../controllers/orderController'); // Importa las funciones del controlador de pedidos
const { protect, authorize } = require('../middleware/authMiddleware'); // Importa los middlewares de autenticación y autorización

// @route   POST /api/orders
// @desc    Crear un nuevo pedido
// @access  Private
router.post('/', protect, addOrderItems);

// @route   GET /api/orders/myorders
// @desc    Obtener los pedidos del usuario autenticado
// @access  Private
router.get('/myorders', protect, getMyOrders);

// @route   GET /api/orders/:id
// @desc    Obtener un pedido por ID (solo el dueño o admin)
// @access  Private
router.get('/:id', protect, getOrderById);

// @route   PUT /api/orders/:id/pay
// @desc    Actualizar pedido a pagado
// @access  Private
router.put('/:id/pay', protect, updateOrderToPaid);

// Rutas de administración (requieren rol de 'administrador')
// @route   GET /api/orders
// @desc    Obtener todos los pedidos (Admin)
// @access  Private/Admin
router.get('/', protect, authorize(['administrador']), getOrders);

// @route   PUT /api/orders/:id/deliver
// @desc    Actualizar pedido a entregado (Admin)
// @access  Private/Admin
router.put('/:id/deliver', protect, authorize(['administrador']), updateOrderToDelivered);

module.exports = router;
