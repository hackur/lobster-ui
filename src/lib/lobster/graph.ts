import { type Node, type Edge } from "@xyflow/react";
import { type LobsterWorkflow, type LobsterStep, getStepType, getStepCommand } from "./schema";

const STEP_NODE_HEIGHT = 140;
const VERTICAL_SPACING = 160;
const HORIZONTAL_MARGIN = 100;

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

function getStepReferences(step: LobsterStep): string[] {
  const refs: string[] = [];

  if (typeof step.stdin === "string") {
    const stdinRefs = step.stdin.match(/\$(\w+)\./g);
    if (stdinRefs) {
      for (const ref of stdinRefs) {
        const match = ref.match(/\$(\w+)\./);
        if (match) {
          refs.push(match[1]);
        }
      }
    }
  }

  if (typeof step.condition === "string") {
    const condRefs = step.condition.match(/\$(\w+)/g);
    if (condRefs) {
      for (const ref of condRefs) {
        const match = ref.match(/\$(\w+)/);
        if (match) {
          refs.push(match[1]);
        }
      }
    }
  }

  if (typeof step.when === "string") {
    const whenRefs = step.when.match(/\$(\w+)/g);
    if (whenRefs) {
      for (const ref of whenRefs) {
        const match = ref.match(/\$(\w+)/);
        if (match) {
          refs.push(match[1]);
        }
      }
    }
  }

  return [...new Set(refs)];
}

export function workflowsToGraph(
  workflow: LobsterWorkflow,
  existingPositions?: Record<string, { x: number; y: number }>
): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepIdToPosition: Map<string, number> = new Map();

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    stepIdToPosition.set(step.id, i);
  }

  // Metadata node for workflow info
  nodes.push({
    id: "workflow-metadata",
    type: "metadata",
    position: { x: HORIZONTAL_MARGIN, y: HORIZONTAL_MARGIN },
    data: { 
      label: workflow.name,
      args: workflow.args,
      env: workflow.env,
    },
  });

  // Create nodes for each step
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const refs = getStepReferences(step);
    const stepType = getStepType(step);

    const position =
      existingPositions && existingPositions[step.id]
        ? existingPositions[step.id]
        : { x: HORIZONTAL_MARGIN, y: HORIZONTAL_MARGIN + STEP_NODE_HEIGHT + VERTICAL_SPACING + i * VERTICAL_SPACING };

    nodes.push({
      id: step.id,
      type: "stepNode",
      position,
      data: {
        label: step.id,
        command: getStepCommand(step),
        stepType,
        stdin: step.stdin,
        condition: step.condition,
        when: step.when,
        approval: step.approval,
        input: step.input,
        env: step.env,
        cwd: step.cwd,
        retry: step.retry,
        timeout_ms: step.timeout_ms,
        on_error: step.on_error,
        parallel: step.parallel,
        for_each: step.for_each,
        workflow: step.workflow,
        workflow_args: step.workflow_args,
        enabled: step.enabled,
        comment: step.comment,
      },
    });

    // Add explicit edges from stdin references (data flow)
    for (const refId of refs) {
      if (stepIdToPosition.has(refId)) {
        edges.push({
          id: `${refId}-${step.id}-data`,
          source: refId,
          target: step.id,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          label: "data",
          labelStyle: { fill: "#3b82f6", fontSize: 10 },
        });
      }
    }

    // Add edges for condition/when references
    if (step.condition || step.when) {
      for (const refId of refs) {
        if (stepIdToPosition.has(refId)) {
          edges.push({
            id: `${refId}-${step.id}-cond`,
            source: refId,
            target: step.id,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#ec4899", strokeWidth: 2 },
            label: step.condition ? "if" : "when",
            labelStyle: { fill: "#ec4899", fontSize: 10 },
          });
        }
      }
    }

    // Add sequence edges between adjacent steps (inferred)
    if (i > 0) {
      const prevStep = workflow.steps[i - 1];
      const prevRefs = getStepReferences(prevStep);
      const hasExplicitEdgeToThis = refs.includes(prevStep.id) || prevRefs.includes(step.id);
      
      if (!hasExplicitEdgeToThis) {
        edges.push({
          id: `seq-${prevStep.id}-${step.id}`,
          source: prevStep.id,
          target: step.id,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#e2e8f0", strokeDasharray: "4 4" },
          label: "→",
          labelStyle: { fill: "#94a3b8", fontSize: 12 },
        });
      }
    }
  }

  // Connect metadata node to first step if exists
  if (workflow.steps.length > 0) {
    edges.push({
      id: "metadata-to-first",
      source: "workflow-metadata",
      target: workflow.steps[0].id,
      type: "smoothstep",
      style: { stroke: "#e2e8f0" },
    });
  }

  return { nodes, edges };
}