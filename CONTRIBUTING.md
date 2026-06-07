# Design Tokens

All spacing, sizing, typography, and border radius values must come from `constants/tokens.ts`. Do not hardcode raw numbers in styles or components.

## Usage

```ts
import {
  SPACING,
  RADIUS,
  FONT_SIZES,
  FONT_FAMILY,
  FONT_WEIGHT,
} from "@/constants/tokens";
```

| Token         | Use for              |
| ------------- | -------------------- |
| `SPACING`     | padding, margin, gap |
| `RADIUS`      | borderRadius         |
| `FONT_SIZES`  | fontSize             |
| `FONT_FAMILY` | fontFamily           |
| `FONT_WEIGHT` | fontWeight           |

## Examples

```ts
// ✅ correct
style={{ padding: SPACING.md, borderRadius: RADIUS.lg, fontSize: FONT_SIZES["2xl"] }}

// ❌ wrong
style={{ padding: 12, borderRadius: 14, fontSize: 16 }}
```
