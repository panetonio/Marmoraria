const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/materialController');

router.use(authenticate);

router.get('/', authorize('admin', 'producao'), ctrl.getAll);
router.post('/', authorize('admin', 'producao'), ctrl.create);
router.put('/:id', authorize('admin', 'producao'), ctrl.update);
router.delete('/:id', authorize('admin', 'producao'), ctrl.remove);

module.exports = router;


