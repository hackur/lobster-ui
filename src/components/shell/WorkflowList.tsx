"use client";

import { useState, useMemo } from "react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { cn } from "@/lib/utils";
import { FileText, FolderOpen, Search, Star, Clock, FolderSearch } from "lucide-react";

export function WorkflowList() {
  const { workflows, selectedWorkflowId, selectWorkflow, dirtyWorkflows, settings, toggleFavorite, addRecent } = useWorkflowStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recent" | "search">("all");

  const favoriteWorkflows = workflows.filter(w => settings.favorites?.includes(w.path));
  const recentWorkflows = workflows.filter(w => settings.recent?.includes(w.path));

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const query = search.toLowerCase();
    return workflows.filter(wf => 
      wf.workflow.name?.toLowerCase().includes(query) ||
      wf.path.toLowerCase().includes(query) ||
      wf.workflow.steps.some(s => 
        s.id.toLowerCase().includes(query) ||
        s.run?.toLowerCase().includes(query) ||
        s.pipeline?.toLowerCase().includes(query) ||
        s.command?.toLowerCase().includes(query)
      )
    );
  }, [workflows, search]);

  const getFilteredWorkflows = () => {
    if (activeTab === "favorites") return favoriteWorkflows;
    if (activeTab === "recent") return recentWorkflows;
    if (activeTab === "search") return searchResults;
    return workflows;
  };

  const filteredWorkflows = getFilteredWorkflows().filter(
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
      {/* Tabs */}
      <div className="flex gap-1 border-b pb-2 flex-wrap">
        <button
          onClick={() => { setActiveTab("all"); setSearch(""); }}
          className={cn("text-xs px-2 py-1 rounded", activeTab === "all" ? "bg-muted font-medium" : "text-muted-foreground")}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={cn("text-xs px-2 py-1 rounded flex items-center gap-1", activeTab === "favorites" ? "bg-muted font-medium" : "text-muted-foreground")}
        >
          <Star className="h-3 w-3" /> {favoriteWorkflows.length}
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={cn("text-xs px-2 py-1 rounded flex items-center gap-1", activeTab === "recent" ? "bg-muted font-medium" : "text-muted-foreground")}
        >
          <Clock className="h-3 w-3" /> {recentWorkflows.length}
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={cn("text-xs px-2 py-1 rounded flex items-center gap-1", activeTab === "search" ? "bg-muted font-medium" : "text-muted-foreground")}
        >
          <FolderSearch className="h-3 w-3" /> Search
        </button>
      </div>

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
                <div
                  key={wf.path}
                  onClick={() => {
                    selectWorkflow(wf.path);
                    addRecent(wf.path);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer",
                    selectedWorkflowId === wf.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{wf.workflow.name || wf.path.split("/").pop()}</span>
                  {dirtyWorkflows[wf.path] && (
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(wf.path);
                    }}
                    className="shrink-0 p-0.5 hover:bg-muted-foreground/20 rounded"
                  >
                    {settings.favorites?.includes(wf.path) ? (
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <Star className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}