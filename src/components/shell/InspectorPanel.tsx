"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { Button } from "@/components/ui/button";
import { type LobsterStep, type LobsterWorkflow } from "@/lib/lobster/schema";
import { FilePlus, X, AlertTriangle } from "lucide-react";

interface StepTemplate {
  id: string;
  name: string;
  description: string;
  step: Partial<LobsterStep>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  workflow: Partial<LobsterWorkflow>;
}

const STEP_TEMPLATES: StepTemplate[] = [
  { id: "run", name: "Run", description: "Shell command", step: { run: "echo 'Hello'" } },
  { id: "pipeline", name: "Pipeline", description: "LLM pipeline", step: { pipeline: "llm.invoke --prompt ''" } },
  { id: "approval", name: "Approval", description: "Require approval", step: { approval: "required" } },
  { id: "input", name: "Input", description: "User input request", step: { input: { prompt: "Enter value:", responseSchema: { type: "string" } } } },
  { id: "parallel", name: "Parallel", description: "Run branches in parallel", step: { parallel: { branches: [{ id: "branch1", run: "echo '1'" }, { id: "branch2", run: "echo '2'" }] } } },
  { id: "for_each", name: "For Each", description: "Loop over items", step: { for_each: "$items.json", steps: [{ id: "inner", run: "echo ${item}" }] } },
  { id: "workflow", name: "Workflow", description: "Call sub-workflow", step: { workflow: "./sub-workflow.yaml" } },
];

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "basic",
    name: "Basic Workflow",
    description: "Simple sequential steps",
    workflow: {
      name: "New Workflow",
      description: "A basic workflow",
      steps: [
        { id: "step1", run: "echo 'Hello'" },
        { id: "step2", run: "echo 'Done'" },
      ],
    },
  },
  {
    id: "llm-pipeline",
    name: "LLM Pipeline",
    description: "Multi-step LLM processing",
    workflow: {
      name: "LLM Pipeline",
      description: "Process data with LLM",
      steps: [
        { id: "extract", pipeline: "llm.invoke --prompt 'Extract key info' $" },
        { id: "transform", pipeline: "llm.invoke --prompt 'Transform data' $.output" },
        { id: "save", run: "cat > output.json" },
      ],
    },
  },
  {
    id: "approval-gate",
    name: "Approval Gate",
    description: "Requires human approval",
    workflow: {
      name: "Approval Workflow",
      description: "Waits for approval before proceeding",
      steps: [
        { id: "prepare", run: "echo 'Ready for review'" },
        { id: "approval", approval: "required" },
        { id: "execute", run: "echo 'Approved, proceeding'" },
      ],
    },
  },
  {
    id: "parallel-processing",
    name: "Parallel Processing",
    description: "Run tasks concurrently",
    workflow: {
      name: "Parallel Workflow",
      description: "Process multiple items in parallel",
      steps: [
        { id: "split", run: "echo 'items'" },
        { 
          id: "process", 
          parallel: { 
            branches: [
              { id: "branch1", run: "echo 'process 1'" },
              { id: "branch2", run: "echo 'process 2'" },
              { id: "branch3", run: "echo 'process 3'" },
            ] 
          } 
        },
        { id: "merge", run: "echo 'All done'" },
      ],
    },
  },
  {
    id: "batch-loop",
    name: "Batch Loop",
    description: "Process items in a loop",
    workflow: {
      name: "Batch Workflow",
      description: "Process each item",
      steps: [
        { id: "fetch", run: "curl -s https://api.example.com/items" },
        { id: "process", for_each: "$.json", steps: [{ id: "item", run: "echo ${item}" }] },
      ],
    },
  },
  {
    id: "error-handling",
    name: "With Error Handling",
    description: "Retry and error handling",
    workflow: {
      name: "Resilient Workflow",
      description: "Handles failures gracefully",
      steps: [
        { 
          id: "main", 
          run: "npm run task",
          retry: { max: 3, backoff: "exponential", delay_ms: 1000, jitter: true },
          on_error: "continue",
        },
        { id: "fallback", run: "echo 'Using fallback'" },
      ],
    },
  },
];

