📊 GUÍA DEFINITIVA CAMPOBIT - MODELOS DE BASE DE DATOS
🗃️ ESQUEMAS MONGOOSE - ESTRUCTURA COMPLETA
1. BARTERPROPOSAL (Propuestas de Trueque)
javascript
// Propósito: Gestionar sistema de trueques entre usuarios
// Relaciones: User (proposer, recipient), Product, self-referencing

// CAMBIO CRÍTICO: quantity ahora es String en barterItemSchema
Campos Principales:

proposer: User que inicia el trueque

recipient: User destinatario

offeredItems: Array de productos OFRECIDOS

requestedItems: Array de productos SOLICITADOS

status: ['pending', 'accepted', 'rejected', 'countered', 'cancelled']

equityFeedback: Análisis de equidad del trueque (nuevo campo)

Estructura barterItemSchema (subdocumento):

javascript
{
  product: ObjectId (ref: 'Product'),
  name: String,
  quantity: String,  // ← CAMBIO IMPORTANTE
  image: String,
  description: String,
  price: Number
}
2. CART (Carrito de Compras)
javascript
// Propósito: Gestionar carritos de compra de usuarios
// Relaciones: User (one-to-one), Product
Campos Principales:

user: Referencia única por usuario

items: Array de items del carrito

Estructura cartItemSchema:

javascript
{
  product: ObjectId (ref: 'Product'),
  quantity: String,  // ← CAMBIO IMPORTANTE
  priceAtTime: Number,  // Precio al momento de agregar
  nameAtTime: String,   // Nombre al momento de agregar
  imageUrlAtTime: String
}
3. NOTIFICATION (Sistema de Notificaciones)
javascript
// Propósito: Notificaciones en tiempo real para usuarios
// Relaciones: User, entidades relacionadas (BarterProposal, Order, etc.)
Campos Principales:

user: Usuario destinatario

type: Enum de tipos predefinidos

title/message: Contenido de la notificación

relatedEntityId/Type: Referencia a entidad relacionada

isRead: Estado de lectura

Tipos de Notificación:

javascript
enum: [
  'new_barter_proposal', 'barter_accepted', 'barter_rejected', 
  'barter_countered', 'order_status_update', 'product_update', 
  'general_message'
]
4. ORDER (Pedidos y Transacciones)
javascript
// Propósito: Gestionar pedidos y integración con Mercado Pago
// Relaciones: User, Product
Estructura Principal:

user: Comprador

orderItems: Array de productos comprados

shippingAddress: Datos de envío

paymentMethod/paymentResult: Integración Mercado Pago

taxPrice/shippingPrice/totalPrice: Cálculos financieros

isPaid/paidAt, isDelivered/deliveredAt: Estados

orderItemSchema:

javascript
{
  name: String,
  quantity: String,  // ← CAMBIO IMPORTANTE
  image: String,
  price: Number,
  product: ObjectId (ref: 'Product')
}
5. PRODUCT (Catálogo de Productos)
javascript
// Propósito: Gestión completa del inventario de productos
// Relaciones: User (vendedor)
Campos Críticos:

user: Vendedor/propietario

name/description/category: Información básica

price: Precio numérico

stock: Number (cantidad disponible) ← CORREGIDO

unit: String (unidad de medida)

location: Geolocalización con coordenadas

isPublished: Control de visibilidad

isTradable: Disponible para trueques

Campos Antifraude:

is_perishable: Productos perecederos

has_freshness_cert: Certificación de frescura

6. RENTAL (Sistema de Alquileres)
javascript
// Propósito: Plataforma de alquiler de equipos agrícolas
// Relaciones: User (owner)
Categorías de Alquiler:

javascript
enum: [
  "Maquinaria Agrícola", "Implementos de Labranza", 
  "Equipo de Riego", "Drones Agrícolas", "Vehículos de Carga", 
  "Espacios/Terrenos", "Herramientas Manuales", "Otros Equipos"
]
Campos Principales:

owner: Arrendador

pricePerDay: Tarifa diaria

imageUrl: Imagen del equipo

7. SERVICE (Servicios Agrícolas)
javascript
// Propósito: Ofrecer servicios profesionales agrícolas
// Relaciones: User (proveedor)
Campos Extendidos:

experience: Cualificaciones del proveedor

category: Categoría del servicio (NUEVO CAMPO)

isTradable: Disponible para trueque

isPublished: Control de publicación

8. USER (Gestión de Usuarios)
javascript
// Propósito: Sistema completo de usuarios y perfiles
Estructura Completa:

name/email/password: Datos básicos de autenticación

profilePicture: Avatar del usuario

isPremium: Estado de cuenta premium

role: ['user', 'admin']

reputation: Sistema de reputación (1-5)

phoneNumber/showPhoneNumber: Contacto y privacidad

Ubicación del Usuario:

javascript
location: {
  city: String,
  address: String, 
  coordinates: [Number] // [longitud, latitud] - ÍNDICE 2dsphere
}
🔄 PATRONES Y CONVENCIONES DETECTADOS
Cambios Globales en Tipo de Datos:
javascript
// EN TODOS LOS MODELOS: quantity ahora es String
// Rationale: Flexibilidad para unidades como "5 kg", "10 unidades", etc.
Estructuras Comunes:
Timestamps: Todos los modelos usan timestamps: true

Referencias: Uso consistente de ref para relaciones

Validaciones: Validators integrados en schemas

Enums: Para campos con valores predefinidos

Sistema de Estados:
BarterProposal: pending → accepted/rejected/countered

Order: paid → delivered

Product/Service: Published/Unpublished

🗂️ RELACIONES ENTRE MODELOS
text
User (1) ────┐
    ├── Product (N)
    ├── Service (N) 
    ├── Rental (N)
    ├── Cart (1)
    ├── Order (N)
    ├── BarterProposal (como proposer/recipient)
    └── Notification (N)

Product (1) ───┐
    ├── CartItem (N)
    ├── OrderItem (N) 
    └── BarterItem (N)

BarterProposal ──┐
    └── BarterProposal (self-reference para counter proposals)
⚠️ NOTAS TÉCNICAS CRÍTICAS
quantity como String: Validación debe hacerse en frontend/controladores

Coordenadas GeoJSON: Uso de índice 2dsphere para búsquedas geográficas

Integración Mercado Pago: Campos específicos en paymentResult

Sistema de Reputación: Escala 1-5 con valores por defecto

Lógica Antifraude: Campos específicos en Product para productos perecederos