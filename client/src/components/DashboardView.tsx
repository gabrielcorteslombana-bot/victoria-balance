import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  PieChart, 
  CheckSquare, 
  AlertTriangle,
  Calendar,
  Lock,
  Unlock,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { DashboardData } from '../types';

interface DashboardViewProps {
  data: DashboardData;
  onOpenTransactionModal: (type: 'INCOME' | 'EXPENSE') => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onOpenTransactionModal,
}) => {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Período y Estado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181126] p-5 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E9D5FF]/40 dark:bg-[#2D1F47] flex items-center justify-center text-[#2E1065] dark:text-[#C084FC] shadow-inner">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Período Activo</span>
            <h2 className="text-xl font-extrabold text-[#2E1065] dark:text-[#E9D5FF] tracking-tight">{data.selected_period}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold ${
            data.period_status === 'OPEN'
              ? 'bg-[#065F46]/10 text-[#065F46] border border-[#065F46]/20'
              : 'bg-slate-100 text-slate-600 border border-slate-300'
          }`}>
            {data.period_status === 'OPEN' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            Período {data.period_status === 'OPEN' ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      </div>

      {/* Alertas Presupuestales */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/90 border border-[#F59E0B]/30 text-amber-950 text-xs font-semibold shadow-sm">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tarjetas Principales de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Disponible Acumulado (Dorado / Amarillo Cálido) */}
        <div className="bg-gradient-to-br from-white to-[#FAF8FC] dark:from-[#181126] dark:to-[#1E1530] p-5 rounded-3xl border border-[#D97706]/20 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#EAB308]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Disponible</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EAB308]/20 text-[#D97706] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-white tracking-tight">
            {formatMoney(data.available_balance)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#D97706] font-semibold mt-1">
            <Sparkles className="w-3 h-3" />
            <span>Saldo total acumulado real</span>
          </div>
        </div>

        {/* Ingresos del Mes (Verde Bosque / Esmeralda) */}
        <div className="bg-gradient-to-br from-white to-[#FAF8FC] dark:from-[#181126] dark:to-[#1E1530] p-5 rounded-3xl border border-[#065F46]/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos del Mes</span>
            <div className="w-9 h-9 rounded-2xl bg-[#065F46]/10 text-[#065F46] flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#065F46] tracking-tight">
            +{formatMoney(data.monthly_income)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Entradas confirmadas en el mes</p>
        </div>

        {/* Gastos del Mes con Comparativa Inteligente Mes a Mes */}
        <div className="bg-gradient-to-br from-white to-[#FAF8FC] dark:from-[#181126] dark:to-[#1E1530] p-5 rounded-3xl border border-[#2E1065]/15 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gastos del Mes</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            -{formatMoney(data.monthly_expenses)}
          </div>
          {data.comparison && data.comparison.growth_percentage !== null ? (
            <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
              {data.comparison.growth_percentage > 0 ? (
                <span className="text-rose-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{data.comparison.growth_percentage}% vs mes anterior
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5 rotate-180" />
                  {data.comparison.growth_percentage}% vs mes anterior
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Egresos registrados en el mes</p>
          )}
        </div>

        {/* Saldo Neto Mensual (Verde Bosque o Alerta) */}
        <div className="bg-gradient-to-br from-white to-[#FAF8FC] dark:from-[#181126] dark:to-[#1E1530] p-5 rounded-3xl border border-[#C084FC]/30 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance Neto Mes</span>
            <div className="w-9 h-9 rounded-2xl bg-[#E9D5FF]/60 text-[#2E1065] flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${data.monthly_net_balance >= 0 ? 'text-[#064E3B]' : 'text-rose-600'}`}>
            {formatMoney(data.monthly_net_balance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Ingresos menos gastos del período</p>
        </div>
      </div>

      {/* Botones de Acción Diaria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          onClick={() => onOpenTransactionModal('INCOME')}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-white dark:bg-[#181126] border-2 border-[#065F46] text-[#064E3B] dark:text-emerald-400 font-bold text-sm hover:bg-[#065F46]/5 dark:hover:bg-[#065F46]/20 shadow-sm active:scale-[0.99] transition"
        >
          <ArrowDownLeft className="w-5 h-5 text-[#065F46]" />
          <span>+ Añadir Ingreso Inmediato</span>
        </button>
        <button
          onClick={() => onOpenTransactionModal('EXPENSE')}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#2E1065] text-white font-bold text-sm hover:bg-[#1f0a45] shadow-lg shadow-purple-950/20 active:scale-[0.99] transition"
        >
          <ArrowUpRight className="w-5 h-5 text-[#E9D5FF]" />
          <span>- Registrar Gasto Diario</span>
        </button>
      </div>

      {/* Distribución Presupuestal y Listas de Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presupuesto por Categoría */}
        <div className="lg:col-span-2 bg-white dark:bg-[#181126] p-6 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#2E1065]">Ejecución Presupuestal por Categoría</h3>
              <p className="text-xs text-slate-500 font-medium">Planificación mensual vs. gasto real acumulado</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Presupuesto Asignado</span>
              <p className="text-base font-black text-[#2E1065]">{formatMoney(data.total_budget)}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {data.category_summary.map((cat) => (
              <div key={cat.categoryId} className="p-3.5 rounded-2xl bg-[#FAF8FC] border border-[#E9D5FF]/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="text-xs font-bold text-slate-800">{cat.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800">{formatMoney(cat.spentAmount)}</span>
                    <span className="text-[11px] text-slate-400 font-medium"> / {cat.hasBudget ? formatMoney(cat.allocatedAmount) : 'Sin asignar'}</span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      cat.isExceeded
                        ? 'bg-rose-500'
                        : (cat.executionPercentage || 0) > 85
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#2E1065]'
                    }`}
                    style={{ width: `${Math.min(cat.executionPercentage || 0, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[11px] font-semibold text-slate-500">
                  <span>
                    {cat.isExceeded ? (
                      <span className="text-rose-600 font-bold">Excedido por {formatMoney(cat.spentAmount - cat.allocatedAmount)}</span>
                    ) : cat.hasBudget ? (
                      <span className="text-[#065F46]">Disponible: {formatMoney(cat.remainingAmount)}</span>
                    ) : (
                      <span className="text-slate-400">Sin presupuesto fijado</span>
                    )}
                  </span>
                  <span className="font-bold text-[#2E1065]">{cat.executionPercentage !== null ? `${cat.executionPercentage}%` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Independiente de Listas de Compras */}
        <div className="bg-white dark:bg-[#181126] p-6 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E9D5FF]/50 text-[#2E1065]">
              <CheckSquare className="w-5 h-5 text-[#2E1065]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2E1065]">Mis Listas de Compras</h3>
              <p className="text-[11px] text-slate-400 font-medium">Independiente de los saldos financieros</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF8FC] to-[#F5EEFF]/60 border border-[#E9D5FF]/60 space-y-3.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Listas Activas</span>
              <span className="font-extrabold text-[#2E1065]">{data.shopping_summary.active_lists}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Total Productos</span>
              <span className="font-extrabold text-slate-800">{data.shopping_summary.total_items}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Productos Comprados</span>
              <span className="font-extrabold text-[#065F46]">{data.shopping_summary.purchased_items}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Pendientes</span>
              <span className="font-extrabold text-[#D97706]">{data.shopping_summary.pending_items}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
                <span>Avance Global</span>
                <span className="text-[#065F46]">{data.shopping_summary.completion_percentage}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#065F46] h-full rounded-full transition-all duration-300"
                  style={{ width: `${data.shopping_summary.completion_percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E9D5FF]/20 border border-[#E9D5FF]/40 text-[11px] text-[#2E1065] leading-relaxed">
            🌿 <strong>Regla Victoria:</strong> Marcar productos en listas no descuenta dinero ni crea gastos ficticios.
          </div>
        </div>
      </div>

      {/* Últimos Movimientos Registrados */}
      <div className="bg-white dark:bg-[#181126] p-6 rounded-3xl border border-[#E9D5FF]/60 dark:border-[#2D1F47] shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-[#2E1065]">Últimos Movimientos Registrados</h3>
        {data.recent_transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No hay movimientos registrados en este período aún.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recent_transactions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between text-xs hover:bg-[#FAF8FC] px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${t.type === 'INCOME' ? 'bg-[#065F46]/10 text-[#065F46]' : 'bg-[#E9D5FF]/50 text-[#2E1065]'}`}>
                    {t.type === 'INCOME' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800">{t.concept}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <span>{t.date}</span>
                      {t.category && <span>• {t.category.emoji} {t.category.name}</span>}
                    </div>
                  </div>
                </div>
                <div className={`font-black text-sm ${t.type === 'INCOME' ? 'text-[#065F46]' : 'text-slate-800'}`}>
                  {t.type === 'INCOME' ? '+' : '-'}{formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
