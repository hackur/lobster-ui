# Step Types Reference

Lobster workflows support 7 distinct step types, each serving a specific purpose in workflow automation. This document details each step type, its properties, and how it's visualized in lobster-ui.

## Overview

| Step Type | Node Border Color | Badge | Description |
|-----------|------------------|-------|-------------|
| `run` | Blue (#3b82f6) | None | Shell command execution |
| `pipeline` | Violet (#8b5cf6) | LLM | LLM pipeline invocation |
| `approval` | Amber (#f59e0b) | approval | Human approval gate |
| `input` | Cyan (#06b6d4) | input | User input request |
| `parallel` | Indigo (#6366f1) | parallel | Parallel branch execution |
| `for_each` | Teal (#14b8a6) | for_each | Loop over items |
| `workflow` | Blue (#3b82f6) | workflow | Sub-workflow call |

---

## 1. Run Step

Executes a shell command or script.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `run` | string | Yes | Shell command to execute |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `env` | object | Environment variables |
| `cwd` | string | Working directory |
| `stdin` | string | Input from another step |
| `condition` | string | Conditional execution |
| `when` | string | Conditional execution (alternative) |
| `timeout_ms` | number | Timeout in milliseconds |
| `retry` | object | Retry configuration |
| `on_error` | string | Error handling: "stop", "continue", "skip_rest" |

### Example

```yaml
steps:
  - id: fetch_data
    run: curl -s https://api.example.com/data
    timeout_ms: 30000
    retry:
      max: 3
      backoff: exponential
      delay_ms: 1000
```

### Visualization

- **Border**: Default blue
- **Content**: Shows command truncated
- **Badges**: retry, timeout (if configured)

---

## 2. Pipeline Step

Invokes an LLM pipeline for AI-powered processing.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `pipeline` | string | Yes | LLM pipeline command |

### Optional Properties

Same as Run step plus:

| Property | Type | Description |
|----------|------|-------------|
| `stdin` | string | Input context for LLM |

### Example

```yaml
steps:
  - id: analyze
    pipeline: >
      llm.invoke --prompt "Analyze this data and provide insights"
    stdin: $fetch_data.json
```

### Visualization

- **Border**: Violet
- **Badge**: "LLM" indicator
- **Content**: Pipeline command truncated

---

## 3. Approval Step

Requires human approval before continuing.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `approval` | string \| boolean \| object | Yes | Approval configuration |

### Approval Values

```yaml
# Simple - always requires approval
approval: required

# Boolean
approval: true

# With options
approval:
  prompt: "Approve this action?"
  required_approver: admin
  require_different_approver: true
```

### Approval Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `prompt` | string | Prompt shown to approver |
| `items` | unknown | Items to approve |
| `preview` | string | Preview content |
| `initiated_by` | string | Who initiated |
| `required_approver` | string | Specific approver required |
| `require_different_approver` | boolean | Must be different from initiator |

### Example

```yaml
steps:
  - id: confirm
    approval:
      prompt: "Deploy to production?"
      required_approver: team-lead
      require_different_approver: true
```

### Visualization

- **Border**: Amber/Orange
- **Badge**: "approval"
- **Content**: Shows approval prompt or "required"

---

## 4. Input Step

Requests user input during workflow execution.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `input` | object | Yes | Input configuration |

### Input Object Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `prompt` | string | Yes | Question to ask user |
| `responseSchema` | object | Yes | Expected response format |
| `defaults` | object | Default values |

### Example

```yaml
steps:
  - id: get_name
    input:
      prompt: "Enter your name:"
      responseSchema:
        type: string
      defaults:
        name: "Anonymous"
```

### Visualization

- **Border**: Cyan
- **Badge**: "input"
- **Content**: Shows prompt text

---

## 5. Parallel Step

Executes multiple branches simultaneously.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `parallel` | object | Yes | Parallel configuration |

### Parallel Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `wait` | string | "all" (default) or "any" |
| `timeout_ms` | number | Overall timeout |
| `branches` | array | Array of branch definitions |

### Branch Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Branch identifier |
| `run` | string | No | Command to run |
| `command` | string | No | Alternative command |
| `pipeline` | string | No | Pipeline to run |
| `env` | object | Environment variables |
| `cwd` | string | Working directory |

### Example

```yaml
steps:
  - id: parallel_tasks
    parallel:
      wait: all
      timeout_ms: 30000
      branches:
        - id: task_a
          run: echo "Task A"
        - id: task_b
          run: echo "Task B"
        - id: task_c
          run: echo "Task C"
```

### Visualization

- **Border**: Indigo
- **Badge**: "parallel"
- **Content**: Shows "parallel: N branches"
- **Branches**: Displayed in inspector panel

---

## 6. For Each Step

Loops over an array of items.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `for_each` | string | Yes | Expression returning array |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `item_var` | string | Variable name for item (default: "item") |
| `index_var` | string | Variable name for index (default: "index") |
| `batch_size` | number | Items per batch |
| `pause_ms` | number | Pause between batches |
| `steps` | array | Inner steps to execute |

### Example

```yaml
steps:
  - id: process_items
    for_each: $items.json
    item_var: item
    index_var: idx
    batch_size: 5
    pause_ms: 1000
    steps:
      - id: process
        run: echo $item
```

### Visualization

- **Border**: Teal
- **Badge**: "for_each"
- **Content**: Shows array expression (e.g., "$items.json")

---

## 7. Workflow Step

Calls a sub-workflow.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `workflow` | string | Yes | Path to sub-workflow file |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `workflow_args` | object | Arguments to pass to sub-workflow |
| `env` | object | Environment variables |
| `cwd` | string | Working directory |
| `stdin` | string | Input to sub-workflow |

### Example

```yaml
steps:
  - id: call_subworkflow
    workflow: ./sub-workflow.yaml
    workflow_args:
      input: "value"
      count: 5
```

### Visualization

- **Border**: Blue
- **Badge**: "workflow"
- **Content**: Shows workflow path

---

## Step Type Detection

The step type is determined in this order:

1. **parallel** → If `parallel` object exists
2. **for_each** → If `for_each` string exists
3. **workflow** → If `workflow` string exists
4. **pipeline** → If `pipeline` string exists
5. **approval** → If `approval` value exists
6. **input** → If `input` object exists
7. **run** → Default (checks `run` or `command`)

---

## Inspector Panel Templates

The Inspector Panel provides templates for quick step creation:

| Template | Step Type | Description |
|----------|-----------|-------------|
| Run | run | Shell command |
| Pipeline | pipeline | LLM pipeline |
| Approval | approval | Require approval |
| Input | input | User input request |
| Parallel | parallel | Parallel branches |
| For Each | for_each | Loop over items |
| Workflow | workflow | Call sub-workflow |

---

## Common Step Properties

All step types support these common properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `env` | object | Environment variables |
| `cwd` | string | Working directory |
| `stdin` | string | Input from step reference |
| `condition` | string | Conditional execution |
| `when` | string | Conditional execution |
| `timeout_ms` | number | Step timeout |
| `retry` | object | Retry configuration |
| `on_error` | string | Error handling |

---

## Retry Configuration

The `retry` object configures automatic retry on failure:

```yaml
retry:
  max: 3              # Maximum retry attempts
  backoff: exponential # "fixed" or "exponential"
  delay_ms: 1000      # Initial delay
  max_delay_ms: 10000 # Maximum delay
  jitter: true        # Add randomness
```

---

## Error Handling

The `on_error` property controls what happens when a step fails:

| Value | Behavior |
|-------|----------|
| `stop` (default) | Halt workflow execution |
| `continue` | Proceed to next step |
| `skip_rest` | Skip remaining steps |