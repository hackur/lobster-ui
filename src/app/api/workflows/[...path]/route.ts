import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";
import { LobsterWorkflowSchema } from "@/lib/lobster/schema";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedPath = searchParams.get("path");

  if (!encodedPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const filePath = decodeURIComponent(encodedPath);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();

    let workflow: unknown;
    if (ext === ".json") {
      workflow = JSON.parse(content);
    } else {
      workflow = YAML.parse(content);
    }

    const validated = LobsterWorkflowSchema.parse(workflow);

    return NextResponse.json({
      path: filePath,
      workflow: validated,
      format: ext === ".json" ? "json" : "yaml",
      rawContent: content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedPath = searchParams.get("path");

  if (!encodedPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const filePath = decodeURIComponent(encodedPath);

  try {
    const body = await request.json();
    const workflow = LobsterWorkflowSchema.parse(body.workflow);
    const format = body.format || "yaml";

    let content: string;
    if (body.rawContent) {
      content = body.rawContent;
    } else if (format === "json") {
      content = JSON.stringify(workflow, null, 2);
    } else {
      const doc = new YAML.Document({
        name: workflow.name,
        args: workflow.args,
        env: workflow.env,
        steps: workflow.steps,
      });
      content = doc.toString();
    }

    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}