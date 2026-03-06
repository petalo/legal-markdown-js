import { Scale, Play, Download, Printer, Copy, Upload, BarChart2 } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { OptionsPopover } from './OptionsPopover';
import { EXAMPLE_OPTIONS } from '@/lib/examples';
import { CSS_PRESET_OPTIONS } from '@/lib/css-examples';
import type { ProcessingOptions, ProcessingResult } from '@/types/legal-markdown';

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function IconButton({ label, onClick, children, disabled = false }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className="cursor-pointer h-8 w-8"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface ToolbarProps {
  isProcessing: boolean;
  result: ProcessingResult | null;
  options: ProcessingOptions;
  onProcess: () => void;
  onOptionsChange: (partial: Partial<ProcessingOptions>) => void;
  onExampleChange: (key: string) => void;
  onCSSPresetChange: (key: string) => void;
  onDownload: () => void;
  onPrint: () => void;
  onCopyMarkdown: () => void;
  onFileUpload: (file: File) => void;
  onMetadataOpen: () => void;
}

export function Toolbar({
  isProcessing,
  result,
  options,
  onProcess,
  onOptionsChange,
  onExampleChange,
  onCSSPresetChange,
  onDownload,
  onPrint,
  onCopyMarkdown,
  onFileUpload,
  onMetadataOpen,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="h-12 flex items-center gap-2 px-3 bg-slate-900 border-b border-slate-700 shrink-0">
      <div className="flex items-center gap-1.5 mr-2">
        <Scale className="h-4 w-4 text-green-500" />
        <span className="font-mono text-sm font-semibold text-slate-100">Legal MD</span>
      </div>
      <Separator orientation="vertical" className="h-5 bg-slate-700" />

      {/* defaultValue must match a key in EXAMPLE_OPTIONS from lib/examples.ts */}
      <Select onValueChange={onExampleChange} defaultValue="demo-contract">
        <SelectTrigger className="w-44 h-7 text-xs bg-slate-800 border-slate-700 cursor-pointer">
          <SelectValue placeholder="Load example..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {EXAMPLE_OPTIONS.map(({ value, label }) => (
            <SelectItem
              key={value}
              value={value}
              className="text-xs cursor-pointer text-slate-200 focus:bg-slate-700"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select onValueChange={onCSSPresetChange} defaultValue="default">
        <SelectTrigger className="w-36 h-7 text-xs bg-slate-800 border-slate-700 cursor-pointer">
          <SelectValue placeholder="CSS preset..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {CSS_PRESET_OPTIONS.map(({ value, label }) => (
            <SelectItem
              key={value}
              value={value}
              className="text-xs cursor-pointer text-slate-200 focus:bg-slate-700"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-5 bg-slate-700" />

      <Button
        size="sm"
        onClick={onProcess}
        disabled={isProcessing}
        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white cursor-pointer"
      >
        <Play className="h-3 w-3 mr-1" />
        {isProcessing ? 'Processing...' : 'Process'}
      </Button>

      <Separator orientation="vertical" className="h-5 bg-slate-700" />

      <IconButton label="Upload .md file" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" />
      </IconButton>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.txt"
        className="sr-only"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFileUpload(f);
        }}
      />
      <IconButton label="Download markdown" onClick={onDownload} disabled={!result}>
        <Download className="h-4 w-4" />
      </IconButton>
      <IconButton label="Print document" onClick={onPrint} disabled={!result}>
        <Printer className="h-4 w-4" />
      </IconButton>
      <IconButton label="Copy markdown" onClick={onCopyMarkdown} disabled={!result}>
        <Copy className="h-4 w-4" />
      </IconButton>

      <Separator orientation="vertical" className="h-5 bg-slate-700" />

      <OptionsPopover options={options} onChange={onOptionsChange} />

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onMetadataOpen}
        disabled={!result}
        className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100"
      >
        <BarChart2 className="h-3.5 w-3.5 mr-1" />
        Metadata
      </Button>
    </header>
  );
}
