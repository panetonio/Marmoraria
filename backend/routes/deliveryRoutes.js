const express = require('express');
const router = express.Router();
const deliveryRouteController = require('../controllers/deliveryRouteController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', deliveryRouteController.getRoutes);
router.post('/', deliveryRouteController.createRoute);
router.post('/installation', deliveryRouteController.createInstallationRoute);
router.put('/:id', deliveryRouteController.updateRoute);
router.patch('/:id/status', deliveryRouteController.updateRouteStatus);
router.delete('/:id', deliveryRouteController.deleteRoute);
router.get('/availability/check', deliveryRouteController.checkAvailability);
router.get('/resources/availability', deliveryRouteController.getResourceAvailability);

module.exports = router;
