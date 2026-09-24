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

let sessionPromise: ReturnType<typeof createSession> | null = null;

async function createSession() {
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

export async function getOrCreateSession() {
  if (!sessionPromise) {
    sessionPromise = createSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}
