// agroapp-backend/routes/barterRoutes.js

const express = require('express');
const router = express.Router();
const {
    createBarterProposal,
    getMyBarterProposals,
    getBarterProposalById,
    updateBarterProposalStatus,
    createCounterProposal,
    getBarterValueComparison, // <-- Importa la nueva función
} = require('../controllers/barterController'); // Importa las funciones del controlador de trueques
const { protect, authorize } = require('../middleware/authMiddleware'); // Importa los middlewares de autenticación y autorización

// Todas las rutas de trueque son privadas (requieren autenticación)

// @route   POST /api/barter
// @desc    Crear una nueva propuesta de trueque
// @access  Private
router.post('/', protect, createBarterProposal);

// @route   GET /api/barter/myproposals
// @desc    Obtener todas las propuestas de trueque para el usuario autenticado (enviadas y recibidas)
// @access  Private
router.get('/myproposals', protect, getMyBarterProposals);

// @route   GET /api/barter/:id
// @desc    Obtener una sola propuesta de trueque por ID
// @access  Private
router.get('/:id', protect, getBarterProposalById);

// @route   PUT /api/barter/:id/status
// @desc    Actualizar el estado de una propuesta de trueque (aceptar, rechazar, cancelar)
// @access  Private
router.put('/:id/status', protect, updateBarterProposalStatus);

// @route   POST /api/barter/:id/counter
// @desc    Crear una contrapropuesta para una propuesta existente
// @access  Private
router.post('/:id/counter', protect, createCounterProposal);

// --- NUEVA RUTA: Comparación de Valor de Trueque ---
// @route   GET /api/barter/value-comparison
// @desc    Obtener comparación de valor entre dos productos para un trueque
// @access  Private
router.get('/value-comparison', protect, getBarterValueComparison); // <-- Nueva ruta
router.get('/value-comparison', protect, barterController.compareProductValues);

module.exports = router;
