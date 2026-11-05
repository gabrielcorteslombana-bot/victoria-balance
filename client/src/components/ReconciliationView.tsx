import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, HelpCircle, Lock, Unlock } from 'lucide-react';
import api from '../services/api';

interface ReconciliationViewProps {
  currentPeriod: string; // "2026-11"
  onRefreshData: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  currentPeriod,
  onRefreshData,
}) => {
  const [yearStr, monthStr] = currentPeriod.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const [bankOutflow, setBankOutflow] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [periodInfo, setPeriodInfo] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const recRes = await api.get('/reconciliations');
      setReconciliations(recRes.data.reconciliations);

      const pRes = await api.get('/periods');
      const found = pRes.data.periods.find((p: any) => p.year === year && p.month === month);
      if (found) {
        setPeriodInfo(found);
        setOpeningBalance(found.openingBalance ? found.openingBalance.toString() : '0');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPeriod]);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const outflowNum = parseFloat(bankOutflow);
    if (isNaN(outflowNum) || outflowNum < 0) {
      alert('Ingresa un egreso bancario válido.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/reconciliations', {
        year,
        month,
        reportedOutflow: outflowNum,
      });

      const rec = res.data.reconciliation;
      setStatusMsg(`Resultado: Estado ${rec.status} (Diferencia: $${rec.difference})`);
      setBankOutflow('');
      fetchData();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al procesar la conciliación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpeningBalance = async () => {
    try {
      await api.post('/periods/opening-balance', {
        year,
        month,
        openingBalance: parseFloat(openingBalance) || 0,
      });
      alert('Saldo inicial del período guardado correctamente.');
      fetchData();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar saldo inicial.');
    }
  };

  const handleTogglePeriodLock = async () => {
    if (!periodInfo) return;
    const actionName = periodInfo.status === 'OPEN' ? 'CERRAR' : 'REABRIR';
    if (!window.confirm(`¿Estás seguro de que deseas ${actionName} el período ${currentPeriod}?`)) return;

    try {
      await api.post(`/periods/${periodInfo.id}/toggle-status`);
      fetchData();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cambiar estado.');
    }
  };

  const formatMoney = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(val || '0');
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2E1065]">Conciliación y Cierre de Período</h2>
          <p className="text-xs text-slate-500">
            Herramienta complementaria y opcional. No altera tus movimientos originales.
          </p>
        </div>

        {periodInfo && (
          <button
            onClick={handleTogglePeriodLock}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
              periodInfo.status === 'OPEN'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-purple-50 text-[#5B21B6] border border-purple-200 hover:bg-purple-100'
            }`}
          >
            {periodInfo.status === 'OPEN' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {periodInfo.status === 'OPEN' ? 'Cerrar Período (Bloquear cambios)' : 'Reabrir Período'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de Saldo Inicial */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#2E1065]">Saldo Inicial Registrado del Período</h3>
          <p className="text-xs text-slate-500">
            Utilizado para calcular con exactitud el Saldo Disponible acumulado. Si no existe se utiliza 0.
          </p>

          <div className="flex items-center gap-3">
            <input
              type="number"
              step="1000"
              placeholder="0.00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#5B21B6] flex-1"
            />
            <button
              onClick={handleSaveOpeningBalance}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5B21B6] text-white hover:bg-[#2E1065] transition"
            >
              Guardar Saldo
            </button>
          </div>
        </div>

        {/* Herramienta de Conciliación */}
        <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#2E1065]">Revisión Bancaria (Conciliación)</h3>
          <p className="text-xs text-slate-500">
            Ingresa el total de egresos reportado por tu extracto bancario para verificar inconsistencias.
          </p>

          <form onSubmit={handleReconcile} className="space-y-3">
            <input
              type="number"
              step="100"
              required
              placeholder="Total egresos del extracto bancario ($)"
              value={bankOutflow}
              onChange={(e) => setBankOutflow(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#5B21B6]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#064E3B] text-white hover:bg-emerald-950 transition shadow"
            >
              {loading ? 'Calculando...' : 'Ejecutar Conciliación'}
            </button>
          </form>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-[#5B21B6] font-medium">
              {statusMsg}
            </div>
          )}
        </div>
      </div>

      {/* Historial de Conciliaciones */}
      <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2E1065]">Historial de Revisiones Realizadas</h3>
        {reconciliations.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No hay conciliaciones registradas.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reconciliations.map((rec) => (
              <div key={rec.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Período {rec.period?.year}-{String(rec.period?.month).padStart(2, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === 'CONCILIADO'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rec.status === 'CON_DIFERENCIAS_NO_IDENTIFICADAS'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {rec.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Fecha: {new Date(rec.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-slate-700">
                    Bancos: {formatMoney(rec.reportedOutflow)} vs Gastos: {formatMoney(rec.registeredExpenses)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Diferencia: {formatMoney(rec.difference)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
