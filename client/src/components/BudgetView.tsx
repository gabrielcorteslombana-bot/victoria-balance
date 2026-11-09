import React, { useState, useEffect } from 'react';
import { Target, Copy, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Category } from '../types';

interface BudgetViewProps {
  categories: Category[];
  currentPeriod: string; // "2026-11"
  onRefreshData: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  categories,
  currentPeriod,
  onRefreshData,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<{ [catId: string]: string }>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const [yearStr, monthStr] = currentPeriod.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { year, month } });
      setData(res.data);
      const initialMap: any = {};
      res.data.categories.forEach((c: any) => {
        initialMap[c.categoryId] = c.allocatedAmount ? c.allocatedAmount.toString() : '';
      });
      setAllocations(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [currentPeriod]);

  const handleSaveAllocation = async (categoryId: string) => {
    setSavingCat(categoryId);
    try {
      const amountVal = parseFloat(allocations[categoryId] || '0');
      await api.post('/budgets', {
        year,
        month,
        categoryId,
        amount: isNaN(amountVal) ? 0 : amountVal,
      });
      fetchBudget();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar presupuesto.');
    } finally {
      setSavingCat(null);
    }
  };

  const handleCopyPrevious = async () => {
    if (!window.confirm('¿Copiar la configuración de presupuesto del mes anterior para este período?')) return;
    try {
      const res = await api.post('/budgets/copy-previous', { year, month });
      setCopyMsg(res.data.message);
      setTimeout(() => setCopyMsg(null), 4000);
      fetchBudget();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'No se pudo copiar el presupuesto del mes anterior.');
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181126] p-5 rounded-3xl border border-purple-100 dark:border-[#2D1F47] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2E1065] dark:text-[#E9D5FF]">Planificación de Presupuesto</h2>
          <p className="text-xs text-slate-500">Asigna límites mensuales por categoría para contrastar contra tus gastos reales</p>
        </div>
        <button
          onClick={handleCopyPrevious}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-[#F5EEFF] text-[#5B21B6] text-xs font-semibold hover:bg-purple-100 transition shadow-sm"
        >
          <Copy className="w-4 h-4" />
          Copiar del Mes Anterior
        </button>
      </div>

      {copyMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          {copyMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Cargando presupuesto...</div>
      ) : (
        <div className="bg-white dark:bg-[#181126] rounded-3xl border border-purple-100 dark:border-[#2D1F47] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#FAF8FC]">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presupuesto Asignado Total</span>
              <div className="text-xl font-bold text-[#2E1065] dark:text-[#E9D5FF]">{formatMoney(data?.totalBudget || 0)}</div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ejecución Global</span>
              <div className="text-xl font-bold text-slate-700">{data?.overallExecutionPercentage ?? '0'}%</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.categories.map((cat: any) => (
              <div key={cat.categoryId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-purple-50/20 dark:hover:bg-[#1E1530]/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F5EEFF] text-xl flex items-center justify-center">
                    {cat.emoji}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cat.categoryName}</h4>
                    <p className="text-xs text-slate-400">
                      Gasto real acumulado: <strong className="text-slate-600">{formatMoney(cat.spentAmount)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      step="1000"
                      placeholder="0"
                      value={allocations[cat.categoryId] ?? ''}
                      onChange={(e) => setAllocations({ ...allocations, [cat.categoryId]: e.target.value })}
                      className="w-36 pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#5B21B6]"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveAllocation(cat.categoryId)}
                    disabled={savingCat === cat.categoryId}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5B21B6] text-white hover:bg-[#2E1065] transition disabled:opacity-50"
                  >
                    {savingCat === cat.categoryId ? 'Guardando...' : 'Fijar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
