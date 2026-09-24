// import { supabase } from "./supabase";

// export async function getOrCreateSession() {
//   const {
//     data: { session },
//     error: sessionError,
//   } = await supabase.auth.getSession();

//   if (sessionError) {
//     throw sessionError;
//   }

//   if (session) {
//     return session;
//   }

//   const { data, error } = await supabase.auth.signInAnonymously();

//   if (error) {
//     throw error;
//   }

//   if (!data.session) {
//     throw new Error("Anonymous authentication did not create a session.");
//   }

//   return data.session;
// }
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
