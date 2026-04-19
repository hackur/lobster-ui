"use client";

import { useWorkflowStore } from "@/lib/lobster/store";
import { cn } from "@/lib/utils";
import { FileText, FolderOpen } from "lucide-react";

export function WorkflowList() {
  const { workflows, selectedWorkflowId, selectWorkflow } = useWorkflowStore();

  const workflowGroups = workflows.reduce(
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
      {Object.entries(workflowGroups).map(([dir, files]) => (
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
                <span className="truncate">{wf.workflow.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}