# Design Style Guidelines

## Color Palette - Dark Theme

ALWAYS use matte black style for dark theme:

- **Main background**: `bg-[#000000]` or `bg-black` - pure black
- **Cards/Surfaces**: `bg-[#1a1a1a]` - very dark gray, almost black
- **Input fields**: `bg-[#1a1a1a]` or `bg-[#141414]` - matte black
- **Hover states**: `bg-[#252525]` or `bg-zinc-800` 
- **Borders**: `border-zinc-800` or `border-[#2a2a2a]` - subtle dark borders

## NEVER use:
- `bg-zinc-900` - too gray
- `bg-gray-*` for dark theme backgrounds
- Light gray backgrounds in dark mode

## Text Colors (Dark Theme):
- Primary text: `text-white`
- Secondary/muted: `text-zinc-400` or `text-zinc-500`
- Placeholder: `text-zinc-500`

## Button Styles (Dark Theme):
- Default: `bg-[#1a1a1a]` with `text-zinc-400`
- Hover: `bg-[#252525]` with `text-white`
- Active/Selected: `bg-zinc-700`

## The overall aesthetic should be:
- Clean matte black surfaces
- Minimal contrast between elements
- Premium dark appearance like iOS dark mode
