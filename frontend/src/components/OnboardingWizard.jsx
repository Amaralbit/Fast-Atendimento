import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import api from '../services/api';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_AVAIL = DAYS.map((_, i) => ({
  dayOfWeek: i, startTime: '08:00', endTime: '18:00', isActive: i >= 1 && i <= 5,
}));

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: '', specialty: '', crm: '', whatsappNumber: '' });
  const [availability, setAvailability] = useState(DEFAULT_AVAIL);
  const [saving, setSaving] = useState(false);

  function updateAvail(dayOfWeek, field, value) {
    setAvailability(a => a.map(s => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s));
  }

  async function saveStep1() {
    if (!profile.name.trim()) return;
    setSaving(true);
    await api.put('/doctors/me', profile);
    setSaving(false);
    setStep(2);
  }

  async function saveStep2() {
    setSaving(true);
    await api.put('/doctors/me/availability', { slots: availability });
    setSaving(false);
    setStep(3);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(n => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 && 'Bem-vindo ao Fast Atendimento!'}
            {step === 2 && 'Seus horários de atendimento'}
            {step === 3 && 'Tudo pronto!'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && 'Vamos configurar seu perfil em 3 passos rápidos.'}
            {step === 2 && 'Defina os dias e horários em que você atende.'}
            {step === 3 && 'Sua secretária virtual já está funcionando.'}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="px-8 pb-4">
          {step === 1 && (
            <div className="space-y-4">
              <Input label="Seu nome completo *" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Especialidade" value={profile.specialty}
                  onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))} />
                <Input label="CRM" value={profile.crm}
                  onChange={e => setProfile(p => ({ ...p, crm: e.target.value }))} />
              </div>
              <Input label="WhatsApp (com DDD)" placeholder="11999999999" value={profile.whatsappNumber}
                onChange={e => setProfile(p => ({ ...p, whatsappNumber: e.target.value }))} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {availability.map(slot => (
                <div key={slot.dayOfWeek} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-16 cursor-pointer">
                    <input type="checkbox" checked={slot.isActive}
                      onChange={e => updateAvail(slot.dayOfWeek, 'isActive', e.target.checked)} />
                    <span className={`text-sm font-medium ${slot.isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                      {DAYS[slot.dayOfWeek]}
                    </span>
                  </label>
                  {slot.isActive && (
                    <>
                      <input type="time" value={slot.startTime}
                        onChange={e => updateAvail(slot.dayOfWeek, 'startTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <span className="text-gray-400 text-sm">às</span>
                      <input type="time" value={slot.endTime}
                        onChange={e => updateAvail(slot.dayOfWeek, 'endTime', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-gray-600">
                Sua landing page pública já está acessível. Compartilhe o link com seus pacientes e a IA começará a agendar automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex justify-between items-center">
          {step > 1 && step < 3
            ? <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
            : <div />
          }
          {step === 1 && (
            <Button onClick={saveStep1} disabled={saving || !profile.name.trim()}>
              {saving ? 'Salvando...' : 'Continuar →'}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={saveStep2} disabled={saving}>
              {saving ? 'Salvando...' : 'Continuar →'}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={onComplete}>Acessar o painel</Button>
          )}
        </div>
      </div>
    </div>
  );
}