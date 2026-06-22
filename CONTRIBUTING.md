# Design Tokens

## Usage

```ts
import commonTheme from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
```

| Token                    | Use for                    |
| ------------------------ | -------------------------- |
| `useColors`              | Color palette              |
| `commonTheme.space`      | Padding, margin, gap       |
| `commonTheme.rounded`    | Border radius              |
| `commonTheme.fontSize`   | Font size                  |
| `commonTheme.font`       | Font family                |
| `commonTheme.fontWeight` | Font weight                |
| `commonTheme.text`       | Reusable text styles       |
| `commonTheme.layout`     | Reusable layout containers |

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

Using feather for icons in the project
TODO: migrate to lucide icons.

# JWT Key usage

Key is encoded in base64 use it like this

```ts
const jwtKey = Buffer.from(
  process.env.CLERK_JWT_KEY_BASE64!,
  "base64",
).toString("utf-8");
```

# Error handling

Use `ErrorHandler` for handling errors in the project in the frontend. It provides a way to display errors to users. Catch error usig `try-catch` block and pass the error to `ErrorHandler` to display it to users.
**Valid types for `type` prop are `modal` and `text`**

```ts

import { ErrorHandler } from "@/components/ui/ErrorHandler";

<ErrorHandler error={error} type="modal" onClear={() => setError("")} />

```
