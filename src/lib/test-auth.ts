import { getOrCreateSession } from "./auth";
import { syncProfile } from "./profile";

export async function testAuth() {
  const session = await getOrCreateSession();

  console.log("[Party] Supabase user ID:", session.user.id);

  const profile = await syncProfile();

  console.log("[Party] Profile synced:", profile);
}
