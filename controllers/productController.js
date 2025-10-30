// agroapp-backend/controllers/productController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User'); // Asegúrate de que User esté importado si lo usas en otros lugares
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// 🔥 NUEVAS FUNCIONES PARA ANALYTICS

// @desc    Incrementar contador de vistas de un producto
// @route   PUT /api/products/:id/view
// @access  Public
const incrementProductView = asyncHandler(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Incrementar contador de vistas
        product.viewCount = (product.viewCount || 0) + 1;
        await product.save();

        res.json({
            success: true,
            message: 'Vista registrada',
            viewCount: product.viewCount
        });
    } catch (error) {
        console.error('Error incrementando vista:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar la vista'
        });
    }
});

// @desc    Trackear click en producto (para dueño)
// @route   PUT /api/products/:id/click
// @access  Private
const trackProductClick = asyncHandler(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Verificar que el usuario es el dueño
        if (product.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No autorizado para trackear este producto'
            });
        }

        // Incrementar contador de clicks
        product.clickCount = (product.clickCount || 0) + 1;
        await product.save();

        res.json({
            success: true,
            message: 'Click registrado',
            clickCount: product.clickCount
        });
    } catch (error) {
        console.error('Error trackeando click:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar el click'
        });
    }
});

// @desc    Obtener estadísticas de productos del usuario
// @route   GET /api/products/my-stats
// @access  Private
const getMyProductStats = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        // ⭐ Validar ObjectId antes de usarlo ⭐
        if (!mongoose.Types.ObjectId.isValid(userId)) {
             console.error('ID de usuario inválido:', userId);
             return res.status(400).json({ success: false, message: 'ID de usuario inválido' });
        }
        const userObjectId = new mongoose.Types.ObjectId(userId); // Convertir una sola vez

        console.log('📊 Obteniendo estadísticas para usuario:', userId);

        // --- Consultas ---
        const totalProducts = await Product.countDocuments({ user: userObjectId });
        const publishedProducts = await Product.countDocuments({
            user: userObjectId,
            isPublished: true
        });

        // ⭐ Usar userObjectId directamente en $match ⭐
        const stockAggregation = await Product.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ]);
        const totalStock = stockAggregation[0]?.totalStock || 0;

        const mostViewedProducts = await Product.find({ user: userObjectId })
            .sort({ viewCount: -1 })
            .limit(5)
            .select('name viewCount imageUrl price');

        const bestSellingProducts = await Product.find({ user: userObjectId })
            .sort({ salesCount: -1, viewCount: -1 })
            .limit(5)
            .select('name salesCount price viewCount stock');

        // ⭐ Usar userObjectId directamente en $match ⭐
        // ⭐ Añadir $ifNull para evitar errores si los campos numéricos faltan ⭐
        const categoryAnalysis = await Product.aggregate([
            { $match: { user: userObjectId } },
            { $group: {
                _id: "$category",
                totalProducts: { $sum: 1 },
                totalViews: { $sum: { $ifNull: ["$viewCount", 0] } }, // Asegura que sume 0 si viewCount es null/undefined
                totalStock: { $sum: { $ifNull: ["$stock", 0] } },     // Asegura que sume 0 si stock es null/undefined
                avgPrice: { $avg: { $ifNull: ["$price", 0] } }       // Asegura que promedie 0 si price es null/undefined
            }},
            { $sort: { totalViews: -1 } }
        ]);

        const recentProducts = await Product.find({ user: userObjectId })
            .sort({ createdAt: -1 })
            .limit(6)
            .select('name createdAt viewCount');


        // --- Cálculos (con correcciones lógicas) ---
        // Calcular totalViews y totalSales usando agregaciones para mayor precisión
        const performanceAgg = await Product.aggregate([
             { $match: { user: userObjectId } },
             { $group: {
                  _id: null,
                  totalViews: { $sum: { $ifNull: ["$viewCount", 0] } },
                  totalSales: { $sum: { $ifNull: ["$salesCount", 0] } },
                  totalPotentialRevenue: { $sum: { $multiply: [ { $ifNull: ["$price", 0] }, { $ifNull: ["$stock", 0] } ] } },
                  avgPriceAll: { $avg: { $ifNull: ["$price", 0] } }
             }}
        ]);

        const performanceData = performanceAgg[0] || { totalViews: 0, totalSales: 0, totalPotentialRevenue: 0, avgPriceAll: 0 };

        const avgViewsPerProduct = totalProducts > 0 ? (performanceData.totalViews / totalProducts).toFixed(1) : 0;
        const conversionRate = performanceData.totalViews > 0 ? ((performanceData.totalSales / performanceData.totalViews) * 100).toFixed(2) : 0;
        const avgProductValue = (performanceData.avgPriceAll).toFixed(2);


        // --- Respuesta ---
        res.json({
            success: true,
            data: {
                overview: {
                    totalProducts,
                    publishedProducts,
                    totalStock,
                    draftProducts: totalProducts - publishedProducts,
                    totalViews: performanceData.totalViews, // Usar total real
                    avgViewsPerProduct
                },
                popularProducts: mostViewedProducts,
                bestSellers: bestSellingProducts,
                categoryAnalysis: categoryAnalysis,
                recentActivity: recentProducts,
                performance: {
                    conversionRate, // Usar tasa real
                    avgProductValue, // Usar promedio real
                    totalPotentialRevenue: performanceData.totalPotentialRevenue // Usar total real
                }
            }
        });

    } catch (error) {
        console.error('Error en getMyProductStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas',
            error: error.message // Incluye el mensaje de error para debugging
        });
    }
});

