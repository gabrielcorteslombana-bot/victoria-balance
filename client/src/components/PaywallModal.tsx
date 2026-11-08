import React from 'react';
import { X, MessageCircle, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  daysRemaining?: number;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  daysRemaining = 0,
}) => {
  if (!isOpen) return null;

  // Teléfono del administrador para recibir pagos directamente
  // Si deseas cambiarlo en el futuro, solo actualizamos este número
  const ADMIN_WHATSAPP = '573000000000'; // Formato internacional sin símbolos

  const message = encodeURIComponent(
    `Hola! Deseo activar mi suscripción a Victoria Balance ✨\n\n` +
    `• Nombre: ${userName || 'Usuario'}\n` +
    `• Correo: ${userEmail}\n` +
    `• Plan: Membresía Anual / Mensual\n\n` +
    `Por favor envíame los datos de transferencia (Nequi / Daviplata / Bancolombia) para enviar el comprobante de pago.`
  );

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#181126] rounded-3xl shadow-2xl border border-purple-100 dark:border-[#2D1F47] p-6 sm:p-8 relative overflow-hidden">
        {/* Adorno visual */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E9D5FF]/30 dark:bg-[#C084FC]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2E1065] to-[#5B21B6] text-white flex items-center justify-center shadow-md shadow-purple-950/20">
              <ShieldCheck className="w-6 h-6 text-[#E9D5FF]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60">
                Victoria Balance Premium
              </span>
              <h3 className="text-xl font-black text-[#2E1065] dark:text-white tracking-tight mt-1">
                {daysRemaining > 0 ? `Te quedan ${daysRemaining} días de prueba` : 'Tu período de prueba ha finalizado'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2D1F47] text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Continúa disfrutando de control financiero diario, reportes en tiempo real, conciliaciones y listas de compras ilimitadas con acceso directo sin intermediarios.
        </p>

        {/* Planes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl border-2 border-[#2E1065] dark:border-[#C084FC] bg-purple-50/40 dark:bg-purple-950/30 relative">
            <span className="absolute -top-2.5 right-3 bg-[#065F46] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
              Más Popular
            </span>
            <div className="text-xs font-bold text-[#2E1065] dark:text-[#E9D5FF]">Acceso Anual</div>
            <div className="text-2xl font-black text-[#2E1065] dark:text-white mt-1">$99.000 <span className="text-xs font-normal text-slate-500">COP/año</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Ahorras más del 40%</div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#382658] bg-white dark:bg-[#1E1530]">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Acceso Mensual</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">$14.900 <span className="text-xs font-normal text-slate-500">COP/mes</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Sin cláusulas de permanencia</div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Registro y consulta de movimientos ilimitados 24/7.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Presupuestos mensuales por categoría y estadísticas en vivo.</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Activación directa por Nequi, Daviplata o PSE (0% comisiones).</span>
          </div>
        </div>

        {/* Botón WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#065F46] hover:bg-[#044331] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Activar Membresía por WhatsApp</span>
        </a>

        <p className="text-[10px] text-slate-400 text-center mt-3">
          Al hacer clic te comunicas directamente con soporte para recibir datos de pago y activar tu cuenta en minutos.
        </p>
      </div>
    </div>
  );
};
