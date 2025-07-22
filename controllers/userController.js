// agroapp-backend/controllers/userController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
// ⭐ Importar el nuevo Multer para fotos de perfil ⭐
const { uploadProfilePicture } = require('../config/multer'); // Asegúrate de que la ruta sea correcta

// @desc    Autenticar un usuario
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                profilePicture: user.profilePicture, // ⭐ Incluir profilePicture ⭐
                role: user.role, // También es bueno incluir el rol
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Credenciales inválidas');
    }
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register (ahora con Multer para la imagen)
// @access  Public
// ⭐ Aquí es donde se usa el middleware de Multer para una sola imagen 'profilePicture' ⭐
const registerUser = asyncHandler(async (req, res) => {
    // Multer adjunta el archivo subido a req.file
    // req.body contendrá los campos de texto: name, email, password
    const { name, email, password } = req.body;
    const profilePicture = req.file ? req.file.path : ''; // URL de Cloudinary si se subió un archivo

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Por favor, añade todos los campos (nombre, correo, contraseña).');
    }

    if (!profilePicture) { // Puedes hacer que la imagen sea requerida o no
        // res.status(400);
        // throw new Error('Por favor, sube una foto de perfil.');
        console.log('No se subió foto de perfil, se usará valor por defecto.');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('El usuario ya existe con ese correo electrónico.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        profilePicture: profilePicture, // ⭐ Guardar la URL de la imagen ⭐
        isPremium: false,
        role: 'user', // Asegurarse de que el rol por defecto sea 'user'
    });

    if (user) {
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                profilePicture: user.profilePicture, // ⭐ Incluir profilePicture ⭐
                role: user.role,
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
    // req.user viene del middleware de autenticación (protect)
    res.status(200).json({
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        isPremium: req.user.isPremium,
        profilePicture: req.user.profilePicture, // ⭐ Incluir profilePicture ⭐
        role: req.user.role,
    });
});

// @desc    Actualizar el perfil del usuario (incluyendo la foto de perfil)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id); // req.user.id viene del middleware protect

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }

    // Actualizar campos de texto
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // Si se proporciona una nueva contraseña, encriptarla
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    // ⭐ Actualizar foto de perfil si se subió una nueva ⭐
    if (req.file) { // req.file viene del middleware de Multer
        user.profilePicture = req.file.path; // Guarda la nueva URL de Cloudinary
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isPremium: updatedUser.isPremium,
        profilePicture: updatedUser.profilePicture, // ⭐ Incluir profilePicture ⭐
        role: updatedUser.role,
        token: generateToken(updatedUser._id), // Se genera un nuevo token si se actualiza el perfil
    });
});

// @desc    Actualizar el estado premium del usuario (solo admin)
// @route   PUT /api/users/:id/premium
// @access  Private/Admin
const updateUserPremiumStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.isPremium = req.body.isPremium;

        const updatedUser = await user.save();

        res.json({
            message: 'Estado premium actualizado',
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                isPremium: updatedUser.isPremium,
                profilePicture: updatedUser.profilePicture, // ⭐ Incluir profilePicture ⭐
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
    updateUserProfile,
    updateUserPremiumStatus,
};