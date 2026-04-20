"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { workflowsToGraph } from "@/lib/lobster/graph";
import { type LobsterWorkflow } from "@/lib/lobster/schema";
import { WorkflowCanvas } from "@/components/flow/WorkflowCanvas";
import { WorkflowList } from "@/components/shell/WorkflowList";
import { InspectorPanel } from "@/components/shell/InspectorPanel";
import { SourceEditor } from "@/components/shell/SourceEditor";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Plus, PanelRightClose, PanelRightOpen, PanelLeftClose, PanelLeftOpen, Menu, Code, Layout, Download, Upload, Sun, Moon, AlertTriangle, Keyboard, CheckCircle, XCircle, FilePlus, Undo2, Redo2, Share2, History, Copy, Check, Copy as CopyWorkflow } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const WORKFLOW_TEMPLATES = [
  {
    id: "basic",
    name: "Basic Workflow",
    description: "Simple sequential steps",
    workflow: {
      name: "New Workflow",
      description: "A basic workflow",
      steps: [
        { id: "step1", run: "echo 'Hello'" },
        { id: "step2", run: "echo 'Done'" },
      ],
    },
  },
  {
    id: "llm-pipeline",
    name: "LLM Pipeline",
    description: "Multi-step LLM processing",
    workflow: {
      name: "LLM Pipeline",
      description: "Process data with LLM",
      steps: [
        { id: "extract", pipeline: "llm.invoke --prompt 'Extract key info' $" },
        { id: "transform", pipeline: "llm.invoke --prompt 'Transform data' $.output" },
        { id: "save", run: "cat > output.json" },
      ],
    },
  },
  {
    id: "approval-gate",
    name: "Approval Gate",
    description: "Requires human approval",
    workflow: {
      name: "Approval Workflow",
      description: "Waits for approval before proceeding",
      steps: [
        { id: "prepare", run: "echo 'Ready for review'" },
        { id: "approval", approval: "required" },
        { id: "execute", run: "echo 'Approved, proceeding'" },
      ],
    },
  },
  {
    id: "parallel-processing",
    name: "Parallel Processing",
    description: "Run tasks concurrently",
    workflow: {
      name: "Parallel Workflow",
      description: "Process multiple items in parallel",
      steps: [
        { id: "split", run: "echo 'items'" },
        { 
          id: "process", 
          parallel: { 
            branches: [
              { id: "branch1", run: "echo 'process 1'" },
              { id: "branch2", run: "echo 'process 2'" },
              { id: "branch3", run: "echo 'process 3'" },
            ] 
          } 
        },
        { id: "merge", run: "echo 'All done'" },
      ],
    },
  },
  {
    id: "batch-loop",
    name: "Batch Loop",
    description: "Process items in a loop",
    workflow: {
      name: "Batch Workflow",
      description: "Process each item",
      steps: [
        { id: "fetch", run: "curl -s https://api.example.com/items" },
        { id: "process", for_each: "$.json", steps: [{ id: "item", run: "echo ${item}" }] },
      ],
    },
  },
  {
    id: "error-handling",
    name: "With Error Handling",
    description: "Retry and error handling",
    workflow: {
      name: "Resilient Workflow",
      description: "Handles failures gracefully",
      steps: [
        { 
          id: "main", 
          run: "npm run task",
          retry: { max: 3, backoff: "exponential", delay_ms: 1000, jitter: true },
          on_error: "continue",
        },
        { id: "fallback", run: "echo 'Using fallback'" },
      ],
    },
  },
];

