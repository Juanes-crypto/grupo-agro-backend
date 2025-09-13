const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const envConfig = require('./config/envConfig'); // ← AÑADIR

const port = envConfig.server.port; // ← CAMBIAR
connectDB();

const app = express();

// Configuración MEJORADA de CORS
const allowedOrigins = [
  envConfig.frontend.url, // ← USAR CONFIGURACIÓN CENTRALIZADA
  'https://agroapp-frontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:5000'
];

// Middleware CORS manual para OPTIONS
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware principal
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

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas de la API (sin cambios)
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

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Campobit',
    status: 'Operativa',
    documentation: 'https://github.com/Juanes-crypto/grupo-agro-backend',
    environment: envConfig.server.env // ← AÑADIR
  });
});

// Middleware de errores (DEBE ir después de las rutas)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`.cyan.underline);
  console.log(`Modo: ${envConfig.server.env}`.yellow); // ← CAMBIAR
  console.log(`URL: http://localhost:${port}`.green);
  console.log(`CORS permitido para frontend:`.blue);
  console.log(`- ${envConfig.frontend.url}`.blue); // ← CAMBIAR
  console.log('- http://localhost:5173\n'.blue);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error(`Error no capturado: ${err.message}`.red);
  server.close(() => {
    process.exit(1);
  });
});