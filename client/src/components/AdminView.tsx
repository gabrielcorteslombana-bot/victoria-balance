import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle, Search, RefreshCw, Plus, Shield, Calendar, ArrowLeft } from 'lucide-react';
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
      alert(err.response?.data?.error || 'Error al cargar panel de administracion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string, planType?: string, extendDays: number = 0) => {
    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, {
        subscriptionStatus: newStatus,
        planType,
        extendDays,
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181126] p-4 sm:p-5 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2D1F47] text-slate-500 transition"
            title="Volver al inicio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#2E1065] text-[#E9D5FF] flex items-center justify-center font-black flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#2E1065] dark:text-white">Panel de Administracion</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Control de usuarios y planes (Mensual / Sem / Anual)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1E1530] transition text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={onBack}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition"
          >
            <span>Volver a Finanzas</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Metricas Globales */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#181126] p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase">Total Usuarios</div>
            <div className="text-xl sm:text-2xl font-black text-[#2E1065] dark:text-white mt-1">{stats.totalUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[10px] sm:text-[11px] font-bold text-amber-500 uppercase">En Prueba (Trial)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{stats.trialUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase">Activos / Premium</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{stats.activeUsers}</div>
          </div>
          <div className="bg-white dark:bg-[#181126] p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
            <div className="text-[10px] sm:text-[11px] font-bold text-rose-500 uppercase">Prueba Vencida</div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{stats.expiredUsers}</div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white dark:bg-[#181126] p-3.5 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm flex items-center gap-2.5">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar usuario por correo o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold focus:outline-none dark:text-white"
        />
      </div>

      {/* Vista Móvil: Tarjetas Responsive */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-[#181126] rounded-2xl">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-[#181126] rounded-2xl">No se encontraron usuarios.</div>
        ) : (
          filteredUsers.map((u) => {
            const isExpired = u.subscriptionStatus === 'EXPIRED';
            const isActive = u.subscriptionStatus === 'ACTIVE' || u.subscriptionStatus === 'LIFETIME';

            return (
              <div key={u.id} className="bg-white dark:bg-[#181126] p-4 rounded-2xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{u.name || 'Sin nombre'}</span>
                      {u.role === 'ADMIN' && (
                        <span className="text-[9px] bg-purple-100 dark:bg-purple-900 text-[#2E1065] dark:text-[#E9D5FF] px-1.5 py-0.2 rounded font-black">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{u.email}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : isExpired
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {u.subscriptionStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#2D1F47]">
                  <div>
                    <span>WhatsApp: </span>
                    {u.phone ? (
                      <a
                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        {u.phone}
                      </a>
                    ) : (
                      '--'
                    )}
                  </div>
                  <div>
                    <span>Vence: </span>
                    <strong className="text-slate-700 dark:text-slate-200">
                      {u.subscriptionStatus === 'LIFETIME' ? 'Vitalicio' : u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString() : '--'}
                    </strong>
                  </div>
                </div>

                {/* Acciones Rápidas en Móvil */}
                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-[#2D1F47]">
                  <button
                    disabled={updatingId === u.id}
                    onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'MONTHLY')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 text-white font-bold text-[10px] hover:bg-purple-700 transition disabled:opacity-40"
                  >
                    +1 Mes
                  </button>
                  <button
                    disabled={updatingId === u.id}
                    onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'SEMESTER')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition disabled:opacity-40"
                  >
                    +6 Meses
                  </button>
                  <button
                    disabled={updatingId === u.id}
                    onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'ANNUAL')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition disabled:opacity-40"
                  >
                    +1 Año
                  </button>
                  <button
                    disabled={updatingId === u.id}
                    onClick={() => handleUpdateStatus(u.id, 'TRIAL', undefined, 7)}
                    className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] transition disabled:opacity-40"
                  >
                    +7d
                  </button>
                  {!isExpired && u.role !== 'ADMIN' && (
                    <button
                      disabled={updatingId === u.id}
                      onClick={() => handleUpdateStatus(u.id, 'EXPIRED')}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-[10px] transition disabled:opacity-40"
                    >
                      Expirar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop: Tabla Tradicional */}
      <div className="hidden md:block bg-white dark:bg-[#181126] rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm overflow-hidden">
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
                  <th className="px-5 py-3.5">Contacto WhatsApp</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Vencimiento</th>
                  <th className="px-5 py-3.5 text-right">Activar Plan</th>
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
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            {u.phone}
                          </a>
                        ) : (
                          '--'
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
                        {u.subscriptionStatus === 'LIFETIME' 
                          ? 'Vitalicio (Sin límite)' 
                          : u.trialEndsAt 
                          ? new Date(u.trialEndsAt).toLocaleDateString() 
                          : '--'}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'MONTHLY')}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition disabled:opacity-40"
                          title="Activar 1 Mes ($14.900)"
                        >
                          +1 Mes
                        </button>

                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'SEMESTER')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition disabled:opacity-40"
                          title="Activar 6 Meses ($59.000)"
                        >
                          +6 Meses
                        </button>

                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'ACTIVE', 'ANNUAL')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition disabled:opacity-40"
                          title="Activar 1 Año ($99.000)"
                        >
                          +1 Año
                        </button>

                        <button
                          disabled={updatingId === u.id}
                          onClick={() => handleUpdateStatus(u.id, 'TRIAL', undefined, 7)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
                          title="Dar 7 días más de prueba"
                        >
                          +7d Trial
                        </button>

                        {!isExpired && u.role !== 'ADMIN' && (
                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleUpdateStatus(u.id, 'EXPIRED')}
                            className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 font-bold text-[10px] hover:bg-rose-100 transition disabled:opacity-40"
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
