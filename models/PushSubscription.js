const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true,
    maxlength: 2048
  },
  keys: {
    p256dh: { type: String, required: true, maxlength: 512 },
    auth: { type: String, required: true, maxlength: 256 }
  },
  userAgent: { type: String, maxlength: 500 },
  ultimoEnvio: Date
}, { timestamps: true });

pushSubscriptionSchema.index({ usuario: 1, updatedAt: -1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
