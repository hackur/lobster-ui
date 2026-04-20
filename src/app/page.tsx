"use client";

import { useEffect, useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { workflowsToGraph } from "@/lib/lobster/graph";
import { WorkflowCanvas } from "@/components/flow/WorkflowCanvas";
import { WorkflowList } from "@/components/shell/WorkflowList";
import { InspectorPanel } from "@/components/shell/InspectorPanel";
import { SourceEditor } from "@/components/shell/SourceEditor";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Plus, PanelRightClose, PanelRightOpen, Menu, Code, Layout, Download, Upload, Sun, Moon, AlertTriangle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

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
  } = useWorkflowStore();

  const { theme, setTheme } = useTheme();
  const [showInspector, setShowInspector] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedWorkflowId, saveWorkflow, selectNode, undo, redo]);

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
    const newDirs = prompt("Enter workflow directories (comma-separated):", settings.workflowDirs.join(", "));
    if (newDirs !== null) {
      const dirs = newDirs.split(",").map((d) => d.trim()).filter(Boolean);
      updateSettings({ workflowDirs: dirs });
      await loadWorkflows(dirs);
    }
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
          onClick={doLoadWorkflows}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        {envWarnings.length > 0 && (
          <div className="relative" title={`${envWarnings.length} env warnings`}>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full" />
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
        <aside className="w-64 border-r bg-background flex flex-col shrink-0">
          <div className="p-2 border-b">
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleNewWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              New Workflow
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <WorkflowList />
          </div>
        </aside>

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
    </div>
  );
}