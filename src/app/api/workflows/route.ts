import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import { LobsterWorkflowSchema } from "@/lib/lobster/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dir = searchParams.get("dir");

  if (!dir) {
    return NextResponse.json({ error: "Missing dir parameter" }, { status: 400 });
  }

  const workflows: Array<{
    path: string;
    name: string;
    steps: Array<{ id: string; command?: string; pipeline?: string }>;
  }> = [];

  function scan(directory: string) {
    try {
      const entries = fs.readdirSync(directory, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if ([".lobster", ".yaml", ".yml", ".json"].includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              let data: unknown;
              if (ext === ".json") {
                data = JSON.parse(content);
              } else {
                data = YAML.parse(content);
              }
              const workflow = LobsterWorkflowSchema.parse(data);
              workflows.push({
                path: fullPath,
                name: workflow.name ?? path.basename(fullPath, path.extname(fullPath)),
                steps: workflow.steps.map((s) => ({ id: s.id, command: s.run || s.command, pipeline: s.pipeline })),
              });
            } catch {
              // Skip invalid files
            }
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  scan(dir);
  return NextResponse.json({ workflows });
}