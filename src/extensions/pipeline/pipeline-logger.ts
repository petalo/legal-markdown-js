/**
 * @fileoverview Pipeline Logging System for Legal Markdown Processing
 *
 * This module provides comprehensive logging capabilities for the Legal Markdown
 * processing pipeline. It supports multiple logging levels, structured output,
 * performance metrics, and integration with external monitoring systems.
 *
 * Features:
 * - Structured logging with consistent format
 * - Performance metrics and timing
 * - Debug output with step-by-step visibility
 * - Error tracking and reporting
 * - Configurable log levels and outputs
 * - Integration with pipeline events
 * - Memory usage tracking
 * - Field tracking logging
 *
 * @example
 * ```typescript
 * import { PipelineLogger, ConsolePipelineLogger } from './pipeline-logger';
 *
 * const logger = new ConsolePipelineLogger({
 *   level: 'debug',
 *   enableMetrics: true,
 *   enableColors: true
 * });
 *
 * logger.startPipeline({ steps: [], fieldTrackingMode: 'centralized' });
 * logger.startStep('mixins', 1500);
 * logger.completeStep('mixins', stepResult);
 * logger.completePipeline(pipelineResult);
 * ```
 */

import { PipelineConfig, PipelineResult, StepResult, ProcessingError } from './types';

/**
 * Log level enumeration for controlling output verbosity
 *
 * @enum {string} LogLevel
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

/**
 * Configuration options for pipeline loggers
 *
 * @interface PipelineLoggerConfig
 * @example
 * ```typescript
 * const config: PipelineLoggerConfig = {
 *   level: LogLevel.DEBUG,
 *   enableMetrics: true,
 *   enableColors: true,
 *   enableTimestamps: true,
 *   prefix: '[LEGAL-MD]',
 *   outputFormat: 'structured'
 * };
 * ```
 */
export interface PipelineLoggerConfig {
  /** Minimum log level to output */
  level?: LogLevel;

  /** Whether to enable performance metrics collection */
  enableMetrics?: boolean;

  /** Whether to use colors in console output */
  enableColors?: boolean;

  /** Whether to include timestamps in log messages */
  enableTimestamps?: boolean;

  /** Prefix for all log messages */
  prefix?: string;

  /** Output format style */
  outputFormat?: 'simple' | 'structured' | 'json';

  /** Whether to track memory usage */
  enableMemoryTracking?: boolean;
}

/**
 * Base interface for pipeline logging systems
 *
 * @interface PipelineLogger
 * @example
 * ```typescript
 * class CustomLogger implements PipelineLogger {
 *   startPipeline(config: PipelineConfig): void {
 *     this.log('info', 'Pipeline starting with config', config);
 *   }
 *
 *   startStep(stepName: string, inputSize: number): void {
 *     this.log('debug', `Step ${stepName} starting`, { inputSize });
 *   }
 * }
 * ```
 */
export interface PipelineLogger {
  /**
   * Called when pipeline execution begins
   *
   * @param config - Pipeline configuration
   */
  startPipeline(config: PipelineConfig): void;

  /**
   * Called when a step begins execution
   *
   * @param stepName - Name of the step starting
   * @param inputSize - Size of input content in characters
   */
  startStep(stepName: string, inputSize: number): void;

  /**
   * Called when a step completes successfully
   *
   * @param stepName - Name of the completed step
   * @param result - Step execution result
   */
  completeStep(stepName: string, result: StepResult): void;

  /**
   * Called when a step is skipped
   *
   * @param stepName - Name of the skipped step
   * @param reason - Reason for skipping
   */
  skipStep(stepName: string, reason: string): void;

  /**
   * Called when a step encounters an error
   *
   * @param stepName - Name of the failed step
   * @param error - Error that occurred
   */
  errorStep(stepName: string, error: ProcessingError): void;

  /**
   * Called when the entire pipeline completes
   *
   * @param result - Complete pipeline result
   */
  completePipeline(result: PipelineResult): void;

  /**
   * Called when the pipeline fails critically
   *
   * @param error - Critical error that caused failure
   */
  errorPipeline(error: ProcessingError): void;

  /**
   * Log field tracking information
   *
   * @param fieldName - Name of the field
   * @param action - Action performed on the field
   * @param metadata - Additional field metadata
   */
  logFieldTracking(fieldName: string, action: string, metadata?: Record<string, any>): void;

  /**
   * Generate a complete pipeline execution report
   *
   * @returns Formatted report string
   */
  generateReport(): string;
}

/**
 * Console-based pipeline logger with rich formatting
 *
 * @class ConsolePipelineLogger
 * @example
 * ```typescript
 * const logger = new ConsolePipelineLogger({
 *   level: LogLevel.DEBUG,
 *   enableColors: true,
 *   enableMetrics: true
 * });
 *
 * // Use with pipeline manager
 * const pipeline = new PipelineManager(logger);
 * ```
 */
