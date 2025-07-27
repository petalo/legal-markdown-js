/**
 * @fileoverview Pipeline Management Types for Legal Markdown Processing
 *
 * This module defines the type system for the advanced pipeline management features
 * in Legal Markdown processing. It provides interfaces for pipeline orchestration,
 * step management, result tracking, and error handling.
 *
 * Features:
 * - Pipeline step configuration and ordering
 * - Processing result tracking with detailed metrics
 * - Error handling and reporting interfaces
 * - Pipeline execution state management
 * - Integration with field tracking systems
 * - Support for async and sync processing modes
 *
 * @example
 * ```typescript
 * import { PipelineStep, PipelineResult, PipelineConfig } from './types';
 * import { BaseProcessor } from '@core';
 *
 * // Define a pipeline step
 * const mixinStep: PipelineStep = {
 *   name: 'mixins',
 *   processor: new MixinProcessor(),
 *   order: 7,
 *   enabled: true
 * };
 *
 * // Configure pipeline
 * const config: PipelineConfig = {
 *   steps: [mixinStep],
 *   fieldTrackingMode: 'centralized',
 *   enableDebugLogging: true
 * };
 * ```
 */

import { BaseProcessor } from '@core';
import { TrackedField } from '../tracking/field-tracker';
import { LegalMarkdownOptions } from '@types';

/**
 * Configuration for a single step in the processing pipeline
 *
 * @interface PipelineStep
 * @example
 * ```typescript
 * const step: PipelineStep = {
 *   name: 'mixins',
 *   processor: new MixinProcessor(),
 *   order: 7,
 *   enabled: true,
 *   dependencies: ['yaml-parsing', 'imports'],
 *   timeout: 5000
 * };
 * ```
 */
export interface PipelineStep {
  /** Unique identifier for this pipeline step */
  name: string;

  /** The processor that handles this step */
  processor: BaseProcessor;

  /** Execution order (lower numbers run first) */
  order: number;

  /** Whether this step is enabled by default */
  enabled: boolean;

  /** Optional dependencies that must complete before this step */
  dependencies?: string[];

  /** Optional timeout in milliseconds for this step */
  timeout?: number;

  /** Optional description of what this step does */
  description?: string;
}

/**
 * Result of executing a single pipeline step
 *
 * @interface StepResult
 * @example
 * ```typescript
 * const result: StepResult = {
 *   stepName: 'mixins',
 *   success: true,
 *   inputSize: 1500,
 *   outputSize: 1650,
 *   fieldsTracked: 12,
 *   duration: 45,
 *   errors: [],
 *   warnings: ['Field client.address is empty'],
 *   metadata: { mixinsProcessed: 12, helpersUsed: 3 }
 * };
 * ```
 */
export interface StepResult {
  /** Name of the step that produced this result */
  stepName: string;

  /** Whether the step completed successfully */
  success: boolean;

  /** Size of input content in characters */
  inputSize: number;

  /** Size of output content in characters */
  outputSize: number;

  /** Number of fields tracked during this step */
  fieldsTracked: number;

  /** Execution time in milliseconds */
  duration: number;

  /** Any errors that occurred during processing */
  errors: ProcessingError[];

  /** Non-fatal warnings produced during processing */
  warnings: string[];

  /** Optional step-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Detailed error information for pipeline processing
 *
 * @interface ProcessingError
 * @example
 * ```typescript
 * const error: ProcessingError = {
 *   code: 'MIXIN_PARSE_ERROR',
 *   message: 'Invalid mixin syntax in {{client.name',
 *   stepName: 'mixins',
 *   location: { line: 15, column: 23 },
 *   severity: 'error',
 *   recoverable: true
 * };
 * ```
 */
export interface ProcessingError {
  /** Error code for programmatic handling */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Step where the error occurred */
  stepName: string;

  /** Optional location information */
  location?: {
    line?: number;
    column?: number;
    offset?: number;
  };

  /** Severity level of the error */
  severity: 'error' | 'warning' | 'info';

  /** Whether processing can continue after this error */
  recoverable: boolean;

  /** Original error object if available */
  originalError?: Error;
}

/**
 * Complete result of pipeline execution
 *
 * @interface PipelineResult
 * @example
 * ```typescript
 * const result: PipelineResult = {
 *   content: '# Processed Document...',
 *   metadata: { title: 'Contract', author: 'Legal Team' },
 *   success: true,
 *   stepResults: [step1Result, step2Result],
 *   fieldReport: { total: 15, filled: 12, empty: 3 },
 *   exportedFiles: ['metadata.json'],
 *   totalDuration: 150,
 *   errors: [],
 *   warnings: []
 * };
 * ```
 */
export interface PipelineResult {
  /** Final processed content */
  content: string;

  /** Document metadata (YAML front matter, etc.) */
  metadata?: Record<string, any>;

  /** Whether the entire pipeline succeeded */
  success: boolean;

  /** Results from each executed step */
  stepResults: StepResult[];

  /** Field tracking report if enabled */
  fieldReport?: {
    total: number;
    filled: number;
    empty: number;
    logic: number;
    fields: TrackedField[];
  };

  /** List of files exported during processing */
  exportedFiles?: string[];

  /** Total pipeline execution time in milliseconds */
  totalDuration: number;

  /** All errors collected during pipeline execution */
  errors: ProcessingError[];

