// agroapp-backend/models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: { // El usuario que recibe la notificación
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    type: { // Tipo de notificación (ej. 'new_barter_proposal', 'barter_accepted', 'barter_rejected', 'barter_countered')
        type: String,
        required: true,
        enum: [
            'new_barter_proposal',
            'barter_accepted',
            'barter_rejected',
            'barter_countered',
            'order_status_update', // Para futuras notificaciones de pedidos
            'product_update',      // Para futuras notificaciones de productos
            'general_message'      // Para mensajes generales
        ],
    },
    title: { // Título breve de la notificación
        type: String,
        required: true,
    },
    message: { // Mensaje detallado de la notificación
        type: String,
        required: true,
    },
    // Referencia al documento relacionado (ej. la propuesta de trueque, el pedido)
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // No todas las notificaciones tendrán una entidad relacionada
    },
    relatedEntityType: { // Tipo del modelo de la entidad relacionada (ej. 'BarterProposal', 'Order')
        type: String,
        required: false,
        enum: ['BarterProposal', 'Order', 'Product', 'User'], // Tipos de modelos a los que puede referirse
    },
    isRead: { // Si el usuario ya ha visto la notificación
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
