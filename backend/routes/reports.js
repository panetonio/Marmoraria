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

// Duração média por etapa de produção
router.get('/stage-durations', authorize('admin', 'production', 'finance'), reportsController.getStageDurationStats);

// Estatísticas de rotas por funcionário
router.get('/employee-route-stats', authorize('admin', 'production', 'finance'), reportsController.getEmployeeRouteStats);

// Alertas de manutenção (garantias e próximas manutenções)
router.get(
  '/maintenance-alerts',
  authorize('admin', 'producao', 'aux_administrativo', 'equipment'),
  reportsController.getMaintenanceAlerts
);

module.exports = router;
