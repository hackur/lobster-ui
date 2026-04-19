"use client";

import { useEffect, useState, useCallback } from "react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { workflowsToGraph } from "@/lib/lobster/graph";
import { WorkflowCanvas } from "@/components/flow/WorkflowCanvas";
import { WorkflowList } from "@/components/shell/WorkflowList";
import { InspectorPanel } from "@/components/shell/InspectorPanel";
import { Button } from "@/components/ui/button";
import { Settings, RefreshCw, Plus, PanelRightClose, PanelRightOpen, Menu } from "lucide-react";

export default function Home() {
  const {
    workflows,
    selectedWorkflowId,
    isDirty,
    layouts,
    loadWorkflows,
    selectWorkflow,
    selectNode,
    saveWorkflow,
    updateSettings,
    settings,
    createWorkflow,
  } = useWorkflowStore();

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
        <main className="flex-1 bg-muted/20">
          {workflow ? (
            <WorkflowCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              onNodeClick={handleNodeClick}
              onSave={handleSave}
              isDirty={isDirty}
            />
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