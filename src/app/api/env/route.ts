import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const ENV_EXTENSIONS = [".env", ".env.local", ".env.production", ".env.development"];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dir = searchParams.get("dir");

  if (!dir) {
    return NextResponse.json({ error: "Missing dir parameter" }, { status: 400 });
  }

  const envFiles: Array<{ path: string; name: string; variables: Record<string, string> }> = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name);
        const baseName = path.basename(entry.name);
        
        // Match .env, .env.local, .env.* files
        if (baseName.startsWith(".env") || ENV_EXTENSIONS.includes(ext)) {
          const fullPath = path.join(dir, entry.name);
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const variables = parseEnvFile(content);
            
            envFiles.push({
              path: fullPath,
              name: entry.name,
              variables,
            });
          } catch (err) {
            console.error(`Failed to read env file ${fullPath}:`, err);
          }
        }
      }
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to read directory" }, { status: 500 });
  }

  return NextResponse.json({ envFiles });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, variables } = body;

    if (!filePath) {
      return NextResponse.json({ error: "Missing filePath" }, { status: 400 });
    }

    const content = serializeEnvFile(variables);
    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
  }
  
  return result;
}

function serializeEnvFile(variables: Record<string, string>): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(variables)) {
    // Quote values that contain spaces or special characters
    let serializedValue = value;
    if (value.includes(" ") || value.includes("#") || value.includes("\n")) {
      serializedValue = `"${value.replace(/"/g, '\\"')}"`;
    }
    lines.push(`${key}=${serializedValue}`);
  }
  
  return lines.join("\n") + "\n";
}