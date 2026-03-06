import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ProcessingResult } from '../../types/legal-markdown';

// Mock the examples module because import.meta.glob is a Vite build-time feature
vi.mock('../../lib/examples', () => ({
  DEFAULT_EXAMPLE_KEY: 'test-example',
  EXAMPLES_MAP: {
    'test-example': {
      key: 'test-example',
      title: 'Test',
      content: '---\ntitle: Test\n---\n# Test',
    },
  },
  EXAMPLES: [{ key: 'test-example', title: 'Test', content: '---\ntitle: Test\n---\n# Test' }],
  EXAMPLE_OPTIONS: [{ value: 'test-example', label: 'Test' }],
}));

// Must import after vi.mock so the mock is in place
const { useLegalMarkdown } = await import('../useLegalMarkdown');

const mockResult: ProcessingResult = {
  content: '# Processed',
  metadata: { title: 'Test' },
  fieldReport: {
    totalFields: 1,
    uniqueFields: 1,
    fields: new Map([
      ['title', { name: 'title', value: 'Test', status: 'filled', hasLogic: false }],
    ]),
  },
  stats: { processingTime: 10, pluginsUsed: [], crossReferencesFound: 0, fieldsTracked: 1 },
  warnings: [],
};

const mockProcess = vi.fn().mockResolvedValue(mockResult);

beforeEach(() => {
  vi.stubGlobal('LegalMarkdown', { processLegalMarkdownAsync: mockProcess });
  mockProcess.mockClear();
});

describe('useLegalMarkdown', () => {
  it('starts with null result and not processing', () => {
    const { result } = renderHook(() => useLegalMarkdown());
    expect(result.current.result).toBeNull();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets content via setContent', () => {
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setContent('hello'));
    expect(result.current.content).toBe('hello');
  });

  it('calls processLegalMarkdownAsync when processNow is called', async () => {
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setContent('# Hello'));
    await act(() => result.current.processNow());
    expect(mockProcess).toHaveBeenCalledOnce();
    expect(mockProcess).toHaveBeenCalledWith(
      '# Hello',
      expect.objectContaining({ basePath: '.', enableFieldTracking: true })
    );
  });

  it('does not send exportMetadata to the processor', async () => {
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setContent('# Hello'));
    await act(() => result.current.processNow());
    const calledOptions = mockProcess.mock.calls[0][1];
    expect(calledOptions).not.toHaveProperty('exportMetadata');
  });

  it('updates result after successful processing', async () => {
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setContent('# Hello'));
    await act(() => result.current.processNow());
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.error).toBeNull();
  });

  it('sets error on processing failure', async () => {
    mockProcess.mockRejectedValueOnce(new Error('parse error'));
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setContent('bad content'));
    await act(() => result.current.processNow());
    expect(result.current.error).toBe('parse error');
    expect(result.current.result).toBeNull();
  });

  it('updates option via setOptions', () => {
    const { result } = renderHook(() => useLegalMarkdown());
    act(() => result.current.setOptions({ noHeaders: true }));
    expect(result.current.options.noHeaders).toBe(true);
    expect(result.current.options.enableFieldTracking).toBe(true);
  });

  it('does not call processNow if content is empty', async () => {
    const { result } = renderHook(() => useLegalMarkdown());
    // Do not set any content (starts with demo-contract content from EXAMPLES)
    // Clear it first
    act(() => result.current.setContent(''));
    await act(() => result.current.processNow());
    expect(mockProcess).not.toHaveBeenCalled();
  });
});
