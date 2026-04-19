"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface StepNodeData {
  label: string;
  command: string;
  stepType: "run" | "command" | "pipeline" | "workflow" | "parallel" | "for_each" | "approval" | "input";
  stdin?: unknown;
  when?: unknown;
  condition?: unknown;
  approval?: unknown;
  input?: unknown;
  env?: Record<string, string>;
  cwd?: string;
  retry?: { max?: number; backoff?: string; delay_ms?: number; jitter?: boolean };
  timeout_ms?: number;
  on_error?: string;
  parallel?: unknown;
  for_each?: string;
  workflow?: string;
  workflow_args?: Record<string, unknown>;
}

export function StepNode({ data, selected }: NodeProps) {
  const stepData = data as unknown as StepNodeData;
  const label = stepData?.label || "";
  const command = stepData?.command || "";
  const stepType = stepData?.stepType || "run";
  const stdin = typeof stepData?.stdin === "string" ? stepData.stdin : "";
  const condition = typeof stepData?.condition === "string" ? stepData.condition : "";
  const when = typeof stepData?.when === "string" ? stepData.when : "";
  const hasApproval = !!stepData?.approval;
  const hasInput = !!stepData?.input;
  const hasParallel = !!stepData?.parallel;
  const hasForEach = !!stepData?.for_each;
  const hasWorkflow = !!stepData?.workflow;
  const hasCondition = !!condition;
  const hasWhen = !!when;
  const hasStdin = !!stdin;
  const hasRetry = !!stepData?.retry?.max;
  const hasTimeout = !!stepData?.timeout_ms;
  const hasEnv = !!stepData?.env && Object.keys(stepData.env).length > 0;

  const getBorderColor = () => {
    if (hasApproval) return "border-amber-500";
    if (hasInput) return "border-cyan-500";
    if (hasParallel) return "border-indigo-500";
    if (hasForEach) return "border-teal-500";
    if (hasWorkflow) return "border-blue-500";
    if (stepType === "pipeline") return "border-violet-500";
    return "border-border";
  };

  const borderColor = getBorderColor();

  return (
    <div
      className={cn(
        "w-[280px] rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-colors",
        selected && "ring-2 ring-ring",
        borderColor
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3"
      />

      <div className="p-3">
        {/* Header with badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium truncate">{label}</span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {stepType === "pipeline" && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-500/20 text-violet-600">
                LLM
              </span>
            )}
            {hasApproval && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-600">
                approval
              </span>
            )}
            {hasInput && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-cyan-500/20 text-cyan-600">
                input
              </span>
            )}
            {hasParallel && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-500/20 text-indigo-600">
                parallel
              </span>
            )}
            {hasForEach && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-teal-500/20 text-teal-600">
                for_each
              </span>
            )}
            {hasWorkflow && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/20 text-blue-600">
                workflow
              </span>
            )}
            {(hasCondition || hasWhen) && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-pink-500/20 text-pink-600">
                {hasCondition ? "if" : "when"}
              </span>
            )}
            {hasRetry && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-500/20 text-green-600">
                retry
              </span>
            )}
            {hasTimeout && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-orange-500/20 text-orange-600">
                timeout
              </span>
            )}
          </div>
        </div>

        {/* Command or special step info */}
        {hasParallel && (
          <div className="text-xs text-muted-foreground truncate mb-2">
            parallel: {(stepData.parallel as { branches?: unknown[] })?.branches?.length || 0} branches
          </div>
        )}
        {hasForEach && (
          <div className="text-xs text-muted-foreground font-mono truncate mb-2">
            for_each: {stepData.for_each}
          </div>
        )}
        {hasWorkflow && (
          <div className="text-xs text-muted-foreground font-mono truncate mb-2">
            workflow: {stepData.workflow}
          </div>
        )}
        {hasInput && (
          <div className="text-xs text-muted-foreground truncate mb-2">
            input: {(stepData.input as { prompt?: string })?.prompt || "request"}
          </div>
        )}
        {!hasParallel && !hasForEach && !hasWorkflow && !hasInput && (
          <div className="text-xs text-muted-foreground font-mono truncate mb-2 max-h-10 overflow-hidden">
            {command}
          </div>
        )}

        {/* Stdin reference */}
        {hasStdin && (
          <div className="text-[10px] text-muted-foreground truncate mb-1">
            <span className="text-blue-500">stdin:</span> {stdin}
          </div>
        )}

        {/* Condition/When */}
        {hasCondition && (
          <div className="text-[10px] text-pink-500 truncate mb-1">
            <span>if:</span> {condition}
          </div>
        )}
        {hasWhen && (
          <div className="text-[10px] text-pink-500 truncate mb-1">
            <span>when:</span> {when}
          </div>
        )}

        {/* CWD */}
        {stepData?.cwd && (
          <div className="text-[10px] text-muted-foreground truncate">
            <span className="text-gray-500">cwd:</span> {stepData.cwd}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3"
      />
    </div>
  );
}