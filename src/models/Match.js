const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  date: { type: Date, required: true },
  stadium: { type: String },
  status: { type: String, enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 }
  },
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Optionnel
}, { timestamps: true });

module.exports = mongoose.model('Match', MatchSchema);