export class ConsolePipelineLogger implements PipelineLogger {
  private config: Required<PipelineLoggerConfig>;
  private startTime: number = 0;
  private stepTimings: Map<string, number> = new Map();
  private metrics: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    skippedSteps: number;
    totalFieldsTracked: number;
    totalProcessingTime: number;
    memoryPeakUsage: number;
  } = {
    totalSteps: 0,
    successfulSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    totalFieldsTracked: 0,
    totalProcessingTime: 0,
    memoryPeakUsage: 0,
  };

  constructor(config: PipelineLoggerConfig = {}) {
    // Default to ERROR level for quiet operation, can be overridden with LOG_LEVEL env var
    const envLogLevel = typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL;
    const defaultLevel = (envLogLevel as LogLevel) || LogLevel.ERROR;

    this.config = {
      level: config.level || defaultLevel,
      enableMetrics: config.enableMetrics ?? true,
      enableColors: config.enableColors ?? (process.stdout.isTTY || false),
      enableTimestamps: config.enableTimestamps ?? true,
      prefix: config.prefix || '[PIPELINE]',
      outputFormat: config.outputFormat || 'structured',
      enableMemoryTracking: config.enableMemoryTracking ?? false,
    };
  }

  startPipeline(config: PipelineConfig): void {
    this.startTime = Date.now();
    this.resetMetrics();

    this.log(LogLevel.INFO, 'Pipeline execution starting', {
      stepsCount: config.steps.length,
      fieldTrackingMode: config.fieldTrackingMode,
      debugLogging: config.enableDebugLogging,
    });

    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, 'Pipeline steps configured', {
        steps: config.steps.map(step => ({
          name: step.name,
          order: step.order,
          enabled: step.enabled,
          dependencies: step.dependencies,
        })),
      });
    }
  }

  startStep(stepName: string, inputSize: number): void {
    this.stepTimings.set(stepName, Date.now());
    this.metrics.totalSteps++;

    this.log(LogLevel.DEBUG, `Step '${stepName}' starting`, {
      inputSize: this.formatBytes(inputSize),
      stepIndex: this.metrics.totalSteps,
      memoryUsage: this.getMemoryUsage(),
    });
  }

  completeStep(stepName: string, result: StepResult): void {
    const startTime = this.stepTimings.get(stepName);
    const duration = startTime ? Date.now() - startTime : result.duration;

    this.metrics.successfulSteps++;
    this.metrics.totalFieldsTracked += result.fieldsTracked;
    this.metrics.totalProcessingTime += duration;

    const logLevel = result.errors.length > 0 ? LogLevel.WARN : LogLevel.INFO;

    this.log(logLevel, `Step '${stepName}' completed`, {
      duration: `${duration}ms`,
      inputSize: this.formatBytes(result.inputSize),
      outputSize: this.formatBytes(result.outputSize),
      sizeChange: this.formatSizeChange(result.inputSize, result.outputSize),
      fieldsTracked: result.fieldsTracked,
      errors: result.errors.length,
      warnings: result.warnings.length,
      success: result.success,
    });

    if (result.errors.length > 0 && this.shouldLog(LogLevel.WARN)) {
      result.errors.forEach(error => {
        this.log(LogLevel.WARN, `Step error in '${stepName}': ${error.message}`, {
          code: error.code,
          severity: error.severity,
          recoverable: error.recoverable,
        });
      });
    }

    if (result.warnings.length > 0 && this.shouldLog(LogLevel.DEBUG)) {
      result.warnings.forEach(warning => {
        this.log(LogLevel.DEBUG, `Step warning in '${stepName}': ${warning}`);
      });
    }
  }

  skipStep(stepName: string, reason: string): void {
    this.metrics.skippedSteps++;

    this.log(LogLevel.DEBUG, `Step '${stepName}' skipped`, { reason });
  }

  errorStep(stepName: string, error: ProcessingError): void {
    this.metrics.failedSteps++;

    this.log(LogLevel.ERROR, `Step '${stepName}' failed: ${error.message}`, {
      code: error.code,
      severity: error.severity,
      recoverable: error.recoverable,
      location: error.location,
    });
  }

  completePipeline(result: PipelineResult): void {
    const totalDuration = Date.now() - this.startTime;

    const logLevel = result.success ? LogLevel.INFO : LogLevel.ERROR;

    this.log(logLevel, 'Pipeline execution completed', {
      success: result.success,
      totalDuration: `${totalDuration}ms`,
      stepsExecuted: result.stepResults.length,
      contentSize: this.formatBytes(result.content.length),
      fieldsTracked: result.fieldReport?.total || 0,
      errors: result.errors.length,
      warnings: result.warnings.length,
      exportedFiles: result.exportedFiles?.length || 0,
    });

    if (this.shouldLog(LogLevel.INFO) && this.config.enableMetrics) {
      this.logMetricsSummary();
    }
  }

  errorPipeline(error: ProcessingError): void {
    this.log(LogLevel.ERROR, `Pipeline execution failed: ${error.message}`, {
      code: error.code,
      stepName: error.stepName,
      recoverable: error.recoverable,
    });
  }

  logFieldTracking(fieldName: string, action: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      this.log(LogLevel.TRACE, `Field tracking: ${action} for '${fieldName}'`, metadata);
    }
  }

  generateReport(): string {
    const lines: string[] = [];

    lines.push('='.repeat(60));
    lines.push('PIPELINE EXECUTION REPORT');
    lines.push('='.repeat(60));

    lines.push(`Total Steps: ${this.metrics.totalSteps}`);
    lines.push(`Successful: ${this.metrics.successfulSteps}`);
    lines.push(`Failed: ${this.metrics.failedSteps}`);
    lines.push(`Skipped: ${this.metrics.skippedSteps}`);
    lines.push(`Total Fields Tracked: ${this.metrics.totalFieldsTracked}`);
    lines.push(`Total Processing Time: ${this.metrics.totalProcessingTime}ms`);

    if (this.config.enableMemoryTracking) {
      lines.push(`Peak Memory Usage: ${this.formatBytes(this.metrics.memoryPeakUsage)}`);
    }

    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  private resetMetrics(): void {
    this.metrics = {
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      totalFieldsTracked: 0,
      totalProcessingTime: 0,
      memoryPeakUsage: 0,
    };
    this.stepTimings.clear();
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const configIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= configIndex;
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = this.config.enableTimestamps ? new Date().toISOString() : '';
    const prefix = this.config.prefix;
    const colorizedLevel = this.colorizeLevel(level);

    if (this.config.outputFormat === 'json') {
      const logEntry = {
        timestamp,
        level,
        message,
        data: data || {},
      };
      console.log(JSON.stringify(logEntry));
    } else if (this.config.outputFormat === 'structured') {
      const parts = [timestamp, prefix, colorizedLevel, message].filter(Boolean);
      console.log(parts.join(' '), data ? JSON.stringify(data, null, 2) : '');
    } else {
      const parts = [timestamp, prefix, colorizedLevel, message].filter(Boolean);
      console.log(parts.join(' '));
    }

    this.trackMemoryUsage();
  }

  private colorizeLevel(level: LogLevel): string {
    if (!this.config.enableColors) {
      return level.toUpperCase();
    }

    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.INFO]: '\x1b[36m', // Cyan
      [LogLevel.DEBUG]: '\x1b[37m', // White
      [LogLevel.TRACE]: '\x1b[90m', // Gray
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';

    return `${color}${level.toUpperCase()}${reset}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private formatSizeChange(inputSize: number, outputSize: number): string {
    const diff = outputSize - inputSize;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff} chars`;
  }

  private getMemoryUsage(): string {
    if (!this.config.enableMemoryTracking) {
      return 'N/A';
    }

    const usage = process.memoryUsage();
    return this.formatBytes(usage.heapUsed);
  }

  private trackMemoryUsage(): void {
    if (this.config.enableMemoryTracking) {
      const usage = process.memoryUsage();
      this.metrics.memoryPeakUsage = Math.max(this.metrics.memoryPeakUsage, usage.heapUsed);
    }
  }

  private logMetricsSummary(): void {
    this.log(LogLevel.INFO, 'Pipeline metrics summary', {
      efficiency: {
        successRate: `${((this.metrics.successfulSteps / this.metrics.totalSteps) * 100).toFixed(1)}%`,
        averageStepTime: `${(this.metrics.totalProcessingTime / this.metrics.totalSteps).toFixed(1)}ms`,
        fieldsPerSecond: (
          this.metrics.totalFieldsTracked /
          (this.metrics.totalProcessingTime / 1000)
        ).toFixed(1),
      },
      breakdown: {
        successful: this.metrics.successfulSteps,
        failed: this.metrics.failedSteps,
        skipped: this.metrics.skippedSteps,
      },
    });
  }
}

/**
 * Null logger that discards all log messages (useful for testing)
 *
 * @class NullPipelineLogger
 */
export class NullPipelineLogger implements PipelineLogger {
  startPipeline(): void {}
  startStep(): void {}
  completeStep(): void {}
  skipStep(): void {}
  errorStep(): void {}
  completePipeline(): void {}
  errorPipeline(): void {}
  logFieldTracking(): void {}
  generateReport(): string {
    return '';
  }
}
