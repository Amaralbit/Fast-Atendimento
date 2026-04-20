const { randomUUID } = require('crypto');
const prisma = require('../../config/database');
const { processMessage } = require('./chat.ai');

async function getOrCreateSession(doctorId, sessionToken) {
  if (sessionToken) {
    const existing = await prisma.chatSession.findUnique({ where: { sessionToken } });
    if (existing && existing.doctorId === doctorId) return existing;
  }

  return prisma.chatSession.create({
    data: { doctorId, sessionToken: randomUUID() },
  });
}

async function getMessages(sessionToken) {
  const session = await prisma.chatSession.findUnique({ where: { sessionToken } });
  if (!session) {
    const err = new Error('Sessão não encontrada.');
    err.status = 404;
    throw err;
  }
  return prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
  });
}

async function sendMessage(sessionToken, userText) {
  const session = await prisma.chatSession.findUnique({ where: { sessionToken } });
  if (!session) {
    const err = new Error('Sessão não encontrada.');
    err.status = 404;
    throw err;
  }

  // Persiste mensagem do usuário
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: userText },
  });

  // Busca histórico completo para enviar à IA
  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  });

  // Converte para formato esperado pela API da Anthropic
  const conversationHistory = history.map(m => ({ role: m.role, content: m.content }));

  // Processa com IA
  const aiText = await processMessage(session.doctorId, conversationHistory);

  // Persiste resposta da IA
  const aiMessage = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'assistant', content: aiText },
  });

  return aiMessage;
}

module.exports = { getOrCreateSession, getMessages, sendMessage };