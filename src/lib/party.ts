import { supabase } from "./supabase";

export interface Party {
  party_id: string;
  party_code: string;
}

export interface PartyMember {
  user_id: string;
  role: "host" | "member";
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
  spotify_account_id: string | null;
}

export async function createParty(): Promise<Party> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("No authenticated session.");
  }

  const { data, error } = await supabase.rpc("create_party");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Party creation returned no data.");
  }

  return {
    party_id: data[0].party_id,
    party_code: data[0].party_code,
  };
}

export async function getPartyMembers(partyId: string): Promise<PartyMember[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error("No authenticated session.");
  }

  const { data, error } = await supabase
    .from("party_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      users (
        display_name,
        avatar_url,
        spotify_account_id
      )
    `,
    )
    .eq("party_id", partyId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((member) => {
    const user = Array.isArray(member.users) ? member.users[0] : member.users;

    return {
      user_id: member.user_id,
      role: member.role as "host" | "member",
      joined_at: member.joined_at,
      display_name: user?.display_name ?? null,
      avatar_url: user?.avatar_url ?? null,
      spotify_account_id: user?.spotify_account_id ?? null,
    };
  });
}

export async function touchParty(partyId: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) throw new Error("No authenticated session.");

  const { error } = await supabase.rpc("touch_party", {
    p_party_id: partyId,
  });

  if (error) throw error;
}

export async function endParty(partyId: string): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) throw new Error("No authenticated session.");

  const { error } = await supabase.rpc("end_party", {
    p_party_id: partyId,
  });

  if (error) throw error;
}
