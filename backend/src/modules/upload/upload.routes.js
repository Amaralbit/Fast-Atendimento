const { Router } = require('express');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');
const controller = require('./upload.controller');

const router = Router();
router.use(authenticate, requireRole('doctor'));

router.post('/presign', controller.presignUpload);

module.exports = router;