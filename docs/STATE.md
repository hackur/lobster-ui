# State Management

This document describes the Zustand store and state management patterns in lobster-ui.

## Overview

lobster-ui uses Zustand for client-side state management. The store is located at `src/lib/lobster/store.ts` and manages all application state including workflows, selections, settings, and UI state.

---

## Store Structure

### State Interface

```typescript
interface WorkflowState {
  // Data
  workflows: WorkflowFile[];
  selectedWorkflowId: string | null;
  selectedNodeId: string | null;
  layouts: Record<string, WorkflowLayout>;
  settings: AppSettings;
  
  // UI State
  isDirty: boolean;
  validationErrors: string[];
  viewMode: "canvas" | "source";
  
  // Actions
  loadWorkflows: (dirs: string[]) => Promise<void>;
  selectWorkflow: (path: string | null) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  updateWorkflow: (path: string, workflow: LobsterWorkflow) => void;
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
}
```

---

## State Slices

### 1. Workflows Data

```typescript
workflows: WorkflowFile[]
```

**Structure**:

```typescript
interface WorkflowFile {
  path: string;
  workflow: LobsterWorkflow;
  format: "json" | "yaml" | "ts";
  rawContent: string;
  lastModified: Date;
}
```

**TypeScript**:

```typescript
interface LobsterWorkflow {
  name?: string;
  description?: string;
  args?: Record<string, LobsterArg>;
  env?: Record<string, string>;
  cwd?: string;
  cost_limit?: { max_usd: number; action?: "warn" | "stop" };
  steps: LobsterStep[];
}
```

---

### 2. Selection State

```typescript
selectedWorkflowId: string | null
selectedNodeId: string | null
```

- `selectedWorkflowId`: Currently displayed workflow path
- `selectedNodeId`: Currently selected step in inspector

---

### 3. Layout State

```typescript
layouts: Record<string, WorkflowLayout>
```

**Structure**:

```typescript
interface WorkflowLayout {
  nodes: Record<string, NodePosition>;
}

interface NodePosition {
  x: number;
  y: number;
}
```

Layouts are persisted to disk as hidden JSON files.

---

### 4. Settings State

```typescript
interface AppSettings {
  workflowDirs: string[];
  uiTheme: "light" | "dark" | "system";
}
```

---

### 5. UI State

```typescript
isDirty: boolean          // Has unsaved changes
validationErrors: string[] // Validation error messages
viewMode: "canvas" | "source" // Editor mode
```

---

## Actions

### loadWorkflows

Loads workflows from specified directories.

```typescript
loadWorkflows: async (dirs: string[]) => {
  const allWorkflows = await fetchWorkflowsFromAPI(dirs);
  set({ workflows: allWorkflows, isDirty: false });
}
```

**Flow**:
1. Calls `/api/workflows?dir=<dir>` for each directory
2. Parses and validates responses
3. Updates workflow list
4. Resets dirty flag

---

### selectWorkflow

Selects a workflow for viewing.

```typescript
selectWorkflow: async (path: string | null) => {
  set({ selectedWorkflowId: path, selectedNodeId: null });
  if (path) {
    // Load layout for the selected workflow
    const response = await fetch(`/api/workflows/layout?path=${encodeURIComponent(path)}`);
    if (response.ok) {
      const layout = await response.json();
      const { layouts } = get();
      set({ layouts: { ...layouts, [path]: layout } });
    }
  }
}
```

---

### selectNode

Selects a step node for editing.

```typescript
selectNode: (nodeId: string | null) => {
  set({ selectedNodeId: nodeId });
}
```

---

### updateWorkflow

Updates workflow data and triggers validation.

```typescript
updateWorkflow: (path: string, workflow: LobsterWorkflow) => {
  const { workflows } = get();
  const updated = workflows.map((w) =>
    w.path === path ? { ...w, workflow } : w
  );
  set({ workflows: updated, isDirty: true });
  get().validateWorkflow(workflow);
}
```

---

### saveWorkflow

Saves workflow to disk.

```typescript
saveWorkflow: async (path: string) => {
  const { workflows } = get();
  const workflowFile = workflows.find((w) => w.path === path);
  if (!workflowFile) return;

  const success = await saveWorkflowToAPI(path, workflowFile.workflow, workflowFile.format);
  if (success) {
    set({ isDirty: false });
  }
}
```

---

### updateLayout

Saves node positions to disk.

```typescript
updateLayout: async (workflowId: string, layout: WorkflowLayout) => {
  const { layouts } = get();
  set({ layouts: { ...layouts, [workflowId]: layout } });
  
  // Persist layout to disk
  await fetch(`/api/workflows/layout?path=${encodeURIComponent(workflowId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(layout),
  });
}
```

---

### addStep / deleteStep

```typescript
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
}

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
}
```

---

### validateWorkflow

Validates workflow against schema and business rules.

```typescript
validateWorkflow: (workflow: LobsterWorkflow) => {
  const errors: string[] = [];

  // Required fields
  if (!workflow.name) {
    errors.push("Workflow should have a name");
  }
  if (!workflow.steps || workflow.steps.length === 0) {
    errors.push("Workflow must have at least one step");
  }

  // Unique step IDs
  const stepIds = new Set<string>();
  for (const step of workflow.steps) {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step id: ${step.id}`);
    }
    stepIds.add(step.id);
    
    // Step type validation
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
  }

  // Reference validation
  for (const step of workflow.steps) {
    // Validate stdin references
    if (typeof step.stdin === "string") {
      const match = step.stdin.match(/\$(\w+)\./);
      if (match && !stepIds.has(match[1])) {
        errors.push(`Step ${step.id} references unknown step: ${match[1]}`);
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
  }

  set({ validationErrors: errors });
  return errors;
}
```

---

### updateSettings

Updates application settings.

```typescript
updateSettings: (newSettings: Partial<AppSettings>) => {
  const { settings } = get();
  set({ settings: { ...settings, ...newSettings } });
}
```

---

## Selectors

### Current Workflow

```typescript
const workflow = workflows.find((w) => w.path === selectedWorkflowId);
```

### Current Step

```typescript
const step = workflow?.workflow.steps.find((s) => s.id === selectedNodeId);
```

### Graph Data

```typescript
const graph = workflow 
  ? workflowsToGraph(workflow.workflow, layouts[workflow.path]?.nodes) 
  : { nodes: [], edges: [] };
```

---

## Initialization

The store is initialized on app start:

```typescript
useEffect(() => {
  const init = async () => {
    await loadWorkflows([DEFAULT_DIR]);
    updateSettings({ workflowDirs: [DEFAULT_DIR] });
  };
  init();
}, []);
```

---

## State Persistence

### Workflows

- Loaded on demand via API
- Saved explicitly via Save action

### Layouts

- Loaded when workflow is selected
- Saved automatically when nodes are moved

### Settings

- Stored in Zustand (in-memory)
- Could be persisted to localStorage

---

## Best Practices

1. **Always use store actions**: Never modify state directly
2. **Use selectors**: Get derived data from selectors
3. **Handle async properly**: Use async/await in actions
4. **Validate before save**: Run validation before persistence
5. **Reset dirty flag**: Clear after successful save