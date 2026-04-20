# Validation Rules

This document describes the validation rules enforced by lobster-ui.

## Validation Overview

Validation runs automatically when:
- A workflow is loaded
- A step is added or modified
- The user attempts to save

## Validation Error Messages

### Required Fields

| Error | Condition |
|-------|-----------|
| "Workflow should have a name" | `name` is missing or empty |
| "Workflow must have at least one step" | `steps` array is empty or missing |

### Step ID Validation

| Error | Condition |
|-------|-----------|
| "Duplicate step id: {id}" | Two steps share the same ID |

### Step Type Validation

| Error | Condition |
|-------|-----------|
| "Step {id} must have run, pipeline, workflow, parallel, for_each, approval, or input" | Step has no execution type |

### Reference Validation

| Error | Condition |
|-------|-----------|
| "Step {id} references unknown step: {stepId}" | stdin, condition, or when references non-existent step |
| "Step {id} condition references unknown step: {stepId}" | condition references non-existent step |
| "Step {id} when references unknown step: {stepId}" | when references non-existent step |

### Parallel Validation

| Error | Condition |
|-------|-----------|
| "Step {id} parallel requires at least one branch" | parallel.branches is empty |
| "Step {id} has duplicate parallel branch id: {branchId}" | parallel branches have duplicate IDs |

### ForEach Validation

| Error | Condition |
|-------|-----------|
| "Step {id} for_each requires inner steps" | for_each step has no inner steps |

### Input Validation

| Error | Condition |
|-------|-----------|
| "Step {id} input requires a prompt" | input step has no prompt |
| "Step {id} input requires responseSchema" | input step has no responseSchema |

### Workflow Args Validation

| Error | Condition |
|-------|-----------|
| "Step {id} workflow_args must be an object" | workflow_args is not an object |

---

## Implementation

The validation logic is in `src/lib/lobster/store.ts`:

```typescript
validateWorkflow: (workflow: LobsterWorkflow) => {
  const errors: string[] = [];
  
  // Required fields
  if (!workflow.name) errors.push("Workflow should have a name");
  if (!workflow.steps?.length) errors.push("Workflow must have at least one step");

  // Unique step IDs
  const stepIds = new Set<string>();
  for (const step of workflow.steps) {
    if (stepIds.has(step.id)) {
      errors.push(`Duplicate step id: ${step.id}`);
    }
    stepIds.add(step.id);
    
    // Step type validation
    if (!step.run && !step.pipeline && !step.workflow && !step.parallel && !step.for_each && !step.approval && !step.input) {
      errors.push(`Step ${step.id} must have run, pipeline, workflow, parallel, for_each, approval, or input`);
    }
  }
  
  // ... reference validation
}
```

---

## Display

Validation errors appear in the Inspector Panel when no node is selected:

```typescript
{validationErrors.length > 0 && (
  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
    <h4 className="text-sm font-medium text-destructive mb-2">
      Validation Errors
    </h4>
    <ul className="text-xs space-y-1">
      {validationErrors.map((err, i) => (
        <li key={i} className="text-destructive">{err}</li>
      ))}
    </ul>
  </div>
)}
```

---

## Schema Validation

Beyond business rules, Zod schemas validate the workflow structure:

- `LobsterWorkflowSchema`: Full workflow validation
- `LobsterStepSchema`: Individual step validation
- `LobsterParallelConfigSchema`: Parallel configuration
- `LobsterRetrySchema`: Retry configuration

Schema validation happens at parse time via the API routes.