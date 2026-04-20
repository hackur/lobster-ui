# Styling & Theme

## Tailwind CSS v4

lobster-ui uses Tailwind CSS v4 with the following approach:

## Dark Mode

Automatic dark mode via:
```css
@media (prefers-color-scheme: dark) {
  /* Dark theme styles */
}
```

## Design Tokens

Uses shadcn/ui design tokens:
- `--color-primary`
- `--color-secondary`
- `--color-muted`
- `--color-destructive`
- And more in globals.css

## Custom Node Styling

Each step type has unique styling:
- Border color based on type
- Badges for type indicators
- Monospace fonts for commands