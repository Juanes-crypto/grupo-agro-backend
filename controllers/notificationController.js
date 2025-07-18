// agroapp-backend/controllers/notificationController.js

const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification'); // Importa el modelo de Notificación

// @desc    Create a new notification (Internal use, not directly exposed via route usually)
// @access  Private (called by other controllers)
const createNotification = async ({ user, type, title, message, relatedEntityId, relatedEntityType }) => {
    try {
        const notification = new Notification({
            user,
            type,
            title,
            message,
            relatedEntityId,
            relatedEntityType,
        });
        await notification.save();
        console.log(`Notification created for user ${user}: ${title}`);
    } catch (error) {
        console.error('Error creating notification:', error);
        // No lanzamos error aquí para no detener el flujo principal de la operación que generó la notificación
    }
};

// @desc    Get all notifications for the authenticated user
// @route   GET /api/notifications/my
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 }); // Las más recientes primero
    res.status(200).json(notifications);
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notificación no encontrada.');
    }

    // Asegurarse de que el usuario autenticado es el dueño de la notificación
    if (notification.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('No autorizado para marcar esta notificación como leída.');
    }

    notification.isRead = true;
    const updatedNotification = await notification.save();

    res.status(200).json(updatedNotification);
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notificación no encontrada.');
    }

    // Asegurarse de que el usuario autenticado es el dueño de la notificación o un administrador
    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
        res.status(401);
        throw new Error('No autorizado para eliminar esta notificación.');
    }

    await notification.deleteOne();
    res.status(200).json({ message: 'Notificación eliminada con éxito.' });
});

module.exports = {
    createNotification, // Exportar para uso interno desde otros controladores
    getMyNotifications,
    markNotificationAsRead,
    deleteNotification,
};
