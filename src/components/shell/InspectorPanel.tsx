"use client";

import { useWorkflowStore } from "@/lib/lobster/store";
import { Button } from "@/components/ui/button";
import { type LobsterStep } from "@/lib/lobster/schema";

interface StepTemplate {
  id: string;
  name: string;
  description: string;
  step: Partial<LobsterStep>;
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

export function InspectorPanel() {
  const {
    workflows,
    selectedWorkflowId,
    selectedNodeId,
    updateWorkflow,
    deleteStep,
    validationErrors,
  } = useWorkflowStore();

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
    deleteStep(workflow.path, stepId);
  };

  const step = workflow.workflow.steps.find((s) => s.id === selectedNodeId);

  if (!selectedNodeId || !step) {
    return (
      <div className="p-4 space-y-4 overflow-auto max-h-full">
        {/* Workflow Info */}
        <div>
          <h3 className="font-medium mb-2">{workflow.workflow.name}</h3>
          <div className="text-sm text-muted-foreground">
            {workflow.workflow.steps.length} step(s)
          </div>
          {workflow.workflow.args && Object.keys(workflow.workflow.args).length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(workflow.workflow.args).length} arg(s)
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
          <label className="text-xs font-medium block mb-1">
            {step.pipeline ? "Pipeline Command" : "Run Command"}
          </label>
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
    </div>
  );
}