import { createClient } from "@supabase/supabase-js";

const urlSupabase = import.meta.env.VITE_SUPABASE_URL;
const claveSupabase = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// El portal utiliza el JWT de la sesión existente; nunca una clave de servicio.
export function supabaseConSesion(token) {
  if (!urlSupabase || !claveSupabase)
    throw new Error(
      "La conexión de datos del portal no está configurada. Contacta con la agencia.",
    );
  return createClient(urlSupabase, claveSupabase, {
    accessToken: async () => token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
