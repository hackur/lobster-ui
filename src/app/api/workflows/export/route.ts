import { NextRequest, NextResponse } from "next/server";
import YAML from "yaml";
import { type LobsterWorkflow } from "@/lib/lobster/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, format = "yaml" } = body as { workflow: LobsterWorkflow; format: string };

    if (!workflow) {
      return NextResponse.json({ error: "Missing workflow" }, { status: 400 });
    }

    let content: string;
    let contentType: string;
    let extension: string;

    switch (format) {
      case "json":
        content = JSON.stringify(workflow, null, 2);
        contentType = "application/json";
        extension = "json";
        break;
      case "mermaid":
        content = generateMermaid(workflow);
        contentType = "text/plain";
        extension = "md";
        break;
      case "ts":
        content = generateTypeScript(workflow);
        contentType = "text/plain";
        extension = "ts";
        break;
      case "yaml":
      default:
        const doc = new YAML.Document({
          name: workflow.name,
          description: workflow.description,
          args: workflow.args,
          env: workflow.env,
          cwd: workflow.cwd,
          cost_limit: workflow.cost_limit,
          steps: workflow.steps,
        });
        content = doc.toString();
        contentType = "application/x-yaml";
        extension = "yaml";
    }

    return NextResponse.json({
      content,
      contentType,
      extension,
      filename: `${workflow.name || "workflow"}.${extension}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function generateMermaid(workflow: LobsterWorkflow): string {
  const lines = ["```mermaid", "flowchart TD"];

  for (const step of workflow.steps) {
    const stepType = getStepTypeLabel(step);
    const label = `${step.id}\\n${stepType}`;
    lines.push(`  ${sanitizeId(step.id)}["${label}"]`);
  }

  // Add edges for sequence
  for (let i = 0; i < workflow.steps.length - 1; i++) {
    const from = sanitizeId(workflow.steps[i].id);
    const to = sanitizeId(workflow.steps[i + 1].id);
    lines.push(`  ${from} --> ${to}`);
  }

  // Add edges for stdin references
  for (const step of workflow.steps) {
    if (typeof step.stdin === "string") {
      const refs = step.stdin.match(/\$(\w+)\./g);
      if (refs) {
        for (const ref of refs) {
          const match = ref.match(/\$(\w+)/);
          if (match) {
            const from = sanitizeId(match[1]);
            const to = sanitizeId(step.id);
            lines.push(`  ${from} -.->|stdin| ${to}`);
          }
        }
      }
    }
  }

  lines.push("```");
  return lines.join("\n");
}

function generateTypeScript(workflow: LobsterWorkflow): string {
  const lines = [
    "export const workflow = {",
    `  name: ${workflow.name ? `"${workflow.name}"` : "undefined"},`,
    workflow.description ? `  description: "${workflow.description}",` : "",
    workflow.args ? `  args: ${JSON.stringify(workflow.args, null, 2)},` : "",
    workflow.env ? `  env: ${JSON.stringify(workflow.env, null, 2)},` : "",
    workflow.cwd ? `  cwd: "${workflow.cwd}",` : "",
    workflow.cost_limit ? `  cost_limit: ${JSON.stringify(workflow.cost_limit, null, 2)},` : "",
    `  steps: ${JSON.stringify(workflow.steps, null, 2)},`,
    "};",
  ];
  return lines.filter(Boolean).join("\n");
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

function getStepTypeLabel(step: LobsterWorkflow["steps"][0]): string {
  if (step.parallel) return "parallel";
  if (step.for_each) return "for_each";
  if (step.workflow) return "workflow";
  if (step.pipeline) return "pipeline";
  if (step.approval) return "approval";
  if (step.input) return "input";
  if (step.run || step.command) return "run";
  return "step";
}