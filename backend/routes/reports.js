const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Relatórios de produtividade
router.get('/productivity/employees', authorize('admin', 'production', 'finance'), reportsController.getEmployeeProductivity);
router.get('/productivity/company', authorize('admin', 'production', 'finance'), reportsController.getCompanyProductivity);

// Relatórios de estatísticas de produção
router.get('/production/stats', authorize('admin', 'production', 'finance'), reportsController.getProductionStats);

module.exports = router;
