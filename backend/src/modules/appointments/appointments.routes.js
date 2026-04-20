const { Router } = require('express');
const controller = require('./appointments.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

const router = Router();
router.use(authenticate, requireRole('doctor'));

router.get('/metrics',    controller.getMetrics);
router.get('/',           controller.list);
router.patch('/:id/status', controller.updateStatus);

module.exports = router;