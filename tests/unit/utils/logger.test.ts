import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/utils/logger';

describe('logger', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    logger.setDebugEnabled(false);
    logger.setLogLevel('debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('writes to stderr (not stdout) when debug enabled', () => {
      logger.setDebugEnabled(true);
      logger.debug('test message');
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] test message'));
      expect(stdoutSpy).not.toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'));
    });

    it('includes data in output', () => {
      logger.setDebugEnabled(true);
      logger.debug('with data', { key: 'value' });
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] with data'));
    });

    it('does not write when debug disabled', () => {
      logger.setDebugEnabled(false);
      logger.debug('silent');
      const allCalls = stderrSpy.mock.calls.map(c => c[0]);
      expect(allCalls.join('')).not.toContain('[DEBUG]');
    });
  });

  describe('info', () => {
    it('writes to stderr (not stdout)', () => {
      logger.info('info message');
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] info message'));
      expect(stdoutSpy).not.toHaveBeenCalledWith(expect.stringContaining('[INFO]'));
    });

    it('is suppressed by logLevel warn', () => {
      logger.setLogLevel('warn');
      logger.info('suppressed');
      const allCalls = stderrSpy.mock.calls.map(c => c[0]);
      expect(allCalls.join('')).not.toContain('[INFO]');
    });
  });

  describe('warn', () => {
    it('delegates to console.warn', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('warn message');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] warn message'), '');
      warnSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('delegates to console.error', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('error message');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] error message'), '');
      errorSpy.mockRestore();
    });
  });
});
