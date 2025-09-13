const envConfig = {
  // Configuración de base de datos
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/agroapp'
  },
  
  // Configuración de servidor
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_jwt_secret_agroapp'
  },
  
  // Configuración de Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  // Configuración de Stripe
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY
  },
  
  // Configuración de frontend según entorno
  frontend: {
    url: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL_PRODUCTION 
      : process.env.FRONTEND_URL_DEVELOPMENT
  },
  
  // Configuración de reCAPTCHA
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY
  },
  
  // Configuración de email
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  }
};

// Validar configuraciones requeridas
const requiredConfigs = [
  'database.uri',
  'jwt.secret',
  'cloudinary.cloudName',
  'cloudinary.apiKey',
  'cloudinary.apiSecret',
  'recaptcha.secretKey'
];

requiredConfigs.forEach(configPath => {
  const keys = configPath.split('.');
  let value = envConfig;
  
  for (const key of keys) {
    value = value[key];
  }
  
  if (!value) {
    throw new Error(`Configuración requerida faltante: ${configPath}`);
  }
});

module.exports = envConfig;