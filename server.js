const dotenv = require('dotenv').config();
console.log("MP_TOKEN_PRESENTE:", !!process.env.MERCADO_PAGO_ACCESS_TOKEN); 

const paymentRoutes = require('./routes/paymentRoutes');
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

// AHORA, CARGAMOS LOS MIDDLEWARES ANTES DE CUALQUIER RUTA QUE NECESITE req.body

app.use(cookieParser());
// ✅ ESTOS DEBEN IR AQUÍ, ANTES DE TODAS LAS RUTAS DE LA API
app.use(express.json()); // Este middleware procesa los cuerpos JSON
app.use(express.urlencoded({ extended: false }));


// Rutas de la API
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

// ✅ RUTA DE PAGOS MOVIDA AQUÍ: Ahora se ejecuta después del express.json()
app.use('/api/payments', paymentRoutes); 

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
    process.exit(1);
});