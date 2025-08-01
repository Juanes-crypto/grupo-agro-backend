const asyncHandler = require('express-async-handler');
const Rental = require('../models/Rental');
const User = require('../models/User'); // Asegúrate de importar el modelo de Usuario si no lo estás haciendo ya
const cloudinary = require('../config/cloudinary');

const getRentals = asyncHandler(async (req, res) => {
    // Añadimos .populate('owner') para traer la información completa del usuario propietario
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const rentals = await Rental.find({}).populate('owner', 'name email isPremium phoneNumber showPhoneNumber'); // Trae name, email, isPremium, phoneNumber y showPhoneNumber del owner
    res.status(200).json(rentals);
});

const getRentalById = asyncHandler(async (req, res) => {
    // También populamos el owner para los detalles de una sola renta
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const rental = await Rental.findById(req.params.id).populate('owner', 'name email isPremium phoneNumber showPhoneNumber');

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }
    res.status(200).json(rental);
});

const getMyRentals = asyncHandler(async (req, res) => {
    // Populamos el owner también para "Mis Rentas"
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const rentals = await Rental.find({ owner: req.user.id }).populate('owner', 'name email isPremium phoneNumber showPhoneNumber');
    res.status(200).json(rentals);
});

const createRental = asyncHandler(async (req, res) => {
    const { name, description, pricePerDay, category } = req.body;

    if (!name || !description || !pricePerDay || !category) {
        res.status(400);
        throw new Error('Por favor, añade todos los campos obligatorios: nombre, descripción, precio por día y categoría.');
    }

    let imageUrl = '';
    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agroapp_rentals',
        });
        imageUrl = result.secure_url;
    } else {
        imageUrl = 'https://placehold.co/600x400/E0E0E0/333333?text=Renta+Agro';
    }

    const rental = await Rental.create({
        name,
        description,
        pricePerDay,
        category,
        imageUrl,
        owner: req.user.id,
    });

    // Para la respuesta de creación, también populamos el owner para que el frontend reciba la info completa
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const createdRental = await Rental.findById(rental._id).populate('owner', 'name email isPremium phoneNumber showPhoneNumber');

    res.status(201).json(createdRental);
});

const updateRental = asyncHandler(async (req, res) => {
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const rental = await Rental.findById(req.params.id).populate('owner', 'name email isPremium phoneNumber showPhoneNumber'); // Populamos para verificar el owner y obtener los nuevos campos

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    if (rental.owner._id.toString() !== req.user.id) { // Usamos rental.owner._id ahora
        res.status(401);
        throw new Error('No autorizado para actualizar esta renta');
    }

    let imageUrl = req.body.imageUrl || rental.imageUrl;
    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agroapp_rentals',
        });
        imageUrl = result.secure_url;
    }

    const updatedRental = await Rental.findByIdAndUpdate(
        req.params.id,
        { ...req.body, imageUrl },
        { new: true }
    ).populate('owner', 'name email isPremium phoneNumber showPhoneNumber'); // Populamos también la respuesta de actualización con los nuevos campos

    res.status(200).json(updatedRental);
});

const deleteRental = asyncHandler(async (req, res) => {
    // MODIFICADO: Añadido 'phoneNumber showPhoneNumber' para poblar
    const rental = await Rental.findById(req.params.id).populate('owner', 'name email isPremium phoneNumber showPhoneNumber'); // Populamos para verificar el owner y obtener los nuevos campos

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    if (rental.owner._id.toString() !== req.user.id) { // Usamos rental.owner._id ahora
        res.status(401);
        throw new Error('No autorizado para eliminar esta renta');
    }

    await rental.deleteOne();

    res.status(200).json({ message: 'Renta eliminada con éxito' });
});

module.exports = {
    getRentals,
    getRentalById,
    getMyRentals,
    createRental,
    updateRental,
    deleteRental,
};