import { z } from "zod";

export const LobsterArgSchema = z.object({
  default: z.unknown().optional(),
  description: z.string().optional(),
});

export type LobsterArg = z.infer<typeof LobsterArgSchema>;

export const LobsterApprovalSchema = z.union([
  z.literal("required"),
  z.boolean(),
  z.string(),
  z.object({
    prompt: z.string().optional(),
    items: z.unknown().optional(),
    preview: z.string().optional(),
    initiated_by: z.string().optional(),
    initiatedBy: z.string().optional(),
    required_approver: z.string().optional(),
    requiredApprover: z.string().optional(),
    require_different_approver: z.boolean().optional(),
    requireDifferentApprover: z.boolean().optional(),
  }),
]);

export type LobsterApproval = z.infer<typeof LobsterApprovalSchema>;

export const LobsterWorkflowInputSchema = z.object({
  prompt: z.string(),
  responseSchema: z.unknown(),
  defaults: z.unknown().optional(),
});

export type LobsterWorkflowInput = z.infer<typeof LobsterWorkflowInputSchema>;

export const LobsterParallelBranchSchema = z.object({
  id: z.string(),
  run: z.string().optional(),
  command: z.string().optional(),
  pipeline: z.string().optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  stdin: z.unknown().optional(),
});

export type LobsterParallelBranch = z.infer<typeof LobsterParallelBranchSchema>;

export const LobsterParallelConfigSchema = z.object({
  wait: z.enum(["all", "any"]).optional(),
  timeout_ms: z.number().optional(),
  branches: z.array(LobsterParallelBranchSchema),
});

export type LobsterParallelConfig = z.infer<typeof LobsterParallelConfigSchema>;

export const LobsterRetrySchema = z.object({
  max: z.number().optional(),
  backoff: z.enum(["fixed", "exponential"]).optional(),
  delay_ms: z.number().optional(),
  max_delay_ms: z.number().optional(),
  jitter: z.boolean().optional(),
});

export type LobsterRetry = z.infer<typeof LobsterRetrySchema>;

export const LobsterStepEnvSchema = z.record(z.string());

export const LobsterStepSchema = z.object({
  id: z.string(),
  run: z.string().optional(),
  command: z.string().optional(),
  pipeline: z.string().optional(),
  workflow: z.string().optional(),
  workflow_args: z.record(z.unknown()).optional(),
  env: LobsterStepEnvSchema.optional(),
  cwd: z.string().optional(),
  stdin: z.unknown().optional(),
  approval: LobsterApprovalSchema.optional(),
  input: LobsterWorkflowInputSchema.optional(),
  condition: z.unknown().optional(),
  when: z.unknown().optional(),
  parallel: LobsterParallelConfigSchema.optional(),
  for_each: z.string().optional(),
  item_var: z.string().optional(),
  index_var: z.string().optional(),
  batch_size: z.number().optional(),
  pause_ms: z.number().optional(),
  steps: z.array(z.unknown()).optional(),
  timeout_ms: z.number().optional(),
  on_error: z.enum(["stop", "continue", "skip_rest"]).optional(),
  retry: LobsterRetrySchema.optional(),
});

export type LobsterStep = z.infer<typeof LobsterStepSchema>;

export type LobsterStepType = "run" | "command" | "pipeline" | "workflow" | "parallel" | "for_each" | "approval" | "input";

export function getStepType(step: LobsterStep): LobsterStepType {
  if (step.parallel) return "parallel";
  if (step.for_each) return "for_each";
  if (step.workflow) return "workflow";
  if (step.pipeline) return "pipeline";
  if (step.approval) return "approval";
  if (step.input) return "input";
  if (step.run || step.command) return "run";
  return "command";
}

export const LobsterWorkflowSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  args: z.record(LobsterArgSchema).optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  cost_limit: z
    .object({
      max_usd: z.number(),
      action: z.enum(["warn", "stop"]).optional(),
    })
    .optional(),
  steps: z.array(LobsterStepSchema),
});

export type LobsterWorkflow = z.infer<typeof LobsterWorkflowSchema>;

export interface WorkflowFile {
  path: string;
  workflow: LobsterWorkflow;
  format: "json" | "yaml" | "ts";
  rawContent: string;
  lastModified: Date;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowLayout {
  nodes: Record<string, NodePosition>;
}

export interface EnvFile {
  path: string;
  name: string;
  variables: Record<string, string>;
  isSecret: Record<string, boolean>;
}

export interface AppSettings {
  workflowDirs: string[];
  uiTheme: "light" | "dark" | "system";
  envFiles: string[];
}

export function getStepCommand(step: LobsterStep): string {
  return step.run || step.command || step.pipeline || step.workflow || "";
}

export function getEnvVariables(workflow: LobsterWorkflow): string[] {
  const vars = new Set<string>();
  const pattern = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;
  
  for (const step of workflow.steps) {
    const cmd = getStepCommand(step);
    let match;
    while ((match = pattern.exec(cmd)) !== null) {
      vars.add(match[1]);
    }
    
    if (step.env) {
      for (const key of Object.keys(step.env)) {
        const value = step.env[key];
        while ((match = pattern.exec(value)) !== null) {
          vars.add(match[1]);
        }
      }
    }
    
    if (step.stdin && typeof step.stdin === "string") {
      while ((match = pattern.exec(step.stdin)) !== null) {
        vars.add(match[1]);
      }
    }
    
    if (step.workflow_args) {
      const argsStr = JSON.stringify(step.workflow_args);
      while ((match = pattern.exec(argsStr)) !== null) {
        vars.add(match[1]);
      }
    }
  }
  
  if (workflow.env) {
    for (const key of Object.keys(workflow.env)) {
      const value = workflow.env[key];
      while ((match = pattern.exec(value)) !== null) {
        vars.add(match[1]);
      }
    }
  }
  
  return Array.from(vars);
}