# Design Tokens

All spacing, sizing, typography, colors, and reusable layout styles should come from `constants/theme.ts`. Do not hardcode raw numbers in styles or components.
Palette definitions live in `constants/colors.ts`.

## Usage

```ts
import {
  SPACING,
  RADIUS,
  TYPE_SCALE,
  FONTS,
  FONT_WEIGHTS,
  TYPOGRAPHY,
  LAYOUT,
} from "@/constants/theme";
import { COLOR_THEMES } from "@/constants/colors";
```

| Token | Use for |
| ----- | ------- |
| `COLOR_THEMES` | Light and dark palettes |
| `SPACING` | Padding, margin, gap |
| `RADIUS` | Border radius |
| `TYPE_SCALE` | Font size |
| `FONTS` | Font family |
| `FONT_WEIGHTS` | Font weight |
| `TYPOGRAPHY` | Reusable text styles |
| `LAYOUT` | Reusable layout containers |

## Examples

```ts
// correct
style={{ padding: SPACING.md, borderRadius: RADIUS.lg, fontSize: TYPE_SCALE["2xl"] }}

// wrong
style={{ padding: 12, borderRadius: 14, fontSize: 16 }}
```
