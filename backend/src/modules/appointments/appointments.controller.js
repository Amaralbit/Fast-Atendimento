const service = require('./appointments.service');

async function list(req, res, next) {
  try {
    const appointments = await service.listForDoctor(req.user.doctorId, req.query);
    res.json(appointments);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const appt = await service.updateStatus(req.user.doctorId, req.params.id, req.body.status);
    res.json(appt);
  } catch (err) { next(err); }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await service.getMetrics(req.user.doctorId);
    res.json(metrics);
  } catch (err) { next(err); }
}

module.exports = { list, updateStatus, getMetrics };