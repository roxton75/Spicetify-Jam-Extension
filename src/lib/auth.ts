import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

let sessionPromise: Promise<Session> | null = null;

export function getOrCreateSession(): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = createSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}

async function createSession(): Promise<Session> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (session) {
    return session;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  if (!data.session) throw new Error("Anonymous authentication did not create a session.");

  return data.session;
}
