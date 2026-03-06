import { Copy, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProcessingResult } from '@/types/legal-markdown';

interface PreviewPanelProps {
  result: ProcessingResult | null;
  isProcessing: boolean;
  bodyHtml: string;
  formattedBody: string;
  fullDocument: string;
  activeTab: 'rendered' | 'markdown' | 'html' | 'html-doc';
  onTabChange: (tab: 'rendered' | 'markdown' | 'html' | 'html-doc') => void;
  customCSS: string;
  onCopyHTML: (html: string) => void;
  onProcess: () => void;
}

export function PreviewPanel({
  result,
  isProcessing,
  bodyHtml,
  formattedBody,
  fullDocument,
  activeTab,
  onTabChange,
  customCSS,
  onCopyHTML,
  onProcess,
}: PreviewPanelProps) {
  // Shared Tailwind class string applied to every tab trigger in this panel.
  const tabTrigger = 'text-xs h-6 cursor-pointer data-[state=active]:bg-slate-700';

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <Tabs
        value={activeTab}
        onValueChange={v => onTabChange(v as 'rendered' | 'markdown' | 'html' | 'html-doc')}
        className="flex flex-col h-full"
      >
        <div className="flex items-center justify-between px-3 py-1 border-b border-slate-700 shrink-0">
          <TabsList className="h-7 bg-slate-800">
            <TabsTrigger value="rendered" className={tabTrigger}>
              Rendered
            </TabsTrigger>
            <TabsTrigger value="markdown" className={tabTrigger}>
              Markdown
            </TabsTrigger>
            <TabsTrigger value="html" className={tabTrigger}>
              HTML
            </TabsTrigger>
            <TabsTrigger value="html-doc" className={tabTrigger}>
              HTML Document
            </TabsTrigger>
          </TabsList>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                aria-label="Copy HTML"
                onClick={() => onCopyHTML(formattedBody)}
                disabled={!result}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy HTML</TooltipContent>
          </Tooltip>
        </div>

        <TabsContent value="rendered" className="flex-1 m-0 overflow-auto">
          {isProcessing ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 bg-slate-700" />
              <Skeleton className="h-4 w-full bg-slate-700" />
              <Skeleton className="h-4 w-5/6 bg-slate-700" />
            </div>
          ) : result ? (
            <iframe
              srcDoc={
                `<!DOCTYPE html><html><head><style>${customCSS}</style></head>` +
                `<body>${bodyHtml}</body></html>`
              }
              className="w-full h-full border-0 bg-white"
              title="Rendered preview"
              // `allow-same-origin` is required so the iframe can access the
              // injected srcDoc styles and scripts from its own origin context.
              // `allow-scripts` enables any JS the rendered legal document may
              // include (e.g. print triggers). Both flags together mean the
              // sandbox does not add XSS protection against same-origin content;
              // this is intentional because we control the srcdoc source.
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 text-sm">
              <span>Process a document to see the rendered output</span>
              <Button
                size="sm"
                onClick={onProcess}
                aria-label="Process document"
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              >
                <Play className="h-3 w-3 mr-1" />
                Process
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="markdown" className="flex-1 m-0 overflow-auto">
          <pre className="p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {result?.content ?? '// No output yet'}
          </pre>
        </TabsContent>

        <TabsContent value="html" className="flex-1 m-0 overflow-auto">
          <pre className="p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {formattedBody || '<!-- No output yet -->'}
          </pre>
        </TabsContent>

        <TabsContent value="html-doc" className="flex-1 m-0 overflow-auto">
          <pre className="p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {fullDocument || '<!-- No output yet -->'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
