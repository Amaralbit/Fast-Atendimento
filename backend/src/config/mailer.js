const { Resend } = require('resend');
const env = require('./env');

const resend = new Resend(env.RESEND_API_KEY);
const FROM = 'Fast Atendimento <noreply@fastatendimento.com>';

function fmtDate(scheduledAt) {
  return new Date(scheduledAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

async function sendNewAppointmentEmail({ doctorEmail, doctorName, patientName, scheduledAt }) {
  const date = fmtDate(scheduledAt);
  await resend.emails.send({
    from: FROM,
    to: doctorEmail,
    subject: `Nova consulta agendada — ${patientName}`,
    html: `
      <h2>Olá, Dr(a). ${doctorName}!</h2>
      <p>Uma nova consulta foi agendada pela secretária virtual.</p>
      <ul>
        <li><strong>Paciente:</strong> ${patientName}</li>
        <li><strong>Data/Hora:</strong> ${date}</li>
      </ul>
      <p>Acesse o painel para confirmar ou gerenciar a consulta.</p>
      <p style="color:#6b7280;font-size:12px;">Fast Atendimento — Secretária Virtual</p>
    `,
  });
}

async function sendAppointmentConfirmationToPatient({ patientEmail, patientName, doctorName, specialty, scheduledAt }) {
  const date = fmtDate(scheduledAt);
  await resend.emails.send({
    from: FROM,
    to: patientEmail,
    subject: `Consulta agendada com ${doctorName}`,
    html: `
      <h2>Olá, ${patientName}!</h2>
      <p>Sua consulta foi agendada com sucesso.</p>
      <ul>
        <li><strong>Médico:</strong> Dr(a). ${doctorName}${specialty ? ` — ${specialty}` : ''}</li>
        <li><strong>Data/Hora:</strong> ${date}</li>
      </ul>
      <p>Caso precise reagendar, entre em contato diretamente com a clínica.</p>
      <p style="color:#6b7280;font-size:12px;">Fast Atendimento — Secretária Virtual</p>
    `,
  });
}

async function sendStatusChangeEmail({ patientEmail, patientName, doctorName, status, scheduledAt }) {
  const date = fmtDate(scheduledAt);
  const labels = {
    confirmed:  { subject: 'Consulta confirmada', body: 'Sua consulta foi <strong>confirmada</strong> pelo médico.' },
    cancelled:  { subject: 'Consulta cancelada',  body: 'Sua consulta foi <strong>cancelada</strong>. Entre em contato para reagendar.' },
    completed:  { subject: 'Consulta concluída',  body: 'Sua consulta foi marcada como <strong>concluída</strong>. Obrigado pela visita!' },
  };
  const info = labels[status];
  if (!info) return;

  await resend.emails.send({
    from: FROM,
    to: patientEmail,
    subject: `${info.subject} — Dr(a). ${doctorName}`,
    html: `
      <h2>Olá, ${patientName}!</h2>
      <p>${info.body}</p>
      <ul>
        <li><strong>Médico:</strong> Dr(a). ${doctorName}</li>
        <li><strong>Data/Hora:</strong> ${date}</li>
      </ul>
      <p style="color:#6b7280;font-size:12px;">Fast Atendimento — Secretária Virtual</p>
    `,
  });
}

module.exports = { sendNewAppointmentEmail, sendAppointmentConfirmationToPatient, sendStatusChangeEmail };