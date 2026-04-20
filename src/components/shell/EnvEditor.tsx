"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/lib/lobster/store";
import { Button } from "@/components/ui/button";
import { getEnvVariables, type LobsterWorkflow } from "@/lib/lobster/schema";

interface EnvEditorProps {
  workflow: LobsterWorkflow;
  workflowPath: string;
}

export function EnvEditor({ workflow, workflowPath }: EnvEditorProps) {
  const { envFiles, envWarnings, updateEnvFile, loadEnvFiles, settings } = useWorkflowStore();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Get all env vars referenced in this workflow
  const referencedVars = getEnvVariables(workflow);

  // Group env files by directory
  const envByDir = envFiles.reduce((acc, ef) => {
    const dir = ef.path.split("/").slice(0, -1).join("/");
    if (!acc[dir]) acc[dir] = [];
    acc[dir].push(ef);
    return acc;
  }, {} as Record<string, typeof envFiles>);

  const toggleSecret = (path: string, key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [`${path}:${key}`]: !prev[`${path}:${key}`]
    }));
  };

  if (envFiles.length === 0) {
    return (
      <div className="p-3 rounded-md bg-muted/30 space-y-2">
        <h4 className="text-xs font-medium">Environment Variables</h4>
        <p className="text-xs text-muted-foreground">
          No .env files found in workflow directory.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => loadEnvFiles(settings.workflowDirs)}
        >
          Scan for env files
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-md border bg-muted/30 space-y-3">
      <h4 className="text-xs font-medium">Environment Variables</h4>
      
      {/* Warnings */}
      {envWarnings.length > 0 && (
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-600 font-medium mb-1">Missing env vars:</p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {envWarnings.slice(0, 5).map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
            {envWarnings.length > 5 && (
              <li>...and {envWarnings.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Referenced variables */}
      {referencedVars.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Referenced in workflow:</p>
          <div className="flex flex-wrap gap-1">
            {referencedVars.map(v => (
              <span key={v} className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-600">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Env files */}
      {Object.entries(envByDir).map(([dir, files]) => (
        <div key={dir}>
          <p className="text-xs text-muted-foreground mb-1">{dir}</p>
          {files.map(ef => (
            <div key={ef.path} className="ml-2 space-y-1">
              <p className="text-xs font-medium">{ef.name}</p>
              {Object.entries(ef.variables).map(([key, value]) => {
                const isSecret = ef.isSecret?.[key];
                const showValue = showSecrets[`${ef.path}:${key}`];
                
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-blue-600">{key}</span>
                    <span className="text-muted-foreground">=</span>
                    {isSecret ? (
                      <span className="font-mono">
                        {showValue ? value : "••••••••"}
                      </span>
                    ) : (
                      <span className="font-mono truncate max-w-[150px]">{value}</span>
                    )}
                    {isSecret && (
                      <button
                        onClick={() => toggleSecret(ef.path, key)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showValue ? "hide" : "show"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}