import React, { useState } from 'react';
import { X, MessageCircle, ShieldCheck, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  daysRemaining?: number;
  isExpired?: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  daysRemaining = 0,
  isExpired = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'SEMESTER' | 'ANNUAL'>('ANNUAL');

  if (!isOpen) return null;

  const ADMIN_WHATSAPP = '573105780607';

  const planText = selectedPlan === 'ANNUAL' 
    ? 'Membresia Anual ($99.000 COP/ano - Ahorro 45%)' 
    : selectedPlan === 'SEMESTER' 
    ? 'Membresia Semestral ($59.000 COP/6 meses - Ahorro 34%)' 
    : 'Membresia Mensual ($14.900 COP/mes)';

  const message = encodeURIComponent(
    `Hola! Deseo activar mi suscripcion a Victoria Balance Premium\n\n` +
    `Nombre: ${userName || 'Usuario'}\n` +
    `Correo: ${userEmail}\n` +
    `Plan Elegido: ${planText}\n\n` +
    `Por favor enviame los datos de transferencia (Nequi / Daviplata / Bancolombia) para enviar el comprobante de pago.`
  );

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#181126] rounded-3xl shadow-2xl border border-purple-200 dark:border-[#2D1F47] p-6 sm:p-8 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-36 h-36 ${isExpired ? 'bg-rose-500/15' : 'bg-purple-500/15'} rounded-full blur-3xl pointer-events-none`} />

        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${isExpired ? 'bg-gradient-to-tr from-rose-700 to-rose-500' : 'bg-gradient-to-tr from-[#2E1065] to-[#5B21B6]'} text-white flex items-center justify-center shadow-lg`}>
              {isExpired ? <Lock className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-[#E9D5FF]" />}
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isExpired 
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
              }`}>
                {isExpired ? 'Periodo Finalizado' : 'Prueba Gratuita'}
              </span>
              <h3 className="text-xl font-black text-[#2E1065] dark:text-white tracking-tight mt-1">
                {isExpired 
                  ? 'Tu periodo de prueba ha finalizado' 
                  : `Te quedan ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'} de prueba`}
              </h3>
            </div>
          </div>

          {!isExpired && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2D1F47] text-slate-400 hover:text-slate-600 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
          {isExpired
            ? 'Para continuar gestionando tus ingresos, gastos diarios, conciliaciones y presupuestos privados, selecciona tu plan preferido:'
            : 'Asegura tu tarifa preferencial hoy mismo y mantén el control de tus finanzas personales sin interrupciones:'}
        </p>

        {/* 3 Opciones de Planes: Mensual, Semestral y Anual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Mensual */}
          <div 
            onClick={() => setSelectedPlan('MONTHLY')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative ${
              selectedPlan === 'MONTHLY' 
                ? 'border-[#2E1065] dark:border-[#C084FC] bg-purple-50/60 dark:bg-purple-950/40 shadow-sm' 
                : 'border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Mensual</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">$14.900</div>
            <div className="text-[10px] text-slate-400">COP / mes</div>
            <div className="text-[9px] text-slate-400 mt-2">Flexibilidad total</div>
          </div>

          {/* Semestral */}
          <div 
            onClick={() => setSelectedPlan('SEMESTER')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative ${
              selectedPlan === 'SEMESTER' 
                ? 'border-[#2E1065] dark:border-[#C084FC] bg-purple-50/60 dark:bg-purple-950/40 shadow-sm' 
                : 'border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] hover:border-slate-300'
            }`}
          >
            <span className="absolute -top-2.5 right-2 bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full">
              Ahorra 34%
            </span>
            <div className="text-[11px] font-bold text-[#2E1065] dark:text-[#E9D5FF]">Semestral</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">$59.000</div>
            <div className="text-[10px] text-slate-400">COP / 6 meses</div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">$9.833 / mes</div>
          </div>

          {/* Anual */}
          <div 
            onClick={() => setSelectedPlan('ANNUAL')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition relative ${
              selectedPlan === 'ANNUAL' 
                ? 'border-[#2E1065] dark:border-[#C084FC] bg-purple-50/60 dark:bg-purple-950/40 shadow-sm' 
                : 'border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530] hover:border-slate-300'
            }`}
          >
            <span className="absolute -top-2.5 right-2 bg-[#065F46] text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full">
              Mejor Valor
            </span>
            <div className="text-[11px] font-bold text-[#2E1065] dark:text-[#E9D5FF]">Anual</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1">$99.000</div>
            <div className="text-[10px] text-slate-400">COP / 12 meses</div>
            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">Ahorro de $79.800</div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="space-y-2 mb-5 bg-slate-50 dark:bg-[#1E1530]/60 p-3 rounded-2xl border border-slate-100 dark:border-[#382658]">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Datos 100% aislados y encriptados en la nube.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Pago directo sin comisiones bancarias a <strong>WhatsApp (310 578 0607)</strong>.</span>
          </div>
        </div>

        {/* Boton WhatsApp con plan preseleccionado */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#065F46] hover:bg-[#044331] active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2.5"
        >
          <MessageCircle className="w-5 h-5 text-white" />
          <span>Activar Plan {selectedPlan === 'ANNUAL' ? 'Anual' : selectedPlan === 'SEMESTER' ? 'Semestral' : 'Mensual'} por WhatsApp</span>
        </a>

        {isExpired ? (
          <p className="text-[11px] text-rose-500 font-semibold text-center mt-3 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tu cuenta se reactiva inmediatamente tras verificar el comprobante.</span>
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 text-center mt-3">
            Transferencias por Nequi, Daviplata o PSE disponibles.
          </p>
        )}
      </div>
    </div>
  );
};
