import { verifyToken } from "@clerk/backend";

export async function verifyAuth(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    console.log("token present:", !!token);

    if (!token) return null;

    const jwtKey = Buffer.from(
      process.env.CLERK_JWT_KEY_BASE64!,
      "base64",
    ).toString("utf-8");

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      jwtKey,
    });

    console.log("verified userId:", payload.sub);
    return payload.sub;
  } catch (e) {
    console.error("Auth error:", e);
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
