# Components Reference

This document provides detailed documentation for all UI components in lobster-ui.

## Overview

lobster-ui is organized into the following component categories:

- **Flow Components**: React Flow canvas and nodes
- **Shell Components**: Application layout and panels
- **UI Components**: Reusable UI elements

---

## Flow Components

### WorkflowCanvas

The main React Flow wrapper component that renders the workflow visualization.

**Location**: `src/components/flow/WorkflowCanvas.tsx`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `nodes` | `Node[]` | Yes | - | Array of React Flow nodes |
| `edges` | `Edge[]` | Yes | - | Array of React Flow edges |
| `onNodeClick` | `(nodeId: string) => void` | No | - | Node click handler |
| `onSave` | `() => void` | No | - | Save button handler |
| `isDirty` | `boolean` | No | - | Unsaved changes indicator |

**Implementation**:

```typescript
const nodeTypes: NodeTypes = {
  stepNode: StepNode as unknown as NodeTypes[string],
  metadata: MetadataNode as unknown as NodeTypes[string],
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodeClick={onNodeClickHandler}
  nodeTypes={nodeTypes}
  defaultEdgeOptions={defaultEdgeOptions}
  fitView
  fitViewOptions={{ padding: 0.2 }}
  minZoom={0.1}
  maxZoom={2}
  proOptions={{ hideAttribution: true }}
>
  <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
  <Controls />
  <MiniMap nodeColor={...} maskColor="rgba(0, 0, 0, 0.1)" />
  <Panel position="top-right">...</Panel>
</ReactFlow>
```

---

### StepNode

Custom node component for workflow steps.

**Location**: `src/components/flow/nodes/StepNode.tsx`

**Node Data Interface**:

```typescript
interface StepNodeData {
  label: string;
  command: string;
  stepType: "run" | "command" | "pipeline" | "workflow" | "parallel" | "for_each" | "approval" | "input";
  stdin?: unknown;
  condition?: unknown;
  when?: unknown;
  approval?: unknown;
  input?: unknown;
  env?: Record<string, string>;
  cwd?: string;
  retry?: RetryConfig;
  timeout_ms?: number;
  on_error?: string;
  parallel?: unknown;
  for_each?: string;
  workflow?: string;
  workflow_args?: Record<string, unknown>;
}
```

**Visual Features**:

- **Handles**: Top (target) and bottom (source)
- **Color-coded border** based on step type
- **Badges** for step type indicators
- **Truncated command** display
- **stdin/condition/when** references shown

**Border Colors**:

| Step Type | Color |
|----------|-------|
| run | border-blue-500 |
| pipeline | border-violet-500 |
| approval | border-amber-500 |
| input | border-cyan-500 |
| parallel | border-indigo-500 |
| for_each | border-teal-500 |
| workflow | border-blue-500 |
| conditional | border-pink-500 |

---

### MetadataNode

Custom node for workflow metadata display.

**Location**: `src/components/flow/nodes/MetadataNode.tsx`

**Features**:

- **Position**: Always at top of canvas
- **Handle**: Source at bottom only
- **Styling**: Violet themed
- **Displays**: Workflow name

---

## Shell Components

### InspectorPanel

Right-side panel for editing step properties.

**Location**: `src/components/shell/InspectorPanel.tsx`

**States**:

1. **No workflow selected**: Shows "Select a workflow to view details"
2. **No node selected**: Shows workflow info, steps list, validation errors
3. **Node selected**: Shows editable step properties

**Editable Properties**:

| Field | Type | Description |
|-------|------|-------------|
| Step ID | text | Unique identifier |
| Type | dropdown | Step type selector |
| Command | textarea | Run/pipeline command |
| Stdin | text | Input reference |
| Condition | text | Conditional expression |
| When | text | Conditional expression |
| CWD | text | Working directory |
| Timeout | number | Timeout in ms |
| Retry | number/select | Max retries |
| On Error | dropdown | Error handling |

**Step Templates**:

```typescript
const STEP_TEMPLATES = [
  { id: "run", name: "Run", description: "Shell command", step: { run: "echo 'Hello'" } },
  { id: "pipeline", name: "Pipeline", description: "LLM pipeline", step: { pipeline: "llm.invoke --prompt ''" } },
  { id: "approval", name: "Approval", description: "Require approval", step: { approval: "required" } },
  { id: "input", name: "Input", description: "User input request", step: { input: { prompt: "Enter value:", responseSchema: { type: "string" } } } },
  { id: "parallel", name: "Parallel", description: "Run branches in parallel", step: { parallel: { branches: [...] } } },
  { id: "for_each", name: "For Each", description: "Loop over items", step: { for_each: "$items.json", steps: [...] } },
  { id: "workflow", name: "Workflow", description: "Call sub-workflow", step: { workflow: "./sub-workflow.yaml" } },
];
```

