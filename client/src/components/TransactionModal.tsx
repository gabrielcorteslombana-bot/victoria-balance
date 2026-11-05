import React, { useState } from 'react';
import { X, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../services/api';
import { Category } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  initialType?: 'INCOME' | 'EXPENSE';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
  initialType = 'EXPENSE',
}) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions', {
        type,
        date,
        concept: concept.trim() || undefined,
        amount: numAmount,
        categoryId: type === 'EXPENSE' ? (categoryId || null) : null,
        description: description.trim() || undefined,
      });

      setConcept('');
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el movimiento en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E9D5FF] p-6 md:p-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-2xl ${type === 'INCOME' ? 'bg-[#065F46]/10 text-[#065F46]' : 'bg-[#E9D5FF]/50 text-[#2E1065]'}`}>
              {type === 'INCOME' ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#2E1065]">
                {type === 'INCOME' ? 'Registrar Ingreso' : 'Registrar Gasto'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Registro inmediato y persistente en base de datos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#FAF8FC] rounded-2xl border border-[#E9D5FF]/60">
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              type === 'INCOME' ? 'bg-white shadow text-[#065F46]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            + Ingreso
          </button>
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              type === 'EXPENSE' ? 'bg-[#2E1065] text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            - Gasto
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#2E1065]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Monto ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#2E1065]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Concepto Principal
            </label>
            <input
              type="text"
              placeholder={type === 'EXPENSE' ? 'Ej: Mercado, Gasolina, Almuerzo' : 'Ej: Salario, Honorarios'}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#2E1065]"
            />
            <span className="text-[10px] text-slate-400 font-medium">Si se deja vacío se asignará "{type === 'EXPENSE' ? 'Pago sin nombre' : 'Ingreso sin concepto'}"</span>
          </div>

          {type === 'EXPENSE' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#2E1065] bg-white"
              >
                <option value="">📌 Sin clasificar (Automático)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Descripción Opcional
            </label>
            <textarea
              rows={2}
              placeholder="Detalles adicionales opcionales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#2E1065]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-500 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 text-xs font-bold rounded-xl text-white shadow-md transition disabled:opacity-50 ${
                type === 'INCOME' ? 'bg-[#065F46] hover:bg-[#044331]' : 'bg-[#2E1065] hover:bg-[#1f0a45]'
              }`}
            >
              {loading ? 'Guardando...' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
