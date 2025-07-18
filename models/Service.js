// agroapp-backend/models/Service.js

const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema(
    {
        user: { // Quién ofrece el servicio
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Por favor, añade un nombre para el servicio.'],
            trim: true,
            maxlength: [100, 'El nombre del servicio no puede exceder los 100 caracteres.'],
        },
        description: {
            type: String,
            required: [true, 'Por favor, añade una descripción para el servicio.'],
            maxlength: [1000, 'La descripción del servicio no puede exceder los 1000 caracteres.'],
        },
        experience: { // Campo para detallar la experiencia o cualificaciones
            type: String,
            required: [true, 'Por favor, describe tu experiencia en este servicio.'],
            maxlength: [500, 'La descripción de la experiencia no puede exceder los 500 caracteres.'],
        },
        imageUrl: { // URL de la imagen/video subido a Cloudinary
            type: String,
            default: '',
        },
        price: { // Cuánto cobra, puede ser 0 si solo es trueque
            type: Number,
            required: [true, 'Por favor, especifica el precio del servicio.'],
            default: 0,
            min: [0, 'El precio no puede ser negativo.'],
        },
        // ⭐ AÑADIDO: Campo category ⭐
        category: {
            type: String,
            required: [true, 'Por favor, selecciona una categoría para el servicio.'],
            trim: true,
            maxlength: [50, 'La categoría no puede exceder los 50 caracteres.'],
        },
        isTradable: { // Si el servicio se puede ofrecer en trueque
            type: Boolean,
            default: false,
        },
        // Nuevo campo para indicar si el servicio está publicado
        isPublished: {
            type: Boolean,
            default: false, // Por defecto, los servicios se crean como borradores
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Service', serviceSchema);
