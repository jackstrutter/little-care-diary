import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Cloud, CloudOff, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Sheet } from "./baby-ui";

export function OptionsSheet({ session, syncing, onClose, onImport }: {
  session: Session | null;
  syncing: boolean;
  onClose: () => void;
  onImport: () => void;
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const input = "mt-1 h-14 w-full rounded-2xl bg-muted px-4 text-base";

  const submit = async () => {
    setBusy(true); setMsg("");
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pass })
      : await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) {
      setMsg(res.error.message.includes("Invalid login") ? "Correo o contraseña incorrectos."
        : res.error.message.includes("already registered") ? "Ese correo ya tiene cuenta. Elige “Ya tengo cuenta”."
        : res.error.message.includes("at least") ? "La contraseña necesita al menos 6 caracteres."
        : res.error.message);
      return;
    }
    if (mode === "up" && !res.data.session) setMsg("Te enviamos un correo para confirmar la cuenta. Ábrelo y luego inicia sesión.");
    else { setPass(""); onClose(); }
  };

  const google = async () => {
    setBusy(true); setMsg("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setBusy(false);
    if (r.error) setMsg("No se pudo entrar con Google. Intenta de nuevo.");
  };

  return (
    <Sheet title="Opciones" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl bg-muted/60 p-4">
          <div className="flex items-center gap-2 font-extrabold">
            {session ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
            {session ? "Datos en la nube" : "Solo en este teléfono"}
          </div>
          {session ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Sesión de <span className="font-bold">{session.user.email}</span>. {syncing ? "Sincronizando…" : "Todo sincronizado."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Entra con esta misma cuenta en el otro teléfono para ver y guardar lo mismo.</p>
              <button onClick={() => { void supabase.auth.signOut(); onClose(); }} className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-card font-extrabold shadow-sm active:scale-95">
                <LogOut className="h-5 w-5" /> Cerrar sesión
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Crea una cuenta o inicia sesión para guardar todo en la nube y verlo en los dos teléfonos.</p>
          )}
        </div>

        {!session && (
          <div className="space-y-3">
            <button onClick={google} disabled={busy} className="h-14 w-full rounded-2xl bg-card font-extrabold shadow-sm active:scale-95 disabled:opacity-50">
              Continuar con Google
            </button>
            <p className="text-center text-sm text-muted-foreground">o con tu correo</p>
            <label className="block text-sm font-bold">Correo
              <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-bold">Contraseña
              <input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={pass} onChange={(e) => setPass(e.target.value)} className={input} />
            </label>
            <button onClick={submit} disabled={busy || !email || pass.length < 6} className="h-16 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-50">
              {busy ? "Un momento…" : mode === "in" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
            <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="w-full py-2 text-sm font-bold text-muted-foreground">
              {mode === "in" ? "No tengo cuenta, crear una" : "Ya tengo cuenta"}
            </button>
          </div>
        )}

        {msg && <p className="rounded-2xl bg-muted p-3 text-sm font-bold">{msg}</p>}

        <button onClick={onImport} className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-lg font-extrabold text-secondary-foreground active:scale-95">
          <FileText className="h-5 w-5" /> Cargar historial escrito
        </button>
      </div>
    </Sheet>
  );
}
