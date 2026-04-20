import { create } from "zustand";
import { type LobsterWorkflow, type WorkflowFile, type WorkflowLayout, type AppSettings } from "./schema";

interface WorkflowState {
  workflows: WorkflowFile[];
  selectedWorkflowId: string | null;
  selectedNodeId: string | null;
  layouts: Record<string, WorkflowLayout>;
  settings: AppSettings;
  isDirty: boolean;
  validationErrors: string[];
  viewMode: "canvas" | "source";
  history: { past: LobsterWorkflow[]; future: LobsterWorkflow[] };
  selectedWorkflowPath: string | null;

  loadWorkflows: (dirs: string[]) => Promise<void>;
  selectWorkflow: (path: string | null) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  updateWorkflow: (path: string, workflow: LobsterWorkflow, addToHistory?: boolean) => void;
  saveWorkflow: (path: string) => Promise<void>;
  updateLayout: (workflowId: string, layout: WorkflowLayout) => Promise<void>;
  addStep: (workflowPath: string, step: { id: string; command: string }) => void;
  deleteStep: (workflowPath: string, stepId: string) => void;
  validateWorkflow: (workflow: LobsterWorkflow) => string[];
  updateSettings: (settings: Partial<AppSettings>) => void;
  refreshWorkflow: (path: string) => Promise<void>;
  createWorkflow: (name: string, dir: string) => Promise<string | null>;
  setViewMode: (mode: "canvas" | "source") => void;
  updateWorkflowFromRaw: (path: string, rawContent: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

async function fetchWorkflowsFromAPI(dirs: string[]): Promise<WorkflowFile[]> {
  const allWorkflows: WorkflowFile[] = [];

  for (const dir of dirs) {
    try {
      const response = await fetch(`/api/workflows?dir=${encodeURIComponent(dir)}`);
      if (response.ok) {
        const data = await response.json();
        for (const wf of data.workflows || []) {
          allWorkflows.push({
            path: wf.path,
            workflow: {
              name: wf.name,
              steps: wf.steps,
              args: undefined,
              env: undefined,
            },
            format: wf.path.endsWith(".json") ? "json" : "yaml",
            rawContent: "",
            lastModified: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch workflows from ${dir}:`, error);
    }
  }

  return allWorkflows;
}

async function fetchWorkflowFromAPI(path: string): Promise<WorkflowFile | null> {
  try {
    const response = await fetch(`/api/workflows?path=${encodeURIComponent(path)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        path: data.path,
        workflow: data.workflow,
        format: data.format,
        rawContent: data.rawContent,
        lastModified: new Date(),
      };
    }
  } catch (error) {
    console.error(`Failed to fetch workflow from ${path}:`, error);
  }
  return null;
}

async function saveWorkflowToAPI(path: string, workflow: LobsterWorkflow, format: "json" | "yaml" | "ts"): Promise<boolean> {
  try {
    const response = await fetch(`/api/workflows?path=${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow, format }),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to save workflow to ${path}:`, error);
    return false;
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  selectedWorkflowId: null,
  selectedNodeId: null,
  layouts: {},
  settings: {
    workflowDirs: [],
    uiTheme: "system",
  },
  isDirty: false,
  validationErrors: [],
  viewMode: "canvas",
  history: { past: [], future: [] },
  selectedWorkflowPath: null,

  loadWorkflows: async (dirs: string[]) => {
    const allWorkflows = await fetchWorkflowsFromAPI(dirs);
    set({ workflows: allWorkflows, isDirty: false });
  },

  selectWorkflow: async (path: string | null) => {
    set({ selectedWorkflowId: path, selectedNodeId: null });
    if (path) {
      // Load layout for the selected workflow
      try {
        const response = await fetch(`/api/workflows/layout?path=${encodeURIComponent(path)}`);
        if (response.ok) {
          const layout = await response.json();
          const { layouts } = get();
          set({ layouts: { ...layouts, [path]: layout } });
        }
      } catch (error) {
        console.error("Failed to load layout:", error);
      }
    }
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  updateWorkflow: (path: string, workflow: LobsterWorkflow, addToHistory = true) => {
    const { workflows, history, selectedWorkflowId } = get();
    
    // Add to history if enabled and this is the currently selected workflow
    let newHistory = history;
    if (addToHistory && selectedWorkflowId === path) {
      const wfIndex = workflows.findIndex(w => w.path === path);
      if (wfIndex !== -1) {
        const current = workflows[wfIndex].workflow;
        newHistory = {
          past: [...history.past, current],
          future: [],
        };
      }
    }

    const updated = workflows.map((w) =>
      w.path === path ? { ...w, workflow } : w
    );
    set({ workflows: updated, isDirty: true, history: newHistory });
    get().validateWorkflow(workflow);
  },

  saveWorkflow: async (path: string) => {
    const { workflows } = get();
    const workflowFile = workflows.find((w) => w.path === path);
    if (!workflowFile) return;

    const success = await saveWorkflowToAPI(path, workflowFile.workflow, workflowFile.format);
    if (success) {
      set({ isDirty: false });
    }
  },

  updateLayout: async (workflowId: string, layout: WorkflowLayout) => {
    const { layouts } = get();
    set({ layouts: { ...layouts, [workflowId]: layout } });
    
    // Persist layout to disk
    try {
      await fetch(`/api/workflows/layout?path=${encodeURIComponent(workflowId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  },

  addStep: (workflowPath: string, step: { id: string; command: string }) => {
    const { workflows } = get();
    const workflow = workflows.find((w) => w.path === workflowPath);
    if (!workflow) return;

    const updatedWorkflow = {
      ...workflow.workflow,
      steps: [...workflow.workflow.steps, step],
    };
    set({
      workflows: workflows.map((w) =>
        w.path === workflowPath ? { ...w, workflow: updatedWorkflow } : w
      ),
      isDirty: true,
    });
  },

  deleteStep: (workflowPath: string, stepId: string) => {
    const { workflows } = get();
    const workflow = workflows.find((w) => w.path === workflowPath);
    if (!workflow) return;

    const updatedWorkflow = {
      ...workflow.workflow,
      steps: workflow.workflow.steps.filter((s) => s.id !== stepId),
    };
    set({
      workflows: workflows.map((w) =>
        w.path === workflowPath ? { ...w, workflow: updatedWorkflow } : w
      ),
      isDirty: true,
    });
  },

  validateWorkflow: (workflow: LobsterWorkflow) => {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push("Workflow should have a name");
    }
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push("Workflow must have at least one step");
    }

    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (stepIds.has(step.id)) {
        errors.push(`Duplicate step id: ${step.id}`);
      }
      stepIds.add(step.id);

      // Validate step has execution type
      const hasRun = step.run || step.command;
      const hasPipeline = step.pipeline;
      const hasWorkflow = step.workflow;
      const hasParallel = step.parallel;
      const hasForEach = step.for_each;
      const hasApproval = step.approval;
      const hasInput = step.input;

      if (!hasRun && !hasPipeline && !hasWorkflow && !hasParallel && !hasForEach && !hasApproval && !hasInput) {
        errors.push(`Step ${step.id} must have run, pipeline, workflow, parallel, for_each, approval, or input`);
      }

      // Validate parallel branches
      if (step.parallel) {
        const branches = step.parallel.branches || [];
        if (branches.length === 0) {
          errors.push(`Step ${step.id} parallel requires at least one branch`);
        }
        const branchIds = new Set<string>();
        for (const branch of branches) {
          if (branchIds.has(branch.id)) {
            errors.push(`Step ${step.id} has duplicate parallel branch id: ${branch.id}`);
          }
          branchIds.add(branch.id);
        }
      }

      // Validate for_each has inner steps
      if (step.for_each && (!step.steps || step.steps.length === 0)) {
        errors.push(`Step ${step.id} for_each requires inner steps`);
      }

      // Validate input has prompt and responseSchema
      if (step.input) {
        if (!step.input.prompt) {
          errors.push(`Step ${step.id} input requires a prompt`);
        }
        if (!step.input.responseSchema) {
          errors.push(`Step ${step.id} input requires responseSchema`);
        }
      }

      // Validate workflow_args is object if present
      if (step.workflow_args && (typeof step.workflow_args !== 'object' || Array.isArray(step.workflow_args))) {
        errors.push(`Step ${step.id} workflow_args must be an object`);
      }
    }

    for (const step of workflow.steps) {
      if (typeof step.stdin === "string") {
        const match = step.stdin.match(/\$(\w+)\./);
        if (match) {
          const refStepId = match[1];
          if (!stepIds.has(refStepId)) {
            errors.push(`Step ${step.id} references unknown step: ${refStepId}`);
          }
        }
      }

      // Validate condition references
      if (typeof step.condition === "string") {
        const refs = step.condition.match(/\$(\w+)/g);
        if (refs) {
          for (const ref of refs) {
            const match = ref.match(/\$(\w+)/);
            if (match && !stepIds.has(match[1])) {
              errors.push(`Step ${step.id} condition references unknown step: ${match[1]}`);
            }
          }
        }
      }

      // Validate when references
      if (typeof step.when === "string") {
        const refs = step.when.match(/\$(\w+)/g);
        if (refs) {
          for (const ref of refs) {
            const match = ref.match(/\$(\w+)/);
            if (match && !stepIds.has(match[1])) {
              errors.push(`Step ${step.id} when references unknown step: ${match[1]}`);
            }
          }
        }
      }
    }

    set({ validationErrors: errors });
    return errors;
  },

  updateSettings: (newSettings: Partial<AppSettings>) => {
    const { settings } = get();
    set({ settings: { ...settings, ...newSettings } });
  },

  refreshWorkflow: async (path: string) => {
    const refreshed = await fetchWorkflowFromAPI(path);
    if (!refreshed) return;

    const { workflows } = get();
    const index = workflows.findIndex((w) => w.path === path);
    if (index === -1) return;

    const updated = [...workflows];
    updated[index] = refreshed;
    set({ workflows: updated });
  },

  createWorkflow: async (name: string, dir: string) => {
    try {
      const response = await fetch("/api/workflows/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dir }),
      });
      if (response.ok) {
        const data = await response.json();
        const { loadWorkflows, settings } = get();
        await loadWorkflows(settings.workflowDirs);
        return data.path;
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
    }
    return null;
  },

  setViewMode: (mode: "canvas" | "source") => set({ viewMode: mode }),

  updateWorkflowFromRaw: (path: string, rawContent: string) => {
    const { workflows } = get();
    const index = workflows.findIndex((w) => w.path === path);
    if (index === -1) return;

    const updatedWorkflows = [...workflows];
    const previous = updatedWorkflows[index];
    
    // We try to parse it to keep the structured workflow in sync if possible
    // But we don't block the raw content update if parsing fails
    let updatedWorkflow = previous.workflow;
    try {
      const { LobsterWorkflowSchema } = require("./schema");
      const YAML = require("yaml");
      const data = previous.format === "json" ? JSON.parse(rawContent) : YAML.parse(rawContent);
      updatedWorkflow = LobsterWorkflowSchema.parse(data);
    } catch (e) {
      // Parsing failed, we still update rawContent so it can be saved/edited
      console.warn("Raw parse failed:", e);
    }

    updatedWorkflows[index] = {
      ...previous,
      rawContent,
      workflow: updatedWorkflow,
    };

    set({ workflows: updatedWorkflows, isDirty: true });
  },

  undo: () => {
    const { history, selectedWorkflowId, workflows } = get();
    if (history.past.length === 0 || !selectedWorkflowId) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    const wfIndex = workflows.findIndex(w => w.path === selectedWorkflowId);
    if (wfIndex === -1) return;

    const current = workflows[wfIndex].workflow;

    set({
      workflows: workflows.map((w, i) => 
        i === wfIndex ? { ...w, workflow: previous } : w
      ),
      history: {
        past: newPast,
        future: [current, ...history.future],
      },
      isDirty: true,
    });
  },

  redo: () => {
    const { history, selectedWorkflowId, workflows } = get();
    if (history.future.length === 0 || !selectedWorkflowId) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    const wfIndex = workflows.findIndex(w => w.path === selectedWorkflowId);
    if (wfIndex === -1) return;

    const current = workflows[wfIndex].workflow;

    set({
      workflows: workflows.map((w, i) => 
        i === wfIndex ? { ...w, workflow: next } : w
      ),
      history: {
        past: [...history.past, current],
        future: newFuture,
      },
      isDirty: true,
    });
  },

  canUndo: () => get().history.past.length > 0,
  canRedo: () => get().history.future.length > 0,
}));