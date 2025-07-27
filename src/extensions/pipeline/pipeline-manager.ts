/**
 * @fileoverview Pipeline Manager for Legal Markdown Processing
 *
 * This module provides the core pipeline management system for Legal Markdown
 * processing. It orchestrates the execution of multiple processing steps in a
 * configurable, observable, and fault-tolerant manner.
 *
 * Features:
 * - Step-by-step processing with dependency management
 * - Comprehensive error handling and recovery
 * - Performance monitoring and metrics collection
 * - Field tracking integration
 * - Event-driven architecture with listeners
 * - Configurable execution strategies
 * - Fallback mechanisms for reliability
 * - Debug and profiling capabilities
 *
 * @example
 * ```typescript
 * import { PipelineManager } from './pipeline-manager';
 * import { ConsolePipelineLogger } from './pipeline-logger';
 *
 * const logger = new ConsolePipelineLogger({ level: 'debug' });
 * const pipeline = new PipelineManager(logger);
 *
 * // Register steps
 * pipeline.registerStep({
 *   name: 'mixins',
 *   processor: new MixinProcessor(),
 *   order: 7,
 *   enabled: true
 * });
 *
 * // Execute pipeline
 * const result = await pipeline.execute(content, metadata, options);
 * ```
 */

import { BaseProcessor } from '@core';
import { LegalMarkdownOptions } from '@types';
import { fieldTracker } from '../tracking/field-tracker';
import {
  PipelineStep,
  PipelineResult,
  StepResult,
  ProcessingError,
  PipelineConfig,
  PipelineState,
  PipelineExecutionOptions,
  PipelineEventListener,
} from './types';
import {
  PipelineLogger,
  ConsolePipelineLogger,
  NullPipelineLogger,
  LogLevel,
} from './pipeline-logger';

/**
 * Central pipeline manager for orchestrating Legal Markdown processing
 *
 * The PipelineManager coordinates the execution of multiple processing steps,
 * providing comprehensive monitoring, error handling, and performance tracking.
 * It serves as the backbone for the new Legal Markdown processing architecture.
 *
 * @class PipelineManager
 * @example
 * ```typescript
 * const pipeline = new PipelineManager();
 *
 * // Configure steps
 * pipeline.registerStep({
 *   name: 'yaml-parsing',
 *   processor: new YamlProcessor(),
 *   order: 1,
 *   enabled: true
 * });
 *
 * pipeline.registerStep({
 *   name: 'mixins',
 *   processor: new MixinProcessor(),
 *   order: 7,
 *   enabled: true,
 *   dependencies: ['yaml-parsing']
 * });
 *
 * // Execute with options
 * const result = await pipeline.execute(content, metadata, {
 *   legalMarkdownOptions: { enableFieldTracking: true },
 *   enableStepProfiling: true
 * });
 *
 * console.log(`Processed ${result.content.length} characters`);
 * console.log(`Tracked ${result.fieldReport?.total} fields`);
 * ```
 */
export class PipelineManager {
  private steps: Map<string, PipelineStep> = new Map();
  private logger: PipelineLogger;
  private listeners: PipelineEventListener[] = [];
  private state: PipelineState = {
    completedSteps: [],
    remainingSteps: [],
    startTime: 0,
    contentHistory: [],
    aborted: false,
  };

  /**
   * Creates a new PipelineManager instance
   *
   * @param logger - Optional logger for pipeline events (defaults to console logger in development)
   * @param config - Optional initial configuration
   */
  constructor(logger?: PipelineLogger, config?: Partial<PipelineConfig>) {
    this.logger = logger || this.createDefaultLogger();

    if (config?.steps) {
      config.steps.forEach(step => this.registerStep(step));
    }
  }

