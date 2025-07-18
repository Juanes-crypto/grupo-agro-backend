// agroapp-backend/models/Order.js

const mongoose = require('mongoose');

// Esquema para los ítems individuales dentro de un pedido
const orderItemSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    quantity: { // <-- ¡CAMBIO CLAVE AQUÍ! Ahora es String
        type: String,
        required: true,
    },
    image: { // URL de la imagen del producto en el momento de la compra
        type: String,
        required: true,
    },
    price: { // Precio unitario del producto en el momento de la compra (sigue siendo Number)
        type: Number,
        required: true,
    },
    product: { // Referencia al producto original (para trazabilidad)
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
});

// Esquema principal del Pedido
const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Referencia al usuario que hizo el pedido
    },
    orderItems: [orderItemSchema], // Array de ítems del pedido
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    paymentResult: { // Detalles de la transacción de la pasarela de pago
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String },
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false,
    },
    paidAt: {
        type: Date,
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false,
    },
    deliveredAt: {
        type: Date,
    },
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