  /** All warnings collected during pipeline execution */
  warnings: string[];
}

/**
 * Configuration for the entire processing pipeline
 *
 * @interface PipelineConfig
 * @example
 * ```typescript
 * const config: PipelineConfig = {
 *   steps: [yamlStep, mixinStep, headerStep],
 *   fieldTrackingMode: 'centralized',
 *   enableDebugLogging: true,
 *   enableMetrics: true,
 *   maxStepTimeout: 10000,
 *   continueOnError: false,
 *   parallelSteps: []
 * };
 * ```
 */
export interface PipelineConfig {
  /** Array of pipeline steps to execute */
  steps: PipelineStep[];

  /** Field tracking strategy */
  fieldTrackingMode: 'centralized' | 'distributed' | 'disabled';

  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;

  /** Whether to collect detailed performance metrics */
  enableMetrics?: boolean;

  /** Maximum timeout for any single step (milliseconds) */
  maxStepTimeout?: number;

  /** Whether to continue pipeline execution if a step fails */
  continueOnError?: boolean;

  /** Steps that can run in parallel (optimization) */
  parallelSteps?: string[][];
}

/**
 * State information during pipeline execution
 *
 * @interface PipelineState
 * @example
 * ```typescript
 * const state: PipelineState = {
 *   currentStep: 'mixins',
 *   completedSteps: ['yaml-parsing', 'imports'],
 *   remainingSteps: ['headers', 'field-tracking'],
 *   startTime: Date.now(),
 *   contentHistory: [
 *     { step: 'input', size: 1000 },
 *     { step: 'yaml-parsing', size: 950 }
 *   ],
 *   fieldTrackingState: fieldState,
 *   aborted: false
 * };
 * ```
 */
export interface PipelineState {
  /** Currently executing step name */
  currentStep?: string;

  /** Steps that have completed successfully */
  completedSteps: string[];

  /** Steps that are still pending execution */
  remainingSteps: string[];

  /** Pipeline start timestamp */
  startTime: number;

  /** Content size history for debugging */
  contentHistory: Array<{
    step: string;
    size: number;
    timestamp?: number;
  }>;

  /** Current field tracking state */
  fieldTrackingState?: any;

  /** Whether pipeline execution was aborted */
  aborted: boolean;
}

/**
 * Options specific to pipeline execution
 *
 * @interface PipelineExecutionOptions
 * @example
 * ```typescript
 * const options: PipelineExecutionOptions = {
 *   legalMarkdownOptions: { enableFieldTracking: true },
 *   enableStepProfiling: true,
 *   skipSteps: ['headers'],
 *   onlySteps: ['mixins', 'templates'],
 *   dryRun: false,
 *   saveIntermediateResults: true
 * };
 * ```
 */
export interface PipelineExecutionOptions {
  /** Standard Legal Markdown processing options */
  legalMarkdownOptions: LegalMarkdownOptions;

  /** Whether to enable detailed step profiling */
  enableStepProfiling?: boolean;

  /** Steps to skip during execution */
  skipSteps?: string[];

  /** If specified, only run these steps */
  onlySteps?: string[];

  /** Perform validation without actual processing */
  dryRun?: boolean;

  /** Save intermediate results for debugging */
  saveIntermediateResults?: boolean;

  /** Custom timeout overrides per step */
  stepTimeouts?: Record<string, number>;
}

/**
 * Interface for pipeline event listeners
 *
 * @interface PipelineEventListener
 * @example
 * ```typescript
 * const listener: PipelineEventListener = {
 *   onPipelineStart: (config) => console.log('Pipeline starting'),
 *   onStepStart: (stepName) => console.log(`Step ${stepName} starting`),
 *   onStepComplete: (result) => console.log(`Step completed: ${result.stepName}`),
 *   onStepError: (error) => console.error(`Step failed: ${error.stepName}`),
 *   onPipelineComplete: (result) => console.log('Pipeline finished'),
 *   onPipelineError: (error) => console.error('Pipeline failed')
 * };
 * ```
 */
export interface PipelineEventListener {
  /** Called when pipeline execution begins */
  onPipelineStart?: (config: PipelineConfig) => void;

  /** Called when a step begins execution */
  onStepStart?: (stepName: string, inputSize: number) => void;

  /** Called when a step completes successfully */
  onStepComplete?: (result: StepResult) => void;

  /** Called when a step encounters an error */
  onStepError?: (error: ProcessingError) => void;

  /** Called when the entire pipeline completes */
  onPipelineComplete?: (result: PipelineResult) => void;

  /** Called when the pipeline fails critically */
  onPipelineError?: (error: ProcessingError) => void;
}

/**
 * Factory function type for creating processors
 *
 * @type ProcessorFactory
 * @example
 * ```typescript
 * const mixinFactory: ProcessorFactory = (options) => {
 *   return new MixinProcessor(options.enableAdvancedMixins);
 * };
 * ```
 */
export type ProcessorFactory = (options: LegalMarkdownOptions) => BaseProcessor;

/**
 * Registry for dynamic processor creation
 *
 * @interface ProcessorRegistry
 * @example
 * ```typescript
 * const registry: ProcessorRegistry = {
 *   'mixins': (options) => new MixinProcessor(options),
 *   'headers': (options) => new HeaderProcessor(options),
 *   'custom': (options) => new CustomProcessor(options.customConfig)
 * };
 * ```
 */
export interface ProcessorRegistry {
  [processorName: string]: ProcessorFactory;
}
