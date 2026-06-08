import { createClerkClient } from "@clerk/backend";

// This creates a Clerk client that can verify tokens server-side
// It uses your secret key which never leaves the server
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function verifyAuth(request: Request) {
  // Every request from the app sends the token in the Authorization header
  // It looks like: "Bearer eyJhbGci..."
  // We strip the "Bearer " part to get just the token
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    // Ask Clerk: is this token valid?
    // If yes, it returns the token's payload including `sub` which is the Clerk user ID
    const { sub } = await clerk.verifyToken(token);
    return sub;
  } catch {
    // Token is invalid, expired, or tampered with
    return null;
  }
}

// These are just helper functions to return consistent error responses
export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
