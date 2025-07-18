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
    quantity: {
        type: String, // Manteniendo como String para flexibilidad (ej. "10 kg", "5 unidades")
        required: true,
        default: '0 unidades',
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
    // ✨ CAMPO NUEVO Y SOLUCIÓN PARA EL PUNTO 6 ✨
    isTradable: { // Campo para indicar si el producto es truequeable
        type: Boolean,
        required: true, // Se recomienda que este campo sea requerido para claridad
        default: false, // Por defecto, no es truequeable a menos que se especifique
    },
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
