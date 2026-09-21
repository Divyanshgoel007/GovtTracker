const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { createRoute, getRoutes, updateRoute, deleteRoute, importDemoRoutes } = require('../controllers/routeController');

const router = express.Router();

router.post('/import-demo', authMiddleware, roleMiddleware('admin'), importDemoRoutes);
router.post('/', authMiddleware, roleMiddleware('admin'), createRoute);
router.get('/', authMiddleware, getRoutes);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateRoute);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteRoute);

module.exports = router;
