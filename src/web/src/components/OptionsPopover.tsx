import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProcessingOptions } from '@/types/legal-markdown';

interface OptionRowProps {
  id: keyof ProcessingOptions;
  label: string;
  description: string;
  options: ProcessingOptions;
  onChange: (partial: Partial<ProcessingOptions>) => void;
}

function OptionRow({ id, label, description, options, onChange }: OptionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-sm text-slate-200 cursor-pointer">
          {label}
        </Label>
        <span className="text-xs text-slate-400">{description}</span>
      </div>
      <Switch
        id={id}
        checked={!!options[id]}
        onCheckedChange={checked => onChange({ [id]: checked })}
        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-600"
      />
    </div>
  );
}

/**
 * Count how many options differ from their default (field tracking ON, rest OFF).
 * IMPORTANT: this list must be kept in sync with DEFAULT_OPTIONS in useLegalMarkdown.ts.
 * A mismatch will silently produce an incorrect badge count on the Options button.
 */
function countActiveOptions(options: ProcessingOptions): number {
  let count = 0;
  if (!options.enableFieldTracking) count++;
  if (options.debug) count++;
  if (options.yamlOnly) count++;
  if (options.noHeaders) count++;
  if (options.noClauses) count++;
  if (options.noReferences) count++;
  if (options.noMixins) count++;
  if (options.noReset) count++;
  if (options.noIndent) count++;
  if (options.throwOnYamlError) count++;
  return count;
}

interface OptionsPopoverProps {
  options: ProcessingOptions;
  onChange: (partial: Partial<ProcessingOptions>) => void;
}

export function OptionsPopover({ options, onChange }: OptionsPopoverProps) {
  const activeCount = countActiveOptions(options);

  return (
    <Tooltip>
      <Popover>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Processing options"
              className="cursor-pointer relative h-8 w-8"
            >
              <Settings className="h-4 w-4" />
              {activeCount > 0 && (
                <span
                  data-testid="options-badge"
                  className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-green-500"
                />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <PopoverContent className="w-80 bg-slate-800 border-slate-700 text-slate-50" align="end">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Processing Control
            </p>
            <OptionRow
              id="enableFieldTracking"
              label="Field tracking"
              description="Adds spans around variables for debugging"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="debug"
              label="Debug mode"
              description="Logs step-by-step processing to console"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="yamlOnly"
              label="Skip YAML"
              description="Returns markdown with variables unresolved"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="noHeaders"
              label="No headers"
              description="Disables l. / ll. / lll. numbering"
              options={options}
              onChange={onChange}
            />
            <Separator className="bg-slate-700 my-2" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Clause &amp; Content
            </p>
            <OptionRow
              id="noClauses"
              label="No clauses"
              description="Disables [text]{condition} blocks"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="noReferences"
              label="No references"
              description="Disables cross-reference processing"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="noMixins"
              label="No mixins"
              description="Disables @include mixin expansion"
              options={options}
              onChange={onChange}
            />
            <Separator className="bg-slate-700 my-2" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Header Formatting
            </p>
            <OptionRow
              id="noReset"
              label="No reset"
              description="Prevents resetting header counters"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="noIndent"
              label="No indent"
              description="Disables nested header indentation"
              options={options}
              onChange={onChange}
            />
            <OptionRow
              id="throwOnYamlError"
              label="Strict YAML"
              description="Stops processing on malformed YAML"
              options={options}
              onChange={onChange}
            />
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>Processing options</TooltipContent>
    </Tooltip>
  );
}
