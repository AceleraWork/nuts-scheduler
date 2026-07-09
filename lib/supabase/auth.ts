import { supabase } from "@/lib/supabase/client";

// Única cuenta admin de la app: el login muestra "Usuario: Admin" pero por debajo
// Supabase Auth necesita un correo real, nunca expuesto en la pantalla de login.
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "kim@toroteam.com";

export async function signInWithUsername(username: string, password: string) {
  if (username.trim().toLowerCase() !== ADMIN_USERNAME) {
    return { error: "Usuario o contraseña incorrectos." };
  }
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
  if (error) {
    return { error: "Usuario o contraseña incorrectos." };
  }
  return { error: null };
}

export async function signOut() {
  await supabase.auth.signOut();
}
