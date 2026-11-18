import { useState } from 'react';
import { Code2, ChevronDown, Copy } from 'lucide-react';

interface RawJsonAccordionProps {
  payload: Record<string, unknown>;
  response: unknown;
}

export function RawJsonAccordion({ payload, response }: RawJsonAccordionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 tracking-tight">
            Lihat Rincian Angka Mentah (Raw JSON Payload & Response)
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span className="text-[11px] font-mono text-slate-600 hidden sm:inline">Inspect Metrics</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 bg-slate-950 text-slate-200">
          <div className="flex items-center justify-between py-2 text-[11px] font-mono text-slate-400 border-b border-slate-800">
            <span>FastAPI HTTP Response payload</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Tersalin!' : 'Salin JSON'}
            </button>
          </div>
          <pre className="mt-2.5 p-3 rounded-xl bg-slate-900/90 text-[11px] font-mono overflow-x-auto text-emerald-400 border border-slate-800 leading-snug">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
