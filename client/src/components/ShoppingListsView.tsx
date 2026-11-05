import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Trash2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import { ShoppingList } from '../types';

interface ShoppingListsViewProps {
  currentPeriod: string;
}

export const ShoppingListsView: React.FC<ShoppingListsViewProps> = ({ currentPeriod }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  // Nuevo item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  const fetchLists = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/lists');
      setLists(data.lists);
      if (data.lists.length > 0 && !expandedListId) {
        setExpandedListId(data.lists[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await api.post('/lists', {
        name: newListName.trim(),
        referencePeriod: currentPeriod,
      });
      setNewListName('');
      fetchLists();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear lista.');
    }
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemName.trim()) return;
    try {
      await api.post(`/lists/${listId}/items`, {
        name: newItemName.trim(),
        quantity: parseInt(newItemQty, 10) || 1,
        estimatedPrice: newItemPrice ? parseFloat(newItemPrice) : null,
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty('1');
      fetchLists();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agregar producto.');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await api.patch(`/lists/items/${itemId}/toggle`);
      fetchLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.delete(`/lists/items/${itemId}`);
      fetchLists();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateList = async (listId: string) => {
    if (!window.confirm('¿Duplicar esta lista conservando únicamente los productos pendientes?')) return;
    try {
      await api.post(`/lists/${listId}/duplicate`, {
        newReferencePeriod: currentPeriod,
      });
      fetchLists();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al duplicar lista.');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('¿Deseas eliminar esta lista por completo?')) return;
    try {
      await api.delete(`/lists/${listId}`);
      fetchLists();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar lista.');
    }
  };

  const formatMoney = (val: number | null) => {
    if (val === null) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#2E1065]">Mis Listas de Compras</h2>
          <p className="text-xs text-slate-500">
            Totalmente independientes del presupuesto y movimientos financieros.
          </p>
        </div>

        {/* Crear lista */}
        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nueva lista (ej: Supermercado)..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] w-52 sm:w-64"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5B21B6] text-white hover:bg-[#2E1065] shadow transition"
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Cargando listas...</div>
      ) : lists.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-purple-100 text-center text-xs text-slate-400">
          No tienes listas de compras creadas. Crea una arriba para organizar tus pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => {
            const isExpanded = expandedListId === list.id;

            return (
              <div key={list.id} className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                {/* Cabecera de la lista */}
                <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[#FAF8FC]">
                  <div
                    onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#F5EEFF] text-[#5B21B6] flex items-center justify-center">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{list.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{list.purchasedItems} de {list.totalItems} productos comprados</span>
                        <span>• {list.completionPercentage}% completado</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicateList(list.id)}
                      title="Duplicar lista con pendientes"
                      className="p-2 rounded-xl hover:bg-purple-100/60 text-[#5B21B6] text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Duplicar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      title="Eliminar lista"
                      className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedListId(isExpanded ? null : list.id)}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Contenido expandible */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-4">
                    {/* Formulario para agregar producto */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#F5EEFF]/40 p-3 rounded-2xl border border-purple-100/50">
                      <input
                        type="text"
                        placeholder="Producto (ej: Leche descremada)..."
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="sm:col-span-6 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Cant."
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] bg-white"
                      />
                      <input
                        type="number"
                        placeholder="Precio est. (opc)"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        className="sm:col-span-3 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#5B21B6] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem(list.id)}
                        className="sm:col-span-1 py-1.5 rounded-xl bg-[#5B21B6] text-white flex items-center justify-center hover:bg-[#2E1065] transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lista de productos */}
                    {list.items.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No hay productos en esta lista.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {list.items.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleItem(item.id)}
                                className={`transition ${item.isPurchased ? 'text-emerald-600' : 'text-slate-300 hover:text-[#5B21B6]'}`}
                              >
                                {item.isPurchased ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </button>
                              <span className={`font-medium ${item.isPurchased ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {item.name} <span className="text-[11px] text-slate-400 font-normal">x{item.quantity}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              {item.estimatedPrice && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Est: {formatMoney(item.estimatedPrice)}
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-slate-300 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
