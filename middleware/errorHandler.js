const errorHandler = (err, req, res, next) => {
  // Determina el código de estado: si ya hay uno definido en la respuesta o es 500 (Internal Server Error)
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    message: err.message, // El mensaje de error que lanzamos (ej. "Producto no encontrado")
    // En desarrollo, mostramos la pila del error para depuración.
    // En producción, esto se ocultaría para no exponer detalles internos.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler
};