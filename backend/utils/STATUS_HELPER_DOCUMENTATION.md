# Status Helper Documentation

## Overview
The `statusHelper.js` utility provides functions to automatically calculate and update ServiceOrder logistics status based on associated DeliveryRoute statuses.

## Functions

### `calculateDerivedStatus(serviceOrderId)`
Calculates the derived logistics status for a ServiceOrder based on its DeliveryRoutes.

**Parameters:**
- `serviceOrderId` (string): The ID of the ServiceOrder

**Returns:**
- `Promise<string|null>`: The calculated status or null if cannot be determined

**Status Mapping Logic:**

| DeliveryRoute Statuses | Derived ServiceOrder Status |
|------------------------|----------------------------|
| All `completed` | `completed` |
| Any `in_progress` | `in_transit` |
| Any `scheduled` (none in_progress) | `scheduled` |
| All `cancelled` | `awaiting_scheduling` |
| All `pending` | `awaiting_scheduling` |
| No routes | `null` (no change) |

### `ServiceOrder.updateDerivedStatus(serviceOrderId)`
Static method that calculates and automatically updates the ServiceOrder's logistics status.

**Parameters:**
- `serviceOrderId` (string): The ID of the ServiceOrder

**Returns:**
- `Promise<string|null>`: The calculated status or null if no update was made

## Usage Examples

### Basic Usage
```javascript
const { calculateDerivedStatus } = require('../utils/statusHelper');
const ServiceOrder = require('../models/ServiceOrder');

// Just calculate the status without updating
const derivedStatus = await calculateDerivedStatus(serviceOrderId);
console.log('Derived status:', derivedStatus);

// Calculate and update the ServiceOrder
const updatedStatus = await ServiceOrder.updateDerivedStatus(serviceOrderId);
console.log('Updated status:', updatedStatus);
```

### Integration in Controllers
```javascript
// In deliveryRouteController.js
const ServiceOrder = require('../models/ServiceOrder');

// After creating a new DeliveryRoute
exports.createDeliveryRoute = async (req, res) => {
  try {
    const deliveryRoute = new DeliveryRoute(req.body);
    await deliveryRoute.save();
    
    // Update ServiceOrder status based on all routes
    await ServiceOrder.updateDerivedStatus(deliveryRoute.serviceOrderId);
    
    res.status(201).json(deliveryRoute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// After updating a DeliveryRoute status
exports.updateDeliveryRouteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const deliveryRoute = await DeliveryRoute.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    // Update ServiceOrder status based on all routes
    await ServiceOrder.updateDerivedStatus(deliveryRoute.serviceOrderId);
    
    res.json(deliveryRoute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Scheduled Status Sync
```javascript
// In a scheduled job or cron task
const ServiceOrder = require('../models/ServiceOrder');

async function syncAllServiceOrderStatuses() {
  try {
    // Get all ServiceOrders that have DeliveryRoutes
    const serviceOrders = await ServiceOrder.find({
      logisticsStatus: { $in: ['scheduled', 'in_transit', 'awaiting_scheduling'] }
    });
    
    for (const serviceOrder of serviceOrders) {
      await ServiceOrder.updateDerivedStatus(serviceOrder._id);
    }
    
    console.log(`Synced ${serviceOrders.length} ServiceOrder statuses`);
  } catch (error) {
    console.error('Error syncing ServiceOrder statuses:', error);
  }
}
```

## Error Handling
The function includes comprehensive error handling:

```javascript
try {
  const derivedStatus = await calculateDerivedStatus(serviceOrderId);
  // Handle the result
} catch (error) {
  console.error('Error calculating derived status:', error);
  // Handle the error appropriately
}
```

## Performance Considerations
- The function queries all DeliveryRoutes for a given ServiceOrder
- Consider adding database indexes on `serviceOrderId` field in DeliveryRoute collection
- For high-volume scenarios, consider implementing caching or batch processing

## Future Enhancements
- Add support for more complex status derivation rules
- Implement status change history tracking
- Add real-time status updates via WebSocket
- Create status validation middleware
