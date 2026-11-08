import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle, Search, RefreshCw, Plus, Shield } from 'lucide-react';
import api from '../services/api';

interface AdminViewProps {
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBack }) => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cargar panel de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string, extendDays: number = 0) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        subscriptionStatus: newStatus,
        extendTrialDays: extendDays,
      });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar usuario.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181126] p-5 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2E1065] text-[#E9D5FF] flex items-center justify-center font-black">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#2E1065] dark:text-white">Panel de Administración</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Control global de usuarios, pruebas y membresías activas</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1E1530] transition text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Globales */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#181126] p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Total Usuarios</div>
            <div className="text-2xl font-black text-[#2E1065] dark:text-white mt-1">{stats.totalUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[11px] font-bold text-amber-500 uppercase">En Prueba (Trial)</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.trialUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[11px] font-bold text-emerald-600 uppercase">Activos / Premium</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.activeUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[11px] font-bold text-rose-500 uppercase">Prueba Vencida</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{stats.expiredUsers}</div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white dark:bg-[#181126] p-3.5 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm flex items-center gap-2.5">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por correo o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold focus:outline-none dark:text-white"
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-[#181126] rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No se encontraron usuarios.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-[#FAF8FC] dark:bg-[#1E1530] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800 font-bold">
                <tr>
                  <th className="px-5 py-3.5">Usuario</th>
                  <th className="px-5 py-3.5">Contacto</th>
                  <th className="px-5 py-3.5">Estado Membresía</th>
                  <th className="px-5 py-3.5">Fin de Prueba</th>
                  <th className="px-5 py-3.5">Movimientos</th>
                  <th className="px-5 py-3.5 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2D1F47]">
                {filteredUsers.map((u) => {
                  const isExpired = u.subscriptionStatus === 'EXPIRED';
                  const isActive = u.subscriptionStatus === 'ACTIVE' || u.subscriptionStatus === 'LIFETIME';

                  return (
                    <tr key={u.id} className="hover:bg-purple-50/20 dark:hover:bg-[#1E1530]/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name || 'Sin nombre'}</span>
                          {u.role === 'ADMIN' && (
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-900 text-[#2E1065] dark:text-[#E9D5FF] px-1.5 py-0.2 rounded font-black">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {u.phone ? (
                          <a
                            href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline font-semibold"
                          >
                            {u.phone}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : isExpired
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        }`}>
                          {u.subscriptionStatus}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : 'Ilimitado'}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                        {u._count?.transactions || 0}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        {/* Activar Membresía tras pago */}
                        <button
                          disabled={updatingId === u.id || isActive}
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition disabled:opacity-40"
                          title="Activar cuenta permanente tras recibir pago"
                        >
                          ✓ Activar Pago
                        </button>

                        {/* Extender 7 días más */}
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'TRIAL', 7)}
                          className="px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-[#2E1065] dark:text-[#E9D5FF] font-bold text-[10px] hover:bg-purple-50 dark:hover:bg-purple-950/40 transition disabled:opacity-40"
                          title="Extender 7 días adicionales de prueba"
                        >
                          +7 Días Trial
                        </button>

                        {/* Bloquear / Expirar */}
                        {!isExpired && u.role !== 'ADMIN' && (
                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleUpdateStatus(u.id, 'EXPIRED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100 transition disabled:opacity-40"
                            title="Suspender acceso"
                          >
                            Expirar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
