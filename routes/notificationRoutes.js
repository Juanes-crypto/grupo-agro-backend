// agroapp-backend/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    markNotificationAsRead,
    deleteNotification,
} = require('../controllers/notificationController'); // Importa las funciones del controlador de notificaciones
const { protect } = require('../middleware/authMiddleware'); // Importa el middleware de autenticación

// Todas las rutas de notificación son privadas (requieren autenticación)

// @route   GET /api/notifications/my
// @desc    Obtener todas las notificaciones para el usuario autenticado
// @access  Private
router.get('/my', protect, getMyNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Marcar una notificación como leída
// @access  Private
router.put('/:id/read', protect, markNotificationAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Eliminar una notificación
// @access  Private
router.delete('/:id', protect, deleteNotification);

module.exports = router;
