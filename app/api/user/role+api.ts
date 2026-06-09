import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized } from "../../../lib/auth";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(request: Request) {
  console.log('POST /api/user/role hit')
  
  const clerkId = await verifyAuth(request);
  console.log('clerkId:', clerkId)
  
  if (!clerkId) return unauthorized();

  const { role } = await request.json();

  if (!["individual", "teen"].includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { role },
  });

  return Response.json({ success: true, role });
}
