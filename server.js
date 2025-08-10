// agroapp-backend/server.js
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

// Configuración mejorada de CORS
app.use(cors({
  origin: [
    'https://agroapp-ui.onrender.com', // URL CORREGIDA
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Authorization'); // Importante para que el frontend pueda leer el header Authorization
  next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas de la API
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
  server.close(() => process.exit(1));
});