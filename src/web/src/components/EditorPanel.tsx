import { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EditorPanelProps {
  content: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  headerLeft?: React.ReactNode;
}

export function EditorPanel({ content, onChange, onKeyDown, headerLeft }: EditorPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {headerLeft ?? (
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Input
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                aria-label="Upload .md file"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload .md file</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                aria-label="Clear editor"
                onClick={() => onChange('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt"
        className="sr-only"
        onChange={handleFileUpload}
      />
      <textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        className="flex-1 w-full resize-none bg-slate-950 text-slate-100 font-mono text-sm p-3 focus:outline-none leading-relaxed"
        placeholder="Paste or type legal markdown here..."
      />
    </div>
  );
}
