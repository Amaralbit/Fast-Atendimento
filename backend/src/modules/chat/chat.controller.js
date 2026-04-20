const service = require('./chat.service');

async function createSession(req, res, next) {
  try {
    const { doctorId, sessionToken } = req.body;
    if (!doctorId) return res.status(400).json({ message: 'doctorId é obrigatório.' });
    const session = await service.getOrCreateSession(doctorId, sessionToken);
    res.json({ sessionToken: session.sessionToken });
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const messages = await service.getMessages(req.params.token);
    res.json(messages);
  } catch (err) { next(err); }
}

async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Mensagem vazia.' });
    const reply = await service.sendMessage(req.params.token, message.trim());
    res.json(reply);
  } catch (err) { next(err); }
}

module.exports = { createSession, getMessages, sendMessage };