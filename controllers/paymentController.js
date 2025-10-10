// agroapp-backend/controllers/paymentController.js
const asyncHandler = require('express-async-handler');
const mercadopago = require('mercadopago'); // Necesario para la función de MP
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('../models/Product');
const Order = require('../models/Order');

// ----------------------------------------------------
// 💡 CONFIGURACIÓN INICIAL DE MERCADO PAGO
// (Se recomienda hacer esto en server.js o en un config/mp.js, 
// pero se pone aquí para asegurar que mercadopago esté configurado.)
// ----------------------------------------------------
mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    site_id: 'MCO' // MCO = Colombia
});
// ----------------------------------------------------


// ==========================================================
// 💸 FUNCIÓN 1: STRIPE
// (Tu función original de Stripe sin cambios)
// ==========================================================
// @desc    Crear una sesión de Stripe Checkout
// @route   POST /api/payments/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
    // ... (Tu lógica de Stripe original va aquí) ...
});


// ==========================================================
// 💸 FUNCIÓN 2: MERCADO PAGO
// (La lógica que estaba en tus rutas, ahora como controlador)
// ==========================================================
// @desc    Crear una preferencia de pago en Mercado Pago
// @route   POST /api/payments/create-order
// @access  Private
const createMercadoPagoOrder = asyncHandler(async (req, res) => {
    // 💡 Aquí usamos req.user, que es añadido por el middleware 'protect'
    const { orderId, items } = req.body; 

    if (!req.user) {
        res.status(401);
        throw new Error('No autorizado, usuario no autenticado.');
    }

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400);
        throw new Error("Se requiere el ID de la orden y los productos.");
    }
    
    // Aquí puedes verificar la orden, como en el código de Stripe:
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user.id.toString()) {
        res.status(404);
        throw new Error('Orden no encontrada o no pertenece al usuario.');
    }

    const BASE_URL = process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL_PRODUCTION 
        : process.env.FRONTEND_URL_DEVELOPMENT;

    const preferenceBody = {
        // Transformamos los items al formato de Mercado Pago
        items: items.map(item => ({
            title: item.name,
            unit_price: Number(item.price),
            quantity: Number(item.quantity),
            currency_id: 'COP', // Aseguramos la divisa
            // description: item.description, 
        })),
        payer: {
             // Usamos el email del usuario logueado
             email: req.user.email,
        },
        back_urls: {
            success: `${BASE_URL}/payment/success?order_id=${orderId}`, 
            failure: `${BASE_URL}/payment/failure?order_id=${orderId}`,
            pending: `${BASE_URL}/payment/pending?order_id=${orderId}`,
        },
        auto_return: 'approved', // Redirige automáticamente
        external_reference: orderId, 
        // 💡 NOTIFICACIÓN URL: Usar la URL de tu backend
        notification_url: `${process.env.FRONTEND_URL_PRODUCTION || process.env.FRONTEND_URL_DEVELOPMENT}/api/payments/webhook`,
    };

    try {
        const result = await mercadopago.preferences.create(preferenceBody);
        
        const redirectUrl = result.body.init_point;
        
        if (!redirectUrl) {
            throw new Error("API de Mercado Pago no devolvió URL de pago.");
        }
        
        res.status(200).json({ url: redirectUrl });

    } catch (error) {
        console.error("Error al crear la preferencia de pago en Mercado Pago:", error.message || error);
        res.status(500).json({ 
            message: "Hubo un problema al generar la orden de pago. Revisa los logs del servidor.", 
            details: error.message || 'Error desconocido.'
        });
    }
});


// ==========================================================
// 💸 FUNCIÓN 3: WEBHOOKS
// (La lógica que estaba en tus rutas, ahora como controlador)
// ==========================================================
// @desc    Manejar notificaciones de Mercado Pago (Webhooks)
// @route   POST /api/payments/webhook
// @access  Public (llamado por Mercado Pago)
const handleMercadoPagoWebhook = asyncHandler(async (req, res) => {
    const { topic, id } = req.query; 

    if (topic === 'payment') {
        // ... (Tu lógica de webhook completa va aquí) ...
        // ... (Tu código para payment.get, Order.findById, y order.save()) ...
        
        try {
             // 1. Consultamos a Mercado Pago por la información COMPLETA y SEGURA del pago
            const paymentInfo = await mercadopago.payment.get(id);
            const paymentStatus = paymentInfo.body.status;
            const externalReference = paymentInfo.body.external_reference;

            // ... (Resto de tu lógica de webhook) ...
            
             const order = await Order.findById(externalReference);
             // ... (El resto de la lógica de actualización de la orden) ...
            
            return res.status(200).send('Webhook procesado');

        } catch (error) {
            console.error("Error al procesar el webhook:", error);
            return res.status(500).send('Error procesando el webhook');
        }
    }
    
    res.status(200).send('Notificación recibida');
});


module.exports = {
    createCheckoutSession,
    createMercadoPagoOrder,
    handleMercadoPagoWebhook,
};