# Contributing to lobster-ui

Thank you for your interest in contributing! This project is a local-first workflow editor for Lobster.

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Tech Stack

- **Framework**: Next.js (App Router)
- **State**: Zustand
- **Graph**: React Flow (xyflow)
- **Styles**: Tailwind CSS + shadcn/ui
- **Validation**: Zod + YAML

## Coding Standards

- **Type Safety**: All new code should be fully typed with TypeScript.
- **Components**: Use shadcn/ui primitives for common UI elements.
- **Node Design**: Complex workflow logic should be encapsulated in custom React Flow nodes.
- **File System**: Avoid direct FS access in client components; use the API routes in `app/api/`.

## Key Workflow Concepts

1.  **Parsing**: Files are parsed from YAML/JSON into a structured `LobsterWorkflow` in `parser.ts`.
2.  **State**: The `useWorkflowStore` manages the currently selected workflow, its dirty state, and the undo/redo history.
3.  **Visualization**: The `workflowsToGraph` utility in `graph.ts` converts the structured step list into React Flow nodes and edges.
4.  **Layout**: Node positions are stored in `.lobster-ui.layout.[filename].json` files co-located with the workflow files.

## Pull Request Process

1.  Create a branch for your feature or bugfix.
2.  Ensure `npm run typecheck` and `npm run lint` pass.
3.  Add tests if applicable (WIP).
4.  Update `README.md` if you add new features.

## License

MIT