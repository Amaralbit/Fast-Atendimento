import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export default function ProtectedRoute({ children, role }) {
  const { user, fetchMe } = useAuthStore();
  const [checking, setChecking] = useState(!user);

  useEffect(() => {
    if (!user && localStorage.getItem('accessToken')) {
      fetchMe().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}