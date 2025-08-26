// agroapp-backend/models/User.js

const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Por favor, añade un nombre'],
        },
        email: {
            type: String,
            required: [true, 'Por favor, añade un correo electrónico'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Por favor, añade una contraseña'],
        },
        profilePicture: {
            type: String,
            default: '',
        },
        isPremium: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        reputation: {
            type: Number,
            default: 3,
            min: 1,
            max: 5
        },
        phoneNumber: {
            type: String,
            default: '',
        },
        showPhoneNumber: {
            type: Boolean,
            default: false,
        },
        location: {
            type: {
                city: {
                    type: String,
                    required: [true, 'Por favor, especifica la ciudad'],
                },
                address: {
                    type: String,
                    required: [true, 'Por favor, especifica la dirección completa'],
                },
                coordinates: {
                    type: [Number],
                    required: [true, 'Las coordenadas son necesarias para los filtros'],
                }
            },
            required: [true, 'La ubicación es un campo requerido'],
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);