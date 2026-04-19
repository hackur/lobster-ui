import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import YAML from "yaml";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dir, steps } = body;

    if (!name || !dir) {
      return NextResponse.json({ error: "Missing name or dir" }, { status: 400 });
    }

    const fileName = name.toLowerCase().replace(/[^a-z0-9]/g, "-") + ".yaml";
    const filePath = path.join(dir, fileName);

    const workflow = {
      name,
      steps: steps || [{ id: "step1", command: "echo 'Hello World'" }],
    };

    const content = YAML.stringify(workflow);
    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}