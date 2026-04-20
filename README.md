# lobster-ui

A visual editor for Lobster workflow files. Built with Next.js, React Flow, and shadcn/ui.

## What it is

`lobster-ui` is a local-first workflow file browser and editor for Lobster workflows. It reads `.lobster`, `.yaml`, `.yml`, and `.json` workflow files, visualizes them in a React Flow canvas, and lets you edit workflow metadata and step fields.

## What it is not

- A workflow executor or agent runner
- A replacement for Lobster/OpenClaw runtime
- A remote SaaS product

## Features

- Discover and list workflows from multiple local directories
- **Visual Canvas:** Visualize workflow steps as nodes in React Flow
- **Source Editor:** Switch to raw code view with direct YAML/JSON editing
- **Layout Persistence:** Node positions are automatically saved to `.lobster-ui.layout.[filename].json`
- **Undo/Redo:** Full history support for workflow modifications
- Edit step properties (id, command, stdin, condition, approval) via inspector
- Save changes back to disk (including raw source edits)
- Real-time validation for schema compliance and step references
- Dark mode support

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

## Supported File Formats

- `.lobster` - Lobster workflow files
- `.yaml` / `.yml` - YAML workflow definitions
- `.json` - JSON workflow definitions

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
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main app page
│   └── globals.css        # Global styles
├── components/
│   ├── flow/
│   │   ├── nodes/        # Custom React Flow nodes
│   │   └── WorkflowCanvas.tsx
│   ├── shell/            # App shell components
│   └── ui/              # Reusable UI components
└── lib/
    └── lobster/           # Lobster-specific utilities
        ├── schema.ts     # Zod schemas
        ├── parser.ts     # File parsing
        ├── store.ts     # Zustand state
        └── graph.ts     # Graph conversion
```

## License

MIT