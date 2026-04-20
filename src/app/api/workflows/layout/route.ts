import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedPath = searchParams.get("path");

  if (!encodedPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const filePath = decodeURIComponent(encodedPath);
  const layoutPath = getLayoutPath(filePath);

  if (!fs.existsSync(layoutPath)) {
    return NextResponse.json({ nodes: {} });
  }

  try {
    const content = fs.readFileSync(layoutPath, "utf-8");
    const layout = JSON.parse(content);
    return NextResponse.json(layout);
  } catch (error) {
    return NextResponse.json({ nodes: {} });
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const encodedPath = searchParams.get("path");

  if (!encodedPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const filePath = decodeURIComponent(encodedPath);
  const layoutPath = getLayoutPath(filePath);

  try {
    const layout = await request.json();
    fs.writeFileSync(layoutPath, JSON.stringify(layout, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function getLayoutPath(workflowPath: string): string {
  const dir = path.dirname(workflowPath);
  const basename = path.basename(workflowPath);
  return path.join(dir, `.lobster-ui.layout.${basename}.json`);
}
