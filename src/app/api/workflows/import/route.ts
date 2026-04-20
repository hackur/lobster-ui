import { NextRequest, NextResponse } from "next/server";
import YAML from "yaml";
import { LobsterWorkflowSchema, type LobsterWorkflow } from "@/lib/lobster/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, format } = body as { content: string; format: string };

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    let workflow: unknown;
    
    const actualFormat = format || detectFormat(content);
    
    if (actualFormat === "json") {
      workflow = JSON.parse(content);
    } else if (actualFormat === "yaml") {
      workflow = YAML.parse(content);
    } else {
      return NextResponse.json({ error: "Unsupported format. Use 'json' or 'yaml'." }, { status: 400 });
    }

    const validated = LobsterWorkflowSchema.parse(workflow);

    return NextResponse.json({
      workflow: validated,
      format: actualFormat,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}

function detectFormat(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }
  return "yaml";
}