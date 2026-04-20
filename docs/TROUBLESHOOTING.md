# Troubleshooting

## Common Issues

### Workflows not loading

**Symptoms**: Empty workflow list

**Solutions**:
1. Check workflow directories exist
2. Verify directory permissions
3. Configure directories in Settings

### Save fails

**Symptoms**: Save button doesn't work

**Solutions**:
1. Check file permissions
2. Verify workflow is valid

### Validation errors won't clear

**Symptoms**: Errors persist after fixing

**Solutions**:
1. Save the workflow to re-run validation
2. Reload the workflow

### Node positions not saving

**Symptoms**: Nodes reset on reload

**Solutions**:
1. Check .lobster-ui.layout.*.json file permissions

### Type errors

**Symptoms**: TypeScript errors in editor

**Solutions**:
1. Run `npm run typecheck`
2. Restart dev server

## Error Messages

| Error | Cause |
|-------|-------|
| "Missing dir parameter" | API called without directory |
| "Missing path parameter" | API called without file path |
| "File not found" | Workflow file doesn't exist |
| "Workflow should have a name" | Validation: name required |
| "Workflow must have at least one step" | Validation: steps required |

## Getting Help

- Check console for errors
- Review validation messages in Inspector Panel
- Verify workflow file syntax