// @desc    Obtener todos los productos (se mantiene para la vista pública)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { search, category, isTradable, user, latitude, longitude, maxDistance, city } = req.query;

    let query = { isPublished: true };

    // Filtros existentes
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    if (isTradable === 'true') query.isTradable = true;
    if (user) query.user = user;

    // Filtro por ciudad
    if (city) {
        query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filtro por proximidad geográfica
    if (latitude && longitude) {
        const userCoords = [parseFloat(longitude), parseFloat(latitude)];
        const distance = maxDistance ? parseInt(maxDistance) : 50000; // 50km por defecto

        query['location.coordinates'] = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: userCoords
                },
                $maxDistance: distance
            }
        };
    }

    const products = await Product.find(query)
        .populate('user', 'name reputation isPremium phoneNumber showPhoneNumber')
        .sort({ createdAt: -1 });

    // Agregar información de distancia si hay coordenadas
    if (latitude && longitude) {
        const userCoords = [parseFloat(longitude), parseFloat(latitude)];
        products.forEach(product => {
            if (product.location && product.location.coordinates) {
                product.distance = calculateDistance(
                    userCoords[1], userCoords[0], // lat, lng usuario
                    product.location.coordinates[1], product.location.coordinates[0] // lat, lng producto
                );
            }
        });
    }

    res.status(200).json(products);
});

// Función auxiliar para calcular distancia
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// @desc    Obtener un solo producto por ID
// @route   GET /api/products/:id
// @access  Public
const getProduct  = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('user', 'isPremium phoneNumber showPhoneNumber');

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado');
    }

    if (!product.isPublished && (!req.user || (product.user && product.user.id !== req.user.id))) {
        res.status(404);
        throw new Error('Producto no encontrado o no disponible.');
    }

    res.status(200).json(product);
});

//obtener producto por usuario
const getProductsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId; // Obtiene el ID del usuario de los parámetros de la URL

    console.log(`--- Backend: getProductsByUser (Iniciando búsqueda para usuario ${userId}) ---`);

    // Busca productos donde el campo 'user' (el propietario) coincida con el userId
    // Puedes añadir filtros adicionales si solo quieres productos publicados o truequeables
    const products = await Product.find({ user: userId, isPublished: true, isTradable: true })
                                   .select('-__v') // Excluye el campo __v
                                   .sort({ createdAt: -1 }); // Ordena por fecha de creación

    if (!products || products.length === 0) {
        console.log(`--- Backend: getProductsByUser (No se encontraron productos para el usuario ${userId}) ---`);
        // Para este caso, devolver un array vacío con 200 OK es más amigable para el frontend.
        return res.status(200).json([]);
    }

    console.log(`--- Backend: getProductsByUser (Productos encontrados para el usuario ${userId}: ${products.length}) ---`);
    products.forEach((p, index) => {
        console.log(`     Producto ${index + 1}: ID=${p._id}, Nombre=${p.name}, Stock=${p.stock} ${p.unit}`);
    });
    console.log('----------------------------------------------------');

    res.status(200).json(products);
});

