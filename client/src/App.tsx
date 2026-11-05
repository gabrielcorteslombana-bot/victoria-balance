import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ListOrdered, 
  PieChart, 
  ShoppingBag, 
  ShieldCheck, 
  LogOut, 
  Calendar as CalendarIcon,
  Plus,
  Moon,
  Sun
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

  // Tema Claro / Oscuro con persistencia en localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem('vb_theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vb_theme', 'light');
    }
  }, [darkMode]);

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
    return (
      <div className="relative">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed top-5 right-5 z-50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181126] text-slate-600 dark:text-slate-300 shadow-sm"
          title="Cambiar tema"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2E1065]" />}
        </button>
        <AuthModal onSuccess={(u) => setUser(u)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-12 flex flex-col font-sans transition-colors duration-200">
      {/* Barra Superior */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#181126]/90 backdrop-blur-md border-b border-[#E9D5FF]/60 dark:border-[#2D1F47] px-4 sm:px-8 py-3.5 transition">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2E1065] dark:bg-[#C084FC] flex items-center justify-center text-white dark:text-[#2E1065] shadow-md shadow-purple-950/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v17M6 20h12" />
                <path d="M5 7l7-2 7 2" />
                <path d="M5 7L2 14h6L5 7z" />
                <path d="M19 7l-3 7h6l-3-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#2E1065] dark:text-[#E9D5FF] tracking-tight flex items-center gap-2">
                VICTORIA BALANCE
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9D5FF]/60 dark:bg-[#2D1F47] text-[#2E1065] dark:text-[#E9D5FF] border border-[#C084FC]/30">
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Gestión Financiera Diaria & Personal</p>
            </div>
          </div>

          {/* Selector de Período, Tema y Usuario */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-[#FAF8FC] dark:bg-[#1E1530] border border-[#E9D5FF] dark:border-[#382658] px-3 py-1.5 rounded-xl">
              <CalendarIcon className="w-4 h-4 text-[#2E1065] dark:text-[#C084FC]" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#2E1065] dark:text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Toggle Modo Claro / Oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#2D1F47] transition"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2E1065]" />}
            </button>

            <button
              onClick={() => handleOpenTransaction('EXPENSE')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition shadow-md shadow-purple-950/20"
            >
              <Plus className="w-4 h-4 text-[#E9D5FF]" />
              <span>+ Movimiento</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
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

      {/* Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#181126]/95 backdrop-blur-md border-t border-[#E9D5FF]/60 dark:border-[#2D1F47] py-2.5 px-3 z-40 shadow-xl">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'inicio' ? 'text-[#2E1065] dark:text-[#C084FC] font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab('movimientos')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'movimientos' ? 'text-[#2E1065] dark:text-[#C084FC] font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ListOrdered className="w-5 h-5" />
            <span className="text-[10px]">Movimientos</span>
          </button>

          <button
            onClick={() => handleOpenTransaction('EXPENSE')}
            className="w-12 h-12 -mt-6 rounded-full bg-[#2E1065] text-white flex items-center justify-center shadow-xl shadow-purple-950/30 hover:bg-[#1f0a45] active:scale-95 transition border-2 border-white dark:border-[#181126]"
          >
            <Plus className="w-6 h-6 text-[#E9D5FF]" />
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'presupuesto' ? 'text-[#2E1065] dark:text-[#C084FC] font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px]">Presupuesto</span>
          </button>

          <button
            onClick={() => setActiveTab('listas')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'listas' ? 'text-[#2E1065] dark:text-[#C084FC] font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px]">Listas</span>
          </button>

          <button
            onClick={() => setActiveTab('conciliacion')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'conciliacion' ? 'text-[#2E1065] dark:text-[#C084FC] font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px]">Conciliación</span>
          </button>
        </div>
      </nav>

      {/* Modal de Registro */}
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
