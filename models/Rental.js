const mongoose = require('mongoose');

const rentalSchema = mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Referencia al modelo de Usuario
        },
        name: {
            type: String,
            required: [true, 'Por favor, añade un nombre para la renta'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Por favor, añade una descripción para la renta'],
        },
        pricePerDay: {
            type: Number,
            required: [true, 'Por favor, añade un precio por día'],
            min: 0,
        },
        category: {
            type: String,
            required: [true, 'Por favor, selecciona una categoría'],
            enum: [ // Puedes ajustar estas categorías si tienes una lista específica
                'Tractores',
                'Sembradoras',
                'Cosechadoras',
                'Drones Agrícolas',
                'Implementos de Labranza',
                'Equipo de Riego',
                'Vehículos de Carga',
                'Otros Equipos'
            ],
        },
        imageUrl: {
            type: String,
            required: [true, 'Por favor, añade una URL de imagen'],
            default: 'https://placehold.co/600x400/E0E0E0/333333?text=Renta', // Placeholder por defecto
        },
        // Puedes añadir más campos como disponibilidad, ubicación, etc.
    },
    {
        timestamps: true, // Añade createdAt y updatedAt automáticamente
    }
);

module.exports = mongoose.model('Rental', rentalSchema);