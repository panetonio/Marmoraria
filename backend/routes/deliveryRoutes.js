const express = require('express');
const router = express.Router();
const deliveryRouteController = require('../controllers/deliveryRouteController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', deliveryRouteController.getRoutes);
router.post('/', deliveryRouteController.createRoute);
router.put('/:id', deliveryRouteController.updateRoute);
router.delete('/:id', deliveryRouteController.deleteRoute);
router.get('/availability/check', deliveryRouteController.checkAvailability);

module.exports = router;
