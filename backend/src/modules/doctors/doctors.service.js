const prisma = require('../../config/database');

async function getProfile(doctorId) {
  return prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { settings: true, availability: { orderBy: { dayOfWeek: 'asc' } } },
  });
}

async function updateProfile(doctorId, data) {
  const { name, specialty, crm, whatsappNumber, profilePhotoUrl, avgConsultationMinutes } = data;
  return prisma.doctor.update({
    where: { id: doctorId },
    data: { name, specialty, crm, whatsappNumber, profilePhotoUrl, avgConsultationMinutes },
    include: { settings: true },
  });
}

async function updateSettings(doctorId, data) {
  const { primaryColor, secondaryColor, themeMode } = data;
  return prisma.doctorSettings.update({
    where: { doctorId },
    data: { primaryColor, secondaryColor, themeMode },
  });
}

async function upsertAvailability(doctorId, slots) {
  // slots: [{ dayOfWeek, startTime, endTime, isActive }]
  const ops = slots.map((slot) =>
    prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek: slot.dayOfWeek } },
      create: { doctorId, ...slot },
      update: { startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive },
    })
  );
  return prisma.$transaction(ops);
}

async function getBlockedSlots(doctorId, from, to) {
  return prisma.doctorBlockedSlot.findMany({
    where: {
      doctorId,
      date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { date: 'asc' },
  });
}

async function createBlockedSlot(doctorId, data) {
  const { date, startTime, endTime } = data;
  return prisma.doctorBlockedSlot.create({
    data: { doctorId, date: new Date(date), startTime, endTime, reason: 'manual' },
  });
}

async function deleteBlockedSlot(doctorId, slotId) {
  const slot = await prisma.doctorBlockedSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.doctorId !== doctorId) {
    const err = new Error('Bloqueio não encontrado.');
    err.status = 404;
    throw err;
  }
  if (slot.reason === 'appointment') {
    const err = new Error('Não é possível remover bloqueios gerados por consultas.');
    err.status = 400;
    throw err;
  }
  return prisma.doctorBlockedSlot.delete({ where: { id: slotId } });
}

module.exports = { getProfile, updateProfile, updateSettings, upsertAvailability, getBlockedSlots, createBlockedSlot, deleteBlockedSlot };