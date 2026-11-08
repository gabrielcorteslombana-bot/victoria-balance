import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Filter, ArrowDownLeft, ArrowUpRight, Download, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import { Transaction, Category } from '../types';

interface TransactionsViewProps {
  categories: Category[];
  onOpenModal: (type: 'INCOME' | 'EXPENSE') => void;
  onRefreshData: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  categories,
  onOpenModal,
  onRefreshData,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterCategory) params.categoryId = filterCategory;
      if (searchTerm) params.search = searchTerm;

      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterCategory, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento permanentemente?')) {
      return;
    }
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      onRefreshData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar movimiento.');
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Concepto', 'Categoria', 'Monto COP', 'Descripcion'];
    const rows = transactions.map(t => [
      t.date,
      t.type === 'INCOME' ? 'Ingreso' : 'Gasto',
      `"${(t.concept || '').replace(/"/g, '""')}"`,
      `"${(t.category?.name || 'Sin clasificar').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `victoria_balance_movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Encabezado y Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2E1065]">Movimientos Diarios</h2>
          <p className="text-xs text-slate-500">Registro persistente e inmediato de ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-[#E9D5FF] dark:border-[#382658] bg-white dark:bg-[#1E1530] text-[#2E1065] dark:text-[#E9D5FF] hover:bg-purple-50 dark:hover:bg-[#2D1F47] transition shadow-sm"
            title="Exportar a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button
            onClick={() => onOpenModal('INCOME')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            + Ingreso
          </button>
          <button
            onClick={() => onOpenModal('EXPENSE')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5B21B6] text-white hover:bg-[#2E1065] shadow transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            + Gasto
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Buscar por concepto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6]"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="INCOME">Solo Ingresos</option>
          <option value="EXPENSE">Solo Gastos</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] bg-white"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Movimientos */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Cargando registros...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No se encontraron movimientos registrados con los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#FAF8FC] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Concepto</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-purple-50/30 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{t.concept}</div>
                      {t.description && <div className="text-[11px] text-slate-400">{t.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {t.category ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-[#5B21B6] font-medium text-[11px]">
                          <span>{t.category.emoji}</span>
                          <span>{t.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-extrabold whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Eliminar movimiento"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
