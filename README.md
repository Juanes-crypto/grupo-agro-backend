# agroapp-backend
agroapp-backend/
├── config/                 # Archivos de configuración de la aplicación.
│   ├── cloudinary.js       # Configuración para la integración con Cloudinary (gestión de imágenes).
│   ├── db.js               # Conexión a la base de datos MongoDB (Mongoose).
│   └── multer.js           # Configuración de Multer para el manejo de subidas de archivos.
├── controllers/            # Lógica de negocio para manejar las solicitudes de cada ruta.
│   ├── barterController.js     # Lógica para crear, obtener y gestionar propuestas de trueque.
│   ├── cartController.js       # Lógica para el carrito de compras.
│   ├── notificationController.js # Lógica para crear y gestionar notificaciones.
│   ├── orderController.js      # Lógica para crear y gestionar pedidos.
│   ├── paymentController.js    # Lógica para procesar pagos.
│   ├── productController.js    # Lógica para crear, obtener y gestionar productos.
│   ├── rentalController.js     # Lógica para crear, obtener y gestionar alquileres.
│   ├── serviceController.js    # Lógica para crear, obtener y gestionar servicios.
│   └── userController.js       # Lógica para registro, login y gestión de usuarios.
├── middleware/             # Funciones intermediarias que se ejecutan antes de los controladores.
│   ├── authMiddleware.js   # CLAVE: Protege rutas, verifica tokens y adjunta el usuario a req.
│   ├── errorHandler.js     # Manejador centralizado de errores.
│   └── uploadMiddleware.js # Middleware para manejar subidas de archivos (integrado con Multer/Cloudinary).
├── models/                 # Definiciones de esquemas y modelos de Mongoose para la base de datos.
│   ├── BarterProposal.js   # Modelo para las propuestas de trueque.
│   ├── Cart.js             # Modelo para el carrito de compras.
│   ├── Notifications.js    # Modelo para las notificaciones.
│   ├── Order.js            # Modelo para los pedidos.
│   ├── Product.js          # Modelo para los productos.
│   ├── Rental.js           # Modelo para los alquileres.
│   ├── Service.js          # Modelo para los servicios.
│   └── User.js             # CLAVE: Modelo para los usuarios.
├── routes/                 # Definiciones de las rutas de la API, enlazan con los controladores.
│   ├── barterRoutes.js     # Rutas para las operaciones de trueque.
│   ├── cartRoutes.js       # Rutas para el carrito de compras.
│   ├── notificationRoutes.js # Rutas para notificaciones.
│   ├── orderRoutes.js      # Rutas para pedidos.
│   ├── paymentRoutes.js    # Rutas para pagos.
│   ├── premiumRoutes.js    # Rutas relacionadas con funcionalidades Premium.
│   ├── productRoutes.js    # Rutas para productos.
│   ├── rentalRoutes.js     # Rutas para alquileres.
│   ├── serviceRoutes.js    # Rutas para servicios.
│   └── userRoutes.js       # Rutas para usuarios (registro, login, perfil).
├── uploads/                # Directorio para archivos subidos (probablemente gestionado por Cloudinary).
├── utils/                  # Funciones de utilidad auxiliares.
│   └── generateToken.js    # Genera JSON Web Tokens (JWT).
├── .env                    # Variables de entorno (puerto, conexión DB, JWT_SECRET, etc.).
├── .gitignore              # Archivos y directorios a ignorar por Git.
├── package-lock.json, package.json # Definiciones de proyectos y dependencias de Node.js.
├── README.md               # Este archivo.
└── server.js               # CLAVE: Archivo principal del servidor Express, punto de entrada de la aplicación.


## 🔑 Puntos Clave del Backend

* **Punto de Entrada (`server.js`)**:
    * Configura Express, CORS y middlewares básicos (`express.json`, `express.urlencoded`).
    * Establece la conexión a MongoDB a través de `config/db.js`.
    * Define y utiliza todas las rutas de la API (`/api/users`, `/api/products`, etc.).
    * Integra el `errorHandler.js` para un manejo centralizado de errores.

* **Autenticación (`authMiddleware.js`, `userController.js`, `utils/generateToken.js`, `User.js`)**:
    * **`authMiddleware.js`**: Contiene la función `protect` que verifica el JWT enviado en la cabecera `Authorization`. Si es válido, decodifica el token, busca el usuario en la DB y lo adjunta a `req.user`.
    * `userController.js`: Maneja el registro y login de usuarios, donde se genera el JWT.
    * `utils/generateToken.js`: Función auxiliar para generar los JWTs.
    * `User.js`: Modelo de usuario que incluye campos como `isPremium` y `role`.

* **Base de Datos (MongoDB con Mongoose)**:
    * `config/db.js`: Maneja la conexión a MongoDB.
    * `models/`: Contiene todos los esquemas de Mongoose que definen la estructura de los datos en la DB.

* **Subida de Archivos (`config/multer.js`, `middleware/uploadMiddleware.js`, `config/cloudinary.js`)**:
    * Configuración para manejar la subida de imágenes, presumiblemente integrando Multer con Cloudinary para el almacenamiento en la nube.

* **Manejo de Errores (`middleware/errorHandler.js`)**:
    * Centraliza el manejo de errores para proporcionar respuestas consistentes al frontend.

---

## 🐞 Contexto del Problema de Autenticación (`MyBarterProposalsPage`)

El problema actual se centra en la página "Mis Propuestas de Trueque" (`MyBarterProposalsPage.jsx`) en el frontend, que recibe un error "No autenticado" a pesar de que los logs del backend (`authMiddleware.js`) indican una autenticación exitosa.

* **Middleware `protect` (`authMiddleware.js`)**: Ya hemos confirmado que este middleware procesa correctamente el token, lo verifica y adjunta el objeto `req.user` a la solicitud antes de pasarla al siguiente middleware o controlador.
* **Endpoint `/api/barter/myproposals`**: La solicitud del frontend a este endpoint es la que finalmente devuelve el error.

**Hipótesis de Depuración (Reconfirmadas)**:
1.  **Lógica Post-Autenticación en el Backend**: El `barterController.js` (específicamente `getMyBarterProposals`) o cualquier otro middleware aplicado a esa ruta *después* de `protect` podría estar lanzando un error. Este error, aunque no directamente de autenticación del token, podría ser envuelto por el `errorHandler` y percibido como "no autorizado" por el frontend.
2.  **Manejo de Respuesta en el Frontend**: Una desincronización o lógica incorrecta en el frontend (`MyBarterProposalsPage.jsx`) podría estar activando su propio mensaje de error "No autenticado" o malinterpretando una respuesta del backend.

---

## 🚀 Cómo Iniciar el Desarrollo

1.  **Clonar el repositorio.**
2.  **Backend (`agroapp-backend`)**:
    * `npm install`
    * Configurar el archivo `.env` con las variables necesarias (`PORT`, `MONGO_URI`, `JWT_SECRET`, credenciales de Cloudinary, etc.).
    * `npm run dev`
3.  **Frontend (`agroap-ui`)**:
    * `npm install`
    * Configurar el archivo `.env` (`VITE_BACKEND_URL`).
    * `npm run dev`
