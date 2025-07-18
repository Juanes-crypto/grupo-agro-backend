// agroapp-backend/controllers/serviceController.js

const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const User = require('../models/User'); // Necesario para comprobar si el usuario es premium
const cloudinary = require('../config/cloudinary'); // Para la subida de imágenes/videos

// @desc    Obtener todos los servicios (solo publicados para no-premium, todos para dueños/admin)
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res) => {
    let services;
    // Si hay un usuario autenticado y es premium, o si es un admin, podría ver todos.
    // Para simplificar ahora, solo mostramos los publicados a todos.
    // Más adelante, podemos añadir lógica para que el dueño vea sus borradores.
    services = await Service.find({ isPublished: true }).populate('user', 'name isPremium');
    res.status(200).json(services);
});

// @desc    Obtener servicios del usuario autenticado
// @route   GET /api/services/my-services
// @access  Private (Premium User only)
const getMyServices = asyncHandler(async (req, res) => {
    // Verificar si el usuario es premium
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium) {
        res.status(403);
        throw new Error('Acceso denegado. Solo usuarios premium pueden ver sus servicios.');
    }

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

    // Si el servicio no está publicado y el usuario no es el dueño, se deniega el acceso.
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
    const { name, description, experience, price, isTradable } = req.body;

    // Verificar que el usuario es premium
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium) {
        res.status(403);
        throw new Error('Solo usuarios premium pueden crear servicios.');
    }

    if (!name || !description || !experience || price === undefined) {
        res.status(400);
        throw new Error('Por favor, ingresa todos los campos obligatorios: nombre, descripción, experiencia y precio.');
    }

    let imageUrl = '';
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'agroapp-services', // Carpeta en Cloudinary
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
        isTradable: Boolean(isTradable), // Asegura que sea un booleano
        imageUrl,
        isPublished: false, // Por defecto, se crea como borrador
    });

    res.status(201).json(service);
});

// @desc    Actualizar un servicio
// @route   PUT /api/services/:id
// @access  Private (Owner only)
const updateService = asyncHandler(async (req, res) => {
    const { name, description, experience, price, isTradable, isPublished } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
        res.status(404);
        throw new Error('Servicio no encontrado');
    }

    // Asegurarse de que el usuario logueado es el dueño del servicio
    if (service.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para actualizar este servicio');
    }

    let imageUrl = service.imageUrl; // Mantener la imagen actual por defecto
    if (req.file) {
        // Si hay una nueva imagen, subirla y borrar la antigua si existe
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
    service.price = price !== undefined ? price : service.price; // Permite price = 0
    service.isTradable = isTradable !== undefined ? Boolean(isTradable) : service.isTradable;
    service.imageUrl = imageUrl;
    // Solo permitir cambiar isPublished si el usuario es premium
    const user = await User.findById(req.user.id);
    if (user && user.isPremium) {
        service.isPublished = isPublished !== undefined ? Boolean(isPublished) : service.isPublished;
    } else if (isPublished !== undefined && Boolean(isPublished) === true) {
        // Si un no-premium intenta publicar, se deniega
        res.status(403);
        throw new Error('Solo usuarios premium pueden publicar servicios.');
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

    // Asegurarse de que el usuario logueado es el dueño del servicio
    if (service.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para eliminar este servicio');
    }

    // Eliminar imagen de Cloudinary si existe
    if (service.imageUrl) {
        const publicId = service.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`agroapp-services/${publicId}`);
    }

    await Service.deleteOne({ _id: service._id }); // O service.remove() si usas Mongoose < 6
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