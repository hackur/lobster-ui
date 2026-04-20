"use client";

import { useWorkflowStore } from "@/lib/lobster/store";
import { useEffect, useState } from "react";

export function SourceEditor() {
  const { workflows, selectedWorkflowId, updateWorkflowFromRaw } = useWorkflowStore();
  const workflowFile = workflows.find((w) => w.path === selectedWorkflowId);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (workflowFile) {
      setContent(workflowFile.rawContent);
    }
  }, [workflowFile?.path, workflowFile?.rawContent]);

  if (!workflowFile) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a workflow to view source</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateWorkflowFromRaw(workflowFile.path, newContent);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-50 font-mono">
      <textarea
        value={content}
        onChange={handleChange}
        spellCheck={false}
        className="flex-1 w-full h-full p-4 bg-transparent outline-none resize-none overflow-auto"
      />
    </div>
  );
}
