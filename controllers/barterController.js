// agroapp-backend/controllers/barterController.js

const asyncHandler = require('express-async-handler');
const BarterProposal = require('../models/BarterProposal');
const Product = require('../models/Product'); // Asume que este modelo tiene 'stock', 'isTradable', 'is_perishable', 'has_freshness_cert'
const User = require('../models/User');     // Asume que este modelo tiene 'reputation'
const { createNotification } = require('./notificationController'); // <-- ¡IMPORTA LA FUNCIÓN DE NOTIFICACIÓN!

// Helper function to parse quantity strings like "5 kg" or "10 unidades"
// This function extracts the numerical value and the unit from the string.
function parseQuantityString(quantityString) {
    if (!quantityString || typeof quantityString !== 'string') {
        return { value: 0, unit: '' };
    }
    const parts = quantityString.trim().split(' ');
    if (parts.length === 1) {
        // If only one part, try to parse as a number. If not a number, treat as 0 with the whole string as unit.
        const value = parseFloat(parts[0]);
        if (!isNaN(value)) {
            return { value, unit: '' }; // No explicit unit
        }
        return { value: 0, unit: quantityString }; // Treat as 0, unit is the whole string (e.g., "unidad")
    } else if (parts.length >= 2) {
        // First part is value, rest is unit (e.g., "10 unidades")
        const value = parseFloat(parts[0]);
        const unit = parts.slice(1).join(' '); // Join remaining parts as unit (e.g., "kg", "unidades")
        if (!isNaN(value)) {
            return { value, unit };
        }
    }
    return { value: 0, unit: '' }; // Default for invalid formats
}

// Helper function to format quantity back into a string (e.g., "5 kg")
// This function reconstructs the quantity string from a numerical value and a unit.
function formatQuantityString(value, unit) {
    if (unit) {
        return `${value} ${unit}`;
    }
    return `${value}`; // If no unit, just return the number
}

// --- NUEVA FUNCIÓN: Simulación de API de Agronet para obtener valor de mercado ---
// En una aplicación real, esto haría una llamada HTTP a la API de Agronet
// para obtener el precio de mercado actual de un producto agrícola específico.
// Por ahora, devolveremos un valor basado en el precio del producto.
async function getMarketValueFromAgronet(productName, quantity) {
    // Simulación: Podríamos tener una base de datos interna de precios de referencia
    // o hacer una llamada real a una API externa como Agronet.
    // Para esta demo, simplemente usaremos el precio del producto como su "valor de mercado".
    // En un escenario real, la API de Agronet devolvería un precio por unidad (ej. por kg, por bulto).
    // Aquí, asumimos que el 'price' del producto ya es su valor de mercado total.
    console.log(`Simulando obtención de valor de mercado para: ${productName} (${quantity})`);
    // Si tuvieras una API de Agronet que te diera el precio por unidad, lo usarías aquí:
    // const agronomPricePerUnit = await fetch(`https://api.agronet.gov.co/prices?product=${productName}`).json();
    // const { value: numQuantity, unit: qtyUnit } = parseQuantityString(quantity);
    // return agronomPricePerUnit * numQuantity;
    return null; // Retornamos null porque el precio ya está en el producto
}


