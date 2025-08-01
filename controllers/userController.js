// agroapp-backend/controllers/userController.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
// ⭐ Importar 'check' y 'validationResult' de express-validator ⭐
const { check, validationResult } = require('express-validator');

// NO NECESITAS IMPORTAR uploadProfilePicture AQUÍ, solo en las rutas.
// const { uploadProfilePicture } = require('../config/multer'); 

// ⭐ Función para generar JWT ⭐
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- Middleware de Validación ---

// Validaciones para el registro de usuario
const registerValidation = [
    check('name')
        .notEmpty().withMessage('El nombre es requerido.')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres.')
        .trim().escape(),
    check('email')
        .notEmpty().withMessage('El correo electrónico es requerido.')
        .isEmail().withMessage('Formato de correo electrónico inválido.')
        .normalizeEmail(),
    check('password')
        .notEmpty().withMessage('La contraseña es requerida.')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    check('phoneNumber')
        .optional()
        // ⭐ CAMBIO AQUÍ: Validar como 10 dígitos numéricos ⭐
        .isNumeric().withMessage('El número de teléfono debe contener solo dígitos.')
        .isLength({ min: 10, max: 10 }).withMessage('El número de teléfono debe tener 10 dígitos.'),
    check('showPhoneNumber')
        .optional()
        .isBoolean().withMessage('El campo showPhoneNumber debe ser booleano.'),
];

// Validaciones para el login de usuario
const loginValidation = [
    check('email')
        .notEmpty().withMessage('El correo electrónico es requerido.')
        .isEmail().withMessage('Formato de correo electrónico inválido.')
        .normalizeEmail(),
    check('password')
        .notEmpty().withMessage('La contraseña es requerida.'),
];

// Validaciones para la actualización de perfil de usuario
const updateProfileValidation = [
    check('name')
        .optional()
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres si se proporciona.')
        .trim().escape(),
    check('email')
        .optional()
        .isEmail().withMessage('Formato de correo electrónico inválido si se proporciona.')
        .normalizeEmail(),
    check('password')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres si se proporciona.'),
    check('phoneNumber')
        .optional()
        // ⭐ CAMBIO AQUÍ: Validar como 10 dígitos numéricos ⭐
        .isNumeric().withMessage('El número de teléfono debe contener solo dígitos.')
        .isLength({ min: 10, max: 10 }).withMessage('El número de teléfono debe tener 10 dígitos.'),
    check('showPhoneNumber')
        .optional()
        .isBoolean().withMessage('El campo showPhoneNumber debe ser booleano.'),
];


// --- Controladores de Usuario ---

// @desc    Autenticar un usuario
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    // ⭐ Manejo de errores de validación ⭐
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                profilePicture: user.profilePicture,
                role: user.role,
                phoneNumber: user.phoneNumber,
                showPhoneNumber: user.showPhoneNumber,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Credenciales inválidas.'); // Mensaje genérico por seguridad
    }
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // ⭐ Manejo de errores de validación ⭐
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phoneNumber, showPhoneNumber } = req.body;
    const profilePicture = req.file ? req.file.path : ''; // URL de Cloudinary si se subió un archivo

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('El correo electrónico ya está registrado.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        profilePicture: profilePicture,
        isPremium: false,
        role: 'user',
        phoneNumber: phoneNumber || '',
        showPhoneNumber: showPhoneNumber || false,
    });

    if (user) {
        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isPremium: user.isPremium,
                profilePicture: user.profilePicture,
                role: user.role,
                phoneNumber: user.phoneNumber,
                showPhoneNumber: user.showPhoneNumber,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Datos de usuario inválidos.');
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
        profilePicture: req.user.profilePicture,
        role: req.user.role,
        phoneNumber: req.user.phoneNumber,
        showPhoneNumber: req.user.showPhoneNumber,
    });
});

// @desc    Actualizar el perfil del usuario (incluyendo la foto de perfil)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    // ⭐ Manejo de errores de validación ⭐
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }

    // Actualizar campos de texto si se proporcionan
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) {
        // Si el email cambia, verificar que el nuevo email no exista ya
        if (req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                res.status(400);
                throw new Error('El nuevo correo electrónico ya está en uso por otro usuario.');
            }
        }
        user.email = req.body.email;
    }
    if (req.body.phoneNumber !== undefined) user.phoneNumber = req.body.phoneNumber;
    if (req.body.showPhoneNumber !== undefined) user.showPhoneNumber = req.body.showPhoneNumber;

    // Si se proporciona una nueva contraseña, encriptarla
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    // ⭐ Actualizar foto de perfil si se subió una nueva ⭐
    if (req.file) {
        user.profilePicture = req.file.path;
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isPremium: updatedUser.isPremium,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
        showPhoneNumber: updatedUser.showPhoneNumber,
        token: generateToken(updatedUser._id),
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
                profilePicture: updatedUser.profilePicture,
            },
        });
    } else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});


module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUserProfile,
    updateUserPremiumStatus,
    // ⭐ Exportar los middlewares de validación para usarlos en las rutas ⭐
    registerValidation,
    loginValidation,
    updateProfileValidation,
};