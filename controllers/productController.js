// agroapp-backend/controllers/productController.js

const Product = require('../models/Product');
const User = require('../models/User'); // Asegúrate de que User esté importado si lo usas en otros lugares
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Obtener todos los productos (se mantiene para la vista pública)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // Se extraen los parámetros de consulta: search, category, isTradable, y AHORA 'user'
    const { search, category, isTradable, user } = req.query;

    let query = { isPublished: true }; // Por defecto, solo productos publicados

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
        query.category = category;
    }

    if (isTradable === 'true') {
        query.isTradable = true;
    }

    // ⭐ CORRECCIÓN CLAVE AQUÍ: Añadir el filtro por ID de usuario si está presente en la consulta ⭐
    if (user) {
        query.user = user;
    }

    const products = await Product.find(query)
                                  .populate('user', 'name reputation isPremium')
                                  .sort({ createdAt: -1 });

    res.status(200).json(products);
});

// @desc    Obtener un solo producto por ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('user', 'isPremium');

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
        // Es un 404 si no hay productos, pero también podemos devolver un array vacío y un 200 si es esperado
        // Para este caso, devolver un array vacío con 200 OK es más amigable para el frontend.
        return res.status(200).json([]); 
    }

    console.log(`--- Backend: getProductsByUser (Productos encontrados para el usuario ${userId}: ${products.length}) ---`);
    products.forEach((p, index) => {
        console.log(`    Producto ${index + 1}: ID=${p._id}, Nombre=${p.name}, Stock=${p.stock} ${p.unit}`);
    });
    console.log('----------------------------------------------------');

    res.status(200).json(products);
});
// @desc    Obtener los productos del usuario autenticado (NUEVA FUNCIÓN)
// @route   GET /api/products/my-products
// @access  Private
const getMyProducts = asyncHandler(async (req, res) => {
    console.log('--- Backend: getMyProducts (Iniciando búsqueda para usuario) ---');
    console.log('Usuario ID:', req.user.id);

    const products = await Product.find({ user: req.user.id }).select('-__v').sort({ createdAt: -1 });

    console.log('--- Backend: getMyProducts (Productos del usuario encontrados) ---');
    console.log('Total de productos encontrados para el usuario:', products.length);
    products.forEach((p, index) => {
        console.log(`   Producto ${index + 1}: ID=${p._id}, Nombre=${p.name}, Publicado=${p.isPublished}, CreadoEn=${p.createdAt}`);
    });
    console.log('----------------------------------------------------');

    res.status(200).json(products);
});

// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (requiere token de autenticación)
const createProduct = asyncHandler(async (req, res) => {
    console.log('ProductController - Iniciando createProduct...');
    if (req.user) {
        console.log('ProductController - ID de usuario recibido de req.user:', req.user._id);
        console.log('ProductController - Email de usuario recibido de req.user:', req.user.email);
    } else {
        console.log('ProductController - req.user es UNDEFINED o NULL!');
    }
    console.log('ProductController - isPublished recibido en req.body:', req.body.isPublished);

    // ⭐ CAMBIO CLAVE AQUÍ: Desestructurar 'stock' y 'unit' en lugar de 'quantity' ⭐
    const { name, description, price, category, stock, unit, isTradable, isPublished } = req.body;
    const imageUrl = req.file ? req.file.path : null;

    // ⭐ Actualizar la validación para los nuevos campos ⭐
    if (!name || !description || !price || !category || !stock || !unit || !imageUrl) {
        res.status(400);
        throw new Error('Por favor, completa todos los campos (nombre, descripción, precio, categoría, stock, unidad, imagen).');
    }
    
    const product = await Product.create({
        user: req.user.id,
        name,
        description,
        price,
        category,
        stock, // ⭐ Usar 'stock' ⭐
        unit,  // ⭐ Usar 'unit' ⭐
        imageUrl,
        isTradable: isTradable === 'true',
        isPublished: Boolean(isPublished), 
    });

    res.status(201).json(product);
});

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    // ⭐ CAMBIO CLAVE AQUÍ: Desestructurar 'stock' y 'unit' en lugar de 'quantity' ⭐
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
        stock: stock !== undefined ? stock : product.stock, // ⭐ Actualizar 'stock' ⭐
        unit: unit !== undefined ? unit : product.unit,    // ⭐ Actualizar 'unit' ⭐
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
    getProducts,
    getProductById,
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByUser
};