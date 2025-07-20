// backend/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Las opciones useNewUrlParser y useUnifiedTopology son true por defecto en Mongoose 6+
      // y pueden ser omitidas para un código más limpio.
      // Si estás en una versión muy antigua de Mongoose, podrían ser necesarias.
      // Para esta solución, asumimos que con la actualización ya no serán explícitamente requeridas.
      // ⭐ IMPORTANTE: Asegúrate de que no haya ninguna opción como tlsAllowInsecure: true aquí ⭐
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1); // Sale del proceso con un fallo
  }
};

module.exports = connectDB;