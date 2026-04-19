# lobster-ui Architecture

## Overview

lobster-ui is a visual editor for Lobster workflow files. It reads `.lobster`, `.yaml`, `.yml`, and `.json` workflow files, visualizes them as a node graph in React Flow, and allows editing of workflow metadata and step properties.

## Project Goals

- **What it is**: A local-first workflow file browser and editor for Lobster workflows
- **What it is NOT**: A workflow executor, agent platform, or remote SaaS product

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐   │
│  │ Sidebar  │  │   Canvas   │  │ Inspector  │   │
│  │         │  │(ReactFlow) │  │   Panel   │   │
│  └──────────┘  └──────────────┘  └─────────────┘   │
├─────────────────────────────────────────────────────────────┤
│              State Management (Zustand)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              useWorkflowStore                   │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                             │
│  ┌──────────────┐  ┌────────────────────┐              │
│  │ /api/workfl │  │ /api/workflows/[path]│              │
│  │    ows     │  │                    │              │
│  └──────────────┘  └────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│              File System (Node.js)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐     │
│  │  Discovery  │  │   Parser    │  │ Serializer│     │
│  └─────────────┘  └──────────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
lobster-ui/
├── app/
│   ├── api/
│   │   ├── workflows/
│   │   │   └── route.ts       # GET: list workflows in directory
│   │   └── workflows/
│   │       └── [...path]/
│   │           └── route.ts   # GET/PUT: read/write single workflow
│   ├── globals.css          # Tailwind + shadcn/ui theme
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main app page
├── components/
│   ├── flow/
│   │   ├── WorkflowCanvas.tsx  # React Flow wrapper
│   │   └── nodes/
│   │       ├── StepNode.tsx    # Step node component
│   │       └── MetadataNode.tsx # Workflow metadata node
│   ├── shell/
│   │   ├── WorkflowList.tsx    # Left sidebar file tree
│   │   └── InspectorPanel.tsx # Right panel for editing
│   └── ui/
│       └── button.tsx         # shadcn/ui Button component
├── lib/
│   ├── lobster/
│   │   ├── schema.ts    # Zod schemas for validation
│   │   ├── parser.ts   # YAML/JSON parsing
│   │   ├── store.ts  # Zustand state management
│   │   └── graph.ts  # Convert workflow to React Flow graph
│   └── utils.ts     # cn() utility for className merging
├── docs/
│   └── ARCHITECTURE.md  # This file
├── .github/
│   └── workflows/
│       └── ci.yml       # GitHub Actions CI
└── package.json
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

### 5. Custom React Flow Nodes

We use generic `NodeProps` type to avoid strict TypeScript conflicts with @xyflow/react:

```typescript
export function StepNode({ data, selected }: NodeProps) {
  // Access data with type guards
  const label = typeof data?.label === "string" ? data.label : "";
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
|--------|---------|
| @xyflow/react | Node-based graph editor |
| zustand | Client state management |
| yaml | YAML parsing/serialization |
| zod | Schema validation |
| lucide-react | Icons |
| clsx, tailwind-merge | ClassName utilities |

### Development

| Package | Purpose |
|--------|---------|
| next | React framework |
| typescript | Type safety |
| tailwindcss | Styling |

## API Routes

### GET `/api/workflows?dir=<path>`

Lists all Lobster workflows in a directory.

**Response**:
```json
{
  "workflows": [
    { "path": "/path/to/workflow.yaml", "name": "My Workflow", "steps": [...] }
  ]
}
```

### GET `/api/workflows?path=<path>`

Reads a single workflow file.

**Response**:
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

**Request Body**:
```json
{
  "workflow": { "name": "My Workflow", "steps": [...] },
  "format": "yaml"
}
```

## State Management

The Zustand store (`lib/lobster/store.ts`) manages:

- `workflows`: Array of loaded workflows
- `selectedWorkflowId`: Currently selected workflow path
- `selectedNodeId`: Currently selected step ID
- `layouts`: Node positions (per workflow)
- `settings`: User preferences
- `isDirty`: Unsaved changes indicator
- `validationErrors`: Current validation errors

## Theme & Styling

Uses shadcn/ui design tokens in `app/globals.css`:

- `--color-primary`, `--color-secondary`, etc.
- Dark mode via `@media (prefers-color-scheme: dark)`
- Tailwind v4 for utility classes

## Future Considerations

- Layout persistence (needs external storage)
- Command palette (cmdk integration)
- Toast notifications (sonner integration)
- Drag-to-reorder steps
- Create new workflows from UI