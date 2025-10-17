🌟 GUÍA DEFINITIVA CAMPOBIT - DOCUMENTACIÓN COMPLETA
📖 ÍNDICE
Visión General

Arquitectura del Sistema

Configuración y Despliegue

Modelos de Base de Datos

Controladores

Rutas y Endpoints

Middlewares

Servicios Externos

Frontend Integration

Flujos de Negocio

🎯 VISIÓN GENERAL
CampoBit es una plataforma de trueques agrícolas que conecta a agricultores y productores para intercambiar productos y servicios de manera segura y equitativa.

🚀 Características Principales
Sistema de Trueques con validación de equidad

Gestión de Inventarios con control de stock y unidades

Pasarelas de Pago (Stripe + Mercado Pago)

Sistema de Reputación y prevención de fraudes

Geolocalización para búsquedas por proximidad

Notificaciones en Tiempo Real

Servicios y Alquileres agrícolas

🛠 Stack Tecnológico
Backend: Node.js + Express.js

Base de Datos: MongoDB con Mongoose

Autenticación: JWT + bcrypt

Archivos: Cloudinary + Multer

Pagos: Stripe + Mercado Pago

Email: Nodemailer

Frontend: React/Next.js (referenciado)

🏗 ARQUITECTURA DEL SISTEMA
Estructura de Carpetas
text
agroapp-backend/
├── config/          # Configuraciones
├── controllers/     # Lógica de negocio
├── middleware/      # Autenticación y validaciones
├── models/          # Esquemas de MongoDB
├── routes/          # Endpoints API
├── services/        # Servicios externos
├── utils/           # Funciones helper
├── server.js        # Punto de entrada
└── package.json
Flujo de Request
text
Request → Middlewares → Routes → Controllers → Models → Response
⚙ CONFIGURACIÓN Y DESPLIEGUE
Variables de Entorno Críticas
env
# Base de Datos
MONGO_URI="mongodb+srv://usuario:password@cluster.mongodb.net/AgroAPP?retryWrites=true&w=majority"

# Autenticación JWT
JWT_SECRET="clave_secreta_muy_larga_y_aleatoria"

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...

# Frontend URLs
FRONTEND_URL_DEVELOPMENT=http://localhost:5173
FRONTEND_URL_PRODUCTION=https://tu-dominio.com

# reCAPTCHA
RECAPTCHA_SECRET_KEY=6Lc...

# Email
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=app-password
Scripts de Despliegue
json
{
  "dev": "cross-env NODE_ENV=development node server.js",
  "start": "cross-env NODE_ENV=production node server.js"
}
Configuración del Servidor (server.js)
Puerto: 5000 (configurable)

CORS: Configurado para múltiples orígenes

Middlewares Globales: express.json(), cookie-parser, cors

Manejo de Errores: Centralizado con errorHandler

🗃 MODELOS DE BASE DE DATOS
1. User
javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  profilePicture: String,
  isPremium: Boolean,
  role: ['user', 'admin'],
  reputation: Number (1-5),
  phoneNumber: String,
  showPhoneNumber: Boolean,
  location: {
    city: String,
    address: String,
    coordinates: [Number] // [longitud, latitud]
  }
}
2. Product
javascript
{
  user: ObjectId (ref: User),
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,        // Cambio clave: ahora es Number
  unit: String,         // "kg", "unidades", "litros"
  location: {
    city: String,
    address: String,
    coordinates: [Number]
  },
  imageUrl: String,
  isPublished: Boolean,
  isTradable: Boolean,
  is_perishable: Boolean,      // Antifraude
  has_freshness_cert: Boolean  // Antifraude
}
3. BarterProposal (Trueques)
javascript
{
  proposer: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  offeredItems: [barterItemSchema],
  requestedItems: [barterItemSchema],
  status: ['pending', 'accepted', 'rejected', 'countered', 'cancelled'],
  message: String,
  counterProposalId: ObjectId (self-ref),
  originalProposalId: ObjectId (self-ref),
  equityFeedback: {
    isFair: Boolean,
    message: String,
    difference: {
      amount: Number,
      unit: String,
      product: String,
      percentage: Number
    },
    offeredValue: Number,
    requestedValue: Number,
    differencePercentage: Number
  }
}
barterItemSchema:

javascript
{
  product: ObjectId (ref: Product),
  name: String,
  quantity: String,    // "5 kg", "10 unidades"
  image: String,
  description: String,
  price: Number
}
4. Cart (Carrito)
javascript
{
  user: ObjectId (ref: User) (unique),
  items: [cartItemSchema]
}
cartItemSchema:

