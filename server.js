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

connectDB();

const app = express();

app.use(cors());
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
// ⭐ AÑADE ESTA LÍNEA PARA LAS RUTAS DE PEDIDOS ⭐
app.use('/api/orders', require('./routes/orderRoutes'));
// ⭐ ¡AÑADE ESTA LÍNEA CLAVE PARA LAS RUTAS DE TRUEQUE! ⭐
app.use('/api/barter', require('./routes/barterRoutes'));


// Servir frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('*', (req, res) =>
        res.sendFile(
            path.resolve(__dirname, '../frontend', 'dist', 'index.html')
        )
    );
} else {
    app.get('/', (req, res) => res.send('Please set to production'));
}

app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`.cyan.underline));