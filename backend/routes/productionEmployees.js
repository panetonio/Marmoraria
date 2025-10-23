const express = require('express');
const router = express.Router();
const productionEmployeeController = require('../controllers/productionEmployeeController');
const { authenticate } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Rotas CRUD
router.get('/', productionEmployeeController.getEmployees);
router.get('/:id', productionEmployeeController.getEmployeeById);
router.post('/', productionEmployeeController.createEmployee);
router.put('/:id', productionEmployeeController.updateEmployee);
router.delete('/:id', productionEmployeeController.deleteEmployee);

// Rotas de gerenciamento de tarefas
router.post('/:id/assign', productionEmployeeController.assignToTask);
router.post('/:id/release', productionEmployeeController.releaseFromTask);

module.exports = router;

