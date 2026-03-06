import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ProcessingResult } from '@/types/legal-markdown';

interface StatusBarProps {
  isProcessing: boolean;
  error: string | null;
  result: ProcessingResult | null;
}

export function StatusBar({ isProcessing, error, result }: StatusBarProps) {
  const fields = result?.fieldReport?.fields.size ?? 0;
  const words = result?.content ? result.content.split(/\s+/).filter(Boolean).length : 0;
  const warnings = result?.warnings?.length ?? 0;

  return (
    <footer className="h-8 flex items-center gap-4 px-3 bg-slate-900 border-t border-slate-700 text-xs text-slate-400 shrink-0">
      <div className="flex items-center gap-1.5">
        {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-green-400" />}
        {!isProcessing && !error && result && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        {!isProcessing && error && <XCircle className="h-3 w-3 text-red-400" />}
        <span
          className={error ? 'text-red-400' : isProcessing ? 'text-green-400' : 'text-slate-400'}
        >
          {isProcessing ? 'Processing...' : error ? 'Error' : result ? 'Ready' : 'Idle'}
        </span>
      </div>
      <span className="text-slate-600">|</span>
      <span>{words} words</span>
      <span className="text-slate-600">|</span>
      <span>{fields} fields</span>
      {warnings > 0 && (
        <>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">{warnings} warnings</span>
        </>
      )}
    </footer>
  );
}
