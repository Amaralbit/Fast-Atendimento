import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';

function MetricCard({ label, value, color = 'text-gray-800', sub }) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function DoctorDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const to   = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

    Promise.all([
      api.get('/appointments/metrics'),
      api.get(`/appointments?from=${from}&to=${to}`),
    ]).then(([m, a]) => {
      setMetrics(m.data);
      const now = new Date();
      setUpcoming(
        a.data
          .filter(ap => new Date(ap.scheduledAt) >= now && ap.status !== 'cancelled')
          .slice(0, 5)
      );
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
        <p className="text-gray-500 mt-1">{format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Consultas hoje"           value={metrics?.today}            color="text-blue-600" />
            <MetricCard label="Total no mês"             value={metrics?.monthTotal}        color="text-gray-800" />
            <MetricCard label="Aguardando confirmação"   value={metrics?.pending}           color="text-yellow-500" />
            <MetricCard label="Taxa de confirmação"      value={`${metrics?.confirmationRate}%`} color="text-green-600" sub="confirmadas + concluídas" />
            <MetricCard label="Receita estimada"         value={`R$ ${metrics?.estimatedRevenue}`} color="text-purple-600" sub="média dos serviços × confirmadas" />
          </div>

          <Card>
            <h3 className="text-base font-semibold text-gray-800 mb-4">Próximas Consultas</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma consulta agendada.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {upcoming.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{appt.patient?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(appt.scheduledAt), "dd/MM/yyyy 'às' HH:mm")} · {appt.durationMinutes} min
                      </p>
                    </div>
                    <Badge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}