# lobster-ui

A visual editor for Lobster workflow files. Built with Next.js, React Flow (by xyflow), and shadcn/ui.

## What it is

`lobster-ui` is a local-first workflow file browser and editor for Lobster workflows. It reads `.lobster`, `.yaml`, `.yml`, and `.json` workflow files, visualizes them in a React Flow canvas, and lets you edit workflow metadata and step fields.

## What it is not

- A workflow executor or agent runner
- A replacement for Lobster/OpenClaw runtime
- A remote SaaS product

## Features

### Core Features
- **Discover and list workflows** from multiple local directories
- **Visual Canvas** - Visualize workflow steps as interactive nodes in React Flow
- **Source Editor** - Switch to raw code view with direct YAML/JSON editing
- **Layout Persistence** - Node positions automatically saved to `.lobster-ui.layout.[filename].json`
- **Undo/Redo** - Full history support for workflow modifications (built into React Flow)
- **Edit step properties** (id, command, stdin, condition, approval) via inspector panel
- **Save changes** back to disk (including raw source edits)
- **Real-time validation** for schema compliance and step references
- **Dark mode support**

### React Flow Features (Implemented)

| Feature | Status | Description |
|---------|--------|-------------|
| **Custom Nodes** | ✅ | StepNode and MetadataNode with full property display |
| **Custom Edges** | ✅ | Three edge types: data flow (blue), conditional (pink), sequence (dashed) |
| **Controls** | ✅ | Zoom in/out, fit view, toggle interactivity |
| **MiniMap** | ✅ | Overview of workflow with color-coded step types |
| **Background** | ✅ | Dot grid pattern for visual orientation |
| **Panel** | ✅ | Top-right panel with Fit View and Save buttons |
| **Drag & Drop** | ✅ | Drag nodes to reposition, auto-save positions |
| **Pan & Zoom** | ✅ | Mouse drag to pan, scroll/pinch to zoom |
| **Selection** | ✅ | Click to select, multi-select with Shift+click |
| **Connection Line** | ✅ | Visual feedback when connecting nodes |
| **Node Resizing** | ⏳ | Not yet implemented |
| **Auto Layout** | ⏳ | Not yet implemented (dagre/elkjs) |
| **Node Toolbar** | ⏳ | Not yet implemented |
| **Edge Labels** | ✅ | Shows "data", "if", "when", "→" on edges |
| **Animated Edges** | ✅ | Conditional edges animate to show flow direction |
| **Touch Support** | ✅ | Works on touch devices |
| **Accessibility** | ✅ | Keyboard navigation, ARIA labels |
| **Undo/Redo** | ⏳ | Need to implement with React Flow's hooks |

### Step Types Supported

Lobster-ui supports 7 distinct step types, each with unique visualization:

| Step Type | Color Code | Description |
|-----------|------------|-------------|
| `run` | Blue | Shell command execution |
| `pipeline` | Violet | LLM pipeline invocation |
| `approval` | Amber | Human approval gate |
| `input` | Cyan | User input request |
| `parallel` | Indigo | Parallel branch execution |
| `for_each` | Teal | Loop over items |
| `workflow` | Blue | Sub-workflow call |

### MiniMap Color Coding

The MiniMap automatically colors nodes by their type:
- **Metadata node**: Purple
- **Approval steps**: Amber
- **Input steps**: Cyan
- **Parallel steps**: Indigo
- **ForEach steps**: Teal
- **Workflow calls**: Blue
- **Conditional steps**: Pink
- **Default**: Blue

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lobster-ui.git
cd lobster-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

By default, lobster-ui looks for workflows in:
- `/Users/sarda/.openclaw/workflows`
- `/Users/sarda/.lobster/workflows`

To configure custom directories, click the Settings icon in the header and enter comma-separated directory paths.

Alternatively, set the `LOBSTER_UI_WORKFLOW_DIRS` environment variable:

```bash
export LOBSTER_UI_WORKFLOW_DIRS="/path/to/workflows1,/path/to/workflows2"
```

### Sample Workflows

The project includes sample workflows in the `workflows/` directory:

- `sample.yaml` - Full workflow demonstrating all step types
- `parallel-demo.yaml` - Parallel branch execution example
- `for-each-demo.yaml` - Loop iteration example
- `input-demo.yaml` - User input request example
- `complete-workflow-demo.yaml` - Comprehensive demo

