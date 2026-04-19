import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import {
  LobsterWorkflowSchema,
  type LobsterWorkflow,
  type WorkflowFile,
} from "./schema";

const LOBSTER_EXTENSIONS = [".lobster", ".yaml", ".yml", ".json"];

function isLobsterFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return LOBSTER_EXTENSIONS.includes(ext);
}

function parseContent(content: string, format: "json" | "yaml"): LobsterWorkflow {
  let data: unknown;

  if (format === "json") {
    data = JSON.parse(content);
  } else {
    data = YAML.parse(content);
  }

  return LobsterWorkflowSchema.parse(data);
}

export function parseWorkflowFile(filePath: string): WorkflowFile {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  
  let format: "json" | "yaml" | "ts" = "yaml";
  if (ext === ".json") format = "json";
  else if (ext === ".ts") format = "ts";

  // Skip TypeScript files for now - they need special parsing
  if (format === "ts") {
    return {
      path: filePath,
      workflow: { steps: [] },
      format,
      rawContent: content,
      lastModified: new Date(),
    };
  }

  let workflow: LobsterWorkflow;

  try {
    workflow = parseContent(content, format);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ${filePath}: ${error.message}`);
    }
    throw error;
  }

  const stats = fs.statSync(filePath);

  return {
    path: filePath,
    workflow,
    format,
    rawContent: content,
    lastModified: stats.mtime,
  };
}

export function discoverWorkflows(dir: string): WorkflowFile[] {
  const workflows: WorkflowFile[] = [];

  function scan(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && isLobsterFile(entry.name)) {
        try {
          const workflow = parseWorkflowFile(fullPath);
          workflows.push(workflow);
        } catch (error) {
          console.error(`Skipping ${fullPath}: ${error}`);
        }
      }
    }
  }

  if (fs.existsSync(dir)) {
    scan(dir);
  }

  return workflows;
}

export function serializeWorkflow(
  workflow: LobsterWorkflow,
  format: "json" | "yaml" | "ts"
): string {
  if (format === "json") {
    return JSON.stringify(workflow, null, 2);
  }

  if (format === "ts") {
    const lines = [
      "export const workflow = {",
      `  name: ${workflow.name ? `"${workflow.name}"` : "undefined"},`,
      `  description: ${workflow.description ? `"${workflow.description}"` : "undefined"},`,
      workflow.args ? `  args: ${JSON.stringify(workflow.args, null, 2)},` : "",
      workflow.env ? `  env: ${JSON.stringify(workflow.env, null, 2)},` : "",
      `  steps: ${JSON.stringify(workflow.steps, null, 2)},`,
      "};",
    ].filter(Boolean);
    return lines.join("\n");
  }

  const doc = new YAML.Document({
    name: workflow.name,
    args: workflow.args,
    env: workflow.env,
    steps: workflow.steps,
  });

  return doc.toString();
}