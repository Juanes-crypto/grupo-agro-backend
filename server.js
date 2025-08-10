const path = require('path');
const express = require('express');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorHandler');
const connectDB = require('./config/db');
const colors = require('colors');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');

const port = process.env.PORT || 5000;

// Conexión a MongoDB
connectDB();

const app = express();

// Configuración MEJORADA de CORS
const allowedOrigins = [
  'https://agroapp-frontend.onrender.com',
  'https://agroapp-ui.onrender.com', // Añade ambas URLs por seguridad
  'http://localhost:5173'
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Habilitar CORS pre-flight para todas las rutas
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Middleware para cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Middleware para headers CORS (IMPORTANTE)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Resto de middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas de la API (sin cambios)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/premium', require('./routes/premiumRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/rentals', require('./routes/rentalRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/barter', require('./routes/barterRoutes'));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de AgroApp',
    status: 'Operativa',
    documentation: 'https://github.com/tu-repositorio/documentacion'
  });
});

// Middleware de errores (DEBE ir después de las rutas)
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`\nServer started on port ${port}`.cyan.underline);
  console.log(`Modo: ${process.env.NODE_ENV || 'development'}`.yellow);
  console.log(`URL: http://localhost:${port}`.green);
  console.log(`CORS permitido para frontend:`.blue);
  console.log('- https://agroapp-frontend.onrender.com'.blue);
  console.log('- http://localhost:5173\n'.blue);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error(`Error no capturado: ${err.message}`.red);
  server.close(() => {
    process.exit(1);
  });
});