// agroapp-backend/models/User.js (Verificar)

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
        // ⭐ Asegúrate de que este campo exista ⭐
        isPremium: {
            type: Boolean,
            default: false, // Por defecto, los usuarios no son premium
        },
        // Puedes añadir otros roles si los necesitas
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);