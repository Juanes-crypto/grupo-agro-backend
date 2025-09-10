const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Solo protect, sin authorize
const { sendEmail, emailTemplates } = require('../services/emailService');
const User = require('../models/User');

// @desc    Enviar newsletter a todos los usuarios
// @route   POST /api/email/newsletter
// @access  Private (cualquier usuario autenticado)
router.post('/newsletter', protect, async (req, res) => {
  try {
    const { subject, content } = req.body;
    
    // Validar que vengan los datos necesarios
    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject y content son requeridos'
      });
    }

    console.log('📧 Iniciando envío de newsletter...');
    
    // Obtener todos los usuarios
    const users = await User.find({}, 'email name');
    console.log(`📊 Enviando a ${users.length} usuarios`);
    
    // Enviar correo a cada usuario (manejo de errores individual)
    const results = [];
    for (const user of users) {
      try {
        await sendEmail(
          user.email,
          subject,
          emailTemplates.newsletter(content, user.name)
        );
        results.push({ email: user.email, status: 'success' });
        console.log(`✅ Enviado a: ${user.email}`);
      } catch (error) {
        console.error(`❌ Error enviando a ${user.email}:`, error.message);
        results.push({ email: user.email, status: 'failed', error: error.message });
      }
      
      // Pequeña pausa para no saturar Gmail (100ms entre correos)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Estadísticas
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.json({
      success: true,
      message: `Newsletter enviado a ${successCount} de ${users.length} usuarios`,
      stats: {
        total: users.length,
        success: successCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('❌ Error general enviando newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al enviar newsletter',
      error: error.message
    });
  }
});

// @desc    Enviar correo de prueba
// @route   POST /api/email/test
// @access  Public (sin autenticación para pruebas)
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido para la prueba'
      });
    }

    await sendEmail(
      email,
      '✅ Prueba de AgroApp Email',
      emailTemplates.welcome('Usuario de Prueba')
    );

    res.json({
      success: true,
      message: 'Correo de prueba enviado exitosamente'
    });
  } catch (error) {
    console.error('Error en prueba de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando correo de prueba',
      error: error.message
    });
  }
});

// @desc    Obtener información del servicio de email
// @route   GET /api/email
// @access  Public
router.get('/', (req, res) => {
  res.json({ 
    message: "API de Email funcionando",
    endpoints: {
      newsletter: "POST /api/email/newsletter (requiere autenticación)",
      test: "POST /api/email/test (público para pruebas)"
    }
  });
});

module.exports = router;