// @desc    Create a new barter proposal
// @route   POST /api/barter
// @access  Private
const createBarterProposal = asyncHandler(async (req, res) => {
    const { recipientId, offeredProductIds, requestedProductIds, message } = req.body;
    const proposerId = req.user._id; // ID del usuario que hace la propuesta

    // 1. Validar que los IDs de productos y el recipiente existen
    if (!recipientId || !offeredProductIds || offeredProductIds.length === 0 || !requestedProductIds || requestedProductIds.length === 0) {
        res.status(400);
        throw new Error('Por favor, proporciona un recipiente, productos ofrecidos y productos solicitados.');
    }

    if (proposerId.toString() === recipientId.toString()) {
        res.status(400);
        throw new Error('No puedes hacer una propuesta de trueque a ti mismo.');
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
        res.status(404);
        throw new Error('Usuario recipiente no encontrado.');
    }

    // --- REGLAS ANTIFRAUDE: Reputación del Recipiente (Vendedor) ---
    // Asumiendo que el modelo User tiene un campo 'reputation'
    if (recipient.reputation < 3) { // Valor por defecto 3, rango 1-5
        res.status(400);
        throw new Error(`El usuario ${recipient.name} tiene una reputación baja (${recipient.reputation} estrellas) y no puede participar en trueques.`);
    }

    // 2. Obtener detalles de los productos ofrecidos y solicitados
    const offeredItems = [];
    let totalOfferedValue = 0;
    for (const productId of offeredProductIds) {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error(`Producto ofrecido con ID ${productId} no encontrado.`);
        }
        // Asegurarse de que el proponente es el dueño del producto que ofrece
        if (product.user.toString() !== proposerId.toString()) {
            res.status(401);
            throw new Error(`No autorizado: No eres el dueño del producto ofrecido ${product.name}.`);
        }
        // Asegurarse de que el producto ofrecido es truequeable y tiene inventario (stock)
        if (!product.isTradable || product.stock <= 0) { // Usando 'isTradable' y 'stock'
            res.status(400);
            throw new Error(`El producto ofrecido '${product.name}' no está disponible para trueque o no tiene stock.`);
        }

        offeredItems.push({
            product: product._id,
            name: product.name,
            quantity: formatQuantityString(product.stock, product.unit), // <-- CORREGIDO: Usar stock y unit
            image: product.imageUrl,
            description: product.description,
            price: product.price // Incluir precio para cálculo de valor
        });
        totalOfferedValue += product.price || 0;
    }

    const requestedItems = [];
    let totalRequestedValue = 0;
    for (const productId of requestedProductIds) {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error(`Producto solicitado con ID ${productId} no encontrado.`);
        }
        // Asegurarse de que el recipiente es el dueño del producto solicitado
        if (product.user.toString() !== recipientId.toString()) {
            res.status(400);
            throw new Error(`El producto solicitado ${product.name} no pertenece al usuario recipiente.`);
        }
        // Asegurarse de que el producto solicitado es truequeable y tiene inventario (stock)
        if (!product.isTradable || product.stock <= 0) { // Usando 'isTradable' y 'stock'
            res.status(400);
            throw new Error(`El producto solicitado '${product.name}' no está disponible para trueque o no tiene stock.`);
        }

        // --- REGLAS ANTIFRAUDE: Productos perecederos sin certificación de frescura ---
        // Asumiendo que el modelo Product tiene 'is_perishable' y 'has_freshness_cert' como booleanos
        if (product.is_perishable && !product.has_freshness_cert) {
            res.status(400);
            throw new Error(`El producto solicitado '${product.name}' es perecedero y requiere certificación de frescura para el trueque.`);
        }

        requestedItems.push({
            product: product._id,
            name: product.name,
            quantity: formatQuantityString(product.stock, product.unit), // <-- CORREGIDO: Usar stock y unit
            image: product.imageUrl,
            description: product.description,
            price: product.price // Incluir precio para cálculo de valor
        });
        totalRequestedValue += product.price || 0;
    }

    // --- REGLAS ANTIFRAUDE: Diferencia de valor supera el 40% ---
    // Calculamos la diferencia porcentual para la validación
    let isFair = true;
    let differencePercentage = 0;
    let messageEquity = "¡Trueque justo! 💚";
    let suggestedDifference = null;

    if (totalRequestedValue > 0 && totalOfferedValue > 0) {
        const lowerValue = Math.min(totalOfferedValue, totalRequestedValue);
        const higherValue = Math.max(totalOfferedValue, totalRequestedValue);
        
        // Evitar división por cero si lowerValue es 0
        if (lowerValue === 0) {
            differencePercentage = 100; // Si uno es 0 y el otro no, la diferencia es máxima
        } else {
            differencePercentage = ((higherValue - lowerValue) / lowerValue) * 100;
        }

        if (differencePercentage > 40) {
            isFair = false;
            messageEquity = "La diferencia de valor supera el 40%. Por favor, ajusta tu oferta.";
            // Sugerir ajuste: si lo ofrecido es menor, necesita añadir más. Si lo solicitado es menor, el otro necesita añadir.
            const neededAmount = Math.abs(totalRequestedValue - totalOfferedValue);
            // Esto es una simplificación; en un caso real, necesitarías saber qué producto añadir.
            // Por ahora, sugerimos una cantidad genérica o el valor monetario.
            suggestedDifference = {
                amount: neededAmount.toFixed(2), // Formatear a 2 decimales
                unit: 'COP',
                product: 'valor adicional'
            };
        } else if (differencePercentage > 20) { // Dentro del rango de 20-40, es "ajustable"
            isFair = false; // No es "justo" perfecto, pero aceptable si el usuario lo desea
            messageEquity = "Ajusta tu oferta para un trueque más equitativo. 💡";
            const neededAmount = Math.abs(totalRequestedValue - totalOfferedValue);
            suggestedDifference = {
                amount: neededAmount.toFixed(2),
                unit: 'COP',
                product: 'valor adicional'
            };
        }
    } else if (totalRequestedValue === 0 || totalOfferedValue === 0) {
        // Si uno de los valores es 0 (ej. productos sin precio), no podemos calcular equidad.
        isFair = false;
        messageEquity = "No se puede calcular la equidad: uno o ambos productos no tienen precio definido.";
    }

    if (!isFair && differencePercentage > 40) {
        res.status(400);
        throw new Error(messageEquity); // Bloquear si la diferencia es > 40%
    }
    // Si la diferencia es entre 20-40%, se permite pero se advierte. No se bloquea en el backend aquí.

    // 3. Crear la propuesta
    const proposal = new BarterProposal({
        proposer: proposerId,
        recipient: recipientId,
        offeredItems,
        requestedItems,
        message: message || '',
        status: 'pending',
        // Guardar el feedback de equidad en la propuesta para referencia futura
        equityFeedback: {
            isFair: isFair,
            message: messageEquity,
            difference: suggestedDifference,
            offeredValue: totalOfferedValue,
            requestedValue: totalRequestedValue,
            differencePercentage: differencePercentage
        }
    });

    const createdProposal = await proposal.save();

    // --- NOTIFICACIÓN: Nueva Propuesta de Trueque ---
    await createNotification({
        user: recipientId, // Notificar al recipiente
        type: 'new_barter_proposal',
        title: '¡Nueva Propuesta de Trueque!',
        message: `Has recibido una nueva propuesta de trueque de ${req.user.username} por ${requestedItems[0].name}.`, // Mensaje más específico
        relatedEntityId: createdProposal._id,
        relatedEntityType: 'BarterProposal',
    });
    // --- FIN NOTIFICACIÓN ---

    res.status(201).json(createdProposal);
});

