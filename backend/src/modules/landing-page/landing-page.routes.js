const { Router } = require('express');
const c = require('./landing-page.controller');
const { authenticate, requireRole } = require('../../shared/middleware/auth.middleware');

const router = Router();

// ── Público (sem auth) ────────────────────────────────────────────────────────
router.get('/public/:doctorId', c.getPublicPage);

// ── CMS (apenas médico autenticado) ──────────────────────────────────────────
router.use(authenticate, requireRole('doctor'));

router.get('/sections',              c.getSections);
router.put('/sections/:key',         c.upsertSection);

router.get('/media',                 c.getMedia);
router.post('/media',                c.addMedia);
router.delete('/media/:id',          c.deleteMedia);

router.get('/services',               c.getServices);
router.post('/services',              c.upsertService);
router.put('/services/:id',           c.updateService);
router.delete('/services/:id',        c.deleteService);

router.get('/insurance-plans',        c.getInsurances);
router.post('/insurance-plans',       c.upsertInsurance);
router.put('/insurance-plans/:id',    c.updateInsurance);
router.delete('/insurance-plans/:id', c.deleteInsurance);

module.exports = router;