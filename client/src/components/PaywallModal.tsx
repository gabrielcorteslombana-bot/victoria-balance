import React from 'react';
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
  if (!isOpen) return null;

  const ADMIN_WHATSAPP = '573105780607';

  const message = encodeURIComponent(
    "Hola! Deseo activar mi suscripcion a Victoria Balance Premium\n\n" +
    "Nombre: " + (userName || "Usuario") + "\n" +
    "Correo: " + userEmail + "\n" +
    "Plan: Membresia Premium\n\n" +
    "Por favor enviame los datos de transferencia (Nequi / Daviplata / Bancolombia) para enviar el comprobante de pago."
  );

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#181126] rounded-3xl shadow-2xl border border-purple-200 dark:border-[#2D1F47] p-6 sm:p-8 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-36 h-36 ${isExpired ? 'bg-rose-500/15' : 'bg-purple-500/15'} rounded-full blur-3xl pointer-events-none`} />

        <div className="flex justify-between items-start mb-6">
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
                  ? 'Tu periodo de prueba ha terminado' 
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

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {isExpired
            ? 'Para continuar disfrutando de tu balance en tiempo real, conciliaciones y presupuestos privados, activa tu membresia de forma directa.'
            : 'Adquiere tu membresia oficial con tarifa preferencial y manten tu control financiero activo sin interrupciones.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl border-2 border-[#2E1065] dark:border-[#C084FC] bg-purple-50/50 dark:bg-purple-950/30 relative">
            <span className="absolute -top-2.5 right-3 bg-[#065F46] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
              Mas Recomendado
            </span>
            <div className="text-xs font-bold text-[#2E1065] dark:text-[#E9D5FF]">Acceso Anual</div>
            <div className="text-2xl font-black text-[#2E1065] dark:text-white mt-1">$99.000 <span className="text-xs font-normal text-slate-500">COP/ano</span></div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Ahorras mas del 40%</div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530]">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Acceso Mensual</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">$14.900 <span className="text-xs font-normal text-slate-500">COP/mes</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Cancela cuando quieras</div>
          </div>
        </div>

        <div className="space-y-2.5 mb-6 bg-slate-50 dark:bg-[#1E1530]/60 p-3.5 rounded-2xl border border-slate-100 dark:border-[#382658]">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tus datos financieros son 100% privados y aislados.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Actualizacion en tiempo real y conciliacion bancaria.</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Sin intermediarios: Transferencia Nequi / Daviplata (+57 310 578 0607).</span>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#065F46] hover:bg-[#044331] active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2.5"
        >
          <MessageCircle className="w-5 h-5 text-white" />
          <span>Activar Membresia por WhatsApp (310 578 0607)</span>
        </a>

        {isExpired ? (
          <p className="text-[11px] text-rose-500 font-semibold text-center mt-3 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tu cuenta se reactiva inmediatamente tras verificar el comprobante.</span>
          </p>
        ) : (
          <p className="text-[10px] text-slate-400 text-center mt-3">
            Envianos un mensaje y te ayudamos con la activacion de tu plan.
          </p>
        )}
      </div>
    </div>
  );
};
