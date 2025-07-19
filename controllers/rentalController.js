const asyncHandler = require('express-async-handler');
const Rental = require('../models/Rental');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const getRentals = asyncHandler(async (req, res) => {
    const rentals = await Rental.find({});
    res.status(200).json(rentals);
});

const getRentalById = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }
    res.status(200).json(rental);
});

const getMyRentals = asyncHandler(async (req, res) => {
    const rentals = await Rental.find({ owner: req.user.id });
    res.status(200).json(rentals);
});

const createRental = asyncHandler(async (req, res) => {
    const { name, description, pricePerDay, category } = req.body;

    // ⭐ LÍNEAS ELIMINADAS: Ya no se verifica si el usuario es premium para crear rentas ⭐
    // const user = await User.findById(req.user.id);
    // if (!user || !user.isPremium) {
    //     res.status(403); // Forbidden
    //     throw new Error('Solo usuarios premium pueden ofrecer rentas.');
    // }

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

    res.status(201).json(rental);
});

const updateRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    if (rental.owner.toString() !== req.user.id) {
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
    );

    res.status(200).json(updatedRental);
});

const deleteRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    if (rental.owner.toString() !== req.user.id) {
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