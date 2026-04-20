require('dotenv').config();

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  PORT: parseInt(process.env.PORT || '3333', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!env[key]) throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
}

module.exports = env;
