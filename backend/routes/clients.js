const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('crm'));

router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// Rotas de anotações
router.get('/:id/notes', clientController.getClientNotes);
router.post('/:id/notes', clientController.createClientNote);
router.put('/:id/notes/:noteId', clientController.updateClientNote);
router.delete('/:id/notes/:noteId', clientController.deleteClientNote);

module.exports = router;

