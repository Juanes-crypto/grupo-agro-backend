// agroapp-backend/routes/barterRoutes.js

const express = require('express');
const router = express.Router();

// Importa DESTRUCTURANDO las funciones específicas del controlador
// Asegúrate de que estos nombres coincidan con los que exportas en barterController.js
const {
    createBarterProposal,
    getMyBarterProposals, // Esta es la función correcta para obtener las propuestas del usuario
    getBarterProposalById,
    updateBarterProposalStatus,
    // getUserBarterProposals, // <-- ELIMINA ESTA LÍNEA si no la tienes en el controlador o si es duplicada con getMyBarterProposals
    createCounterProposal,
    getBarterValueComparison,
    // Puedes añadir aquí otras funciones de aceptación/rechazo/cancelación de contraofertas si las usas
    acceptCounterProposal,
    rejectCounterProposal,
    cancelBarterProposal
} = require('../controllers/barterController'); // Importa las funciones del controlador de trueques

const { protect, authorize } = require('../middleware/authMiddleware'); // Importa los middlewares de autenticación y autorización

// ⭐ Rutas más específicas primero, luego las dinámicas ⭐

// @route   GET /api/barter/value-comparison
// @desc    Obtener comparación de valor entre dos productos para un trueque
// @access  Private
router.get('/value-comparison', protect, getBarterValueComparison);

// @route   GET /api/barter/myproposals
// @desc    Obtener todas las propuestas de trueque para el usuario autenticado (enviadas y recibidas)
// @access  Private
router.get('/myproposals', protect, getMyBarterProposals); // <-- DEJA SOLO ESTA LÍNEA para tus propuestas

// @route   POST /api/barter
// @desc    Crear una nueva propuesta de trueque
// @access  Private
router.post('/', protect, createBarterProposal);

// @route   PUT /api/barter/:id/status
// @desc    Actualizar el estado de una propuesta de trueque (aceptar, rechazar, cancelar)
// @access  Private
router.put('/:id/status', protect, updateBarterProposalStatus);

// @route   POST /api/barter/:id/counter
// @desc    Crear una contrapropuesta para una propuesta existente
// @access  Private
router.post('/:id/counter', protect, createCounterProposal);

// @route   PUT /api/barter/:id/counter/accept
// @desc    Aceptar una contrapropuesta
// @access  Private
router.put('/:id/counter/accept', protect, acceptCounterProposal);

// @route   PUT /api/barter/:id/counter/reject
// @desc    Rechazar una contrapropuesta
// @access  Private
router.put('/:id/counter/reject', protect, rejectCounterProposal);

// @route   PUT /api/barter/:id/cancel
// @desc    Cancelar una propuesta
// @access  Private
router.put('/:id/cancel', protect, cancelBarterProposal);


// @route   GET /api/barter/:id
// @desc    Obtener una sola propuesta de trueque por ID
// @access  Private
// ⭐ Esta ruta dinámica va SIEMPRE AL FINAL de las rutas que empiezan con /api/barter/ ⭐
router.get('/:id', protect, getBarterProposalById);


module.exports = router;