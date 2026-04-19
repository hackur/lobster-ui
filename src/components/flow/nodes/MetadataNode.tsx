"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export function MetadataNode({ data, selected }: NodeProps) {
  const label = typeof data?.label === "string" ? data.label : "Untitled";

  return (
    <div
      className={cn(
        "w-[200px] rounded-lg border-2 border-violet-500/50 bg-violet-50 text-violet-900 shadow-sm dark:bg-violet-950 dark:text-violet-100",
        selected && "ring-2 ring-ring"
      )}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-violet-500 !w-3 !h-3"
      />

      <div className="p-3">
        <div className="text-xs font-medium uppercase tracking-wider mb-1 text-violet-600 dark:text-violet-400">
          Workflow
        </div>
        <div className="font-semibold truncate">{label}</div>
      </div>
    </div>
  );
}