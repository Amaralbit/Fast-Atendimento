import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';

const STATUS_LABELS = {
  '':          'Todos',
  scheduled:   'Agendado',
  confirmed:   'Confirmado',
  cancelled:   'Cancelado',
  completed:   'Concluído',
};

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(endOfMonth(new Date()),   'yyyy-MM-dd'));
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { load(); }, [from, to, statusFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (statusFilter) params.set('status', statusFilter);
    if (search.trim()) params.set('search', search.trim());
    const r = await api.get(`/appointments?${params}`);
    setAppointments(r.data);
    setLoading(false);
  }

  async function changeStatus(id, status) {
    setUpdatingId(id);
    const r = await api.patch(`/appointments/${id}/status`, { status });
    setAppointments(a => a.map(x => x.id === id ? { ...x, status: r.data.status } : x));
    setUpdatingId(null);
  }

  const filtered = search.trim()
    ? appointments.filter(a => a.patient?.name?.toLowerCase().includes(search.toLowerCase()))
    : appointments;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Consultas</h2>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="text-gray-400 self-center">até</span>
        <input
          type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Buscar por paciente..."
          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <Button onClick={load} variant="secondary">Filtrar</Button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="text-center text-gray-400 py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">Nenhuma consulta encontrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data / Hora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(appt => (
                <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-800">{format(new Date(appt.scheduledAt), 'dd/MM/yyyy')}</p>
                    <p className="text-xs text-gray-500">{format(new Date(appt.scheduledAt), 'HH:mm')} · {appt.durationMinutes} min</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{appt.patient?.name}</p>
                    {appt.patient?.phone && <p className="text-xs text-gray-500">{appt.patient.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{appt.patient?.user?.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      appt.createdBy === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {appt.createdBy === 'ai' ? 'IA' : appt.createdBy}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Badge status={appt.status} /></td>
                  <td className="px-4 py-3">
                    {appt.status === 'scheduled' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="primary" disabled={updatingId === appt.id}
                          onClick={() => changeStatus(appt.id, 'confirmed')}>
                          Confirmar
                        </Button>
                        <Button size="sm" variant="danger" disabled={updatingId === appt.id}
                          onClick={() => changeStatus(appt.id, 'cancelled')}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                    {appt.status === 'confirmed' && (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" disabled={updatingId === appt.id}
                          onClick={() => changeStatus(appt.id, 'completed')}>
                          Concluir
                        </Button>
                        <Button size="sm" variant="danger" disabled={updatingId === appt.id}
                          onClick={() => changeStatus(appt.id, 'cancelled')}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3">{filtered.length} resultado(s)</p>
    </div>
  );
}