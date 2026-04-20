import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../../../services/api';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), getDay, locales: { 'pt-BR': ptBR } });

const STATUS_COLORS = {
  scheduled: '#3B82F6',
  confirmed: '#22C55E',
  cancelled: '#EF4444',
  completed: '#6B7280',
  blocked: '#F59E0B',
};

export default function DoctorCalendar() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({ date: '', startTime: '', endTime: '', fullDay: false });
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (date) => {
    const from = startOfMonth(date).toISOString();
    const to = endOfMonth(date).toISOString();

    const [apptRes, blockRes] = await Promise.all([
      api.get(`/appointments?from=${from}&to=${to}`),
      api.get(`/doctors/me/blocked-slots?from=${from}&to=${to}`),
    ]);

    const apptEvents = apptRes.data.map((a) => ({
      id: a.id,
      title: `🩺 ${a.patient?.name || 'Paciente'}`,
      start: new Date(a.scheduledAt),
      end: new Date(new Date(a.scheduledAt).getTime() + a.durationMinutes * 60000),
      resource: { type: 'appointment', data: a },
    }));

    const blockEvents = blockRes.data.map((b) => {
      const dateStr = b.date.split('T')[0]; // "2025-04-23" sem conversão de fuso
      const start = b.startTime
        ? new Date(`${dateStr}T${b.startTime}`)
        : new Date(`${dateStr}T00:00:00`);
      const end = b.endTime
        ? new Date(`${dateStr}T${b.endTime}`)
        : new Date(`${dateStr}T23:59:00`);

      return {
        id: b.id,
        title: b.startTime ? `🔒 Bloqueado ${b.startTime}–${b.endTime}` : '🔒 Dia inteiro bloqueado',
        start,
        end,
        resource: { type: 'blocked', data: b },
      };
    });

    setEvents([...apptEvents, ...blockEvents]);
  }, []);

  useEffect(() => { fetchEvents(currentDate); }, [currentDate, fetchEvents]);

  async function handleBlock() {
    setLoading(true);
    try {
      await api.post('/doctors/me/blocked-slots', {
        date: blockForm.date,
        startTime: blockForm.fullDay ? null : blockForm.startTime || null,
        endTime: blockForm.fullDay ? null : blockForm.endTime || null,
      });
      setShowBlockModal(false);
      setBlockForm({ date: '', startTime: '', endTime: '', fullDay: false });
      fetchEvents(currentDate);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBlock(id) {
    if (!confirm('Remover este bloqueio?')) return;
    await api.delete(`/doctors/me/blocked-slots/${id}`);
    setSelectedEvent(null);
    fetchEvents(currentDate);
  }

  async function handleStatusChange(id, status) {
    await api.patch(`/appointments/${id}/status`, { status });
    setSelectedEvent(null);
    fetchEvents(currentDate);
  }

  function eventStyleGetter(event) {
    const type = event.resource?.type;
    const status = event.resource?.data?.status;
    const color = type === 'blocked' ? STATUS_COLORS.blocked : (STATUS_COLORS[status] || STATUS_COLORS.scheduled);
    return { style: { backgroundColor: color, borderRadius: '6px', border: 'none', color: '#fff', fontSize: '12px' } };
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendário</h2>
          <p className="text-gray-500 text-sm mt-1">Gerencie consultas e bloqueie horários</p>
        </div>
        <Button onClick={() => setShowBlockModal(true)}>+ Bloquear horário</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4" style={{ height: 620 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="pt-BR"
            onNavigate={setCurrentDate}
            onSelectEvent={setSelectedEvent}
            eventPropGetter={eventStyleGetter}
            messages={{
              next: 'Próximo', previous: 'Anterior', today: 'Hoje',
              month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda',
              noEventsInRange: 'Sem eventos neste período.',
            }}
          />
        </div>
      </Card>

      {/* Modal de detalhes do evento */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedEvent.title}</h3>

            {selectedEvent.resource?.type === 'appointment' && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paciente</span>
                  <span className="font-medium">{selectedEvent.resource.data.patient?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Horário</span>
                  <span className="font-medium">{format(selectedEvent.start, 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duração</span>
                  <span className="font-medium">{selectedEvent.resource.data.durationMinutes} min</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Status</span>
                  <Badge status={selectedEvent.resource.data.status} />
                </div>
                <div className="flex gap-2 pt-2">
                  {selectedEvent.resource.data.status === 'scheduled' && (
                    <Button size="sm" onClick={() => handleStatusChange(selectedEvent.id, 'confirmed')}>
                      Confirmar
                    </Button>
                  )}
                  {selectedEvent.resource.data.status !== 'cancelled' && selectedEvent.resource.data.status !== 'completed' && (
                    <Button size="sm" variant="danger" onClick={() => handleStatusChange(selectedEvent.id, 'cancelled')}>
                      Cancelar
                    </Button>
                  )}
                  {selectedEvent.resource.data.status === 'confirmed' && (
                    <Button size="sm" variant="secondary" onClick={() => handleStatusChange(selectedEvent.id, 'completed')}>
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            )}

            {selectedEvent.resource?.type === 'blocked' && selectedEvent.resource.data.reason === 'manual' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Data: {format(selectedEvent.start, 'dd/MM/yyyy')}</p>
                <Button size="sm" variant="danger" onClick={() => handleDeleteBlock(selectedEvent.id)}>
                  Remover bloqueio
                </Button>
              </div>
            )}

            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" onClick={() => setSelectedEvent(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Modal de novo bloqueio */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBlockModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Bloquear horário</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Data</label>
                <input type="date" value={blockForm.date}
                  onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={blockForm.fullDay}
                  onChange={(e) => setBlockForm((f) => ({ ...f, fullDay: e.target.checked }))} />
                Bloquear dia inteiro
              </label>
              {!blockForm.fullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">De</label>
                    <input type="time" value={blockForm.startTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Até</label>
                    <input type="time" value={blockForm.endTime}
                      onChange={(e) => setBlockForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleBlock} disabled={!blockForm.date || loading}>
                {loading ? 'Salvando...' : 'Bloquear'}
              </Button>
              <Button variant="secondary" onClick={() => setShowBlockModal(false)}>Cancelar</Button>
            </div>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl" onClick={() => setShowBlockModal(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}