  /**
   * Register a processing step with the pipeline
   *
   * @param step - The pipeline step configuration
   * @throws {Error} If step name is already registered or invalid
   * @example
   * ```typescript
   * pipeline.registerStep({
   *   name: 'custom-processor',
   *   processor: new CustomProcessor(),
   *   order: 10,
   *   enabled: true,
   *   dependencies: ['mixins'],
   *   timeout: 5000,
   *   description: 'Custom document processing'
   * });
   * ```
   */
  registerStep(step: PipelineStep): void {
    if (this.steps.has(step.name)) {
      throw new Error(`Pipeline step '${step.name}' is already registered`);
    }

    if (!step.processor || typeof step.processor.process !== 'function') {
      throw new Error(
        `Invalid processor for step '${step.name}': must implement BaseProcessor interface`
      );
    }

    this.steps.set(step.name, { ...step });
  }

  /**
   * Unregister a processing step from the pipeline
   *
   * @param stepName - Name of the step to remove
   * @returns True if step was found and removed
   */
  unregisterStep(stepName: string): boolean {
    return this.steps.delete(stepName);
  }

  /**
   * Get information about a registered step
   *
   * @param stepName - Name of the step to query
   * @returns Step configuration or undefined if not found
   */
  getStep(stepName: string): PipelineStep | undefined {
    return this.steps.get(stepName);
  }

