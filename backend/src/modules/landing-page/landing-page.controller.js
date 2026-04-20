const s = require('./landing-page.service');

// CMS
const getSections       = (req, res, next) => s.getSections(req.user.doctorId).then(d => res.json(d)).catch(next);
const upsertSection     = (req, res, next) => s.upsertSection(req.user.doctorId, req.params.key, req.body).then(d => res.json(d)).catch(next);
const getMedia          = (req, res, next) => s.getMedia(req.user.doctorId).then(d => res.json(d)).catch(next);
const addMedia          = (req, res, next) => s.addMedia(req.user.doctorId, req.body).then(d => res.status(201).json(d)).catch(next);
const deleteMedia       = (req, res, next) => s.deleteMedia(req.user.doctorId, req.params.id).then(() => res.status(204).send()).catch(next);
const getServices       = (req, res, next) => s.getServices(req.user.doctorId).then(d => res.json(d)).catch(next);
const upsertService     = (req, res, next) => s.upsertService(req.user.doctorId, req.body).then(d => res.json(d)).catch(next);
const updateService     = (req, res, next) => s.upsertService(req.user.doctorId, { ...req.body, id: req.params.id }).then(d => res.json(d)).catch(next);
const deleteService     = (req, res, next) => s.deleteService(req.user.doctorId, req.params.id).then(() => res.status(204).send()).catch(next);
const getInsurances     = (req, res, next) => s.getInsurancePlans(req.user.doctorId).then(d => res.json(d)).catch(next);
const upsertInsurance   = (req, res, next) => s.upsertInsurancePlan(req.user.doctorId, req.body).then(d => res.json(d)).catch(next);
const updateInsurance   = (req, res, next) => s.upsertInsurancePlan(req.user.doctorId, { ...req.body, id: req.params.id }).then(d => res.json(d)).catch(next);
const deleteInsurance   = (req, res, next) => s.deleteInsurancePlan(req.user.doctorId, req.params.id).then(() => res.status(204).send()).catch(next);

// Público
const getPublicPage     = (req, res, next) => s.getPublicPage(req.params.doctorId).then(d => res.json(d)).catch(next);

module.exports = {
  getSections, upsertSection,
  getMedia, addMedia, deleteMedia,
  getServices, upsertService, updateService, deleteService,
  getInsurances, upsertInsurance, updateInsurance, deleteInsurance,
  getPublicPage,
};