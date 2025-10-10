// agroapp-backend/routes/paymentRoutes.js

const express = require('express');
const mercadopago = require('mercadopago'); // Importamos el objeto global
const Order = require('../models/Order');
const router = express.Router();

// ----------------------------------------------------
// 1. CONFIGURACIÓN INICIAL DE MERCADO PAGO (Sintaxis Clásica)
// ----------------------------------------------------

// Configuramos el Access Token y el país.
// NOTA: Con la v1.x, la configuración es global usando el método .configure

mercadopago.configure({
    access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    site_id: 'MCO' // MCO = Colombia
});
// ----------------------------------------------------
// (No necesitamos crear una instancia 'client' o 'preferenceModule')
// ----------------------------------------------------

router.post('/create-order', async (req, res) => {
    try {
        // AHORA RECIBIMOS EL ID DE LA ORDEN Y LOS ITEMS
        const { orderId, items } = req.body; 

        if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Se requiere el ID de la orden y los productos." });
        }

        const BASE_URL = process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL_PRODUCTION 
            : process.env.FRONTEND_URL_DEVELOPMENT;

        const preferenceBody = {
            // Transformamos los items del carrito/orden al formato de Mercado Pago
            items: items.map(item => ({
                title: item.name,
                unit_price: Number(item.price),
                quantity: Number(item.quantity),
                description: item.description, // Opcional, pero bueno tenerlo
            })),
            back_urls: {
                success: `${BASE_URL}/payment-success?order_id=${orderId}`, // Enviamos el ID de vuelta para la página de éxito
                failure: `${BASE_URL}/payment-failure?order_id=${orderId}`,
                pending: `${BASE_URL}/payment-pending?order_id=${orderId}`,
            },
            // ¡LA CONEXIÓN MÁGICA!
            external_reference: orderId, 
        };

        const result = await mercadopago.preferences.create(preferenceBody);
        
        const redirectUrl = result.body.init_point;
        
        if (!redirectUrl) {
            throw new Error("API de Mercado Pago no devolvió URL de pago.");
        }
        
        res.status(200).json({ url: redirectUrl });

    } catch (error) {
        // --- MANEJO DE ERRORES ---
        console.error("Error al crear la preferencia de pago en Mercado Pago:", error.message || error);
        
        let errorMessage = "Error interno del servidor al procesar el pago.";
        
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = `Error de Mercado Pago: ${error.response.data.message}`;
        }
        
        res.status(500).json({ 
            message: "Hubo un problema al generar la orden de pago. Revisa los logs del servidor.", 
            details: errorMessage 
        });
    }
});

router.post('/webhook', async (req, res) => {
    const { topic, id } = req.query; 

    if (topic === 'payment') {
        console.log(`\n--- Notificación de Pago Recibida ---`);
        console.log(`ID del Pago: ${id}`);
        
        try {
            // 1. Consultamos a Mercado Pago por la información COMPLETA y SEGURA del pago
            const paymentInfo = await mercadopago.payment.get(id);
            const paymentStatus = paymentInfo.body.status;
            const externalReference = paymentInfo.body.external_reference;

            console.log(`Estado del Pago: ${paymentStatus}`);
            console.log(`Referencia Externa (ID de tu Orden): ${externalReference}`);

            // 2. Buscamos la orden en nuestra base de datos usando la referencia externa
            const order = await Order.findById(externalReference);
            if (!order) {
                console.error(`Error: Orden con ID ${externalReference} no encontrada.`);
                return res.status(404).send('Orden no encontrada');
            }

            // 3. Si el pago fue aprobado, actualizamos nuestra base de datos
            if (paymentStatus === 'approved' && !order.isPaid) {
                order.isPaid = true;
                order.paidAt = new Date();
                order.paymentResult = {
                    id: paymentInfo.body.id,
                    status: paymentInfo.body.status,
                    update_time: paymentInfo.body.date_approved,
                    email_address: paymentInfo.body.payer.email,
                };

                await order.save();
                console.log(`✅ ¡Orden ${order._id} marcada como pagada!`);
                // Aquí podrías enviar un email de confirmación al cliente
            } else {
                console.log(`La orden ${order._id} ya estaba pagada o el estado es '${paymentStatus}'. No se actualiza.`);
            }
            
            // Respondemos a Mercado Pago que todo salió bien
            return res.status(200).send('Webhook procesado');

        } catch (error) {
            console.error("Error al procesar el webhook:", error);
            return res.status(500).send('Error procesando el webhook');
        }
    }
    
    res.status(200).send('Notificación recibida');
});

module.exports = router;