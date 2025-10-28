const mongoose = require('mongoose');

/**
 * Calculate the derived logistics status for a ServiceOrder based on its DeliveryRoutes
 * @param {string} serviceOrderId - The ID of the ServiceOrder
 * @returns {Promise<string|null>} The calculated status or null if cannot be determined
 */
async function calculateDerivedStatus(serviceOrderId) {
  try {
    // Import DeliveryRoute model
    const DeliveryRoute = mongoose.model('DeliveryRoute');
    
    // Find all delivery routes for this service order
    const routes = await DeliveryRoute.find({ serviceOrderId });
    
    // If no routes exist, return null (status cannot be derived)
    if (routes.length === 0) {
      return null;
    }
    
    // Extract all route statuses
    const statuses = routes.map(r => r.status);
    
    // Apply status derivation rules
    // Rule 1: If ALL routes are completed -> ServiceOrder is completed
    if (statuses.every(s => s === 'completed')) {
      return 'completed';
    }
    
    // Rule 2: If ANY route is in_progress -> ServiceOrder is in_transit
    if (statuses.some(s => s === 'in_progress')) {
      return 'in_transit';
    }
    
    // Rule 3: If ANY route is scheduled (and none in_progress) -> ServiceOrder is scheduled
    if (statuses.some(s => s === 'scheduled')) {
      return 'scheduled';
    }
    
    // Rule 4: If ALL routes are cancelled -> ServiceOrder should return to ready_for_logistics
    if (statuses.every(s => s === 'cancelled')) {
      return 'awaiting_scheduling'; // Return to awaiting scheduling
    }
    
    // Rule 5: If ALL routes are pending -> ServiceOrder is awaiting_scheduling
    if (statuses.every(s => s === 'pending')) {
      return 'awaiting_scheduling';
    }
    
    // If no rule applies, return null (unexpected state)
    return null;
    
  } catch (error) {
    console.error('Error calculating derived status:', error);
    throw error;
  }
}

module.exports = {
  calculateDerivedStatus
};
