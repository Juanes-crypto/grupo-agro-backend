// agroapp-backend/migrateProducts.js
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
require('dotenv').config();

const migrateProducts = async () => {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todos los productos
        const products = await Product.find({});
        console.log(`📦 Encontrados ${products.length} productos para migrar`);

        let updatedCount = 0;
        let skippedCount = 0;

        // Migrar cada producto
        for (const product of products) {
            try {
                const user = await User.findById(product.user);
                
                if (user && user.location) {
                    // Actualizar producto con ubicación del usuario
                    product.location = user.location;
                    await product.save();
                    updatedCount++;
                    console.log(`✅ Producto "${product.name}" actualizado con ubicación: ${user.location.city}`);
                } else {
                    skippedCount++;
                    console.log(`⏭️  Producto "${product.name}" sin usuario o ubicación, omitido`);
                }
            } catch (error) {
                console.error(`❌ Error con producto ${product.name}:`, error.message);
            }
        }

        console.log('\n🎉 Migración completada!');
        console.log(`✅ Productos actualizados: ${updatedCount}`);
        console.log(`⏭️  Productos omitidos: ${skippedCount}`);
        console.log(`📊 Total procesado: ${products.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en migración:', error);
        process.exit(1);
    }
};

// Ejecutar migración
migrateProducts();