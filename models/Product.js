// agroapp-backend/models/Product.js

const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    user: { // El usuario que creó el producto (vendedor/campesino)
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: String,
        required: true,
    },
    // ⭐ CAMBIOS CLAVE AQUÍ: 'quantity' se divide en 'stock' y 'unit' ⭐
    stock: { // Cantidad disponible (numérico)
        type: Number,
        required: true,
        default: 0,
        min: 0, // Asegura que el stock no sea negativo
    },
    unit: { // Unidad de medida (ej. "kg", "unidades", "litros")
        type: String,
        required: true,
        default: 'unidades',
    },
    imageUrl: { // URL de la imagen del producto en Cloudinary
        type: String,
        required: true,
        default: '',
    },
    isPublished: { // Campo para controlar la visibilidad (¿publicado o en borrador?)
        type: Boolean,
        required: true,
        default: true, // Por defecto, los productos se publican al crearse
    },
    isTradable: { // Campo para indicar si el producto es truequeable
        type: Boolean,
        required: true, 
        default: false, 
    },
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
