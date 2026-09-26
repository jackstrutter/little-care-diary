import { useCallback, useEffect, useState } from "react";
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

export function useBabyEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    try { setEntries(sortDesc(JSON.parse(localStorage.getItem(KEY) || "[]"))); } catch { /* sin datos previos */ }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(entries)); }, [entries, ready]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const pull = useCallback(async () => {
    const { data } = await supabase.from("entries").select("*").order("happened_at", { ascending: false });
    if (data) setEntries((data as Row[]).map(toEntry));
  }, []);

  useEffect(() => {
    if (!ready || !userId) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      let local: Entry[] = [];
      try { local = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { /* nada local */ }
      if (local.length) await supabase.from("entries").upsert(local.map((e) => toRow(e, userId)), { onConflict: "id" });
      if (!cancelled) await pull();
      setSyncing(false);
    })();
    const channel = supabase
      .channel("entries-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "entries" }, () => { void pull(); })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [ready, userId, pull]);

  const add = useCallback((e: Entry) => {
    setEntries((p) => sortDesc([e, ...p]));
    if (userId) void supabase.from("entries").insert(toRow(e, userId));
  }, [userId]);

  const addMany = useCallback(async (list: Entry[]) => {
    setEntries((p) => sortDesc([...list, ...p]));
    if (userId && list.length) await supabase.from("entries").upsert(list.map((e) => toRow(e, userId)), { onConflict: "id" });
  }, [userId]);

  const remove = useCallback((id: string) => {
    setEntries((p) => p.filter((x) => x.id !== id));
    if (userId) void supabase.from("entries").delete().eq("id", id);
  }, [userId]);

  return { entries, add, addMany, remove, session, syncing, cloud: !!userId };
}
