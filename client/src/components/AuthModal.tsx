import React, { useState } from 'react';
import api from '../services/api';

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('victoria@balance.app');
  const [password, setPassword] = useState('Victoria2026*');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name };
      const { data } = await api.post(endpoint, payload);

      localStorage.setItem('vb_token', data.token);
      localStorage.setItem('vb_user', JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas o error en el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8FC] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 sm:p-10">
        {/* Cabecera con Logo Balanza Oficial */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#2E1065] flex items-center justify-center shadow-md shadow-purple-950/20 mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#E9D5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v17M6 20h12" />
              <path d="M5 7l7-2 7 2" />
              <path d="M5 7L2 14h6L5 7z" stroke="#065F46" fill="#065F46" fillOpacity="0.2" />
              <path d="M19 7l-3 7h6l-3-7z" stroke="#D97706" fill="#D97706" fillOpacity="0.2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#2E1065] tracking-tight">Victoria Balance</h2>
          <p className="text-xs text-slate-500 mt-1">Gestión Financiera Diaria & Personal</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] focus:ring-1 focus:ring-[#2E1065] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] focus:ring-1 focus:ring-[#2E1065] transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Contraseña</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] focus:ring-1 focus:ring-[#2E1065] transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#2E1065] hover:bg-[#1E0847] active:scale-[0.99] transition shadow-md shadow-purple-950/15 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : isLogin ? 'Ingresar a Victoria' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-[#2E1065] hover:underline"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