// @desc    Get all barter proposals for the authenticated user (both sent and received)
// @route   GET /api/barter/myproposals
// @access  Private
const getMyBarterProposals = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const proposals = await BarterProposal.find({
        $or: [{ proposer: userId }, { recipient: userId }]
    })
    .populate('proposer', 'username email reputation') // Incluir reputación del proponente
    .populate('recipient', 'username email reputation') // Incluir reputación del recipiente
    .populate('offeredItems.product', 'name imageUrl price stock unit isTradable is_perishable has_freshness_cert') // <-- ADDED 'unit'
    .populate('requestedItems.product', 'name imageUrl price stock unit isTradable is_perishable has_freshness_cert') // <-- ADDED 'unit'
    .sort({ createdAt: -1 });

    res.status(200).json(proposals);
});

// @desc    Get a single barter proposal by ID
// @route   GET /api/barter/:id
// @access  Private
const getBarterProposalById = asyncHandler(async (req, res) => {
    const proposal = await BarterProposal.findById(req.params.id)
        .populate('proposer', 'username email reputation')
        .populate('recipient', 'username email reputation')
        .populate('offeredItems.product', 'name imageUrl price stock unit isTradable is_perishable has_freshness_cert') // <-- ADDED 'unit'
        .populate('requestedItems.product', 'name imageUrl price stock unit isTradable is_perishable has_freshness_cert'); // <-- ADDED 'unit'

    if (!proposal) {
        res.status(404);
        throw new Error('Propuesta de trueque no encontrada.');
    }

    // Ensure only proposer, recipient, or admin can view the proposal
    if (
        proposal.proposer._id.toString() !== req.user._id.toString() &&
        proposal.recipient._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'administrador'
    ) {
        res.status(401);
        throw new Error('No autorizado para ver esta propuesta de trueque.');
    }

    res.status(200).json(proposal);
});

