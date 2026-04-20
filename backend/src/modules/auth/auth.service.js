const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const env = require('../../config/env');

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

async function registerDoctor({ email, password, name, specialty, crm }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('E-mail já cadastrado.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'doctor',
      doctor: {
        create: {
          name,
          specialty,
          crm,
          settings: { create: {} }, // defaults aplicados pelo schema
        },
      },
    },
    include: { doctor: true },
  });

  const tokens = generateTokens({ sub: user.id, role: user.role, doctorId: user.doctor.id });
  return { user: sanitizeUser(user), ...tokens };
}

async function registerPatient({ email, password, name, phone, dateOfBirth }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('E-mail já cadastrado.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'patient',
      patient: {
        create: {
          name,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      },
    },
    include: { patient: true },
  });

  const tokens = generateTokens({ sub: user.id, role: user.role, patientId: user.patient.id });
  return { user: sanitizeUser(user), ...tokens };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctor: true, patient: true },
  });

  if (!user) {
    const err = new Error('Credenciais inválidas.');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Credenciais inválidas.');
    err.status = 401;
    throw err;
  }

  const payload = { sub: user.id, role: user.role };
  if (user.role === 'doctor') payload.doctorId = user.doctor?.id;
  if (user.role === 'patient') payload.patientId = user.patient?.id;

  const tokens = generateTokens(payload);
  return { user: sanitizeUser(user), ...tokens };
}

async function refreshToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Refresh token inválido ou expirado.');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { doctor: true, patient: true },
  });

  if (!user) {
    const err = new Error('Usuário não encontrado.');
    err.status = 401;
    throw err;
  }

  const newPayload = { sub: user.id, role: user.role };
  if (user.role === 'doctor') newPayload.doctorId = user.doctor?.id;
  if (user.role === 'patient') newPayload.patientId = user.patient?.id;

  return generateTokens(newPayload);
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { doctor: { include: { settings: true } }, patient: true },
  });
  return sanitizeUser(user);
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { registerDoctor, registerPatient, login, refreshToken, getMe };
