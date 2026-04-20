const prisma = require('../../config/database');

// ── CMS (autenticado) ─────────────────────────────────────────────────────────

async function getSections(doctorId) {
  return prisma.landingPageSection.findMany({
    where: { doctorId },
    orderBy: { displayOrder: 'asc' },
  });
}

async function upsertSection(doctorId, sectionKey, data) {
  return prisma.landingPageSection.upsert({
    where: { doctorId_sectionKey: { doctorId, sectionKey } },
    create: { doctorId, sectionKey, ...data },
    update: data,
  });
}

async function getMedia(doctorId) {
  return prisma.landingPageMedia.findMany({
    where: { doctorId },
    orderBy: { displayOrder: 'asc' },
  });
}

async function addMedia(doctorId, data) {
  const last = await prisma.landingPageMedia.findFirst({
    where: { doctorId },
    orderBy: { displayOrder: 'desc' },
  });
  return prisma.landingPageMedia.create({
    data: { doctorId, ...data, displayOrder: (last?.displayOrder ?? -1) + 1 },
  });
}

async function deleteMedia(doctorId, mediaId) {
  const media = await prisma.landingPageMedia.findUnique({ where: { id: mediaId } });
  if (!media || media.doctorId !== doctorId) {
    const err = new Error('Mídia não encontrada.');
    err.status = 404;
    throw err;
  }
  return prisma.landingPageMedia.delete({ where: { id: mediaId } });
}

async function getServices(doctorId) {
  return prisma.service.findMany({ where: { doctorId }, orderBy: { createdAt: 'asc' } });
}

async function upsertService(doctorId, data) {
  const { id, ...fields } = data;
  if (id) {
    return prisma.service.update({ where: { id }, data: { ...fields, doctorId } });
  }
  return prisma.service.create({ data: { doctorId, ...fields } });
}

async function deleteService(doctorId, serviceId) {
  const svc = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!svc || svc.doctorId !== doctorId) {
    const err = new Error('Serviço não encontrado.');
    err.status = 404;
    throw err;
  }
  return prisma.service.delete({ where: { id: serviceId } });
}

async function getInsurancePlans(doctorId) {
  return prisma.insurancePlan.findMany({ where: { doctorId }, orderBy: { createdAt: 'asc' } });
}

async function upsertInsurancePlan(doctorId, data) {
  const { id, ...fields } = data;
  if (id) {
    return prisma.insurancePlan.update({ where: { id }, data: { ...fields, doctorId } });
  }
  return prisma.insurancePlan.create({ data: { doctorId, ...fields } });
}

async function deleteInsurancePlan(doctorId, planId) {
  const plan = await prisma.insurancePlan.findUnique({ where: { id: planId } });
  if (!plan || plan.doctorId !== doctorId) {
    const err = new Error('Convênio não encontrado.');
    err.status = 404;
    throw err;
  }
  return prisma.insurancePlan.delete({ where: { id: planId } });
}

// ── Público ───────────────────────────────────────────────────────────────────

async function getPublicPage(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      settings: true,
      sections: { orderBy: { displayOrder: 'asc' } },
      media: { orderBy: { displayOrder: 'asc' } },
      services: { where: { isActive: true } },
      insurancePlans: { where: { isActive: true } },
    },
  });
  if (!doctor) {
    const err = new Error('Página não encontrada.');
    err.status = 404;
    throw err;
  }
  // nunca expor dados sensíveis
  const { userId, ...safe } = doctor;
  return safe;
}

module.exports = {
  getSections, upsertSection,
  getMedia, addMedia, deleteMedia,
  getServices, upsertService, deleteService,
  getInsurancePlans, upsertInsurancePlan, deleteInsurancePlan,
  getPublicPage,
};