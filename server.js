const dotenv = require('dotenv').config();
console.log("MP_TOKEN_PRESENTE:", !!process.env.MERCADO_PAGO_ACCESS_TOKEN); 

// --- CAMBIO 1: Importamos las rutas de pago al principio ---
const paymentRoutes = require('./routes/paymentRoutes');
// -----------------------------------------------------------

const express = require('express');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const envConfig = require('./config/envConfig');

const port = envConfig.server.port;
connectDB();

const app = express();

// Configuración MEJORADA de CORS (Sin cambios)
const allowedOrigins = [
    envConfig.frontend.url,
    'https://agroapp-frontend.onrender.com',
    'http://localhost:5173',
    'http://localhost:5000'
];

app.options('*', cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
}));

// ---------------------------------------------------------------------
// --- CAMBIO 2: REGISTRAMOS LA RUTA DEL WEBHOOK ANTES DEL BODY-PARSER ---
// Esto es para que el webhook de Mercado Pago se procese correctamente.
// ---------------------------------------------------------------------
app.use('/api/payments', paymentRoutes);
// ---------------------------------------------------------------------

// AHORA, CARGAMOS LOS MIDDLEWARES PARA EL RESTO DE LAS RUTAS
app.use(cookieParser());
app.use(express.json()); // Este middleware procesa los cuerpos JSON
app.use(express.urlencoded({ extended: false }));

// Rutas de la API (¡IMPORTANTE! Se eliminó la línea de payments de aquí)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/premium', require('./routes/premiumRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/barter', require('./routes/barterRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
// ¡La línea de app.use('/api/payments', ...) fue movida hacia arriba!

// Ruta raíz (Sin cambios)
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de Campobit',
        status: 'Operativa',
        documentation: 'https://github.com/Juanes-crypto/grupo-agro-backend',
        environment: envConfig.server.env
    });
});

// Middleware de errores (DEBE ir después de las rutas)
app.use(errorHandler);

// app.listen y process.on (Sin cambios)
app.listen(port, () => {
    console.log(`Server running on port ${port}`.cyan.underline);
    console.log(`Modo: ${envConfig.server.env}`.yellow);
    console.log(`URL: http://localhost:${port}`.green);
    console.log(`CORS permitido para frontend:`.blue);
    console.log(`- ${envConfig.frontend.url}`.blue);
    console.log('- http://localhost:5173\n'.blue);
});

process.on('unhandledRejection', (err) => {
    console.error(`Error no capturado: ${err.message}`.red);
    // server.close() puede dar error si server no está definido globalmente,
    // es más seguro solo salir del proceso en este punto.
    process.exit(1);
});