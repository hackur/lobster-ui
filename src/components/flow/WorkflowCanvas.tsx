"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  Panel,
  NodeTypes,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StepNode } from "./nodes/StepNode";
import { MetadataNode } from "./nodes/MetadataNode";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Maximize2 } from "lucide-react";

const nodeTypes: NodeTypes = {
  stepNode: StepNode as unknown as NodeTypes[string],
  metadata: MetadataNode as unknown as NodeTypes[string],
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  onSave?: () => void;
  isDirty?: boolean;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodeClick,
  onSave,
  isDirty,
}: WorkflowCanvasProps) {
  const { fitView, getNodes } = useReactFlow();
  const [layoutLoading, setLayoutLoading] = useState(false);

  const onNodeClickHandler = useCallback((_: unknown, node: { id: string }) => {
    onNodeClick?.(node.id);
  }, [onNodeClick]);

  const defaultEdgeOptions = {
    type: "smoothstep",
    animated: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
  };

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleAutoLayout = useCallback(() => {
    setLayoutLoading(true);
    const currentNodes = getNodes();
    const nodeHeight = 120;
    const nodeWidth = 300;
    const gapY = 80;
    const gapX = 50;
    
    const layoutNodes = currentNodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 2) * (nodeWidth + gapX),
        y: Math.floor(index / 2) * (nodeHeight + gapY),
      },
    }));
    
    setTimeout(() => {
      fitView({ nodes: layoutNodes, padding: 0.2 });
      setLayoutLoading(false);
    }, 100);
  }, [getNodes, fitView]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "metadata") return "#8b5cf6";
            if (node.data?.approval) return "#f59e0b";
            if (node.data?.input) return "#06b6d4";
            if (node.data?.parallel) return "#6366f1";
            if (node.data?.for_each) return "#14b8a6";
            if (node.data?.workflow) return "#3b82f6";
            if (node.data?.condition || node.data?.when) return "#ec4899";
            return "#3b82f6";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-right" className="flex gap-2">
          <Button onClick={handleAutoLayout} variant="outline" size="sm" disabled={layoutLoading}>
            <LayoutGrid className="h-4 w-4 mr-1" />
            {layoutLoading ? "Layout..." : "Auto Layout"}
          </Button>
          <Button onClick={handleFitView} variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-1" />
            Fit View
          </Button>
          {onSave && (
            <Button onClick={onSave} variant={isDirty ? "default" : "outline"} size="sm">
              {isDirty ? "Save*" : "Save"}
            </Button>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}