---

### WorkflowList

Left sidebar component displaying workflow files.

**Location**: `src/components/shell/WorkflowList.tsx`

**Features**:

- **Directory grouping**: Workflows grouped by parent directory
- **Selection**: Click to select workflow
- **Visual feedback**: Selected state highlighted
- **Icons**: File icon for each workflow
- **Empty state**: "No workflows found" message

**Grouping Logic**:

```typescript
const workflowGroups = workflows.reduce((acc, wf) => {
  const dir = wf.path.split("/").slice(0, -1).join("/");
  if (!acc[dir]) acc[dir] = [];
  acc[dir].push(wf);
  return acc;
}, {} as Record<string, typeof workflows>);
```

---

### SourceEditor

Raw YAML/JSON editor for direct text editing.

**Location**: `src/components/shell/SourceEditor.tsx`

**Features**:

- **Monospace font**: Code editor styling
- **Dark theme**: slate-950 background
- **Real-time sync**: Changes sync to store
- **Resizable**: Full height container

**Implementation**:

```typescript
<textarea
  value={content}
  onChange={handleChange}
  spellCheck={false}
  className="flex-1 w-full h-full p-4 bg-transparent outline-none resize-none overflow-auto"
/>
```

---

## UI Components

### Button

shadcn/ui Button component.

**Location**: `src/components/ui/button.tsx`

**Variants**:

| Variant | Description |
|--------|-------------|
| `default` | Primary action |
| `destructive` | Danger action |
| `outline` | Outlined style |
| `secondary` | Secondary action |
| `ghost` | Minimal style |
| `link` | Link style |

**Sizes**:

| Size | Description |
|------|-------------|
| `default` | Default size |
| `sm` | Small |
| `lg` | Large |
| `icon` | Icon only |

---

## React Flow Built-in Components

### Background

Adds dot grid pattern to canvas.

```typescript
<Background variant={BackgroundVariant.Dots} gap={20} size={1} />
```

**Variants**: `Dots`, `Lines`, `Cross`

---

### Controls

Navigation controls panel.

```typescript
<Controls />
```

**Default Buttons**:
- Zoom in
- Zoom out
- Fit view
- Toggle interactivity

---

### MiniMap

Overview minimap of the workflow.

```typescript
<MiniMap
  nodeColor={(node) => colorBasedOnType}
  maskColor="rgba(0, 0, 0, 0.1)"
/>
```

**Color Coding**:

| Node Type | Color |
|----------|-------|
| metadata | #8b5cf6 (violet) |
| approval | #f59e0b (amber) |
| input | #06b6d4 (cyan) |
| parallel | #6366f1 (indigo) |
| for_each | #14b8a6 (teal) |
| workflow | #3b82f6 (blue) |
| conditional | #ec4899 (pink) |
| default | #3b82f6 (blue) |

---

### Panel

Positioned overlay container.

```typescript
<Panel position="top-right" className="flex gap-2">
  <Button onClick={handleFitView}>Fit View</Button>
  <Button onClick={handleSave}>Save</Button>
</Panel>
```

**Positions**: `top-left`, `top-right`, `bottom-left`, `bottom-right`

---

## Event Handlers

### Node Click Handler

```typescript
const onNodeClickHandler = useCallback(
  (_: React.MouseEvent, node: Node) => {
    if (node.id !== "workflow-metadata") {
      onNodeClick?.(node.id);
    }
  },
  [onNodeClick]
);
```

---

## TypeScript Types

### Node Definition

```typescript
interface Node {
  id: string;
  type: "stepNode" | "metadata";
  position: { x: number; y: number };
  data: StepNodeData | MetadataData;
}
```

### Edge Definition

```typescript
interface Edge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
  style: React.CSSProperties;
  label?: string;
  labelStyle?: React.CSSProperties;
}
```

---

## Component Hierarchy

```
Home (page.tsx)
├── ReactFlowProvider
│   └── WorkflowCanvas
│       ├── Background
│       ├── Controls
│       ├── MiniMap
│       ├── Panel
│       │   ├── Button (Fit View)
│       │   └── Button (Save)
│       ├── StepNode[]
│       └── MetadataNode
├── WorkflowList (sidebar)
├── InspectorPanel (inspector)
└── SourceEditor (conditional)
```