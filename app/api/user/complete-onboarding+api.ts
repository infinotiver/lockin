import { createClerkClient } from "@clerk/backend";
import { verifyAuth, unauthorized } from "@/lib/auth";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(request: Request) {
  const clerkId = await verifyAuth(request);
  if (!clerkId) return unauthorized();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { onboarded: true },
  });
  return Response.json({ success: true });
}
