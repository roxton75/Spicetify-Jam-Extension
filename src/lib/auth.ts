import { supabase } from "./supabase";

let sessionPromise: ReturnType<typeof initializeSession> | null = null;

async function initializeSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (session) {
    return session;
  }

  const { data, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError) {
    throw signInError;
  }

  if (!data.session) {
    throw new Error("Anonymous authentication did not create a session.");
  }

  return data.session;
}

export async function getOrCreateSession() {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = initializeSession();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
  }
}
