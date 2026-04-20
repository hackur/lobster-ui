# lobster-ui Architecture

## Overview

lobster-ui is a visual editor for Lobster workflow files built with Next.js, React Flow (by xyflow), and shadcn/ui. It reads `.lobster`, `.yaml`, `.yml`, and `.json` workflow files, visualizes them as a node graph in React Flow, and allows editing of workflow metadata and step properties.

## Project Goals

- **What it is**: A local-first workflow file browser and editor for Lobster workflows
- **What it is NOT**: A workflow executor, agent platform, or remote SaaS product

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │ Sidebar  │  │   Canvas   │  │ Inspector  │        │
│  │WorkflowList│ │(ReactFlow)│  │   Panel   │        │
│  └──────────┘  └──────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│              State Management (Zustand)                    │
│  ┌─────────────────────────────────────────────────┐       │
│  │              useWorkflowStore                   │       │
│  └─────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                             │
│  ┌──────────────┐  ┌────────────────────┐              │
│  │ /api/workflow│  │ /api/workflows/[path]│             │
│  │    s         │  │                    │             │
│  └──────────────┘  └────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│              File System (Node.js)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐       │
│  │  Discovery  │  │   Parser    │  │ Serializer│       │
│  └─────────────┘  └──────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
lobster-ui/
├── app/
│   ├── api/
│   │   └── workflows/
│   │       ├── route.ts           # GET: list workflows in directory
│   │       ├── [...path]/route.ts # GET/PUT: read/write single workflow
│   │       ├── create/route.ts    # POST: create new workflow
│   │       ├── import/route.ts   # POST: import workflow
│   │       ├── export/route.ts   # POST: export workflow
│   │       └── layout/route.ts   # GET/PUT: node layout positions
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                 # Main app page
│   └── globals.css              # Global styles (Tailwind v4)
├── components/
│   ├── flow/
│   │   ├── WorkflowCanvas.tsx    # React Flow wrapper
│   │   └── nodes/
│   │       ├── StepNode.tsx      # Custom step node
│   │       └── MetadataNode.tsx # Workflow metadata node
│   ├── shell/
│   │   ├── WorkflowList.tsx     # Left sidebar file tree
│   │   ├── InspectorPanel.tsx    # Right panel for editing
│   │   └── SourceEditor.tsx      # Raw YAML/JSON editor
│   └── ui/
│       └── button.tsx            # shadcn/ui Button
├── lib/
│   ├── lobster/
│   │   ├── schema.ts             # Zod schemas
│   │   ├── parser.ts            # File parsing
│   │   ├── store.ts            # Zustand state
│   │   └── graph.ts           # Graph conversion
│   └── utils.ts                # cn() utility
├── workflows/                   # Sample workflows
├── docs/                       # Documentation
└── package.json
```

## React Flow Implementation

### Custom Nodes

lobster-ui implements two custom node types:

#### StepNode (`StepNode.tsx`)
- Displays step ID, command, step type badges
- Shows `stdin`, `condition`, `when` references
- Color-coded border based on step type
- Source handle at bottom for connections
- Target handle at top for incoming connections

**Node Data Interface:**
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

#### MetadataNode (`MetadataNode.tsx`)
- Displays workflow name
- Violet themed styling
- Source handle for connecting to first step

### Edge Implementation

Three edge types with distinct visual styling:

| Edge Type | Color | Style | Purpose |
|----------|-------|------|---------|
| **Data Flow** | Blue (#3b82f6) | Solid, 2px | stdin references |
| **Conditional** | Pink (#ec4899) | Animated | condition/when references |
| **Sequence** | Gray (#e2e8f0) | Dashed, 4x4 | Sequential execution |

### React Flow Components Used

| Component | Location | Purpose |
|-----------|----------|---------|
| **ReactFlow** | WorkflowCanvas.tsx | Main canvas wrapper |
| **Background** | WorkflowCanvas.tsx | Dot grid pattern |
| **Controls** | WorkflowCanvas.tsx | Zoom in/out, fit view |
| **MiniMap** | WorkflowCanvas.tsx | Flow overview with color coding |
| **Panel** | WorkflowCanvas.tsx | Fit View and Save buttons |
| **Handle** | StepNode, MetadataNode | Connection points |
| **ReactFlowProvider** | page.tsx | Context provider |

### React Flow Hooks Used

```typescript
// Navigation and viewport
const { screenToFlowPosition } = useReactFlow();
const { fitView } = useReactFlow();

