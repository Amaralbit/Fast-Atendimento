const { Router } = require('express');
const controller = require('./auth.controller');
const { authenticate } = require('../../shared/middleware/auth.middleware');
const {
  validate,
  registerDoctorRules,
  registerPatientRules,
  loginRules,
  refreshRules,
} = require('./auth.validator');

const router = Router();

router.post('/register/doctor', registerDoctorRules, validate, controller.registerDoctor);
router.post('/register/patient', registerPatientRules, validate, controller.registerPatient);
router.post('/login', loginRules, validate, controller.login);
router.post('/refresh', refreshRules, validate, controller.refresh);
router.get('/me', authenticate, controller.me);

module.exports = router;
