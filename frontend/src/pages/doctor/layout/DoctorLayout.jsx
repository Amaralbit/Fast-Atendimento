import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/auth.store';
import OnboardingWizard from '../../../components/OnboardingWizard';
import api from '../../../services/api';

const navItems = [
  { to: '/doctor/dashboard',     icon: '📊', label: 'Visão Geral' },
  { to: '/doctor/appointments',  icon: '🗓', label: 'Consultas' },
  { to: '/doctor/calendar',      icon: '📅', label: 'Calendário' },
  { to: '/doctor/services',      icon: '💊', label: 'Serviços' },
  { to: '/doctor/insurance',     icon: '🏥', label: 'Convênios' },
  { to: '/doctor/cms',           icon: '✏️', label: 'Publicação' },
  { to: '/doctor/settings',      icon: '⚙️', label: 'Configurações' },
];

export default function DoctorLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    api.get('/doctors/me').then(r => {
      if (!r.data.name || r.data.name.trim() === '') setShowOnboarding(true);
      setPlan(r.data.settings?.plan || 'free');
    });
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {showOnboarding && (
        <OnboardingWizard onComplete={() => {
          setShowOnboarding(false);
          window.location.reload();
        }} />
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-blue-600">Fast Atendimento</h1>
          <p className="text-xs text-gray-500 mt-1 truncate">{user?.doctor?.name || user?.email}</p>
          <span className={`mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
            plan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {plan === 'pro' ? '⭐ Pro' : 'Gratuito'}
          </span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          {plan === 'free' && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-2 text-center">
              <p className="text-xs font-medium text-gray-700">Plano Gratuito</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Até 50 consultas/mês</p>
              <button className="mt-2 w-full text-xs bg-blue-600 text-white rounded-lg py-1.5 font-medium hover:bg-blue-700 transition">
                Upgrade para Pro
              </button>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}