export default function Home() {
  const {
    workflows,
    selectedWorkflowId,
    dirtyWorkflows,
    layouts,
    loadWorkflows,
    selectWorkflow,
    selectNode,
    saveWorkflow,
    updateSettings,
    settings,
    createWorkflow,
    viewMode,
    setViewMode,
    undo,
    redo,
    envWarnings,
    validationErrors,
    updateWorkflow,
  } = useWorkflowStore();

  const { theme, setTheme } = useTheme();
  const [showInspector, setShowInspector] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const workflow = workflows.find((w) => w.path === selectedWorkflowId);
  const graph = workflow ? workflowsToGraph(workflow.workflow, layouts[workflow.path]?.nodes) : { nodes: [], edges: [] };

  const DEFAULT_DIR = "/Volumes/JS-DEV/lobster-ui/workflows";
  
  const doLoadWorkflows = useCallback(async () => {
    const dirs = settings.workflowDirs.length > 0 
      ? settings.workflowDirs 
      : [DEFAULT_DIR];
    await loadWorkflows(dirs);
    updateSettings({ workflowDirs: dirs });
  }, [settings.workflowDirs, loadWorkflows, updateSettings]);

  useEffect(() => {
    const init = async () => {
      await loadWorkflows([DEFAULT_DIR]);
      updateSettings({ workflowDirs: [DEFAULT_DIR] });
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Cmd/Ctrl + S = Save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (selectedWorkflowId) {
          saveWorkflow(selectedWorkflowId);
        }
      }
      // Cmd/Ctrl + N = New workflow
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        handleNewWorkflow();
      }
      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y = Redo
      if ((e.metaKey || e.ctrlKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        redo();
      }
      // Escape = Deselect node
      if (e.key === "Escape") {
        selectNode(null);
      }
      // D = Duplicate selected step
      if (e.key === "d" && !e.metaKey && !e.ctrlKey && selectedNodeId && workflow) {
        const step = workflow.workflow.steps.find(s => s.id === selectedNodeId);
        if (step) {
          const newId = `${step.id}_copy`;
          const newStep = { ...step, id: newId };
          delete (newStep as Record<string, unknown>).approval;
          delete (newStep as Record<string, unknown>).input;
          delete (newStep as Record<string, unknown>).parallel;
          delete (newStep as Record<string, unknown>).for_each;
          delete (newStep as Record<string, unknown>).workflow;
          const newSteps = [...workflow.workflow.steps, newStep as LobsterStep];
          updateWorkflow(workflow.path, { ...workflow.workflow, steps: newSteps });
        }
      }
      // Delete/Backspace = Delete selected step
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId && workflow) {
        e.preventDefault();
        const newSteps = workflow.workflow.steps.filter(s => s.id !== selectedNodeId);
        updateWorkflow(workflow.path, { ...workflow.workflow, steps: newSteps });
        selectNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWorkflowId, saveWorkflow, selectNode, undo, redo, selectedNodeId, workflow, updateWorkflow]);

  // Auto-save with debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!settings.autoSave || !selectedWorkflowId || !dirtyWorkflows[selectedWorkflowId]) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveWorkflow(selectedWorkflowId);
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [dirtyWorkflows, selectedWorkflowId, saveWorkflow, settings.autoSave]);

  const handleSave = async () => {
    if (!selectedWorkflowId) return;
    setIsLoading(true);
    try {
      await saveWorkflow(selectedWorkflowId);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (nodeId !== "workflow-metadata") {
      selectNode(nodeId);
    }
  };

  const handleConfigs = async () => {
    const dirsInput = prompt("Enter workflow directories (comma-separated):", settings.workflowDirs.join(", "));
    if (dirsInput !== null) {
      const dirs = dirsInput.split(",").map((d) => d.trim()).filter(Boolean);
      updateSettings({ workflowDirs: dirs });
      await loadWorkflows(dirs);
    }
    const autoSaveInput = confirm("Enable auto-save?");
    updateSettings({ autoSave: autoSaveInput });
  };

  const handleNewWorkflow = async () => {
    const name = prompt("Enter workflow name:");
    if (!name) return;
    
    const dir = settings.workflowDirs[0] || "/Volumes/JS-DEV/lobster-ui/workflows";
    const path = await createWorkflow(name, dir);
    if (path) {
      selectWorkflow(path);
    }
  };

  const handleDuplicateWorkflow = async () => {
    if (!workflow) return;
    const name = prompt("Enter name for duplicate:", (workflow.workflow.name || "workflow") + "-copy");
    if (!name) return;
    
    const dir = settings.workflowDirs[0] || "/Volumes/JS-DEV/lobster-ui/workflows";
    const path = await createWorkflow(name, dir);
    if (path) {
      updateWorkflow(path, JSON.parse(JSON.stringify(workflow.workflow)));
      selectWorkflow(path);
    }
  };

  const handleExport = async (format: string) => {
    if (!workflow) return;
    try {
      const response = await fetch("/api/workflows/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: workflow.workflow, format }),
      });
      const data = await response.json();
      
      const blob = new Blob([data.content], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".yaml,.yml,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const content = await file.text();
      const format = file.name.endsWith(".json") ? "json" : "yaml";
      
      try {
        const response = await fetch("/api/workflows/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, format }),
        });
        const data = await response.json();
        
        if (data.error) {
          alert(data.error);
          return;
        }
        
        const dir = settings.workflowDirs[0] || "/Volumes/JS-DEV/lobster-ui/workflows";
        const path = await createWorkflow(data.workflow.name || "imported", dir);
        
        if (path) {
          const { workflows, updateWorkflow } = useWorkflowStore.getState();
          const wf = workflows.find(w => w.path === path);
          if (wf) {
            updateWorkflow(path, data.workflow);
            selectWorkflow(path);
          }
        }
      } catch (error) {
        console.error("Import failed:", error);
      }
    };
    input.click();
  };

  const handleShare = async () => {
    if (!workflow) return;
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify(workflow.workflow)));
      const shareUrl = `${window.location.origin}?workflow=${encoded.slice(0, 100)}...`;
      await navigator.clipboard.writeText(window.location.href.split('?')[0] + '?w=' + encoded);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleImportUrl = async () => {
    const url = prompt("Enter workflow URL (YAML or JSON):");
    if (!url) return;
    
    try {
      const response = await fetch(url);
      const content = await response.text();
      const format = url.endsWith(".json") ? "json" : "yaml";
      
      const importRes = await fetch("/api/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format }),
      });
      const data = await importRes.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      const dir = settings.workflowDirs[0] || "/Volumes/JS-DEV/lobster-ui/workflows";
      const path = await createWorkflow(data.workflow.name || "imported", dir);
      
      if (path) {
        const { updateWorkflow } = useWorkflowStore.getState();
        updateWorkflow(path, data.workflow);
        selectWorkflow(path);
      }
    } catch (error) {
      console.error("Import from URL failed:", error);
      alert("Failed to import from URL");
    }
  };

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length > 0) {
      selectWorkflow(workflows[0].path);
    }
  }, [selectedWorkflowId, workflows, selectWorkflow]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-12 border-b bg-background flex items-center px-4 gap-4 shrink-0">
        <div className="font-semibold text-sm">lobster-ui</div>
        <div className="flex-1" />
        <div className="flex items-center rounded-md border bg-muted/50 p-1">
          <Button
            variant={viewMode === "canvas" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("canvas")}
          >
            <Layout className="h-3.5 w-3.5 mr-1.5" />
            Visual
          </Button>
          <Button
            variant={viewMode === "source" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode("source")}
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Source
          </Button>
        </div>
        <div className="relative group">
          <Button variant="ghost" size="icon" title="Export">
            <Download className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 top-full mt-1 w-32 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => handleExport("yaml")}
            >
              Export YAML
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => handleExport("json")}
            >
              Export JSON
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => handleExport("mermaid")}
            >
              Export Mermaid
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => handleExport("ts")}
            >
              Export TypeScript
            </button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleImport} title="Import">
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleConfigs} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
        >
          {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={doLoadWorkflows}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowTemplates(true)}
          title="Workflow Templates"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => undo()}
          disabled={!useWorkflowStore.getState().canUndo()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => redo()}
          disabled={!useWorkflowStore.getState().canRedo()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowShare(true)}
          disabled={!workflow}
          title="Share Workflow"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowHistory(true)}
          disabled={!workflow}
          title="Version History"
        >
          <History className="h-4 w-4" />
        </Button>
        {envWarnings.length > 0 && (
          <div className="relative" title={`${envWarnings.length} env warnings`}>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full" />
          </div>
        )}
        {selectedWorkflowId && (
          <div className="flex items-center gap-1" title={validationErrors.length > 0 ? `${validationErrors.length} validation errors` : "Workflow healthy"}>
            {validationErrors.length > 0 ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowInspector(!showInspector)}
          title={showInspector ? "Hide Inspector" : "Show Inspector"}
        >
          {showInspector ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
        <aside className="w-64 border-r bg-background flex flex-col shrink-0">
          <div className="p-2 border-b space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleNewWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
            {workflow && (
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleDuplicateWorkflow}>
                <CopyWorkflow className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            <WorkflowList />
          </div>
        </aside>
        )}

        {/* Canvas */}
        <main className="flex-1 bg-muted/20 relative">
          {workflow ? (
            viewMode === "canvas" ? (
              <ReactFlowProvider>
                <WorkflowCanvas
                  nodes={graph.nodes}
                  edges={graph.edges}
                  onNodeClick={handleNodeClick}
                  onSave={handleSave}
                  isDirty={selectedWorkflowId ? !!dirtyWorkflows[selectedWorkflowId] : false}
                />
              </ReactFlowProvider>
            ) : (
              <SourceEditor />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Menu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a workflow to view</p>
                <p className="text-sm mt-1">Or configure directories in settings</p>
              </div>
            </div>
          )}
        </main>

        {/* Inspector */}
        {showInspector && (
          <aside className="w-80 border-l bg-background shrink-0 overflow-auto">
            <InspectorPanel />
          </aside>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>×</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Save workflow</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘ S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New workflow</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘ N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Undo</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘ Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redo</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">⌘ ⇧ Z</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deselect</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duplicate step</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">D</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delete step</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Del</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setShowTemplates(false)}>
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Workflow Templates</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>×</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "basic", name: "Basic", desc: "Simple sequential steps", icon: "📋" },
                { id: "llm-pipeline", name: "LLM Pipeline", desc: "Multi-step LLM", icon: "🤖" },
                { id: "approval-gate", name: "Approval Gate", desc: "Requires approval", icon: "✅" },
                { id: "parallel", name: "Parallel", desc: "Concurrent tasks", icon: "⚡" },
                { id: "loop", name: "Batch Loop", desc: "Process items", icon: "🔄" },
                { id: "error-handling", name: "Error Handling", desc: "With retries", icon: "🛡️" },
              ].map((t) => (
                <button
                  key={t.id}
                  className="p-4 border rounded-lg text-left hover:bg-muted transition-colors"
                  onClick={() => {
                    const template = WORKFLOW_TEMPLATES.find(w => w.id === t.id);
                    if (template) {
                      const dir = settings.workflowDirs[0] || DEFAULT_DIR;
                      createWorkflow(template.workflow.name || "New Workflow", dir).then(path => {
                        if (path) {
                          const { updateWorkflow } = useWorkflowStore.getState();
                          updateWorkflow(path, template.workflow as LobsterWorkflow);
                          selectWorkflow(path);
                        }
                      });
                    }
                    setShowTemplates(false);
                  }}
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShare && workflow && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setShowShare(false)}>
          <div className="bg-background border rounded-lg shadow-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Workflow</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShare(false)}>×</Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Copy this link to share your workflow:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href.split('?')[0] + '?w=' + btoa(JSON.stringify(workflow.workflow)).slice(0, 50) + '...'}
                  className="flex-1 px-3 py-2 text-sm rounded-md border bg-muted"
                />
                <Button variant="outline" size="sm" onClick={handleShare}>
                  {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={handleImportUrl}>
                Import from URL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistory && workflow && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="bg-background border rounded-lg shadow-lg p-6 w-[500px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Version History</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>×</Button>
            </div>
            <div className="space-y-2">
              {(() => {
                const versions = useWorkflowStore.getState().getVersions(workflow.path);
                if (versions.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-4">No version history yet</p>;
                }
                return versions.map((v, i) => (
                  <div key={i} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{v.workflow.name || 'Untitled'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(v.timestamp).toLocaleString()} - {v.workflow.steps.length} steps
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      useWorkflowStore.getState().restoreVersion(workflow.path, v);
                      setShowHistory(false);
                    }}>
                      Restore
                    </Button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}