  /**
   * Get all registered steps ordered by execution order
   *
   * @returns Array of steps sorted by order
   */
  getSteps(): PipelineStep[] {
    return Array.from(this.steps.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Add an event listener for pipeline events
   *
   * @param listener - Event listener implementation
   * @example
   * ```typescript
   * pipeline.addListener({
   *   onStepStart: (stepName) => console.log(`Starting ${stepName}`),
   *   onStepComplete: (result) => console.log(`Completed ${result.stepName}`),
   *   onPipelineComplete: (result) => console.log('Pipeline finished')
   * });
   * ```
   */
  addListener(listener: PipelineEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove an event listener
   *
   * @param listener - Listener to remove
   * @returns True if listener was found and removed
   */
  removeListener(listener: PipelineEventListener): boolean {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Execute the complete processing pipeline
   *
   * This is the main entry point for pipeline execution. It processes the content
   * through all registered steps in the correct order, handling dependencies,
   * errors, and performance tracking.
   *
   * @param content - The document content to process
   * @param metadata - Document metadata (YAML front matter, etc.)
   * @param options - Execution options and Legal Markdown options
   * @returns Promise resolving to complete pipeline result
   * @throws {Error} For critical pipeline failures
   * @example
   * ```typescript
   * const result = await pipeline.execute(
   *   '# Document\n\n{{client.name}} agreement...',
   *   { client: { name: 'Acme Corp' } },
   *   {
   *     legalMarkdownOptions: {
   *       enableFieldTracking: true,
   *       enableFieldTrackingInMarkdown: true
   *     },
   *     enableStepProfiling: true
   *   }
   * );
   *
   * if (result.success) {
   *   console.log('Processing completed successfully');
   *   console.log(`Final content: ${result.content.length} characters`);
   * } else {
   *   console.error('Processing failed:', result.errors);
   * }
   * ```
   */
  async execute(
    content: string,
    metadata: Record<string, any>,
    options: PipelineExecutionOptions
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    // Handle null/undefined content gracefully at the start
    const safeContent = content || '';
    this.initializeState(safeContent, startTime);

    // Clear field tracker for new document
    fieldTracker.clear();

    const config = this.buildPipelineConfig(options);
    const stepResults: StepResult[] = [];
    const errors: ProcessingError[] = [];
    const warnings: string[] = [];

    try {
      // Emit pipeline start events
      this.logger.startPipeline(config);
      this.emitEvent('onPipelineStart', config);

      let processedContent = safeContent;
      const orderedSteps = this.getExecutionOrder(options);

      for (const step of orderedSteps) {
        if (this.state.aborted) {
          break;
        }

        // Check if step should be executed
        if (!this.shouldExecuteStep(step, options)) {
          this.logger.skipStep(step.name, 'Step disabled or filtered');
          this.emitEvent('onStepStart', step.name, processedContent.length);
          continue;
        }

        // Check dependencies
        const dependencyError = this.checkDependencies(step, stepResults);
        if (dependencyError) {
          const error = this.createProcessingError(
            'DEPENDENCY_ERROR',
            `Step '${step.name}' dependency not satisfied: ${dependencyError}`,
            step.name,
            'error',
            false
          );
          errors.push(error);
          this.logger.errorStep(step.name, error);
          this.emitEvent('onStepError', error);

          if (!config.continueOnError) {
            break;
          }
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, processedContent, metadata, options);
        stepResults.push(stepResult);

        if (stepResult.success) {
          processedContent = stepResult.outputContent || processedContent;
          this.state.completedSteps.push(step.name);
          this.updateContentHistory(step.name, processedContent.length);

          this.logger.completeStep(step.name, stepResult);
          this.emitEvent('onStepComplete', stepResult);
        } else {
          errors.push(...stepResult.errors);
          this.logger.errorStep(
            step.name,
            stepResult.errors[0] || this.createGenericError(step.name)
          );
          this.emitEvent('onStepError', stepResult.errors[0] || this.createGenericError(step.name));

          if (!config.continueOnError) {
            break;
          }
        }

        warnings.push(...stepResult.warnings);
      }

      // Build final result
      const totalDuration = Date.now() - startTime;
      const success = errors.length === 0 && !this.state.aborted;

      const result: PipelineResult = {
        content: processedContent,
        metadata,
        success,
        stepResults,
        fieldReport: this.generateFieldReport(options),
        exportedFiles: this.collectExportedFiles(stepResults),
        totalDuration,
        errors,
        warnings,
      };

      this.logger.completePipeline(result);
      this.emitEvent('onPipelineComplete', result);

      return result;
    } catch (error) {
      const processingError = this.createProcessingError(
        'PIPELINE_CRITICAL_ERROR',
        `Critical pipeline failure: ${(error as Error).message}`,
        this.state.currentStep || 'unknown',
        'error',
        false,
        error as Error
      );

      this.logger.errorPipeline(processingError);
      this.emitEvent('onPipelineError', processingError);

      return {
        content: safeContent,
        metadata,
        success: false,
        stepResults,
        totalDuration: Date.now() - startTime,
        errors: [processingError, ...errors],
        warnings,
      };
    }
  }

  /**
   * Abort pipeline execution
   *
   * @param reason - Reason for aborting
   */
  abort(reason: string = 'Manual abort'): void {
    this.state.aborted = true;
    this.logger.errorPipeline(
      this.createProcessingError(
        'PIPELINE_ABORTED',
        `Pipeline execution aborted: ${reason}`,
        this.state.currentStep || 'unknown',
        'error',
        false
      )
    );
  }

  /**
   * Get current pipeline state
   *
   * @returns Current pipeline state
   */
  getState(): Readonly<PipelineState> {
    return { ...this.state };
  }

  /**
   * Validate pipeline configuration
   *
   * @param options - Execution options to validate
   * @returns Array of validation errors (empty if valid)
   */
  validateConfiguration(options: PipelineExecutionOptions): ProcessingError[] {
    const errors: ProcessingError[] = [];
    const steps = this.getExecutionOrder(options);

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(steps);
    if (circularDeps.length > 0) {
      errors.push(
        this.createProcessingError(
          'CIRCULAR_DEPENDENCY',
          `Circular dependencies detected: ${circularDeps.join(' -> ')}`,
          'validation',
          'error',
          false
        )
      );
    }

    // Check for missing dependencies
    const stepNames = new Set(steps.map(s => s.name));
    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepNames.has(dep)) {
            errors.push(
              this.createProcessingError(
                'MISSING_DEPENDENCY',
                `Step '${step.name}' depends on missing step '${dep}'`,
                step.name,
                'error',
                false
              )
            );
          }
        }
      }
    }

    return errors;
  }

