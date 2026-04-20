import { useEffect, useRef, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

function Tag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 ml-0.5">✕</button>
    </span>
  );
}

export default function DoctorCMS() {
  const { user } = useAuthStore();
  const doctorId = user?.doctor?.id;

  const [hero, setHero]     = useState({ title: '', body: '' });
  const [about, setAbout]   = useState({ title: '', body: '' });
  const [media, setMedia]   = useState([]);
  const [services, setServices]   = useState([]);
  const [plans, setPlans]   = useState([]);

  const [mediaForm, setMediaForm]   = useState({ type: 'image', url: '', caption: '' });
  const [uploading, setUploading]   = useState(false);
  const imageInputRef = useRef(null);
  const [serviceForm, setServiceForm] = useState({ name: '', price: '', acceptsInsurance: false });
  const [planForm, setPlanForm]       = useState({ name: '' });

  const [saving, setSaving] = useState('');
  const [saved, setSaved]   = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/landing-page/sections'),
      api.get('/landing-page/media'),
      api.get('/landing-page/services'),
      api.get('/landing-page/insurance-plans'),
    ]).then(([s, m, sv, p]) => {
      const heroSec  = s.data.find(x => x.sectionKey === 'hero')  || {};
      const aboutSec = s.data.find(x => x.sectionKey === 'about') || {};
      setHero({ title: heroSec.title || '', body: heroSec.body || '' });
      setAbout({ title: aboutSec.title || '', body: aboutSec.body || '' });
      setMedia(m.data);
      setServices(sv.data);
      setPlans(p.data);
    });
  }, []);

  function flash(key) { setSaved(key); setTimeout(() => setSaved(''), 2000); }

  async function saveSection(key, data) {
    setSaving(key);
    await api.put(`/landing-page/sections/${key}`, data);
    setSaving(''); flash(key);
  }

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await api.post('/upload/presign', {
        filename: file.name, contentType: file.type, size: file.size,
      });
      await fetch(data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setMediaForm(f => ({ ...f, url: data.publicUrl }));
    } catch {
      alert('Erro no upload da imagem.');
    } finally {
      setUploading(false);
    }
  }

  async function addMedia() {
    if (!mediaForm.url) return;
    const res = await api.post('/landing-page/media', mediaForm);
    setMedia(m => [...m, res.data]);
    setMediaForm({ type: 'image', url: '', caption: '' });
  }

  async function removeMedia(id) {
    await api.delete(`/landing-page/media/${id}`);
    setMedia(m => m.filter(x => x.id !== id));
  }

  async function addService() {
    if (!serviceForm.name) return;
    const res = await api.post('/landing-page/services', {
      ...serviceForm,
      price: serviceForm.price ? parseFloat(serviceForm.price) : null,
    });
    setServices(s => [...s, res.data]);
    setServiceForm({ name: '', price: '', acceptsInsurance: false });
  }

  async function removeService(id) {
    await api.delete(`/landing-page/services/${id}`);
    setServices(s => s.filter(x => x.id !== id));
  }

  async function addPlan() {
    if (!planForm.name) return;
    const res = await api.post('/landing-page/insurance-plans', planForm);
    setPlans(p => [...p, res.data]);
    setPlanForm({ name: '' });
  }

  async function removePlan(id) {
    await api.delete(`/landing-page/insurance-plans/${id}`);
    setPlans(p => p.filter(x => x.id !== id));
  }

  const pageUrl = `${window.location.origin}/p/${doctorId}`;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Publicação</h2>
          <p className="text-gray-500 text-sm mt-1">Edite o conteúdo da sua página pública</p>
        </div>
        <a href={pageUrl} target="_blank" rel="noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
          Ver página ↗
        </a>
      </div>

      {/* Seção Hero */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Cabeçalho (Hero)</h3>
        <div className="space-y-4">
          <Input label="Título principal" placeholder="Ex: Dr. João Silva — Cardiologista" value={hero.title}
            onChange={e => setHero(h => ({ ...h, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Subtítulo / chamada</label>
            <textarea rows={3} value={hero.body} placeholder="Uma breve apresentação sua..."
              onChange={e => setHero(h => ({ ...h, body: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => saveSection('hero', hero)} disabled={saving === 'hero'}>
            {saving === 'hero' ? 'Salvando...' : 'Salvar hero'}
          </Button>
          {saved === 'hero' && <span className="text-sm text-green-600">✓ Salvo!</span>}
        </div>
      </Card>

      {/* Seção Sobre */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Sobre mim</h3>
        <div className="space-y-4">
          <Input label="Título" placeholder="Sobre o Dr. João" value={about.title}
            onChange={e => setAbout(a => ({ ...a, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Texto</label>
            <textarea rows={5} value={about.body} placeholder="Conte sua história, formação, diferenciais..."
              onChange={e => setAbout(a => ({ ...a, body: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => saveSection('about', about)} disabled={saving === 'about'}>
            {saving === 'about' ? 'Salvando...' : 'Salvar sobre'}
          </Button>
          {saved === 'about' && <span className="text-sm text-green-600">✓ Salvo!</span>}
        </div>
      </Card>

      {/* Mídia */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Fotos e Vídeos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {media.map(m => (
            <div key={m.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
              {m.type === 'image'
                ? <img src={m.url} alt={m.caption} className="w-full h-full object-cover" />
                : <div className="flex items-center justify-center h-full text-3xl">▶️</div>
              }
              {m.caption && <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">{m.caption}</p>}
              <button onClick={() => removeMedia(m.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs hidden group-hover:flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <select value={mediaForm.type} onChange={e => setMediaForm(f => ({ ...f, type: e.target.value, url: '' }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="image">Imagem</option>
              <option value="video">Vídeo (YouTube)</option>
            </select>
            {mediaForm.type === 'image' ? (
              <div className="flex-1 flex gap-2 items-center">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageFile}
                />
                <Button variant="secondary" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Enviando...' : 'Escolher arquivo'}
                </Button>
                {mediaForm.url && <span className="text-xs text-green-600 truncate max-w-xs">Imagem carregada</span>}
              </div>
            ) : (
              <input value={mediaForm.url} onChange={e => setMediaForm(f => ({ ...f, url: e.target.value }))}
                placeholder="URL do YouTube"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            )}
          </div>
          <div className="flex gap-3">
            <input value={mediaForm.caption} onChange={e => setMediaForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Legenda (opcional)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <Button onClick={addMedia} disabled={!mediaForm.url || uploading}>Adicionar</Button>
          </div>
        </div>
      </Card>

      {/* Serviços */}
      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Serviços e Preços</h3>
        <div className="space-y-2 mb-4">
          {services.map(sv => (
            <div key={sv.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className="text-sm font-medium text-gray-800">{sv.name}</span>
                {sv.price && <span className="text-sm text-gray-500 ml-2">R$ {Number(sv.price).toFixed(2)}</span>}
                {sv.acceptsInsurance && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Convênio</span>}
              </div>
              <button onClick={() => removeService(sv.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome do serviço" className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <input value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
            placeholder="Preço (R$)" type="number" className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={serviceForm.acceptsInsurance} onChange={e => setServiceForm(f => ({ ...f, acceptsInsurance: e.target.checked }))} />
            Convênio
          </label>
          <Button onClick={addService} disabled={!serviceForm.name}>Adicionar</Button>
        </div>
      </Card>

      {/* Convênios */}
      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Convênios Aceitos</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {plans.map(p => <Tag key={p.id} label={p.name} onRemove={() => removePlan(p.id)} />)}
        </div>
        <div className="flex gap-2">
          <input value={planForm.name} onChange={e => setPlanForm({ name: e.target.value })}
            placeholder="Ex: Unimed, Bradesco Saúde..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={e => e.key === 'Enter' && addPlan()} />
          <Button onClick={addPlan} disabled={!planForm.name}>Adicionar</Button>
        </div>
      </Card>
    </div>
  );
}