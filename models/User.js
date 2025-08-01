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
        // ⭐ NUEVO CAMPO: Número de teléfono para WhatsApp ⭐
        phoneNumber: {
            type: String,
            default: '',
        },
        // ⭐ NUEVO CAMPO OPCIONAL: Control de visibilidad del número ⭐
        showPhoneNumber: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);