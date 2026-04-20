const { Router } = require('express');
const controller = require('./doctors.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

const router = Router();
router.use(authenticate, requireRole('doctor'));

router.get('/me', controller.getProfile);
router.put('/me', controller.updateProfile);
router.put('/me/settings', controller.updateSettings);
router.put('/me/availability', controller.upsertAvailability);
router.get('/me/blocked-slots', controller.getBlockedSlots);
router.post('/me/blocked-slots', controller.createBlockedSlot);
router.delete('/me/blocked-slots/:id', controller.deleteBlockedSlot);

module.exports = router;