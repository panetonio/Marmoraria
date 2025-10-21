const mongoose = require('mongoose');

const checklistTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['entrega', 'montagem'],
    required: true,
  },
  items: [{
    text: {
      type: String,
      required: true,
      trim: true,
    },
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('ChecklistTemplate', checklistTemplateSchema);
