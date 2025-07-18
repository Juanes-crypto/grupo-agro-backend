// agroapp-backend/controllers/userController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Asegúrate de tener el modelo User

// @desc    Autenticar un usuario
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // Check password
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Credenciales inválidas');
    }
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new new Error('Por favor, añade todos los campos');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Datos de usuario inválidos');
    }
});

// @desc    Obtener datos del usuario
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        isPremium: req.user.isPremium,
    });
});

// @desc    Actualizar el perfil del usuario
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Si se proporciona una nueva contraseña, encriptarla
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isPremium: updatedUser.isPremium,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});

// @desc    Actualizar el estado premium del usuario (solo admin)
// @route   PUT /api/users/:id/premium
// @access  Private/Admin
const updateUserPremiumStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.isPremium = req.body.isPremium; // Se asume que req.body.isPremium es un booleano

        const updatedUser = await user.save();

        res.json({
            message: 'Estado premium actualizado',
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                isPremium: updatedUser.isPremium,
            },
        });
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});

// ⭐ Función para generar JWT ⭐
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile, // ⭐ AÑADIR ESTA LÍNEA ⭐
    updateUserPremiumStatus, // ⭐ AÑADIR ESTA LÍNEA TAMBIÉN ⭐
};