import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized } from "@/lib/auth";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();

  let role: unknown;
  try {
    const body = await request.json();
    role = body?.role;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (role !== "individual" && role !== "teen") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { role },
  });

  return Response.json({ success: true, role });
}
