 // agroapp-backend/controllers/cartController.js

const asyncHandler = require('express-async-handler'); // Para manejar errores en funciones asíncronas
const Cart = require('../models/Cart'); // Importa el modelo de Carrito
const Product = require('../models/Product'); // Importa el modelo de Producto

// @desc    Obtener el carrito del usuario autenticado
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    // req.user.id viene del middleware 'protect'
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (cart) {
        res.status(200).json(cart);
    } else {
        // Si el usuario no tiene un carrito, podemos devolver un carrito vacío o crear uno
        res.status(200).json({ user: req.user.id, items: [] });
    }
});

// @desc    Añadir un producto al carrito o actualizar su cantidad si ya existe
// @route   POST /api/cart
// @access  Private
const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body; // Esperamos el ID del producto y la cantidad

    // Validar que la cantidad sea un número positivo
    if (!productId || !quantity || quantity <= 0) {
        res.status(400);
        throw new Error('Por favor, proporciona un ID de producto válido y una cantidad positiva.');
    }

    // Buscar el producto para obtener su información actual (precio, nombre, imagen)
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado.');
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (cart) {
        // El carrito ya existe para este usuario
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // El producto ya existe en el carrito, actualiza la cantidad
            cart.items[itemIndex].quantity += quantity;
            // Opcional: Actualizar priceAtTime, nameAtTime, imageUrlAtTime si el producto ha cambiado
            cart.items[itemIndex].priceAtTime = product.price;
            cart.items[itemIndex].nameAtTime = product.name;
            cart.items[itemIndex].imageUrlAtTime = product.imageUrl;
        } else {
            // El producto no existe en el carrito, añádelo
            cart.items.push({
                product: productId,
                quantity,
                priceAtTime: product.price,
                nameAtTime: product.name,
                imageUrlAtTime: product.imageUrl,
            });
        }
        cart = await cart.save();
        // Popula el producto para la respuesta, para que el frontend tenga los detalles
        await cart.populate('items.product');
        res.status(200).json(cart);
    } else {
        // No existe un carrito para este usuario, crea uno nuevo
        const newCart = await Cart.create({
            user: req.user.id,
            items: [{
                product: productId,
                quantity,
                priceAtTime: product.price,
                nameAtTime: product.name,
                imageUrlAtTime: product.imageUrl,
            }],
        });
        // Popula el producto para la respuesta
        await newCart.populate('items.product');
        res.status(201).json(newCart);
    }
});

// @desc    Actualizar la cantidad de un producto en el carrito
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity <= 0) {
        res.status(400);
        throw new Error('Por favor, proporciona una cantidad positiva.');
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error('Carrito no encontrado.');
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
        // Actualiza la cantidad
        cart.items[itemIndex].quantity = quantity;
        cart = await cart.save();
        await cart.populate('items.product');
        res.status(200).json(cart);
    } else {
        res.status(404);
        throw new Error('Producto no encontrado en el carrito.');
    }
});

// @desc    Eliminar un producto del carrito
// @route   DELETE /api/cart/:productId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error('Carrito no encontrado.');
    }

    // Filtra los ítems para eliminar el producto especificado
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
        res.status(404);
        throw new Error('Producto no encontrado en el carrito.');
    }

    cart = await cart.save();
    await cart.populate('items.product');
    res.status(200).json(cart);
});

// @desc    Vaciar todo el carrito del usuario
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        res.status(404);
        throw new Error('Carrito no encontrado.');
    }

    cart.items = []; // Vacía el array de ítems
    cart = await cart.save();
    res.status(200).json(cart); // Devuelve el carrito vacío
});


module.exports = {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
