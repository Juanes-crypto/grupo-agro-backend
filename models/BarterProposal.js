// agroapp-backend/models/BarterProposal.js

const mongoose = require('mongoose');

// Esquema para los ítems ofrecidos o solicitados en un trueque
// Es un subdocumento, no un modelo separado
const barterItemSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product', // Referencia al producto original
    },
    name: {
        type: String,
        required: true,
    },
    quantity: { // <-- ¡CAMBIO CLAVE AQUÍ! Ahora es String
        type: String,
        required: true,
        // No hay 'min' para String, la validación de formato será en el frontend o controlador
    },
    image: { // URL de la imagen del producto en el momento de la propuesta
        type: String,
        required: true,
    },
    description: { // Descripción del producto en el momento de la propuesta
        type: String,
        required: true,
    },
}, {
    timestamps: false // No necesitamos timestamps para cada ítem individual del trueque
});

// Esquema principal de la Propuesta de Trueque
const barterProposalSchema = mongoose.Schema({
    proposer: { // Usuario que inicia la propuesta de trueque
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    recipient: { // Usuario al que se le hace la propuesta de trueque
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    offeredItems: { // Productos que el 'proposer' ofrece
        type: [barterItemSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0; // Debe haber al menos un ítem ofrecido
            },
            message: 'Debe ofrecer al menos un producto para el trueque.'
        }
    },
    requestedItems: { // Productos que el 'proposer' solicita
        type: [barterItemSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0; // Debe haber al menos un ítem solicitado
            },
            message: 'Debe solicitar al menos un producto para el trueque.'
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected', 'countered', 'cancelled'],
        default: 'pending',
    },
    message: { // Mensaje opcional del proponente
        type: String,
        default: '',
    },
    counterProposalId: { // Si esta es una contrapropuesta, referencia a la propuesta original
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BarterProposal',
        default: null,
    },
    originalProposalId: { // Si es una contrapropuesta, referencia a la primera propuesta de la cadena
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BarterProposal',
        default: null,
    },
}, {
    timestamps: true, // Para saber cuándo se creó o actualizó la propuesta
});

const BarterProposal = mongoose.model('BarterProposal', barterProposalSchema);

module.exports = BarterProposal;
