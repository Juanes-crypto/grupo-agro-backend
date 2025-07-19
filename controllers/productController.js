// agroapp-backend/controllers/productController.js

const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// @desc    Obtener todos los productos (se mantiene para la vista pública)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // ⭐ CAMBIO AQUÍ: Cambiar 'tradable' por 'isTradable' para que coincida con el frontend ⭐
    const { search, category, isTradable } = req.query; // Extraer parámetros de consulta

    let query = { isPublished: true }; // Solo mostrar productos publicados por defecto

    // Si hay un término de búsqueda, añadirlo a la query (insensible a mayúsculas/minúsculas)
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    // Si hay una categoría, añadirla a la query
    if (category) {
        query.category = category;
    }

    // ⭐ CAMBIO AQUÍ: Usar 'isTradable' para el filtro ⭐
    // Si 'isTradable' es 'true' (como string), filtrar solo productos truequeables
    if (isTradable === 'true') {
        query.isTradable = true;
    }

    const products = await Product.find(query)
                                  .populate('user', 'isPremium') // Asegúrate de popular isPremium
                                  .sort({ createdAt: -1 }); // Opcional: ordenar por los más recientes

    res.status(200).json(products);
});

// @desc    Obtener un solo producto por ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    // ✨ CAMBIO AQUÍ: Usar .populate('user', 'isPremium') para obtener el estado premium del dueño ✨
    const product = await Product.findById(req.params.id).populate('user', 'isPremium');

    if (!product) {
        res.status(404);
        throw new Error('Producto no encontrado');
    }

    // Si el producto no está publicado y el usuario no es el dueño, se deniega el acceso.
    // Esto es importante para que los borradores no sean visibles públicamente.
    // Además, verifica que product.user existe antes de acceder a .id o .isPremium
    if (!product.isPublished && (!req.user || (product.user && product.user.id !== req.user.id))) {
        res.status(404);
        throw new Error('Producto no encontrado o no disponible.');
    }

    res.status(200).json(product);
});

// @desc    Obtener los productos del usuario autenticado (NUEVA FUNCIÓN)
// @route   GET /api/products/my-products
// @access  Private
const getMyProducts = asyncHandler(async (req, res) => {
    console.log('--- Backend: getMyProducts (Iniciando búsqueda para usuario) ---');
    console.log('Usuario ID:', req.user.id); // req.user.id viene del middleware 'protect'

    // Obtener TODOS los productos del usuario, independientemente de su estado de publicación
    const products = await Product.find({ user: req.user.id }).select('-__v').sort({ createdAt: -1 });

    console.log('--- Backend: getMyProducts (Productos del usuario encontrados) ---');
    console.log('Total de productos encontrados para el usuario:', products.length);
    products.forEach((p, index) => {
        console.log(`  Producto ${index + 1}: ID=${p._id}, Nombre=${p.name}, Publicado=${p.isPublished}, CreadoEn=${p.createdAt}`);
    });
    console.log('----------------------------------------------------');

    // Importante: Asegurarse de que siempre se devuelve un array, incluso si está vacío.
    res.status(200).json(products);
});


// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private (requiere token de autenticación)
const createProduct = asyncHandler(async (req, res) => {
    // ⭐ AÑADIDO: console.logs para depuración ⭐
    console.log('ProductController - Iniciando createProduct...');
    if (req.user) {
        console.log('ProductController - ID de usuario recibido de req.user:', req.user._id);
        console.log('ProductController - Email de usuario recibido de req.user:', req.user.email);
    } else {
        console.log('ProductController - req.user es UNDEFINED o NULL!');
    }
    console.log('ProductController - isPublished recibido en req.body:', req.body.isPublished);
    // ⭐ FIN console.logs ⭐

    const { name, description, price, category, quantity, isTradable, isPublished } = req.body; // Asegúrate de desestructurar isPublished
    const imageUrl = req.file ? req.file.path : null;

    // NO NECESITAMOS BUSCAR EL USUARIO AQUÍ PARA LA LÓGICA DE isPublished
    // La decisión de `isPublished` ahora viene del frontend para esta ruta.
    // La lógica de `isPublishedDefault` que tenías antes se elimina para esta ruta.
    // const user = await User.findById(req.user.id);
    // if (!user) {
    //     res.status(401);
    //     throw new Error('Usuario no autorizado');
    // }
    // const isPublishedDefault = user.isPremium ? false : true; // ESTA LÍNEA SE ELIMINA/IGNORA PARA ESTA RUTA

    if (!name || !description || !price || !category || !quantity || !imageUrl) {
        res.status(400);
        throw new Error('Por favor, completa todos los campos (nombre, descripción, precio, categoría, cantidad, imagen).');
    }
    
    const product = await Product.create({
        user: req.user.id, // El ID del usuario viene del middleware 'protect'
        name,
        description,
        price,
        category,
        quantity,
        imageUrl,
        isTradable: isTradable === 'true',
        // ⭐ CAMBIO CLAVE AQUÍ: Usar directamente el valor de isPublished del req.body ⭐
        // Si el frontend envía `true`, será `true`. Si no lo envía, será `false` por defecto.
        isPublished: Boolean(isPublished), 
    });

    res.status(201).json(product);
});

// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, quantity, isTradable, isPublished } = req.body; // ✨ Añadir isPublished aquí ✨

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
        quantity: quantity !== undefined ? quantity : product.quantity,
        isTradable: isTradable !== undefined ? (isTradable === 'true' || isTradable === true) : product.isTradable,
        imageUrl: newImageUrl,
        isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : product.isPublished, // ✨ Actualizar isPublished si se envía ✨
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
    updateProduct, // Asegurarse de exportar updateProduct
    deleteProduct,
};
