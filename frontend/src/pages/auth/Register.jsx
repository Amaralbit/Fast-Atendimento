import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', specialty: '', crm: '' });
  const [error, setError] = useState('');
  const { registerDoctorAction, loading } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await registerDoctorAction(form);
      navigate('/doctor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Erro ao criar conta.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">Fast Atendimento</h1>
          <p className="text-gray-500 mt-2 text-sm">Criar conta de médico</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome completo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Senha (mín. 8 caracteres)" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Especialidade" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
            <Input label="CRM" value={form.crm} onChange={(e) => setForm((f) => ({ ...f, crm: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}