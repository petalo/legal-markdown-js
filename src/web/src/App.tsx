import React, { useState, useCallback, useMemo } from 'react';
import { Scale, Play, Download, Printer, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorPanel } from '@/components/EditorPanel';
import { CSSEditorPanel } from '@/components/CSSEditorPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { MetadataSheet } from '@/components/MetadataSheet';
import { StatusBar } from '@/components/StatusBar';
import { OptionsPopover } from '@/components/OptionsPopover';
import { useLegalMarkdown } from '@/hooks/useLegalMarkdown';
import { EXAMPLES_MAP, EXAMPLE_OPTIONS, DEFAULT_EXAMPLE_KEY } from '@/lib/examples';
import { CSS_PRESETS, CSS_PRESET_OPTIONS, DEFAULT_CSS_KEY } from '@/lib/css-examples';
import { ensureHighlightCss } from '@/lib/highlight-css';

function IconButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
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

export default function App() {
  const {
    content,
    setContent,
    customCSS,
    setCustomCSS,
    options,
    setOptions,
    result,
    isProcessing,
    error,
    processNow,
    downloadContent,
    downloadDocx,
    printDocument,
    copyContent,
  } = useLegalMarkdown();

  const [metadataOpen, setMetadataOpen] = useState(false);
  const [currentCSSPresetKey, setCurrentCSSPresetKey] = useState(DEFAULT_CSS_KEY);
  const [isDocxLoading, setIsDocxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rendered' | 'markdown' | 'html' | 'html-doc'>(
    'rendered'
  );

  const { bodyHtml, formattedBody, fullDocument } = useMemo(() => {
    if (!result) return { bodyHtml: '', formattedBody: '', fullDocument: '' };
    const lib = window.LegalMarkdown;
    const effectiveCss = ensureHighlightCss(customCSS, Boolean(options.enableFieldTracking));
    const raw = lib.markdownToHtmlBody(result.content);
    const formatted = lib.formatHtml(raw);
    const doc = lib.wrapHtmlDocument(
      raw,
      effectiveCss,
      (result.metadata?.title as string) || 'Legal Document'
    );
    return { bodyHtml: raw, formattedBody: formatted, fullDocument: doc };
  }, [result, customCSS, options.enableFieldTracking]);

  const getTabContent = useCallback((): { content: string; filename: string; label: string } => {
    // Strip any character that is not a letter or digit so the derived
    // filename is safe across all operating systems and download targets.
    const title = ((result?.metadata?.title as string) || 'legal-document').replace(
      /[^a-zA-Z0-9]/g,
      '-'
    );
    switch (activeTab) {
      case 'markdown':
        return { content: result?.content ?? '', filename: `${title}.md`, label: 'Markdown' };
      case 'html':
        return { content: formattedBody, filename: `${title}-body.html`, label: 'HTML' };
      case 'rendered':
      case 'html-doc':
      default:
        return { content: fullDocument, filename: `${title}.html`, label: 'HTML Document' };
    }
  }, [activeTab, result, formattedBody, fullDocument]);

  const handleDownload = useCallback(() => {
    const { content, filename } = getTabContent();
    if (content) downloadContent(content, filename);
  }, [getTabContent, downloadContent]);

  const handleCopy = useCallback(async () => {
    const { content } = getTabContent();
    if (content) await copyContent(content);
  }, [getTabContent, copyContent]);

  const handleDownloadDocx = useCallback(async () => {
    if (!result || !bodyHtml) return;
    setIsDocxLoading(true);
    try {
      const title = (result.metadata?.title as string) || 'legal-document';
      const effectiveCss = ensureHighlightCss(customCSS, Boolean(options.enableFieldTracking));
      await downloadDocx(bodyHtml, effectiveCss, title);
    } catch (err) {
      toast.error('DOCX generation failed', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsDocxLoading(false);
    }
  }, [result, bodyHtml, customCSS, options.enableFieldTracking, downloadDocx]);

  const handleExampleChange = useCallback(
    (key: string) => {
      const example = EXAMPLES_MAP[key];
      if (example) setContent(example.content);
    },
    [setContent]
  );

  const handleCSSPresetChange = useCallback(
    (key: string) => {
      const preset = CSS_PRESETS[key];
      if (preset) {
        setCustomCSS(preset.css);
        setCurrentCSSPresetKey(key);
      }
    },
    [setCustomCSS]
  );

  const handleCSSReset = useCallback(() => {
    const preset = CSS_PRESETS[currentCSSPresetKey];
    if (preset) setCustomCSS(preset.css);
  }, [currentCSSPresetKey, setCustomCSS]);

  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processNow();
      }
    },
    [processNow]
  );

  const handleCopyHTML = useCallback((html: string) => copyContent(html), [copyContent]);

  const { label: copyLabel } = getTabContent();

  const inputHeaderLeft = (
    <div className="flex items-center gap-1.5">
      <Scale className="h-4 w-4 text-green-500 shrink-0" />
      <span className="font-mono text-sm font-semibold text-slate-100">Legal MD</span>
      <Separator orientation="vertical" className="h-4 bg-slate-700 mx-1" />
      <Select onValueChange={handleExampleChange} defaultValue={DEFAULT_EXAMPLE_KEY}>
        <SelectTrigger className="w-40 h-6 text-xs bg-slate-800 border-slate-700 cursor-pointer">
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
    </div>
  );

  const cssHeaderLeft = (
    <Select onValueChange={handleCSSPresetChange} defaultValue="default">
      <SelectTrigger className="w-36 h-6 text-xs bg-slate-800 border-slate-700 cursor-pointer">
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
  );

  return (
    <TooltipProvider delayDuration={300}>
      {' '}
      {/* ms before tooltip appears on hover */}
      <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Panel sizes are percentages; 30 + 20 + 50 = 100 */}
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            <ResizablePanel defaultSize={30} minSize={15}>
              <EditorPanel
                content={content}
                onChange={setContent}
                onKeyDown={handleEditorKeyDown}
                headerLeft={inputHeaderLeft}
              />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="bg-slate-700 hover:bg-green-500/40 transition-colors"
            />

            <ResizablePanel defaultSize={20} minSize={10}>
              <CSSEditorPanel
                css={customCSS}
                onChange={setCustomCSS}
                onReset={handleCSSReset}
                headerLeft={cssHeaderLeft}
              />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="bg-slate-700 hover:bg-green-500/40 transition-colors"
            />

            <ResizablePanel defaultSize={50} minSize={20}>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-1.5 px-3 h-10 bg-slate-900 border-b border-slate-700 shrink-0">
                  <Button
                    size="sm"
                    onClick={processNow}
                    disabled={isProcessing}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white cursor-pointer shrink-0"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {isProcessing ? 'Processing...' : 'Process'}
                  </Button>
                  <Separator orientation="vertical" className="h-5 bg-slate-700 mx-0.5" />
                  <IconButton
                    label={`Download ${copyLabel}`}
                    onClick={handleDownload}
                    disabled={!result}
                  >
                    <Download className="h-4 w-4" />
                  </IconButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!result}
                    className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100 px-2"
                  >
                    Copy {copyLabel}
                  </Button>
                  <IconButton label="Print document" onClick={printDocument} disabled={!result}>
                    <Printer className="h-4 w-4" />
                  </IconButton>
                  <Separator orientation="vertical" className="h-5 bg-slate-700 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadDocx}
                    disabled={!result || isDocxLoading}
                    className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100 px-2"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    {isDocxLoading ? '...' : '.docx'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={printDocument}
                    disabled={!result}
                    className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100 px-2"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    .pdf
                  </Button>
                  <Separator orientation="vertical" className="h-5 bg-slate-700 mx-0.5" />
                  <OptionsPopover options={options} onChange={setOptions} />
                  <Separator orientation="vertical" className="h-5 bg-slate-700 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMetadataOpen(true)}
                    disabled={!result}
                    className="h-7 text-xs cursor-pointer text-slate-300 hover:text-slate-100"
                  >
                    <BarChart2 className="h-3.5 w-3.5 mr-1" />
                    Metadata
                  </Button>
                </div>
                <div className="flex-1 min-h-0">
                  <PreviewPanel
                    result={result}
                    isProcessing={isProcessing}
                    bodyHtml={bodyHtml}
                    formattedBody={formattedBody}
                    fullDocument={fullDocument}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    customCSS={ensureHighlightCss(customCSS, Boolean(options.enableFieldTracking))}
                    onCopyHTML={handleCopyHTML}
                    onProcess={processNow}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <StatusBar isProcessing={isProcessing} error={error} result={result} />
      </div>
      <MetadataSheet open={metadataOpen} onOpenChange={setMetadataOpen} result={result} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: 'bg-slate-800 border-slate-700 text-slate-100',
            description: 'text-slate-400',
            actionButton: 'bg-green-600',
          },
        }}
      />
    </TooltipProvider>
  );
}
