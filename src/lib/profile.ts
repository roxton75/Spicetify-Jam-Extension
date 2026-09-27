import { supabase } from "./supabase";
import { getOrCreateSession } from "./auth";

interface SpotifyUser {
  accountId?: string;
  displayName?: string;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
}

export interface PartyProfile {
  id: string;
  spotify_account_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export async function syncProfile(): Promise<PartyProfile> {
  const session = await getOrCreateSession();

  const user = (await Spicetify.Platform.UserAPI.getUser()) as SpotifyUser;

  console.log("[Party DEBUG] Supabase session:", {
    userId: session.user.id,
    spotifyAccountId: user.accountId,
    displayName: user.displayName,
  });

  if (!user.accountId) {
    throw new Error("Spotify account ID was not available.");
  }

  const avatarUrl =
    user.images?.find((image) => image.width === 300)?.url ??
    user.images?.[0]?.url ??
    null;

  const profile = {
    id: session.user.id,
    spotify_account_id: user.accountId,
    display_name: user.displayName ?? null,
    avatar_url: avatarUrl,
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(profile, {
      onConflict: "id",
    })
    .select()
    .single();

  if (error) {
    console.error("[Party] Profile upsert failed:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      profile,
    });

    throw error;
  }

  return data as PartyProfile;
}