// @desc    Update barter proposal status (accept, reject, cancel)
// @route   PUT /api/barter/:id/status
// @access  Private
const updateBarterProposalStatus = asyncHandler(async (req, res) => {
    const { status } = req.body; // Expected status: 'accepted', 'rejected', 'cancelled'
    const proposalId = req.params.id;
    const userId = req.user._id;

    const proposal = await BarterProposal.findById(proposalId);

    if (!proposal) {
        res.status(404);
        throw new Error('Propuesta de trueque no encontrada.');
    }

    // Only recipient can accept/reject. Proposer can cancel.
    if (status === 'accepted' || status === 'rejected') {
        if (proposal.recipient.toString() !== userId.toString()) {
            res.status(401);
            throw new Error('No autorizado para cambiar el estado de esta propuesta.');
        }
    } else if (status === 'cancelled') {
        if (proposal.proposer.toString() !== userId.toString() && proposal.recipient.toString() !== userId.toString()) {
            res.status(401);
            throw new Error('No autorizado para cancelar esta propuesta.');
        }
    } else {
        res.status(400);
        throw new Error('Estado de propuesta inválido.');
    }

    // Only update if current status is 'pending' or 'countered'
    if (proposal.status !== 'pending' && proposal.status !== 'countered') {
        res.status(400);
        throw new Error(`No se puede cambiar el estado de una propuesta que ya está '${proposal.status}'.`);
    }

    // --- LÓGICA DE INTERCAMBIO DE PRODUCTOS AL ACEPTAR EL TRUEQUE ---
    if (status === 'accepted') {
        console.log(`Trueque aceptado para la propuesta ${proposal._id}. Iniciando intercambio de productos...`);

        // 1. Reducir la cantidad de los productos ofrecidos por el PROponente (que el RECIPIENTE va a recibir)
        for (const offeredItem of proposal.offeredItems) {
            const product = await Product.findById(offeredItem.product);
            if (!product) {
                console.error(`Error de trueque: Producto ofrecido con ID ${offeredItem.product} no encontrado.`);
                res.status(500);
                throw new Error(`Error en el intercambio: Producto ofrecido '${offeredItem.name}' no encontrado.`);
            }

            // Parse the quantity string from the barter proposal item
            const { value: offeredValue, unit: offeredUnit } = parseQuantityString(offeredItem.quantity);

            // Validate that the units match the product's unit
            if (product.unit !== offeredUnit) {
                res.status(400);
                throw new Error(`Error de trueque: Unidades inconsistentes para el producto ${product.name}. Esperado: '${product.unit}', Ofrecido: '${offeredUnit}'.`);
            }

            const newStockValue = product.stock - offeredValue; // product.stock is a Number

            if (newStockValue < 0) {
                res.status(400);
                throw new Error(`Error de trueque: Cantidad insuficiente de ${product.name} para el intercambio. Disponible: ${product.stock} ${product.unit}, Ofrecido: ${offeredItem.quantity}.`);
            }

            product.stock = newStockValue; // Update the Number field
            await product.save();
            console.log(`Producto ${product.name} (ofrecido por proponente) actualizado a ${product.stock} ${product.unit}`);

            // Opcional: Si la cantidad llega a 0, puedes eliminar el producto o marcarlo como no disponible
            // if (newStockValue === 0) {
            //     await product.deleteOne(); // Eliminar el producto si se agota
            //     console.log(`Producto ${product.name} agotado y eliminado después del trueque.`);
            // }
        }

        // 2. Reducir la cantidad de los productos solicitados por el PROponente (que el RECIPIENTE estaba ofreciendo)
        for (const requestedItem of proposal.requestedItems) {
            const product = await Product.findById(requestedItem.product);
            if (!product) {
                console.error(`Error de trueque: Producto solicitado con ID ${requestedItem.product} no encontrado.`);
                res.status(500);
                throw new Error(`Error en el intercambio: Producto solicitado '${requestedItem.name}' no encontrado.`);
            }

            // Parse the quantity string from the barter proposal item
            const { value: requestedValue, unit: requestedUnit } = parseQuantityString(requestedItem.quantity);

            // Validate that the units match the product's unit
            if (product.unit !== requestedUnit) {
                res.status(400);
                throw new Error(`Error de trueque: Unidades inconsistentes para el producto ${product.name}. Esperado: '${product.unit}', Solicitado: '${requestedUnit}'.`);
            }

            const newStockValue = product.stock - requestedValue; // product.stock is a Number

            if (newStockValue < 0) {
                res.status(400);
                throw new Error(`Error de trueque: Cantidad insuficiente de ${product.name} para el intercambio. Disponible: ${product.stock} ${product.unit}, Solicitado: ${requestedItem.quantity}.`);
            }

            product.stock = newStockValue; // Update the Number field
            await product.save();
            console.log(`Producto ${product.name} (solicitado por proponente) actualizado a ${product.stock} ${product.unit}`);

            // Opcional: Si la cantidad llega a 0, puedes eliminar el producto o marcarlo como no disponible
            // if (newStockValue === 0) {
            //     await product.deleteOne(); // Eliminar el producto si se agota
            //     console.log(`Producto ${product.name} agotado y eliminado después del trueque.`);
            // }
        }

        // TODO: En un sistema más avanzado, aquí también se podría:
        // - Crear un registro de "Transacción de Trueque" para el historial.
        // - Notificar a ambos usuarios sobre el trueque completado.
        console.log(`Intercambio de productos completado para la propuesta ${proposal._id}.`);
    }
    // --- FIN LÓGICA DE INTERCAMBIO ---

    proposal.status = status;
    const updatedProposal = await proposal.save();

    // --- NOTIFICACIONES PARA EL PROponente y RECIPIENTE (si aplica) ---
    if (status === 'accepted') {
        // Notificar al proponente que su propuesta fue aceptada
        await createNotification({
            user: proposal.proposer,
            type: 'barter_accepted',
            title: '¡Propuesta de Trueque Aceptada!',
            message: `Tu propuesta de trueque con ${req.user.username} ha sido aceptada.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
        // Notificar al recipiente que aceptó la propuesta (confirmación)
        await createNotification({
            user: proposal.recipient,
            type: 'barter_accepted',
            title: '¡Trueque Completado!',
            message: `Has aceptado la propuesta de trueque de ${proposal.proposer.username}.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
    } else if (status === 'rejected') {
        // Notificar al proponente que su propuesta fue rechazada
        await createNotification({
            user: proposal.proposer,
            type: 'barter_rejected',
            title: 'Propuesta de Trueque Rechazada',
            message: `Tu propuesta de trueque con ${proposal.recipient.username} ha sido rechazada.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
        // Notificar al recipiente que rechazó la propuesta (confirmación)
        await createNotification({
            user: proposal.recipient,
            type: 'barter_rejected',
            title: 'Propuesta de Trueque Rechazada',
            message: `Has rechazado la propuesta de trueque de ${proposal.proposer.username}.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
    } else if (status === 'cancelled') {
        // Notificar al otro usuario que la propuesta fue cancelada
        const otherUserId = proposal.proposer.toString() === userId.toString() ? proposal.recipient : proposal.proposer;
        await createNotification({
            user: otherUserId,
            type: 'barter_cancelled', // Puedes añadir este tipo al enum si quieres
            title: 'Propuesta de Trueque Cancelada',
            message: `La propuesta de trueque con ${req.user.username} ha sido cancelada.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
        // Notificar al usuario que la canceló (confirmación)
        await createNotification({
            user: userId,
            type: 'barter_cancelled',
            title: 'Propuesta de Trueque Cancelada',
            message: `Has cancelado la propuesta de trueque.`,
            relatedEntityId: updatedProposal._id,
            relatedEntityType: 'BarterProposal',
        });
    }
    // --- FIN NOTIFICACIONES ---

    res.status(200).json(updatedProposal);
});

// @desc    Create a counter proposal for an existing proposal
// @route   POST /api/barter/:id/counter
// @access  Private
const createCounterProposal = asyncHandler(async (req, res) => {
    const { offeredProductIds, requestedProductIds, message } = req.body;
    const originalProposalId = req.params.id;
    const proposerId = req.user._id; // User making the counter-proposal

    const originalProposal = await BarterProposal.findById(originalProposalId);

    if (!originalProposal) {
        res.status(404);
        throw new Error('Propuesta original no encontrada para la contraoferta.');
    }

    // Only the recipient of the original proposal can make a counter-proposal
    if (originalProposal.recipient.toString() !== proposerId.toString()) {
        res.status(401);
        throw new Error('No autorizado para hacer una contraoferta a esta propuesta.');
    }

    // Mark the original proposal as 'countered'
    originalProposal.status = 'countered';
    await originalProposal.save();

    // Get details of offered and requested products for the new counter-proposal
    const offeredItems = [];
    for (const productId of offeredProductIds) {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error(`Producto ofrecido con ID ${productId} no encontrado para la contraoferta.`);
        }
        if (product.user.toString() !== proposerId.toString()) {
            res.status(401);
            throw new Error(`No autorizado: No eres el dueño del producto ofrecido ${product.name}.`);
        }
        offeredItems.push({
            product: product._id,
            name: product.name,
            quantity: formatQuantityString(product.stock, product.unit), // <-- CORREGIDO: Usar stock y unit
            image: product.imageUrl,
            description: product.description,
            price: product.price // Incluir precio para cálculo de valor
        });
    }

    const requestedItems = [];
    for (const productId of requestedProductIds) {
        const product = await Product.findById(productId);
        if (!product) {
            res.status(404);
            throw new Error(`Producto solicitado con ID ${productId} no encontrado para la contraoferta.`);
        }
        // The requested product must belong to the original proposer (who is now the recipient of the counter)
        if (product.user.toString() !== originalProposal.proposer.toString()) {
            res.status(400);
            throw new Error(`El producto solicitado ${product.name} no pertenece al proponente original.`);
        }
        requestedItems.push({
            product: product._id,
            name: product.name,
            quantity: formatQuantityString(product.stock, product.unit), // <-- CORREGIDO: Usar stock y unit
            image: product.imageUrl,
            description: product.description,
            price: product.price // Incluir precio para cálculo de valor
        });
    }

    // Create the new counter proposal
    const counterProposal = new BarterProposal({
        proposer: proposerId, // Now the original recipient is the proposer of the counter
        recipient: originalProposal.proposer, // The original proposer is now the recipient of the counter
        offeredItems,
        requestedItems,
        message: message || '',
        status: 'pending',
        counterProposalId: originalProposal._id, // Link to the proposal this is countering
        originalProposalId: originalProposal.originalProposalId || originalProposal._id, // Link to the very first proposal in the chain
    });

    const createdCounterProposal = await counterProposal.save();

    // --- NOTIFICACIÓN: Propuesta Contraofertada ---
    await createNotification({
        user: originalProposal.proposer, // Notificar al proponente original
        type: 'barter_countered',
        title: '¡Propuesta de Trueque Contraofertada!',
        message: `${req.user.username} ha enviado una contrapropuesta a tu trueque.`,
        relatedEntityId: createdCounterProposal._id,
        relatedEntityType: 'BarterProposal',
    });
    // --- FIN NOTIFICACIÓN ---

    res.status(201).json(createdCounterProposal);
});


// --- NUEVA FUNCIÓN: Obtener Comparación de Valor de Trueque ---
// @desc    Get value comparison for two products
// @route   GET /api/barter/value-comparison?product1Id=<id>&product2Id=<id>
// @access  Private
const getBarterValueComparison = asyncHandler(async (req, res) => {
    const { product1Id, product2Id } = req.query;

    if (!product1Id || !product2Id) {
        res.status(400);
        throw new Error('Se requieren los IDs de ambos productos para la comparación.');
    }

    const product1 = await Product.findById(product1Id);
    const product2 = await Product.findById(product2Id);

    if (!product1 || !product2) {
        res.status(404);
        throw new Error('Uno o ambos productos no fueron encontrados.');
    }

    // Obtener valores de mercado (usando los precios de los productos como proxy)
    // En un escenario real, aquí se integrarían llamadas a la API de Agronet
    const value1 = product1.price || 0;
    const value2 = product2.price || 0;

    let isFair = true;
    let message = "¡Trueque justo! 💚";
    let difference = null;
    let differencePercentage = 0;

    if (value1 > 0 && value2 > 0) {
        const lowerValue = Math.min(value1, value2);
        const higherValue = Math.max(value1, value2);
        
        if (lowerValue === 0) { // Should not happen if value1 > 0 and value2 > 0, but for safety
            differencePercentage = 100;
        } else {
            differencePercentage = ((higherValue - lowerValue) / lowerValue) * 100;
        }

        if (differencePercentage > 40) {
            isFair = false;
            message = "La diferencia de valor supera el 40%. No es un trueque equitativo.";
            const neededAmount = Math.abs(value2 - value1);
            difference = {
                amount: neededAmount.toFixed(2),
                unit: 'COP',
                product: value1 < value2 ? product1.name : product2.name, // Sugerir el que tiene menor valor
                percentage: differencePercentage
            };
        } else if (differencePercentage > 20) {
            isFair = false; // No es "justo" perfecto, pero aceptable con advertencia
            message = "Ajusta tu oferta para un trueque más equitativo. 💡";
            const neededAmount = Math.abs(value2 - value1);
            difference = {
                amount: neededAmount.toFixed(2),
                unit: 'COP',
                product: value1 < value2 ? product1.name : product2.name,
                percentage: differencePercentage
            };
        }
        // Si differencePercentage <= 20, isFair permanece true y el mensaje es "¡Trueque justo! 💚"
    } else {
        isFair = false;
        message = "No se puede calcular la equidad: uno o ambos productos no tienen precio definido.";
    }

    res.status(200).json({
        isFair,
        message,
        difference,
        offeredValue: value1, // En este endpoint, product1 es el "ofrecido" y product2 el "deseado"
        requestedValue: value2,
        differencePercentage
    });
});

// ⭐ CORRECCIÓN CLAVE: Exportar todas las funciones que se usan en las rutas ⭐
module.exports = {
    createBarterProposal,
    getMyBarterProposals,
    getBarterProposalById,
    updateBarterProposalStatus,
    createCounterProposal,
    getBarterValueComparison, // <-- ¡AHORA ESTÁ CORRECTAMENTE EXPORTADA Y ES LA ÚNICA FUNCIÓN DE COMPARACIÓN!
};
