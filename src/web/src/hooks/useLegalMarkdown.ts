import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { ProcessingOptions, ProcessingResult } from '../types/legal-markdown';
import { DEFAULT_EXAMPLE_KEY, EXAMPLES_MAP } from '../lib/examples';
import { DEFAULT_CSS_KEY, CSS_PRESETS } from '../lib/css-examples';
import { ensureHighlightCss } from '../lib/highlight-css';

const DEFAULT_OPTIONS: ProcessingOptions = {
  basePath: '.',
  enableFieldTracking: true,
  debug: false,
  yamlOnly: false,
  noHeaders: false,
  noClauses: false,
  noReferences: false,
  noImports: false,
  noMixins: false,
  noReset: false,
  noIndent: false,
  throwOnYamlError: false,
};

export interface UseLegalMarkdownReturn {
  content: string;
  setContent: (v: string) => void;
  customCSS: string;
  setCustomCSS: (v: string) => void;
  options: ProcessingOptions;
  setOptions: (o: Partial<ProcessingOptions>) => void;
  result: ProcessingResult | null;
  isProcessing: boolean;
  error: string | null;
  processNow: () => Promise<void>;
  downloadContent: (content: string, filename: string) => void;
  printDocument: () => void;
  copyContent: (content: string) => Promise<void>;
}

export function useLegalMarkdown(): UseLegalMarkdownReturn {
  const [content, setContentState] = useState(() => EXAMPLES_MAP[DEFAULT_EXAMPLE_KEY].content);
  const [customCSS, setCustomCSS] = useState(() => CSS_PRESETS[DEFAULT_CSS_KEY].css);
  const [options, setOptionsState] = useState<ProcessingOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOptions = useCallback((partial: Partial<ProcessingOptions>) => {
    setOptionsState(prev => ({ ...prev, ...partial }));
  }, []);

  const processNow = useCallback(async () => {
    if (!content.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await window.LegalMarkdown.processLegalMarkdownAsync(content, options);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setResult(null);
      toast.error('Processing failed', { description: msg });
    } finally {
      setIsProcessing(false);
    }
  }, [content, options]);

  // Always keep a ref pointing to the latest processNow so the debounce
  // timeout reads it at fire-time rather than at schedule-time. Without this,
  // switching documents quickly causes the timeout to process the previous
  // document (stale closure over old `content`).
  const processNowRef = useRef(processNow);
  processNowRef.current = processNow;

  const triggerDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => processNowRef.current(), 1000); // 1 s debounce - avoids re-processing on every keystroke
  }, []); // stable - reads processNowRef.current at fire-time, not at schedule-time

  const setContent = useCallback(
    (v: string) => {
      setContentState(v);
      triggerDebounced();
    },
    [triggerDebounced]
  );

  const downloadContent = useCallback((content: string, filename: string) => {
    const ext = filename.split('.').pop();
    const mimeType = ext === 'html' ? 'text/html' : ext === 'md' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const printDocument = useCallback(() => {
    if (!result) return;
    const { markdownToHtmlBody, wrapHtmlDocument } = window.LegalMarkdown;
    const html = markdownToHtmlBody(result.content);
    const title = (result.metadata?.title as string) || 'Legal Document';
    const doc = wrapHtmlDocument(
      html,
      ensureHighlightCss(customCSS, Boolean(options.enableFieldTracking)),
      title
    );
    // Inject a print-and-close script into the popup document. `document.write`
    // is used here because the popup window is freshly opened with a blank URL -
    // it has no src to navigate to - so assigning via write is the standard
    // approach for populating an about:blank window synchronously before close().
    const printScript = '<script>window.onload=function(){window.print();window.close();}</script>';
    const printDoc = doc.replace('</body>', `${printScript}</body>`);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(printDoc);
    win.document.close();
  }, [result, customCSS, options.enableFieldTracking]);

  const copyContent = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  }, []);

  return {
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
    printDocument,
    copyContent,
  };
}
