// agroapp-backend/controllers/orderController.js

const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product'); // Necesario para verificar stock si se implementa
const Cart = require('../models/Cart'); // Necesario para vaciar el carrito después de crear el pedido

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // Here you might want to check product stock before creating the order
        // For simplicity, we'll proceed directly.
        // In a real app, you'd iterate orderItems, check stock, and potentially reduce it.

        const order = new Order({
            user: req.user._id, // User ID comes from the 'protect' middleware
            orderItems: orderItems.map(item => ({ // Map items to match orderItemSchema
                product: item.product,
                name: item.name,
                quantity: item.quantity,
                image: item.image,
                price: item.price,
            })),
            shippingAddress,
            paymentMethod,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();

        // Optional: Clear the user's cart after a successful order creation
        // This assumes the cart is emptied upon successful order placement
        await Cart.deleteOne({ user: req.user._id }); // Or update the cart to have an empty items array

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'username email' // Populate user details
    ).populate(
        'orderItems.product',
        'name imageUrl price' // Populate product details within orderItems
    );

    if (order) {
        // Ensure only the user who placed the order or an admin can view it
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'administrador') {
            res.status(401);
            throw new Error('Not authorized to view this order');
        }
        res.status(200).json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        // paymentResult will come from the frontend (e.g., Stripe/PayPal response)
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.email_address,
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    // Find all orders for the authenticated user
    const orders = await Order.find({ user: req.user._id }).populate(
        'orderItems.product',
        'name imageUrl' // Populate product details within order items
    ).sort({ createdAt: -1 }); // Sort by most recent

    res.json(orders);
});

// @desc    Update order to delivered (Admin only)
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id username email'); // Populate user info for each order
    res.json(orders);
});

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    updateOrderToDelivered,
    getOrders,
};