# Design Tokens

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
import { useColors } from "@/hooks/useColors";
```

| Token          | Use for                    |
| -------------- | -------------------------- |
| `useColors`    | Color pallete              |
| `SPACING`      | Padding, margin, gap       |
| `RADIUS`       | Border radius              |
| `TYPE_SCALE`   | Font size                  |
| `FONTS`        | Font family                |
| `FONT_WEIGHTS` | Font weight                |
| `TYPOGRAPHY`   | Reusable text styles       |
| `LAYOUT`       | Reusable layout containers |

## Examples

```ts
// preferred
style={{ padding: SPACING.md, borderRadius: RADIUS.lg, fontSize: TYPE_SCALE["2xl"] }}

// wrong
style={{ padding: 12, borderRadius: 14, fontSize: 16 }}
```
