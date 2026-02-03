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
const { authenticate } = require('../middlewares/roleBasedAuth');
const { adminAuth } = require('../middlewares/adminAuth');

// Public routes
router.get('/', getResources);

// Admin routes
router.get('/admin', authenticate, adminAuth, getAllResources);
router.post('/', authenticate, adminAuth, createResource);
router.put('/:id', authenticate, adminAuth, updateResource);
router.delete('/:id', authenticate, adminAuth, deleteResource);
router.patch('/:id/toggle', authenticate, adminAuth, toggleResource);


module.exports = router;
