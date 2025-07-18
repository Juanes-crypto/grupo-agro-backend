const asyncHandler = require('express-async-handler');
const Rental = require('../models/Rental'); // Asegúrate de crear este modelo
const User = require('../models/User'); // Para verificar el usuario (necesario para verificar isPremium)
const cloudinary = require('../config/cloudinary'); // Tu configuración de Cloudinary (asumiendo que está en config/cloudinary.js)

// @desc    Obtener todas las rentas (público)
// @route   GET /api/rentals
// @access  Public
const getRentals = asyncHandler(async (req, res) => {
    // Aquí podrías añadir filtros para mostrar solo rentas "publicadas" si tu modelo tiene un campo isPublished
    const rentals = await Rental.find({});
    res.status(200).json(rentals);
});

// @desc    Obtener una renta por ID (público)
// @route   GET /api/rentals/:id
// @access  Public
const getRentalById = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }
    res.status(200).json(rental);
});

// @desc    Obtener las rentas del usuario autenticado
// @route   GET /api/rentals/my-rentals
// @access  Private
const getMyRentals = asyncHandler(async (req, res) => {
    // req.user.id viene del middleware protect (contiene el ID del usuario autenticado)
    const rentals = await Rental.find({ owner: req.user.id });
    res.status(200).json(rentals);
});

// @desc    Crear una nueva renta
// @route   POST /api/rentals
// @access  Private (solo usuarios autenticados y premium)
const createRental = asyncHandler(async (req, res) => {
    const { name, description, pricePerDay, category } = req.body;

    if (!name || !description || !pricePerDay || !category) {
        res.status(400);
        throw new Error('Por favor, añade todos los campos obligatorios: nombre, descripción, precio por día y categoría.');
    }

    // Verificar si el usuario que crea es premium
    const user = await User.findById(req.user.id);
    if (!user || !user.isPremium) {
        res.status(403); // Forbidden
        throw new Error('Solo usuarios premium pueden ofrecer rentas.');
    }

    let imageUrl = '';
    if (req.file) {
        // Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agroapp_rentals', // Carpeta específica en Cloudinary para rentas
        });
        imageUrl = result.secure_url;
    } else {
        // Opcional: Asignar una imagen por defecto si no se sube ninguna
        imageUrl = 'https://placehold.co/600x400/E0E0E0/333333?text=Renta+Agro';
    }

    const rental = await Rental.create({
        name,
        description,
        pricePerDay,
        category,
        imageUrl,
        owner: req.user.id, // Asigna el ID del usuario autenticado como propietario
    });

    res.status(201).json(rental);
});

// @desc    Actualizar una renta
// @route   PUT /api/rentals/:id
// @access  Private (solo el propietario)
const updateRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    // Asegurarse de que el usuario logueado es el propietario de la renta
    if (rental.owner.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para actualizar esta renta');
    }

    let imageUrl = req.body.imageUrl || rental.imageUrl; // Mantener la URL existente por defecto
    if (req.file) {
        // Si hay una nueva imagen, subirla a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'agroapp_rentals',
        });
        imageUrl = result.secure_url;
    }

    const updatedRental = await Rental.findByIdAndUpdate(
        req.params.id,
        { ...req.body, imageUrl }, // Actualiza todos los campos del body y la nueva URL de imagen
        { new: true } // Devuelve el documento actualizado
    );

    res.status(200).json(updatedRental);
});

// @desc    Eliminar una renta
// @route   DELETE /api/rentals/:id
// @access  Private (solo el propietario)
const deleteRental = asyncHandler(async (req, res) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        res.status(404);
        throw new Error('Renta no encontrada');
    }

    // Asegurarse de que el usuario logueado es el propietario de la renta
    if (rental.owner.toString() !== req.user.id) {
        res.status(401);
        throw new Error('No autorizado para eliminar esta renta');
    }

    await rental.deleteOne(); // Usar deleteOne() para Mongoose 6+

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