import { useMemo, useState } from "react";
import { desc, hora, icon, parseHistory, type Entry } from "@/lib/baby";
import { Sheet } from "./baby-ui";

const EJEMPLO = `Domingo 16/08 - Lunes 17/08
Pañal 1: 6:20pm
Pañal 2: 10:00pm
Pañal 3: 6:00am
Toma 4: 8:30am 4 oz Formula`;

export function ImportSheet({ onClose, onSave }: { onClose: () => void; onSave: (list: Entry[]) => void }) {
  const [text, setText] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState(false);

  const { entries, skipped } = useMemo(() => parseHistory(text, year), [text, year]);

  const fecha = (t: number) => new Date(t).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });

  return (
    <Sheet title="Cargar historial escrito" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        Pega tus notas tal como las tienes. Los registros de la tarde y noche se guardan en el primer día del encabezado, y los de la madrugada y mañana en el segundo.
      </p>

      <label className="mt-4 block text-sm font-bold">Año de esas fechas
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || year)} className="mt-1 h-12 w-32 rounded-xl bg-muted px-3 text-base" />
      </label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={EJEMPLO}
        rows={10}
        className="mt-4 w-full rounded-2xl bg-muted p-3 text-base leading-relaxed"
      />

      {text.trim() && (
        <>
          <p className="mt-4 mb-2 text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
            Se van a guardar {entries.length} registros
          </p>
          {entries.length > 0 && (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                  <span className="text-lg">{icon(e)}</span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold">{desc(e)}</p>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">{fecha(e.t)} {hora(e.t)}</span>
                </li>
              ))}
            </ul>
          )}
          {skipped.length > 0 && (
            <div className="mt-3 rounded-2xl bg-muted/60 p-3">
              <p className="text-sm font-bold">No se entendieron estas líneas:</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">{skipped.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </>
      )}

      <button
        disabled={busy || entries.length === 0}
        onClick={async () => { setBusy(true); await onSave(entries); }}
        className="mt-5 h-16 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Guardando…" : `Guardar ${entries.length} registros`}
      </button>
    </Sheet>
  );
}
