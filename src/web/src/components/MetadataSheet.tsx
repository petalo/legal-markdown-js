import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import type { ProcessingResult, TrackedField } from '@/types/legal-markdown';

function badgeClass(status: string): string {
  if (status === 'filled') return 'bg-green-900 text-green-300 border-green-700';
  if (status === 'empty') return 'bg-amber-900 text-amber-300 border-amber-700';
  if (status === 'declared') return 'bg-slate-800 text-slate-500 border-slate-600';
  return 'bg-slate-700 text-slate-400 border-slate-600';
}

interface MetadataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ProcessingResult | null;
}

export function MetadataSheet({ open, onOpenChange, result }: MetadataSheetProps) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const fields: Map<string, TrackedField> = result?.fieldReport?.fields ?? new Map();
  const stats = result?.stats;
  const warnings = result?.warnings ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* w-[480px]: design-spec width for the metadata drawer */}
      <SheetContent
        side="right"
        className="w-[480px] bg-slate-900 border-slate-700 text-slate-100 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="text-slate-100 font-mono">Metadata &amp; Diagnostics</SheetTitle>
        </SheetHeader>

        {stats && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Processing Stats
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Time', value: `${stats.processingTime}ms` },
                { label: 'Fields', value: stats.fieldsTracked },
                { label: 'X-Refs', value: stats.crossReferencesFound },
                {
                  label: 'Warnings',
                  value: warnings.length,
                  amber: warnings.length > 0,
                },
              ].map(({ label, value, amber }) => (
                <div key={label} className="bg-slate-800 rounded p-2">
                  <div className="text-slate-400 text-xs">{label}</div>
                  <div className={`font-mono ${amber ? 'text-amber-400' : 'text-slate-100'}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Warnings
            </p>
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="text-xs text-amber-300 bg-amber-900/30 border border-amber-800 rounded px-2 py-1.5"
                >
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="bg-slate-700 my-4" />

        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            YAML Variables ({fields.size})
          </p>
          {fields.size === 0 ? (
            <p className="text-xs text-slate-500">
              No fields tracked. Enable field tracking in Options.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-1.5 font-medium">Field</th>
                  <th className="text-left py-1.5 font-medium">Value</th>
                  <th className="text-left py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(fields.values()).map(f => (
                  <tr key={f.name} className="border-b border-slate-800">
                    <td className="py-1.5 font-mono text-slate-300">{f.name}</td>
                    <td className="py-1.5 text-slate-400 max-w-[120px] truncate">
                      {String(f.value ?? '-')}
                    </td>
                    <td className="py-1.5">
                      <Badge className={`text-xs px-1.5 py-0 border ${badgeClass(f.status)}`}>
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Separator className="bg-slate-700 my-4" />

        <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-300">
            {jsonOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Raw Metadata JSON
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 text-xs text-slate-300 font-mono bg-slate-950 rounded p-3 overflow-auto max-h-64">
              {JSON.stringify(result?.metadata ?? {}, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        {!result && (
          <p className="text-slate-500 text-sm text-center mt-8">
            Process a document to see metadata.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
