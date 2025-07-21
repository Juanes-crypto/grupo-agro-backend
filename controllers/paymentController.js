// agroapp-backend/controllers/paymentController.js
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('../models/Product');
const Order = require('../models/Order'); // Asegúrate de que Order está importado

// @desc    Crear una sesión de Stripe Checkout
// @route   POST /api/payments/create-checkout-session
// @access  Private (requiere autenticación del usuario que compra)
const createCheckoutSession = asyncHandler(async (req, res) => {
    const { items, productId, quantity, orderId, totalAmount } = req.body;

    console.log('--- createCheckoutSession START ---');
    console.log('Request body:', req.body);
    console.log('Authenticated user ID:', req.user ? req.user.id : 'No user'); // Añadida comprobación req.user

    let line_items_for_stripe = [];
    let metadata_for_stripe = {
        buyerId: req.user.id.toString(),
    };

    if (!req.user || !req.user.id) {
        res.status(401);
        throw new Error('No autorizado, token no válido o usuario no encontrado.');
    }

    if (items && Array.isArray(items) && items.length > 0) {
        console.log('Processing as cart payment...');
        if (!orderId || !totalAmount) {
            res.status(400);
            throw new Error('orderId y totalAmount son requeridos para pagos de carrito.');
        }

        console.log(`Attempting to find order with ID: ${orderId}`);
        const order = await Order.findById(orderId).populate('orderItems.product'); // Popula los detalles del producto
        console.log('Order found:', order ? order._id : 'Not found');

        if (!order) {
            res.status(404);
            throw new Error('Orden no encontrada o no pertenece al usuario.'); // Texto original estaba bien
        }
        if (order.user.toString() !== req.user.id) { // Asegura que la orden pertenece al usuario autenticado
            res.status(401);
            throw new Error('No autorizado, la orden no pertenece al usuario.');
        }
        if (order.isPaid) {
            res.status(400);
            throw new Error('Esta orden ya ha sido pagada.');
        }

        console.log('Order items to process:', order.orderItems);

        for (const orderItem of order.orderItems) {
            console.log('Processing order item:', orderItem);

            // ⭐ MEJORAS EN LA VALIDACIÓN Y ASIGNACIÓN DE PROPIEDADES ⭐
            // Aseguramos que el precio y la cantidad sean números válidos
            if (!orderItem.product || typeof orderItem.price !== 'number' || orderItem.quantity <= 0 || typeof orderItem.quantity !== 'number') {
                console.error('Error: Datos de producto inválidos en la orden. orderItem:', orderItem);
                res.status(400);
                throw new Error('Datos de producto inválidos o cantidad no numérica en un ítem de la orden.');
            }

            // Fallbacks si la población del producto falla o si el producto es null
            const productName = orderItem.name || (orderItem.product ? orderItem.product.name : 'Producto del carrito');
            const productDescription = orderItem.product ? orderItem.product.description : `ID: ${orderItem.product._id || 'Desconocido'}`;
            const productImage = orderItem.image || (orderItem.product && orderItem.product.imageUrl ? orderItem.product.imageUrl : undefined); // Usa orderItem.image primero

            line_items_for_stripe.push({
                price_data: {
                    currency: 'cop',
                    product_data: {
                        name: productName,
                        description: productDescription,
                        images: productImage ? [productImage] : [],
                    },
                    unit_amount: Math.round(orderItem.price * 100), // Precio en centavos
                },
                quantity: orderItem.quantity,
            });
            console.log('Pushed to line_items_for_stripe:', line_items_for_stripe[line_items_for_stripe.length - 1]);
        }
        metadata_for_stripe.orderId = orderId.toString();
        metadata_for_stripe.paymentType = 'cart';

    } else if (productId && quantity && quantity > 0) {
        console.log('Processing as single product payment...');
        // Asegúrate de que quantity sea un número, especialmente si viene del frontend como string
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            res.status(400);
            throw new Error('Cantidad no válida para la compra de un solo producto.');
        }

        const product = await Product.findById(productId);

        if (!product) {
            res.status(404);
            throw new Error('Producto no encontrado.');
        }

        if (product.stock < parsedQuantity) { // Usar parsedQuantity
            res.status(400);
            throw new Error(`Solo hay ${product.stock} unidades de ${product.name} disponibles.`);
        }

        if (product.user.toString() === req.user.id) {
            res.status(400);
            throw new Error('No puedes comprar tu propio producto.');
        }

        line_items_for_stripe.push({
            price_data: {
                currency: 'cop',
                product_data: {
                    name: product.name,
                    description: product.description,
                    images: product.imageUrl ? [product.imageUrl] : [],
                },
                unit_amount: Math.round(product.price * 100),
            },
            quantity: parsedQuantity, // Usar parsedQuantity
        });
        metadata_for_stripe.productId = productId.toString();
        metadata_for_stripe.sellerId = product.user.toString();
        metadata_for_stripe.quantityBought = parsedQuantity; // Usar parsedQuantity
        metadata_for_stripe.paymentType = 'single_product';

    } else {
        res.status(400);
        throw new Error('Parámetros de ítems o producto/cantidad inválidos para crear la sesión de pago.');
    }

    try {
        console.log('Attempting to create Stripe session with line_items:', line_items_for_stripe);
        console.log('Metadata for Stripe session:', metadata_for_stripe);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: line_items_for_stripe,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
            metadata: metadata_for_stripe,
        });

        console.log('Stripe session created successfully:', session.id);
        res.status(200).json({ id: session.id });

    } catch (err) {
        console.error('Error al crear la sesión de Stripe Checkout:', err);
        // Asegurarse de que el status 500 se envía en la respuesta antes de lanzar el error.
        // Si ya se ha enviado una respuesta, esto no funcionará, pero para errores de lógica, es bueno.
        if (!res.headersSent) { // Prevenir error si los headers ya fueron enviados
            res.status(500);
        }
        throw new Error('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
        console.log('--- createCheckoutSession END ---');
    }
});

module.exports = {
    createCheckoutSession,
};
