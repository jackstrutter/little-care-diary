import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HealthRecord =
  | { id: string; t: number; kind: "measure"; kg: number | null; cm: number | null }
  | { id: string; t: number; kind: "appointment"; note: string }
  | { id: string; t: number; kind: "profile"; note: string };

const KEY = "mi-bebe-salud";
type Row = { id: string; happened_at: string; kind: string; weight_kg: number | null; height_cm: number | null; note: string | null };

const toRec = (r: Row): HealthRecord => {
  const t = new Date(r.happened_at).getTime();
  return r.kind === "appointment" || r.kind === "profile"
    ? { id: r.id, t, kind: r.kind, note: r.note ?? "" }
    : { id: r.id, t, kind: "measure", kg: r.weight_kg != null ? Number(r.weight_kg) : null, cm: r.height_cm != null ? Number(r.height_cm) : null };
};

export function useHealth(userId: string | null) {
  const [list, setList] = useState<HealthRecord[]>([]);
  const [error, setError] = useState("");

  const sort = (l: HealthRecord[]) => [...l].sort((a, b) => b.t - a.t);
  const persist = (l: HealthRecord[]) => { localStorage.setItem(KEY, JSON.stringify(l)); return l; };

  const pull = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from("health_records").select("*").order("happened_at", { ascending: false });
    if (!error && data) setList(persist(sort((data as Row[]).map(toRec))));
  }, [userId]);

  useEffect(() => {
    try { setList(sort(JSON.parse(localStorage.getItem(KEY) || "[]"))); } catch { /* vacío */ }
    void pull();
  }, [pull]);

  const add = async (r: HealthRecord) => {
    setError("");
    setList((p) => persist(sort([r, ...p.filter((x) => x.id !== r.id)])));
    if (!userId) return;
    const { error } = await supabase.from("health_records").upsert({
      id: r.id, user_id: userId, kind: r.kind, happened_at: new Date(r.t).toISOString(),
      weight_kg: r.kind === "measure" ? r.kg : null,
      height_cm: r.kind === "measure" ? r.cm : null,
      note: r.kind !== "measure" ? r.note : null,
    });
    if (error) setError("No se pudo guardar en la nube. Intenta de nuevo.");
  };

  const remove = async (id: string) => {
    setList((p) => persist(p.filter((x) => x.id !== id)));
    if (userId) await supabase.from("health_records").delete().eq("id", id);
  };

  return { list, add, remove, error };
}