javascript
{
  product: ObjectId (ref: Product),
  quantity: String,      // "2 kg", "5 unidades"
  priceAtTime: Number,
  nameAtTime: String,
  imageUrlAtTime: String
}
5. Order (Pedidos)
javascript
{
  user: ObjectId (ref: User),
  orderItems: [orderItemSchema],
  shippingAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String
  },
  paymentMethod: String,
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  taxPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,
  isPaid: Boolean,
  paidAt: Date,
  isDelivered: Boolean,
  deliveredAt: Date
}
6. Notification
javascript
{
  user: ObjectId (ref: User),
  type: [
    'new_barter_proposal', 'barter_accepted', 'barter_rejected',
    'barter_countered', 'order_status_update', 'product_update',
    'general_message'
  ],
  title: String,
  message: String,
  relatedEntityId: ObjectId,
  relatedEntityType: ['BarterProposal', 'Order', 'Product', 'User'],
  isRead: Boolean
}
7. Rental (Alquileres)
javascript
{
  owner: ObjectId (ref: User),
  name: String,
  description: String,
  pricePerDay: Number,
  category: [
    "Maquinaria Agrícola", "Implementos de Labranza", "Equipo de Riego",
    "Drones Agrícolas", "Vehículos de Carga", "Espacios/Terrenos",
    "Herramientas Manuales", "Otros Equipos"
  ],
  imageUrl: String
}
8. Service (Servicios)
javascript
{
  user: ObjectId (ref: User),
  name: String,
  description: String,
  experience: String,
  imageUrl: String,
  price: Number,
  category: String,
  isTradable: Boolean,
  isPublished: Boolean
}
🎮 CONTROLADORES
BarterController (Sistema Complejo de Trueques)
Funcionalidades:

createBarterProposal: Crear propuestas con validación de equidad

updateBarterProposalStatus: Aceptar/rechazar con transacciones ACID

createCounterProposal: Sistema de contraofertas

getBarterValueComparison: Análisis de equidad automático

Características Especiales:

Transacciones MongoDB para consistencia

Validación antifraude (reputación > 3, productos perecederos)

Límite de diferencia de valor (40%)

Sistema de notificaciones automático

ProductController
Endpoints Principales:

getProducts: Búsqueda con filtros (categoría, ubicación, truequeables)

createProduct: Con geolocalización automática del usuario

updateProduct: Validación de propiedad

getMyProducts: Productos del usuario autenticado

UserController
Autenticación:

registerUser: Con validación de ubicación y reCAPTCHA

loginUser: Generación de JWT

updateUserProfile: Gestión de perfil con imagen

PaymentController
Integraciones:

createCheckoutSession: Stripe Checkout

createMercadoPagoOrder: Mercado Pago

handleMercadoPagoWebhook: Webhooks para notificaciones

Otros Controladores
CartController: Gestión completa de carrito

OrderController: Procesamiento de pedidos

NotificationController: Sistema de notificaciones

RentalController: Gestión de alquileres

ServiceController: Servicios profesionales

🛣 RUTAS Y ENDPOINTS
Autenticación (/users)
POST /api/users/register - Registro con reCAPTCHA

POST /api/users/login - Login

GET /api/users/me - Perfil actual

PUT /api/users/profile - Actualizar perfil

Productos (/products)
GET /api/products - Listar con filtros

POST /api/products - Crear producto

GET /api/products/my-products - Mis productos

PUT /api/products/:id - Actualizar producto

DELETE /api/products/:id - Eliminar producto

Trueques (/barter)
POST /api/barter - Crear propuesta

GET /api/barter/myproposals - Mis trueques

PUT /api/barter/:id/status - Cambiar estado

POST /api/barter/:id/counter - Contraofertar

GET /api/barter/value-comparison - Análisis de equidad

Pagos (/payments)
POST /api/payments/create-checkout-session - Stripe

POST /api/payments/create-order - Mercado Pago

POST /api/payments/webhook - Webhooks MP

Otros Endpoints
/api/cart - Gestión de carrito

/api/orders - Pedidos

/api/notifications - Notificaciones

/api/rentals - Alquileres

/api/services - Servicios

🛡 MIDDLEWARES
AuthMiddleware
protect:

Verificación JWT en headers Authorization

Adjunta usuario a req.user

Manejo de errores de token

authorize:

Control de acceso por roles/premium

Uso: authorize(['premium']) o authorize()

ErrorHandler
Manejo centralizado de errores

Stack trace solo en desarrollo

Formatos consistentes de error

UploadMiddleware
Configuración Multer + Cloudinary

Límites: 5MB perfil, 10MB productos

Filtros de tipo de archivo

LocationMiddleware
Procesamiento de datos de ubicación

Conversión de coordenadas

Estructuración de objeto location

ParseFormData
Procesamiento de FormData para registros

Manejo de campos mixtos (archivos + texto)

🔗 SERVICIOS EXTERNOS
Cloudinary
Configuración:

javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
Carpetas:

agroapp_profile_pictures - Imágenes de perfil

agroapp_products - Imágenes de productos

agroapp_rentals - Imágenes de alquileres

agroapp-services - Imágenes de servicios

Email Service (Nodemailer)
Plantillas:

welcome - Bienvenida a nuevos usuarios

newsletter - Comunicaciones masivas

Configuración Gmail:

javascript
transporter: {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
}
Mercado Pago
Configuración:

