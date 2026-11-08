import React, { useState } from 'react';
import api from '../services/api';

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { email, password, name, phone };
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

  const handleUseDemo = () => {
    setEmail('victoria@balance.app');
    setPassword('Victoria2026*');
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8FC] dark:bg-[#0F0A1A] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#181126] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-[#2D1F47] p-8 sm:p-10">
        {/* Cabecera con Logo Balanza Oficial */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#2E1065] dark:bg-[#C084FC] flex items-center justify-center shadow-md shadow-purple-950/20 mb-3">
            <svg className="w-6 h-6 text-[#E9D5FF] dark:text-[#2E1065]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v17M6 20h12" />
              <path d="M5 7l7-2 7 2" />
              <path d="M5 7L2 14h6L5 7z" stroke="#065F46" fill="#065F46" fillOpacity="0.2" />
              <path d="M19 7l-3 7h6l-3-7z" stroke="#D97706" fill="#D97706" fillOpacity="0.2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#2E1065] dark:text-[#E9D5FF] tracking-tight">Victoria Balance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isLogin ? 'Accede a tu cuenta personal' : 'Prueba 7 días gratis sin tarjeta'}
          </p>
        </div>

        {!isLogin && (
          <div className="mb-4 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-[#E9D5FF] dark:border-[#382658] text-[11px] text-[#2E1065] dark:text-[#E9D5FF] font-medium text-center">
            🎁 Disfruta de <strong>7 días de prueba completa</strong> sin compromiso.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC] transition"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC] transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#2E1065] hover:bg-[#1E0847] active:scale-[0.99] transition shadow-md shadow-purple-950/15 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : isLogin ? 'Ingresar a Victoria' : 'Crear Cuenta y Probar Gratis'}
            </button>
          </div>
        </form>

        {/* Acceso Demo discreto */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-[11px] text-slate-400 hover:text-[#2E1065] dark:hover:text-[#C084FC] transition underline"
          >
            Probar con cuenta de demostración
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2D1F47] text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs font-semibold text-[#2E1065] dark:text-[#C084FC] hover:underline"
          >
            {isLogin ? '¿Nuevo aquí? Regístrate y obtén 7 días gratis' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};
