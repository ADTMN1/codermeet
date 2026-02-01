const express = require('express');
const router = express.Router();
const {
  getResources,
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  toggleResource
} = require('../controllers/resourceController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');

// Public routes
router.get('/', getResources);

// Admin routes
router.get('/admin', auth, adminAuth, getAllResources);
router.post('/', auth, adminAuth, createResource);
router.put('/:id', auth, adminAuth, updateResource);
router.delete('/:id', auth, adminAuth, deleteResource);
router.patch('/:id/toggle', auth, adminAuth, toggleResource);

module.exports = router;
