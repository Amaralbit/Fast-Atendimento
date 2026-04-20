import { useEffect, useRef, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_AVAILABILITY = DAYS.map((_, i) => ({
  dayOfWeek: i, startTime: '08:00', endTime: '18:00', isActive: i >= 1 && i <= 5,
}));

export default function DoctorSettings() {
  const [profile, setProfile] = useState({ name: '', specialty: '', crm: '', whatsappNumber: '', avgConsultationMinutes: 30, profilePhotoUrl: '' });
  const [settings, setSettings] = useState({ primaryColor: '#3B82F6', secondaryColor: '#06B6D4', themeMode: 'light' });
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [saving, setSaving] = useState({ profile: false, settings: false, availability: false });
  const [saved, setSaved] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/doctors/me').then((r) => {
      const d = r.data;
      setProfile({
        name: d.name || '', specialty: d.specialty || '', crm: d.crm || '',
        whatsappNumber: d.whatsappNumber || '', avgConsultationMinutes: d.avgConsultationMinutes || 30,
        profilePhotoUrl: d.profilePhotoUrl || '',
      });
      if (d.profilePhotoUrl) setPhotoPreview(d.profilePhotoUrl);
      if (d.settings) setSettings(d.settings);
      if (d.availability?.length) {
        setAvailability(
          DEFAULT_AVAILABILITY.map((def) => d.availability.find((a) => a.dayOfWeek === def.dayOfWeek) || def)
        );
      }
    });
  }, []);

  function flash(key) {
    setSaved(key);
    setTimeout(() => setSaved(''), 2000);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));
    setUploadProgress('Enviando...');

    try {
      const { data } = await api.post('/upload/presign', {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setProfile((p) => ({ ...p, profilePhotoUrl: data.publicUrl }));
      setUploadProgress('Foto carregada! Clique em "Salvar perfil".');
    } catch {
      setUploadProgress('Erro no upload. Tente novamente.');
    }
  }

  async function saveProfile() {
    setSaving((s) => ({ ...s, profile: true }));
    await api.put('/doctors/me', profile);
    setSaving((s) => ({ ...s, profile: false }));
    setUploadProgress(null);
    flash('profile');
  }

  async function saveSettings() {
    setSaving((s) => ({ ...s, settings: true }));
    await api.put('/doctors/me/settings', settings);
    setSaving((s) => ({ ...s, settings: false }));
    flash('settings');
  }

  async function saveAvailability() {
    setSaving((s) => ({ ...s, availability: true }));
    await api.put('/doctors/me/availability', { slots: availability });
    setSaving((s) => ({ ...s, availability: false }));
    flash('availability');
  }

  function updateAvailability(dayOfWeek, field, value) {
    setAvailability((prev) => prev.map((a) => a.dayOfWeek === dayOfWeek ? { ...a, [field]: value } : a));
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h2>

      {/* Foto de perfil */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Foto de Perfil</h3>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            {photoPreview ? (
              <img src={photoPreview} alt="Foto de perfil"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-3xl text-gray-400">
                👤
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Escolher foto
            </Button>
            <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG ou WebP · Máx. 5MB</p>
            {uploadProgress && (
              <p className={`text-xs mt-1 ${uploadProgress.startsWith('Erro') ? 'text-red-500' : 'text-blue-600'}`}>
                {uploadProgress}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Perfil */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Perfil</h3>
        <div className="space-y-4">
          <Input label="Nome completo" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Especialidade" value={profile.specialty} onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))} />
            <Input label="CRM" value={profile.crm} onChange={(e) => setProfile((p) => ({ ...p, crm: e.target.value }))} />
          </div>
          <Input label="WhatsApp (com DDD)" placeholder="11999999999" value={profile.whatsappNumber} onChange={(e) => setProfile((p) => ({ ...p, whatsappNumber: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tempo médio de consulta</label>
            <select
              value={profile.avgConsultationMinutes}
              onChange={(e) => setProfile((p) => ({ ...p, avgConsultationMinutes: Number(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutos</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={saveProfile} disabled={saving.profile}>
            {saving.profile ? 'Salvando...' : 'Salvar perfil'}
          </Button>
          {saved === 'profile' && <span className="text-sm text-green-600">✓ Salvo!</span>}
        </div>
      </Card>

      {/* Horários de atendimento */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Horários de Atendimento</h3>
        <div className="space-y-3">
          {availability.map((slot) => (
            <div key={slot.dayOfWeek} className="flex items-center gap-4">
              <label className="flex items-center gap-2 w-20 cursor-pointer">
                <input type="checkbox" checked={slot.isActive} onChange={(e) => updateAvailability(slot.dayOfWeek, 'isActive', e.target.checked)} />
                <span className={`text-sm font-medium ${slot.isActive ? 'text-gray-800' : 'text-gray-400'}`}>{DAYS[slot.dayOfWeek]}</span>
              </label>
              {slot.isActive && (
                <>
                  <input type="time" value={slot.startTime} onChange={(e) => updateAvailability(slot.dayOfWeek, 'startTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <span className="text-gray-400 text-sm">até</span>
                  <input type="time" value={slot.endTime} onChange={(e) => updateAvailability(slot.dayOfWeek, 'endTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={saveAvailability} disabled={saving.availability}>
            {saving.availability ? 'Salvando...' : 'Salvar horários'}
          </Button>
          {saved === 'availability' && <span className="text-sm text-green-600">✓ Salvo!</span>}
        </div>
      </Card>

      {/* Tematização */}
      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Cores do Site</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-40">Cor primária</label>
            <input type="color" value={settings.primaryColor}
              onChange={(e) => setSettings((s) => ({ ...s, primaryColor: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
            <span className="text-sm text-gray-500">{settings.primaryColor}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 w-40">Cor secundária</label>
            <input type="color" value={settings.secondaryColor}
              onChange={(e) => setSettings((s) => ({ ...s, secondaryColor: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
            <span className="text-sm text-gray-500">{settings.secondaryColor}</span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tema padrão</label>
            <div className="flex gap-3">
              {['light', 'dark'].map((mode) => (
                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="themeMode" value={mode} checked={settings.themeMode === mode}
                    onChange={() => setSettings((s) => ({ ...s, themeMode: mode }))} />
                  <span className="text-sm text-gray-700 capitalize">{mode === 'light' ? '☀️ Claro' : '🌙 Escuro'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button onClick={saveSettings} disabled={saving.settings}>
            {saving.settings ? 'Salvando...' : 'Salvar cores'}
          </Button>
          {saved === 'settings' && <span className="text-sm text-green-600">✓ Salvo!</span>}
        </div>
      </Card>
    </div>
  );
}