const prisma = require('../../config/database');

const LIMITS = { free: 50 };

async function checkPlanLimit(req, res, next) {
  try {
    const doctorId = req.user?.doctorId;
    if (!doctorId) return next();

    const settings = await prisma.doctorSettings.findUnique({ where: { doctorId } });
    const plan = settings?.plan || 'free';

    if (plan !== 'free') return next();

    const limit = LIMITS.free;
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.appointment.count({
      where: { doctorId, scheduledAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
    });

    if (count >= limit) {
      return res.status(403).json({
        message: `Limite do plano gratuito atingido (${limit} consultas/mês). Faça upgrade para o plano Pro.`,
        code: 'PLAN_LIMIT_REACHED',
        plan,
        limit,
        current: count,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkPlanLimit };