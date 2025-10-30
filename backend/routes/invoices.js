const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

// Proteger todas as rotas de NF (admin e financeiro)
router.use(authenticate);

router.get('/', authorize('admin', 'finance'), invoiceController.getAllInvoices);
router.get('/:id', authorize('admin', 'finance'), invoiceController.getInvoiceById);
router.post('/from-order', authorize('admin', 'finance'), invoiceController.createInvoiceFromOrder);
router.post('/:id/issue', authorize('admin', 'finance'), invoiceController.simulateIssueNFe);

module.exports = router;


