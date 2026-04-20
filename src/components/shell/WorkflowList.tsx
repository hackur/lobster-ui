"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { cn } from "@/lib/utils";
import { FileText, FolderOpen, Search } from "lucide-react";

export function WorkflowList() {
  const { workflows, selectedWorkflowId, selectWorkflow } = useWorkflowStore();
  const [search, setSearch] = useState("");

  const filteredWorkflows = workflows.filter(
    (wf) =>
      wf.workflow.name?.toLowerCase().includes(search.toLowerCase()) ||
      wf.path.toLowerCase().includes(search.toLowerCase())
  );

  const workflowGroups = filteredWorkflows.reduce(
    (acc, wf) => {
      const dir = wf.path.split("/").slice(0, -1).join("/");
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(wf);
      return acc;
    },
    {} as Record<string, typeof workflows>
  );

  if (workflows.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <FolderOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No workflows found</p>
        <p className="text-xs mt-1">Configure workflow directories in settings</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border bg-background"
        />
      </div>

      {filteredWorkflows.length === 0 ? (
        <div className="p-2 text-center text-xs text-muted-foreground">
          No matching workflows
        </div>
      ) : (
        Object.entries(workflowGroups).map(([dir, files]) => (
          <div key={dir}>
            <div className="text-xs font-medium text-muted-foreground px-2 py-1 uppercase tracking-wider">
              {dir.split("/").pop() || dir}
            </div>
            <div className="space-y-0.5">
              {files.map((wf) => (
                <button
                  key={wf.path}
                  onClick={() => selectWorkflow(wf.path)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
                    selectedWorkflowId === wf.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{wf.workflow.name || wf.path.split("/").pop()}</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}