  private createDefaultLogger(): PipelineLogger {
    if (process.env.NODE_ENV === 'development') {
      return new ConsolePipelineLogger({ level: LogLevel.DEBUG });
    } else if (process.env.NODE_ENV === 'test') {
      return new NullPipelineLogger();
    } else {
      return new ConsolePipelineLogger({ level: LogLevel.INFO });
    }
  }

  private initializeState(content: string, startTime: number): void {
    // Handle null/undefined content gracefully
    const safeContent = content || '';
    const contentLength = safeContent.length;

    this.state = {
      completedSteps: [],
      remainingSteps: Array.from(this.steps.keys()),
      startTime,
      contentHistory: [{ step: 'input', size: contentLength, timestamp: startTime }],
      aborted: false,
    };
  }

  private buildPipelineConfig(options: PipelineExecutionOptions): PipelineConfig {
    return {
      steps: this.getSteps(),
      fieldTrackingMode: options.legalMarkdownOptions.enableFieldTrackingInMarkdown
        ? 'distributed'
        : 'centralized',
      enableDebugLogging: process.env.NODE_ENV === 'development',
      enableMetrics: options.enableStepProfiling ?? true,
      continueOnError: false,
    };
  }

  private getExecutionOrder(options: PipelineExecutionOptions): PipelineStep[] {
    let steps = this.getSteps();

    // Filter by onlySteps if specified
    if (options.onlySteps && options.onlySteps.length > 0) {
      const onlySet = new Set(options.onlySteps);
      steps = steps.filter(step => onlySet.has(step.name));
    }

    // Remove skipped steps
    if (options.skipSteps && options.skipSteps.length > 0) {
      const skipSet = new Set(options.skipSteps);
      steps = steps.filter(step => !skipSet.has(step.name));
    }

    // Sort by dependencies and order
    return this.topologicalSort(steps);
  }

  private shouldExecuteStep(step: PipelineStep, options: PipelineExecutionOptions): boolean {
    if (!step.enabled) {
      return false;
    }

    if (!step.processor.isEnabled(options.legalMarkdownOptions)) {
      return false;
    }

    if (options.skipSteps?.includes(step.name)) {
      return false;
    }

    if (options.onlySteps && options.onlySteps.length > 0) {
      return options.onlySteps.includes(step.name);
    }

    return true;
  }

