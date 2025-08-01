const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const getServices = asyncHandler(async (req, res) => {
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const services = await Service.find({ isPublished: true }).populate('user', 'name isPremium phoneNumber showPhoneNumber');
    res.status(200).json(services);
});

const getMyServices = asyncHandler(async (req, res) => {
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const services = await Service.find({ user: req.user.id }).populate('user', 'name isPremium phoneNumber showPhoneNumber');
    res.status(200).json(services);
});

const getServiceById = asyncHandler(async (req, res) => {
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const service = await Service.findById(req.params.id).populate('user', 'name isPremium phoneNumber showPhoneNumber');

    if (!service) {
        res.status(404);
        throw new Error('Servicio no encontrado');
    }

    if (!service.isPublished && (!req.user || (service.user && service.user.id !== req.user.id))) {
        res.status(404);
        throw new Error('Servicio no encontrado o no disponible.');
    }

    res.status(200).json(service);
});

const createService = asyncHandler(async (req, res) => {
    const { name, description, experience, price, category, isTradable } = req.body; 

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
        isPublished: true, // Se publica automáticamente al crear
    });

    res.status(201).json(service);
});

const updateService = asyncHandler(async (req, res) => {
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
    service.category = category || service.category;
    service.isTradable = isTradable !== undefined ? Boolean(isTradable) : service.isTradable;
    service.imageUrl = imageUrl;
    
    // Esta lógica se mantiene para que los usuarios premium puedan cambiar el estado de publicación
    // de sus servicios si lo desean (por ejemplo, despublicar).
    const user = await User.findById(req.user.id);
    if (user && user.isPremium) {
        service.isPublished = isPublished !== undefined ? Boolean(isPublished) : service.isPublished;
    } else if (isPublished !== undefined && Boolean(isPublished) === true) {
        res.status(403);
        throw new Error('Solo usuarios premium pueden cambiar el estado de publicación de servicios.');
    }

    const updatedService = await service.save();
    res.status(200).json(updatedService);
});

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