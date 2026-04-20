const { Router } = require('express');
const controller = require('./chat.controller');

const router = Router();

// Rotas públicas — acessadas pelo widget na landing page do paciente
router.post('/session',                    controller.createSession);
router.get('/session/:token/messages',     controller.getMessages);
router.post('/session/:token/message',     controller.sendMessage);

module.exports = router;