javascript
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  site_id: 'MCO' // Colombia
});
Flujo:

Crear preferencia con mercadopago.preferences.create()

Redirigir a init_point

Procesar webhook con mercadopago.payment.get()

Stripe
Configuración:

javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
⚠ SISTEMA ANTIFRAUDE
Validaciones Implementadas
Reputación Mínima: Usuarios con < 3 estrellas no pueden hacer trueques

Productos Perecederos: Requieren certificación de frescura

Equidad de Trueques: Límite del 40% de diferencia de valor

Validación de Stock: Verificación en tiempo real

Propiedad de Productos: Solo el dueño puede ofrecer/truequear

Cálculo de Equidad
javascript
// Fórmula de diferencia porcentual
const lowerValue = Math.min(totalOfferedValue, totalRequestedValue);
const higherValue = Math.max(totalOfferedValue, totalRequestedValue);
const differencePercentage = ((higherValue - lowerValue) / lowerValue) * 100;

// Bloqueo si > 40%
if (differencePercentage > 40) {
  throw new Error("La diferencia de valor supera el 40%");
}
🔄 FLUJOS DE NEGOCIO CRÍTICOS
Flujo de Trueque
Creación de Propuesta

Validación de productos y ownership

Cálculo automático de equidad

Notificación al recipient

Aceptación de Trueque

Transacción ACID para intercambio

Transferencia de propiedad de productos

Actualización de stock

Notificaciones a ambas partes

Sistema de Contraofertas

Cadena de propuestas vinculadas

Mantenimiento de estado original

Notificaciones automáticas

Flujo de Pago
Stripe

Crear sesión de checkout

Redirigir a Stripe

Webhook para confirmación

Mercado Pago

Crear preferencia de pago

Redirigir a MP

Webhook para procesar estado

Flujo de Notificaciones
Automáticas en eventos clave (trueques, pagos, actualizaciones)

Sistema de marcado como leído

Integración con todos los controladores

🚀 DESPLIEGUE Y PRODUCCIÓN
Configuración de Producción
env
NODE_ENV=production
FRONTEND_URL_PRODUCTION=https://tu-dominio.com
MONGO_URI=mongodb+srv://... (producción)
Variables Críticas para Producción
JWT_SECRET - Debe ser fuerte y único

MERCADO_PAGO_ACCESS_TOKEN - Token de producción

STRIPE_SECRET_KEY - Key de producción

CLOUDINARY_* - Configuración de producción

Monitoreo y Logs
Console logs detallados en desarrollo

Errores centralizados con stack traces

Validación de configuraciones al iniciar

📞 INTEGRACIÓN CON FRONTEND
Estructura Esperada de Requests
Headers:

javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
Responses Estándar:

javascript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}

// Error
{
  "success": false,
  "message": "Mensaje de error",
  "stack": "..." // solo en desarrollo
}
URLs de Frontend Configuradas
Desarrollo: http://localhost:5173

Producción: https://agroapp-frontend.onrender.com

🛠 DEPENDENCIAS Y VERSIONES
Dependencies (package.json)
json
{
  "express": "4.19.2",
  "mongoose": "^8.16.4",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "cloudinary": "^1.41.3",
  "multer": "^2.0.2",
  "mercadopago": "^1.5.0",
  "stripe": "^14.0.0",
  "nodemailer": "^7.0.6",
  "axios": "^1.11.0"
}
Configuraciones Específicas
Mongoose 8+: No necesita useNewUrlParser, useUnifiedTopology

JWT: Expiración en 30 días

Multer: Límites de 5-10MB según tipo de archivo

CORS: Configurado para múltiples orígenes con credentials

💡 PATRONES Y CONVENCIONES
Nomenclatura
Variables: camelCase

Modelos: PascalCase (User, Product)

Archivos: kebab-case (barter-controller.js)

Endpoints: RESTful, plural (/api/products)

Manejo de Errores
Uso consistente de asyncHandler

Errores específicos con mensajes claros

Códigos HTTP apropiados

Seguridad
Passwords hasheadas con bcrypt

JWT en headers Authorization

Validación de entrada con express-validator

Sanitización de datos

🔮 EXTENSIONES FUTURAS
Características Planeadas
Sistema de Mensajería entre usuarios

Dashboard de Analytics para administradores

Sistema de Reseñas y Calificaciones

Integración con más pasarelas de pago

API pública para terceros

Mejoras Técnicas
Cache con Redis para mejor performance

WebSockets para notificaciones en tiempo real

Microservicios para escalabilidad

Tests automatizados completos

✅ CHECKLIST DE IMPLEMENTACIÓN
Backend Completo
Autenticación y Autorización

Gestión de Usuarios y Perfiles

CRUD Completo de Productos

Sistema de Trueques con Equidad

Carrito de Compras y Pedidos

Pasarelas de Pago (Stripe + MP)

Sistema de Notificaciones

Servicios y Alquileres

Gestión de Archivos (Cloudinary)

Email Service

Geolocalización

Sistema Antifraude
