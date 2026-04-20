import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';

export default function DoctorInsurance() {
  const [plans, setPlans]   = useState([]);
  const [form, setForm]     = useState({ name: '', isActive: true });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/landing-page/insurance-plans').then(r => setPlans(r.data));
  }, []);

  function startEdit(p) {
    setEditId(p.id);
    setForm({ name: p.name, isActive: p.isActive });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ name: '', isActive: true });
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);

    if (editId) {
      const res = await api.put(`/landing-page/insurance-plans/${editId}`, form);
      setPlans(p => p.map(x => x.id === editId ? res.data : x));
      setEditId(null);
    } else {
      const res = await api.post('/landing-page/insurance-plans', form);
      setPlans(p => [...p, res.data]);
    }
    setForm({ name: '', isActive: true });
    setSaving(false);
  }

  async function remove(id) {
    await api.delete(`/landing-page/insurance-plans/${id}`);
    setPlans(p => p.filter(x => x.id !== id));
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Convênios</h2>

      <Card className="mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          {editId ? 'Editar convênio' : 'Adicionar convênio'}
        </h3>
        <div className="flex gap-3 items-center">
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Ex: Unimed, Bradesco Saúde, Amil..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Ativo
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Salvando...' : editId ? 'Salvar' : 'Adicionar'}
          </Button>
          {editId && <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Convênios cadastrados ({plans.length})
        </h3>
        {plans.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Nenhum convênio cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {plans.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-800">{p.name}</span>
                  {!p.isActive && <span className="text-xs text-gray-400">(inativo)</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)}>Remover</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}