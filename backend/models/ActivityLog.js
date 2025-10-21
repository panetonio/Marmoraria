const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  stockItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
    required: true,
  },
  action: {
    type: String,
    enum: ['read', 'status_update', 'location_update', 'status_location_update'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  previousStatus: String,
  newStatus: String,
  previousLocation: String,
  newLocation: String,
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    email: String,
    role: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
