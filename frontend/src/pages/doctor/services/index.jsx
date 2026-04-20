import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';

const EMPTY = { name: '', price: '', acceptsInsurance: false, isActive: true };

function ServiceRow({ sv, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sv.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
        <div>
          <p className="text-sm font-medium text-gray-800">{sv.name}</p>
          <div className="flex gap-2 mt-0.5">
            {sv.price && <span className="text-xs text-gray-500">R$ {Number(sv.price).toFixed(2)}</span>}
            {sv.acceptsInsurance && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Convênio</span>}
            {!sv.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inativo</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(sv)}>Editar</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(sv.id)}>Remover</Button>
      </div>
    </div>
  );
}

export default function DoctorServices() {
  const [services, setServices] = useState([]);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/landing-page/services').then(r => setServices(r.data));
  }, []);

  function startEdit(sv) {
    setEditId(sv.id);
    setForm({ name: sv.name, price: sv.price ?? '', acceptsInsurance: sv.acceptsInsurance, isActive: sv.isActive });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(EMPTY);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, price: form.price !== '' ? parseFloat(form.price) : null };

    if (editId) {
      const res = await api.put(`/landing-page/services/${editId}`, payload);
      setServices(s => s.map(x => x.id === editId ? res.data : x));
      setEditId(null);
    } else {
      const res = await api.post('/landing-page/services', payload);
      setServices(s => [...s, res.data]);
    }
    setForm(EMPTY);
    setSaving(false);
  }

  async function remove(id) {
    await api.delete(`/landing-page/services/${id}`);
    setServices(s => s.filter(x => x.id !== id));
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Serviços</h2>

      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          {editId ? 'Editar serviço' : 'Novo serviço'}
        </h3>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nome do serviço"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-3">
            <input
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="Preço (R$)"
              type="number"
              className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.acceptsInsurance}
                onChange={e => setForm(f => ({ ...f, acceptsInsurance: e.target.checked }))} />
              Aceita convênio
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              Ativo
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Adicionar'}
          </Button>
          {editId && <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Serviços cadastrados ({services.length})</h3>
        {services.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Nenhum serviço cadastrado ainda.</p>
        ) : (
          services.map(sv => (
            <ServiceRow key={sv.id} sv={sv} onEdit={startEdit} onDelete={remove} />
          ))
        )}
      </Card>
    </div>
  );
}