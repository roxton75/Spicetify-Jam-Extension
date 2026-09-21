import { supabase } from "./supabase";

export async function getOrCreateSession() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.session) {
    throw new Error("Anonymous authentication did not create a session.");
  }

  return data.session;
}
