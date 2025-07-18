// agroapp-backend/routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const {
    getServices,
    getMyServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Middleware para manejar subida de archivos

// Rutas para servicios
router.route('/')
    .get(getServices) // Cualquiera puede ver servicios publicados
    .post(protect, upload.single('image'), createService); // Solo premium y con autenticación para crear, con subida de imagen

router.get('/my-services', protect, getMyServices); // Solo el dueño puede ver sus propios servicios (incluyendo borradores)

router.route('/:id')
    .get(getServiceById) // Cualquiera puede ver un servicio publicado por ID
    .put(protect, upload.single('image'), updateService) // Solo dueño puede actualizar, con subida de imagen
    .delete(protect, deleteService); // Solo dueño puede eliminar

module.exports = router;