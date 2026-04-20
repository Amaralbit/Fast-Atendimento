const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/database');

async function start() {
  await prisma.$connect();
  console.log('Banco de dados conectado.');

  app.listen(env.PORT, () => {
    console.log(`Servidor rodando em http://localhost:${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