## Supported File Formats

- `.lobster` - Lobster workflow files
- `.yaml` / `.yml` - YAML workflow definitions
- `.json` - JSON workflow definitions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save current workflow |
| `Cmd/Ctrl + N` | Create new workflow |
| `Escape` | Deselect current node |
| `Tab` | Navigate between nodes |
| Arrow Keys | Move selection between nodes |

## Development

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
lobster-ui/
├── app/
│   ├── api/
│   │   └── workflows/       # API routes for file operations
│   │       ├── route.ts           # GET: list workflows in directory
│   │       ├── [...path]/route.ts # GET/PUT: read/write single workflow
│   │       ├── create/route.ts    # POST: create new workflow
│   │       ├── import/route.ts    # POST: import workflow
│   │       ├── export/route.ts    # POST: export workflow (YAML/JSON/Mermaid)
│   │       └── layout/route.ts    # GET/PUT: node layout positions
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main app page
│   └── globals.css          # Global styles
├── components/
│   ├── flow/
│   │   ├── WorkflowCanvas.tsx  # React Flow wrapper
│   │   └── nodes/
│   │       ├── StepNode.tsx    # Step node component
│   │       └── MetadataNode.tsx # Workflow metadata node
│   ├── shell/
│   │   ├── WorkflowList.tsx    # Left sidebar file tree
│   │   ├── InspectorPanel.tsx # Right panel for editing
│   │   └── SourceEditor.tsx   # Raw YAML/JSON editor
│   └── ui/
│       └── button.tsx         # shadcn/ui Button component
├── lib/
│   ├── lobster/
│   │   ├── schema.ts    # Zod schemas for validation
│   │   ├── parser.ts    # YAML/JSON parsing and discovery
│   │   ├── store.ts     # Zustand state management
│   │   └── graph.ts     # Convert workflow to React Flow graph
│   └── utils.ts         # cn() utility for className merging
├── workflows/           # Sample workflow files
├── docs/                # Documentation
└── package.json
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐          │
│  │ Sidebar  │  │   Canvas     │  │ Inspector   │          │
│  │          │  │ (ReactFlow)  │  │   Panel     │          │
│  └──────────┘  └──────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│              State Management (Zustand)                    │
│  ┌─────────────────────────────────────────────────┐       │
│  │              useWorkflowStore                   │       │
│  └─────────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                               │
│  ┌──────────────┐  ┌────────────────────┐                 │
│  │ /api/workflow│  │ /api/workflows/[path]│                │
│  │    s         │  │                    │                 │
│  └──────────────┘  └────────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│              File System (Node.js)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐       │
│  │  Discovery  │  │   Parser     │  │ Serializer │       │
│  └─────────────┘  └──────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Load Workflows**: User clicks refresh → API scans directories → Parse YAML/JSON → Store in Zustand
2. **Select Workflow**: User clicks workflow → Load layout → Convert to React Flow graph → Render canvas
3. **Edit Step**: User clicks node → Inspector shows fields → Update triggers validation → Mark dirty
4. **Save**: User clicks Save → Serialize workflow → API writes file → Clear dirty flag

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.2.4 |
| UI Library | React | 19.2.4 |
| Flow Editor | @xyflow/react | 12.8.4 |
| State Management | Zustand | 5.0.3 |
| Validation | Zod | 3.24.2 |
| YAML Processing | yaml | 2.7.0 |
| Styling | Tailwind CSS | 4 |
| Icons | lucide-react | 0.474.0 |
| Language | TypeScript | 5 |

## Import/Export

### Export Formats

- **YAML** (default) - Standard Lobster format
- **JSON** - JSON representation
- **Mermaid** - Flowchart diagram for documentation
- **TypeScript** - TypeScript module export

### Import

Import workflows from YAML or JSON files. The importer validates against the Lobster schema and reports any errors.

## Validation

Lobster-ui validates workflows for:

- **Required fields**: Workflow must have a name and at least one step
- **Unique IDs**: Step IDs must be unique within the workflow
- **Valid references**: `stdin`, `condition`, and `when` must reference existing steps
- **Step type requirements**: Each step must have a valid execution type (run, pipeline, workflow, parallel, for_each, approval, or input)
- **Parallel branches**: Must have at least one branch with unique IDs
- **ForEach loops**: Must have inner steps defined
- **Input steps**: Must have prompt and responseSchema

## License

MIT