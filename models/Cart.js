// agroapp-backend/models/Cart.js

const mongoose = require('mongoose');

// Definición del esquema para los ítems individuales dentro del carrito
// Esto no es un modelo separado, sino un subdocumento
const cartItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', // Referencia al modelo de Producto
    },
    quantity: { // <-- ¡CAMBIO CLAVE AQUÍ! Ahora es String
        type: String,
        required: true,
        // No hay 'min' para String, la validación de formato será en el frontend o controlador
    },
    priceAtTime: { // Para guardar el precio del producto en el momento de añadirlo al carrito
        type: Number,
        required: true,
    },
    nameAtTime: { // Para guardar el nombre del producto en el momento de añadirlo al carrito
        type: String,
        required: true,
    },
    imageUrlAtTime: { // Para guardar la URL de la imagen del producto en el momento de añadirlo
        type: String,
        default: '',
    },
    // Podrías añadir más campos aquí si necesitas guardar características específicas del producto
    // en el momento de la adición al carrito (ej. 'unitAtTime': 'kg', 'colorAtTime': 'red')
}, {
    timestamps: false // No necesitamos timestamps para cada ítem individual del carrito
});

// Definición del esquema principal del Carrito
const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true, // Un solo carrito por usuario
        ref: 'User', // Referencia al modelo de Usuario
    },
    items: [cartItemSchema], // Array de subdocumentos de ítems del carrito
}, {
    timestamps: true // Para saber cuándo se creó o actualizó el carrito por última vez
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
