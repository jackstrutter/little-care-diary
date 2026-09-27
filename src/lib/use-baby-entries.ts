import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { KEY, type Entry } from "./baby";

type Row = {
  id: string;
  user_id: string;
  happened_at: string;
  kind: string;
  ml: number | null;
  milk: string | null;
  mins: number | null;
  diaper_type: string | null;
};

const PENDING_KEY = "mi-bebe-pendientes";

const toEntry = (r: Row): Entry => {
  const t = new Date(r.happened_at).getTime();
  if (r.kind === "bottle") return { id: r.id, t, kind: "bottle", ml: r.ml ?? 0, milk: (r.milk === "materna" ? "materna" : "formula") };
  if (r.kind === "breast") return { id: r.id, t, kind: "breast", min: r.mins ?? 0 };
  if (r.kind === "pump") return { id: r.id, t, kind: "pump", ml: r.ml ?? 0 };
  const type = r.diaper_type === "ambos" ? "ambos" : r.diaper_type === "popo" ? "popo" : "pipi";
  return { id: r.id, t, kind: "diaper", type };
};

const toRow = (e: Entry, userId: string) => ({
  id: e.id,
  user_id: userId,
  happened_at: new Date(e.t).toISOString(),
  kind: e.kind,
  ml: e.kind === "bottle" || e.kind === "pump" ? e.ml : null,
  milk: e.kind === "bottle" ? e.milk : null,
  mins: e.kind === "breast" ? e.min : null,
  diaper_type: e.kind === "diaper" ? e.type : null,
});

const sortDesc = (list: Entry[]) => [...list].sort((a, b) => b.t - a.t);

type Pending = { add: Record<string, Entry>; del: string[] };
const loadPending = (): Pending => {
  try { const p = JSON.parse(localStorage.getItem(PENDING_KEY) || ""); if (p?.add && p?.del) return p; } catch { /* vacío */ }
  return { add: {}, del: [] };
};

export function useBabyEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const pending = useRef<Pending>({ add: {}, del: [] });
  const savePending = () => localStorage.setItem(PENDING_KEY, JSON.stringify(pending.current));

  useEffect(() => {
    try { setEntries(sortDesc(JSON.parse(localStorage.getItem(KEY) || "[]"))); } catch { /* sin datos previos */ }
    pending.current = loadPending();
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(entries)); }, [entries, ready]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Envía lo pendiente (altas y bajas que no llegaron a la nube)
  const flush = useCallback(async () => {
    if (!userId) return;
    const p = pending.current;
    const adds = Object.values(p.add);
    if (adds.length) {
      const { error } = await supabase.from("entries").upsert(adds.map((e) => toRow(e, userId)), { onConflict: "id" });
      if (!error) { for (const e of adds) delete p.add[e.id]; savePending(); }
    }
    if (p.del.length) {
      const ids = [...p.del];
      const { error } = await supabase.from("entries").delete().in("id", ids);
      if (!error) { p.del = p.del.filter((x) => !ids.includes(x)); savePending(); }
    }
  }, [userId]);

  const pullSeq = useRef(0);
  const pull = useCallback(async () => {
    const seq = ++pullSeq.current;
    const { data, error } = await supabase.from("entries").select("*").order("happened_at", { ascending: false });
    if (error || !data || seq !== pullSeq.current) return;
    const p = pending.current;
    const server = (data as Row[]).map(toEntry).filter((e) => !p.del.includes(e.id));
    const ids = new Set(server.map((e) => e.id));
    const extra = Object.values(p.add).filter((e) => !ids.has(e.id));
    setEntries(sortDesc([...server, ...extra]));
  }, []);

  const sync = useCallback(async () => { await flush(); await pull(); }, [flush, pull]);

  useEffect(() => {
    if (!ready || !userId) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      let local: Entry[] = [];
      try { local = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* nada local */ }
      for (const e of local) if (!pending.current.del.includes(e.id)) pending.current.add[e.id] = e;
      savePending();
      if (!cancelled) await sync();
      setSyncing(false);
    })();
    const channel = supabase
      .channel(`entries-${userId}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, () => { void pull(); })
      .subscribe();
    // Al volver a la app, reconectar o cada 20 s: actualiza por si el teléfono estaba dormido
    const onWake = () => { if (document.visibilityState === "visible") void sync(); };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    const iv = window.setInterval(onWake, 20000);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      window.clearInterval(iv);
    };
  }, [ready, userId, pull, sync]);

  const add = useCallback((e: Entry) => {
    setEntries((p) => sortDesc([e, ...p.filter((x) => x.id !== e.id)]));
    pending.current.add[e.id] = e; savePending();
    if (userId) void flush();
  }, [userId, flush]);

  const addMany = useCallback(async (list: Entry[]) => {
    const ids = new Set(list.map((e) => e.id));
    setEntries((p) => sortDesc([...list, ...p.filter((x) => !ids.has(x.id))]));
    for (const e of list) pending.current.add[e.id] = e;
    savePending();
    if (userId) await flush();
  }, [userId, flush]);

  const remove = useCallback((id: string) => {
    setEntries((p) => p.filter((x) => x.id !== id));
    delete pending.current.add[id];
    if (userId && !pending.current.del.includes(id)) pending.current.del.push(id);
    savePending();
    if (userId) void flush();
  }, [userId, flush]);

  return { entries, add, addMany, remove, session, syncing, cloud: !!userId };
}
