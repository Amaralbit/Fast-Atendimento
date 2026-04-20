const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../../config/database');
const { getAvailableSlots } = require('./chat.availability');
const { sendNewAppointmentEmail, sendAppointmentConfirmationToPatient } = require('../../config/mailer');
const { format, parseISO, addMinutes } = require('date-fns');
const bcrypt = require('bcryptjs');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Tools disponíveis para a IA ───────────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_available_slots',
    description: 'Consulta os horários disponíveis do médico em uma data específica. Use quando o paciente perguntar sobre disponibilidade ou quiser agendar.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Data no formato YYYY-MM-DD. Ex: 2025-08-15' },
      },
      required: ['date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Agenda uma consulta para o paciente. Use somente depois de confirmar nome, e-mail, data e horário com o paciente.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name:  { type: 'string',  description: 'Nome completo do paciente' },
        patient_email: { type: 'string',  description: 'E-mail do paciente' },
        patient_phone: { type: 'string',  description: 'Telefone/WhatsApp do paciente (opcional)' },
        date:          { type: 'string',  description: 'Data no formato YYYY-MM-DD' },
        time:          { type: 'string',  description: 'Horário no formato HH:MM. Ex: 09:00' },
        notes:         { type: 'string',  description: 'Observações adicionais (opcional)' },
      },
      required: ['patient_name', 'patient_email', 'date', 'time'],
    },
  },
];

// ── Executa a tool chamada pela IA ────────────────────────────────────────────

async function executeTool(toolName, toolInput, doctorId) {
  if (toolName === 'get_available_slots') {
    const slots = await getAvailableSlots(doctorId, toolInput.date);
    if (slots.length === 0) {
      return { available: false, message: 'Sem horários disponíveis nesta data.' };
    }
    return { available: true, date: toolInput.date, slots };
  }

  if (toolName === 'book_appointment') {
    const { patient_name, patient_email, patient_phone, date, time, notes } = toolInput;

    // Verifica limite do plano
    const settings = await prisma.doctorSettings.findUnique({ where: { doctorId } });
    if (!settings || settings.plan === 'free') {
      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const count = await prisma.appointment.count({
        where: { doctorId, scheduledAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
      });
      if (count >= 50) {
        return { success: false, message: 'A agenda está temporariamente indisponível. Por favor, entre em contato diretamente com a clínica.' };
      }
    }

    // Verifica se o slot ainda está livre
    const slots = await getAvailableSlots(doctorId, date);
    if (!slots.includes(time)) {
      return { success: false, message: 'Este horário não está mais disponível. Por favor, escolha outro.' };
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { email: true } }, settings: true },
    });

    // Encontra ou cria o paciente
    let patientUser = await prisma.user.findUnique({ where: { email: patient_email }, include: { patient: true } });

    if (!patientUser) {
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);
      patientUser = await prisma.user.create({
        data: {
          email: patient_email,
          passwordHash: tempPassword,
          role: 'patient',
          patient: { create: { name: patient_name, phone: patient_phone || null } },
        },
        include: { patient: true },
      });
    }

    const scheduledAt = new Date(`${date}T${time}:00`);

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: patientUser.patient.id,
        scheduledAt,
        durationMinutes: doctor.avgConsultationMinutes,
        status: 'scheduled',
        createdBy: 'ai',
        notes: notes || null,
      },
    });

    // Bloqueia o horário automaticamente
    await prisma.doctorBlockedSlot.create({
      data: {
        doctorId,
        date: new Date(date),
        startTime: time,
        endTime: format(addMinutes(new Date(`${date}T${time}:00`), doctor.avgConsultationMinutes), 'HH:mm'),
        reason: 'appointment',
      },
    });

    // Notifica médico e paciente por e-mail (fire-and-forget)
    sendNewAppointmentEmail({
      doctorEmail: doctor.user.email,
      doctorName:  doctor.name,
      patientName: patient_name,
      scheduledAt,
    }).catch(() => {});

    sendAppointmentConfirmationToPatient({
      patientEmail: patient_email,
      patientName:  patient_name,
      doctorName:   doctor.name,
      specialty:    doctor.specialty,
      scheduledAt,
    }).catch(() => {});

    return {
      success: true,
      appointmentId: appointment.id,
      message: `Consulta agendada com sucesso para ${format(parseISO(date), 'dd/MM/yyyy')} às ${time}.`,
    };
  }

  return { error: 'Tool desconhecida.' };
}

// ── Prompt do sistema baseado no contexto do médico ───────────────────────────

async function buildSystemPrompt(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      services:       { where: { isActive: true } },
      insurancePlans: { where: { isActive: true } },
      availability:   { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
    },
  });

  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const availText = doctor.availability
    .map(a => `${DAYS[a.dayOfWeek]}: ${a.startTime} às ${a.endTime}`)
    .join(', ') || 'Não informado';

  const servicesText = doctor.services.length
    ? doctor.services.map(s => `- ${s.name}${s.price ? ` (R$ ${Number(s.price).toFixed(2)})` : ''}${s.acceptsInsurance ? ' — aceita convênio' : ''}`).join('\n')
    : 'Não informado';

  const plansText = doctor.insurancePlans.length
    ? doctor.insurancePlans.map(p => p.name).join(', ')
    : 'Não aceita convênios';

  const today = format(new Date(), 'yyyy-MM-dd');
  const whatsapp = doctor.whatsappNumber
    ? `https://wa.me/55${doctor.whatsappNumber.replace(/\D/g, '')}`
    : null;

  return `Você é a secretária virtual do(a) ${doctor.name}, ${doctor.specialty || 'médico(a)'}.
Seu papel é atender pacientes de forma cordial, responder dúvidas e realizar agendamentos de consultas.

## Informações do médico
- Nome: ${doctor.name}
- Especialidade: ${doctor.specialty || 'Não informada'}
- CRM: ${doctor.crm || 'Não informado'}
- Tempo de consulta: ${doctor.avgConsultationMinutes} minutos

## Horários de atendimento
${availText}

## Serviços e preços
${servicesText}

## Convênios aceitos
${plansText}

## Regras importantes
- Data de hoje: ${today}
- Sempre confirme nome completo e e-mail antes de agendar.
- Use a tool get_available_slots para verificar disponibilidade antes de sugerir horários.
- Use a tool book_appointment somente após confirmar todos os dados com o paciente.
- Seja breve e amigável. Responda em português brasileiro.
- Se o paciente quiser falar diretamente com o médico, informe: "${whatsapp ? `ele(a) pode ser contactado pelo WhatsApp: ${whatsapp}` : 'entre em contato pela recepção'}"
- Nunca invente horários — use sempre a tool para consultar disponibilidade real.`;
}

// ── Função principal: processa mensagem e retorna resposta da IA ──────────────

async function processMessage(doctorId, conversationHistory) {
  const systemPrompt = await buildSystemPrompt(doctorId);

  // Loop de agentic: IA pode chamar tools múltiplas vezes antes de responder
  let messages = [...conversationHistory];

  while (true) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(c => c.type === 'text')?.text || '';
      return text;
    }

    if (response.stop_reason === 'tool_use') {
      // Adiciona resposta da IA com chamadas de tool ao histórico
      messages.push({ role: 'assistant', content: response.content });

      // Executa todas as tools e coleta resultados
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        const result = await executeTool(block.name, block.input, doctorId);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  return 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
}

module.exports = { processMessage };