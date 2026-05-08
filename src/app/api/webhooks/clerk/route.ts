import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  try {
    wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = payload.type;

  if (eventType === "user.created") {
    // User sync handled by Clerk userId usage throughout the app
    // No separate users table needed per spec
  }

  return NextResponse.json({ success: true });
}
