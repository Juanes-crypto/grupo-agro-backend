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
        // ⭐ Nuevo campo para la imagen de perfil ⭐
        profilePicture: {
            type: String, // Guardaremos la URL de Cloudinary aquí
            default: '', // Valor por defecto si no se sube ninguna imagen
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);