# Design Tokens

## Usage

```ts
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
```

| Token | Use for |
| ----- | ------- |
| `useColors` | Color palette |
| `commonTheme.space` | Padding, margin, gap |
| `commonTheme.rounded` | Border radius |
| `commonTheme.fontSize` | Font size |
| `commonTheme.font` | Font family |
| `commonTheme.fontWeight` | Font weight |
| `commonTheme.text` | Reusable text styles |
| `commonTheme.layout` | Reusable layout containers |

## Examples

```ts
// preferred
style={{
  padding: commonTheme.space.md,
  borderRadius: commonTheme.rounded.lg,
  fontSize: commonTheme.fontSize["2xl"],
}}

// wrong
style={{ padding: 12, borderRadius: 14, fontSize: 16 }}
```
