// agroapp-backend/models/User.js

const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Por favor, añade un nombre"],
    },
    email: {
      type: String,
      required: [true, "Por favor, añade un correo electrónico"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Por favor, añade una contraseña"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    reputation: {
      type: Number,
      default: 3,
      min: 1,
      max: 5,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    showPhoneNumber: {
      type: Boolean,
      default: false,
    },
    // ==========================================================
    // 💸 NUEVOS CAMPOS PARA PAGOS CENTRALIZADOS (PAYOUTS)
    // ==========================================================
    payoutMethod: {
      type: String,
      enum: ["NINGUNO", "NEQUI", "BANCO"], // Opciones disponibles
      default: "NINGUNO",
    },
    payoutAccount: {
      // Número de Nequi (celular) o Cuenta Bancaria
      type: String,
      default: "",
      // No es unique, ya que varios usuarios pueden tener la misma cuenta compartida (ej: una empresa).
    },
    payoutBank: {
      // Nombre del banco o NEQUI
      type: String,
      default: "",
    },
    payoutDocumentType: {
      // CC, CE, NIT, etc.
      type: String,
      enum: ["CC", "CE", "NIT", "PASAPORTE", ""],
      default: "",
    },
    payoutDocumentNumber: {
      // Número de identificación del titular
      type: String,
      default: "",
    },
    location: {
      type: {
        city: {
          type: String,
          required: [true, "Por favor, especifica la ciudad"],
        },
        address: {
          type: String,
          required: [true, "Por favor, especifica la dirección completa"],
        },
        coordinates: {
          type: [Number],
          required: [true, "Las coordenadas son necesarias para los filtros"],
        },
      },
      required: [true, "La ubicación es un campo requerido"],
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastFailedLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// 🔐 MÉTODO VIRTUAL PARA VERIFICAR SI LA CUENTA ESTÁ BLOQUEADA
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 🔐 MÉTODO PARA INCREMENTAR INTENTOS FALLIDOS
userSchema.methods.incrementLoginAttempts = function() {
    // Si el lock ha expirado, resetear
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1, lastFailedLogin: 1 }
        });
    }
    
    // Incrementar intentos
    const updates = { $inc: { loginAttempts: 1 }, $set: { lastFailedLogin: new Date() } };
    
    // Bloquear después de 3 intentos
    if (this.loginAttempts + 1 >= 3 && !this.isLocked) {
        updates.$set.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
    }
    
    return this.updateOne(updates);
};

// 🔐 MÉTODO PARA RESETEAR INTENTOS AL LOGIN EXITOSO
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1, lastFailedLogin: 1 }
    });
};

userSchema.methods.getResetPasswordToken = function() {
    // Generar el token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hashear el token y guardarlo en la BD
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Establecer tiempo de expiración (10 minutos)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

    console.log('Token generado (para email):', resetToken);
    console.log('Token hasheado (para BD):', this.resetPasswordToken);

    // Devolvemos el token SIN hashear (para enviarlo por email)
    return resetToken;
};

module.exports = mongoose.model("User", userSchema);