// @desc    Obtener los productos del usuario autenticado
// @route   GET /api/products/my-products
// @access  Private
// controllers/productController.js - getMyProducts
const getMyProducts = asyncHandler(async (req, res) => {
    try {
        console.log('🛒 getMyProducts - User ID:', req.user.id);

        const products = await Product.find({ user: req.user.id })
            .select('-__v')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        console.log('📦 Productos encontrados:', products.length);
        console.log('📋 Estructura de respuesta:', {
            success: true,
            count: products.length,
            data: products
        });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('❌ Error en getMyProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los productos',
            error: error.message
        });
    }
});

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (requiere token de autenticación)
const createProduct = asyncHandler(async (req, res) => {
    // Obtener la ubicación del usuario
    const user = await User.findById(req.user.id);

    const { name, description, price, category, stock, unit, isTradable, isPublished } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    // Agregar validación de ubicación
    if (!user.location || !user.location.coordinates) {
        res.status(400);
        throw new Error('El usuario debe tener una ubicación registrada');
    }

    const product = await Product.create({
        user: req.user.id,
        name,
        description,
        price,
        category,
        stock,
        unit,
        imageUrl,
        isTradable: isTradable === 'true',
        isPublished: Boolean(isPublished),
        location: user.location
    });

    res.status(201).json({
        success: true,
        data: product,
        message: 'Producto creado exitosamente'
    });
});

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock, unit, isTradable, isPublished } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado');
    }

    if (product.user.toString() !== req.user.id && req.user.role !== 'administrador') {
        res.status(401);
        throw new Error('Usuario no autorizado para actualizar este producto');
    }

    let newImageUrl = product.imageUrl;

    if (req.file) {
        if (product.imageUrl) {
            const publicIdMatch = product.imageUrl.match(/\/v\d+\/agroapp_products\/(.+?)\./);
            if (publicIdMatch && publicIdMatch[1]) {
                const publicId = `agroapp_products/${publicIdMatch[1]}`;
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Imagen anterior eliminada de Cloudinary: ${publicId}`);
                } catch (error) {
                    console.error('Error al eliminar imagen anterior de Cloudinary:', error);
                }
            }
        }
        newImageUrl = req.file.path;
    }

    const updatedFields = {
        name: name !== undefined ? name : product.name,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? price : product.price,
        category: category !== undefined ? category : product.category,
        stock: stock !== undefined ? stock : product.stock,
        unit: unit !== undefined ? unit : product.unit,
        isTradable: isTradable !== undefined ? (isTradable === 'true' || isTradable === true) : product.isTradable,
        imageUrl: newImageUrl,
        isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : product.isPublished,
    };

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
});

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado');
    }

    if (product.user.toString() !== req.user.id && req.user.role !== 'administrador') {
        res.status(401);
        throw new Error('No autorizado para eliminar este producto');
    }

    if (product.imageUrl) {
        const publicIdMatch = product.imageUrl.match(/\/v\d+\/agroapp_products\/(.+?)\./);
        if (publicIdMatch && publicIdMatch[1]) {
            const publicId = `agroapp_products/${publicIdMatch[1]}`;
            try {
                await cloudinary.uploader.destroy(publicId);
                console.log(`Imagen del producto eliminada de Cloudinary: ${publicId}`);
            } catch (error) {
                console.error('Error al eliminar la imagen del producto de Cloudinary:', error);
            }
        }
    }

    await product.deleteOne();
    res.status(200).json({ message: 'Producto eliminado con éxito' });
});


module.exports = {
    getMyProductStats, // Exporta la función de estadísticas
    getProducts,
    getProduct, // Exporta getProductById como getProduct
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getUserProducts: getProductsByUser, // Exporta getProductsByUser como getUserProducts
    incrementProductView, // Exporta la función para incrementar vistas
    trackProductClick // Exporta la función para trackear clicks
};