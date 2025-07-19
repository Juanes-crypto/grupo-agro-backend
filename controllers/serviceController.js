// agroapp-backend/controllers/serviceController.js

const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

// @desc    Obtener todos los servicios (solo publicados para no-premium, todos para dueños/admin)
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res) => {
    let services;
<<<<<<< HEAD
    // La lista pública solo muestra servicios que estén publicados.
    // Esto asegura que los servicios recién creados (que ahora se publicarán automáticamente) sean visibles.
=======
>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
    services = await Service.find({ isPublished: true }).populate('user', 'name isPremium');
    res.status(200).json(services);
});

// @desc    Obtener servicios del usuario autenticado
// @route   GET /api/services/my-services
// @access  Private (Premium User only)
const getMyServices = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium) {
        res.status(403);
        throw new Error('Acceso denegado. Solo usuarios premium pueden ver sus servicios.');
    }

    // Un usuario premium puede ver TODOS sus servicios, incluyendo los que no estén publicados (borradores).
    const services = await Service.find({ user: req.user.id }).populate('user', 'name isPremium');
    res.status(200).json(services);
});

// @desc    Obtener un solo servicio por ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id).populate('user', 'name isPremium');

    if (!service) {
        res.status(404);
        throw new Error('Servicio no encontrado');
    }

<<<<<<< HEAD
    // Si el servicio no está publicado y el usuario NO es el dueño o no está autenticado, se deniega el acceso.
    // Esto evita que cualquiera vea un servicio que no ha sido publicado.
=======
>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
    if (!service.isPublished && (!req.user || (service.user && service.user.id !== req.user.id))) {
        res.status(404);
        throw new Error('Servicio no encontrado o no disponible.');
    }

    res.status(200).json(service);
});

// @desc    Crear un nuevo servicio
// @route   POST /api/services
// @access  Private (Premium User only)
const createService = asyncHandler(async (req, res) => {
    const { name, description, experience, price, category, isTradable } = req.body; 

<<<<<<< HEAD
    // Verificar que el usuario es premium (esta restricción la has mantenido)
=======
>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium) {
        res.status(403);
        throw new Error('Solo usuarios premium pueden crear servicios.');
    }

    if (!name || !description || !experience || price === undefined || price === '' || !category) { 
        res.status(400);
        throw new Error('Por favor, ingresa todos los campos obligatorios: nombre, descripción, experiencia, precio y categoría.');
    }

    let imageUrl = '';
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'agroapp-services',
            });
            imageUrl = result.secure_url;
        } catch (uploadError) {
            console.error('Error al subir imagen a Cloudinary:', uploadError);
            res.status(500);
            throw new Error('Error al subir la imagen del servicio.');
        }
    }

    const service = await Service.create({
        user: req.user.id,
        name,
        description,
        experience,
        price,
        category,
        isTradable: Boolean(isTradable),
        imageUrl,
<<<<<<< HEAD
        // ⭐ CAMBIO CRÍTICO AQUÍ: Publicar automáticamente al crear ⭐
        isPublished: true, // Ahora los servicios se crean como publicados por defecto
=======
        // ⭐ CAMBIO AQUÍ: Establecer isPublished en true para que aparezca inmediatamente ⭐
        isPublished: true, 
>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
    });

    res.status(201).json(service);
});

// @desc    Actualizar un servicio
// @route   PUT /api/services/:id
// @access  Private (Owner only)
const updateService = asyncHandler(async (req, res) => {
    // Es buena práctica incluir 'category' aquí también si se puede actualizar
    const { name, description, experience, price, category, isTradable, isPublished } = req.body; 
    const service = await Service.findById(req.params.id);

    if (!service) {
        res.status(404);
        throw new Error('Servicio no encontrado');
    }

    if (service.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para actualizar este servicio');
    }

    let imageUrl = service.imageUrl;
    if (req.file) {
        if (service.imageUrl) {
            const publicId = service.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`agroapp-services/${publicId}`);
        }
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'agroapp-services',
            });
            imageUrl = result.secure_url;
        } catch (uploadError) {
            console.error('Error al subir nueva imagen a Cloudinary:', uploadError);
            res.status(500);
            throw new Error('Error al subir la nueva imagen del servicio.');
        }
    }

    service.name = name || service.name;
    service.description = description || service.description;
    service.experience = experience || service.experience;
    service.price = price !== undefined ? price : service.price;
    service.category = category || service.category; // ⭐ ACTUALIZADO: Permite actualizar category ⭐
    service.isTradable = isTradable !== undefined ? Boolean(isTradable) : service.isTradable;
    service.imageUrl = imageUrl;
<<<<<<< HEAD
    
    // ⭐ Lógica para permitir a usuarios premium cambiar el estado de publicación ⭐
    // Dado que ahora se publican automáticamente, esto permite a un premium "despublicar" si lo desea.
=======

>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
    const user = await User.findById(req.user.id);
    if (user && user.isPremium) {
        service.isPublished = isPublished !== undefined ? Boolean(isPublished) : service.isPublished;
    } else if (isPublished !== undefined && Boolean(isPublished) === true) {
<<<<<<< HEAD
        // Si un no-premium intenta publicar, se deniega (aunque por tu lógica, solo premium crea servicios)
=======
>>>>>>> f9e9467b5e6fc7d4a15906a626f2d53ef2e927b5
        res.status(403);
        throw new Error('Solo usuarios premium pueden cambiar el estado de publicación de servicios.');
    }

    const updatedService = await service.save();
    res.status(200).json(updatedService);
});

// @desc    Eliminar un servicio
// @route   DELETE /api/services/:id
// @access  Private (Owner only)
const deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        res.status(404);
        throw new Error('Servicio no encontrado');
    }

    if (service.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para eliminar este servicio');
    }

    if (service.imageUrl) {
        const publicId = service.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`agroapp-services/${publicId}`);
    }

    await Service.deleteOne({ _id: service._id });
    res.status(200).json({ message: 'Servicio eliminado exitosamente' });
});

module.exports = {
    getServices,
    getMyServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
};
