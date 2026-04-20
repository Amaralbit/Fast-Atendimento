const prisma = require('../../config/database');
const { format, addMinutes, parseISO, isBefore, isEqual, getDay } = require('date-fns');

/**
 * Retorna slots livres para um médico em uma data específica.
 * Ex: ["08:00", "08:30", "09:00", ...]
 */
async function getAvailableSlots(doctorId, dateStr) {
  const date = parseISO(dateStr);
  const dayOfWeek = getDay(date); // 0=Dom ... 6=Sáb

  const [doctor, availability, blockedSlots, appointments] = await Promise.all([
    prisma.doctor.findUnique({ where: { id: doctorId }, select: { avgConsultationMinutes: true } }),
    prisma.doctorAvailability.findFirst({ where: { doctorId, dayOfWeek, isActive: true } }),
    prisma.doctorBlockedSlot.findMany({ where: { doctorId, date } }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: new Date(`${dateStr}T00:00:00`), lte: new Date(`${dateStr}T23:59:59`) },
        status: { notIn: ['cancelled'] },
      },
    }),
  ]);

  if (!availability) return [];

  // Dia inteiro bloqueado?
  const fullDayBlock = blockedSlots.find(b => !b.startTime);
  if (fullDayBlock) return [];

  const step = doctor.avgConsultationMinutes;

  // Gera todos os slots do dia com base no horário de trabalho
  const allSlots = [];
  const [startH, startM] = availability.startTime.split(':').map(Number);
  const [endH, endM]     = availability.endTime.split(':').map(Number);

  let cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM);
  const workEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM);

  while (isBefore(addMinutes(cursor, step), workEnd) || isEqual(addMinutes(cursor, step), workEnd)) {
    allSlots.push(format(cursor, 'HH:mm'));
    cursor = addMinutes(cursor, step);
  }

  // Remove slots bloqueados parcialmente
  const blocked = new Set();
  for (const b of blockedSlots) {
    if (!b.startTime) continue;
    const [bStartH, bStartM] = b.startTime.split(':').map(Number);
    const [bEndH, bEndM]     = b.endTime.split(':').map(Number);
    const bStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), bStartH, bStartM);
    const bEnd   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), bEndH, bEndM);
    for (const slot of allSlots) {
      const [sH, sM] = slot.split(':').map(Number);
      const slotTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), sH, sM);
      if (!isBefore(slotTime, bStart) && isBefore(slotTime, bEnd)) blocked.add(slot);
    }
  }

  // Remove slots com consulta marcada
  for (const appt of appointments) {
    blocked.add(format(new Date(appt.scheduledAt), 'HH:mm'));
  }

  return allSlots.filter(s => !blocked.has(s));
}

module.exports = { getAvailableSlots };