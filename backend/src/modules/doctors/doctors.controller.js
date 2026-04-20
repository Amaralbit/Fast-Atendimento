const service = require('./doctors.service');

async function getProfile(req, res, next) {
  try {
    const doctor = await service.getProfile(req.user.doctorId);
    res.json(doctor);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const doctor = await service.updateProfile(req.user.doctorId, req.body);
    res.json(doctor);
  } catch (err) { next(err); }
}

async function updateSettings(req, res, next) {
  try {
    const settings = await service.updateSettings(req.user.doctorId, req.body);
    res.json(settings);
  } catch (err) { next(err); }
}

async function upsertAvailability(req, res, next) {
  try {
    const result = await service.upsertAvailability(req.user.doctorId, req.body.slots);
    res.json(result);
  } catch (err) { next(err); }
}

async function getBlockedSlots(req, res, next) {
  try {
    const { from, to } = req.query;
    const slots = await service.getBlockedSlots(req.user.doctorId, from, to);
    res.json(slots);
  } catch (err) { next(err); }
}

async function createBlockedSlot(req, res, next) {
  try {
    const slot = await service.createBlockedSlot(req.user.doctorId, req.body);
    res.status(201).json(slot);
  } catch (err) { next(err); }
}

async function deleteBlockedSlot(req, res, next) {
  try {
    await service.deleteBlockedSlot(req.user.doctorId, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, updateSettings, upsertAvailability, getBlockedSlots, createBlockedSlot, deleteBlockedSlot };