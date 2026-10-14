const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  number: { type: Number, required: true }, // Numéro de maillot
  position: { type: String, required: true }, // ex: Gardien, Attaquant...
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Player', PlayerSchema);
