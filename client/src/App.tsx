import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ListOrdered, 
  PieChart, 
  ShoppingBag, 
  ShieldCheck, 
  LogOut, 
  Calendar as CalendarIcon,
  Plus
} from 'lucide-react';
import api from './services/api';
import { Category, DashboardData } from './types';
import { AuthModal } from './components/AuthModal';
import { TransactionModal } from './components/TransactionModal';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetView } from './components/BudgetView';
import { ShoppingListsView } from './components/ShoppingListsView';
import { ReconciliationView } from './components/ReconciliationView';

export function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('vb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'inicio' | 'movimientos' | 'presupuesto' | 'listas' | 'conciliacion'>('inicio');
  
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const loadMainData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [yearStr, monthStr] = selectedPeriod.split('-');
      const [dashRes, catRes] = await Promise.all([
        api.get('/dashboard', { params: { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) } }),
        api.get('/categories'),
      ]);

      setDashboardData(dashRes.data);
      setCategories(catRes.data.categories);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMainData();
    }
  }, [user, selectedPeriod]);

  const handleLogout = () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_user');
    setUser(null);
  };

  const handleOpenTransaction = (type: 'INCOME' | 'EXPENSE') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  if (!user) {
    return <AuthModal onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF8FC] pb-24 md:pb-12 text-slate-800 flex flex-col font-sans">
      {/* Barra Superior con Violeta Profundo y Lavanda */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E9D5FF]/60 px-4 sm:px-8 py-3.5 transition">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2E1065] via-[#5B21B6] to-[#C084FC] flex items-center justify-center text-white text-base font-black shadow-md shadow-[#2E1065]/20">
              VB
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-[#2E1065] tracking-tight flex items-center gap-2">
                VICTORIA BALANCE
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E9D5FF]/60 text-[#2E1065] border border-[#C084FC]/40">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Gestión Financiera Diaria & Personal</p>
            </div>
          </div>

          {/* Selector de Período y Botón Rápido */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#FAF8FC] border border-[#E9D5FF] px-3.5 py-1.5 rounded-2xl shadow-inner">
              <CalendarIcon className="w-4 h-4 text-[#2E1065]" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#2E1065] focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleOpenTransaction('EXPENSE')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition shadow-md shadow-purple-950/20"
            >
              <Plus className="w-4 h-4 text-[#E9D5FF]" />
              <span>+ Movimiento</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Dinámico */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 flex-1">
        {loading && !dashboardData ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#E9D5FF] border-t-[#2E1065] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Sincronizando con base de datos...</p>
          </div>
        ) : (
          <>
            {activeTab === 'inicio' && dashboardData && (
              <DashboardView
                data={dashboardData}
                onOpenTransactionModal={handleOpenTransaction}
                onRefresh={loadMainData}
              />
            )}

            {activeTab === 'movimientos' && (
              <TransactionsView
                categories={categories}
                onOpenModal={handleOpenTransaction}
                onRefreshData={loadMainData}
              />
            )}

            {activeTab === 'presupuesto' && (
              <BudgetView
                categories={categories}
                currentPeriod={selectedPeriod}
                onRefreshData={loadMainData}
              />
            )}

            {activeTab === 'listas' && (
              <ShoppingListsView currentPeriod={selectedPeriod} />
            )}

            {activeTab === 'conciliacion' && (
              <ReconciliationView
                currentPeriod={selectedPeriod}
                onRefreshData={loadMainData}
              />
            )}
          </>
        )}
      </main>

      {/* Navegación Inferior Móvil y Escritorio */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E9D5FF]/60 py-2.5 px-3 z-40 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'inicio' ? 'text-[#2E1065] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab('movimientos')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'movimientos' ? 'text-[#2E1065] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px]">Movimientos</span>
          </button>

          {/* Botón Central Rápido Móvil */}
          <button
            onClick={() => handleOpenTransaction('EXPENSE')}
            className="w-12 h-12 -mt-6 rounded-full bg-[#2E1065] text-white flex items-center justify-center shadow-xl shadow-purple-950/30 hover:bg-[#1f0a45] active:scale-95 transition border-2 border-white"
          >
            <Plus className="w-6 h-6 text-[#E9D5FF]" />
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'presupuesto' ? 'text-[#2E1065] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px]">Presupuesto</span>
          </button>

          <button
            onClick={() => setActiveTab('listas')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'listas' ? 'text-[#2E1065] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Listas</span>
          </button>

          <button
            onClick={() => setActiveTab('conciliacion')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'conciliacion' ? 'text-[#2E1065] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px]">Conciliación</span>
          </button>
        </div>
      </nav>

      {/* Modal de Registro Inmediato */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onSuccess={loadMainData}
        initialType={modalType}
      />
    </div>
  );
}

export default App;
