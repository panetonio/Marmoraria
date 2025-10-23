const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Relatórios de produtividade
router.get('/productivity/employees', reportsController.getEmployeeProductivity);
router.get('/productivity/company', reportsController.getCompanyProductivity);

module.exports = router;