export function InspectorPanel() {
  const {
    workflows,
    selectedWorkflowId,
    selectedNodeId,
    updateWorkflow,
    deleteStep,
    validationErrors,
  } = useWorkflowStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const workflow = workflows.find((w) => w.path === selectedWorkflowId);

  if (!workflow) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a workflow to view details
      </div>
    );
  }

  const handleUpdateStep = (stepId: string, field: string, value: unknown) => {
    const updatedSteps = workflow.workflow.steps.map((step) => {
      if (step.id !== stepId) return step;
      return { ...step, [field]: value };
    });
    updateWorkflow(workflow.path, { ...workflow.workflow, steps: updatedSteps });
  };

  const handleDeleteStep = (stepId: string) => {
    setShowDeleteConfirm(stepId);
  };

  const confirmDeleteStep = (stepId: string) => {
    deleteStep(workflow.path, stepId);
    setShowDeleteConfirm(null);
  };

  const step = workflow.workflow.steps.find((s) => s.id === selectedNodeId);

  if (!selectedNodeId || !step) {
    const updateWorkflowMeta = (field: string, value: unknown) => {
      updateWorkflow(workflow.path, { ...workflow.workflow, [field]: value });
    };

    return (
      <div className="p-4 space-y-6 overflow-auto max-h-full">
        {/* Workflow Metadata */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Workflow Settings</h3>
          </div>
          
          <div>
            <label className="text-xs font-medium block mb-1">Name</label>
            <input
              type="text"
              value={workflow.workflow.name || ""}
              onChange={(e) => updateWorkflowMeta("name", e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              placeholder="My Workflow"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Description</label>
            <textarea
              value={workflow.workflow.description || ""}
              onChange={(e) => updateWorkflowMeta("description", e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-sm rounded-md border bg-background resize-none"
              placeholder="What does this workflow do?"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Working Directory</label>
            <input
              type="text"
              value={workflow.workflow.cwd || ""}
              onChange={(e) => updateWorkflowMeta("cwd", e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
              placeholder="/path/to/dir"
            />
          </div>
        </div>

        {/* Cost Limit */}
        <div className="space-y-3 border-b pb-4">
          <h4 className="text-sm font-medium">Cost Limit</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Max USD</label>
              <input
                type="number"
                value={workflow.workflow.cost_limit?.max_usd || ""}
                onChange={(e) => updateWorkflowMeta("cost_limit", { 
                  max_usd: parseFloat(e.target.value) || 0,
                  action: workflow.workflow.cost_limit?.action 
                })}
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
                placeholder="10.00"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Action</label>
              <select
                value={workflow.workflow.cost_limit?.action || "warn"}
                onChange={(e) => updateWorkflowMeta("cost_limit", { 
                  max_usd: workflow.workflow.cost_limit?.max_usd || 10,
                  action: e.target.value
                })}
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              >
                <option value="warn">Warn</option>
                <option value="stop">Stop</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflow Args */}
        <div className="space-y-3 border-b pb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Arguments</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const currentArgs = workflow.workflow.args || {};
                const newArgName = `arg${Object.keys(currentArgs).length + 1}`;
                updateWorkflowMeta("args", { ...currentArgs, [newArgName]: { description: "", default: "" } });
              }}
            >
              + Add
            </Button>
          </div>
          {Object.entries(workflow.workflow.args || {}).map(([argName, argDef]) => (
            <div key={argName} className="p-2 rounded-md bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={argName}
                  readOnly
                  className="font-mono text-xs bg-transparent w-24"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs text-destructive"
                  onClick={() => {
                    const newArgs = { ...workflow.workflow.args };
                    delete newArgs[argName];
                    updateWorkflowMeta("args", newArgs);
                  }}
                >
                  ×
                </Button>
              </div>
              <input
                type="text"
                value={argDef.description || ""}
                onChange={(e) => {
                  const newArgs = { ...workflow.workflow.args };
                  newArgs[argName] = { ...newArgs[argName], description: e.target.value };
                  updateWorkflowMeta("args", newArgs);
                }}
                className="w-full px-2 py-1 text-xs rounded border bg-background"
                placeholder="Description"
              />
              <input
                type="text"
                value={String(argDef.default ?? "")}
                onChange={(e) => {
                  const newArgs = { ...workflow.workflow.args };
                  newArgs[argName] = { ...newArgs[argName], default: e.target.value };
                  updateWorkflowMeta("args", newArgs);
                }}
                className="w-full px-2 py-1 text-xs rounded border bg-background font-mono"
                placeholder="Default value"
              />
            </div>
          ))}
          {(!workflow.workflow.args || Object.keys(workflow.workflow.args).length === 0) && (
            <div className="text-xs text-muted-foreground text-center py-2">
              No arguments defined
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <h4 className="text-sm font-medium text-destructive mb-2">
              Validation Errors
            </h4>
            <ul className="text-xs space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i} className="text-destructive">
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Workflow Stats */}
        <div className="p-3 rounded-md bg-muted/30 space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Workflow Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Steps</span>
              <span className="font-medium">{workflow.workflow.steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enabled</span>
              <span className="font-medium">{workflow.workflow.steps.filter(s => s.enabled !== false).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LLM Steps</span>
              <span className="font-medium">{workflow.workflow.steps.filter(s => s.pipeline).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parallel</span>
              <span className="font-medium">{workflow.workflow.steps.filter(s => s.parallel).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loops</span>
              <span className="font-medium">{workflow.workflow.steps.filter(s => s.for_each).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sub-workflows</span>
              <span className="font-medium">{workflow.workflow.steps.filter(s => s.workflow).length}</span>
            </div>
          </div>
        </div>

        {/* Run Preview */}
        <div className="space-y-3 border-b pb-4">
          <h4 className="text-sm font-medium">Execution Preview</h4>
          <div className="text-xs text-muted-foreground mb-2">Steps will execute in this order:</div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {workflow.workflow.steps.map((s, idx) => (
              <div
                key={s.id}
                className={`p-2 text-sm rounded flex items-center gap-2 ${
                  s.enabled === false ? "opacity-50 bg-muted/30" : "bg-muted/50"
                }`}
              >
                <span className="text-muted-foreground w-5">{idx + 1}.</span>
                <span className="font-mono truncate flex-1">{s.id}</span>
                {s.parallel && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-600">parallel</span>
                )}
                {s.for_each && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-teal-500/20 text-teal-600">loop</span>
                )}
                {s.approval && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-600">⏳</span>
                )}
                {s.enabled === false && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">disabled</span>
                )}
              </div>
            ))}
          </div>
          {workflow.workflow.steps.some(s => s.enabled === false) && (
            <p className="text-xs text-amber-600">
              ⚠️ {workflow.workflow.steps.filter(s => s.enabled === false).length} step(s) disabled
            </p>
          )}
        </div>

        {/* Steps List */}
        <div>
          <h4 className="text-sm font-medium mb-2">Steps</h4>
          <div className="space-y-1">
            {workflow.workflow.steps.map((s) => (
              <div
                key={s.id}
                className="p-2 text-sm rounded bg-muted/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono">{s.id}</span>
                  {s.pipeline && (
                    <span className="px-1 py-0.5 text-[10px] rounded bg-violet-500/20 text-violet-600">LLM</span>
                  )}
                  {s.approval && (
                    <span className="px-1 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-600">approval</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {s.run || s.command || s.pipeline || ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Step Button with Templates */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              const newId = `step${workflow.workflow.steps.length + 1}`;
              const newStep: LobsterStep = {
                id: newId,
                run: "echo 'Hello'",
              };
              const newSteps = [...workflow.workflow.steps, newStep];
              updateWorkflow(workflow.path, { ...workflow.workflow, steps: newSteps });
            }}
          >
            + Add Step
          </Button>
          
          <details className="group">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              + Add from template
            </summary>
            <div className="mt-2 space-y-1">
              {STEP_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left px-2 py-1.5 text-xs rounded bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => {
                    const newId = `step${workflow.workflow.steps.length + 1}`;
                    const newStep: LobsterStep = {
                      id: newId,
                      ...template.step,
                    };
                    const newSteps = [...workflow.workflow.steps, newStep];
                    updateWorkflow(workflow.path, { ...workflow.workflow, steps: newSteps });
                  }}
                >
                  <span className="font-medium">{template.name}</span>
                  <span className="text-muted-foreground ml-2">{template.description}</span>
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-auto max-h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Step: {step.id}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newId = `${step.id}_copy`;
              const newStep = { ...step, id: newId };
              // Clear unique fields
              delete (newStep as Record<string, unknown>).approval;
              delete (newStep as Record<string, unknown>).input;
              delete (newStep as Record<string, unknown>).parallel;
              delete (newStep as Record<string, unknown>).for_each;
              delete (newStep as Record<string, unknown>).workflow;
              const newSteps = [...workflow.workflow.steps, newStep as LobsterStep];
              updateWorkflow(workflow.path, { ...workflow.workflow, steps: newSteps });
            }}
          >
            Duplicate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteStep(step.id)}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Enabled Toggle */}
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
          <label className="text-sm">Enabled</label>
          <button
            type="button"
            onClick={() => handleUpdateStep(step.id, "enabled", !(step.enabled ?? true))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              step.enabled !== false ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                step.enabled !== false ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Step ID */}
        <div>
          <label className="text-xs font-medium block mb-1">Step ID</label>
          <input
            type="text"
            value={step.id}
            onChange={(e) => handleUpdateStep(step.id, "id", e.target.value)}
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          />
        </div>

        {/* Command Type */}
        <div>
          <label className="text-xs font-medium block mb-1">Type</label>
          <select
            value={
              step.parallel
                ? "parallel"
                : step.for_each
                ? "for_each"
                : step.workflow
                ? "workflow"
                : step.input
                ? "input"
                : step.pipeline
                ? "pipeline"
                : step.approval
                ? "approval"
                : "run"
            }
            onChange={(e) => {
              const type = e.target.value;
              if (type === "pipeline") {
                handleUpdateStep(step.id, "pipeline", "llm.invoke --prompt ''");
                handleUpdateStep(step.id, "run", undefined);
              } else if (type === "approval") {
                handleUpdateStep(step.id, "approval", "required");
                handleUpdateStep(step.id, "run", undefined);
              } else if (type === "parallel") {
                handleUpdateStep(step.id, "parallel", { branches: [{ id: `${step.id}_branch1`, run: "echo 'branch1'" }] });
                handleUpdateStep(step.id, "run", undefined);
                handleUpdateStep(step.id, "pipeline", undefined);
              } else if (type === "for_each") {
                handleUpdateStep(step.id, "for_each", "$items.json");
                handleUpdateStep(step.id, "steps", [{ id: `${step.id}_inner`, run: "echo ${item}" }]);
                handleUpdateStep(step.id, "run", undefined);
                handleUpdateStep(step.id, "pipeline", undefined);
              } else if (type === "input") {
                handleUpdateStep(step.id, "input", { prompt: "Enter value:", responseSchema: { type: "string" } });
                handleUpdateStep(step.id, "run", undefined);
                handleUpdateStep(step.id, "pipeline", undefined);
              } else if (type === "workflow") {
                handleUpdateStep(step.id, "workflow", "./sub-workflow.yaml");
                handleUpdateStep(step.id, "run", undefined);
                handleUpdateStep(step.id, "pipeline", undefined);
              } else {
                handleUpdateStep(step.id, "pipeline", undefined);
                handleUpdateStep(step.id, "approval", undefined);
                handleUpdateStep(step.id, "parallel", undefined);
                handleUpdateStep(step.id, "for_each", undefined);
                handleUpdateStep(step.id, "input", undefined);
                handleUpdateStep(step.id, "workflow", undefined);
                handleUpdateStep(step.id, "run", "echo 'Hello'");
              }
            }}
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="run">run (shell)</option>
            <option value="pipeline">pipeline (LLM)</option>
            <option value="approval">approval (gate)</option>
            <option value="input">input (request)</option>
            <option value="parallel">parallel</option>
            <option value="for_each">for_each (loop)</option>
            <option value="workflow">workflow (sub)</option>
          </select>
        </div>

        {/* Command / Run */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium">
              {step.pipeline ? "Pipeline Command" : "Run Command"}
            </label>
            <button
              type="button"
              onClick={() => {
                const cmd = step.run || step.command || step.pipeline || "";
                navigator.clipboard.writeText(cmd);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Copy
            </button>
          </div>
          <textarea
            value={step.run || step.command || step.pipeline || ""}
            onChange={(e) => {
              if (step.pipeline) {
                handleUpdateStep(step.id, "pipeline", e.target.value);
              } else {
                handleUpdateStep(step.id, "run", e.target.value);
              }
            }}
            rows={3}
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono resize-none"
            placeholder={step.pipeline ? "llm.invoke --prompt ''" : "echo 'Hello'"}
          />
        </div>

        {/* Stdin */}
        <div>
          <label className="text-xs font-medium block mb-1">Stdin (data from step)</label>
          <input
            type="text"
            value={String(step.stdin ?? "")}
            onChange={(e) =>
              handleUpdateStep(step.id, "stdin", e.target.value || undefined)
            }
            placeholder="$step.stdout or $step.json"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
          />
        </div>

        {/* Condition / When */}
        <div>
          <label className="text-xs font-medium block mb-1">Condition (if)</label>
          <input
            type="text"
            value={String(step.condition ?? "")}
            onChange={(e) =>
              handleUpdateStep(step.id, "condition", e.target.value || undefined)
            }
            placeholder="$step.exitCode == 0"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">When (conditional)</label>
          <input
            type="text"
            value={String(step.when ?? "")}
            onChange={(e) =>
              handleUpdateStep(step.id, "when", e.target.value || undefined)
            }
            placeholder="$approval.approved"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
          />
        </div>

        {/* CWD */}
        <div>
          <label className="text-xs font-medium block mb-1">Working Directory (cwd)</label>
          <input
            type="text"
            value={step.cwd || ""}
            onChange={(e) =>
              handleUpdateStep(step.id, "cwd", e.target.value || undefined)
            }
            placeholder="/path/to/dir"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          />
        </div>

        {/* Timeout */}
        <div>
          <label className="text-xs font-medium block mb-1">Timeout (ms)</label>
          <input
            type="number"
            value={step.timeout_ms || ""}
            onChange={(e) =>
              handleUpdateStep(step.id, "timeout_ms", e.target.value ? Number(e.target.value) : undefined)
            }
            placeholder="30000"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          />
        </div>

        {/* Retry */}
        <div>
          <label className="text-xs font-medium block mb-1">Retry Count</label>
          <input
            type="number"
            value={step.retry?.max || ""}
            onChange={(e) => {
              const max = e.target.value ? Number(e.target.value) : undefined;
              handleUpdateStep(step.id, "retry", max ? { max, backoff: "exponential", delay_ms: 1000 } : undefined);
            }}
            placeholder="3"
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          />
        </div>

        {/* Retry Backoff */}
        {step.retry?.max && (
          <div>
            <label className="text-xs font-medium block mb-1">Retry Backoff</label>
            <select
              value={step.retry?.backoff || "exponential"}
              onChange={(e) =>
                handleUpdateStep(step.id, "retry", {
                  ...step.retry,
                  backoff: e.target.value as "fixed" | "exponential",
                })
              }
              className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
            >
              <option value="fixed">fixed</option>
              <option value="exponential">exponential</option>
            </select>
          </div>
        )}

        {/* Retry Delay */}
        {step.retry?.max && (
          <div>
            <label className="text-xs font-medium block mb-1">Retry Delay (ms)</label>
            <input
              type="number"
              value={step.retry?.delay_ms || ""}
              onChange={(e) =>
                handleUpdateStep(step.id, "retry", {
                  ...step.retry,
                  delay_ms: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="1000"
              className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
            />
          </div>
        )}

        {/* Retry Jitter */}
        {step.retry?.max && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="retry-jitter"
              checked={step.retry?.jitter || false}
              onChange={(e) =>
                handleUpdateStep(step.id, "retry", {
                  ...step.retry,
                  jitter: e.target.checked,
                })
              }
            />
            <label htmlFor="retry-jitter" className="text-xs">Add Jitter</label>
          </div>
        )}

        {/* On Error */}
        <div>
          <label className="text-xs font-medium block mb-1">On Error</label>
          <select
            value={step.on_error || ""}
            onChange={(e) =>
              handleUpdateStep(step.id, "on_error", e.target.value || undefined)
            }
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">default (stop)</option>
            <option value="stop">stop - halt workflow</option>
            <option value="continue">continue - proceed to next step</option>
            <option value="skip_rest">skip_rest - skip remaining steps</option>
          </select>
        </div>

        {/* Comment / Notes */}
        <div>
          <label className="text-xs font-medium block mb-1">Comment / Notes</label>
          <textarea
            value={step.comment || ""}
            onChange={(e) => handleUpdateStep(step.id, "comment", e.target.value || undefined)}
            rows={2}
            className="w-full px-2 py-1.5 text-sm rounded-md border bg-background resize-none"
            placeholder="Add notes about this step..."
          />
        </div>

        {/* Parallel Editor */}
        {step.parallel && (
          <div className="p-3 rounded-md border bg-muted/30 space-y-3">
            <h4 className="text-xs font-medium">Parallel Branches</h4>
            <div>
              <label className="text-xs block mb-1">Wait Mode</label>
              <select
                value={step.parallel.wait || "all"}
                onChange={(e) =>
                  handleUpdateStep(step.id, "parallel", {
                    ...step.parallel,
                    wait: e.target.value as "all" | "any",
                  })
                }
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              >
                <option value="all">all - wait for all</option>
                <option value="any">any - wait for any</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={step.parallel.timeout_ms || ""}
                onChange={(e) =>
                  handleUpdateStep(step.id, "parallel", {
                    ...step.parallel,
                    timeout_ms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="30000"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Branches</label>
              <div className="space-y-2">
                {step.parallel.branches?.map((branch, idx) => (
                  <div key={branch.id} className="p-2 rounded bg-background border text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs">{branch.id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const branches = [...(step.parallel?.branches || [])];
                          branches.splice(idx, 1);
                          handleUpdateStep(step.id, "parallel", { ...step.parallel, branches });
                        }}
                        className="text-xs text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={branch.run || branch.command || ""}
                      onChange={(e) => {
                        const branches = [...(step.parallel?.branches || [])];
                        branches[idx] = { ...branch, run: e.target.value };
                        handleUpdateStep(step.id, "parallel", { ...step.parallel, branches });
                      }}
                      placeholder="echo 'branch command'"
                      className="w-full px-2 py-1 text-xs rounded border font-mono"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newBranch = { id: `${step.id}_branch${(step.parallel?.branches?.length || 0) + 1}`, run: "echo 'new branch'" };
                    handleUpdateStep(step.id, "parallel", {
                      ...step.parallel,
                      branches: [...(step.parallel?.branches || []), newBranch],
                    });
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add Branch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* For Each Editor */}
        {step.for_each && (
          <div className="p-3 rounded-md border bg-muted/30 space-y-3">
            <h4 className="text-xs font-medium">For Each Loop</h4>
            <div>
              <label className="text-xs block mb-1">Array Expression</label>
              <input
                type="text"
                value={step.for_each}
                onChange={(e) => handleUpdateStep(step.id, "for_each", e.target.value || undefined)}
                placeholder="$items.json"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Item Variable</label>
              <input
                type="text"
                value={step.item_var || "item"}
                onChange={(e) => handleUpdateStep(step.id, "item_var", e.target.value || undefined)}
                placeholder="item"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Index Variable</label>
              <input
                type="text"
                value={step.index_var || "index"}
                onChange={(e) => handleUpdateStep(step.id, "index_var", e.target.value || undefined)}
                placeholder="index"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Batch Size</label>
              <input
                type="number"
                value={step.batch_size || ""}
                onChange={(e) =>
                  handleUpdateStep(step.id, "batch_size", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="1"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Pause between batches (ms)</label>
              <input
                type="number"
                value={step.pause_ms || ""}
                onChange={(e) =>
                  handleUpdateStep(step.id, "pause_ms", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="500"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
          </div>
        )}

        {/* Input Request Editor */}
        {step.input && (
          <div className="p-3 rounded-md border bg-muted/30 space-y-3">
            <h4 className="text-xs font-medium">Input Request</h4>
            <div>
              <label className="text-xs block mb-1">Prompt</label>
              <input
                type="text"
                value={step.input.prompt || ""}
                onChange={(e) =>
                  handleUpdateStep(step.id, "input", { ...step.input, prompt: e.target.value })
                }
                placeholder="Enter value:"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Response Schema (JSON)</label>
              <textarea
                value={JSON.stringify(step.input.responseSchema, null, 2)}
                onChange={(e) => {
                  try {
                    const schema = JSON.parse(e.target.value);
                    handleUpdateStep(step.id, "input", { ...step.input, responseSchema: schema });
                  } catch {
                    // Invalid JSON, ignore for now
                  }
                }}
                rows={4}
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
                placeholder='{ "type": "string" }'
              />
            </div>
          </div>
        )}

        {/* Workflow Call Editor */}
        {step.workflow && (
          <div className="p-3 rounded-md border bg-muted/30 space-y-3">
            <h4 className="text-xs font-medium">Workflow Call</h4>
            <div>
              <label className="text-xs block mb-1">Workflow Path</label>
              <input
                type="text"
                value={step.workflow}
                onChange={(e) => handleUpdateStep(step.id, "workflow", e.target.value)}
                placeholder="./sub-workflow.yaml"
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs block mb-1">Workflow Args (JSON)</label>
              <textarea
                value={JSON.stringify(step.workflow_args || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const args = JSON.parse(e.target.value);
                    handleUpdateStep(step.id, "workflow_args", args);
                  } catch {
                    // Invalid JSON
                  }
                }}
                rows={3}
                className="w-full px-2 py-1.5 text-sm rounded-md border bg-background font-mono"
                placeholder='{ "key": "value" }'
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg shadow-lg p-4 w-80">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-medium">Delete Step?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete "{showDeleteConfirm}"? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDeleteStep(showDeleteConfirm)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}