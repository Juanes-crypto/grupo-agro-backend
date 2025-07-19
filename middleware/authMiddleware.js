// agroapp-backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');
      // Dentro de protect, después de req.user = await User.findById(decoded.id).select('-password');
console.log('Middleware Auth - ID del usuario del token decodificado:', decoded.id);
console.log('Middleware Auth - ID del usuario encontrado en DB (req.user._id):', req.user._id);
console.log('Middleware Auth - Email del usuario encontrado:', req.user.email); // Opcional, pero útil
      if (!req.user) {
        res.status(401);
        throw new Error('No autorizado, token fallido: usuario no encontrado');
      }

      console.log('Usuario adjuntado a req.user en middleware protect:', req.user._id);
      next();
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      res.status(401);
      throw new Error('No autorizado, token fallido');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('No autorizado, no hay token');
  }
});

// Middleware para autorizar acceso basado en si el usuario es Premium (o si necesita serlo)
// Lo adaptamos para que pueda verificar si se requiere un estado premium para una ruta.
// Si roles es vacío, significa que cualquier usuario autenticado puede acceder.
// Si roles incluye 'premium', solo los premium pueden acceder.
const authorize = (requiredStatus = []) => {
  // requiredStatus puede ser un string único o un array de strings (ej. ['premium'])
  if (typeof requiredStatus === 'string') {
    requiredStatus = [requiredStatus];
  }

  return (req, res, next) => {
    // Si no se requiere ningún estado específico, simplemente pasa
    if (requiredStatus.length === 0) {
      return next();
    }

    // Verificar si el usuario está autenticado y si cumple con el estado requerido
    if (req.user) {
      // Si se requiere 'premium' y el usuario es premium
      if (requiredStatus.includes('premium') && req.user.isPremium) {
        next();
      }
      // Podrías añadir más condiciones aquí si hubiera otros estados (ej. 'admin')
      else if (!requiredStatus.includes('premium')) { // Si no se requiere premium, cualquier autenticado pasa
          next();
      }
      else {
        res.status(403); // Prohibido
        throw new Error('No autorizado para acceder a esta ruta. Se requiere estado Premium.');
      }
    } else {
      res.status(401); // No autorizado (no hay usuario en req.user)
      throw new Error('No autorizado, debes iniciar sesión.');
    }
  };
};

module.exports = { protect, authorize };
