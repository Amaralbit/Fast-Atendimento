require('./config/env'); // valida variáveis obrigatórias na inicialização

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./shared/middleware/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const doctorsRoutes = require('./modules/doctors/doctors.routes');
const appointmentsRoutes = require('./modules/appointments/appointments.routes');
const landingPageRoutes = require('./modules/landing-page/landing-page.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const uploadRoutes = require('./modules/upload/upload.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/landing-page', landingPageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

module.exports = app;
