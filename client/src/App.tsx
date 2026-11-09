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
  Sun,
  Shield,
  Sparkles,
  AlertCircle,
  Clock,
  X
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
import { AdminView } from './components/AdminView';
import { PaywallModal } from './components/PaywallModal';

export function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('vb_user');
    return saved ? JSON.parse(saved) : null;
  });

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

  const [activeTab, setActiveTab] = useState<'inicio' | 'movimientos' | 'presupuesto' | 'listas' | 'conciliacion' | 'admin'>('inicio');
  
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [showTrialToast, setShowTrialToast] = useState(false);

  // Calcular dias restantes de prueba con base en trialEndsAt o createdAt
  const getDaysRemaining = () => {
    if (!user) return null;
    if (user.role === 'ADMIN' || user.email === 'victoria@balance.app' || user.subscriptionStatus === 'LIFETIME' || user.subscriptionStatus === 'ACTIVE') {
      return null;
    }
    
    let targetDate: Date | null = null;
    if (user.trialEndsAt) {
      targetDate = new Date(user.trialEndsAt);
    } else if (user.createdAt) {
      targetDate = new Date(user.createdAt);
      targetDate.setDate(targetDate.getDate() + 7);
    }

    if (targetDate) {
      const diffTime = targetDate.getTime() - new Date().getTime();
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    }

    if (user.subscriptionStatus === 'TRIAL') {
      return 7;
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();
  const isTrialExpired = user?.subscriptionStatus === 'EXPIRED' || (daysRemaining !== null && daysRemaining <= 0);
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'victoria@balance.app';
  const isTrialUser = !isAdmin && (user?.subscriptionStatus === 'TRIAL' || daysRemaining !== null);

  useEffect(() => {
    if (user && isTrialUser && !isTrialExpired) {
      setShowTrialToast(true);
    }
  }, [user?.id, isTrialUser, isTrialExpired]);

  const dismissTrialToast = () => {
    setShowTrialToast(false);
  };

  const loadMainData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [yearStr, monthStr] = selectedPeriod.split('-');
      const [dashRes, catRes, meRes] = await Promise.all([
        api.get('/dashboard', { params: { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) } }),
        api.get('/categories'),
        api.get('/auth/me').catch(() => null),
      ]);

      setDashboardData(dashRes.data);
      setCategories(catRes.data.categories);
      if (meRes?.data?.user) {
        setUser(meRes.data.user);
        localStorage.setItem('vb_user', JSON.stringify(meRes.data.user));
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      if (err.response?.status === 403 && err.response?.data?.subscriptionExpired) {
        setUser((prev: any) => ({ ...prev, subscriptionStatus: 'EXPIRED' }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMainData();
    }
  }, [user?.id, selectedPeriod]);

  const handleLogout = () => {
    localStorage.removeItem('vb_token');
    localStorage.removeItem('vb_user');
    setUser(null);
  };

  const handleOpenTransaction = (type: 'INCOME' | 'EXPENSE') => {
    if (isTrialExpired && !isAdmin) {
      setIsPaywallOpen(true);
      return;
    }
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleTabChange = (tab: 'inicio' | 'movimientos' | 'presupuesto' | 'listas' | 'conciliacion' | 'admin') => {
    if (isTrialExpired && !isAdmin) {
      setIsPaywallOpen(true);
      return;
    }
    setActiveTab(tab);
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
    <div className="min-h-screen pb-24 md:pb-12 flex flex-col font-sans transition-colors duration-200 bg-[#FAF8FC] dark:bg-[#0F0A1A]">
      
      {/* 1. BANNER VISIBLE SUPERIOR DE PRUEBA ACTIVA */}
      {isTrialUser && !isTrialExpired && (
        <div className="bg-gradient-to-r from-[#2E1065] via-[#5B21B6] to-[#065F46] text-white px-3 py-2 text-center text-xs font-semibold flex flex-wrap items-center justify-center gap-2 sm:gap-4 shadow-md">
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span>Tienes <strong>{daysRemaining ?? 7} días de prueba gratuita</strong> restantes</span>
          </span>
          <button
            onClick={() => setIsPaywallOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-white text-[#2E1065] text-[10px] font-black uppercase hover:bg-purple-100 transition shadow"
          >
            Activar Premium
          </button>
        </div>
      )}

      {/* 2. BANNER DE PRUEBA FINALIZADA */}
      {isTrialExpired && !isAdmin && (
        <div className="bg-rose-700 text-white px-3 py-2 text-center text-xs font-bold flex flex-wrap items-center justify-center gap-2 shadow-md">
          <span className="text-[11px] sm:text-xs">⚠️ Tu período de prueba de 7 días ha finalizado.</span>
          <button
            onClick={() => setIsPaywallOpen(true)}
            className="px-3 py-0.5 rounded-full bg-white text-rose-800 text-[10px] font-black uppercase hover:bg-rose-100 transition shadow"
          >
            Activar Membresía WhatsApp
          </button>
        </div>
      )}

      {/* 3. POP-UP FLOTANTE DE AVISO */}
      {showTrialToast && isTrialUser && !isTrialExpired && (
        <div className="fixed top-14 sm:top-16 right-2 sm:right-4 z-50 max-w-sm w-[94%] sm:w-auto bg-white dark:bg-[#1E1530] border-2 border-[#C084FC] rounded-2xl p-3.5 sm:p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#2E1065] dark:text-[#C084FC] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-[11px] sm:text-xs font-black text-[#2E1065] dark:text-white uppercase tracking-wider">
                  Acceso de Prueba Activo
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Te quedan <strong className="text-purple-600 dark:text-purple-400 font-bold">{daysRemaining ?? 7} días</strong> de uso completo sin costo.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      dismissTrialToast();
                      setIsPaywallOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#065F46] hover:bg-[#044331] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition"
                  >
                    Ver Planes
                  </button>
                  <button
                    onClick={dismissTrialToast}
                    className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 text-[9px] sm:text-[10px] font-semibold transition"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={dismissTrialToast}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2D1F47] text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Barra Superior 100% RESPONSIVE */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181126]/95 backdrop-blur-md border-b border-[#E9D5FF]/60 dark:border-[#2D1F47] px-3 sm:px-6 py-2.5 transition">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2E1065] dark:bg-[#C084FC] flex items-center justify-center text-white dark:text-[#2E1065] shadow-md flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v17M6 20h12" />
                <path d="M5 7l7-2 7 2" />
                <path d="M5 7L2 14h6L5 7z" />
                <path d="M19 7l-3 7h6l-3-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-extrabold text-[#2E1065] dark:text-[#E9D5FF] tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">VICTORIA BALANCE</span>
                <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#E9D5FF]/60 dark:bg-[#2D1F47] text-[#2E1065] dark:text-[#E9D5FF] border border-[#C084FC]/30">
                  v2.0
                </span>
                {isAdmin && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-[#D97706] text-white">
                    ADMIN
                  </span>
                )}
                {isTrialUser && !isAdmin && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    {daysRemaining ?? 7}D
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block">Gestión Financiera Diaria & Personal</p>
            </div>
          </div>

          {/* Acciones de Cabecera: Selector, Admin, Tema, Movimiento, Salir */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Selector de Mes */}
            <div className="flex items-center gap-1 bg-[#FAF8FC] dark:bg-[#1E1530] border border-[#E9D5FF] dark:border-[#382658] px-2 py-1 sm:py-1.5 rounded-xl">
              <CalendarIcon className="w-3.5 h-3.5 text-[#2E1065] dark:text-[#C084FC] flex-shrink-0" />
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-[#2E1065] dark:text-white focus:outline-none cursor-pointer w-[95px] sm:w-auto"
              />
            </div>

            {/* Botón Admin en Cabecera (visible en desktop) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab(activeTab === 'admin' ? 'inicio' : 'admin')}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border ${
                  activeTab === 'admin'
                    ? 'bg-[#2E1065] text-white border-[#C084FC]'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="Administrar Usuarios y Pagos"
              >
                <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Panel Admin</span>
              </button>
            )}

            {/* Toggle Modo Claro / Oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#2D1F47] transition"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#2E1065]" />}
            </button>

            {/* Botón de Movimiento (Desktop) */}
            <button
              onClick={() => handleOpenTransaction('EXPENSE')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#2E1065] text-white hover:bg-[#1f0a45] transition shadow-md shadow-purple-950/20"
            >
              <Plus className="w-3.5 h-3.5 text-[#E9D5FF]" />
              <span>+ Movimiento</span>
            </button>

            {/* Botón Salir SIEMPRE VISIBLE */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 flex-1">
        {loading && !dashboardData ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#E9D5FF] border-t-[#2E1065] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Sincronizando con base de datos...</p>
          </div>
        ) : (
          <>
            {activeTab === 'admin' && isAdmin && (
              <AdminView onBack={() => setActiveTab('inicio')} />
            )}

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

      {/* Navegación Inferior 100% RESPONSIVE EN MÓVILES */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#181126]/95 backdrop-blur-md border-t border-[#E9D5FF]/60 dark:border-[#2D1F47] py-2 px-2 z-40 shadow-xl">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => handleTabChange('inicio')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
              activeTab === 'inicio' ? 'text-[#2E1065] dark:text-[#C084FC] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">Inicio</span>
          </button>

          <button
            onClick={() => handleTabChange('movimientos')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
              activeTab === 'movimientos' ? 'text-[#2E1065] dark:text-[#C084FC] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">Movs</span>
          </button>

          {/* Botón Central Flotante para Añadir Movimiento */}
          <button
            onClick={() => handleOpenTransaction('EXPENSE')}
            className="w-11 h-11 -mt-5 rounded-full bg-[#2E1065] text-white flex items-center justify-center shadow-lg shadow-purple-950/30 hover:bg-[#1f0a45] active:scale-95 transition border-2 border-white dark:border-[#181126] flex-shrink-0"
            title="Registrar Gasto o Ingreso"
          >
            <Plus className="w-5 h-5 text-[#E9D5FF]" />
          </button>

          <button
            onClick={() => handleTabChange('presupuesto')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
              activeTab === 'presupuesto' ? 'text-[#2E1065] dark:text-[#C084FC] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">Presup</span>
          </button>

          <button
            onClick={() => handleTabChange('listas')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
              activeTab === 'listas' ? 'text-[#2E1065] dark:text-[#C084FC] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">Listas</span>
          </button>

          <button
            onClick={() => handleTabChange('conciliacion')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
              activeTab === 'conciliacion' ? 'text-[#2E1065] dark:text-[#C084FC] font-black' : 'text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px]">Concil</span>
          </button>

          {/* Pestaña Exclusiva de Panel Admin en el Celular para Administradores */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab(activeTab === 'admin' ? 'inicio' : 'admin')}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                activeTab === 'admin' ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-amber-500/70 hover:text-amber-600 font-medium'
              }`}
              title="Panel Admin"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px]">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modal de Registro de Movimiento */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        onSuccess={loadMainData}
        initialType={modalType}
      />

      {/* Modal de Monetización / Bloqueo por WhatsApp (Paywall) */}
      <PaywallModal
        isOpen={isPaywallOpen || (isTrialExpired && !isAdmin)}
        onClose={() => setIsPaywallOpen(false)}
        userEmail={user.email}
        userName={user.name}
        daysRemaining={daysRemaining ?? 7}
        isExpired={isTrialExpired && !isAdmin}
      />
    </div>
  );
}

export default App;
