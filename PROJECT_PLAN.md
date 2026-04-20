# Lobster-UI: Progress Report & 30-Point Task List

This document evaluates the current state of the `lobster-ui` project against the original specification and outlines the next 30 steps to reach a complete, production-grade local workflow editor.

## Current Status Overview

| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Tech Stack** | ✅ Finished | Next.js 15+, Tailwind CSS, shadcn/ui, React Flow (xyflow). |
| **Data Model** | ✅ Finished | Robust Zod schema in `src/lib/lobster/schema.ts` covers all Lobster features. |
| **File Handling** | ✅ Finished | Recursive discovery and YAML/JSON/TS parsing implemented in `parser.ts`. |
| **State Management** | ✅ Finished | Zustand store handles workflow lifecycle, selection, and dirty state. |
| **Workflow Editor** | 🏗️ Partial | Comprehensive inspector exists, but visual graph interactions are limited. |
| **Execution Bridge** | ❌ Missing | No bridge to run workflows or handle the Lobster/OpenClaw approval loop. |
| **UX/UI Polish** | 🏗️ Partial | Layout is solid, but lacks node-specific designs, raw view, and file watching. |

---

## 30-Point Task List

### Phase 1: Visual & Graph Enhancements (Nodes & Edges)
1. **[ ] Implement Custom Node Types:** Create specific React Flow components for `run`, `pipeline`, `parallel`, `for_each`, and `input` nodes to distinguish them visually.
2. **[ ] Add Node-Level Validation Badges:** Display Zod validation error icons directly on nodes that fail schema checks.
3. **[ ] Visual Dependency Edges:** Enhance `graph.ts` to draw distinct edge styles for `stdin` references (data flow) vs. `condition`/`when` (execution flow).
4. **[ ] Drag-to-Connect Edges:** Implement a custom edge handler that allows dragging a connection between nodes to automatically update the `stdin` or `condition` fields.
5. **[ ] Layout Persistence (On-Disk):** Implement a background service/API to save node positions into a hidden `.lobster-ui.layout.json` file in each workflow directory (following the "don't pollute source" rule).
6. **[ ] Subflow Visuals:** For nodes with `workflow: "path/to/sub.yaml"`, add a "Dive In" button to open the sub-workflow in the canvas.
7. **[ ] Minimap & Controls:** Add the React Flow Minimap, Controls, and Background components for better navigation of large graphs.
8. **[ ] Auto-Layout Toggle:** Integrate a library like `elkjs` or `dagre` to provide a "Tidy Graph" button.

### Phase 2: Editor Experience & Features
9. **[ ] Raw Source View:** Add a tabbed interface (Canvas / Source) using a code editor component (like `react-simple-code-editor` or `monaco-editor`) for direct YAML/JSON editing.
10. **[ ] Synchronization (Canvas <-> Source):** Ensure edits in the Source view are validated and reflected in the Canvas view immediately.
11. **[ ] Step Reordering (Drag & Drop):** Allow reordering steps in the sidebar list or canvas, which updates the sequential order in the generated Lobster file.
12. **[ ] Environment Variable Editor:** Create a dedicated UI for the workflow-level `env` block.
13. **[ ] Arguments Configuration:** Create a UI to define and edit the top-level `args` for a workflow.
14. **[ ] Step Library / Palette:** Create a draggable sidebar palette with "templates" for common steps (e.g., "LLM Call", "Shell Script", "Approval Gate").
15. **[ ] Bulk ID Renaming:** Implement a "Refactor ID" feature that renames a step and automatically updates all `stdin` and `condition` references to it across the workflow.

### Phase 3: File System & System Integration
16. **[ ] File System Watcher:** Implement a server-side `chokidar` watcher to detect external changes to `.lobster` files and prompt the user to "Reload from Disk."
17. **[ ] Context Menu Actions:** Add a right-click menu on nodes for "Duplicate Step," "Delete," and "Copy Step ID."
18. **[ ] Recent Workflows List:** Add a "Recents" section to the sidebar.
19. **[ ] Workspace Root Discovery:** Improve the "Settings" flow to auto-detect `workflows/` folders in common project locations.
20. **[ ] Conflict Detection:** Implement a "Force Save / Merge" UI when the file on disk is newer than the version in memory.
21. **[ ] Keyboard Shortcuts:** Add standard shortcuts: `Cmd+S` (Save), `Delete` (Remove Node), `Cmd+Z/Y` (Undo/Redo - needs integration with the store).

### Phase 4: Execution & Bridge (The "Runner")
22. **[ ] Local Runner API:** Create a Next.js API route that invokes the `lobster` CLI to "Dry Run" or "Validate" a workflow and return the JSON envelope.
23. **[ ] Run Terminal / Console:** Integration of a floating console at the bottom to show real-time output from `lobster run`.
24. **[ ] Live Execution Status:** When running, update node badges in real-time (Running, Success, Error, Paused).
25. **[ ] Approval Drawer:** Implement the "Action Required" UI that appears when a Lobster run returns `status: "needs_approval"`.
26. **[ ] Resume Interaction:** Use the `resumeToken` from the Lobster envelope to send the "Approve/Reject" signal back to the running process.
27. **[ ] Input Request Handling:** UI to handle `step.input` requests, prompting the user for data during execution.

### Phase 5: Polish & Documentation
28. **[ ] Dark Mode Support:** Ensure all shadcn/ui components and React Flow themes handle dark mode gracefully.
29. **[ ] Onboarding Wizard:** A "New Project" wizard that helps users initialize a folder with the `lobster` binary and example workflows.
30. **[ ] OSS Packaging:** Finalize the `LICENSE` (MIT), `CONTRIBUTING.md`, and `README.md` with screenshots and clear installation steps for the "Stand-alone Editor" mode.
