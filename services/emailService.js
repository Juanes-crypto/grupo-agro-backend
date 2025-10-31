const nodemailer = require('nodemailer');

// Crear transporter de Nodemailer (CORREGIDO: createTransport, no createTransporter)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Función para enviar correos
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Campo Bit Support" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error enviando correo:', error);
    throw new Error('Error al enviar el correo');
  }
};

// Plantillas de correo
const emailTemplates = {
  welcome: (name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2d5c2d; text-align: center;">¡Bienvenido a Campo Bit, ${name}! 🌱</h2>
      <p>Gracias por unirte a nuestra comunidad de trueques agrícolas.</p>
      <p>Ahora puedes:</p>
      <ul>
        <li>📦 Publicar tus productos para trueque</li>
        <li>🔍 Explorar productos de otros agricultores</li>
        <li>🤝 Realizar intercambios seguros</li>
        <li>⭐ Construir tu reputación en la comunidad</li>
      </ul>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://agroapp-frontend.onrender.com" style="background-color: #2d5c2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Comenzar a Explorar</a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        Si tienes alguna pregunta, no dudes en contactarnos.<br>
        ¡Felices trueques! 🚜
      </p>
      <br>
      <p>Saludos,<br>El equipo de Campo Bit</p>
    </div>
  `,
  
  newsletter: (content, name = 'Usuario') => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2d5c2d; text-align: center;">🌱 Novedades de Campo Bit</h2>
      <p>Hola ${name},</p>
      ${content}
      <br>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://agroapp-frontend.onrender.com" style="background-color: #2d5c2d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver en la App</a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        ¿No quieres recibir estos correos? <a href="https://agroapp-frontend.onrender.com/profile">Actualiza tus preferencias en tu perfil</a>
      </p>
      <br>
      <p>Saludos,<br>El equipo de CampoBit</p>
    </div>
  `,

  resetPassword: (resetUrl, name) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #2d5c2d; text-align: center;">Solicitud de Reseteo de Contraseña</h2>
      <p>Hola ${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en CampoBit. Si no hiciste esta solicitud, puedes ignorar este correo.</p>
      <p>Para restablecer tu contraseña, haz clic en el siguiente enlace. Este enlace es válido solo por 10 minutos:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #f0ad4e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Restablecer Contraseña
        </a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        Si el botón no funciona, copia y pega la siguiente URL en tu navegador:
      </p>
      <p style="color: #666; font-size: 12px; text-align: center; word-break: break-all;">
        ${resetUrl}
      </p>
      <br>
      <p>Saludos,<br>El equipo de CampoBit</p>
    </div>
  `

};


module.exports = {
  sendEmail,
  emailTemplates
};