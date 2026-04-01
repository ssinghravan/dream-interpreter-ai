const mongoose = require('mongoose');

const dreamSchema = new mongoose.Schema(
  {
    text:    { type: String, required: true },
    meaning: { type: String, required: true },
    symbols: [
      {
        name:    { type: String },
        meaning: { type: String },
      },
    ],
    mood:       { type: String, required: true },
    confidence: { type: Number, default: null },
    imageUrl:   { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dream', dreamSchema);
