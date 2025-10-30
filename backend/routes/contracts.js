const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const contractController = require('../controllers/contractController');

router.use(authenticate);

// Criação a partir de pedido
router.post('/from-order', authorize('admin', 'production'), contractController.createContractFromOrder);

// Obter por id
router.get('/:id', authorize('admin', 'production'), contractController.getContractById);

// Listar contratos de um pedido
router.get('/order/:orderId', authorize('admin', 'production'), contractController.getContractsForOrder);

// Assinar contrato
router.post('/:id/sign', authorize('admin', 'production'), contractController.signContract);

module.exports = router;