  private async executeStep(
    step: PipelineStep,
    content: string,
    metadata: Record<string, any>,
    options: PipelineExecutionOptions
  ): Promise<StepResult & { outputContent?: string }> {
    const startTime = Date.now();
    this.state.currentStep = step.name;
    const inputSize = content.length;
    const initialFieldCount = fieldTracker.getFields().size;

    this.logger.startStep(step.name, inputSize);
    this.emitEvent('onStepStart', step.name, inputSize);

    const errors: ProcessingError[] = [];
    const warnings: string[] = [];
    let outputContent = content;
    let success = false;

    try {
      // Set timeout if specified
      const timeout = options.stepTimeouts?.[step.name] || step.timeout;

      if (timeout && !options.dryRun) {
        outputContent = await this.executeWithTimeout(
          () => step.processor.process(content, metadata, options.legalMarkdownOptions),
          timeout
        );
      } else if (!options.dryRun) {
        outputContent = step.processor.process(content, metadata, options.legalMarkdownOptions);
      }

      success = true;
    } catch (error) {
      const processingError = this.createProcessingError(
        'STEP_EXECUTION_ERROR',
        `Step '${step.name}' failed: ${(error as Error).message}`,
        step.name,
        'error',
        true,
        error as Error
      );
      errors.push(processingError);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const outputSize = outputContent.length;
    const fieldsTracked = fieldTracker.getFields().size - initialFieldCount;

    return {
      stepName: step.name,
      success,
      inputSize,
      outputSize,
      fieldsTracked,
      duration,
      errors,
      warnings,
      metadata: options.enableStepProfiling
        ? {
            memoryUsage: process.memoryUsage(),
            timestamp: endTime,
          }
        : undefined,
      outputContent,
    };
  }

  private async executeWithTimeout<T>(fn: () => T, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = fn();
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private checkDependencies(step: PipelineStep, completedSteps: StepResult[]): string | null {
    if (!step.dependencies || step.dependencies.length === 0) {
      return null;
    }

    const completedStepNames = new Set(completedSteps.map(r => r.stepName));

    for (const dependency of step.dependencies) {
      if (!completedStepNames.has(dependency)) {
        return dependency;
      }
    }

    return null;
  }

  private topologicalSort(steps: PipelineStep[]): PipelineStep[] {
    const sorted: PipelineStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stepMap = new Map(steps.map(step => [step.name, step]));

    const visit = (stepName: string): void => {
      if (visited.has(stepName)) return;
      if (visiting.has(stepName)) {
        throw new Error(`Circular dependency detected involving step: ${stepName}`);
      }

      visiting.add(stepName);
      const step = stepMap.get(stepName);

      if (step && step.dependencies) {
        for (const dep of step.dependencies) {
          if (stepMap.has(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(stepName);
      visited.add(stepName);

      if (step) {
        sorted.push(step);
      }
    };

    // Visit all steps, first by dependencies, then by order
    const sortedByOrder = steps.sort((a, b) => a.order - b.order);
    for (const step of sortedByOrder) {
      visit(step.name);
    }

    return sorted;
  }

  private detectCircularDependencies(steps: PipelineStep[]): string[] {
    const stepMap = new Map(steps.map(step => [step.name, step]));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepName: string, path: string[]): string[] | null => {
      if (recursionStack.has(stepName)) {
        const cycleStart = path.indexOf(stepName);
        return path.slice(cycleStart).concat(stepName);
      }

      if (visited.has(stepName)) {
        return null;
      }

      visited.add(stepName);
      recursionStack.add(stepName);
      path.push(stepName);

      const step = stepMap.get(stepName);
      if (step && step.dependencies) {
        for (const dep of step.dependencies) {
          if (stepMap.has(dep)) {
            const cycle = hasCycle(dep, [...path]);
            if (cycle) {
              return cycle;
            }
          }
        }
      }

      recursionStack.delete(stepName);
      path.pop();
      return null;
    };

    for (const step of steps) {
      if (!visited.has(step.name)) {
        const cycle = hasCycle(step.name, []);
        if (cycle) {
          return cycle;
        }
      }
    }

    return [];
  }

  private generateFieldReport(options: PipelineExecutionOptions) {
    if (!options.legalMarkdownOptions.enableFieldTracking) {
      return undefined;
    }

    return fieldTracker.generateReport();
  }

  private collectExportedFiles(stepResults: StepResult[]): string[] {
    const files: string[] = [];

    for (const result of stepResults) {
      if (result.metadata?.exportedFiles) {
        files.push(...result.metadata.exportedFiles);
      }
    }

    return files;
  }

  private updateContentHistory(stepName: string, size: number): void {
    this.state.contentHistory.push({
      step: stepName,
      size,
      timestamp: Date.now(),
    });
  }

  private createProcessingError(
    code: string,
    message: string,
    stepName: string,
    severity: 'error' | 'warning' | 'info',
    recoverable: boolean,
    originalError?: Error
  ): ProcessingError {
    return {
      code,
      message,
      stepName,
      severity,
      recoverable,
      originalError,
    };
  }

  private createGenericError(stepName: string): ProcessingError {
    return this.createProcessingError(
      'UNKNOWN_ERROR',
      'Unknown error occurred during step execution',
      stepName,
      'error',
      true
    );
  }

  private emitEvent(eventName: keyof PipelineEventListener, ...args: any[]): void {
    for (const listener of this.listeners) {
      const handler = listener[eventName] as any;
      if (typeof handler === 'function') {
        try {
          handler.apply(listener, args);
        } catch (error) {
          console.error(`Error in pipeline event listener for ${eventName}:`, error);
        }
      }
    }
  }
}
