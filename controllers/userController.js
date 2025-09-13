const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const { sendEmail, emailTemplates } = require('../services/emailService'); // ✅ AÑADIDO

// ⭐ Función para generar JWT ⭐
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '3d',
    });
};

// ⭐ Middleware de verificación reCAPTCHA ⭐
// En la función verifyRecaptcha
const verifyRecaptcha = async (req, res, next) => {
  console.log('=== 🔍 VERIFY RECAPTCHA MIDDLEWARE ===');
  console.log('Hora de la solicitud:', new Date().toISOString());
  console.log('Entorno:', process.env.NODE_ENV);
  console.log('Token recibido:', req.body.recaptchaToken ? 'Sí' : 'No');
  
  const recaptchaToken = req.body.recaptchaToken;

  if (!recaptchaToken) {
    console.log('❌ Error: No se recibió token reCAPTCHA');
    return res.status(400).json({
      success: false,
      message: 'Token reCAPTCHA es requerido'
    });
  }

  // ✅ PARA DESARROLLO LOCAL: Verificación más permisiva
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 MODO DESARROLLO: Verificación simulada');
    console.log('Longitud del token:', recaptchaToken.length);
    
    // Simular verificación para desarrollo
    if (recaptchaToken && recaptchaToken.length > 10) {
      console.log('✅ Token aceptado en desarrollo');
      return next();
    } else {
      console.log('❌ Token demasiado corto para desarrollo');
      return res.status(400).json({
        success: false,
        message: 'Token reCAPTCHA inválido en desarrollo'
      });
    }
  }

  // ✅ MODO PRODUCCIÓN: Verificación real
  try {
    console.log('🔗 Verificando token con Google...');
    console.log('Secret key presente:', process.env.RECAPTCHA_SECRET_KEY ? 'Sí' : 'No');
    
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken
      },
      timeout: 10000
    });
    
    console.log('📊 Respuesta de Google:', response.data);

    if (response.data.success) {
      console.log('✅ reCAPTCHA verificado exitosamente');
      return next();
    } else {
      console.log('❌ Error de reCAPTCHA:', response.data['error-codes']);
      
      return res.status(400).json({
        success: false,
        message: 'Error de verificación de seguridad',
        errors: response.data['error-codes']
      });
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error de conexión con el servicio de verificación'
    });
  }
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
        .isNumeric().withMessage('El número de teléfono debe contener solo dígitos.')
        .isLength({ min: 10, max: 10 }).withMessage('El número de teléfono debe tener 10 dígitos.'),
    check('showPhoneNumber')
        .optional()
        .isBoolean().withMessage('El campo showPhoneNumber debe ser booleano.'),
];

// @desc    Autenticar un usuario
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  // Validar antes de verificar reCAPTCHA
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user._id);
    
    // Configuración simplificada de cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium
      },
      token
    });
  }
  
  return res.status(401).json({ message: 'Credenciales inválidas' });
});

// @desc    Registrar un nuevo usuario
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    console.log('=== REGISTER REQUEST RECEIVED ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.files);

    // Validaciones
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phoneNumber, showPhoneNumber, location } = req.body;
    
    // Verificar que la ubicación esté presente
    if (!location) {
        return res.status(400).json({ 
            message: 'La ubicación es requerida' 
        });
    }

    // ✅ Obtener la imagen de perfil de req.files
    const profilePicture = req.files && req.files['profilePicture'] 
        ? req.files['profilePicture'][0].path 
        : '';

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ 
            message: 'El correo electrónico ya está registrado.' 
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profilePicture: profilePicture,
            isPremium: false,
            role: 'user',
            phoneNumber: phoneNumber || '',
            showPhoneNumber: showPhoneNumber === 'true' || showPhoneNumber === true,
            location: location
        });

        if (user) {
            // ✅ ENVIAR CORREO DE BIENVENIDA (NUEVO)
            try {
                await sendEmail(
                    user.email,
                    '¡Bienvenido a AgroApp! 🌱',
                    emailTemplates.welcome(user.name)
                );
                console.log(`✅ Correo de bienvenida enviado a: ${user.email}`);
            } catch (emailError) {
                console.error('❌ Error enviando correo de bienvenida:', emailError);
                // No fallar el registro si el correo falla
            }

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
                    location: user.location
                },
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ 
                message: 'Datos de usuario inválidos.' 
            });
        }
    } catch (error) {
        // Capturar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            console.log('Mongoose validation error:', error.errors);
            const errorMessages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: errorMessages.join(', ') 
            });
        }
        
        // Capturar errores de duplicado
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'El correo electrónico ya está registrado.' 
            });
        }
        
        // Propagar otros errores
        console.error('Error creating user:', error);
        return res.status(500).json({ 
            message: 'Error interno del servidor al crear usuario' 
        });
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

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error en getUserProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil',
            error: error.message
        });
    }
});

// @desc    Actualizar el perfil del usuario (incluyendo la foto de perfil)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    console.log('=== UPDATE PROFILE REQUEST RECEIVED ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

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
    
    // Actualizar foto de perfil
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
    getUserProfile,
    getMe,
    updateUserProfile,
    updateUserPremiumStatus,
    // ⭐ Exportar el middleware de reCAPTCHA ⭐
    verifyRecaptcha,
    // Exportar los middlewares de validación
    registerValidation,
    loginValidation,
    updateProfileValidation,
};