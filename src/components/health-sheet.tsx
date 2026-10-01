import { useState } from "react";
import { hora, toInput, uid } from "@/lib/baby";
import { useHealth } from "@/lib/use-health";
import { DelBtn, Sheet, Toggle } from "./baby-ui";

export function HealthSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { list, add, remove, error } = useHealth(userId);
  const [tab, setTab] = useState<"measure" | "appointment">("measure");
  const now = new Date();
  const [date, setDate] = useState(toInput(now));
  const [time, setTime] = useState(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  const [kg, setKg] = useState("");
  const [cm, setCm] = useState("");
  const [note, setNote] = useState("");

  const [yy = 0, mo = 1, dd = 1] = date.split("-").map(Number);
  const [hh = 0, mi = 0] = time.split(":").map(Number);
  const t = new Date(yy, mo - 1, dd, hh, mi).getTime();
  const num = (s: string) => { const n = parseFloat(s.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : null; };

  const input = "mt-1 h-12 w-full rounded-xl bg-muted px-3 text-base";
  const fecha = (x: number) => new Date(x).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
  const shown = list.filter((r) => r.kind === tab);
  const upcoming = tab === "appointment";

  const save = async () => {
    if (tab === "measure") {
      if (!num(kg) && !num(cm)) return;
      await add({ id: uid(), t, kind: "measure", kg: num(kg), cm: num(cm) });
      setKg(""); setCm("");
    } else {
      await add({ id: uid(), t, kind: "appointment", note: note.trim() || "Cita con el pediatra" });
      setNote("");
    }
  };

  return (
    <Sheet title="Peso, talla y citas" onClose={onClose}>
      <Toggle value={tab} onChange={setTab} options={[["measure", "⚖️ Medidas"], ["appointment", "🩺 Citas"]]} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm font-bold">Fecha<input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className={input} /></label>
        <label className="text-sm font-bold">Hora<input type="time" value={time} onChange={(e) => e.target.value && setTime(e.target.value)} className={input} /></label>
        {tab === "measure" ? (
          <>
            <label className="text-sm font-bold">Peso (kg)<input inputMode="decimal" placeholder="4.5" value={kg} onChange={(e) => setKg(e.target.value)} className={input} /></label>
            <label className="text-sm font-bold">Talla (cm)<input inputMode="decimal" placeholder="55" value={cm} onChange={(e) => setCm(e.target.value)} className={input} /></label>
          </>
        ) : (
          <label className="col-span-2 text-sm font-bold">Nota (opcional)<input placeholder="Vacunas, revisión del mes…" value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Puedes elegir una fecha pasada{upcoming ? " o futura" : ""}.</p>

      <button onClick={save} disabled={tab === "measure" && !num(kg) && !num(cm)} className="mt-4 h-16 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-50">
        {tab === "measure" ? "Guardar medida" : "Guardar cita"}
      </button>
      {error && <p className="mt-3 rounded-2xl bg-muted p-3 text-sm font-bold">{error}</p>}

      <p className="mt-5 mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">{tab === "measure" ? "Historial de medidas" : "Citas"}</p>
      {shown.length === 0 ? <p className="rounded-2xl bg-muted/50 p-4 text-center text-muted-foreground">Sin registros.</p> :
        <ul className="space-y-2">{shown.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2">
            <span className="text-xl">{r.kind === "measure" ? "⚖️" : "🩺"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {r.kind === "measure" ? [r.kg != null && `${r.kg} kg`, r.cm != null && `${r.cm} cm`].filter(Boolean).join(" · ") : r.note}
                {r.kind === "appointment" && r.t > Date.now() && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Próxima</span>}
              </p>
              <p className="text-xs text-muted-foreground">{fecha(r.t)} · {hora(r.t)}</p>
            </div>
            <DelBtn onDel={() => void remove(r.id)} />
          </li>))}</ul>}
    </Sheet>
  );
}
