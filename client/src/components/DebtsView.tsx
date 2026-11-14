import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit2, 
  Sparkles, 
  X,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Debt } from '../types';

export const DebtsView: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/debts');
      setDebts(data.debts);
    } catch (err) {
      console.error('Error al cargar deudas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const openCreateModal = () => {
    setEditingDebt(null);
    setName('');
    setTotalAmount('');
    setTotalInstallments('');
    setPaidInstallments('0');
    setInstallmentAmount('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setTotalAmount(debt.totalAmount.toString());
    setTotalInstallments(debt.totalInstallments.toString());
    setPaidInstallments(debt.paidInstallments.toString());
    setInstallmentAmount(debt.installmentAmount ? debt.installmentAmount.toString() : '');
    setNotes(debt.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const total = parseFloat(totalAmount);
    const installments = parseInt(totalInstallments, 10);
    const paid = parseInt(paidInstallments || '0', 10);
    const customInstallment = installmentAmount ? parseFloat(installmentAmount) : undefined;

    if (!name.trim()) {
      setFormError('Por favor ingresa el nombre de la deuda (ej: Televisor, Carro, Crédito).');
      return;
    }
    if (isNaN(total) || total <= 0) {
      setFormError('El valor total de la deuda debe ser mayor a 0.');
      return;
    }
    if (isNaN(installments) || installments < 1) {
      setFormError('El número de cuotas debe ser al menos 1.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        totalAmount: total,
        totalInstallments: installments,
        paidInstallments: paid,
        installmentAmount: customInstallment,
        notes: notes.trim() || undefined,
      };

      if (editingDebt) {
        await api.put(`/debts/${editingDebt.id}`, payload);
      } else {
        await api.post('/debts', payload);
      }

      setIsModalOpen(false);
      fetchDebts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Error al guardar la deuda.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePayInstallment = async (debtId: string) => {
    try {
      await api.patch(`/debts/${debtId}/pay-installment`);
      fetchDebts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al pagar la cuota.');
    }
  };

  const handleDelete = async (debtId: string) => {
    if (!window.confirm('¿Deseas eliminar este registro de deuda permanentemente?')) return;
    try {
      await api.delete(`/debts/${debtId}`);
      fetchDebts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar la deuda.');
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Métricas globales
  const totalDebtBalance = debts
    .filter(d => d.status === 'ACTIVE')
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const activeDebtsCount = debts.filter(d => d.status === 'ACTIVE').length;
  const paidDebtsCount = debts.filter(d => d.status === 'PAID').length;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#181126] p-5 rounded-3xl border border-purple-100 dark:border-[#2D1F47] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2E1065] text-[#E9D5FF] flex items-center justify-center font-black">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2E1065] dark:text-[#E9D5FF]">Control de Deudas & Cuotas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestiona compras a plazos, créditos y cuántas cuotas vas pagando</p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition shadow-md shadow-purple-950/20"
        >
          <Plus className="w-4 h-4 text-[#E9D5FF]" />
          <span>+ Nueva Deuda</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#181126] p-5 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldo Total por Pagar</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatMoney(totalDebtBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Deudas activas pendientes</div>
        </div>

        <div className="bg-white dark:bg-[#181126] p-5 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deudas en Curso</div>
          <div className="text-2xl font-black text-[#2E1065] dark:text-white mt-1">
            {activeDebtsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Con cuotas pendientes por abonar</div>
        </div>

        <div className="bg-white dark:bg-[#181126] p-5 rounded-2xl border border-slate-100 dark:border-[#2D1F47] shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deudas Finalizadas</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {paidDebtsCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">100% pagadas con éxito</div>
        </div>
      </div>

      {/* Lista de Deudas */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-[#181126] p-12 rounded-3xl border border-purple-100 dark:border-[#2D1F47] text-center text-xs text-slate-400">
            Cargando deudas...
          </div>
        ) : debts.length === 0 ? (
          <div className="bg-white dark:bg-[#181126] p-12 rounded-3xl border border-purple-100 dark:border-[#2D1F47] text-center text-xs text-slate-400 space-y-3">
            <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No tienes deudas registradas.</p>
            <p className="text-[11px] text-slate-400">¡Excelente! O añade tus compras a plazos (Televisor, Celular, Moto) para controlar las cuotas.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition"
            >
              Registrar mi primera deuda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((d) => {
              const isPaid = d.status === 'PAID';

              return (
                <div
                  key={d.id}
                  className={`bg-white dark:bg-[#181126] rounded-3xl border p-5 sm:p-6 shadow-sm transition space-y-4 ${
                    isPaid 
                      ? 'border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/20' 
                      : 'border-purple-100 dark:border-[#2D1F47]'
                  }`}
                >
                  {/* Encabezado de la Deuda */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#2E1065] dark:text-white">
                          {d.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          isPaid
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {isPaid ? 'Completada' : 'En Curso'}
                        </span>
                      </div>
                      {d.notes && (
                        <p className="text-xs text-slate-400 mt-1">{d.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        title="Editar deuda"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Eliminar deuda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cuotas y Progreso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Cuotas pagadas: <strong className="text-purple-600 dark:text-purple-400 font-extrabold">{d.paidInstallments}</strong> de <strong>{d.totalInstallments}</strong>
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {d.progressPercentage}%
                      </span>
                    </div>

                    {/* Barra de progreso visual */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1E1530] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isPaid 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-[#2E1065] to-[#C084FC]'
                        }`}
                        style={{ width: `${d.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Montos: Total, Cuota y Saldo Pendiente */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#2D1F47] text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Total Deuda</div>
                      <div className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                        {formatMoney(d.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Valor Cuota</div>
                      <div className="text-xs font-black text-purple-700 dark:text-purple-400 mt-0.5">
                        {formatMoney(d.installmentAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Por Pagar</div>
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatMoney(d.remainingAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Botón de Acción Rápida: Pagar 1 Cuota */}
                  {!isPaid && (
                    <button
                      onClick={() => handlePayInstallment(d.id)}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registrar Pago de Cuota ({d.paidInstallments + 1}/{d.totalInstallments})</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Deuda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181126] rounded-3xl shadow-2xl border border-purple-200 dark:border-[#2D1F47] p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#2D1F47]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#2E1065] dark:text-[#C084FC]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#2E1065] dark:text-white">
                    {editingDebt ? 'Editar Deuda' : 'Nueva Deuda a Cuotas'}
                  </h3>
                  <p className="text-xs text-slate-400">Control de pagos periódicos</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2D1F47] text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Nombre o Concepto de la Deuda
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Televisor Samsung, Moto, Tarjeta Crédito"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Valor Total de la Deuda ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ej: 2400000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Total Cuotas
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Ej: 12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Cuotas Pagadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 2"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Valor Cuota Mensual (Opcional - Calculado automático)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Automático (Total / Cuotas)"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Notas / Entidad (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tarjeta Éxito, Banco Falabella, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#2E1065] dark:focus:border-[#C084FC]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2D1F47] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl text-white bg-[#2E1065] hover:bg-[#1f0a45] shadow-md transition disabled:opacity-50"
                >
                  {formLoading ? 'Guardando...' : editingDebt ? 'Guardar Cambios' : 'Crear Deuda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