// State management
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// Edge manipulation
const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
```

### Configuration Props

The main ReactFlow component uses these props:

```typescript
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
```

## Key Design Decisions

### 1. Server-Side File Operations

All file system operations happen in API routes, not in client components. This ensures:
- No "Module not found: fs" errors in browser
- Proper server-side rendering
- Security through Next.js API routes

### 2. Two-Layer Architecture for Workflows

- **API Layer** (`/api/workflows`): Raw file operations
- **Store Layer** (`lib/lobster/store.ts`): Client-state management

This allows the UI to work with typed data while keeping file operations server-side.

### 3. Schema-First Validation

All workflows are validated against Zod schemas before display:
- Ensures type safety
- Catches errors early
- Provides validation error messages to users

### 4. Graph Mapping Strategy

The `graph.ts` module converts Lobster workflows to React Flow nodes:
- **Metadata node**: Always at top, shows workflow name
- **Step nodes**: One per workflow step
- **Explicit edges**: From `stdin`, `condition`, or `when` references
- **Inferred edges**: Dashed, showing sequence order

### 5. Custom Node Implementation

We use generic `NodeProps` type to avoid strict TypeScript conflicts with @xyflow/react:

```typescript
export function StepNode({ data, selected }: NodeProps) {
  // Access data with type guards
  const stepData = data as unknown as StepNodeData;
  const label = stepData?.label || "";
}
```

## Data Flow

### Loading a Workflow

1. User clicks workflow in sidebar
2. `selectWorkflow(path)` is called
3. Store sets `selectedWorkflowId`
4. `page.tsx` finds workflow and calls `workflowsToGraph()`
5. React Flow renders nodes and edges

### Editing a Step

1. User clicks node on canvas
2. `selectNode(stepId)` is called
3. Inspector shows step fields
4. User edits field → `updateWorkflow()` → store marked dirty
5. User clicks Save → API writes file

### Validation

- Runs automatically when workflow is loaded
- Checks: required name, at least one step, unique IDs, valid references
- Shows errors in Inspector panel

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| @xyflow/react | Node-based graph editor (React Flow) |
| zustand | Client state management |
| yaml | YAML parsing/serialization |
| zod | Schema validation |
| lucide-react | Icons |
| clsx, tailwind-merge | ClassName utilities |

### Development

| Package | Purpose |
|---------|---------|
| next | React framework |
| typescript | Type safety |
| tailwindcss | Styling |

## API Routes

### GET `/api/workflows?dir=<path>`

Lists all Lobster workflows in a directory.

**Response:**
```json
{
  "workflows": [
    { "path": "/path/to/workflow.yaml", "name": "My Workflow", "steps": [...] }
  ]
}
```

### GET `/api/workflows?path=<path>`

Reads a single workflow file.

**Response:**
```json
{
  "path": "/path/to/workflow.yaml",
  "workflow": { "name": "My Workflow", "steps": [...] },
  "format": "yaml",
  "rawContent": "..."
}
```

### PUT `/api/workflows?path=<path>`

Saves a workflow file.

**Request Body:**
```json
{
  "workflow": { "name": "My Workflow", "steps": [...] },
  "format": "yaml"
}
```

### POST `/api/workflows/create`

Creates a new workflow file.

**Request Body:**
```json
{
  "name": "My Workflow",
  "dir": "/path/to/dir"
}
```

### POST `/api/workflows/import`

Imports a workflow from content.

**Request Body:**
```json
{
  "content": "name: My Workflow\nsteps: [...]",
  "format": "yaml"
}
```

### POST `/api/workflows/export`

Exports a workflow to different formats.

**Request Body:**
```json
{
  "workflow": { "name": "My Workflow", "steps": [...] },
  "format": "yaml" // or "json", "mermaid", "ts"
}
```

### GET `/api/workflows/layout?path=<path>`

Gets saved node positions.

### PUT `/api/workflows/layout?path=<path>`

Saves node positions.

## State Management

The Zustand store (`lib/lobster/store.ts`) manages:

```typescript
interface WorkflowState {
  workflows: WorkflowFile[];           // Loaded workflows
  selectedWorkflowId: string | null;  // Currently selected workflow
  selectedNodeId: string | null;       // Currently selected step
  layouts: Record<string, WorkflowLayout>; // Node positions
  settings: AppSettings;              // User preferences
  isDirty: boolean;                  // Unsaved changes flag
  validationErrors: string[];        // Current validation errors
  viewMode: "canvas" | "source";     // Editor mode
}
```

**Store Actions:**
- `loadWorkflows(dirs)` - Load workflows from directories
- `selectWorkflow(path)` - Select a workflow
- `selectNode(nodeId)` - Select a step node
- `updateWorkflow(path, workflow)` - Update workflow data
- `saveWorkflow(path)` - Save to disk
- `updateLayout(workflowId, layout)` - Save node positions
- `addStep(workflowPath, step)` - Add new step
- `deleteStep(workflowPath, stepId)` - Delete step
- `validateWorkflow(workflow)` - Run validation
- `updateSettings(settings)` - Update preferences
- `createWorkflow(name, dir)` - Create new workflow

## Theme & Styling

Uses shadcn/ui design tokens in `app/globals.css`:

- `--color-primary`, `--color-secondary`, etc.
- Dark mode via `@media (prefers-color-scheme: dark)`
- Tailwind v4 for utility classes

### MiniMap Color Coding

```typescript
nodeColor={(node) => {
  if (node.type === "metadata") return "#8b5cf6";
  if (node.data?.approval) return "#f59e0b";
  if (node.data?.input) return "#06b6d4";
  if (node.data?.parallel) return "#6366f1";
  if (node.data?.for_each) return "#14b8a6";
  if (node.data?.workflow) return "#3b82f6";
  if (node.data?.condition || node.data?.when) return "#ec4899";
  return "#3b82f6";
}}
```

## Future Considerations

### Planned Features

- **Auto Layout**: Integrate dagre or elkjs for automatic node positioning
- **Node Resizing**: Allow resizing step nodes
- **Node Toolbar**: Add toolbar for quick actions on selected nodes
- **Undo/Redo**: Implement with React Flow's hooks
- **Drag to Create**: Drag from edge to create new node
- **Edge Labels Editable**: Make edge labels editable inline

### Potential Enhancements

- **Command Palette**: cmdk integration for quick actions
- **Toast Notifications**: sonner for feedback
- **Drag to Reorder**: Reorder steps via drag and drop
- **Template Workflows**: Create workflows from templates
- **Workflow Import from URL**: Import from remote files
- **Export as Image**: Download workflow as PNG/SVG