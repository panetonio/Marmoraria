const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  stockItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockItem',
  },
  serviceOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceOrder',
  },
  action: {
    type: String,
    enum: [
      'read',
      'status_update',
      'location_update',
      'status_location_update',
      'asset_scanned',
      'asset_status_updated',
      'asset_location_updated',
      'asset_status_location_updated',
      'stock_scanned',
      'stock_status_updated',
      'stock_location_updated',
      'stock_status_location_updated',
      'service_order_checklist_update',
      'service_order_checklist_item_checked',
    ],
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
  relatedEntityType: String,
  relatedEntityId: String,
  assetType: String,
  metadata: mongoose.Schema.Types.Mixed,
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
