const prisma = require('../../config/database');
const { sendStatusChangeEmail } = require('../../config/mailer');

async function listForDoctor(doctorId, { from, to, status, search }) {
  const where = { doctorId };
  if (from && to) where.scheduledAt = { gte: new Date(from), lte: new Date(to) };
  if (status) where.status = status;
  if (search) {
    where.patient = { name: { contains: search, mode: 'insensitive' } };
  }

  return prisma.appointment.findMany({
    where,
    include: { patient: { include: { user: { select: { email: true } } } } },
    orderBy: { scheduledAt: 'asc' },
  });
}

async function updateStatus(doctorId, appointmentId, status) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { include: { user: { select: { email: true } } } },
      doctor:  { select: { name: true } },
    },
  });
  if (!appt || appt.doctorId !== doctorId) {
    const err = new Error('Consulta não encontrada.');
    err.status = 404;
    throw err;
  }

  const updated = await prisma.appointment.update({ where: { id: appointmentId }, data: { status } });

  // Notifica paciente sobre mudança de status
  if (['confirmed', 'cancelled', 'completed'].includes(status)) {
    sendStatusChangeEmail({
      patientEmail: appt.patient.user.email,
      patientName:  appt.patient.name,
      doctorName:   appt.doctor.name,
      status,
      scheduledAt:  appt.scheduledAt,
    }).catch(() => {});
  }

  return updated;
}

async function getMetrics(doctorId) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const [monthAll, todayAll, services] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: start, lte: end } },
      select: { status: true },
    }),
    prisma.appointment.findMany({
      where: { doctorId, scheduledAt: { gte: todayStart, lte: todayEnd }, status: { not: 'cancelled' } },
      select: { id: true },
    }),
    prisma.service.findMany({ where: { doctorId, isActive: true }, select: { price: true } }),
  ]);

  const active   = monthAll.filter(a => a.status !== 'cancelled');
  const confirmed = monthAll.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
  const avgPrice = services.length
    ? services.reduce((s, sv) => s + (Number(sv.price) || 0), 0) / services.length
    : 0;

  return {
    today:              todayAll.length,
    monthTotal:         active.length,
    pending:            monthAll.filter(a => a.status === 'scheduled').length,
    confirmationRate:   active.length > 0 ? Math.round((confirmed / active.length) * 100) : 0,
    estimatedRevenue:   (confirmed * avgPrice).toFixed(2),
  };
}

module.exports = { listForDoctor, updateStatus, getMetrics };