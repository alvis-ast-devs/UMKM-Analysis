import { Check } from 'lucide-react';

interface ToastProps {
  msg: string | null;
}

export function Toast({ msg }: ToastProps) {
  if (!msg) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 transform translate-y-16 opacity-0 transition-all duration-300 pointer-events-none flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border bg-slate-900 text-white text-xs font-medium">
      <Check className="w-4 h-4 text-emerald-400" />
      <span>{msg}</span>
    </div>
  );
}
